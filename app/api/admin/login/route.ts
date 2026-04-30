import { cookies } from "next/headers";

const SESSION_COOKIE = "agentriot_admin_session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    email?: string;
    password?: string;
  } | null;

  const expectedEmail = process.env.AGENTRIOT_ADMIN_EMAIL;
  const expectedPassword = process.env.AGENTRIOT_ADMIN_PASSWORD;
  const sessionSecret = process.env.AGENTRIOT_ADMIN_SESSION_SECRET;

  if (
    !expectedEmail ||
    !expectedPassword ||
    !sessionSecret ||
    body?.email !== expectedEmail ||
    body?.password !== expectedPassword
  ) {
    return Response.json({ error: "Invalid admin credentials." }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionSecret, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return Response.json({ ok: true });
}
