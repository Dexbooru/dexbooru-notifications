import BaseRepository, {
  EXCLUDED_PROJECTION,
} from "../../core/base-repository";
import Logger from "../../core/logger";
import NewPostComment, {
  type TNewPostComment,
} from "../../models/events/new-post-comment";

class NewPostCommentRepository extends BaseRepository<TNewPostComment> {
  constructor() {
    super("NewPostCommentRepository", NewPostComment);
  }

  public async findByRecipientId(
    recipientId: string,
    wasRead: boolean | undefined,
    page: number,
    limit: number,
  ): Promise<TNewPostComment[]> {
    try {
      const filter: Record<string, unknown> = {
        $or: [
          { postAuthorId: recipientId },
          { parentCommentAuthorId: recipientId },
        ],
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
        `Error in NewPostCommentRepository.findByRecipientId:`,
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
          $or: [
            { postAuthorId: recipientId },
            { parentCommentAuthorId: recipientId },
          ],
          wasRead: false,
        },
        { $set: { wasRead: true } },
      );
      return result.modifiedCount;
    } catch (error) {
      Logger.instance.error(
        `Error in NewPostCommentRepository.markAsRead:`,
        error,
      );
      throw error;
    }
  }

  public async markAllAsRead(recipientId: string): Promise<number> {
    try {
      const result = await this.model.updateMany(
        {
          $or: [
            { postAuthorId: recipientId },
            { parentCommentAuthorId: recipientId },
          ],
          wasRead: false,
        },
        { $set: { wasRead: true } },
      );
      return result.modifiedCount;
    } catch (error) {
      Logger.instance.error(
        `Error in NewPostCommentRepository.markAllAsRead:`,
        error,
      );
      throw error;
    }
  }
}

export default NewPostCommentRepository;
