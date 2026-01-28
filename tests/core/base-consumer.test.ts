import { describe, test, expect, mock, beforeEach } from "bun:test";
import BaseConsumer from "../../src/core/base-consumer";
import Logger from "../../src/core/logger";
import type { AsyncMessage } from "rabbitmq-client";

// Mock implementation of BaseConsumer
class TestConsumer extends BaseConsumer {
  public mockOnBatch = mock(() => Promise.resolve());

  protected async onBatch(messages: unknown[]): Promise<void> {
    await this.mockOnBatch(messages);
  }
  
  public async testHandleCallback(msg: Partial<AsyncMessage>) {
      return (this as unknown as { handleConsumerCallback: (msg: Partial<AsyncMessage>) => Promise<void> }).handleConsumerCallback(msg);
  }

  public getConsumerConfig() {
      return (this as unknown as { buildConsumerConfig: () => any }).buildConsumerConfig();
  }
}

describe("BaseConsumer", () => {
  let consumer: TestConsumer;
  const mockLoggerError = mock();
  const mockLoggerWarn = mock();

  beforeEach(() => {
    Logger.instance.error = mockLoggerError;
    Logger.instance.warn = mockLoggerWarn;
    mockLoggerError.mockClear();
    mockLoggerWarn.mockClear();
    
    // Set small batch for easy testing
    consumer = new TestConsumer("test-queue", 2, 100);
  });

  test("should call onBatch when batch size is reached", async () => {
    const msg1: Partial<AsyncMessage> = { body: JSON.stringify({ id: 1 }) };
    const msg2: Partial<AsyncMessage> = { body: JSON.stringify({ id: 2 }) };

    const p1 = consumer.testHandleCallback(msg1);
    const p2 = consumer.testHandleCallback(msg2);

    await Promise.all([p1, p2]);

    expect(consumer.mockOnBatch).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
  });

  test("should call onBatch when timer expires", async () => {
    const msg1: Partial<AsyncMessage> = { body: JSON.stringify({ id: 1 }) };
    
    const p1 = consumer.testHandleCallback(msg1);

    // Wait for timer (maxWaitTime is 100)
    await new Promise(r => setTimeout(r, 150));

    await p1;

    expect(consumer.mockOnBatch).toHaveBeenCalledWith([{ id: 1 }]);
  });

  test("should rethrow error and reject all promises if onBatch fails", async () => {
    const error = new Error("Batch failed");
    consumer.mockOnBatch.mockRejectedValue(error);
    
    const msg1: Partial<AsyncMessage> = { body: JSON.stringify({ id: 1 }) };
    const msg2: Partial<AsyncMessage> = { body: JSON.stringify({ id: 2 }) };

    const p1 = consumer.testHandleCallback(msg1);
    const p2 = consumer.testHandleCallback(msg2);

    await expect(Promise.all([p1, p2])).rejects.toThrow("Batch failed");
    
    expect(mockLoggerError).toHaveBeenCalled();
  });

  test("should resolve (ACK) if JSON parsing fails", async () => {
    const msg: Partial<AsyncMessage> = { body: "invalid-json" };
    // This should resolve immediately (not throw) so it counts as an ACK
    await consumer.testHandleCallback(msg);
    expect(mockLoggerWarn).toHaveBeenCalled();
  });

  test("should include queue bindings if routing key provided", () => {
      const routingConsumer = new TestConsumer("q", 1, 100, undefined, "my.routing.key");
      const config = routingConsumer.getConsumerConfig();
      expect(config.queueBindings).toBeDefined();
      expect(config.queueBindings[0].routingKey).toBe("my.routing.key");
  });
});
