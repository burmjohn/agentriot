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
      description: "Coding agents that understand repositories, tests, and developer workflows.",
    },
    {
      key: "content-workflows",
      scope: "content",
      kind: "tag",
      label: "Workflow Packs",
      slug: "workflow-packs",
      description: "Connected prompts, skills, and guides that form repeatable build loops.",
    },
    {
      key: "agent-coding",
      scope: "agent",
      kind: "type",
      label: "Coding Agent",
      slug: "coding-agent",
      description: "Agents built for repositories, pull requests, tests, and shipping code.",
    },
    {
      key: "agent-research",
      scope: "agent",
      kind: "tag",
      label: "Research",
      slug: "research",
      description: "Agents designed for deep exploration, comparison, and synthesis.",
    },
    {
      key: "prompt-evals",
      scope: "prompt",
      kind: "category",
      label: "Evaluation",
      slug: "evaluation",
      description: "Prompts for reviewing, scoring, and improving agent and model output.",
    },
    {
      key: "prompt-repo",
      scope: "prompt",
      kind: "tag",
      label: "Repo Context",
      slug: "repo-context",
      description: "Prompts that use file structure, diffs, and repository history as context.",
    },
    {
      key: "skill-automation",
      scope: "skill",
      kind: "category",
      label: "Automation",
      slug: "automation",
      description: "Reusable automations and chained workflows for agent-driven work.",
    },
    {
      key: "skill-news",
      scope: "skill",
      kind: "tag",
      label: "News Harvesting",
      slug: "news-harvesting",
      description: "Skills for collecting, filtering, and distilling signal from noise.",
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
        "Claude Code is a repo-aware coding agent from Anthropic. It reads your codebase, runs tests, edits files, and handles day-to-day development tasks with strong context awareness.",
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
        "OpenClaw is an open source research and coding agent built for deep exploration. It excels at reading documentation, comparing approaches, and iterating through complex tasks.",
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
        "Paperclip is a browser and workflow automation agent designed for task orchestration. It connects actions across sites, tools, and APIs into repeatable sequences.",
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
      fullDescription: "Evaluate a repository fast: architecture, risks, and the highest-impact improvements.",
      promptBody:
        "Review this repository and summarize the architecture, the biggest risks, and the fastest ways to improve the developer workflow.",
      providerCompatibility: "GPT-5.4, Claude, Gemini",
      variablesSchema: "repo_url, target_outcome, constraints",
      exampleOutput: "Architecture summary, risk list, quick wins, suggested next steps.",
    },
    {
      key: "agent-postmortem",
      title: "Agent Failure Postmortem",
      slug: "agent-failure-postmortem",
      shortDescription: "Turn a failed agent run into a clear postmortem with fixes.",
      fullDescription: "Debug a failed agent run and produce a clear postmortem with concrete fixes.",
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
      fullDescription: "Turn noisy changelogs into focused updates for developers building with agents.",
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
        "Cluster inbound issues, surface duplicates, and identify the next best action.",
      websiteUrl: null,
      githubUrl: null,
    },
    {
      key: "prompt-eval-harness",
      title: "Prompt Eval Harness",
      slug: "prompt-eval-harness",
      shortDescription: "Run a repeatable harness around prompt quality and failure cases.",
      longDescription:
        "Run structured evaluations across prompt variants, expected outputs, and failure modes.",
      websiteUrl: null,
      githubUrl: null,
    },
    {
      key: "news-harvesting",
      title: "News Harvesting",
      slug: "news-harvesting",
      shortDescription: "Gather repo, model, and community updates into one structured intake queue.",
      longDescription:
        "Collect signals from GitHub, release notes, newsletters, and social feeds without drowning in noise.",
      websiteUrl: null,
      githubUrl: null,
    },
    {
      key: "workflow-composition",
      title: "Workflow Composition",
      slug: "workflow-composition",
      shortDescription: "Combine multiple prompts and tools into a repeatable agent loop.",
      longDescription:
        "Chain prompts, tools, and skills into repeatable operating patterns for agent-driven work.",
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
      excerpt: "A weekly signal post covering the coding-agent releases, updates, and repo shifts that matter right now.",
      body: "Every week, dozens of coding agents, prompts, and skills ship new capabilities. This article cuts through the noise to highlight what actually changed, why it matters, and how to use it.",
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
      body: "Flat directories list tools without context. A graph connects agents to the prompts, skills, and tutorials that make them useful. This is why connected discovery beats endless scrolling through disconnected cards.",
    },
    {
      key: "build-news-pipeline",
      kind: "tutorial",
      subtype: "guide",
      title: "Build an Agent News Pipeline",
      slug: "build-an-agent-news-pipeline",
      excerpt: "A practical guide for turning scattered signals into a usable update loop.",
      body: "Staying current with agent tooling means tracking GitHub releases, model updates, newsletters, and community discussions. This tutorial shows how to build a pipeline that collects, filters, and surfaces the updates you actually need.",
    },
    {
      key: "prompt-pack-mvps",
      kind: "tutorial",
      subtype: "guide",
      title: "Prompt Packs for Agent MVPs",
      slug: "prompt-packs-for-agent-mvps",
      excerpt: "How to package prompts into reusable evaluation and shipping workflows.",
      body: "Building an agent MVP starts with the right prompts. This tutorial walks through packaging prompts into reusable evaluation and shipping workflows that connect agents, skills, and real outcomes.",
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
