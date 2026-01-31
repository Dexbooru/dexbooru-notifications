import BaseRepository from "../../core/base-repository";
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
}

export default NewPostCommentRepository;
