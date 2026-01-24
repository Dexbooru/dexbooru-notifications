import { describe, expect, test, mock, beforeEach } from "bun:test";
import EventService from "../../src/services/events";
import DependencyInjectionContainer from "../../src/core/dependency-injection-container";
import ServiceTokens from "../../src/core/tokens/services";

// Mock AuthenticationService
const mockValidateSession = mock();
const mockAuthService = {
  validateSession: mockValidateSession,
};

describe("EventService", () => {
  beforeEach(() => {
    mockValidateSession.mockClear();
    // Register mock service
    DependencyInjectionContainer.instance.add(
      ServiceTokens.AuthenticationService, 
      mockAuthService
    );
  });

  test("should generate streaming data for valid session", async () => {
    const userId = "user-123";
    mockValidateSession.mockResolvedValue({ userId });

    const eventService = new EventService();
    const token = "valid-token";
    const result = await eventService.generateStreamingData(token);

    expect(result).toBeDefined();
    expect(result?.eventChannelName).toBe(`events-${userId}`);
    expect(result?.userId).toBe(userId);
    expect(mockValidateSession).toHaveBeenCalledWith(token);
  });

  test("should return null for invalid session", async () => {
    mockValidateSession.mockResolvedValue(null);

    const eventService = new EventService();
    const token = "invalid-token";
    const result = await eventService.generateStreamingData(token);

    expect(result).toBeNull();
    expect(mockValidateSession).toHaveBeenCalledWith(token);
  });
});