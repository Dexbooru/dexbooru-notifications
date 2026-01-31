import BaseRepository from "../../core/base-repository";
import Logger from "../../core/logger";
import FriendInvite, {
  type TFriendInvite,
} from "../../models/events/friend-invite";

class FriendInviteRepository extends BaseRepository<TFriendInvite> {
  constructor() {
    super("FriendInviteRepository", FriendInvite);
  }

  public async findByReceiverId(
    receiverId: string,
    wasRead: boolean | undefined,
    page: number,
    limit: number,
  ): Promise<TFriendInvite[]> {
    try {
      const filter: Record<string, any> = {
        receiverUserId: receiverId,
      };

      if (wasRead !== undefined) {
        filter.wasRead = wasRead;
      }

      const skip = (page - 1) * limit;

      return await this.model
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
      Logger.instance.error(
        `Error in FriendInviteRepository.findByReceiverId:`,
        error,
      );
      throw error;
    }
  }
}

export default FriendInviteRepository;