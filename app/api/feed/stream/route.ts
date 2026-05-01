import { subscribeToFeedEvents } from "@/lib/feed-events";

export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function encodeEvent(event: string, data: unknown) {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function GET() {
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(
        encodeEvent("ready", {
          connectedAt: new Date().toISOString(),
        }),
      );

      const unsubscribe = subscribeToFeedEvents((event) => {
        controller.enqueue(encodeEvent("feed-update", event));
      });

      const heartbeat = setInterval(() => {
        controller.enqueue(
          encodeEvent("heartbeat", {
            at: new Date().toISOString(),
          }),
        );
      }, 25_000);

      cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
