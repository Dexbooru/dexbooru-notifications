import { Schema, type InferSchemaType } from "mongoose";
import mongoose from "mongoose";

const collectionName = "commentNotifications";

const schema = new Schema(
  {
    commentId: { type: mongoose.Types.ObjectId, required: true },
    postId: { type: mongoose.Types.ObjectId, required: true },
    authorId: { type: mongoose.Types.ObjectId, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, required: true },
  },
  { collection: collectionName },
);

const CommentCreatedNotification = mongoose.model(
  "CommentCreatedNotification",
  schema,
);

type TCommentCreatedNotification = InferSchemaType<typeof schema>;
type TCommentCreatedNotificationDto = {
  id: string;
  postId: string;
  commentId: string;
  authorId: string;
  content: string;
  createdAt: Date;
};

export { CommentCreatedNotification };
export type { TCommentCreatedNotification, TCommentCreatedNotificationDto };
