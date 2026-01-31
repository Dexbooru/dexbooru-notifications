import { describe, test, expect, mock, beforeEach } from "bun:test";
import NewPostCommentConsumer from "../../src/consumers/new-post-comment";
import DependencyInjectionContainer from "../../src/core/dependency-injection-container";
import ServiceTokens from "../../src/core/tokens/services";
import type NewPostCommentService from "../../src/services/new-post-comment";
import type { TNewPostCommentDto } from "../../src/models/events/new-post-comment";

// To test the protected onBatch method, we extend the consumer
class TestableNewPostCommentConsumer extends NewPostCommentConsumer {
  public async testOnBatch(messages: TNewPostCommentDto[]): Promise<void> {
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
      }
    }
  };
});

describe("NewPostCommentConsumer", () => {
  let consumer: TestableNewPostCommentConsumer;
  let mockService: NewPostCommentService;
  let mockProcessBatch: ReturnType<typeof mock>;

  beforeEach(() => {
    DependencyInjectionContainer.instance.clear();
    mockProcessBatch = mock(() => Promise.resolve());
    
    mockService = {
      processBatch: mockProcessBatch,
    } as unknown as NewPostCommentService;

    DependencyInjectionContainer.instance.add(
      ServiceTokens.NewPostCommentService,
      mockService
    );

    consumer = new TestableNewPostCommentConsumer();
  });

  test("should call service processBatch on batch", async () => {
    const messages: TNewPostCommentDto[] = [
      {
        postId: "00000000-0000-0000-0000-000000000001",
        postAuthorId: "00000000-0000-0000-0000-000000000002",
        commentAuthorId: "00000000-0000-0000-0000-000000000003",
        commentContent: "Nice post!",
        wasRead: false,
      }
    ];
    await consumer.testOnBatch(messages);
    expect(mockProcessBatch).toHaveBeenCalledWith(messages);
  });

  test("should propagate error if batch processing fails", async () => {
    const error = new Error("Batch processing failed");
    mockProcessBatch.mockRejectedValue(error);
    const messages: TNewPostCommentDto[] = [
      {
        postId: "00000000-0000-0000-0000-000000000001",
        postAuthorId: "00000000-0000-0000-0000-000000000002",
        commentAuthorId: "00000000-0000-0000-0000-000000000003",
        commentContent: "Nice post!",
        wasRead: false,
      }
    ];

    await expect(consumer.testOnBatch(messages)).rejects.toThrow("Batch processing failed");
  });
});
