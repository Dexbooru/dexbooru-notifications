import BaseConsumer from "../core/base-consumer";
import DependencyInjectionContainer from "../core/dependency-injection-container";
import ServiceTokens from "../core/tokens/services";
import type NewPostCommentService from "../services/new-post-comment";
import type RealtimePublisherService from "../services/realtime-publisher";
import {
  type TNewPostCommentDto,
  NewPostCommentDtoSchema,
} from "../models/events/new-post-comment";

class NewPostCommentConsumer extends BaseConsumer<TNewPostCommentDto> {
  private static readonly queueName = "new_post_comments";
  private static readonly batchSize = 10;
  private static readonly visibilityTimeout = 10000;
  private static readonly routingKey = "event.new_post_comment.*";

  private readonly newPostCommentService: NewPostCommentService;
  private readonly realtimePublisher: RealtimePublisherService;

  constructor() {
    super(
      NewPostCommentConsumer.queueName,
      NewPostCommentConsumer.batchSize,
      NewPostCommentConsumer.visibilityTimeout,
      NewPostCommentDtoSchema,
      NewPostCommentConsumer.routingKey,
    );

    const container = DependencyInjectionContainer.instance;

    this.newPostCommentService = container.getService<NewPostCommentService>(
      ServiceTokens.NewPostCommentService,
    );

    this.realtimePublisher = container.getService<RealtimePublisherService>(
      ServiceTokens.RealtimePublisher,
    );
  }

  protected async onBatch(messages: TNewPostCommentDto[]): Promise<void> {
    await this.newPostCommentService.processBatch(messages);

    for (const message of messages) {
      await this.realtimePublisher.publish(
        "event.new_post_comment",
        message as unknown as Record<string, unknown>,
      );
    }
  }
}

export default NewPostCommentConsumer;
