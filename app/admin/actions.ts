"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import {
  agentTaxonomyTerms,
  agents,
  agentPrompts,
  agentSkills,
  contentAgents,
  contentItems,
  contentRevisions,
  contentPrompts,
  contentSkills,
  contentTaxonomyTerms,
  prompts,
  promptTaxonomyTerms,
  skillPrompts,
  skillTaxonomyTerms,
  skills,
  taxonomyTerms,
} from "@/db/schema";
import {
  ensureUniqueAgentSlug,
  ensureUniqueAgentSlugForUpdate,
  ensureUniqueContentSlug,
  ensureUniqueContentSlugForUpdate,
  ensureUniquePromptSlug,
  ensureUniquePromptSlugForUpdate,
  ensureUniqueSkillSlug,
  ensureUniqueSkillSlugForUpdate,
  ensureUniqueTaxonomySlug,
  ensureUniqueTaxonomySlugForUpdate,
} from "@/lib/admin/cms";
import {
  normalizeAgentInput,
  normalizeContentInput,
  normalizePromptInput,
  normalizeSkillInput,
} from "@/lib/admin/record-input";
import {
  buildContentRestoreValues,
  createContentRevisionSnapshot,
} from "@/lib/admin/content-revisions";
import { syncRedirectForSlugChange } from "@/lib/content/redirects";
import { parseSelectedIds } from "@/lib/admin/relation-selection";
import { normalizeTaxonomyInput } from "@/lib/admin/taxonomy-input";
import { getSession } from "@/lib/auth/server";

export type AdminActionState = {
  error: string | null;
};

async function requireAdminUserId() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return session.user.id;
}

function objectFromFormData(formData: FormData) {
  return Object.fromEntries(formData.entries()) as Record<string, string>;
}

export async function createContentAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const userId = await requireAdminUserId();
    const input = normalizeContentInput(objectFromFormData(formData));
    const slug = await ensureUniqueContentSlug(input.slug, input.kind);

    await db.transaction(async (tx) => {
      const [created] = await tx
        .insert(contentItems)
        .values({
          ...input,
          slug,
          createdById: userId,
          updatedById: userId,
        })
        .returning();

      await createContentRevisionSnapshot({
        database: tx,
        contentItem: created,
        editedById: userId,
      });
    });

    revalidatePath("/admin");
    revalidatePath("/admin/content");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create content.",
    };
  }

  redirect("/admin/content?created=1");
}

export async function createAgentAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const userId = await requireAdminUserId();
    const input = normalizeAgentInput(objectFromFormData(formData));
    const slug = await ensureUniqueAgentSlug(input.slug);

    await db.insert(agents).values({
      ...input,
      slug,
      createdById: userId,
      updatedById: userId,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/agents");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create agent.",
    };
  }

  redirect("/admin/agents?created=1");
}

export async function createPromptAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const userId = await requireAdminUserId();
    const input = normalizePromptInput(objectFromFormData(formData));
    const slug = await ensureUniquePromptSlug(input.slug);

    await db.insert(prompts).values({
      ...input,
      slug,
      createdById: userId,
      updatedById: userId,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/prompts");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create prompt.",
    };
  }

  redirect("/admin/prompts?created=1");
}

export async function createSkillAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const userId = await requireAdminUserId();
    const input = normalizeSkillInput(objectFromFormData(formData));
    const slug = await ensureUniqueSkillSlug(input.slug);

    await db.insert(skills).values({
      ...input,
      slug,
      createdById: userId,
      updatedById: userId,
    });

    revalidatePath("/admin");
    revalidatePath("/admin/skills");
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create skill.",
    };
  }

  redirect("/admin/skills?created=1");
}

export async function createTaxonomyTermAction(
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    await requireAdminUserId();
    const input = normalizeTaxonomyInput(objectFromFormData(formData));
    const slug = await ensureUniqueTaxonomySlug(input.scope, input.kind, input.slug);

    await db.insert(taxonomyTerms).values({
      ...input,
      slug,
    });

    revalidatePath("/admin/taxonomy");
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to create taxonomy term.",
    };
  }

  redirect("/admin/taxonomy?created=1");
}

