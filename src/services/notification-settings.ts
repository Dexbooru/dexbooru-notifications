import DependencyInjectionContainer from "../core/dependency-injection-container";
import RepositoryTokens from "../core/tokens/repositories";
import type { NotificationSettingRepository } from "../repositories";
import type { TNotificationSetting } from "../models/settings/notification-setting";

class NotificationSettingService {
  private repository: NotificationSettingRepository;

  constructor() {
    this.repository =
      DependencyInjectionContainer.instance.getService<NotificationSettingRepository>(
        RepositoryTokens.NotificationSettingRepository,
      );
  }

  public async createSettings(
    userId: string,
    data: Omit<
      TNotificationSetting,
      "userId" | "_id" | "createdAt" | "updatedAt"
    >,
  ): Promise<TNotificationSetting> {
    const existing = await this.repository.findByUserId(userId);
    if (existing) {
      throw new Error("Settings already exist for this user");
    }

    const settingsData = {
      ...data,
      userId,
    } as unknown as Partial<TNotificationSetting>;

    return this.repository.create(settingsData);
  }

  public async getSettings(
    userId: string,
  ): Promise<TNotificationSetting | null> {
    return this.repository.findByUserId(userId);
  }

  public async updateSettings(
    userId: string,
    data: Partial<
      Omit<TNotificationSetting, "userId" | "_id" | "createdAt" | "updatedAt">
    >,
  ): Promise<TNotificationSetting | null> {
    const existing = await this.repository.findByUserId(userId);
    if (!existing) {
      return null;
    }
    return this.repository.updateByUserId(userId, data);
  }

  public async deleteSettings(userId: string): Promise<boolean> {
    return this.repository.deleteByUserId(userId);
  }
}

export default NotificationSettingService;
