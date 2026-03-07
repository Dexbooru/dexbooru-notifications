import BaseRepository, {
  EXCLUDED_PROJECTION,
} from "../../core/base-repository";
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
      const filter: Record<string, unknown> = {
        receiverUserId: receiverId,
      };

      if (wasRead !== undefined) {
        filter.wasRead = wasRead;
      }

      const skip = (page - 1) * limit;

      return await this.model
        .find(filter)
        .select(EXCLUDED_PROJECTION)
        .sort({ requestSentAt: -1 })
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
  public async markAsRead(
    receiverId: string,
    notificationIds: string[],
  ): Promise<number> {
    try {
      const result = await this.model.updateMany(
        {
          _id: { $in: notificationIds },
          receiverUserId: receiverId,
          wasRead: false,
        },
        { $set: { wasRead: true } },
      );
      return result.modifiedCount;
    } catch (error) {
      Logger.instance.error(
        `Error in FriendInviteRepository.markAsRead:`,
        error,
      );
      throw error;
    }
  }

  public async markAllAsRead(receiverId: string): Promise<number> {
    try {
      const result = await this.model.updateMany(
        { receiverUserId: receiverId, wasRead: false },
        { $set: { wasRead: true } },
      );
      return result.modifiedCount;
    } catch (error) {
      Logger.instance.error(
        `Error in FriendInviteRepository.markAllAsRead:`,
        error,
      );
      throw error;
    }
  }
}

export default FriendInviteRepository;
