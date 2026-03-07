import { describe, test, expect, mock, beforeEach } from "bun:test";
import BasePublisher from "../../src/core/base-publisher";
import type { Connection, Publisher } from "rabbitmq-client";

class TestPublisher extends BasePublisher<string> {
  constructor(connection: Connection) {
    super(connection, "test_exchange");
  }
}

describe("BasePublisher", () => {
  let mockConnection: Connection;
  let mockPublisher: Publisher;
  let mockSend: ReturnType<typeof mock>;
  let mockClose: ReturnType<typeof mock>;

  beforeEach(() => {
    mockSend = mock(() => Promise.resolve());
    mockClose = mock(() => Promise.resolve());
    mockPublisher = {
      send: mockSend,
      close: mockClose,
    } as unknown as Publisher;

    mockConnection = {
      createPublisher: mock(() => mockPublisher),
    } as unknown as Connection;
  });

  test("should create a publisher with correct configuration", () => {
    new TestPublisher(mockConnection);
    expect(mockConnection.createPublisher).toHaveBeenCalled();
    const args = (mockConnection.createPublisher as any).mock.calls[0][0];
    expect(args.exchanges[0].exchange).toBe("test_exchange");
  });

  test("publish should send data to exchange with correct routing key", async () => {
    const publisher = new TestPublisher(mockConnection);
    await publisher.publish("test.key", "test data");
    expect(mockSend).toHaveBeenCalledWith(
      { exchange: "test_exchange", routingKey: "test.key" },
      "test data",
    );
  });

  test("stop should close the publisher", async () => {
    const publisher = new TestPublisher(mockConnection);
    await publisher.stop();
    expect(mockClose).toHaveBeenCalled();
  });
});
