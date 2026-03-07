import { describe, test, expect, mock, beforeEach } from "bun:test";
import NewPostLikeNotificationConsumer from "../../src/consumers/new-post-like";
import DependencyInjectionContainer from "../../src/core/dependency-injection-container";
import ServiceTokens from "../../src/core/tokens/services";
import type NewPostLikeNotificationService from "../../src/services/new-post-like";
import type { TNewPostLikeNotificationDto } from "../../src/models/events/new-post-like";

declare global {
  interface BigInt {
    toJSON(): string;
  }
}

BigInt.prototype.toJSON = function () {
  return this.toString();
};

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
  let mockRealtimePublisher: any;
  let mockProcessBatch: ReturnType<typeof mock>;
  let mockPublish: ReturnType<typeof mock>;

  beforeEach(() => {
    DependencyInjectionContainer.instance.clear();
    mockProcessBatch = mock(() => Promise.resolve());
    mockPublish = mock(() => Promise.resolve());

    mockService = {
      processBatch: mockProcessBatch,
    } as unknown as NewPostLikeNotificationService;

    mockRealtimePublisher = {
      publish: mockPublish,
    };

    DependencyInjectionContainer.instance.add(
      ServiceTokens.NewPostLikeNotificationService,
      mockService,
    );

    DependencyInjectionContainer.instance.add(
      ServiceTokens.RealtimePublisher,
      mockRealtimePublisher,
    );

    consumer = new TestableNewPostLikeNotificationConsumer();
  });

  test("should call service processBatch and publish on batch", async () => {
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
    expect(mockPublish).toHaveBeenCalledWith("event.new_post_like", {
      ...messages[0],
      totalLikes: "10",
    });
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
