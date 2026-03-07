import BaseConsumer from "../core/base-consumer";
import DependencyInjectionContainer from "../core/dependency-injection-container";
import ServiceTokens from "../core/tokens/services";
import type NewPostLikeNotificationService from "../services/new-post-like";
import type RealtimePublisherService from "../services/realtime-publisher";
import {
  type TNewPostLikeNotificationDto,
  NewPostLikeNotificationDtoSchema,
} from "../models/events/new-post-like";

class NewPostLikeNotificationConsumer extends BaseConsumer<TNewPostLikeNotificationDto> {
  private static readonly queueName = "new_post_likes";
  private static readonly batchSize = 10;
  private static readonly visibilityTimeout = 10000;
  private static readonly routingKey = "event.new_post_like.*";

  private readonly newPostLikeNotificationService: NewPostLikeNotificationService;
  private readonly realtimePublisher: RealtimePublisherService;

  constructor() {
    super(
      NewPostLikeNotificationConsumer.queueName,
      NewPostLikeNotificationConsumer.batchSize,
      NewPostLikeNotificationConsumer.visibilityTimeout,
      NewPostLikeNotificationDtoSchema,
      NewPostLikeNotificationConsumer.routingKey,
    );

    const container = DependencyInjectionContainer.instance;

    this.newPostLikeNotificationService =
      container.getService<NewPostLikeNotificationService>(
        ServiceTokens.NewPostLikeNotificationService,
      );

    this.realtimePublisher = container.getService<RealtimePublisherService>(
      ServiceTokens.RealtimePublisher,
    );
  }

  protected async onBatch(
    messages: TNewPostLikeNotificationDto[],
  ): Promise<void> {
    await this.newPostLikeNotificationService.processBatch(messages);

    for (const message of messages) {
      const payload = {
        ...message,
        totalLikes: message.totalLikes.toString(),
      };

      await this.realtimePublisher.publish(
        "event.new_post_like",
        payload as unknown as Record<string, unknown>,
      );
    }
  }
}

export default NewPostLikeNotificationConsumer;
