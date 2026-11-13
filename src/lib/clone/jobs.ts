import { chatStream, CODE_MODEL, type Msg } from "../ai";
import { analyze } from "../extract/analyze";
import { normalizeUrl, renderAndCollect } from "../extract/browser";
import { extractFromImage } from "../extract/image";
import { structureToText } from "../extract/structure";
import { buildDesignMd } from "../generate/designmd";
import { templateProse, writeProse } from "../generate/prose";
import { one, q } from "../server/db";
import { CLONE_SYSTEM } from "./prompts";

/**
 * Clone jobs run in the background on the server (fire-and-forget) so a user can
 * close the tab and come back. Live progress (+ streaming HTML) is kept in memory
 * and polled by the editor; the final result is persisted to Postgres.
 */
export type Job = {
  projectId: string;
  pageId?: string;
  steps: string[];
  html: string;
  status: "running" | "done" | "error";
  error?: string;
  startedAt: number;
};

const g = globalThis as unknown as { __ddJobs?: Map<string, Job> };
const jobs = (g.__ddJobs ??= new Map());

export const jobKey = (projectId: string, pageId?: string) => `${projectId}:${pageId ?? "home"}`;
export const getJob = (projectId: string, pageId?: string) => jobs.get(jobKey(projectId, pageId));

export function cleanHtml(s: string) {
  let h = s.trim().replace(/^```(?:html)?\s*/i, "").replace(/```\s*$/, "").trim();
  const i = h.search(/<!DOCTYPE html>|<html/i);
  if (i > 0) h = h.slice(i);
  return h;
}

async function streamInto(job: Job, messages: Msg[]) {
  let acc = "";
  let last = 0;
  for await (const chunk of chatStream(messages, { model: CODE_MODEL, maxTokens: 30000 })) {
    acc += chunk;
    if (Date.now() - last > 250) { job.html = acc; last = Date.now(); }
  }
  job.html = cleanHtml(acc);
  return job.html;
}

function buildCloneMessages(designMd: string, outline: string, shots: string[], extra = ""): Msg[] {
  const content: Msg["content"] = [
    { type: "text", text: `# DESIGN.md\n\n${designMd}\n\n# PAGE OUTLINE (top to bottom)\n${outline || "(no outline: rely on the screenshots)"}\n\n${extra}\nThe screenshots follow in order from the top of the page. Recreate the full page now.` },
    ...shots.map((url) => ({ type: "image_url" as const, image_url: { url, detail: "high" as const } })),
  ];
  return [{ role: "system", content: CLONE_SYSTEM }, { role: "user", content }];
}

