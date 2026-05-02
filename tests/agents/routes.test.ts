import { describe, expect, it } from "vitest";

import {
  createAgentProfileRoute,
  createClaimAgentRoute,
  createAgentService,
  createRegisterAgentRoute,
  createMemoryAgentRepository,
} from "@/lib/agents";
import { createRotateAgentKeyRoute } from "@/lib/agents/rotate-key-route";

async function readJson(response: Response) {
  return (await response.json()) as Record<string, unknown>;
}

function createRoutes() {
  const repository = createMemoryAgentRepository();
  const service = createAgentService(repository);

  return {
    repository,
    register: createRegisterAgentRoute(service),
    claim: createClaimAgentRoute(service),
    rotateKey: createRotateAgentKeyRoute(service),
    profile: createAgentProfileRoute(service),
  };
}

describe("agent registration and claim routes", () => {
  it("registration with valid payload returns 201 and a one-time API key", async () => {
    const { register, repository } = createRoutes();

    const response = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Atlas Research Agent",
          tagline: "Tracks launches and major releases.",
          description: "Monitors agent ecosystems and summarizes notable public changes.",
          features: ["timeline summaries", "signal tagging"],
          skillsTools: ["web search", "benchmarking"],
        }),
      }),
    );

    const body = await readJson(response);

    expect(response.status).toBe(201);
    expect(body).toMatchObject({
      agent: {
        slug: "atlas-research-agent",
        name: "Atlas Research Agent",
      },
    });
    expect(body.apiKey).toEqual(expect.stringMatching(/^agrt_[a-f0-9]+$/));
    expect(repository.keys).toHaveLength(1);
    expect(repository.keys[0]?.keyHash).not.toContain(String(body.apiKey));
    expect(repository.keys[0]?.keyPrefix).toBe(String(body.apiKey).slice(0, 8));
  });

  it("registration links known software by slug", async () => {
    const { register, repository } = createRoutes();
    repository.software.push({
      id: "software_openclaw",
      slug: "openclaw",
      name: "OpenClaw",
    });

    const response = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "OpenClaw Agent",
          tagline: "Runs on OpenClaw.",
          description: "Uses a known software directory entry.",
          primarySoftwareSlug: "openclaw",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(repository.agents[0]).toMatchObject({
      primarySoftwareId: "software_openclaw",
      unlistedSoftwareName: null,
    });
  });

  it("registration links known software by id", async () => {
    const { register, repository } = createRoutes();
    repository.software.push({
      id: "software_openclaw",
      slug: "openclaw",
      name: "OpenClaw",
    });

    const response = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "OpenClaw Id Agent",
          tagline: "Runs on OpenClaw.",
          description: "Uses a known software directory entry by id.",
          primarySoftwareId: "software_openclaw",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(repository.agents[0]).toMatchObject({
      primarySoftwareId: "software_openclaw",
      unlistedSoftwareName: null,
    });
  });

  it("registration accepts unlisted software names", async () => {
    const { register, repository } = createRoutes();

    const response = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Custom Runtime Agent",
          tagline: "Runs on a private runtime.",
          description: "Uses software that is not in the public directory yet.",
          softwareName: "Private Operator Runtime",
        }),
      }),
    );

    expect(response.status).toBe(201);
    expect(repository.agents[0]).toMatchObject({
      primarySoftwareId: null,
      unlistedSoftwareName: "Private Operator Runtime",
    });
  });

  it("registration with a duplicate name generates a unique slug", async () => {
    const { register } = createRoutes();
    const payload = {
      name: "Atlas Research Agent",
      tagline: "Tracks launches and major releases.",
      description: "Monitors agent ecosystems and summarizes notable public changes.",
      features: ["timeline summaries"],
      skillsTools: ["web search"],
    };

    await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );

    const secondResponse = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );

    const secondBody = await readJson(secondResponse);

    expect(secondResponse.status).toBe(201);
    expect(secondBody).toMatchObject({
      agent: {
        slug: "atlas-research-agent-2",
      },
    });
  });

  it("registration with a reserved slug is rejected", async () => {
    const { register } = createRoutes();

    const response = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Admin",
          tagline: "Reserved route collision.",
          description: "Should not be allowed to claim a protected slug.",
          features: [],
          skillsTools: [],
        }),
      }),
    );

    const body = await readJson(response);

    expect(response.status).toBe(400);
    expect(body.error).toContain("reserved");
  });

  it("registration rejects overlong profile fields before creating an agent or key", async () => {
    const { register, repository } = createRoutes();

    const response = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Verbose Registration Agent",
          tagline: "x".repeat(121),
          description: "Valid description.",
        }),
      }),
    );

    expect(response.status).toBe(400);
    expect(await readJson(response)).toMatchObject({
      error: expect.stringContaining("tagline"),
    });
    expect(repository.agents).toHaveLength(0);
    expect(repository.keys).toHaveLength(0);
  });

  it("registration rejects null JSON bodies with a 400", async () => {
    const { register, repository } = createRoutes();

    const response = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "null",
      }),
    );

    expect(response.status).toBe(400);
    expect(await readJson(response)).toMatchObject({
      error: expect.stringContaining("JSON object"),
    });
    expect(repository.agents).toHaveLength(0);
  });

  it("profile GET returns public profile JSON", async () => {
    const { register, profile } = createRoutes();
    await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Profile Reader Agent",
          tagline: "Readable public identity.",
          description: "Used to verify public profile API reads.",
          features: ["profile api"],
          skillsTools: ["testing"],
        }),
      }),
    );

    const response = await profile.GET(
      new Request("http://localhost/api/agents/profile-reader-agent"),
      { params: Promise.resolve({ slug: "profile-reader-agent" }) },
    );

    expect(response.status).toBe(200);
    expect(await readJson(response)).toMatchObject({
      profile: {
        slug: "profile-reader-agent",
        name: "Profile Reader Agent",
        tagline: "Readable public identity.",
      },
    });
  });

  it("profile GET hides banned agents", async () => {
    const { register, profile, repository } = createRoutes();
    await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Hidden Profile Agent",
          tagline: "Should not be public.",
          description: "Used to verify banned public profile reads.",
        }),
      }),
    );
    repository.agents[0] = {
      ...repository.agents[0]!,
      status: "banned",
    };

    const response = await profile.GET(
      new Request("http://localhost/api/agents/hidden-profile-agent"),
      { params: Promise.resolve({ slug: "hidden-profile-agent" }) },
    );

    expect(response.status).toBe(404);
  });

  it("profile PATCH updates profile fields with an active API key and preserves slug", async () => {
    const { register, profile, repository } = createRoutes();
    repository.software.push({
      id: "software_openclaw",
      slug: "openclaw",
      name: "OpenClaw",
    });
    const registrationResponse = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Profile Update Agent",
          tagline: "Original tagline.",
          description: "Original profile description.",
        }),
      }),
    );
    const registration = await readJson(registrationResponse);

    const response = await profile.PATCH(
      new Request("http://localhost/api/agents/profile-update-agent", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-api-key": String(registration.apiKey),
        },
        body: JSON.stringify({
          name: "Updated Profile Agent",
          tagline: "Updated tagline.",
          description: "Updated profile description.",
          primarySoftwareSlug: "openclaw",
          features: ["profile updates", "identity"],
          skillsTools: ["OpenClaw", "API"],
          metaTitle: "Updated Profile Agent | AgentRiot",
          metaDescription: "Updated profile metadata.",
        }),
      }),
      { params: Promise.resolve({ slug: "profile-update-agent" }) },
    );

    expect(response.status).toBe(200);
    expect(await readJson(response)).toMatchObject({
      profile: {
        slug: "profile-update-agent",
        name: "Updated Profile Agent",
        tagline: "Updated tagline.",
        description: "Updated profile description.",
        primarySoftware: {
          slug: "openclaw",
        },
      },
    });
    expect(repository.agents[0]).toMatchObject({
      slug: "profile-update-agent",
      name: "Updated Profile Agent",
      primarySoftwareId: "software_openclaw",
      unlistedSoftwareName: null,
      features: ["profile updates", "identity"],
      skillsTools: ["OpenClaw", "API"],
      metaTitle: "Updated Profile Agent | AgentRiot",
      metaDescription: "Updated profile metadata.",
    });
    expect(repository.agents[0]?.updatedAt).toBeInstanceOf(Date);
  });

  it("profile PATCH rejects invalid and revoked API keys", async () => {
    const { register, profile, repository } = createRoutes();
    const registrationResponse = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Protected Profile Agent",
          tagline: "Rejects invalid profile edits.",
          description: "Verifies authenticated profile updates.",
        }),
      }),
    );
    const registration = await readJson(registrationResponse);

    const invalidResponse = await profile.PATCH(
      new Request("http://localhost/api/agents/protected-profile-agent", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-api-key": "agrt_invalid",
        },
        body: JSON.stringify({ tagline: "Should fail." }),
      }),
      { params: Promise.resolve({ slug: "protected-profile-agent" }) },
    );

    expect(invalidResponse.status).toBe(401);

    repository.keys[0] = {
      ...repository.keys[0]!,
      revokedAt: new Date("2026-05-01T00:00:00.000Z"),
      isActive: false,
    };

    const revokedResponse = await profile.PATCH(
      new Request("http://localhost/api/agents/protected-profile-agent", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-api-key": String(registration.apiKey),
        },
        body: JSON.stringify({ tagline: "Should also fail." }),
      }),
      { params: Promise.resolve({ slug: "protected-profile-agent" }) },
    );

    expect(revokedResponse.status).toBe(403);
  });

  it("profile PATCH requires the API key header and ignores a body apiKey", async () => {
    const { register, profile } = createRoutes();
    const registrationResponse = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Header Auth Agent",
          tagline: "Pins header authentication.",
          description: "Verifies profile updates do not accept body credentials.",
        }),
      }),
    );
    const registration = await readJson(registrationResponse);

    const bodyOnlyResponse = await profile.PATCH(
      new Request("http://localhost/api/agents/header-auth-agent", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          apiKey: registration.apiKey,
          tagline: "Should fail without header.",
        }),
      }),
      { params: Promise.resolve({ slug: "header-auth-agent" }) },
    );

    expect(bodyOnlyResponse.status).toBe(400);

    const headerWinsResponse = await profile.PATCH(
      new Request("http://localhost/api/agents/header-auth-agent", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-api-key": String(registration.apiKey),
        },
        body: JSON.stringify({
          apiKey: "agrt_invalid",
          tagline: "Header credential wins.",
        }),
      }),
      { params: Promise.resolve({ slug: "header-auth-agent" }) },
    );

    expect(headerWinsResponse.status).toBe(200);
    expect(await readJson(headerWinsResponse)).toMatchObject({
      profile: {
        tagline: "Header credential wins.",
      },
    });
  });

  it("profile PATCH hides banned agents and leaves stored profile unchanged", async () => {
    const { register, profile, repository } = createRoutes();
    const registrationResponse = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Banned Profile Edit Agent",
          tagline: "Original tagline.",
          description: "Should not be editable while banned.",
        }),
      }),
    );
    const registration = await readJson(registrationResponse);
    repository.agents[0] = {
      ...repository.agents[0]!,
      status: "banned",
    };

    const response = await profile.PATCH(
      new Request("http://localhost/api/agents/banned-profile-edit-agent", {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-api-key": String(registration.apiKey),
        },
        body: JSON.stringify({ tagline: "Should not persist." }),
      }),
      { params: Promise.resolve({ slug: "banned-profile-edit-agent" }) },
    );

    expect(response.status).toBe(404);
    expect(repository.agents[0]).toMatchObject({
      tagline: "Original tagline.",
      status: "banned",
    });
  });

  it("claim with a valid API key succeeds", async () => {
    const { register, claim, repository } = createRoutes();

    const registrationResponse = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Orbit Ops Agent",
          tagline: "Ships production updates.",
          description: "Coordinates releases and status updates for public agent systems.",
          features: ["release tracking"],
          skillsTools: ["deploy automation"],
        }),
      }),
    );
    const registrationBody = await readJson(registrationResponse);

    const response = await claim(
      new Request("http://localhost/api/agents/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentSlug: "orbit-ops-agent",
          apiKey: registrationBody.apiKey,
          email: "owner@example.com",
        }),
      }),
    );

    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body).toMatchObject({
      claimed: true,
      email: "owner@example.com",
    });
    expect(body.recoveryToken).toEqual(expect.stringMatching(/^[a-f0-9]{48}$/));
    expect(repository.claims).toHaveLength(1);
    expect(repository.claims[0]).toMatchObject({
      email: "owner@example.com",
    });
    expect(repository.claims[0]?.claimToken).not.toBe(body.recoveryToken);
    expect(repository.claims[0]?.claimToken).toEqual(expect.stringMatching(/^[a-f0-9]{64}$/));
  });

  it("key recovery requires a token from a claimed agent", async () => {
    const { register, rotateKey } = createRoutes();

    await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Unclaimed Recovery Agent",
          tagline: "Has no owner claim.",
          description: "Should not be recoverable without a claim-issued token.",
          features: [],
          skillsTools: [],
        }),
      }),
    );

    const response = await rotateKey(
      new Request("http://localhost/api/agents/unclaimed-recovery-agent/keys/rotate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recoveryToken: "0".repeat(48),
        }),
      }),
      { params: Promise.resolve({ slug: "unclaimed-recovery-agent" }) },
    );

    expect(response.status).toBe(401);
    expect(await readJson(response)).toMatchObject({
      error: expect.stringContaining("Invalid recovery token"),
    });
  });

  it("current API key rotation works before claim without issuing a recovery token", async () => {
    const { register, rotateKey, repository } = createRoutes();

    const registrationResponse = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Routine Rotation Agent",
          tagline: "Rotates active credentials.",
          description: "Uses the current API key to rotate before ownership claim.",
          features: [],
          skillsTools: [],
        }),
      }),
    );
    const registrationBody = await readJson(registrationResponse);

    const response = await rotateKey(
      new Request("http://localhost/api/agents/routine-rotation-agent/keys/rotate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          apiKey: registrationBody.apiKey,
        }),
      }),
      { params: Promise.resolve({ slug: "routine-rotation-agent" }) },
    );
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body.apiKey).toEqual(expect.stringMatching(/^agrt_[a-f0-9]+$/));
    expect(body.recoveryToken).toBeUndefined();
    expect(repository.keys).toHaveLength(2);
    expect(repository.keys[0]).toMatchObject({
      isActive: false,
      revokedAt: expect.any(Date),
      rotatedAt: expect.any(Date),
    });
    expect(repository.keys[1]).toMatchObject({
      isActive: true,
      revokedAt: null,
    });
  });

  it("recovery token rotation revokes the previous key and token", async () => {
    const { register, claim, rotateKey, repository } = createRoutes();

    const registrationResponse = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Recovered Agent",
          tagline: "Exercises key recovery.",
          description: "Uses a claimed recovery token to rotate lost credentials.",
          features: [],
          skillsTools: [],
        }),
      }),
    );
    const registrationBody = await readJson(registrationResponse);

    const claimResponse = await claim(
      new Request("http://localhost/api/agents/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentSlug: "recovered-agent",
          apiKey: registrationBody.apiKey,
        }),
      }),
    );
    const claimBody = await readJson(claimResponse);

    const response = await rotateKey(
      new Request("http://localhost/api/agents/recovered-agent/keys/rotate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recoveryToken: claimBody.recoveryToken,
        }),
      }),
      { params: Promise.resolve({ slug: "recovered-agent" }) },
    );
    const body = await readJson(response);

    expect(response.status).toBe(200);
    expect(body.apiKey).toEqual(expect.stringMatching(/^agrt_[a-f0-9]+$/));
    expect(body.apiKey).not.toBe(registrationBody.apiKey);
    expect(body.recoveryToken).toEqual(expect.stringMatching(/^[a-f0-9]{48}$/));
    expect(body.recoveryToken).not.toBe(claimBody.recoveryToken);
    expect(repository.keys).toHaveLength(2);
    expect(repository.keys[0]).toMatchObject({
      isActive: false,
      revokedAt: expect.any(Date),
      rotatedAt: expect.any(Date),
    });
    expect(repository.keys[1]).toMatchObject({
      isActive: true,
      revokedAt: null,
    });
    expect(repository.claims[0]?.claimToken).not.toBe(body.recoveryToken);
    expect(repository.claims[0]?.claimToken).not.toBe(claimBody.recoveryToken);
    expect(repository.claims[0]?.claimToken).toEqual(expect.stringMatching(/^[a-f0-9]{64}$/));

    const staleTokenResponse = await rotateKey(
      new Request("http://localhost/api/agents/recovered-agent/keys/rotate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recoveryToken: claimBody.recoveryToken,
        }),
      }),
      { params: Promise.resolve({ slug: "recovered-agent" }) },
    );

    expect(staleTokenResponse.status).toBe(401);
  });

  it("old API keys cannot rotate again after successful rotation", async () => {
    const { register, rotateKey } = createRoutes();

    const registrationResponse = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Retired Key Agent",
          tagline: "Rejects old credentials.",
          description: "Verifies old keys are inactive after rotation.",
          features: [],
          skillsTools: [],
        }),
      }),
    );
    const registrationBody = await readJson(registrationResponse);

    const firstResponse = await rotateKey(
      new Request("http://localhost/api/agents/retired-key-agent/keys/rotate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          apiKey: registrationBody.apiKey,
        }),
      }),
      { params: Promise.resolve({ slug: "retired-key-agent" }) },
    );

    expect(firstResponse.status).toBe(200);

    const secondResponse = await rotateKey(
      new Request("http://localhost/api/agents/retired-key-agent/keys/rotate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          apiKey: registrationBody.apiKey,
        }),
      }),
      { params: Promise.resolve({ slug: "retired-key-agent" }) },
    );

    expect(secondResponse.status).toBe(403);
    expect(await readJson(secondResponse)).toMatchObject({
      error: expect.stringContaining("revoked"),
    });
  });

  it("claim with an invalid API key returns 401", async () => {
    const { claim } = createRoutes();

    const response = await claim(
      new Request("http://localhost/api/agents/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentSlug: "atlas-research-agent",
          apiKey: "agrt_invalid-key",
        }),
      }),
    );

    expect(response.status).toBe(401);
    expect(await readJson(response)).toMatchObject({
      error: expect.stringContaining("Invalid API key"),
    });
  });

  it("claim rejects null JSON bodies with a 400", async () => {
    const { claim } = createRoutes();

    const response = await claim(
      new Request("http://localhost/api/agents/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "null",
      }),
    );

    expect(response.status).toBe(400);
    expect(await readJson(response)).toMatchObject({
      error: expect.stringContaining("JSON object"),
    });
  });

  it("claim with a revoked API key returns 403", async () => {
    const { register, claim, repository } = createRoutes();

    const registrationResponse = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Muted Agent",
          tagline: "Used to verify revoked access.",
          description: "Records claim failures when a key has been revoked.",
          features: [],
          skillsTools: [],
        }),
      }),
    );
    const registrationBody = await readJson(registrationResponse);

    repository.keys[0] = {
      ...repository.keys[0]!,
      revokedAt: new Date("2026-04-19T00:00:00.000Z"),
      isActive: false,
    };

    const response = await claim(
      new Request("http://localhost/api/agents/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentSlug: "muted-agent",
          apiKey: registrationBody.apiKey,
        }),
      }),
    );

    expect(response.status).toBe(403);
    expect(await readJson(response)).toMatchObject({
      error: expect.stringContaining("revoked"),
    });
  });

  it("claim hides banned agents even with a valid active key", async () => {
    const { register, claim, repository } = createRoutes();
    const registrationResponse = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Banned Claim Agent",
          tagline: "Cannot be claimed.",
          description: "Verifies banned agents do not expose ownership operations.",
        }),
      }),
    );
    const registration = await readJson(registrationResponse);
    repository.agents[0] = {
      ...repository.agents[0]!,
      status: "banned",
    };

    const response = await claim(
      new Request("http://localhost/api/agents/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentSlug: "banned-claim-agent",
          apiKey: registration.apiKey,
        }),
      }),
    );

    expect(response.status).toBe(404);
    expect(repository.claims).toHaveLength(0);
  });

  it("key rotation rejects missing, mixed, cross-agent, and banned credentials", async () => {
    const { register, claim, rotateKey, repository } = createRoutes();
    const firstRegistrationResponse = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Rotation Edge Agent",
          tagline: "Exercises credential validation.",
          description: "Used for rotation validation edge cases.",
        }),
      }),
    );
    const firstRegistration = await readJson(firstRegistrationResponse);
    const secondRegistrationResponse = await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Other Rotation Agent",
          tagline: "Owns a separate recovery token.",
          description: "Used to verify recovery token agent binding.",
        }),
      }),
    );
    const secondRegistration = await readJson(secondRegistrationResponse);

    const missingResponse = await rotateKey(
      new Request("http://localhost/api/agents/rotation-edge-agent/keys/rotate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      }),
      { params: Promise.resolve({ slug: "rotation-edge-agent" }) },
    );
    expect(missingResponse.status).toBe(400);

    const claimResponse = await claim(
      new Request("http://localhost/api/agents/claim", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentSlug: "other-rotation-agent",
          apiKey: secondRegistration.apiKey,
        }),
      }),
    );
    const otherClaim = await readJson(claimResponse);

    const mixedResponse = await rotateKey(
      new Request("http://localhost/api/agents/rotation-edge-agent/keys/rotate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          apiKey: firstRegistration.apiKey,
          recoveryToken: otherClaim.recoveryToken,
        }),
      }),
      { params: Promise.resolve({ slug: "rotation-edge-agent" }) },
    );
    expect(mixedResponse.status).toBe(400);

    const crossAgentResponse = await rotateKey(
      new Request("http://localhost/api/agents/rotation-edge-agent/keys/rotate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          recoveryToken: otherClaim.recoveryToken,
        }),
      }),
      { params: Promise.resolve({ slug: "rotation-edge-agent" }) },
    );
    expect(crossAgentResponse.status).toBe(401);

    repository.agents[0] = {
      ...repository.agents[0]!,
      status: "banned",
    };
    const bannedResponse = await rotateKey(
      new Request("http://localhost/api/agents/rotation-edge-agent/keys/rotate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          apiKey: firstRegistration.apiKey,
        }),
      }),
      { params: Promise.resolve({ slug: "rotation-edge-agent" }) },
    );

    expect(bannedResponse.status).toBe(404);
    expect(repository.keys.filter((key) => key.agentId === repository.agents[0]?.id)).toHaveLength(1);
  });

  it("key rotation rejects null JSON bodies with a 400", async () => {
    const { register, rotateKey, repository } = createRoutes();

    await register(
      new Request("http://localhost/api/agents/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: "Null Rotation Agent",
          tagline: "Rejects null payloads.",
          description: "Verifies malformed JSON values do not create keys.",
        }),
      }),
    );

    const response = await rotateKey(
      new Request("http://localhost/api/agents/null-rotation-agent/keys/rotate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "null",
      }),
      { params: Promise.resolve({ slug: "null-rotation-agent" }) },
    );

    expect(response.status).toBe(400);
    expect(await readJson(response)).toMatchObject({
      error: expect.stringContaining("apiKey or recoveryToken"),
    });
    expect(repository.keys).toHaveLength(1);
  });
});
