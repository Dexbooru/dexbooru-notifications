import DependencyInjectionContainer from "../core/dependency-injection-container";
import RepositoryTokens from "../core/tokens/repositories";
import FriendInviteRepository from "../repositories/events/friend-invite";
import {
  dtoToModel,
  type TFriendInvite,
  type TFriendInviteDto,
} from "../models/events/friend-invite";
import Logger from "../core/logger";

class FriendInviteService {
  private friendInviteRepository: FriendInviteRepository;

  constructor() {
    this.friendInviteRepository =
      DependencyInjectionContainer.instance.getService<FriendInviteRepository>(
        RepositoryTokens.FriendInviteRepository,
      );
  }

  public async createInvite(data: TFriendInviteDto): Promise<TFriendInvite> {
    return await this.friendInviteRepository.create(dtoToModel(data));
  }

  public async getInvite(id: string): Promise<TFriendInvite | null> {
    return await this.friendInviteRepository.findById(id);
  }

  public async processInvite(data: TFriendInviteDto): Promise<void> {
    try {
      const modelData = dtoToModel(data);
      await this.friendInviteRepository.create(modelData);
    } catch (error) {
      Logger.instance.error("Error processing invite", error);
      throw error;
    }
  }

  public async processBatch(messages: TFriendInviteDto[]): Promise<void> {
    const validInvites = messages
      .map((msg) => dtoToModel(msg))
      .filter((i) => i !== null);

    if (validInvites.length > 0) {
      await this.friendInviteRepository.insertMany(validInvites as any);
    }

    if (validInvites.length < messages.length) {
      Logger.instance.warn(
        `${messages.length - validInvites.length} invalid invites skipped in batch`,
      );
    }
  }

  public async getUserInvites(
    userId: string,
    wasRead: boolean | undefined,
    page: number,
    limit: number,
  ): Promise<TFriendInvite[]> {
    return await this.friendInviteRepository.findByReceiverId(
      userId,
      wasRead,
      page,
      limit,
    );
  }
}

export default FriendInviteService;
