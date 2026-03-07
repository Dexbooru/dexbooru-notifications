interface IPublisher<T = unknown> {
  publish(routingKey: string, data: T): Promise<void>;
}

export type { IPublisher };
