import BaseConsumer from "../core/base-consumer";
import DependencyInjectionContainer from "../core/dependency-injection-container";
import ServiceTokens from "../core/tokens/services";
import type NewPostLikeNotificationService from "../services/new-post-like";
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

  constructor() {
    super(
      NewPostLikeNotificationConsumer.queueName,
      NewPostLikeNotificationConsumer.batchSize,
      NewPostLikeNotificationConsumer.visibilityTimeout,
      NewPostLikeNotificationDtoSchema,
      NewPostLikeNotificationConsumer.routingKey,
    );

    this.newPostLikeNotificationService =
      DependencyInjectionContainer.instance.getService<NewPostLikeNotificationService>(
        ServiceTokens.NewPostLikeNotificationService,
      );
  }

  protected async onBatch(
    messages: TNewPostLikeNotificationDto[],
  ): Promise<void> {
    await this.newPostLikeNotificationService.processBatch(messages);
  }
}

export default NewPostLikeNotificationConsumer;
