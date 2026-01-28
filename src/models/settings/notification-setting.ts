import { model, Schema, type InferSchemaType } from "mongoose";

const collectionName = "settings";

const schema = new Schema(
  {
    userId: { type: Schema.Types.UUID, required: true, index: true, unique: true },
    receiveRealTimeCommentNotifications: { type: Boolean, required: true },
    receiveRealTimePostNotifications: { type: Boolean, required: true },
    receiveRealTimeCollectionNotifications: { type: Boolean, required: true },
    receiveEmailCommentNotifications: { type: Boolean, required: true },
    receiveEmailPostNotifications: { type: Boolean, required: true },
    receiveEmailCollectionNotifications: { type: Boolean, required: true },
  },
  { collection: collectionName, timestamps: true },
);

const NotificationSetting = model(collectionName, schema);

export type TNotificationSetting = InferSchemaType<typeof schema>;

export const toResponseDTO = (setting: TNotificationSetting) => {
  return {
    userId: setting.userId,
    receiveRealTimeCommentNotifications: setting.receiveRealTimeCommentNotifications,
    receiveRealTimePostNotifications: setting.receiveRealTimePostNotifications,
    receiveRealTimeCollectionNotifications: setting.receiveRealTimeCollectionNotifications,
    receiveEmailCommentNotifications: setting.receiveEmailCommentNotifications,
    receiveEmailPostNotifications: setting.receiveEmailPostNotifications,
    receiveEmailCollectionNotifications: setting.receiveEmailCollectionNotifications,
    createdAt: setting.createdAt,
    updatedAt: setting.updatedAt,
  };
};

export default NotificationSetting;
