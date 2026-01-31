import DependencyInjectionContainer from "../core/dependency-injection-container";
import RepositoryTokens from "../core/tokens/repositories";
import NewPostCommentRepository from "../repositories/events/new-post-comment";
import {
  dtoToModel,
  type TNewPostComment,
  type TNewPostCommentDto,
} from "../models/events/new-post-comment";
import Logger from "../core/logger";

class NewPostCommentService {
  private newPostCommentRepository: NewPostCommentRepository;

  constructor() {
    this.newPostCommentRepository =
      DependencyInjectionContainer.instance.getService<NewPostCommentRepository>(
        RepositoryTokens.NewPostCommentRepository,
      );
  }

  public async processBatch(messages: TNewPostCommentDto[]): Promise<void> {
    const validComments = messages
      .map((msg) => dtoToModel(msg))
      .filter((i) => i !== null);

    if (validComments.length > 0) {
      await this.newPostCommentRepository.insertMany(validComments);
    }

    if (validComments.length < messages.length) {
      Logger.instance.warn(
        `${messages.length - validComments.length} invalid comments skipped in batch`,
      );
    }
  }

  public async getUserComments(
    userId: string,
    wasRead: boolean | undefined,
    page: number,
    limit: number,
  ): Promise<TNewPostComment[]> {
    return await this.newPostCommentRepository.findByRecipientId(
      userId,
      wasRead,
      page,
      limit,
    );
  }
}

export default NewPostCommentService;
