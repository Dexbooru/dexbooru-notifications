import {
  describe,
  expect,
  test,
  mock,
  beforeEach,
  afterEach,
  spyOn,
} from "bun:test";
import AuthenticationController from "../../../src/api/controllers/authentication";
import { AuthenticationService } from "../../../src/services";
import ServiceTokens from "../../../src/core/tokens/services";
import { AppCookieMap } from "../../../src/core/middleware/cookie-parser";
import type { AppRequest } from "../../../src/core/interfaces/request";
import DependencyInjectionContainer from "../../../src/core/dependency-injection-container";

// Mock AuthenticationService
const mockExchangeJwtForSession = mock();
const mockAuthService = {
  exchangeJwtForSession: mockExchangeJwtForSession,
};

// Mock Logger
const mockLoggerError = mock();
mock.module("../../../src/core/logger", () => {
  return {
    default: {
      instance: {
        error: mockLoggerError,
        info: mock(),
      },
    },
  };
});

describe("AuthenticationController", () => {
  let getServiceSpy: any;

  beforeEach(() => {
    mockExchangeJwtForSession.mockClear();
    mockLoggerError.mockClear();

    getServiceSpy = spyOn(
      DependencyInjectionContainer.instance,
      "getService",
    ).mockImplementation((token: string) => {
      if (token === ServiceTokens.AuthenticationService) {
        return mockAuthService as any;
      }
      return {} as any;
    });
  });

  afterEach(() => {
    getServiceSpy.mockRestore();
    mock.restore();
  });

  test("should return 200 and session token if cookie is present and valid", async () => {
    const mockSession = {
      token: "test-session-token",
      expiresAt: new Date("2026-01-01"),
      issuedAt: new Date("2025-12-31"),
    };
    mockExchangeJwtForSession.mockResolvedValue({
      session: mockSession,
      cookie: `${AuthenticationService.DEXBOORU_NOTIFICATIONS_COOKIE_KEY}=test-session-token; Path=/; HttpOnly; Max-Age=604800`,
    });

    // Instantiate controller
    const controller = new AuthenticationController();

    // Create a request with Cookie header
    const req = new Request("http://localhost/api/auth", {
      method: "POST",
      headers: {
        Cookie: `${AuthenticationService.DEXBOORU_WEBAPP_COOKIE_KEY}=validtoken`,
      },
    }) as AppRequest;

    // Manually set cookies
    req.cookies = new AppCookieMap(req.headers.get("Cookie"));

    // Call handlePost
    const response = await controller.handlePost(req);
    const body = (await response.json()) as {
      data: { expiresAt: string; issuedAt: string };
    };

    // Verify
    expect(response.status).toBe(200);
    expect(body.data).toEqual({
      expiresAt: mockSession.expiresAt.toISOString(),
      issuedAt: mockSession.issuedAt.toISOString(),
    });

    const setCookie = response.headers.get("Set-Cookie");
    expect(setCookie).toContain(
      `${AuthenticationService.DEXBOORU_NOTIFICATIONS_COOKIE_KEY}=test-session-token`,
    );
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Max-Age=");

    expect(mockExchangeJwtForSession).toHaveBeenCalledWith("validtoken");
  });

  test("should return 400 if cookie is missing", async () => {
    const controller = new AuthenticationController();

    const req = new Request("http://localhost/api/auth", {
      method: "POST",
    }) as AppRequest;

    // Manually set cookies
    req.cookies = new AppCookieMap(req.headers.get("Cookie"));

    const response = await controller.handlePost(req);
    expect(response.status).toBe(400);
  });

  test("should return 200 and session data for GET request", async () => {
    const controller = new AuthenticationController();
    const mockSession = {
      userId: "user-123",
      issuedAt: new Date("2025-12-31"),
    };

    const req = new Request("http://localhost/api/auth", {
      method: "GET",
    }) as AppRequest;

    req.context = { session: mockSession };

    const response = await controller.handleGet(req);
    const body = (await response.json()) as {
      data: { authenticated: boolean; userId: string; issuedAt: string };
    };

    expect(response.status).toBe(200);
    expect(body.data.authenticated).toBe(true);
    expect(body.data.userId).toBe("user-123");
    expect(body.data.issuedAt).toBe(mockSession.issuedAt.toISOString());
  });
});
