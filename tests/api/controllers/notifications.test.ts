import { describe, expect, test, mock, beforeEach, afterEach } from "bun:test";
import NotificationsController from "../../../src/api/controllers/notifications";
import ServiceTokens from "../../../src/core/tokens/services";
import type { AppRequest } from "../../../src/core/interfaces/request";

// Mock FriendInviteService
const mockGetUserInvites = mock();
const mockFriendInviteService = {
  getUserInvites: mockGetUserInvites,
};

// Mock DependencyInjectionContainer
const mockGetService = mock((token: string) => {
  if (token === ServiceTokens.FriendInviteService) {
    return mockFriendInviteService;
  }
  return {};
});

mock.module("../../../src/core/dependency-injection-container", () => {
  return {
    default: {
      instance: {
        getService: mockGetService,
      }
    }
  };
});

describe("NotificationsController", () => {
  beforeEach(() => {
    mockGetUserInvites.mockClear();
    mockGetService.mockClear();
  });

  afterEach(() => {
    mock.restore();
  });

  test("should return 200 and notifications data", async () => {
    const controller = new NotificationsController();
    const mockSession = {
      userId: "user-123",
    };
    const mockInvites = [{ id: "invite-1" }];

    mockGetUserInvites.mockResolvedValue(mockInvites);

    const req = new Request("http://localhost/api/notifications?page=1&limit=20&read=false") as AppRequest;
    
    req.context = { session: mockSession };
    req.parsedQuery = { page: 1, limit: 20, read: false };

    const response = await controller.handleGet(req);
    const body = await response.json() as any;

    expect(response.status).toBe(200);
    expect(body.data.newFriendInvites).toEqual(mockInvites);
    expect(mockGetUserInvites).toHaveBeenCalledWith("user-123", false, 1, 20);
  });
});
