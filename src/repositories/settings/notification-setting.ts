import BaseRepository from "../../core/base-repository";
import type { TNotificationSetting } from "../../models/settings/notification-setting";
import NotificationSetting from "../../models/settings/notification-setting";

const repositoryName = "NotificationSettingRepository";

class NotificationSettingRepository extends BaseRepository<TNotificationSetting> {
  constructor() {
    super(repositoryName, NotificationSetting);
  }

  public async findByUserId(
    userId: string,
  ): Promise<TNotificationSetting | null> {
    try {
      return await this.model.findOne({ userId }).exec();
    } catch (error) {
      throw error;
    }
  }

  public async updateByUserId(
    userId: string,
    data: Partial<TNotificationSetting>,
  ): Promise<TNotificationSetting | null> {
    try {
      return await this.model
        .findOneAndUpdate({ userId }, data, { new: true })
        .exec();
    } catch (error) {
      throw error;
    }
  }

  public async deleteByUserId(userId: string): Promise<boolean> {
    try {
      const result = await this.model.findOneAndDelete({ userId }).exec();
      return !!result;
    } catch (error) {
      throw error;
    }
  }
}

export default NotificationSettingRepository;
