import { describe, test, expect, mock, beforeEach, afterEach } from "bun:test";
import NewPostCommentService from "../../src/services/new-post-comment";
import DependencyInjectionContainer from "../../src/core/dependency-injection-container";
import RepositoryTokens from "../../src/core/tokens/repositories";
import type {
  TNewPostCommentDto,
  TNewPostComment,
} from "../../src/models/events/new-post-comment";

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
mock.module("../../src/models/events/new-post-comment", () => {
  return {
    dtoToModel: mockDtoToModel,
  };
});

describe("NewPostCommentService", () => {
  let service: NewPostCommentService;

  beforeEach(() => {
    mockInsertMany.mockClear();
    mockFindByRecipientId.mockClear();
    mockWarn.mockClear();
    mockDtoToModel.mockClear();

    DependencyInjectionContainer.instance.clear();
    DependencyInjectionContainer.instance.add(
      RepositoryTokens.NewPostCommentRepository,
      mockRepository,
    );
    service = new NewPostCommentService();
  });

  afterEach(() => {
    mock.restore();
  });

  test("should process batch using insertMany", async () => {
    const payload: TNewPostCommentDto[] = [
      {
        postId: "00000000-0000-0000-0000-000000000001",
        postAuthorId: "00000000-0000-0000-0000-000000000002",
        commentAuthorId: "00000000-0000-0000-0000-000000000003",
        commentContent: "Nice post!",
        wasRead: false,
      },
      {
        postId: "00000000-0000-0000-0000-000000000004",
        postAuthorId: "00000000-0000-0000-0000-000000000005",
        commentAuthorId: "00000000-0000-0000-0000-000000000006",
        commentContent: "Thanks!",
        parentCommentId: "00000000-0000-0000-0000-000000000001",
        parentCommentAuthorId: "00000000-0000-0000-0000-000000000003",
        wasRead: false,
      },
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

  test("should warn when valid comments are less than total messages", async () => {
    const payload: TNewPostCommentDto[] = [
      {
        postId: "1", // Invalid, but our mockDtoToModel might pass it unless we simulate filtering
        postAuthorId: "2",
        commentAuthorId: "3",
        commentContent: "test",
        wasRead: false,
      } as any,
    ];

    // Simulate dtoToModel returning null for the item
    mockDtoToModel.mockReturnValue(null);

    await service.processBatch(payload);

    expect(mockInsertMany).not.toHaveBeenCalled();
    expect(mockWarn).toHaveBeenCalled();
  });

  test("should call findByRecipientId when getting user comments", async () => {
    const userId = "user-123";
    const wasRead = false;
    const page = 1;
    const limit = 20;
    const mockComments = [{ id: "comment-1" }] as unknown as TNewPostComment[];

    mockFindByRecipientId.mockResolvedValue(mockComments);

    const result = await service.getUserComments(userId, wasRead, page, limit);

    expect(result).toBe(mockComments);
    expect(mockFindByRecipientId).toHaveBeenCalledWith(
      userId,
      wasRead,
      page,
      limit,
    );
  });
});
