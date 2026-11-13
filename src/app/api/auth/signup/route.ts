import bcrypt from "bcryptjs";
import { z } from "zod";
import { startSession, type User } from "@/lib/server/auth";
import { one } from "@/lib/server/db";
import { clientIp, rateLimit } from "@/lib/server/ratelimit";

const Body = z.object({ name: z.string().trim().min(1).max(80), email: z.string().trim().email().max(200), password: z.string().min(8).max(200) });

export async function POST(req: Request) {
  if (!rateLimit("signup:" + clientIp(req), 10, 3600_000).ok) return Response.json({ error: "Too many attempts. Try later." }, { status: 429 });
  const parsed = Body.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return Response.json({ error: "Enter your name, a valid email and a password of 8+ characters." }, { status: 400 });
  const { name, email, password } = parsed.data;
  const exists = await one("select id from users where email = lower($1)", [email]);
  if (exists) return Response.json({ error: "An account with that email already exists. Log in instead." }, { status: 409 });
  const hash = await bcrypt.hash(password, 10);
  const u = (await one<User>("insert into users (email, name, password_hash) values (lower($1), $2, $3) returning id, email, name, avatar_url", [email, name, hash]))!;
  await startSession(u);
  return Response.json({ ok: true });
}
