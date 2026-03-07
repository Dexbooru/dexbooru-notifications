import { describe, test, expect, mock, beforeEach } from "bun:test";
import RealtimePublisherService from "../../src/services/realtime-publisher";
import DependencyInjectionContainer from "../../src/core/dependency-injection-container";
import ServiceTokens from "../../src/core/tokens/services";
import { Connection } from "rabbitmq-client";

describe("RealtimePublisher", () => {
  let mockConnection: Connection;
  let mockPublisher: any;

  beforeEach(() => {
    DependencyInjectionContainer.instance.clear();

    mockPublisher = {
      send: mock(() => Promise.resolve()),
      close: mock(() => Promise.resolve()),
    };

    mockConnection = {
      createPublisher: mock(() => mockPublisher),
    } as unknown as Connection;

    DependencyInjectionContainer.instance.add(
      ServiceTokens.RabbitMqConnection,
      mockConnection,
    );
  });

  test("should initialize with realtime_events exchange", () => {
    new RealtimePublisherService();
    expect(mockConnection.createPublisher).toHaveBeenCalled();
    const args = (mockConnection.createPublisher as any).mock.calls[0][0];
    expect(args.exchanges[0].exchange).toBe("realtime_events");
  });
});
