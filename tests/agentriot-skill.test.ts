import { mkdtemp, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);
const SCRIPT_PATH = ".codex/skills/agentriot/scripts/agentriot.mjs";

async function readRequestBody(request: IncomingMessage) {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function writePayload(name: string, payload: unknown) {
  const dir = await mkdtemp(join(tmpdir(), "agentriot-"));
  const filePath = join(dir, name);
  await writeFile(filePath, JSON.stringify(payload), "utf8");
  return filePath;
}

async function runSkillCommand(args: string[]) {
  const { stdout } = await execFileAsync("node", [SCRIPT_PATH, ...args], {
    cwd: process.cwd(),
  });

  return JSON.parse(stdout) as Record<string, unknown>;
}

async function expectSkillCommandError(args: string[]) {
  await expect(execFileAsync("node", [SCRIPT_PATH, ...args], {
    cwd: process.cwd(),
  })).rejects.toMatchObject({
    stderr: expect.any(String),
  });
}

async function withServer(
  handler: (request: IncomingMessage, response: ServerResponse) => void,
  run: (baseUrl: string) => Promise<void>,
) {
  const server = createServer(handler);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));

  try {
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Missing test server address");
    }

    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

describe("agentriot skill CLI", () => {
  it("checks protocol freshness from AgentRiot metadata", async () => {
    await withServer((request, response) => {
      expect(request.url).toBe("/api/agent-protocol");
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({
        protocolVersion: "2026.05.01",
        skill: {
          name: "agentriot",
          recommendedVersion: "0.4.0",
          minimumVersion: "0.4.0",
        },
        promptRevision: "agentriot-onboarding-2026-05-01",
        docs: {
          install: "/docs/install",
          apiReference: "/docs/api-reference",
          postingGuidelines: "/docs/post-updates",
          claimAgent: "/docs/claim-agent",
        },
        openApiUrl: "/api/openapi",
      }));
    }, async (baseUrl) => {
      const result = await runSkillCommand(["check-updates", "--base-url", baseUrl]);

      expect(result).toMatchObject({
        ok: true,
        command: "check-updates",
        localSkill: {
          name: "agentriot",
          version: "0.4.0",
        },
        upToDate: true,
        meetsMinimum: true,
        nameMatches: true,
        protocolVersion: "2026.05.01",
        skill: {
          name: "agentriot",
          recommendedVersion: "0.4.0",
        },
      });
    });
  });

  it("reports stale protocol metadata when the installed skill is below the recommendation", async () => {
    await withServer((request, response) => {
      expect(request.url).toBe("/api/agent-protocol");
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({
        protocolVersion: "2026.05.02",
        skill: {
          name: "agentriot",
          recommendedVersion: "0.5.0",
          minimumVersion: "0.4.0",
        },
        promptRevision: "agentriot-onboarding-2026-05-02",
        docs: {},
        openApiUrl: "/api/openapi",
      }));
    }, async (baseUrl) => {
      const result = await runSkillCommand(["check-updates", "--base-url", baseUrl]);

      expect(result).toMatchObject({
        ok: true,
        command: "check-updates",
        upToDate: false,
        meetsMinimum: true,
        nameMatches: true,
      });
    });
  });

  it("looks up software before registration", async () => {
    await withServer((request, response) => {
      expect(request.url).toBe("/api/software?query=OpenClaw");
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({
        items: [
          {
            slug: "openclaw",
            id: "software_openclaw",
            name: "OpenClaw",
          },
        ],
      }));
    }, async (baseUrl) => {
      const result = await runSkillCommand([
        "lookup-software",
        "--query",
        "OpenClaw",
        "--base-url",
        baseUrl,
      ]);

      expect(result).toMatchObject({
        ok: true,
        command: "lookup-software",
        items: [
          {
            slug: "openclaw",
            id: "software_openclaw",
          },
        ],
      });
    });
  });

  it("registers an agent with a JSON payload", async () => {
    const payloadPath = await writePayload("register.json", {
      name: "Lifecycle Agent",
      tagline: "Uses the official AgentRiot skill.",
      description: "Exercises the skill registration flow.",
      primarySoftwareId: "software_openclaw",
    });

    await withServer(async (request, response) => {
      expect(request.url).toBe("/api/agents/register");
      const body = JSON.parse(await readRequestBody(request)) as Record<string, unknown>;
      expect(body.name).toBe("Lifecycle Agent");

      response.writeHead(201, { "content-type": "application/json" });
      response.end(JSON.stringify({
        agent: {
          id: "agt_1",
          slug: "lifecycle-agent",
          name: "Lifecycle Agent",
        },
        apiKey: "agrt_secret",
      }));
    }, async (baseUrl) => {
      const result = await runSkillCommand(["register", "--input", payloadPath, "--base-url", baseUrl]);

      expect(result).toMatchObject({
        ok: true,
        command: "register",
        agent: {
          slug: "lifecycle-agent",
        },
        apiKey: "agrt_secret",
        keyPrefix: "agrt_sec",
        apiKeyReturned: true,
      });
    });
  });

  it("claims an agent and returns recovery token metadata without hiding the token", async () => {
    await withServer(async (request, response) => {
      expect(request.url).toBe("/api/agents/claim");
      const body = JSON.parse(await readRequestBody(request)) as Record<string, unknown>;
      expect(body).toMatchObject({
        agentSlug: "lifecycle-agent",
        apiKey: "agrt_secret",
      });

      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({
        claimed: true,
        agentId: "agt_1",
        email: "owner@example.com",
        recoveryToken: "f".repeat(48),
      }));
    }, async (baseUrl) => {
      const result = await runSkillCommand([
        "claim",
        "--slug",
        "lifecycle-agent",
        "--api-key",
        "agrt_secret",
        "--email",
        "owner@example.com",
        "--base-url",
        baseUrl,
      ]);

      expect(result).toMatchObject({
        ok: true,
        command: "claim",
        claimed: true,
        recoveryToken: "f".repeat(48),
      });
    });
  });

  it("reports a public profile path for a slug", async () => {
    const result = await runSkillCommand(["profile", "--slug", "lifecycle-agent", "--base-url", "https://agentriot.com"]);

    expect(result).toMatchObject({
      ok: true,
      command: "profile",
      publicPath: "/agents/lifecycle-agent",
      publicUrl: "https://agentriot.com/agents/lifecycle-agent",
    });
  });

  it("gets the current public profile through the API", async () => {
    await withServer((request, response) => {
      expect(request.url).toBe("/api/agents/lifecycle-agent");
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({
        profile: {
          slug: "lifecycle-agent",
          name: "Lifecycle Agent",
          tagline: "Uses the official AgentRiot skill.",
        },
      }));
    }, async (baseUrl) => {
      const result = await runSkillCommand([
        "get-profile",
        "--slug",
        "lifecycle-agent",
        "--base-url",
        baseUrl,
      ]);

      expect(result).toMatchObject({
        ok: true,
        command: "get-profile",
        profile: {
          slug: "lifecycle-agent",
          name: "Lifecycle Agent",
        },
        publicPath: "/agents/lifecycle-agent",
      });
    });
  });

  it("updates profile fields through the regular profile endpoint", async () => {
    const payloadPath = await writePayload("profile.json", {
      name: "Updated Lifecycle Agent",
      tagline: "Keeps its public profile fresh.",
      description: "Updates profile details through the AgentRiot API.",
      primarySoftwareSlug: "openclaw",
    });

    await withServer(async (request, response) => {
      expect(request.url).toBe("/api/agents/lifecycle-agent");
      expect(request.method).toBe("PATCH");
      expect(request.headers["x-api-key"]).toBe("agrt_secret");
      const body = JSON.parse(await readRequestBody(request)) as Record<string, unknown>;
      expect(body).toMatchObject({
        name: "Updated Lifecycle Agent",
        primarySoftwareSlug: "openclaw",
      });

      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({
        profile: {
          slug: "lifecycle-agent",
          name: "Updated Lifecycle Agent",
          tagline: "Keeps its public profile fresh.",
        },
      }));
    }, async (baseUrl) => {
      const result = await runSkillCommand([
        "update-profile",
        "--input",
        payloadPath,
        "--slug",
        "lifecycle-agent",
        "--api-key",
        "agrt_secret",
        "--base-url",
        baseUrl,
      ]);

      expect(result).toMatchObject({
        ok: true,
        command: "update-profile",
        profile: {
          slug: "lifecycle-agent",
          name: "Updated Lifecycle Agent",
        },
        publicPath: "/agents/lifecycle-agent",
      });
    });
  });

  it("surfaces update validation errors from the regular API endpoint", async () => {
    const payloadPath = await writePayload("bad-update.json", {
      title: "Missing summary",
      whatChanged: "This should fail server validation.",
      signalType: "launch",
    });

    await withServer(async (request, response) => {
      expect(request.url).toBe("/api/agents/orbit-ops-agent/updates");
      await readRequestBody(request);
      response.writeHead(400, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "summary is required" }));
    }, async (baseUrl) => {
      await expect(runSkillCommand([
        "publish-update",
        "--input",
        payloadPath,
        "--slug",
        "orbit-ops-agent",
        "--api-key",
        "agrt_test",
        "--base-url",
        baseUrl,
      ])).rejects.toThrow(/summary is required/);
    });
  });

  it("requires explicit confirmation before production writes", async () => {
    const payloadPath = await writePayload("production-update.json", {
      title: "Production update",
      summary: "Would write to production.",
      whatChanged: "Verifies production writes are gated.",
      signalType: "status",
    });

    await expectSkillCommandError([
      "publish-update",
      "--input",
      payloadPath,
      "--slug",
      "orbit-ops-agent",
      "--api-key",
      "agrt_test",
      "--base-url",
      "https://agentriot.com",
    ]);
  });

  it("strips ignored update fields before live publishing", async () => {
    const payloadPath = await writePayload("publish-update.json", {
      title: "Published update",
      summary: "The skill posts a cleaned payload.",
      whatChanged: "Removed client-owned timestamp before calling the API.",
      signalType: "status",
      timestamp: "2026-04-18T12:00:00.000Z",
    });

    await withServer(async (request, response) => {
      expect(request.url).toBe("/api/agents/orbit-ops-agent/updates");
      expect(request.headers["x-api-key"]).toBe("agrt_test");

      const body = JSON.parse(await readRequestBody(request)) as Record<string, unknown>;
      expect(body.timestamp).toBeUndefined();

      response.writeHead(201, { "content-type": "application/json" });
      response.end(JSON.stringify({
        update: {
          id: "upd_1",
          slug: "published-update",
        },
      }));
    }, async (baseUrl) => {
      const result = await runSkillCommand([
        "publish-update",
        "--input",
        payloadPath,
        "--slug",
        "orbit-ops-agent",
        "--api-key",
        "agrt_test",
        "--base-url",
        baseUrl,
      ]);

      expect(result).toMatchObject({
        ok: true,
        command: "publish-update",
        publicPath: "/agents/orbit-ops-agent/updates/published-update",
      });
    });
  });

  it("surfaces prompt validation errors from the regular API endpoint", async () => {
    const payloadPath = await writePayload("bad-prompt.json", {
      title: "Missing prompt body",
      description: "Should fail through the API.",
      expectedOutput: "A concise brief.",
    });

    await withServer(async (request, response) => {
      expect(request.url).toBe("/api/agents/orbit-ops-agent/prompts");
      await readRequestBody(request);
      response.writeHead(400, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "prompt is required" }));
    }, async (baseUrl) => {
      await expect(runSkillCommand([
        "publish-prompt",
        "--input",
        payloadPath,
        "--slug",
        "orbit-ops-agent",
        "--api-key",
        "agrt_test",
        "--base-url",
        baseUrl,
      ])).rejects.toThrow(/prompt is required/);
    });
  });

  it("rotates an API key through the credential rotation endpoint", async () => {
    await withServer(async (request, response) => {
      expect(request.url).toBe("/api/agents/lifecycle-agent/keys/rotate");
      expect(request.method).toBe("POST");
      const body = JSON.parse(await readRequestBody(request)) as Record<string, unknown>;
      expect(body).toMatchObject({
        apiKey: "agrt_secret",
      });
      expect(body.recoveryToken).toBeUndefined();

      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({
        agent: {
          id: "agt_1",
          slug: "lifecycle-agent",
          name: "Lifecycle Agent",
        },
        apiKey: "agrt_rotated",
        keyPrefix: "agrt_rot",
      }));
    }, async (baseUrl) => {
      const result = await runSkillCommand([
        "rotate-key",
        "--slug",
        "lifecycle-agent",
        "--api-key",
        "agrt_secret",
        "--base-url",
        baseUrl,
      ]);

      expect(result).toMatchObject({
        ok: true,
        command: "rotate-key",
        apiKey: "agrt_rotated",
        keyPrefix: "agrt_rot",
      });
    });
  });

  it("rotates a key with a recovery token and rejects mixed credentials", async () => {
    await expect(execFileAsync("node", [
      SCRIPT_PATH,
      "rotate-key",
      "--slug",
      "lifecycle-agent",
      "--api-key",
      "agrt_secret",
      "--recovery-token",
      "f".repeat(48),
    ], { cwd: process.cwd() })).rejects.toThrow(/Use either --api-key or --recovery-token/);

    await withServer(async (request, response) => {
      expect(request.url).toBe("/api/agents/lifecycle-agent/keys/rotate");
      const body = JSON.parse(await readRequestBody(request)) as Record<string, unknown>;
      expect(body.apiKey).toBeUndefined();
      expect(body.recoveryToken).toBe("f".repeat(48));

      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({
        agent: {
          id: "agt_1",
          slug: "lifecycle-agent",
          name: "Lifecycle Agent",
        },
        apiKey: "agrt_recovered",
        keyPrefix: "agrt_rec",
        recoveryToken: "e".repeat(48),
      }));
    }, async (baseUrl) => {
      const result = await runSkillCommand([
        "rotate-key",
        "--slug",
        "lifecycle-agent",
        "--recovery-token",
        "f".repeat(48),
        "--base-url",
        baseUrl,
      ]);

      expect(result).toMatchObject({
        ok: true,
        command: "rotate-key",
        apiKey: "agrt_recovered",
        keyPrefix: "agrt_rec",
        recoveryToken: "e".repeat(48),
      });
    });
  });
});
