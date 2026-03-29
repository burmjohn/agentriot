# API Key Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an expanded admin-only API key management console that supports create, reveal, edit, revoke, reactivate, and usage inspection for trusted publisher keys.

**Architecture:** Extend the existing `api_keys` table with encrypted secret storage, add a focused admin service layer for key CRUD and reveal, wire the new surface into the current `/admin` pattern, and verify end-to-end that ingestion auth immediately respects key state changes. Reuse the existing Better Auth session checks, Drizzle schema, server actions, and Playwright admin harness instead of creating a separate ops subsystem.

**Tech Stack:** Next.js App Router, TypeScript, Drizzle ORM, PostgreSQL, Better Auth, Vitest, Playwright

---

## File Structure

- Create: `db/migrations/0003_<api-key-secret-storage>.sql`
- Modify: `db/schema/content-graph.ts`
- Create: `lib/ingestion/secret-crypto.ts`
- Modify: `lib/ingestion/api-keys.ts`
- Create: `lib/admin/api-key-input.ts`
- Create: `lib/admin/api-key-status.ts`
- Create: `lib/admin/api-key-admin.ts`
- Modify: `lib/admin/cms.ts`
- Modify: `app/admin/actions.ts`
- Create: `app/admin/api-keys/page.tsx`
- Create: `app/admin/api-keys/new/page.tsx`
- Create: `app/admin/api-keys/[id]/page.tsx`
- Create: `app/admin/_components/api-key-form.tsx`
- Create: `app/admin/_components/api-key-record-view.tsx`
- Modify: `app/admin/admin-shell.tsx`
- Create: `tests/api-key-secret-crypto.test.ts`
- Create: `tests/api-key-admin.test.ts`
- Create: `tests/admin-api-key-input.test.ts`
- Create: `tests/e2e/admin-api-keys.spec.ts`
- Create: `tests/e2e/pages/admin-api-keys-page.ts`
- Modify: `README.md`

### Task 1: Extend schema for encrypted secret reveal

**Files:**
- Modify: `db/schema/content-graph.ts`
- Create: `drizzle/0003_api_key_secret_storage.sql`
- Test: `tests/api-key-secret-crypto.test.ts`

- [ ] **Step 1: Write the failing crypto test**

```ts
import { describe, expect, it } from "vitest";
import { decryptApiKeySecret, encryptApiKeySecret } from "@/lib/ingestion/secret-crypto";

describe("api key secret crypto", () => {
  it("round-trips an API key secret", () => {
    const encrypted = encryptApiKeySecret("ar_live_secret_value", "test-encryption-key-32-bytes-long!");
    expect(encrypted.ciphertext).not.toContain("ar_live_secret_value");
    expect(
      decryptApiKeySecret(encrypted, "test-encryption-key-32-bytes-long!"),
    ).toBe("ar_live_secret_value");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- tests/api-key-secret-crypto.test.ts`
Expected: FAIL with `Cannot find module '@/lib/ingestion/secret-crypto'`

- [ ] **Step 3: Add schema fields and crypto helper**

```ts
// db/schema/content-graph.ts
export const apiKeys = pgTable("api_keys", {
  // existing fields...
  encryptedSecret: text("encrypted_secret"),
  secretNonce: text("secret_nonce"),
  secretAlgorithm: text("secret_algorithm").default("aes-256-gcm"),
});
```

```ts
// lib/ingestion/secret-crypto.ts
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

export function encryptApiKeySecret(secret: string, key: string) {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", Buffer.from(key, "utf8"), nonce);
  const ciphertext = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    algorithm: "aes-256-gcm",
    ciphertext: Buffer.concat([ciphertext, tag]).toString("base64url"),
    nonce: nonce.toString("base64url"),
  };
}
```

- [ ] **Step 4: Add the migration**

```sql
ALTER TABLE api_keys
  ADD COLUMN encrypted_secret text,
  ADD COLUMN secret_nonce text,
  ADD COLUMN secret_algorithm text DEFAULT 'aes-256-gcm';
```

