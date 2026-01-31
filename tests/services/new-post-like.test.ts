import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import NewPostLikeNotificationService from "../../src/services/new-post-like";
import DependencyInjectionContainer from "../../src/core/dependency-injection-container";
import RepositoryTokens from "../../src/core/tokens/repositories";
import type {
  TNewPostLikeNotificationDto,
  TNewPostLikeNotification,
} from "../../src/models/events/new-post-like";

// Mock Repository
const mockInsertMany = mock();
const mockFindByRecipientId = mock();

const mockRepository = {
  insertMany: mockInsertMany,
  findByRecipientId: mockFindByRecipientId,
};

// Mock Logger
const mockWarn = mock();
const mockInfo = mock();
const mockError = mock();
mock.module("../../src/core/logger", () => {
  return {
    default: {
      instance: {
        warn: mockWarn,
        info: mockInfo,
        error: mockError,
      },
    },
  };
});

// Mock Model helpers
const mockDtoToModel = mock((dto: any) => dto); // Identity transformation for simplicity in test
mock.module("../../src/models/events/new-post-like", () => {
  return {
    dtoToModel: mockDtoToModel,
  };
});

describe("NewPostLikeNotificationService", () => {
  let service: NewPostLikeNotificationService;

  beforeEach(() => {
    mockInsertMany.mockClear();
    mockFindByRecipientId.mockClear();
    mockWarn.mockClear();
    mockDtoToModel.mockClear();

    DependencyInjectionContainer.instance.clear();
    DependencyInjectionContainer.instance.add(
      RepositoryTokens.NewPostLikeNotificationRepository,
      mockRepository,
    );
    service = new NewPostLikeNotificationService();
  });

  afterEach(() => {
    mock.restore();
  });

  test("should process batch using insertMany", async () => {
    const payload: TNewPostLikeNotificationDto[] = [
      {
        postId: "00000000-0000-0000-0000-000000000001",
        postAuthorId: "00000000-0000-0000-0000-000000000002",
        likerUserId: "00000000-0000-0000-0000-000000000003",
        totalLikes: 10n,
        wasRead: false,
      },
      {
        postId: "00000000-0000-0000-0000-000000000004",
        postAuthorId: "00000000-0000-0000-0000-000000000005",
        likerUserId: "00000000-0000-0000-0000-000000000006",
        totalLikes: "100", // Zod will transform this in real life, here we mock it
        wasRead: false,
      } as any,
    ];

    mockInsertMany.mockResolvedValue([]);
    mockDtoToModel.mockImplementation((d) => d); // Passthrough

    await service.processBatch(payload);

    expect(mockInsertMany).toHaveBeenCalled();
    const calls = mockInsertMany.mock.calls;
    if (!calls || !calls[0]) throw new Error("no calls");
    const args = calls[0][0];
    if (!args) throw new Error("args is undefined");
    expect(args).toEqual(payload);
    expect(mockWarn).not.toHaveBeenCalled();
  });

  test("should warn when valid likes are less than total messages", async () => {
    const payload: TNewPostLikeNotificationDto[] = [
      {
        postId: "1",
        postAuthorId: "2",
        likerUserId: "3",
        totalLikes: 1n,
        wasRead: false,
      } as any,
    ];

    // Simulate dtoToModel returning null for the item
    mockDtoToModel.mockReturnValue(null);

    await service.processBatch(payload);

    expect(mockInsertMany).not.toHaveBeenCalled();
    expect(mockWarn).toHaveBeenCalled();
  });

  test("should call findByRecipientId when getting user likes", async () => {
    const userId = "user-123";
    const wasRead = false;
    const page = 1;
    const limit = 20;
    const mockLikes = [
      { id: "like-1" },
    ] as unknown as TNewPostLikeNotification[];

    mockFindByRecipientId.mockResolvedValue(mockLikes);

    const result = await service.getUserLikes(userId, wasRead, page, limit);

    expect(result).toBe(mockLikes);
    expect(mockFindByRecipientId).toHaveBeenCalledWith(
      userId,
      wasRead,
      page,
      limit,
    );
  });
});
