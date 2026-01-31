import { describe, test, expect, mock, beforeEach } from "bun:test";
import NewPostLikeNotificationConsumer from "../../src/consumers/new-post-like";
import DependencyInjectionContainer from "../../src/core/dependency-injection-container";
import ServiceTokens from "../../src/core/tokens/services";
import type NewPostLikeNotificationService from "../../src/services/new-post-like";
import type { TNewPostLikeNotificationDto } from "../../src/models/events/new-post-like";

// To test the protected onBatch method, we extend the consumer
class TestableNewPostLikeNotificationConsumer extends NewPostLikeNotificationConsumer {
  public async testOnBatch(
    messages: TNewPostLikeNotificationDto[],
  ): Promise<void> {
    return this.onBatch(messages);
  }
}

// Mock Logger since BaseConsumer uses it
mock.module("../../src/core/logger", () => {
  return {
    default: {
      instance: {
        info: mock(),
        error: mock(),
        warn: mock(),
      },
    },
  };
});

describe("NewPostLikeNotificationConsumer", () => {
  let consumer: TestableNewPostLikeNotificationConsumer;
  let mockService: NewPostLikeNotificationService;
  let mockProcessBatch: ReturnType<typeof mock>;

  beforeEach(() => {
    DependencyInjectionContainer.instance.clear();
    mockProcessBatch = mock(() => Promise.resolve());

    mockService = {
      processBatch: mockProcessBatch,
    } as unknown as NewPostLikeNotificationService;

    DependencyInjectionContainer.instance.add(
      ServiceTokens.NewPostLikeNotificationService,
      mockService,
    );

    consumer = new TestableNewPostLikeNotificationConsumer();
  });

  test("should call service processBatch on batch", async () => {
    const messages: TNewPostLikeNotificationDto[] = [
      {
        postId: "00000000-0000-0000-0000-000000000001",
        postAuthorId: "00000000-0000-0000-0000-000000000002",
        likerUserId: "00000000-0000-0000-0000-000000000003",
        totalLikes: 10n,
        wasRead: false,
      },
    ];
    await consumer.testOnBatch(messages);
    expect(mockProcessBatch).toHaveBeenCalledWith(messages);
  });

  test("should propagate error if batch processing fails", async () => {
    const error = new Error("Batch processing failed");
    mockProcessBatch.mockRejectedValue(error);
    const messages: TNewPostLikeNotificationDto[] = [
      {
        postId: "00000000-0000-0000-0000-000000000001",
        postAuthorId: "00000000-0000-0000-0000-000000000002",
        likerUserId: "00000000-0000-0000-0000-000000000003",
        totalLikes: 10n,
        wasRead: false,
      },
    ];

    await expect(consumer.testOnBatch(messages)).rejects.toThrow(
      "Batch processing failed",
    );
  });
});