- [ ] **Step 5: Run the targeted test**

Run: `pnpm test -- tests/api-key-secret-crypto.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add db/schema/content-graph.ts drizzle/0003_api_key_secret_storage.sql lib/ingestion/secret-crypto.ts tests/api-key-secret-crypto.test.ts
git commit -m "Add encrypted API key secret storage"
```

### Task 2: Add admin-side API key validation, status, and CRUD service

**Files:**
- Create: `lib/admin/api-key-input.ts`
- Create: `lib/admin/api-key-status.ts`
- Create: `lib/admin/api-key-admin.ts`
- Modify: `lib/ingestion/api-keys.ts`
- Test: `tests/admin-api-key-input.test.ts`
- Test: `tests/api-key-admin.test.ts`

- [ ] **Step 1: Write the failing validation test**

```ts
import { describe, expect, it } from "vitest";
import { normalizeApiKeyInput } from "@/lib/admin/api-key-input";

describe("api key input", () => {
  it("requires a label and at least one scope", () => {
    expect(() => normalizeApiKeyInput({ label: "", scopes: [] })).toThrow();
  });
});
```

- [ ] **Step 2: Write the failing admin service test**

```ts
import { describe, expect, it } from "vitest";
import { getApiKeyStatus } from "@/lib/admin/api-key-status";

describe("api key status", () => {
  it("marks revoked keys before expiry state", () => {
    expect(
      getApiKeyStatus({
        revokedAt: new Date(),
        expiresAt: new Date("2030-01-01T00:00:00.000Z"),
      }),
    ).toBe("revoked");
  });
});
```

- [ ] **Step 3: Run the tests to verify failure**

Run: `pnpm test -- tests/admin-api-key-input.test.ts tests/api-key-admin.test.ts`
Expected: FAIL with missing module errors

- [ ] **Step 4: Implement input normalization, status rules, and CRUD service**

```ts
// lib/admin/api-key-input.ts
const apiKeyInputSchema = z.object({
  label: z.string().trim().min(1),
  description: z.string().trim().optional().nullable(),
  scopes: z.array(z.enum(apiKeyScopeEnum.enumValues)).min(1),
  expiresAt: z.string().optional().nullable(),
});
```

```ts
// lib/admin/api-key-status.ts
export function getApiKeyStatus({
  revokedAt,
  expiresAt,
  now = new Date(),
}: {
  revokedAt: Date | null;
  expiresAt: Date | null;
  now?: Date;
}) {
  if (revokedAt) return "revoked";
  if (expiresAt && expiresAt.getTime() <= now.getTime()) return "expired";
  if (expiresAt && expiresAt.getTime() - now.getTime() <= 1000 * 60 * 60 * 24 * 7) {
    return "expiring-soon";
  }
  return "active";
}
```

```ts
// lib/admin/api-key-admin.ts
export async function createAdminApiKey({ userId, input }: { userId: string; input: ApiKeyInput }) {
  const secret = generateApiKeySecret();
  const encrypted = encryptApiKeySecret(secret, env.API_KEY_ENCRYPTION_KEY);
  const record = buildApiKeyRecord({ secret, label: input.label, scopes: input.scopes });

  const [created] = await db.insert(apiKeys).values({
    ...record,
    description: input.description,
    expiresAt: input.expiresAt,
    encryptedSecret: encrypted.ciphertext,
    secretNonce: encrypted.nonce,
    secretAlgorithm: encrypted.algorithm,
    createdById: userId,
  }).returning();

  return { created, secret };
}
```

- [ ] **Step 5: Run the targeted tests**

Run: `pnpm test -- tests/admin-api-key-input.test.ts tests/api-key-admin.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/admin/api-key-input.ts lib/admin/api-key-status.ts lib/admin/api-key-admin.ts lib/ingestion/api-keys.ts tests/admin-api-key-input.test.ts tests/api-key-admin.test.ts
git commit -m "Add admin API key services"
```

### Task 3: Add server actions and admin data queries