export async function updateContentAction(
  id: string,
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const userId = await requireAdminUserId();
    const input = normalizeContentInput(objectFromFormData(formData));
    const current = await db.query.contentItems.findFirst({
      where: eq(contentItems.id, id),
    });

    if (!current) {
      return { error: "Content record not found." };
    }

    const slug = await ensureUniqueContentSlugForUpdate(
      input.slug,
      input.kind,
      current.slug,
    );

    await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(contentItems)
        .set({
          ...input,
          slug,
          updatedById: userId,
        })
        .where(eq(contentItems.id, id))
        .returning();

      await createContentRevisionSnapshot({
        database: tx,
        contentItem: updated,
        editedById: userId,
      });

      await syncRedirectForSlugChange({
        database: tx,
        routeType: current.kind,
        previousSlug: current.slug,
        currentSlug: updated.slug,
      });
    });

    revalidatePath("/admin");
    revalidatePath("/admin/content");
    revalidatePath(`/admin/content/${id}`);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to update content.",
    };
  }

  redirect(`/admin/content/${id}?saved=1`);
}

export async function restoreContentRevisionAction(
  contentItemId: string,
  revisionId: string,
): Promise<void> {
  const userId = await requireAdminUserId();
  const current = await db.query.contentItems.findFirst({
    where: eq(contentItems.id, contentItemId),
  });
  const revision = await db.query.contentRevisions.findFirst({
    where: eq(contentRevisions.id, revisionId),
  });

  if (!current || !revision || revision.contentItemId !== contentItemId) {
    redirect(`/admin/content/${contentItemId}?error=revision-not-found`);
  }

  await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(contentItems)
      .set({
        ...buildContentRestoreValues(revision),
        updatedById: userId,
      })
      .where(eq(contentItems.id, contentItemId))
      .returning();

    await createContentRevisionSnapshot({
      database: tx,
      contentItem: updated,
      editedById: userId,
    });

    await syncRedirectForSlugChange({
      database: tx,
      routeType: current.kind,
      previousSlug: current.slug,
      currentSlug: updated.slug,
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/content");
  revalidatePath(`/admin/content/${contentItemId}`);

  redirect(`/admin/content/${contentItemId}?restored=1`);
}

export async function updateAgentAction(
  id: string,
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const userId = await requireAdminUserId();
    const input = normalizeAgentInput(objectFromFormData(formData));
    const current = await db.query.agents.findFirst({
      where: eq(agents.id, id),
    });

    if (!current) {
      return { error: "Agent record not found." };
    }

    const slug = await ensureUniqueAgentSlugForUpdate(input.slug, current.slug);

    await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(agents)
        .set({
          ...input,
          slug,
          updatedById: userId,
        })
        .where(eq(agents.id, id))
        .returning();

      await syncRedirectForSlugChange({
        database: tx,
        routeType: "agent",
        previousSlug: current.slug,
        currentSlug: updated.slug,
      });
    });

    revalidatePath("/admin");
    revalidatePath("/admin/agents");
    revalidatePath(`/admin/agents/${id}`);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to update agent.",
    };
  }

  redirect(`/admin/agents/${id}?saved=1`);
}

export async function updatePromptAction(
  id: string,
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const userId = await requireAdminUserId();
    const input = normalizePromptInput(objectFromFormData(formData));
    const current = await db.query.prompts.findFirst({
      where: eq(prompts.id, id),
    });

    if (!current) {
      return { error: "Prompt record not found." };
    }

    const slug = await ensureUniquePromptSlugForUpdate(input.slug, current.slug);

    await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(prompts)
        .set({
          ...input,
          slug,
          updatedById: userId,
        })
        .where(eq(prompts.id, id))
        .returning();

      await syncRedirectForSlugChange({
        database: tx,
        routeType: "prompt",
        previousSlug: current.slug,
        currentSlug: updated.slug,
      });
    });

    revalidatePath("/admin");
    revalidatePath("/admin/prompts");
    revalidatePath(`/admin/prompts/${id}`);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to update prompt.",
    };
  }

  redirect(`/admin/prompts/${id}?saved=1`);
}

export async function updateSkillAction(
  id: string,
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    const userId = await requireAdminUserId();
    const input = normalizeSkillInput(objectFromFormData(formData));
    const current = await db.query.skills.findFirst({
      where: eq(skills.id, id),
    });

    if (!current) {
      return { error: "Skill record not found." };
    }

    const slug = await ensureUniqueSkillSlugForUpdate(input.slug, current.slug);

    await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(skills)
        .set({
          ...input,
          slug,
          updatedById: userId,
        })
        .where(eq(skills.id, id))
        .returning();

      await syncRedirectForSlugChange({
        database: tx,
        routeType: "skill",
        previousSlug: current.slug,
        currentSlug: updated.slug,
      });
    });

    revalidatePath("/admin");
    revalidatePath("/admin/skills");
    revalidatePath(`/admin/skills/${id}`);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to update skill.",
    };
  }

  redirect(`/admin/skills/${id}?saved=1`);
}

