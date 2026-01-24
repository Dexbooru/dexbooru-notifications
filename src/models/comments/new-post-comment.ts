import { Schema, model } from "mongoose";
import type { InferSchemaType } from "mongoose";

const collectionName = "newPostComments";

const schema = new Schema(
  {
    commentId: { type: Schema.Types.ObjectId, required: true },
    commentAuthorId: { type: Schema.Types.ObjectId, required: true },
    postAuthorId: { type: Schema.Types.ObjectId, required: true },
    postId: { type: Schema.Types.ObjectId, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: collectionName },
);

const NewPostCommentNotification = model(collectionName, schema);

type TNewPostCommentNotification = InferSchemaType<typeof schema>;
type NewPostCommentNotificationDTO = Omit<
  TNewPostCommentNotification,
  "commentId" | "commentAuthorId" | "postAuthorId" | "postId" | "createdAt"
> & {
  id: string;
  commentId: string;
  commentAuthorId: string;
  postAuthorId: string;
  postId: string;
  createdAt: string;
};

export type { TNewPostCommentNotification, NewPostCommentNotificationDTO };
export default NewPostCommentNotification;