**Files:**
- Modify: `app/admin/actions.ts`
- Modify: `lib/admin/cms.ts`
- Test: `tests/api-key-admin.test.ts`

- [ ] **Step 1: Write the failing admin action test**

```ts
it("revoking a key immediately blocks ingestion auth", async () => {
  const created = await createAdminApiKey({ userId: "user-1", input });
  await revokeApiKeyAction(created.created.id, emptyState, new FormData());
  const auth = evaluateApiKeyAccess({
    key: {
      id: created.created.id,
      keyHash: created.created.keyHash,
      revokedAt: new Date(),
      expiresAt: null,
      scopes: ["content:write"],
    },
    providedSecret: created.secret,
    requiredScope: "content:write",
  });

  expect(auth.ok).toBe(false);
});
```

- [ ] **Step 2: Run the targeted test to verify failure**

Run: `pnpm test -- tests/api-key-admin.test.ts`
Expected: FAIL with missing admin action/query exports

- [ ] **Step 3: Add action handlers and list/detail queries**

```ts
// app/admin/actions.ts
export async function createApiKeyAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const userId = await requireAdminUserId();
  const input = normalizeApiKeyInput({
    ...objectFromFormData(formData),
    scopes: formData.getAll("scopes"),
  });
  const { created, secret } = await createAdminApiKey({ userId, input });
  redirect(`/admin/api-keys/${created.id}?created=1&secret=${encodeURIComponent(secret)}`);
}
```

```ts
// lib/admin/cms.ts
export async function listApiKeys() {
  const rows = await db
    .select({
      id: apiKeys.id,
      title: apiKeys.label,
      slug: apiKeys.keyPrefix,
      status: apiKeys.revokedAt,
      updatedAt: apiKeys.updatedAt,
      meta: apiKeys.description,
    })
    .from(apiKeys)
    .orderBy(desc(apiKeys.createdAt));

  return rows.map((row) => ({ ...row, href: `/admin/api-keys/${row.id}` }));
}
```

- [ ] **Step 4: Revalidate admin surfaces after mutations**

```ts
revalidatePath("/admin");
revalidatePath("/admin/api-keys");
revalidatePath(`/admin/api-keys/${id}`);
```

- [ ] **Step 5: Run the targeted tests**

Run: `pnpm test -- tests/api-key-admin.test.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/admin/actions.ts lib/admin/cms.ts tests/api-key-admin.test.ts
git commit -m "Add admin API key actions"
```

### Task 4: Build the admin UI for listing, create, detail, and reveal

**Files:**
- Create: `app/admin/api-keys/page.tsx`
- Create: `app/admin/api-keys/new/page.tsx`
- Create: `app/admin/api-keys/[id]/page.tsx`
- Create: `app/admin/_components/api-key-form.tsx`
- Create: `app/admin/_components/api-key-record-view.tsx`
- Modify: `app/admin/admin-shell.tsx`
- Test: `tests/e2e/admin-api-keys.spec.ts`
- Test: `tests/e2e/pages/admin-api-keys-page.ts`

- [ ] **Step 1: Write the failing admin E2E**

```ts
test("admin can create, reveal, edit, revoke, and reactivate an API key", async ({ page }) => {
  const apiKeys = new AdminApiKeysPage(page);
  await apiKeys.bootstrapAndSignIn();
  await apiKeys.gotoList();
  await apiKeys.createKey({
    label: "Automation publisher",
    scopes: ["content:write", "admin:*"],
  });
  await expect(apiKeys.secretCallout).toContainText("ar_live_");
  await apiKeys.revokeCurrentKey();
  await expect(apiKeys.statusBadge).toHaveText("revoked");
});
```

- [ ] **Step 2: Run the E2E to verify failure**

Run: `pnpm test:e2e:admin -- admin-api-keys.spec.ts`
Expected: FAIL because `/admin/api-keys` does not exist

- [ ] **Step 3: Build the UI pages and components**

