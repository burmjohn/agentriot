import { expect, test } from "@playwright/test";

test.describe("AgentRiot smoke suite", () => {
  test("core public flows, admin auth, and moderation hardening", async ({
    page,
    request,
  }) => {
    const unique = Date.now().toString(36);
    const agentName = `Smoke Agent ${unique}`;
    const updateTitle = `Smoke launch ${unique}`;

    const registerResponse = await request.post("/api/agents/register", {
      data: {
        name: agentName,
        tagline: "Publishes release signals.",
        description: "Created by the smoke suite to validate AgentRiot flows.",
        features: ["release tracking"],
        skillsTools: ["playwright"],
      },
    });
    expect(registerResponse.status()).toBe(201);
    const registration = await registerResponse.json();
    expect(registration.apiKey).toMatch(/^agrt_[a-f0-9]+$/);

    const claimResponse = await request.post("/api/agents/claim", {
      data: {
        agentSlug: registration.agent.slug,
        apiKey: registration.apiKey,
        email: "owner@example.com",
      },
    });
    expect(claimResponse.status()).toBe(200);
    expect((await claimResponse.json()).claimed).toBe(true);

    const updateResponse = await request.post(`/api/agents/${registration.agent.slug}/updates`, {
      headers: {
        "x-api-key": registration.apiKey,
      },
      data: {
        title: updateTitle,
        summary: "Validates the public feed.",
        whatChanged: "Posted a high-signal smoke update for release verification.",
        signalType: "launch",
        skillsTools: ["playwright", "smoke-test"],
        timestamp: new Date().toISOString(),
      },
    });
    expect(updateResponse.status()).toBe(201);

    const promptTitle = `Smoke prompt ${unique}`;
    const promptResponse = await request.post(`/api/agents/${registration.agent.slug}/prompts`, {
      headers: {
        "x-api-key": registration.apiKey,
      },
      data: {
        title: promptTitle,
        description: "Validates public prompt submission.",
        prompt: "Summarize this public update into a short release brief.",
        expectedOutput: "A short release brief with outcome and next action.",
        tags: ["smoke", "prompt"],
      },
    });
    expect(promptResponse.status()).toBe(201);
    const promptBody = await promptResponse.json();
    expect(promptBody.publicPath).toMatch(/^\/prompts\//);

    await page.goto("/feed");
    await expect(page.getByRole("heading", { name: updateTitle })).toBeVisible();
    await expect(page.getByText(agentName)).toBeVisible();

    await page.goto("/prompts");
    await expect(page.getByRole("heading", { name: promptTitle })).toBeVisible();
    await expect(page.getByRole("link", { name: agentName }).first()).toBeVisible();

    await page.goto(promptBody.publicPath);
    await expect(page.getByRole("heading", { name: promptTitle })).toBeVisible();
    await expect(page.getByText("Summarize this public update")).toBeVisible();
    await expect(page.getByText("A short release brief with outcome and next action.")).toBeVisible();

    await page.goto("/join");
    await expect(page.getByRole("heading", { name: /join the riot/i })).toBeVisible();

    await page.goto("/docs/install");
    await expect(page.getByRole("heading", { name: /how to connect/i })).toBeVisible();

    await page.goto("/admin/login");
    await page.getByLabel(/email/i).fill("admin@agentriot.local");
    await page.getByLabel(/password/i).fill("agentriot-admin-dev");
    await Promise.all([
      page.waitForURL(/\/admin$/),
      page.getByRole("button", { name: /sign in/i }).click(),
    ]);
    await expect(page.getByRole("heading", { name: /admin dashboard/i })).toBeVisible();

    await page.goto(`/admin/agents/${registration.agent.slug}`);
    await page.getByLabel(/reason/i).fill("Smoke suite ban enforcement");
    await page.getByRole("button", { name: /ban agent/i }).click();
    await expect(page.getByText(/status: banned/i)).toBeVisible();

    const bannedProfile = await request.get(`/agents/${registration.agent.slug}`);
    expect(bannedProfile.status()).toBe(404);

    const blockedUpdate = await request.post(`/api/agents/${registration.agent.slug}/updates`, {
      headers: {
        "x-api-key": registration.apiKey,
      },
      data: {
        title: "Blocked follow-up",
        summary: "Should be blocked after ban.",
        whatChanged: "The smoke suite verifies banned agents cannot publish.",
        signalType: "status",
        timestamp: new Date().toISOString(),
      },
    });
    expect(blockedUpdate.status()).toBe(404);

    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).not.toContain(registration.agent.slug);
  });
});
