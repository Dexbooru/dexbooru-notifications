import mongoose from "mongoose";
import BaseRepository from "../core/base-repository";
import { CommentCreatedNotification } from "../models/comment-creation-notification";
import type {
  TCommentCreatedNotification,
  TCommentCreatedNotificationDto,
} from "../models/comment-creation-notification";

const repositoryName = "CommentCreationNotificationRepository";

class CommentCreationNotificationRepository extends BaseRepository<TCommentCreatedNotification> {
  constructor() {
    super(repositoryName, CommentCreatedNotification);
  }

  public dtoToModel(
    data: TCommentCreatedNotificationDto
  ): TCommentCreatedNotification {
    return {
      commentId: new mongoose.Types.ObjectId(data.commentId),
      postId: new mongoose.Types.ObjectId(data.postId),
      authorId: new mongoose.Types.ObjectId(data.authorId),
      content: data.content,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    };
  }
}

export default CommentCreationNotificationRepository;