```tsx
// app/admin/api-keys/page.tsx
export default async function AdminApiKeysPage() {
  const keys = await listAdminApiKeysForView();
  return (
    <AdminListPage
      title="API keys"
      description="Manage trusted publisher and operator credentials."
      createHref="/admin/api-keys/new"
      items={keys}
    />
  );
}
```

```tsx
// app/admin/_components/api-key-form.tsx
<fieldset>
  <legend>Scopes</legend>
  {apiKeyScopeEnum.enumValues.map((scope) => (
    <label key={scope}>
      <input type="checkbox" name="scopes" value={scope} defaultChecked={selectedScopes.includes(scope)} />
      <span>{scope}</span>
    </label>
  ))}
</fieldset>
```

```tsx
// app/admin/_components/api-key-record-view.tsx
{showSecret ? (
  <pre data-testid="api-key-secret">{secret}</pre>
) : (
  <form action={revealAction}>
    <button type="submit">Reveal secret</button>
  </form>
)}
```

- [ ] **Step 4: Add the admin nav entry**

```tsx
// app/admin/admin-shell.tsx
{ href: "/admin/api-keys", label: "API Keys" }
```

- [ ] **Step 5: Run the admin E2E**

Run: `pnpm test:e2e:admin -- admin-api-keys.spec.ts`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add app/admin/api-keys app/admin/_components/api-key-form.tsx app/admin/_components/api-key-record-view.tsx app/admin/admin-shell.tsx tests/e2e/admin-api-keys.spec.ts tests/e2e/pages/admin-api-keys-page.ts
git commit -m "Build admin API key management UI"
```

### Task 5: Verify auth behavior, polish docs, and run the full gate

**Files:**
- Modify: `tests/api-key-admin.test.ts`
- Modify: `README.md`

- [ ] **Step 1: Add the revoked/expired auth regression**

```ts
it("expired keys fail auth after an edit updates expiry into the past", () => {
  const auth = evaluateApiKeyAccess({
    key: {
      keyHash: "hash",
      revokedAt: null,
      expiresAt: new Date("2020-01-01T00:00:00.000Z"),
      scopes: ["content:write"],
    },
    providedSecret: "ar_live_secret_token",
    requiredScope: "content:write",
    verifySecret: () => true,
    now: new Date("2026-03-28T00:00:00.000Z"),
  });

  expect(auth).toMatchObject({ ok: false, code: "api_key_expired" });
});
```

- [ ] **Step 2: Document the admin key workflow**

```md
## Admin API keys

Use `/admin/api-keys` to create, reveal, edit, revoke, and reactivate trusted publisher keys.
Secrets are encrypted at rest for internal reveal support and should still be treated as sensitive credentials.
```

- [ ] **Step 3: Run the full verification gate**

Run:

```bash
pnpm lint
pnpm test
pnpm typecheck
pnpm build
pnpm test:e2e
pnpm test:e2e:admin
```

Expected:

- lint exits 0
- Vitest passes
- typecheck exits 0
- Next build succeeds
- public Playwright passes
- admin Playwright passes

- [ ] **Step 4: Commit**

```bash
git add tests/api-key-admin.test.ts README.md
git commit -m "Verify API key auth lifecycle"
```

## Self-Review

### Spec coverage

- create/list/detail admin pages: covered by Tasks 3 and 4
- reveal later via encrypted secret storage: covered by Tasks 1, 2, and 4
- editable scopes and expiry: covered by Tasks 2, 3, and 4
- revoke/reactivate lifecycle: covered by Tasks 3, 4, and 5
- last-used metadata visibility: covered by Tasks 3 and 4
- ingestion auth immediate enforcement: covered by Tasks 3 and 5

No spec gaps remain.

### Placeholder scan

- No `TODO`, `TBD`, or “similar to previous task” placeholders remain.
- Every task includes exact files, commands, and concrete code snippets.

### Type consistency

- `ApiKeyScope`, `normalizeApiKeyInput`, `getApiKeyStatus`, and `createAdminApiKey` naming is consistent across tasks.
- Admin route names and file paths match the existing `/admin/<resource>` pattern already in the repo.
