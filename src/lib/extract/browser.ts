import type { Browser } from "puppeteer-core";
import puppeteer from "puppeteer-core";
import { COLLECTOR_SCRIPT } from "./collector";
import type { RawStyles } from "../types";

const LOCAL_CHROME_PATHS = [
  process.env.CHROME_PATH,
  "/opt/anyone-system/bin/chromium",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
  "/usr/bin/google-chrome",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
].filter(Boolean) as string[];

async function launch(): Promise<Browser> {
  const fs = await import("node:fs");
  const local = LOCAL_CHROME_PATHS.find((p) => {
    try { return fs.existsSync(p); } catch { return false; }
  });
  if (local && !process.env.VERCEL) {
    return puppeteer.launch({
      executablePath: local,
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--hide-scrollbars", "--font-render-hinting=none"],
    });
  }
  // Serverless (Vercel / Lambda): use the slim chromium build
  const chromium = (await import("@sparticuz/chromium")).default;
  return puppeteer.launch({
    executablePath: await chromium.executablePath(),
    headless: true,
    args: chromium.args,
  });
}

export function normalizeUrl(input: string): string {
  let u = input.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  const parsed = new URL(u);
  if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Only http(s) URLs are supported");
  const host = parsed.hostname;
  // basic SSRF guard: refuse local / private network targets
  if (
    host === "localhost" || host.endsWith(".local") || host.endsWith(".internal") ||
    /^(127\.|10\.|192\.168\.|169\.254\.|0\.)/.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host) || host === "[::1]"
  ) {
    throw new Error("That address isn't publicly reachable");
  }
  return parsed.toString();
}

export async function renderAndCollect(
  url: string,
  onStep?: (msg: string) => void,
): Promise<{ raw: RawStyles; screenshot: string }> {
  const browser = await launch();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.setUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    );
    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });

    onStep?.("Loading the page");
    // Block heavy media we don't need; keep CSS, fonts, scripts and images (for layout).
    await page.setRequestInterception(true);
    page.on("request", (req) => {
      const t = req.resourceType();
      if (t === "media" || /google-analytics|googletagmanager|doubleclick|hotjar|segment\.io|facebook\.net/.test(req.url())) req.abort().catch(() => {});
      else req.continue().catch(() => {});
    });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
    await Promise.race([
      page.waitForNetworkIdle({ idleTime: 600, timeout: 8000 }).catch(() => {}),
      new Promise((r) => setTimeout(r, 8000)),
    ]);

    onStep?.("Waiting for fonts and lazy content");
    await page.evaluate(async () => {
      try { await Promise.race([(document as Document & { fonts: FontFaceSet }).fonts.ready, new Promise((r) => setTimeout(r, 2500))]); } catch {}
      // scroll a bit to trigger lazy loaded sections, then come back up
      for (let y = 0; y < Math.min(document.body.scrollHeight, 5000); y += 1000) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 80));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 400));
    });

    // Dismiss obvious cookie banners so they don't pollute the palette
    await page.evaluate(() => {
      const words = /^(accept|accept all|allow all|agree|got it|ok|i agree|allow cookies)$/i;
      document.querySelectorAll("button, a").forEach((el) => {
        if (words.test((el as HTMLElement).innerText?.trim() || "")) (el as HTMLElement).click();
      });
    }).catch(() => {});

    onStep?.("Capturing a screenshot");
    const shot = (await page.screenshot({ type: "jpeg", quality: 72, fullPage: false })) as Uint8Array;
    const screenshot = `data:image/jpeg;base64,${Buffer.from(shot).toString("base64")}`;

    onStep?.("Reading computed styles from every element");
    // Freeze animations/transitions: running animations invalidate layout on every
    // read and turn the DOM walk quadratic.
    await page.evaluate(() => {
      const st = document.createElement("style");
      st.textContent = "*,*::before,*::after{animation-play-state:paused!important;transition:none!important;caret-color:transparent!important}";
      document.head.appendChild(st);
      try { document.getAnimations().forEach((a) => a.pause()); } catch {}
      document.querySelectorAll("video").forEach((v) => (v as HTMLVideoElement).pause());
    }).catch(() => {});
    const tc = Date.now();
    const raw = (await page.evaluate(COLLECTOR_SCRIPT)) as RawStyles;
    if (process.env.DEBUG_TIMING) console.error("collect ms", Date.now() - tc);
    return { raw, screenshot };
  } finally {
    // browser.close() can hang for minutes on some sites; give it a moment, then kill.
    await Promise.race([browser.close().catch(() => {}), new Promise((r) => setTimeout(r, 1500))]);
    try { browser.process()?.kill("SIGKILL"); } catch {}
  }
}
