import BaseRepository, {
  EXCLUDED_PROJECTION,
} from "../../core/base-repository";
import Logger from "../../core/logger";
import NewPostLikeNotification, {
  type TNewPostLikeNotification,
} from "../../models/events/new-post-like";

class NewPostLikeNotificationRepository extends BaseRepository<TNewPostLikeNotification> {
  constructor() {
    super("NewPostLikeNotificationRepository", NewPostLikeNotification);
  }

  public async findByRecipientId(
    recipientId: string,
    wasRead: boolean | undefined,
    page: number,
    limit: number,
  ): Promise<TNewPostLikeNotification[]> {
    try {
      const filter: Record<string, unknown> = {
        postAuthorId: recipientId,
      };

      if (wasRead !== undefined) {
        filter.wasRead = wasRead;
      }

      const skip = (page - 1) * limit;

      return await this.model
        .find(filter)
        .select(EXCLUDED_PROJECTION)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec();
    } catch (error) {
      Logger.instance.error(
        `Error in NewPostLikeNotificationRepository.findByRecipientId:`,
        error,
      );
      throw error;
    }
  }
  public async markAsRead(
    recipientId: string,
    notificationIds: string[],
  ): Promise<number> {
    try {
      const result = await this.model.updateMany(
        {
          _id: { $in: notificationIds },
          postAuthorId: recipientId,
          wasRead: false,
        },
        { $set: { wasRead: true } },
      );
      return result.modifiedCount;
    } catch (error) {
      Logger.instance.error(
        `Error in NewPostLikeNotificationRepository.markAsRead:`,
        error,
      );
      throw error;
    }
  }

  public async markAllAsRead(recipientId: string): Promise<number> {
    try {
      const result = await this.model.updateMany(
        { postAuthorId: recipientId, wasRead: false },
        { $set: { wasRead: true } },
      );
      return result.modifiedCount;
    } catch (error) {
      Logger.instance.error(
        `Error in NewPostLikeNotificationRepository.markAllAsRead:`,
        error,
      );
      throw error;
    }
  }
}

export default NewPostLikeNotificationRepository;
