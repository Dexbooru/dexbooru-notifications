import { describe, expect, test, mock, beforeEach } from "bun:test";
import AuthenticationMiddleware from "../../src/core/middleware/authentication";
import { AuthenticationService } from "../../src/services";
import DependencyInjectionContainer from "../../src/core/dependency-injection-container";
import ServiceTokens from "../../src/core/tokens/services";
import type { AppRequest } from "../../src/core/interfaces/request";

// Mock AuthenticationService
const mockValidateSession = mock();
const mockAuthService = {
  validateSession: mockValidateSession,
};

describe("Authentication Middleware", () => {
  beforeEach(() => {
    mockValidateSession.mockClear();
    // Register mock service
    DependencyInjectionContainer.instance.add(
      ServiceTokens.AuthenticationService, 
      mockAuthService
    );
  });

  test("should call next if session is valid and attach session to context", async () => {
    const mockSession = { userId: "user-123" };
    mockValidateSession.mockResolvedValue(mockSession);
    
    const middleware = new AuthenticationMiddleware();
    const req = new Request("http://localhost", {
      headers: {
        "Cookie": `${AuthenticationService.DEXBOORU_NOTIFICATIONS_COOKIE_KEY}=valid-token`
      }
    });

    const mockNextHandler = mock(() => Promise.resolve(new Response("OK")));
    middleware.setHandler(mockNextHandler);

    const response = await middleware.run(req);

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("OK");
    expect(mockValidateSession).toHaveBeenCalledWith("valid-token");
    
    // Check context
    expect((req as AppRequest).context).toBeDefined();
    expect((req as AppRequest).context?.session).toEqual(mockSession);
  });

  test("should return 401 if session is invalid", async () => {
    mockValidateSession.mockResolvedValue(null);
    
    const middleware = new AuthenticationMiddleware();
    const req = new Request("http://localhost", {
      headers: {
        "Cookie": `${AuthenticationService.DEXBOORU_NOTIFICATIONS_COOKIE_KEY}=invalid-token`
      }
    });

    const mockNextHandler = mock(() => Promise.resolve(new Response("OK")));
    middleware.setHandler(mockNextHandler);

    const response = await middleware.run(req);

    expect(response.status).toBe(401);
    expect(await response.text()).toContain("Unauthorized");
    expect(mockValidateSession).toHaveBeenCalledWith("invalid-token");
    expect(mockNextHandler).not.toHaveBeenCalled();
  });

  test("should return 401 if no cookie is provided", async () => {
    const middleware = new AuthenticationMiddleware();
    const req = new Request("http://localhost");

    const mockNextHandler = mock(() => Promise.resolve(new Response("OK")));
    middleware.setHandler(mockNextHandler);

    const response = await middleware.run(req);

    expect(response.status).toBe(401);
    expect(await response.text()).toContain("Unauthorized");
    expect(mockValidateSession).not.toHaveBeenCalled();
    expect(mockNextHandler).not.toHaveBeenCalled();
  });
});