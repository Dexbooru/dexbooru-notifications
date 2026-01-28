import { describe, expect, test, mock, beforeEach } from "bun:test";
import NotificationSettingService from "../../src/services/notification-settings";
import RepositoryTokens from "../../src/core/tokens/repositories";
import DependencyInjectionContainer from "../../src/core/dependency-injection-container";

const mockCreate = mock();
const mockFindByUserId = mock();
const mockUpdateByUserId = mock();
const mockDeleteByUserId = mock();

const mockRepo = {
  create: mockCreate,
  findByUserId: mockFindByUserId,
  updateByUserId: mockUpdateByUserId,
  deleteByUserId: mockDeleteByUserId,
};

describe("NotificationSettingService", () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockFindByUserId.mockClear();
    mockUpdateByUserId.mockClear();
    mockDeleteByUserId.mockClear();

    DependencyInjectionContainer.instance.add(RepositoryTokens.NotificationSettingRepository, mockRepo);
  });

  const validSettingsData = {
    receiveRealTimeCommentNotifications: true,
    receiveRealTimePostNotifications: true,
    receiveRealTimeCollectionNotifications: true,
    receiveEmailCommentNotifications: true,
    receiveEmailPostNotifications: true,
    receiveEmailCollectionNotifications: true,
  };

  const userId = "550e8400-e29b-41d4-a716-446655440000";

  describe("createSettings", () => {
    test("should create settings if they do not exist", async () => {
      mockFindByUserId.mockResolvedValue(null);
      mockCreate.mockResolvedValue({ ...validSettingsData, userId });

      const service = new NotificationSettingService();
      const result = await service.createSettings(userId, validSettingsData);

      expect(result).toEqual({ ...validSettingsData, userId });
      expect(mockFindByUserId).toHaveBeenCalledWith(userId);
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ ...validSettingsData, userId }));
    });

    test("should throw error if settings already exist", async () => {
      mockFindByUserId.mockResolvedValue({ ...validSettingsData, userId });

      const service = new NotificationSettingService();
      expect(service.createSettings(userId, validSettingsData)).rejects.toThrow("Settings already exist for this user");
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });

  describe("getSettings", () => {
    test("should return settings if found", async () => {
      mockFindByUserId.mockResolvedValue({ ...validSettingsData, userId });

      const service = new NotificationSettingService();
      const result = await service.getSettings(userId);

      expect(result).toEqual({ ...validSettingsData, userId });
      expect(mockFindByUserId).toHaveBeenCalledWith(userId);
    });

    test("should return null if not found", async () => {
      mockFindByUserId.mockResolvedValue(null);

      const service = new NotificationSettingService();
      const result = await service.getSettings(userId);

      expect(result).toBeNull();
    });
  });

  describe("updateSettings", () => {
    test("should update settings if found", async () => {
      mockFindByUserId.mockResolvedValue({ ...validSettingsData, userId });
      const updateData = { receiveRealTimeCommentNotifications: false };
      mockUpdateByUserId.mockResolvedValue({ ...validSettingsData, userId, ...updateData });

      const service = new NotificationSettingService();
      const result = await service.updateSettings(userId, updateData);

      expect(result).toEqual({ ...validSettingsData, userId, ...updateData });
      expect(mockUpdateByUserId).toHaveBeenCalledWith(userId, updateData);
    });

    test("should return null if settings not found for update", async () => {
      mockFindByUserId.mockResolvedValue(null);
      
      const service = new NotificationSettingService();
      const result = await service.updateSettings(userId, { receiveRealTimeCommentNotifications: false });

      expect(result).toBeNull();
      expect(mockUpdateByUserId).not.toHaveBeenCalled();
    });
  });

  describe("deleteSettings", () => {
    test("should delete settings", async () => {
      mockDeleteByUserId.mockResolvedValue(true);

      const service = new NotificationSettingService();
      const result = await service.deleteSettings(userId);

      expect(result).toBe(true);
      expect(mockDeleteByUserId).toHaveBeenCalledWith(userId);
    });
  });
});
