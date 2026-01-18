import DependencyInjectionContainer from "../core/dependency-injection-container";
import RepositoryTokens from "../core/tokens/repositories";
import type {
  TCommentCreatedNotification,
  TCommentCreatedNotificationDto,
} from "../models/comment-creation-notification";
import type CommentCreationNotificationRepository from "../repositories/comment-creation-notification";

class CommentCreationNotificationService {
  private commentCreationNotificationRepository: CommentCreationNotificationRepository;

  constructor() {
    this.commentCreationNotificationRepository =
      DependencyInjectionContainer.instance.getService(
        RepositoryTokens.CommentCreationNotificationRepository
      );
  }

  public async addCommentNotification(rawData: TCommentCreatedNotificationDto) {
    const data = this.commentCreationNotificationRepository.dtoToModel(rawData);
    const newCommentNotification =
      await this.commentCreationNotificationRepository.create(data);

    return newCommentNotification;
  }
}

export default CommentCreationNotificationService;