/** Start cloning a brand-new project (home page). */
export function startProjectClone(projectId: string, input: { url?: string; image?: string; palette?: string[] }) {
  const job: Job = { projectId, steps: [], html: "", status: "running", startedAt: Date.now() };
  jobs.set(jobKey(projectId), job);
  const step = (m: string) => job.steps.push(m);

  (async () => {
    try {
      let designMd: string, screenshot: string, outline = "", shots: string[], sourceUrl: string | null = null;
      let navLinks: unknown[] = [];
      let tokens, favicon: string | null = null, title = "Home";

      if (input.url) {
        sourceUrl = normalizeUrl(input.url);
        step("Opening the site in a real browser");
        const cap = await renderAndCollect(sourceUrl, step, { fullPage: true });
        step(`Measured ${cap.raw.colors.length} colors, ${cap.raw.fonts.length} text styles, ${cap.structure.sections.length} sections`);
        tokens = analyze(cap.raw);
        screenshot = cap.screenshot;
        shots = cap.shots.length ? cap.shots : [cap.screenshot];
        outline = structureToText(cap.structure);
        navLinks = cap.structure.navLinks;
        favicon = cap.raw.meta.favicon;
        title = cap.structure.title || tokens.name;
        designMd = buildDesignMd(tokens, templateProse(tokens), sourceUrl);
        await q(
          `update projects set name = $2, favicon = $3, thumbnail = $4, tokens = $5, design_md = $6, capture = $7, nav_links = $8, updated_at = now() where id = $1`,
          [projectId, tokens.name, favicon, screenshot, JSON.stringify(tokens), designMd, JSON.stringify({ outline }), JSON.stringify(navLinks)],
        );
      } else {
        step("Reading your screenshot with a vision model");
        const r = await extractFromImage(input.image!, input.palette || []);
        tokens = r.tokens;
        screenshot = input.image!;
        shots = [input.image!];
        designMd = buildDesignMd(tokens, r.prose);
        await q(`update projects set name = $2, thumbnail = $3, tokens = $4, design_md = $5, updated_at = now() where id = $1`,
          [projectId, tokens.name, screenshot, JSON.stringify(tokens), designMd]);
      }

      const page = (await one<{ id: string }>(
        `insert into pages (project_id, path, title, source_url, screenshot) values ($1, '/', $2, $3, $4)
         on conflict (project_id, path) do update set screenshot = excluded.screenshot returning id`,
        [projectId, title.slice(0, 120), sourceUrl, screenshot],
      ))!;
      job.pageId = page.id;

      // AI prose for the DESIGN.md runs in parallel with the clone itself
      const prosePromise = input.url
        ? writeProse(tokens, screenshot, sourceUrl ?? undefined).then(({ prose }) => buildDesignMd(tokens, prose, sourceUrl ?? undefined)).catch(() => designMd)
        : Promise.resolve(designMd);

      step("Rebuilding the page section by section");
      const html = await streamInto(job, buildCloneMessages(designMd, outline, shots));
      if (!/<html|<body|<section/i.test(html)) throw new Error("The AI didn't return a page. Try again.");

      step("Saving your project");
      await q(`insert into versions (page_id, html, prompt) values ($1, $2, $3)`, [page.id, html, "Initial clone"]);
      const finalMd = await prosePromise;
      await q(`update projects set status = 'ready', design_md = $2, updated_at = now() where id = $1`, [projectId, finalMd]);
      await q(`insert into messages (project_id, page_id, role, content) values ($1, $2, 'assistant', $3)`, [
        projectId, page.id,
        `Cloned ${sourceUrl ? new URL(sourceUrl).hostname : "your screenshot"}. Ask me to change anything: swap in your brand colors, rewrite copy, add or remove sections. Click a section in the preview to edit just that part.`,
      ]);
      step("Done");
      job.status = "done";
    } catch (e) {
      const msg = friendly((e as Error).message);
      job.status = "error";
      job.error = msg;
      await q(`update projects set status = 'error', error = $2, updated_at = now() where id = $1`, [projectId, msg]).catch(() => {});
    } finally {
      setTimeout(() => jobs.delete(jobKey(projectId)), 10 * 60 * 1000);
    }
  })();
  return job;
}

/** Clone an additional page of an existing project, reusing its design system and header/footer. */
export function startPageClone(projectId: string, pageId: string, url: string, homeHtml: string | null, designMd: string) {
  const job: Job = { projectId, pageId, steps: [], html: "", status: "running", startedAt: Date.now() };
  jobs.set(jobKey(projectId, pageId), job);
  const step = (m: string) => job.steps.push(m);
  (async () => {
    try {
      step(`Opening ${new URL(url).pathname}`);
      const cap = await renderAndCollect(normalizeUrl(url), step, { fullPage: true });
      await q(`update pages set screenshot = $2 where id = $1`, [pageId, cap.screenshot]);
      const shared = homeHtml ? sharedChrome(homeHtml) : "";
      const extra = shared ? `# SHARED HEADER AND FOOTER\nReuse this exact header and footer markup (same site) so pages stay consistent:\n${shared}\n` : "";
      step("Rebuilding this page");
      const html = await streamInto(job, buildCloneMessages(designMd, structureToText(cap.structure), cap.shots.length ? cap.shots : [cap.screenshot], extra));
      await q(`insert into versions (page_id, html, prompt) values ($1, $2, $3)`, [pageId, html, "Initial clone"]);
      await q(`update projects set updated_at = now() where id = $1`, [projectId]);
      step("Done");
      job.status = "done";
    } catch (e) {
      job.status = "error";
      job.error = friendly((e as Error).message);
    } finally {
      setTimeout(() => jobs.delete(jobKey(projectId, pageId)), 10 * 60 * 1000);
    }
  })();
  return job;
}

function sharedChrome(html: string) {
  const header = html.match(/<header[\s\S]*?<\/header>/i)?.[0] ?? "";
  const footer = html.match(/<footer[\s\S]*?<\/footer>/i)?.[0] ?? "";
  return (header + "\n" + footer).slice(0, 12000);
}

function friendly(msg: string) {
  if (/ERR_NAME_NOT_RESOLVED/.test(msg)) return "Couldn't find that website. Check the URL.";
  if (/Timeout|timed out/i.test(msg)) return "The site took too long to load.";
  if (/ERR_CONNECTION|ERR_ADDRESS/.test(msg)) return "Couldn't connect to that website.";
  return msg.slice(0, 300);
}
