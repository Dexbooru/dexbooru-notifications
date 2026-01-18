interface IConsumer {
  queueName: string;
  messagesPerBatch?: number;
}

export type { IConsumer };
