import { model, Schema, Types, type InferSchemaType } from "mongoose";
import { z } from "zod";

const collectionName = "newPostLikes";

const schema = new Schema(
  {
    postId: { type: Schema.Types.UUID, required: true },
    postAuthorId: { type: Schema.Types.UUID, required: true },
    likerUserId: { type: Schema.Types.UUID, required: true },
    totalLikes: { type: BigInt, required: true },
    wasRead: { type: Boolean, default: false },
  },
  { collection: collectionName, timestamps: true },
);

const NewPostLikeNotification = model(collectionName, schema);

type TNewPostLikeNotification = InferSchemaType<typeof schema>;

const NewPostLikeNotificationDtoSchema = z.object({
  postId: z.string().uuid(),
  postAuthorId: z.string().uuid(),
  likerUserId: z.string().uuid(),
  totalLikes: z
    .union([z.string(), z.number(), z.bigint()])
    .transform((val) => BigInt(val)),
  wasRead: z.boolean().default(false),
});

type TNewPostLikeNotificationDto = z.infer<
  typeof NewPostLikeNotificationDtoSchema
>;

const dtoToModel = (
  dto: TNewPostLikeNotificationDto,
): Partial<TNewPostLikeNotification> => {
  return {
    postId: new Types.UUID(dto.postId),
    postAuthorId: new Types.UUID(dto.postAuthorId),
    likerUserId: new Types.UUID(dto.likerUserId),
    totalLikes: dto.totalLikes,
    wasRead: dto.wasRead,
  };
};

export { dtoToModel, NewPostLikeNotificationDtoSchema };

export type { TNewPostLikeNotification, TNewPostLikeNotificationDto };

export default NewPostLikeNotification;
