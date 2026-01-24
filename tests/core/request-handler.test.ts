import { describe, expect, test, mock } from "bun:test";
import RequestHandler from "../../src/core/request-handler";
import type { Server } from "bun";
import type { TGlobalEventData } from "../../src/services/events";

const mockServer = {
  upgrade: mock(() => false),
} as unknown as Server<TGlobalEventData>;

describe("RequestHandler", () => {
  test("should return 200 for valid route", async () => {
    const mockHandler = mock(() => new Response("OK"));
    const routes = new Map();
    routes.set("GET:/test", mockHandler);
    
    const handler = new RequestHandler(routes);
    
    const req = new Request("http://localhost/test", { method: "GET" });
    const res = await handler.handle(req, mockServer);
    expect(res!.status).toBe(200);
  });

  test("should return 404 for unknown path", async () => {
    const routes = new Map();
    const handler = new RequestHandler(routes);
    
    const req = new Request("http://localhost/unknown", { method: "GET" });
    const res = await handler.handle(req, mockServer);
    expect(res!.status).toBe(404);
  });

  test("should return 405 if path exists but method does not match", async () => {
    const mockHandler = mock(() => new Response("OK"));
    const routes = new Map();
    routes.set("GET:/test", mockHandler);
    
    const handler = new RequestHandler(routes);
    
    const req = new Request("http://localhost/test", { method: "POST" });
    const res = await handler.handle(req, mockServer);
    
    // Currently this will fail (it returns 404)
    expect(res!.status).toBe(405);
    expect(await res!.text()).toBe("Method Not Allowed");
  });
});
