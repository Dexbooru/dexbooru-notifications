import { describe, test, expect, mock, beforeEach } from "bun:test";
import FriendInviteConsumer from "../../src/consumers/friend-invites";
import DependencyInjectionContainer from "../../src/core/dependency-injection-container";
import ServiceTokens from "../../src/core/tokens/services";
import type FriendInviteService from "../../src/services/friend-invites";
import type { TFriendInviteDto } from "../../src/models/events/friend-invite";

class TestableFriendInviteConsumer extends FriendInviteConsumer {
  public async testOnBatch(messages: TFriendInviteDto[]): Promise<void> {
    return this.onBatch(messages);
  }
}

describe("FriendInviteConsumer", () => {
  let consumer: TestableFriendInviteConsumer;
  let mockService: FriendInviteService;
  let mockProcessBatch: ReturnType<typeof mock>;

  beforeEach(() => {
    DependencyInjectionContainer.instance.clear();
    mockProcessBatch = mock(() => Promise.resolve());

    mockService = {
      processBatch: mockProcessBatch,
    } as unknown as FriendInviteService;

    DependencyInjectionContainer.instance.add(
      ServiceTokens.FriendInviteService,
      mockService,
    );

    consumer = new TestableFriendInviteConsumer();
  });

  test("should call service processBatch on batch", async () => {
    const messages: TFriendInviteDto[] = [
      {
        senderUserId: "id1",
        receiverUserId: "id2",
        requestSentAt: new Date("2023-01-01"),
        wasRead: false,
        status: "SENT",
      },
    ];
    await consumer.testOnBatch(messages);
    expect(mockProcessBatch).toHaveBeenCalledWith(messages);
  });

  test("should propagate error if batch processing fails", async () => {
    const error = new Error("Batch failed");
    mockProcessBatch.mockRejectedValue(error);
    const messages: TFriendInviteDto[] = [
      {
        senderUserId: "id1",
        receiverUserId: "id2",
        requestSentAt: new Date("2023-01-01"),
        wasRead: false,
        status: "SENT",
      },
    ];

    await expect(consumer.testOnBatch(messages)).rejects.toThrow(
      "Batch failed",
    );
  });
});
