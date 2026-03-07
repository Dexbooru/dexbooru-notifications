import BaseConsumer from "../core/base-consumer";
import DependencyInjectionContainer from "../core/dependency-injection-container";
import ServiceTokens from "../core/tokens/services";
import type FriendInviteService from "../services/friend-invites";
import type RealtimePublisherService from "../services/realtime-publisher";
import {
  type TFriendInviteDto,
  FriendInviteDtoSchema,
} from "../models/events/friend-invite";

class FriendInviteConsumer extends BaseConsumer<TFriendInviteDto> {
  private static readonly queueName = "friend_invites";
  private static readonly batchSize = 10;
  private static readonly visibilityTimeout = 10000;
  private static readonly routingKey = "event.friend_invite.*";

  private readonly friendInviteService: FriendInviteService;
  private readonly realtimePublisher: RealtimePublisherService;

  constructor() {
    super(
      FriendInviteConsumer.queueName,
      FriendInviteConsumer.batchSize,
      FriendInviteConsumer.visibilityTimeout,
      FriendInviteDtoSchema,
      FriendInviteConsumer.routingKey,
    );

    const container = DependencyInjectionContainer.instance;

    this.friendInviteService = container.getService<FriendInviteService>(
      ServiceTokens.FriendInviteService,
    );

    this.realtimePublisher = container.getService<RealtimePublisherService>(
      ServiceTokens.RealtimePublisher,
    );
  }

  protected async onBatch(messages: TFriendInviteDto[]): Promise<void> {
    await this.friendInviteService.processBatch(messages);

    for (const message of messages) {
      await this.realtimePublisher.publish(
        "event.friend_invite",
        message as unknown as Record<string, unknown>,
      );
    }
  }
}

export default FriendInviteConsumer;
