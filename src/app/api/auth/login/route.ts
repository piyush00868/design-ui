import bcrypt from "bcryptjs";
import { startSession } from "@/lib/server/auth";
import { one } from "@/lib/server/db";
import { clientIp, rateLimit } from "@/lib/server/ratelimit";

export async function POST(req: Request) {
  if (!rateLimit("login:" + clientIp(req), 20, 900_000).ok) return Response.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  const { email, password } = await req.json().catch(() => ({}));
  if (!email || !password) return Response.json({ error: "Enter your email and password." }, { status: 400 });
  const u = await one<{ id: string; email: string; name: string | null; password_hash: string | null; provider: string }>(
    "select id, email, name, password_hash, provider from users where email = lower($1)", [String(email).trim()]);
  if (!u || !u.password_hash) {
    const hint = u && !u.password_hash ? ` This account uses ${u.provider} sign-in.` : "";
    return Response.json({ error: "Wrong email or password." + hint }, { status: 401 });
  }
  if (!(await bcrypt.compare(String(password), u.password_hash))) return Response.json({ error: "Wrong email or password." }, { status: 401 });
  await startSession(u);
  return Response.json({ ok: true });
}
