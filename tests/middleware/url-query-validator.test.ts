import { describe, expect, test, mock } from "bun:test";
import { z } from "zod";
import { UrlQueryValidator } from "../../src/core/middleware/url-query-validator";
import type { AppRequest } from "../../src/core/interfaces/request";

const schema = z.object({
  page: z.coerce.number().min(1),
  search: z.string().optional(),
  tags: z.string().transform((val) => val.split(",")).optional(),
});

describe("UrlQueryValidator Middleware", () => {
  test("should call next if validation passes with correct types", async () => {
    const middleware = new UrlQueryValidator(schema);
    
    // page=2 (number coercion), search=hello
    const req = new Request("http://localhost/api?page=2&search=hello");

    const mockNextHandler = mock(() => Promise.resolve(new Response("OK")));
    middleware.setHandler(mockNextHandler);

    const response = await middleware.run(req);
    
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("OK");
    
    const parsedQuery = (req as AppRequest).parsedQuery as z.infer<typeof schema>;
    expect(parsedQuery.page).toBe(2);
    expect(parsedQuery.search).toBe("hello");
  });

  test("should handle transformations correctly", async () => {
    const middleware = new UrlQueryValidator(schema);
    
    // page=1, tags=a,b,c
    const req = new Request("http://localhost/api?page=1&tags=a,b,c");

    const mockNextHandler = mock(() => Promise.resolve(new Response("OK")));
    middleware.setHandler(mockNextHandler);

    await middleware.run(req);
    
    const parsedQuery = (req as AppRequest).parsedQuery as z.infer<typeof schema>;
    expect(parsedQuery.page).toBe(1);
    expect(parsedQuery.tags).toEqual(["a", "b", "c"]);
  });

  test("should return 400 if validation fails (coercion failure)", async () => {
    const middleware = new UrlQueryValidator(schema);
    
    // page=abc (cannot coerce to number)
    const req = new Request("http://localhost/api?page=abc");

    const mockNextHandler = mock(() => Promise.resolve(new Response("OK")));
    middleware.setHandler(mockNextHandler);

    const response = await middleware.run(req);
    
    expect(response.status).toBe(400);
    const body = await response.json() as { message: string; errors: any[] };
    expect(body.message).toBe("Validation Error");
    expect(body.errors[0].path).toContain("page");
    expect(mockNextHandler).not.toHaveBeenCalled();
  });

  test("should return 400 if validation fails (missing required field)", async () => {
    const middleware = new UrlQueryValidator(schema);
    
    // missing page
    const req = new Request("http://localhost/api?search=onlysearch");

    const mockNextHandler = mock(() => Promise.resolve(new Response("OK")));
    middleware.setHandler(mockNextHandler);

    const response = await middleware.run(req);
    
    expect(response.status).toBe(400);
    const body = await response.json() as { message: string; errors: any[] };
    expect(body.message).toBe("Validation Error");
    expect(body.errors[0].path).toContain("page");
    expect(mockNextHandler).not.toHaveBeenCalled();
  });

  test("should return 400 if validation fails (constraint violation)", async () => {
    const middleware = new UrlQueryValidator(schema);
    
    // page=0 (min(1) violation)
    const req = new Request("http://localhost/api?page=0");

    const mockNextHandler = mock(() => Promise.resolve(new Response("OK")));
    middleware.setHandler(mockNextHandler);

    const response = await middleware.run(req);
    
    expect(response.status).toBe(400);
    const body = await response.json() as { message: string; errors: any[] };
    expect(body.message).toBe("Validation Error");
    expect(body.errors[0].path).toContain("page");
  });
});
