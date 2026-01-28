import { describe, test, expect, mock, beforeEach } from "bun:test";
import FriendInviteService from "../../src/services/friend-invites";
import DependencyInjectionContainer from "../../src/core/dependency-injection-container";
import RepositoryTokens from "../../src/core/tokens/repositories";
import type { TFriendInvite } from "../../src/models/events/friend-invite";

// Mock Repository
const mockCreate = mock();
const mockFindById = mock();
const mockInsertMany = mock();

const mockRepository = {
  create: mockCreate,
  findById: mockFindById,
  insertMany: mockInsertMany,
};

describe("FriendInviteService", () => {
  let service: FriendInviteService;

  beforeEach(() => {
    DependencyInjectionContainer.instance.clear();
    DependencyInjectionContainer.instance.add(
      RepositoryTokens.FriendInviteRepository,
      mockRepository
    );
    service = new FriendInviteService();
    mockCreate.mockClear();
    mockFindById.mockClear();
    mockInsertMany.mockClear();
  });

  test("should process batch using insertMany", async () => {
    const payload = [
      {
        senderUserId: "00000000-0000-0000-0000-000000000001",
        receiverUserId: "00000000-0000-0000-0000-000000000002",
        requestSentAt: new Date().toISOString(),
      },
      {
        senderUserId: "00000000-0000-0000-0000-000000000003",
        receiverUserId: "00000000-0000-0000-0000-000000000004",
        requestSentAt: new Date().toISOString(),
      }
    ];

    mockInsertMany.mockResolvedValue([]);

    await service.processBatch(payload);

    expect(mockInsertMany).toHaveBeenCalled();
    const args = mockInsertMany.mock.calls[0][0] as Partial<TFriendInvite>[];
    expect(args).toHaveLength(2);
    expect(args[0].senderUserId).toBeDefined();
    expect(args[0].requestSentAt).toBeInstanceOf(Date);
  });
});