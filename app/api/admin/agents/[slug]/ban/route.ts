import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { createDb } from "@/db";
import { agents } from "@/db/schema";

const SESSION_COOKIE = "agentriot_admin_session";

function isAuthorized(cookieValue?: string) {
  const sessionSecret = process.env.AGENTRIOT_ADMIN_SESSION_SECRET;
  return Boolean(sessionSecret && cookieValue === sessionSecret);
}

export async function POST(
  _request: Request,
  context: {
    params: Promise<{ slug: string }>;
  },
) {
  const cookieStore = await cookies();

  if (!isAuthorized(cookieStore.get(SESSION_COOKIE)?.value)) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { slug } = await context.params;
  const db = createDb();
  const [agent] = await db
    .update(agents)
    .set({
      status: "banned",
      updatedAt: new Date(),
    })
    .where(eq(agents.slug, slug))
    .returning({ slug: agents.slug });

  if (!agent) {
    return Response.json({ error: "Agent not found." }, { status: 404 });
  }

  return Response.json({ status: "banned" });
}
