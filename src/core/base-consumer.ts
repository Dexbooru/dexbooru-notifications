import {
  Connection,
  type AsyncMessage,
  type Consumer,
  type ConsumerProps,
} from "rabbitmq-client";
import type { IConsumer } from "./interfaces/consumer";

abstract class BaseConsumer implements IConsumer {
  public queueName: string;
  public messagesPerBatch: number;

  public static readonly BASE_EXCHANGES = ["notification_events"];
  public static readonly DEFAULT_MESSAGES_PER_BATCH = 10;

  private consumer: Consumer | undefined;

  constructor(queueName?: string, messagesPerBatch?: number) {
    this.queueName = queueName ?? "";
    this.messagesPerBatch =
      messagesPerBatch ?? BaseConsumer.DEFAULT_MESSAGES_PER_BATCH;
  }

  private buildConsumerConfig(): ConsumerProps {
    return {
      queue: this.queueName,
      queueOptions: { durable: true },
      qos: { prefetchCount: this.messagesPerBatch },
      exchanges: BaseConsumer.BASE_EXCHANGES.map((exchange) => ({
        exchange,
        durable: true,
        type: "topic",
      })),
    };
  }

  private convertMessageBodyToJson(messageBody: unknown): unknown {
    if (messageBody instanceof Buffer) {
      const messageString = messageBody.toString("utf-8");
      return JSON.parse(messageString);
    }

    if (typeof messageBody === "string") {
      return JSON.parse(messageBody);
    }

    return messageBody;
  }

  private async handleConsumerCallback(
    incomingMessage: AsyncMessage
  ): Promise<void> {
    try {
      const parsedMessageBody = this.convertMessageBodyToJson(
        incomingMessage.body
      );
      await this.onMessage(parsedMessageBody);
    } catch (error) {
      console.error(`Error processing message in ${this.queueName}:`, error);
      throw error;
    }
  }

  public getQueueName(): string {
    return this.queueName;
  }

  public getMessagesPerBatch(): number {
    return this.messagesPerBatch;
  }

  public async start(connection: Connection): Promise<void> {
    if (!this.queueName) {
      return;
    }

    if (!this.onMessage) {
      return;
    }

    this.consumer = connection.createConsumer(
      this.buildConsumerConfig(),
      this.handleConsumerCallback.bind(this)
    );
  }

  public async stop(): Promise<void> {
    if (!this.consumer) return;

    await this.consumer.close();
  }

  protected abstract onMessage(message: unknown): Promise<void>;
}

export default BaseConsumer;
