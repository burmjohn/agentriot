# AgentRiot Platform - Issues & Blockers

## Current Status
- No blockers yet
- Starting Wave 1: Tasks 1-4

## Known Risks
- Task 1 (foundation): Package version verification is critical - must use Context7/web search, not memory
- Task 2 (design system): Font licensing - Manuka/PolySans are proprietary. Need open-source fallbacks (Anton/Oswald/Bebas Neue for display, Space Grotesk/DM Sans for UI, Space Mono/JetBrains Mono for mono)
- Task 3 (schema): DB server at 192.168.0.25 must be accessible for migrations
- Task 4 (SEO): Must implement before feature pages so routes can use shared helpers

## Decisions Made
- Using pnpm for package management
- Monolithic single-app approach (no separate admin frontend)
- Dark-only theme, no light mode toggle
- Agent-first registration, human claim later via API key