export async function updateTaxonomyTermAction(
  id: string,
  _prevState: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  try {
    await requireAdminUserId();
    const input = normalizeTaxonomyInput(objectFromFormData(formData));
    const current = await db.query.taxonomyTerms.findFirst({
      where: eq(taxonomyTerms.id, id),
    });

    if (!current) {
      return { error: "Taxonomy term not found." };
    }

    const slug = await ensureUniqueTaxonomySlugForUpdate(
      input.scope,
      input.kind,
      input.slug,
      current.slug,
    );

    await db
      .update(taxonomyTerms)
      .set({
        ...input,
        slug,
      })
      .where(eq(taxonomyTerms.id, id));

    revalidatePath("/admin/taxonomy");
    revalidatePath(`/admin/taxonomy/${id}`);
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Unable to update taxonomy term.",
    };
  }

  redirect(`/admin/taxonomy/${id}?saved=1`);
}

async function replaceJoinRows<TTable>(
  deleteBuilder: Promise<unknown>,
  insertValues: TTable[],
  insertTable:
    | typeof contentAgents
    | typeof contentPrompts
    | typeof contentSkills
    | typeof contentTaxonomyTerms
    | typeof agentPrompts
    | typeof agentSkills
    | typeof agentTaxonomyTerms
    | typeof skillPrompts
    | typeof skillTaxonomyTerms
    | typeof promptTaxonomyTerms,
) {
  await deleteBuilder;

  if (insertValues.length > 0) {
    await db.insert(insertTable).values(insertValues as never);
  }
}

export async function updateContentAgentsRelationAction(
  id: string,
  formData: FormData,
) {
  await requireAdminUserId();
  const selectedIds = parseSelectedIds(formData, "relatedIds");

  await replaceJoinRows(
    db.delete(contentAgents).where(eq(contentAgents.contentItemId, id)),
    selectedIds.map((agentId) => ({ contentItemId: id, agentId })),
    contentAgents,
  );

  revalidatePath(`/admin/content/${id}`);
  redirect(`/admin/content/${id}?relations=agents`);
}

export async function updateContentPromptsRelationAction(
  id: string,
  formData: FormData,
) {
  await requireAdminUserId();
  const selectedIds = parseSelectedIds(formData, "relatedIds");

  await replaceJoinRows(
    db.delete(contentPrompts).where(eq(contentPrompts.contentItemId, id)),
    selectedIds.map((promptId) => ({ contentItemId: id, promptId })),
    contentPrompts,
  );

  revalidatePath(`/admin/content/${id}`);
  redirect(`/admin/content/${id}?relations=prompts`);
}

export async function updateContentSkillsRelationAction(
  id: string,
  formData: FormData,
) {
  await requireAdminUserId();
  const selectedIds = parseSelectedIds(formData, "relatedIds");

  await replaceJoinRows(
    db.delete(contentSkills).where(eq(contentSkills.contentItemId, id)),
    selectedIds.map((skillId) => ({ contentItemId: id, skillId })),
    contentSkills,
  );

  revalidatePath(`/admin/content/${id}`);
  redirect(`/admin/content/${id}?relations=skills`);
}

export async function updateContentTaxonomyAction(id: string, formData: FormData) {
  await requireAdminUserId();
  const selectedIds = parseSelectedIds(formData, "relatedIds");

  await replaceJoinRows(
    db
      .delete(contentTaxonomyTerms)
      .where(eq(contentTaxonomyTerms.contentItemId, id)),
    selectedIds.map((taxonomyTermId) => ({ contentItemId: id, taxonomyTermId })),
    contentTaxonomyTerms,
  );

  revalidatePath(`/admin/content/${id}`);
  redirect(`/admin/content/${id}?relations=taxonomy`);
}

export async function updateAgentPromptsRelationAction(
  id: string,
  formData: FormData,
) {
  await requireAdminUserId();
  const selectedIds = parseSelectedIds(formData, "relatedIds");

  await replaceJoinRows(
    db.delete(agentPrompts).where(eq(agentPrompts.agentId, id)),
    selectedIds.map((promptId) => ({ agentId: id, promptId })),
    agentPrompts,
  );

  revalidatePath(`/admin/agents/${id}`);
  redirect(`/admin/agents/${id}?relations=prompts`);
}

