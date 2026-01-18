import { Schema } from "mongoose";
import mongoose from "mongoose";

const collectionName = "postLikeNotifications";

const schema = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, required: true },
    totalLikes: { type: Schema.Types.BigInt, required: true },
    sentAt: { type: Date, required: true, default: Date.now },
  },
  { collection: collectionName }
);

const PostLikeNotification = mongoose.model("PostLikeNotification", schema);

export default PostLikeNotification;
