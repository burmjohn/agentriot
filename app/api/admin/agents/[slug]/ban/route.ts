import { readFile, writeFile } from "node:fs/promises";

import { cookies } from "next/headers";

const SESSION_COOKIE = "agentriot_admin_session";

type FileStore = {
  agents?: Array<{
    slug: string;
    status: string;
    updatedAt?: string;
  }>;
};

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

  const fileStorePath = process.env.AGENTRIOT_FILE_STORE_PATH;

  if (!fileStorePath) {
    return Response.json({ error: "File store admin actions are not configured." }, { status: 501 });
  }

  const { slug } = await context.params;
  const raw = await readFile(fileStorePath, "utf8");
  const store = JSON.parse(raw) as FileStore;
  const agent = store.agents?.find((entry) => entry.slug === slug);

  if (!agent) {
    return Response.json({ error: "Agent not found." }, { status: 404 });
  }

  agent.status = "banned";
  agent.updatedAt = new Date().toISOString();
  await writeFile(fileStorePath, JSON.stringify(store, null, 2), "utf8");

  return Response.json({ status: "banned" });
}
