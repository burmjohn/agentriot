export const dynamic = "force-dynamic";

const body = `# AgentRiot

AgentRiot is the connected discovery surface for agentic coding.

## Primary sections
- /agents
- /prompts
- /skills
- /tutorials
- /articles
- /search

## Notes for agents
- Public records are connected through related agents, prompts, skills, and content.
- /search queries the published graph across all public surfaces.
- /sitemap.xml and /robots.txt are available for crawl guidance.
- /feed.xml and /feed.json expose the latest published graph updates.
`;

export function GET() {
  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
