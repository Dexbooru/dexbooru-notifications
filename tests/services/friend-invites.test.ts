import { describe, test, expect, mock, beforeEach } from "bun:test";
import FriendInviteService from "../../src/services/friend-invites";
import DependencyInjectionContainer from "../../src/core/dependency-injection-container";
import RepositoryTokens from "../../src/core/tokens/repositories";
import type {
  TFriendInvite,
  TFriendInviteDto,
} from "../../src/models/events/friend-invite";

// Mock Repository
const mockCreate = mock();
const mockFindById = mock();
const mockInsertMany = mock();
const mockFindByReceiverId = mock();

const mockRepository = {
  create: mockCreate,
  findById: mockFindById,
  insertMany: mockInsertMany,
  findByReceiverId: mockFindByReceiverId,
};

describe("FriendInviteService", () => {
  let service: FriendInviteService;

  beforeEach(() => {
    DependencyInjectionContainer.instance.clear();
    DependencyInjectionContainer.instance.add(
      RepositoryTokens.FriendInviteRepository,
      mockRepository,
    );
    service = new FriendInviteService();
    mockCreate.mockClear();
    mockFindById.mockClear();
    mockInsertMany.mockClear();
    mockFindByReceiverId.mockClear();
  });

  test("should process batch using insertMany", async () => {
    const payload: TFriendInviteDto[] = [
      {
        senderUserId: "00000000-0000-0000-0000-000000000001",
        receiverUserId: "00000000-0000-0000-0000-000000000002",
        requestSentAt: new Date(),
        wasRead: false,
        status: "SENT",
      },
      {
        senderUserId: "00000000-0000-0000-0000-000000000003",
        receiverUserId: "00000000-0000-0000-0000-000000000004",
        requestSentAt: new Date(),
        wasRead: false,
        status: "SENT",
      },
    ];

    mockInsertMany.mockResolvedValue([]);

    await service.processBatch(payload);

    expect(mockInsertMany).toHaveBeenCalled();
    const calls = mockInsertMany.mock.calls;
    if (!calls || !calls[0]) throw new Error("no calls");
    const args = calls[0][0] as Partial<TFriendInvite>[];
    if (!args || !args[0]) throw new Error("no args");
    expect(args).toHaveLength(2);
    expect(args[0].senderUserId).toBeDefined();
    expect(args[0].requestSentAt).toBeInstanceOf(Date);
  });

  test("should call findByReceiverId when getting user invites", async () => {
    const userId = "user-123";
    const wasRead = false;
    const page = 1;
    const limit = 20;
    const mockInvites = [{ id: "invite-1" }] as unknown as TFriendInvite[];

    mockFindByReceiverId.mockResolvedValue(mockInvites);

    const result = await service.getUserInvites(userId, wasRead, page, limit);

    expect(result).toBe(mockInvites);
    expect(mockFindByReceiverId).toHaveBeenCalledWith(
      userId,
      wasRead,
      page,
      limit,
    );
  });
});
