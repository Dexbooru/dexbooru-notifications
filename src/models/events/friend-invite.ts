import { model, Schema, Types, type InferSchemaType } from "mongoose";
import { z } from "zod";

const collectionName = "friendInvites";

const schema = new Schema(
  {
    senderUserId: { type: Schema.Types.UUID, required: true },
    receiverUserId: { type: Schema.Types.UUID, required: true, index: true },
    requestSentAt: { type: Date, required: true },
    wasRead: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ["SENT", "ACCEPTED"],
      default: "SENT",
      required: true,
    },
  },
  { collection: collectionName, timestamps: true },
);

const FriendInvite = model(collectionName, schema);

type TFriendInvite = InferSchemaType<typeof schema>;

const FriendInviteDtoSchema = z.object({
  senderUserId: z.uuid(),
  receiverUserId: z.uuid(),
  requestSentAt: z.string().transform((arg) => new Date(arg)),
  wasRead: z.boolean().default(false),
  status: z.enum(["SENT", "ACCEPTED"]).default("SENT"),
});

type TFriendInviteDto = z.infer<typeof FriendInviteDtoSchema>;

const dtoToModel = (dto: TFriendInviteDto): Partial<TFriendInvite> => {
  return {
    senderUserId: new Types.UUID(dto.senderUserId),
    receiverUserId: new Types.UUID(dto.receiverUserId),
    requestSentAt: new Date(dto.requestSentAt),
    wasRead: dto.wasRead,
    status: dto.status,
  };
};

export { dtoToModel, FriendInviteDtoSchema };

export type { TFriendInvite, TFriendInviteDto };

export default FriendInvite;