export async function updateAgentSkillsRelationAction(
  id: string,
  formData: FormData,
) {
  await requireAdminUserId();
  const selectedIds = parseSelectedIds(formData, "relatedIds");

  await replaceJoinRows(
    db.delete(agentSkills).where(eq(agentSkills.agentId, id)),
    selectedIds.map((skillId) => ({ agentId: id, skillId })),
    agentSkills,
  );

  revalidatePath(`/admin/agents/${id}`);
  redirect(`/admin/agents/${id}?relations=skills`);
}

export async function updateAgentTaxonomyAction(id: string, formData: FormData) {
  await requireAdminUserId();
  const selectedIds = parseSelectedIds(formData, "relatedIds");

  await replaceJoinRows(
    db.delete(agentTaxonomyTerms).where(eq(agentTaxonomyTerms.agentId, id)),
    selectedIds.map((taxonomyTermId) => ({ agentId: id, taxonomyTermId })),
    agentTaxonomyTerms,
  );

  revalidatePath(`/admin/agents/${id}`);
  redirect(`/admin/agents/${id}?relations=taxonomy`);
}

export async function updatePromptAgentsRelationAction(
  id: string,
  formData: FormData,
) {
  await requireAdminUserId();
  const selectedIds = parseSelectedIds(formData, "relatedIds");

  await replaceJoinRows(
    db.delete(agentPrompts).where(eq(agentPrompts.promptId, id)),
    selectedIds.map((agentId) => ({ agentId, promptId: id })),
    agentPrompts,
  );

  revalidatePath(`/admin/prompts/${id}`);
  redirect(`/admin/prompts/${id}?relations=agents`);
}

export async function updatePromptSkillsRelationAction(
  id: string,
  formData: FormData,
) {
  await requireAdminUserId();
  const selectedIds = parseSelectedIds(formData, "relatedIds");

  await replaceJoinRows(
    db.delete(skillPrompts).where(eq(skillPrompts.promptId, id)),
    selectedIds.map((skillId) => ({ skillId, promptId: id })),
    skillPrompts,
  );

  revalidatePath(`/admin/prompts/${id}`);
  redirect(`/admin/prompts/${id}?relations=skills`);
}

export async function updatePromptTaxonomyAction(id: string, formData: FormData) {
  await requireAdminUserId();
  const selectedIds = parseSelectedIds(formData, "relatedIds");

  await replaceJoinRows(
    db.delete(promptTaxonomyTerms).where(eq(promptTaxonomyTerms.promptId, id)),
    selectedIds.map((taxonomyTermId) => ({ promptId: id, taxonomyTermId })),
    promptTaxonomyTerms,
  );

  revalidatePath(`/admin/prompts/${id}`);
  redirect(`/admin/prompts/${id}?relations=taxonomy`);
}

export async function updateSkillAgentsRelationAction(
  id: string,
  formData: FormData,
) {
  await requireAdminUserId();
  const selectedIds = parseSelectedIds(formData, "relatedIds");

  await replaceJoinRows(
    db.delete(agentSkills).where(eq(agentSkills.skillId, id)),
    selectedIds.map((agentId) => ({ agentId, skillId: id })),
    agentSkills,
  );

  revalidatePath(`/admin/skills/${id}`);
  redirect(`/admin/skills/${id}?relations=agents`);
}

export async function updateSkillPromptsRelationAction(
  id: string,
  formData: FormData,
) {
  await requireAdminUserId();
  const selectedIds = parseSelectedIds(formData, "relatedIds");

  await replaceJoinRows(
    db.delete(skillPrompts).where(eq(skillPrompts.skillId, id)),
    selectedIds.map((promptId) => ({ promptId, skillId: id })),
    skillPrompts,
  );

  revalidatePath(`/admin/skills/${id}`);
  redirect(`/admin/skills/${id}?relations=prompts`);
}

export async function updateSkillTaxonomyAction(id: string, formData: FormData) {
  await requireAdminUserId();
  const selectedIds = parseSelectedIds(formData, "relatedIds");

  await replaceJoinRows(
    db.delete(skillTaxonomyTerms).where(eq(skillTaxonomyTerms.skillId, id)),
    selectedIds.map((taxonomyTermId) => ({ skillId: id, taxonomyTermId })),
    skillTaxonomyTerms,
  );

  revalidatePath(`/admin/skills/${id}`);
  redirect(`/admin/skills/${id}?relations=taxonomy`);
}
