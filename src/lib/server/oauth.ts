export type ProviderId = "github" | "google";

export const PROVIDERS = {
  github: {
    authorize: "https://github.com/login/oauth/authorize",
    token: "https://github.com/login/oauth/access_token",
    scope: "read:user user:email",
    id: () => process.env.GITHUB_CLIENT_ID!,
    secret: () => process.env.GITHUB_CLIENT_SECRET!,
    async profile(token: string) {
      const h = { Authorization: `Bearer ${token}`, "User-Agent": "DesignDNA" };
      const u = await (await fetch("https://api.github.com/user", { headers: h })).json();
      let email = u.email as string | null;
      if (!email) {
        const emails = (await (await fetch("https://api.github.com/user/emails", { headers: h })).json()) as { email: string; primary: boolean; verified: boolean }[];
        email = emails.find((e) => e.primary && e.verified)?.email ?? emails.find((e) => e.verified)?.email ?? null;
      }
      return { email, name: (u.name || u.login) as string, avatar: u.avatar_url as string };
    },
  },
  google: {
    authorize: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    scope: "openid email profile",
    id: () => process.env.GOOGLE_CLIENT_ID!,
    secret: () => process.env.GOOGLE_CLIENT_SECRET!,
    async profile(token: string) {
      const u = await (await fetch("https://openidconnect.googleapis.com/v1/userinfo", { headers: { Authorization: `Bearer ${token}` } })).json();
      return { email: u.email_verified ? (u.email as string) : null, name: u.name as string, avatar: u.picture as string };
    },
  },
} as const;

export function appOrigin(req: Request) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = req.headers;
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "https";
  return `${proto}://${host}`;
}
