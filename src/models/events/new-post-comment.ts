import { model, Schema, Types, type InferSchemaType } from "mongoose";
import { z } from "zod";

const collectionName = "newPostComments";

const schema = new Schema(
  {
    commentId: { type: Schema.Types.UUID, required: true },
    postId: { type: Schema.Types.UUID, required: true },
    postAuthorId: { type: Schema.Types.UUID, required: true },
    commentAuthorId: { type: Schema.Types.UUID, required: true },
    parentCommentId: { type: Schema.Types.UUID, default: null },
    parentCommentAuthorId: { type: Schema.Types.UUID, default: null },
    wasRead: { type: Boolean, default: false },
  },
  { collection: collectionName, timestamps: true },
);

const NewPostComment = model(collectionName, schema);

type TNewPostComment = InferSchemaType<typeof schema>;

const NewPostCommentDtoSchema = z.object({
  commentId: z.string().uuid(),
  postId: z.string().uuid(),
  postAuthorId: z.string().uuid(),
  commentAuthorId: z.string().uuid(),
  parentCommentId: z.string().uuid().nullable().optional(),
  parentCommentAuthorId: z.string().uuid().nullable().optional(),
  wasRead: z.boolean().default(false),
});

type TNewPostCommentDto = z.infer<typeof NewPostCommentDtoSchema>;

const dtoToModel = (dto: TNewPostCommentDto): Partial<TNewPostComment> => {
  return {
    commentId: new Types.UUID(dto.commentId),
    postId: new Types.UUID(dto.postId),
    postAuthorId: new Types.UUID(dto.postAuthorId),
    commentAuthorId: new Types.UUID(dto.commentAuthorId),
    parentCommentId: dto.parentCommentId
      ? new Types.UUID(dto.parentCommentId)
      : undefined,
    parentCommentAuthorId: dto.parentCommentAuthorId
      ? new Types.UUID(dto.parentCommentAuthorId)
      : undefined,
    wasRead: dto.wasRead,
  };
};

export { dtoToModel, NewPostCommentDtoSchema };

export type { TNewPostComment, TNewPostCommentDto };

export default NewPostComment;
