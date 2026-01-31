import { describe, expect, test, mock, beforeEach } from "bun:test";
import AuthenticationService from "../../src/services/authentication";
import RepositoryTokens from "../../src/core/tokens/repositories";
import jwt from "jsonwebtoken";
import DependencyInjectionContainer from "../../src/core/dependency-injection-container";
import type { TUserSession } from "../../src/models/authentication/session";

// Mock Repository
const mockCreate = mock();
const mockFindAll = mock();
const mockFindOne = mock();
const mockRepo = {
  create: mockCreate,
  findAll: mockFindAll,
  findOne: mockFindOne,
};

// Mock JWT
mock.module("jsonwebtoken", () => ({
  default: {
    verify: mock(),
  },
  verify: mock(),
}));

describe("AuthenticationService", () => {
  beforeEach(() => {
    mockCreate.mockClear();
    mockFindAll.mockClear();
    mockFindOne.mockClear();
    (jwt.verify as any).mockClear();
    process.env.JWT_SECRET = "test-secret";

    mockCreate.mockImplementation(async (data: any) => data);

    // Manually register the mock repo in the real container (it's a singleton)
    // We might need to clear it first or just overwrite
    DependencyInjectionContainer.instance.add(
      RepositoryTokens.UserSessionRepository,
      mockRepo,
    );
  });

  test("should exchange valid JWT for session with UUID", async () => {
    const uuid = "550e8400-e29b-41d4-a716-446655440000";
    (jwt.verify as any).mockReturnValue({ id: uuid });

    const authService = new AuthenticationService();
    const token = "valid-jwt";
    const result = await authService.exchangeJwtForSession(token);

    expect(result).toBeDefined();
    expect(result!.token.length).toBe(64); // hex of 32 bytes
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        token: result!.token,
      }),
    );
  });

  describe("validateSession", () => {
    test("should return null if session does not exist", async () => {
      mockFindOne.mockResolvedValue(null);
      const authService = new AuthenticationService();
      const session = await authService.validateSession("non-existent-token");
      expect(session).toBeNull();
      expect(mockFindOne).toHaveBeenCalledWith({ token: "non-existent-token" });
    });

    test("should return null if session is expired", async () => {
      const expiredDate = new Date();
      expiredDate.setDate(expiredDate.getDate() - 1);
      mockFindOne.mockResolvedValue({ expiresAt: expiredDate });

      const authService = new AuthenticationService();
      const session = await authService.validateSession("expired-token");
      expect(session).toBeNull();
    });

    test("should return session if session is valid", async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      const mockSession = {
        token: "token-123",
        userId: "some-id",
        issuedAt: new Date(),
        expiresAt: futureDate,
      } as unknown as TUserSession;
      mockFindOne.mockResolvedValue(mockSession);

      const authService = new AuthenticationService();
      const session = await authService.validateSession("valid-token");
      expect(session).toEqual(mockSession);
    });
  });
});
