import { describe, expect, test, mock, beforeEach, afterEach } from "bun:test";
import FriendInviteRepository from "../../../src/repositories/events/friend-invite";

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
mock.module("../../../src/models/events/friend-invite", () => {
  return {
    default: mockModel,
    dtoToModel: (d: any) => d,
  };
});

describe("FriendInviteRepository", () => {
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

  test("should find by receiver id with pagination and filters", async () => {
    const repo = new FriendInviteRepository();
    const receiverId = "user-123";
    const wasRead = false;
    const page = 2;
    const limit = 10;
    const mockResult = [{ id: "invite-1" }];

    mockExec.mockResolvedValue(mockResult);

    const result = await repo.findByReceiverId(
      receiverId,
      wasRead,
      page,
      limit,
    );

    expect(result).toBe(mockResult as any);

    // Check filter
    expect(mockFind).toHaveBeenCalledWith({
      receiverUserId: receiverId,
      wasRead: wasRead,
    });

    // Check sort
    expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });

    // Check skip (page 2, limit 10 -> skip 10)
    expect(mockSkip).toHaveBeenCalledWith(10);

    // Check limit
    expect(mockLimit).toHaveBeenCalledWith(10);
  });
});
