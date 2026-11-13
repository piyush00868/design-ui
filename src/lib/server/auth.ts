import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { one } from "./db";
import { COOKIE, cookieOpts, signSession, verifySession } from "./session";

export type User = { id: string; email: string; name: string | null; avatar_url: string | null };

export async function currentUser(): Promise<User | null> {
  const s = await verifySession((await cookies()).get(COOKIE)?.value);
  if (!s) return null;
  return one<User>("select id, email, name, avatar_url from users where id = $1", [s.uid]);
}
export async function requireUser(next = "/dashboard"): Promise<User> {
  const u = await currentUser();
  if (!u) redirect(`/login?next=${encodeURIComponent(next)}`);
  return u;
}
export async function startSession(u: { id: string; email: string; name: string | null }) {
  (await cookies()).set(COOKIE, await signSession({ uid: u.id, email: u.email, name: u.name }), cookieOpts);
}

/** Upsert a user that signed in through an OAuth provider. */
export async function upsertOAuthUser(p: { email: string; name: string | null; avatar: string | null; provider: string }) {
  return (await one<User>(
    `insert into users (email, name, avatar_url, provider) values (lower($1), $2, $3, $4)
     on conflict (email) do update set name = coalesce(users.name, excluded.name), avatar_url = coalesce(excluded.avatar_url, users.avatar_url)
     returning id, email, name, avatar_url`,
    [p.email, p.name, p.avatar, p.provider],
  ))!;
}

export const oauthProviders = () => ({
  github: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
  google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
});
