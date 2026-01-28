import BaseConsumer from "../core/base-consumer";
import DependencyInjectionContainer from "../core/dependency-injection-container";
import ServiceTokens from "../core/tokens/services";
import type FriendInviteService from "../services/friend-invites";
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

  constructor() {
    super(
      FriendInviteConsumer.queueName,
      FriendInviteConsumer.batchSize,
      FriendInviteConsumer.visibilityTimeout,
      FriendInviteDtoSchema,
      FriendInviteConsumer.routingKey,
    );

    this.friendInviteService =
      DependencyInjectionContainer.instance.getService<FriendInviteService>(
        ServiceTokens.FriendInviteService,
      );
  }

  protected async onBatch(messages: TFriendInviteDto[]): Promise<void> {
    await this.friendInviteService.processBatch(messages);
  }
}

export default FriendInviteConsumer;