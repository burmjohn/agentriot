import { AGENT_PROTOCOL } from "@/lib/agent-protocol";

export function GET() {
  return Response.json(AGENT_PROTOCOL, { status: 200 });
}
