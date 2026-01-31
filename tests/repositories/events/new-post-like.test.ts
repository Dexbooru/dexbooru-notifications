import { describe, expect, test, mock, beforeEach, afterEach } from "bun:test";
import NewPostLikeNotificationRepository from "../../../src/repositories/events/new-post-like";

// Mock Mongoose Query Chain
const mockExec = mock();
const mockLimit = mock(() => ({ exec: mockExec }));
const mockSkip = mock(() => ({ limit: mockLimit }));
const mockSort = mock(() => ({ skip: mockSkip }));
const mockFind = mock(() => ({ sort: mockSort }));

const mockModel = {
  find: mockFind,
  // BaseRepository usage
  create: mock(),
  insertMany: mock(),
  findOne: mock(),
  findById: mock(),
  findByIdAndUpdate: mock(),
  findByIdAndDelete: mock(),
};

// Mock the module that exports the model
mock.module("../../../src/models/events/new-post-like", () => {
  return {
    default: mockModel,
    dtoToModel: (d: any) => d,
  };
});

describe("NewPostLikeNotificationRepository", () => {
  beforeEach(() => {
    mockFind.mockClear();
    mockSort.mockClear();
    mockSkip.mockClear();
    mockLimit.mockClear();
    mockExec.mockClear();
  });

  afterEach(() => {
    mock.restore();
  });

  test("should find by recipient id with pagination and filters", async () => {
    const repo = new NewPostLikeNotificationRepository();
    const recipientId = "user-123";
    const wasRead = true;
    const page = 3;
    const limit = 15;
    const mockResult = [{ id: "like-1" }];

    mockExec.mockResolvedValue(mockResult);

    const result = await repo.findByRecipientId(
      recipientId,
      wasRead,
      page,
      limit,
    );

    expect(result).toBe(mockResult as any);

    // Check filter
    expect(mockFind).toHaveBeenCalledWith({
      postAuthorId: recipientId,
      wasRead: wasRead,
    });

    // Check sort
    expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });

    // Check skip (page 3, limit 15 -> skip 30)
    expect(mockSkip).toHaveBeenCalledWith(30);

    // Check limit
    expect(mockLimit).toHaveBeenCalledWith(15);
  });

  test("should find by recipient id without wasRead filter if undefined", async () => {
    const repo = new NewPostLikeNotificationRepository();
    const recipientId = "user-123";
    const page = 1;
    const limit = 10;

    mockExec.mockResolvedValue([]);

    await repo.findByRecipientId(recipientId, undefined, page, limit);

    // Check filter
    expect(mockFind).toHaveBeenCalledWith({
      postAuthorId: recipientId,
    });
  });
});
