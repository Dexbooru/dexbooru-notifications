import { describe, expect, test, mock } from "bun:test";
import { z } from "zod";
import { BodyValidator } from "../../src/core/middleware/request-validator";
import type { AppRequest } from "../../src/core/interfaces/request";

const schema = z.object({
  name: z.string(),
  age: z.number(),
});

describe("BodyValidator Middleware", () => {
  test("should call next if validation passes", async () => {
    const middleware = new BodyValidator(schema);
    const validBody = { name: "Test", age: 25 };
    
    // Mock request with json method
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify(validBody)
    });

    const mockNextHandler = mock(() => Promise.resolve(new Response("OK")));
    middleware.setHandler(mockNextHandler);

    const response = await middleware.run(req);
    
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("OK");
    expect((req as AppRequest).parsedBody).toEqual(validBody);
  });

  test("should return 400 if validation fails", async () => {
    const middleware = new BodyValidator(schema);
    const invalidBody = { name: "Test", age: "not a number" };
    
    const req = new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify(invalidBody)
    });

    const mockNextHandler = mock(() => Promise.resolve(new Response("OK")));
    middleware.setHandler(mockNextHandler);

    const response = await middleware.run(req);
    
    expect(response.status).toBe(400);
    const body = await response.json() as { message: string };
    expect(body.message).toBe("Validation Error");
    expect(mockNextHandler).not.toHaveBeenCalled();
  });

  test("should return 400 if body is invalid json", async () => {
    const middleware = new BodyValidator(schema);
    
    // Malformed JSON
    const req = new Request("http://localhost", {
      method: "POST",
      body: "{ name: 'Test', age: 25 " // missing closing brace
    });

    const mockNextHandler = mock(() => Promise.resolve(new Response("OK")));
    middleware.setHandler(mockNextHandler);

    const response = await middleware.run(req);
    
    expect(response.status).toBe(400);
    const body = await response.json() as { message: string };
    expect(body.message).toBe("Invalid JSON body");
  });
});
