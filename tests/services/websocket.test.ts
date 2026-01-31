import { describe, test, expect, mock } from "bun:test";
import WebSocketService from "../../src/services/websocket";
import type { Server } from "bun";
import type { TGlobalEventData } from "../../src/services/events";

describe("WebSocketService", () => {
  test("should publish message if server is set", () => {
    const service = new WebSocketService();
    const mockPublish = mock(() => 0); // returns bytes sent
    const mockServer = {
      publish: mockPublish,
    } as unknown as Server<TGlobalEventData>;

    service.setServer(mockServer);
    service.publish("topic", "message");

    expect(mockPublish).toHaveBeenCalledWith("topic", "message");
  });

  test("should not throw if server is not set", () => {
    const service = new WebSocketService();
    expect(() => service.publish("topic", "message")).not.toThrow();
  });
});
