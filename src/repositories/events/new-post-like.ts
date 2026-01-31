import BaseRepository from "../../core/base-repository";
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
}

export default NewPostLikeNotificationRepository;
