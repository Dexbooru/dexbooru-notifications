import { describe, expect, test, mock, beforeEach, afterEach } from "bun:test";
import NotificationSettingController from "../../../src/api/controllers/notification-settings";
import ServiceTokens from "../../../src/core/tokens/services";
import type { AppRequest } from "../../../src/core/interfaces/request";

// Mock Services
const mockCreateSettings = mock();
const mockGetSettings = mock();
const mockUpdateSettings = mock();
const mockDeleteSettings = mock();

const mockService = {
  createSettings: mockCreateSettings,
  getSettings: mockGetSettings,
  updateSettings: mockUpdateSettings,
  deleteSettings: mockDeleteSettings,
};

// Mock DependencyInjectionContainer
const mockGetService = mock((token: string) => {
  if (token === ServiceTokens.NotificationSettingService) {
    return mockService;
  }
  // Allow AuthenticationService mock if needed by middleware instantiation in constructor?
  // The controller constructor instantiates AuthenticationMiddleware, which gets AuthenticationService.
  // We should probably mock that too to avoid errors in constructor.
  return { validateSession: mock() };
});

mock.module("../../../src/core/dependency-injection-container", () => {
  return {
    default: {
      instance: {
        getService: mockGetService,
      },
    },
  };
});

describe("NotificationSettingController", () => {
  beforeEach(() => {
    mockCreateSettings.mockClear();
    mockGetSettings.mockClear();
    mockUpdateSettings.mockClear();
    mockDeleteSettings.mockClear();
    mockGetService.mockClear();
  });

  afterEach(() => {
    mock.restore();
  });

  const userId = "550e8400-e29b-41d4-a716-446655440000";
  const session = {
    userId,
    token: "tok",
    expiresAt: new Date(),
    issuedAt: new Date(),
  };

  const validSettingsData = {
    receiveRealTimeCommentNotifications: true,
    receiveRealTimePostNotifications: true,
    receiveRealTimeCollectionNotifications: true,
    receiveEmailCommentNotifications: true,
    receiveEmailPostNotifications: true,
    receiveEmailCollectionNotifications: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  test("handleGet should return 200 and settings", async () => {
    const controller = new NotificationSettingController();
    mockGetSettings.mockResolvedValue({ ...validSettingsData, userId });

    const req = new Request("http://localhost/api/settings", {
      method: "GET",
    }) as AppRequest;
    req.context = { session: session };

    const response = await controller.handleGet(req);
    const body = (await response.json()) as any;

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      ...validSettingsData,
      userId,
      createdAt: validSettingsData.createdAt.toISOString(),
      updatedAt: validSettingsData.updatedAt.toISOString(),
    });
    expect(mockGetSettings).toHaveBeenCalledWith(userId);
  });

  test("handleGet should return 404 if settings not found", async () => {
    const controller = new NotificationSettingController();
    mockGetSettings.mockResolvedValue(null);

    const req = new Request("http://localhost/api/settings", {
      method: "GET",
    }) as AppRequest;
    req.context = { session: session };

    const response = await controller.handleGet(req);
    expect(response.status).toBe(404);
  });

  test("handleGet should return 401 if not authenticated", async () => {
    const controller = new NotificationSettingController();
    const req = new Request("http://localhost/api/settings", {
      method: "GET",
    }) as AppRequest;
    // No context/session

    const response = await controller.handleGet(req);
    expect(response.status).toBe(401);
  });

  test("handlePost should return 201 and created settings", async () => {
    const controller = new NotificationSettingController();
    mockCreateSettings.mockResolvedValue({ ...validSettingsData, userId });

    const req = new Request("http://localhost/api/settings", {
      method: "POST",
    }) as AppRequest;
    req.context = { session: session };
    req.parsedBody = validSettingsData;

    const response = await controller.handlePost(req);
    const body = (await response.json()) as any;

    expect(response.status).toBe(201);
    expect(body.data).toEqual({
      ...validSettingsData,
      userId,
      createdAt: validSettingsData.createdAt.toISOString(),
      updatedAt: validSettingsData.updatedAt.toISOString(),
    });
    expect(mockCreateSettings).toHaveBeenCalledWith(userId, validSettingsData);
  });

  test("handlePost should return 409 if settings already exist", async () => {
    const controller = new NotificationSettingController();
    mockCreateSettings.mockRejectedValue(
      new Error("Settings already exist for this user"),
    );

    const req = new Request("http://localhost/api/settings", {
      method: "POST",
    }) as AppRequest;
    req.context = { session: session };
    req.parsedBody = validSettingsData;

    const response = await controller.handlePost(req);
    expect(response.status).toBe(409);
  });

  test("handlePut should return 200 and updated settings", async () => {
    const controller = new NotificationSettingController();
    const updateData = { receiveRealTimeCommentNotifications: false };
    mockUpdateSettings.mockResolvedValue({
      ...validSettingsData,
      userId,
      ...updateData,
    });

    const req = new Request("http://localhost/api/settings", {
      method: "PUT",
    }) as AppRequest;
    req.context = { session: session };
    req.parsedBody = updateData;

    const response = await controller.handlePut(req);
    const body = (await response.json()) as any;

    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      ...validSettingsData,
      userId,
      ...updateData,
      createdAt: validSettingsData.createdAt.toISOString(),
      updatedAt: validSettingsData.updatedAt.toISOString(),
    });
    expect(mockUpdateSettings).toHaveBeenCalledWith(userId, updateData);
  });

  test("handlePut should return 404 if settings not found", async () => {
    const controller = new NotificationSettingController();
    mockUpdateSettings.mockResolvedValue(null);

    const req = new Request("http://localhost/api/settings", {
      method: "PUT",
    }) as AppRequest;
    req.context = { session: session };
    req.parsedBody = {};

    const response = await controller.handlePut(req);
    expect(response.status).toBe(404);
  });

  test("handleDelete should return 200 if deleted", async () => {
    const controller = new NotificationSettingController();
    mockDeleteSettings.mockResolvedValue(true);

    const req = new Request("http://localhost/api/settings", {
      method: "DELETE",
    }) as AppRequest;
    req.context = { session: session };

    const response = await controller.handleDelete(req);
    expect(response.status).toBe(200);
    expect(mockDeleteSettings).toHaveBeenCalledWith(userId);
  });

  test("handleDelete should return 404 if not found", async () => {
    const controller = new NotificationSettingController();
    mockDeleteSettings.mockResolvedValue(false);

    const req = new Request("http://localhost/api/settings", {
      method: "DELETE",
    }) as AppRequest;
    req.context = { session: session };

    const response = await controller.handleDelete(req);
    expect(response.status).toBe(404);
  });
});
