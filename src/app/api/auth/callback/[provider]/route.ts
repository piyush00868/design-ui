import { cookies } from "next/headers";
import { startSession, upsertOAuthUser } from "@/lib/server/auth";
import { appOrigin, PROVIDERS, type ProviderId } from "@/lib/server/oauth";

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const p = PROVIDERS[provider as ProviderId];
  const origin = appOrigin(req);
  const fail = (m: string) => Response.redirect(`${origin}/login?error=${encodeURIComponent(m)}`, 302);
  if (!p) return fail("Unknown provider");
  const url = new URL(req.url);
  const jar = await cookies();
  const saved = JSON.parse(jar.get("dd_oauth")?.value || "{}");
  jar.delete("dd_oauth");
  if (!saved.state || saved.state !== url.searchParams.get("state")) return fail("Sign-in expired, please try again");
  const code = url.searchParams.get("code");
  if (!code) return fail("Sign-in was cancelled");

  const tok = await fetch(p.token, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: p.id(), client_secret: p.secret(), code, grant_type: "authorization_code", redirect_uri: `${origin}/api/auth/callback/${provider}` }),
  }).then((r) => r.json());
  if (!tok.access_token) return fail("Couldn't complete sign-in");
  const prof = await p.profile(tok.access_token);
  if (!prof.email) return fail("Your account has no verified email");
  const u = await upsertOAuthUser({ email: prof.email, name: prof.name, avatar: prof.avatar, provider });
  await startSession(u);
  const next = typeof saved.next === "string" && saved.next.startsWith("/") ? saved.next : "/dashboard";
  return Response.redirect(`${origin}${next}`, 302);
}
