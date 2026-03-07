import { describe, expect, test, mock, beforeAll, afterEach } from "bun:test";
import RequestHandler from "../../src/core/request-handler";
import type { Server } from "bun";
import type { TGlobalEventData } from "../../src/services/events";
import DependencyInjectionContainer from "../../src/core/dependency-injection-container";
import ServiceTokens from "../../src/core/tokens/services";

const mockServer = {
  upgrade: mock(() => false),
} as unknown as Server<TGlobalEventData>;

describe("RequestHandler", () => {
  const originalEnv = process.env.CORS_ALLOWED_ORIGINS;

  beforeAll(() => {
    DependencyInjectionContainer.instance.add(ServiceTokens.EventService, {
      generateStreamingData: mock(() => Promise.resolve(null)),
    });
  });

  afterEach(() => {
    process.env.CORS_ALLOWED_ORIGINS = originalEnv;
  });

  test("should return 200 and CORS headers for valid route", async () => {
    const mockHandler = mock(() => new Response("OK"));
    const routes = new Map();
    routes.set("GET:/test", mockHandler);

    const handler = new RequestHandler(routes);
    const req = new Request("http://localhost/test", {
      method: "GET",
      headers: { Origin: "http://localhost:3000" },
    });

    const res = await handler.handle(req, mockServer);

    expect(res!.status).toBe(200);
    expect(res!.headers.get("Access-Control-Allow-Origin")).toBe(
      "http://localhost:3000",
    );
  });

  test("should return 405 for method mismatch", async () => {
    const routes = new Map();
    routes.set("GET:/test", () => new Response("OK"));

    const handler = new RequestHandler(routes);
    const req = new Request("http://localhost/test", { method: "POST" });
    const res = await handler.handle(req, mockServer);

    expect(res!.status).toBe(405);
    expect(await res!.text()).toBe("Method Not Allowed");
  });

  describe("CORS Handling", () => {
    test("should return specific origin when allowed origins match", async () => {
      process.env.CORS_ALLOWED_ORIGINS =
        "http://allowed.com,http://another.com";
      const handler = new RequestHandler(new Map());
      const req = new Request("http://localhost/test", {
        method: "OPTIONS",
        headers: { Origin: "http://allowed.com" },
      });

      const res = await handler.handle(req, mockServer);
      expect(res!.headers.get("Access-Control-Allow-Origin")).toBe(
        "http://allowed.com",
      );
    });

    test("should fallback to all origins when origin is not in list", async () => {
      process.env.CORS_ALLOWED_ORIGINS =
        "http://allowed.com,http://another.com";
      const handler = new RequestHandler(new Map());

      const req = new Request("http://localhost/test", {
        method: "OPTIONS",
        headers: { Origin: "http://forbidden.com" },
      });

      const res = await handler.handle(req, mockServer);

      expect(res!.headers.get("Access-Control-Allow-Origin")).toBe(
        "http://forbidden.com",
      );
    });

    test("should echo origin when no allowed origins configured", async () => {
      process.env.CORS_ALLOWED_ORIGINS = "";
      const handler = new RequestHandler(new Map());

      const req = new Request("http://localhost/test", {
        method: "OPTIONS",
        headers: { Origin: "http://random.com" },
      });

      const res = await handler.handle(req, mockServer);

      expect(res!.headers.get("Access-Control-Allow-Origin")).toBe(
        "http://random.com",
      );
    });
  });
});
