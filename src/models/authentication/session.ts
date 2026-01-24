import { model, Schema, type InferSchemaType } from "mongoose";

const collectionName = "sessions";

const schema = new Schema(
  {
    userId: { type: Schema.Types.UUID, required: true },
    token: { type: String, required: true, index: true },
    issuedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { collection: collectionName },
);

const UserSession = model(collectionName, schema);

type TUserSession = InferSchemaType<typeof schema>;

export type { TUserSession };

export default UserSession;
