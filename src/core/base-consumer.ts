import {
  Connection,
  type AsyncMessage,
  type Consumer,
  type ConsumerProps,
} from "rabbitmq-client";
import type { IConsumer } from "./interfaces/consumer";
import Logger from "./logger";
import { type ZodSchema } from "zod";

abstract class BaseConsumer<T = unknown> implements IConsumer {
  public queueName: string;
  public messagesPerBatch: number;
  public maxWaitTime: number;
  public routingKey?: string;
  protected schema?: ZodSchema<T>;

  public static readonly BASE_EXCHANGES = ["notification_events"];
  public static readonly DEFAULT_MESSAGES_PER_BATCH = 10;
  public static readonly DEFAULT_MAX_WAIT_TIME = 5000;

  private consumer: Consumer | undefined;
  private messageBuffer: { body: unknown; raw: AsyncMessage }[] = [];
  private pendingPromises: {
    resolve: () => void;
    reject: (err: any) => void;
  }[] = [];
  private batchTimer: Timer | null = null;

  constructor(
    queueName?: string,
    messagesPerBatch?: number,
    maxWaitTime?: number,
    schema?: ZodSchema<T>,
    routingKey?: string,
  ) {
    this.queueName = queueName ?? "";
    this.messagesPerBatch =
      messagesPerBatch ?? BaseConsumer.DEFAULT_MESSAGES_PER_BATCH;
    this.maxWaitTime = maxWaitTime ?? BaseConsumer.DEFAULT_MAX_WAIT_TIME;
    this.schema = schema;
    this.routingKey = routingKey;
  }

  private buildConsumerConfig(): ConsumerProps {
    const config: ConsumerProps = {
      queue: this.queueName,
      queueOptions: { durable: true },
      qos: { prefetchCount: this.messagesPerBatch },
      exchanges: BaseConsumer.BASE_EXCHANGES.map((exchange) => ({
        exchange,
        durable: true,
        type: "topic",
      })),
    };

    if (this.routingKey) {
      config.queueBindings = BaseConsumer.BASE_EXCHANGES.map((exchange) => ({
        exchange,
        routingKey: this.routingKey!,
      }));
    }

    return config;
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
    incomingMessage: AsyncMessage,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        const body = this.convertMessageBodyToJson(incomingMessage.body);
        this.messageBuffer.push({ body, raw: incomingMessage });
        this.pendingPromises.push({ resolve, reject });

        if (this.messageBuffer.length >= this.messagesPerBatch) {
          this.processBatchNow();
        } else if (!this.batchTimer) {
          this.batchTimer = setTimeout(() => {
            this.processBatchNow();
          }, this.maxWaitTime);
        }
      } catch (err) {
        Logger.instance.warn(
          `Failed to parse message body in ${this.queueName}, dropping message.`,
          err,
        );
        resolve();
      }
    });
  }

  private async processBatchNow() {
    if (this.batchTimer) {
      clearTimeout(this.batchTimer);
      this.batchTimer = null;
    }

    if (this.messageBuffer.length === 0) return;

    const batchMessages = [...this.messageBuffer];
    const batchPromises = [...this.pendingPromises];

    this.messageBuffer = [];
    this.pendingPromises = [];

    const validPayloads: T[] = [];
    const validPromises: { resolve: () => void; reject: (err: any) => void }[] =
      [];

    batchMessages.forEach((msg, index) => {
      const promise = batchPromises[index];
      if (this.schema) {
        const result = this.schema.safeParse(msg.body);

        if (result.success) {
          validPayloads.push(result.data);
          if (promise !== undefined) {
            validPromises.push(promise);
          }
        } else {
          Logger.instance.warn(
            `Invalid message skipped in ${this.queueName}`,
            result.error,
          );

          // ACK invalid message to drop it
          promise?.resolve();
        }
      } else {
        validPayloads.push(msg.body as T);
        if (promise !== undefined) {
          validPromises.push(promise);
        }
      }
    });

    if (validPayloads.length === 0) {
      return;
    }

    try {
      await this.onBatch(validPayloads);

      // Ack all valid
      validPromises.forEach((p) => p.resolve());
    } catch (error) {
      Logger.instance.error(
        `Error processing batch in ${this.queueName}`,
        error,
      );
      // Nack all valid (requeue)
      validPromises.forEach((p) => p.reject(error));
    }
  }

  public getQueueName(): string {
    return this.queueName;
  }

  public getMessagesPerBatch(): number {
    return this.messagesPerBatch;
  }

  public async start(connection: Connection): Promise<void> {
    if (!this.queueName) return;

    this.consumer = connection.createConsumer(
      this.buildConsumerConfig(),
      this.handleConsumerCallback.bind(this),
    );
  }

  public async stop(): Promise<void> {
    if (!this.consumer) return;

    // Flush remaining
    if (this.messageBuffer.length > 0) {
      await this.processBatchNow();
    }

    await this.consumer.close();
  }

  protected abstract onBatch(messages: T[]): Promise<void>;
}

export default BaseConsumer;
