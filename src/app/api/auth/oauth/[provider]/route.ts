import { cookies } from "next/headers";
import { appOrigin, PROVIDERS, type ProviderId } from "@/lib/server/oauth";

export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const p = PROVIDERS[provider as ProviderId];
  if (!p || !p.id()) return new Response("Provider not configured", { status: 404 });
  const state = crypto.randomUUID();
  const next = new URL(req.url).searchParams.get("next") || "/dashboard";
  const jar = await cookies();
  jar.set("dd_oauth", JSON.stringify({ state, next }), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
  const url = new URL(p.authorize);
  url.searchParams.set("client_id", p.id());
  url.searchParams.set("redirect_uri", `${appOrigin(req)}/api/auth/callback/${provider}`);
  url.searchParams.set("scope", p.scope);
  url.searchParams.set("state", state);
  url.searchParams.set("response_type", "code");
  return Response.redirect(url.toString(), 302);
}
