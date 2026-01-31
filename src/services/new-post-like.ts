import DependencyInjectionContainer from "../core/dependency-injection-container";
import RepositoryTokens from "../core/tokens/repositories";
import NewPostLikeNotificationRepository from "../repositories/events/new-post-like";
import {
  dtoToModel,
  type TNewPostLikeNotification,
  type TNewPostLikeNotificationDto,
} from "../models/events/new-post-like";
import Logger from "../core/logger";

class NewPostLikeNotificationService {
  private newPostLikeNotificationRepository: NewPostLikeNotificationRepository;

  constructor() {
    this.newPostLikeNotificationRepository =
      DependencyInjectionContainer.instance.getService<NewPostLikeNotificationRepository>(
        RepositoryTokens.NewPostLikeNotificationRepository,
      );
  }

  public async processBatch(
    messages: TNewPostLikeNotificationDto[],
  ): Promise<void> {
    const validLikes = messages
      .map((msg) => dtoToModel(msg))
      .filter((i) => i !== null);

    if (validLikes.length > 0) {
      await this.newPostLikeNotificationRepository.insertMany(validLikes);
    }

    if (validLikes.length < messages.length) {
      Logger.instance.warn(
        `${messages.length - validLikes.length} invalid post likes skipped in batch`,
      );
    }
  }

  public async getUserLikes(
    userId: string,
    wasRead: boolean | undefined,
    page: number,
    limit: number,
  ): Promise<TNewPostLikeNotification[]> {
    return await this.newPostLikeNotificationRepository.findByRecipientId(
      userId,
      wasRead,
      page,
      limit,
    );
  }
}

export default NewPostLikeNotificationService;
