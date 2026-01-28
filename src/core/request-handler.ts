import type { BunRequest, Server } from "bun";
import { parseCookies } from "./middleware/cookie-parser";
import { AuthenticationService, type EventService } from "../services";
import DependencyInjectionContainer from "./dependency-injection-container";
import ServiceTokens from "./tokens/services";
import type { TGlobalEventData } from "../services/events";

type RouteHandler = (req: BunRequest) => Response | Promise<Response>;

export default class RequestHandler {
  private routes: Map<string, RouteHandler>;
  private eventService: EventService;

  constructor(routes: Map<string, RouteHandler>) {
    this.routes = routes;
    this.eventService = DependencyInjectionContainer.instance.getService(
      ServiceTokens.EventService,
    );
  }

  public async handle(
    req: Request,
    server: Server<TGlobalEventData>,
  ): Promise<Response | undefined> {
    const url = new URL(req.url);

    if (url.pathname === "/events") {
      parseCookies(req);
      const token = (req as BunRequest).cookies.get(
        AuthenticationService.DEXBOORU_NOTIFICATIONS_COOKIE_KEY,
      );

      if (!token) {
        return new Response("Unauthorized", { status: 401 });
      }

      const eventData = await this.eventService.generateStreamingData(token);
      if (!eventData) {
        return new Response("Unauthorized", { status: 401 });
      }

      if (
        server.upgrade(req, {
          data: eventData,
        })
      ) {
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
