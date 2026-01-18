import type { BunRequest, Server } from "bun";

type RouteHandler = (req: BunRequest) => Response | Promise<Response>;

export default class RequestHandler {
  constructor(private routes: Map<string, RouteHandler>) {}

  public handle(req: Request, server: Server): Response | Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === "/events") {
      if (server.upgrade(req)) {
        return undefined as any;
      }
      return new Response("Upgrade failed", { status: 500 });
    }

    const method = req.method.toUpperCase();
    const routeKey = `${method}:${url.pathname}`;
    const handler = this.routes.get(routeKey);

    if (handler) {
      return handler(req as BunRequest);
    }

    return new Response("Not Found", { status: 404 });
  }
}
