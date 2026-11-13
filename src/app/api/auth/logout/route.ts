import { cookies } from "next/headers";
import { COOKIE } from "@/lib/server/session";

export async function POST(req: Request) {
  (await cookies()).delete(COOKIE);
  return Response.redirect(new URL("/", req.url), 303);
}
