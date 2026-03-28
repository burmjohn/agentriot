import type { contentKindEnum, contentSubtypeEnum, taxonomyKindEnum, taxonomyScopeEnum } from "@/db/schema";

type ContentKind = (typeof contentKindEnum.enumValues)[number];
type ContentSubtype = (typeof contentSubtypeEnum.enumValues)[number];
type TaxonomyScope = (typeof taxonomyScopeEnum.enumValues)[number];
type TaxonomyKind = (typeof taxonomyKindEnum.enumValues)[number];

export const seedData = {
  taxonomy: [
    {
      key: "content-agents",
      scope: "content",
      kind: "category",
      label: "Coding Agents",
      slug: "coding-agents",
      description: "Coverage focused on repo-aware and coding-specific agents.",
    },
    {
      key: "content-workflows",
      scope: "content",
      kind: "tag",
      label: "Workflow Packs",
      slug: "workflow-packs",
      description: "Connected prompts, guides, and reusable build loops.",
    },
    {
      key: "agent-coding",
      scope: "agent",
      kind: "type",
      label: "Coding Agent",
      slug: "coding-agent",
      description: "Agents primarily used inside repositories and coding workflows.",
    },
    {
      key: "agent-research",
      scope: "agent",
      kind: "tag",
      label: "Research",
      slug: "research",
      description: "Agents suited for exploration-heavy work.",
    },
    {
      key: "prompt-evals",
      scope: "prompt",
      kind: "category",
      label: "Evaluation",
      slug: "evaluation",
      description: "Prompts used to inspect, review, and score output quality.",
    },
    {
      key: "prompt-repo",
      scope: "prompt",
      kind: "tag",
      label: "Repo Context",
      slug: "repo-context",
      description: "Prompts that depend on repository context or file structure.",
    },
    {
      key: "skill-automation",
      scope: "skill",
      kind: "category",
      label: "Automation",
      slug: "automation",
      description: "Reusable automations and workflow chains.",
    },
    {
      key: "skill-news",
      scope: "skill",
      kind: "tag",
      label: "News Harvesting",
      slug: "news-harvesting",
      description: "Skills for gathering and distilling updates.",
    },
  ] satisfies Array<{
    key: string;
    scope: TaxonomyScope;
    kind: TaxonomyKind;
    label: string;
    slug: string;
    description: string;
  }>,
  agents: [
    {
      key: "claude-code",
      title: "Claude Code",
      slug: "claude-code",
      shortDescription: "Repo-aware coding agent with strong day-to-day workflow relevance.",
      longDescription:
        "Claude Code is a coding-focused agent record used here as a canonical example of a repo-aware workflow tool with prompt and tutorial context.",
      websiteUrl: "https://claude.ai/code",
      githubUrl: null,
      pricingNotes: "Commercial product with hosted access.",
    },
    {
      key: "openclaw",
      title: "OpenClaw",
      slug: "openclaw",
      shortDescription: "Open source research and coding agent with strong exploration loops.",
      longDescription:
        "OpenClaw represents the kind of agent people discover across GitHub, newsletters, and X before they need structured context around it.",
      websiteUrl: "https://github.com",
      githubUrl: "https://github.com",
      pricingNotes: "Open source project.",
    },
    {
      key: "paperclip",
      title: "Paperclip",
      slug: "paperclip",
      shortDescription: "Automation-oriented agent for browser and task orchestration.",
      longDescription:
        "Paperclip stands in for browser and workflow automation agents that often need surrounding skills and prompt context to be useful.",
      websiteUrl: "https://github.com",
      githubUrl: "https://github.com",
      pricingNotes: "Community-maintained project.",
    },
  ],
  prompts: [
    {
      key: "repo-evaluator",
      title: "Repository Evaluator",
      slug: "repository-evaluator",
      shortDescription: "Inspect a repo quickly and explain the biggest risks and opportunities.",
      fullDescription: "A prompt for fast repo-level review and triage.",
      promptBody:
        "Inspect this repository and explain the architecture, the obvious risks, and the fastest ways to improve the developer workflow.",
      providerCompatibility: "GPT-5.4, Claude, Gemini",
      variablesSchema: "repo_url, target_outcome, constraints",
      exampleOutput: "Architecture summary, risk list, quick wins, suggested next steps.",
    },
    {
      key: "agent-postmortem",
      title: "Agent Failure Postmortem",
      slug: "agent-failure-postmortem",
      shortDescription: "Turn a failed agent run into a clear postmortem with fixes.",
      fullDescription: "Useful for debugging why a workflow agent failed or drifted.",
      promptBody:
        "Review this failed agent run, identify where the reasoning or tool use went wrong, and propose concrete prompt and workflow fixes.",
      providerCompatibility: "GPT-5.4, Claude",
      variablesSchema: "run_log, expected_outcome",
      exampleOutput: "Failure timeline, root cause, remediation steps.",
    },
    {
      key: "release-distiller",
      title: "Release Note Distiller",
      slug: "release-note-distiller",
      shortDescription: "Compress noisy changelogs into what agentic coders actually need to care about.",
      fullDescription: "Useful for model or framework updates.",
      promptBody:
        "Read these release notes and distill what changed, what broke, and what developers building with agents should update first.",
      providerCompatibility: "Any long-context model",
      variablesSchema: "release_notes, audience",
      exampleOutput: "Top changes, breaking notes, migration checklist.",
    },
  ],
  skills: [
    {
      key: "issue-triage",
      title: "Issue Triage",
      slug: "issue-triage",
      shortDescription: "Sort inbound issues into action buckets quickly.",
      longDescription:
        "A reusable workflow for clustering issues, pulling likely duplicates, and surfacing the next best action.",
      websiteUrl: null,
      githubUrl: null,
    },
    {
      key: "prompt-eval-harness",
      title: "Prompt Eval Harness",
      slug: "prompt-eval-harness",
      shortDescription: "Run a repeatable harness around prompt quality and failure cases.",
      longDescription:
        "A reusable evaluation loop for prompt variants, expected outputs, and failure-mode comparisons.",
      websiteUrl: null,
      githubUrl: null,
    },
    {
      key: "news-harvesting",
      title: "News Harvesting",
      slug: "news-harvesting",
      shortDescription: "Gather repo, model, and community updates into one structured intake queue.",
      longDescription:
        "A workflow for collecting signals from GitHub, release notes, newsletters, and X without drowning in noise.",
      websiteUrl: null,
      githubUrl: null,
    },
    {
      key: "workflow-composition",
      title: "Workflow Composition",
      slug: "workflow-composition",
      shortDescription: "Combine multiple prompts and tools into a repeatable agent loop.",
      longDescription:
        "A workflow skill for chaining prompts, tools, and tutorials into a usable operating pattern.",
      websiteUrl: null,
      githubUrl: null,
    },
  ],
  content: [
    {
      key: "what-changed-weekly",
      kind: "article",
      subtype: "news",
      title: "What Changed This Week in Coding Agents",
      slug: "what-changed-this-week-in-coding-agents",
      excerpt: "A weekly signal post covering the coding-agent changes that matter right now.",
      body: "This sample article anchors the homepage lead-story slot and links into agents, prompts, and skills.",
      heroImageUrl: "https://agentriot.com/og/weekly-coding-agents.png",
      canonicalUrl: "https://agentriot.com/articles/what-changed-this-week-in-coding-agents",
      seoTitle: "Weekly coding-agent signal for agentic coders",
      seoDescription:
        "A weekly signal post covering the coding-agent updates, releases, and repo shifts that matter right now.",
    },
    {
      key: "ai-directories-analysis",
      kind: "article",
      subtype: "analysis",
      title: "Why Most AI Directories Feel Hollow",
      slug: "why-most-ai-directories-feel-hollow",
      excerpt: "A graph-first argument for connected discovery over flat catalogs.",
      body: "This sample analysis article explains why a connected graph is more valuable than a pile of disconnected cards.",
    },
    {
      key: "build-news-pipeline",
      kind: "tutorial",
      subtype: "guide",
      title: "Build an Agent News Pipeline",
      slug: "build-an-agent-news-pipeline",
      excerpt: "A practical guide for turning scattered signals into a usable update loop.",
      body: "This sample tutorial walks through collecting, deduping, and publishing agent-focused updates.",
    },
    {
      key: "prompt-pack-mvps",
      kind: "tutorial",
      subtype: "guide",
      title: "Prompt Packs for Agent MVPs",
      slug: "prompt-packs-for-agent-mvps",
      excerpt: "How to package prompts into reusable evaluation and shipping workflows.",
      body: "This sample tutorial shows how prompts, skills, and agents can form a practical starting workflow.",
    },
  ] satisfies Array<{
    key: string;
    kind: ContentKind;
    subtype: ContentSubtype;
    title: string;
    slug: string;
    excerpt: string;
    body: string;
    heroImageUrl?: string;
    canonicalUrl?: string;
    seoTitle?: string;
    seoDescription?: string;
  }>,
  contentAgentRelations: [
    { contentKey: "what-changed-weekly", agentKey: "claude-code" },
    { contentKey: "what-changed-weekly", agentKey: "openclaw" },
    { contentKey: "build-news-pipeline", agentKey: "paperclip" },
  ],
  contentPromptRelations: [
    { contentKey: "what-changed-weekly", promptKey: "release-distiller" },
    { contentKey: "prompt-pack-mvps", promptKey: "repo-evaluator" },
    { contentKey: "prompt-pack-mvps", promptKey: "agent-postmortem" },
  ],
  contentSkillRelations: [
    { contentKey: "build-news-pipeline", skillKey: "news-harvesting" },
    { contentKey: "prompt-pack-mvps", skillKey: "prompt-eval-harness" },
    { contentKey: "prompt-pack-mvps", skillKey: "workflow-composition" },
  ],
  agentPromptRelations: [
    { agentKey: "claude-code", promptKey: "repo-evaluator" },
    { agentKey: "openclaw", promptKey: "agent-postmortem" },
    { agentKey: "paperclip", promptKey: "release-distiller" },
  ],
  agentSkillRelations: [
    { agentKey: "claude-code", skillKey: "prompt-eval-harness" },
    { agentKey: "openclaw", skillKey: "issue-triage" },
    { agentKey: "paperclip", skillKey: "workflow-composition" },
  ],
  skillPromptRelations: [
    { skillKey: "prompt-eval-harness", promptKey: "agent-postmortem" },
    { skillKey: "news-harvesting", promptKey: "release-distiller" },
    { skillKey: "workflow-composition", promptKey: "repo-evaluator" },
  ],
  taxonomyAssignments: [
    { scope: "content", entityKey: "what-changed-weekly", taxonomyKey: "content-agents" },
    { scope: "content", entityKey: "build-news-pipeline", taxonomyKey: "content-workflows" },
    { scope: "agent", entityKey: "claude-code", taxonomyKey: "agent-coding" },
    { scope: "agent", entityKey: "openclaw", taxonomyKey: "agent-research" },
    { scope: "prompt", entityKey: "repo-evaluator", taxonomyKey: "prompt-repo" },
    { scope: "prompt", entityKey: "agent-postmortem", taxonomyKey: "prompt-evals" },
    { scope: "skill", entityKey: "news-harvesting", taxonomyKey: "skill-news" },
    { scope: "skill", entityKey: "workflow-composition", taxonomyKey: "skill-automation" },
  ] satisfies Array<{
    scope: TaxonomyScope;
    entityKey: string;
    taxonomyKey: string;
  }>,
};
