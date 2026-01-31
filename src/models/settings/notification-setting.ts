import { model, Schema, type InferSchemaType } from "mongoose";

const collectionName = "settings";

const schema = new Schema(
  {
    userId: {
      type: Schema.Types.UUID,
      required: true,
      index: true,
      unique: true,
    },
    receiveRealTimeFriendInviteNotifications: { type: Boolean, required: true },
    receiveRealTimeCommentNotifications: { type: Boolean, required: true },
    receiveRealTimePostNotifications: { type: Boolean, required: true },
    receiveRealTimeCollectionNotifications: { type: Boolean, required: true },
    receiveEmailCommentNotifications: { type: Boolean, required: true },
    receiveEmailPostNotifications: { type: Boolean, required: true },
    receiveEmailCollectionNotifications: { type: Boolean, required: true },
    receiveEmailFriendInviteNotifications: { type: Boolean, required: true },
  },
  { collection: collectionName, timestamps: true },
);

const NotificationSetting = model(collectionName, schema);

type TNotificationSetting = InferSchemaType<typeof schema>;

type TNotificationSettingDto = {
  userId: string;
  receiveRealTimeFriendInviteNotifications: boolean;
  receiveRealTimeCommentNotifications: boolean;
  receiveRealTimePostNotifications: boolean;
  receiveRealTimeCollectionNotifications: boolean;
  receiveEmailCommentNotifications: boolean;
  receiveEmailPostNotifications: boolean;
  receiveEmailCollectionNotifications: boolean;
  receiveEmailFriendInviteNotifications: boolean;
  createdAt: string;
  updatedAt: string;
};

const toResponseDTO = (setting: TNotificationSetting) => {
  return {
    userId: setting.userId,
    receiveRealTimeFriendInviteNotifications:
      setting.receiveRealTimeFriendInviteNotifications,
    receiveRealTimeCommentNotifications:
      setting.receiveRealTimeCommentNotifications,
    receiveRealTimePostNotifications: setting.receiveRealTimePostNotifications,
    receiveRealTimeCollectionNotifications:
      setting.receiveRealTimeCollectionNotifications,
    receiveEmailCommentNotifications: setting.receiveEmailCommentNotifications,
    receiveEmailPostNotifications: setting.receiveEmailPostNotifications,
    receiveEmailCollectionNotifications:
      setting.receiveEmailCollectionNotifications,
    receiveEmailFriendInviteNotifications:
      setting.receiveEmailFriendInviteNotifications,
    createdAt: setting.createdAt,
    updatedAt: setting.updatedAt,
  };
};

export { toResponseDTO };

export type { TNotificationSetting, TNotificationSettingDto };

export default NotificationSetting;
