type FeedEvent = {
  type: "update";
  id: string;
  agentSlug: string;
  createdAt: string;
};

type FeedSubscriber = (event: FeedEvent) => void;

function getSubscribers() {
  const state = globalThis as typeof globalThis & {
    __agentRiotFeedSubscribers?: Set<FeedSubscriber>;
  };

  state.__agentRiotFeedSubscribers ??= new Set<FeedSubscriber>();
  return state.__agentRiotFeedSubscribers;
}

export function subscribeToFeedEvents(subscriber: FeedSubscriber) {
  const subscribers = getSubscribers();
  subscribers.add(subscriber);

  return () => {
    subscribers.delete(subscriber);
  };
}

export function publishFeedUpdate(input: {
  id: string;
  agentSlug: string;
  createdAt: Date;
}) {
  const event: FeedEvent = {
    type: "update",
    id: input.id,
    agentSlug: input.agentSlug,
    createdAt: input.createdAt.toISOString(),
  };

  getSubscribers().forEach((subscriber) => subscriber(event));
}
