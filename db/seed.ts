import { db, dbClient } from "@/db";
import {
  agentPrompts,
  agents,
  agentSkills,
  agentTaxonomyTerms,
  contentAgents,
  contentItems,
  contentPrompts,
  contentSkills,
  contentTaxonomyTerms,
  prompts,
  promptTaxonomyTerms,
  skills,
  skillPrompts,
  skillTaxonomyTerms,
  taxonomyTerms,
} from "@/db/schema";
import { seedData } from "@/db/seed-data";

const publishedStatus = "published" as const;

async function main() {
  await db.transaction(async (tx) => {
    await tx.delete(contentAgents);
    await tx.delete(contentPrompts);
    await tx.delete(contentSkills);
    await tx.delete(agentPrompts);
    await tx.delete(agentSkills);
    await tx.delete(skillPrompts);
    await tx.delete(contentTaxonomyTerms);
    await tx.delete(agentTaxonomyTerms);
    await tx.delete(promptTaxonomyTerms);
    await tx.delete(skillTaxonomyTerms);

    await tx.delete(contentItems);
    await tx.delete(agents);
    await tx.delete(prompts);
    await tx.delete(skills);
    await tx.delete(taxonomyTerms);

    const insertedTaxonomy = await tx
      .insert(taxonomyTerms)
      .values(
        seedData.taxonomy.map((item, index) => ({
          scope: item.scope,
          kind: item.kind,
          label: item.label,
          slug: item.slug,
          description: item.description,
          sortOrder: index,
        })),
      )
      .returning({ id: taxonomyTerms.id, slug: taxonomyTerms.slug });

    const taxonomyIdByKey = new Map(
      seedData.taxonomy.map((item) => [
        item.key,
        insertedTaxonomy.find((row) => row.slug === item.slug)?.id ?? "",
      ]),
    );

    const insertedAgents = await tx
      .insert(agents)
      .values(
        seedData.agents.map((item) => ({
          status: publishedStatus,
          title: item.title,
          slug: item.slug,
          shortDescription: item.shortDescription,
          longDescription: item.longDescription,
          websiteUrl: item.websiteUrl,
          githubUrl: item.githubUrl,
          pricingNotes: item.pricingNotes,
          lastVerifiedAt: new Date(),
        })),
      )
      .returning({ id: agents.id, slug: agents.slug });

    const agentIdByKey = new Map(
      seedData.agents.map((item) => [
        item.key,
        insertedAgents.find((row) => row.slug === item.slug)?.id ?? "",
      ]),
    );

    const insertedPrompts = await tx
      .insert(prompts)
      .values(
        seedData.prompts.map((item) => ({
          status: publishedStatus,
          title: item.title,
          slug: item.slug,
          shortDescription: item.shortDescription,
          fullDescription: item.fullDescription,
          promptBody: item.promptBody,
          providerCompatibility: item.providerCompatibility,
          variablesSchema: item.variablesSchema,
          exampleOutput: item.exampleOutput,
        })),
      )
      .returning({ id: prompts.id, slug: prompts.slug });

    const promptIdByKey = new Map(
      seedData.prompts.map((item) => [
        item.key,
        insertedPrompts.find((row) => row.slug === item.slug)?.id ?? "",
      ]),
    );

    const insertedSkills = await tx
      .insert(skills)
      .values(
        seedData.skills.map((item) => ({
          status: publishedStatus,
          title: item.title,
          slug: item.slug,
          shortDescription: item.shortDescription,
          longDescription: item.longDescription,
          websiteUrl: item.websiteUrl,
          githubUrl: item.githubUrl,
        })),
      )
      .returning({ id: skills.id, slug: skills.slug });

    const skillIdByKey = new Map(
      seedData.skills.map((item) => [
        item.key,
        insertedSkills.find((row) => row.slug === item.slug)?.id ?? "",
      ]),
    );

    const insertedContent = await tx
      .insert(contentItems)
      .values(
        seedData.content.map((item, index) => ({
          kind: item.kind,
          subtype: item.subtype,
          status: publishedStatus,
          title: item.title,
          slug: item.slug,
          excerpt: item.excerpt,
          body: item.body,
          heroImageUrl: item.heroImageUrl ?? null,
          canonicalUrl: item.canonicalUrl ?? null,
          seoTitle: item.seoTitle ?? null,
          seoDescription: item.seoDescription ?? null,
          publishedAt: new Date(Date.now() - index * 60 * 60 * 1000),
        })),
      )
      .returning({ id: contentItems.id, slug: contentItems.slug });

    const contentIdByKey = new Map(
      seedData.content.map((item) => [
        item.key,
        insertedContent.find((row) => row.slug === item.slug)?.id ?? "",
      ]),
    );

    await tx.insert(contentAgents).values(
      seedData.contentAgentRelations.map((item) => ({
        contentItemId: contentIdByKey.get(item.contentKey) ?? "",
        agentId: agentIdByKey.get(item.agentKey) ?? "",
      })),
    );

    await tx.insert(contentPrompts).values(
      seedData.contentPromptRelations.map((item) => ({
        contentItemId: contentIdByKey.get(item.contentKey) ?? "",
        promptId: promptIdByKey.get(item.promptKey) ?? "",
      })),
    );

    await tx.insert(contentSkills).values(
      seedData.contentSkillRelations.map((item) => ({
        contentItemId: contentIdByKey.get(item.contentKey) ?? "",
        skillId: skillIdByKey.get(item.skillKey) ?? "",
      })),
    );

    await tx.insert(agentPrompts).values(
      seedData.agentPromptRelations.map((item) => ({
        agentId: agentIdByKey.get(item.agentKey) ?? "",
        promptId: promptIdByKey.get(item.promptKey) ?? "",
      })),
    );

    await tx.insert(agentSkills).values(
      seedData.agentSkillRelations.map((item) => ({
        agentId: agentIdByKey.get(item.agentKey) ?? "",
        skillId: skillIdByKey.get(item.skillKey) ?? "",
      })),
    );

    await tx.insert(skillPrompts).values(
      seedData.skillPromptRelations.map((item) => ({
        skillId: skillIdByKey.get(item.skillKey) ?? "",
        promptId: promptIdByKey.get(item.promptKey) ?? "",
      })),
    );

    await tx.insert(contentTaxonomyTerms).values(
      seedData.taxonomyAssignments
        .filter((item) => item.scope === "content")
        .map((item) => ({
          contentItemId: contentIdByKey.get(item.entityKey) ?? "",
          taxonomyTermId: taxonomyIdByKey.get(item.taxonomyKey) ?? "",
        })),
    );

    await tx.insert(agentTaxonomyTerms).values(
      seedData.taxonomyAssignments
        .filter((item) => item.scope === "agent")
        .map((item) => ({
          agentId: agentIdByKey.get(item.entityKey) ?? "",
          taxonomyTermId: taxonomyIdByKey.get(item.taxonomyKey) ?? "",
        })),
    );

    await tx.insert(promptTaxonomyTerms).values(
      seedData.taxonomyAssignments
        .filter((item) => item.scope === "prompt")
        .map((item) => ({
          promptId: promptIdByKey.get(item.entityKey) ?? "",
          taxonomyTermId: taxonomyIdByKey.get(item.taxonomyKey) ?? "",
        })),
    );

    await tx.insert(skillTaxonomyTerms).values(
      seedData.taxonomyAssignments
        .filter((item) => item.scope === "skill")
        .map((item) => ({
          skillId: skillIdByKey.get(item.entityKey) ?? "",
          taxonomyTermId: taxonomyIdByKey.get(item.taxonomyKey) ?? "",
        })),
    );
  });

  console.log("Seeded AgentRiot canonical fixture graph.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbClient.end({ timeout: 0 });
  });
