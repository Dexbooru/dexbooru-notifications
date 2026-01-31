import { describe, test, expect, mock, beforeEach } from "bun:test";
import GlobalEventConsumer from "../../src/consumers/global-event";
import DependencyInjectionContainer from "../../src/core/dependency-injection-container";
import ServiceTokens from "../../src/core/tokens/services";
import WebSocketService from "../../src/services/websocket";
import EventService from "../../src/services/events";

class TestableGlobalEventConsumer extends GlobalEventConsumer {
  public async testOnBatch(messages: unknown[]): Promise<void> {
    return this.onBatch(messages as any);
  }
}

describe("GlobalEventConsumer", () => {
  let consumer: TestableGlobalEventConsumer;
  let mockWebSocketService: WebSocketService;
  let mockEventService: EventService;
  let mockPublish: ReturnType<typeof mock>;
  let mockResolveRecipientChannels: ReturnType<typeof mock>;

  beforeEach(() => {
    DependencyInjectionContainer.instance.clear();

    mockPublish = mock(() => {});
    mockWebSocketService = {
      publish: mockPublish,
    } as unknown as WebSocketService;

    mockResolveRecipientChannels = mock((payload: any) => {
      if (payload.userId) return [`events-${payload.userId}`];
      return [];
    });
    mockEventService = {
      resolveRecipientChannels: mockResolveRecipientChannels,
    } as unknown as EventService;

    DependencyInjectionContainer.instance.add(
      ServiceTokens.WebSocketService,
      mockWebSocketService,
    );
    DependencyInjectionContainer.instance.add(
      ServiceTokens.EventService,
      mockEventService,
    );

    consumer = new TestableGlobalEventConsumer();
  });

  test("should publish message to websocket service for each resolved channel", async () => {
    const payload = {
      userId: "user-1",
      some: "data",
    };

    await consumer.testOnBatch([payload]);

    expect(mockResolveRecipientChannels).toHaveBeenCalledWith(payload);
    expect(mockPublish).toHaveBeenCalledWith(
      "events-user-1",
      JSON.stringify(payload),
    );
  });

  test("should publish to multiple channels if resolved", async () => {
    mockResolveRecipientChannels.mockReturnValue(["channel-1", "channel-2"]);
    const payload = { test: "data" };

    await consumer.testOnBatch([payload]);

    expect(mockPublish).toHaveBeenCalledTimes(2);
    expect(mockPublish).toHaveBeenCalledWith(
      "channel-1",
      JSON.stringify(payload),
    );
    expect(mockPublish).toHaveBeenCalledWith(
      "channel-2",
      JSON.stringify(payload),
    );
  });

  test("should skip message if no channels resolved", async () => {
    mockResolveRecipientChannels.mockReturnValue([]);
    const payload = { some: "data" };

    await consumer.testOnBatch([payload]);

    expect(mockResolveRecipientChannels).toHaveBeenCalledWith(payload);
    expect(mockPublish).not.toHaveBeenCalled();
  });
});
