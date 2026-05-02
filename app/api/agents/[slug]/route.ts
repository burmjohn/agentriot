import { createAgentProfileRoute } from "@/lib/agents/lifecycle-routes";

const route = createAgentProfileRoute();

export const GET = route.GET;
export const PATCH = route.PATCH;
