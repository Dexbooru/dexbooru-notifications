import { Connection, type Publisher } from "rabbitmq-client";
import type { IPublisher } from "./interfaces/publisher";

abstract class BasePublisher<T = unknown> implements IPublisher<T> {
  protected publisher: Publisher;
  protected exchange: string;

  constructor(connection: Connection, exchange: string) {
    this.exchange = exchange;
    this.publisher = connection.createPublisher({
      confirm: true,
      exchanges: [{ exchange, type: "topic", durable: true }],
    });
  }

  public async publish(routingKey: string, data: T): Promise<void> {
    await this.publisher.send({ exchange: this.exchange, routingKey }, data);
  }

  public async stop(): Promise<void> {
    await this.publisher.close();
  }
}

export default BasePublisher;
