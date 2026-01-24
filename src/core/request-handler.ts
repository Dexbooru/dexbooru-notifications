import type { BunRequest, Server } from "bun";
import { parseCookies } from "./middleware/cookie-parser";

type RouteHandler = (req: BunRequest) => Response | Promise<Response>;

export default class RequestHandler {
  constructor(private routes: Map<string, RouteHandler>) {}

  public handle(req: Request, server: Server<undefined>): Response | Promise<Response> | undefined {
    const url = new URL(req.url);
    if (url.pathname === "/events") {
      if (server.upgrade(req)) {
        return undefined;
      }
      return new Response("Upgrade failed", { status: 500 });
    }

    // Parse cookies middleware
    parseCookies(req);

    const method = req.method.toUpperCase();
    const routeKey = `${method}:${url.pathname}`;
    const handler = this.routes.get(routeKey);

    if (handler) {
      return handler(req as BunRequest);
    }

    const pathSuffix = `:${url.pathname}`;
    for (const key of this.routes.keys()) {
      if (key.endsWith(pathSuffix)) {
        return new Response("Method Not Allowed", { status: 405 });
      }
    }

    return new Response("Not Found", { status: 404 });
  }
}
