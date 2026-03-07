import type { BunRequest, Server } from "bun";
import { parseCookies } from "./middleware/cookie-parser";
import { AuthenticationService, type EventService } from "../services";
import DependencyInjectionContainer from "./dependency-injection-container";
import ServiceTokens from "./tokens/services";
import type { TGlobalEventData } from "../services/events";

type RouteHandler = (req: BunRequest) => Response | Promise<Response>;

export default class RequestHandler {
  private static readonly ALLOWED_METHODS = "POST, GET, OPTIONS, PUT, DELETE";
  private static readonly ALLOWED_HEADERS =
    "Content-Type, Authorization, Cookie, X-Requested-With";

  private routes: Map<string, RouteHandler>;
  private eventService: EventService;
  private allowedOrigins: string[];

  constructor(routes: Map<string, RouteHandler>) {
    this.routes = routes;
    this.eventService = DependencyInjectionContainer.instance.getService(
      ServiceTokens.EventService,
    );
    this.allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(",").map((o) => o.trim())
      : [];
  }

  private applyCors(req: Request, res: Response): Response {
    const origin = req.headers.get("Origin");
    let allowOrigin = "";

    if (this.allowedOrigins.length > 0) {
      if (origin && this.allowedOrigins.includes(origin)) {
        allowOrigin = origin;
      } else {
        allowOrigin = origin || "*";
      }
    } else {
      allowOrigin = origin || "*";
    }

    res.headers.set("Access-Control-Allow-Origin", allowOrigin);
    res.headers.set(
      "Access-Control-Allow-Methods",
      RequestHandler.ALLOWED_METHODS,
    );
    res.headers.set(
      "Access-Control-Allow-Headers",
      RequestHandler.ALLOWED_HEADERS,
    );
    res.headers.set("Access-Control-Allow-Credentials", "true");

    return res;
  }

  public async handle(
    req: Request,
    server: Server<TGlobalEventData>,
  ): Promise<Response | undefined> {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") {
      return this.applyCors(req, new Response(null, { status: 204 }));
    }

    if (url.pathname === "/events") {
      parseCookies(req);
      const token = (req as BunRequest).cookies?.get(
        AuthenticationService.DEXBOORU_NOTIFICATIONS_COOKIE_KEY,
      );

      if (!token) return new Response("Unauthorized", { status: 401 });

      const eventData = await this.eventService.generateStreamingData(token);
      if (!eventData) return new Response("Unauthorized", { status: 401 });

      if (server.upgrade(req, { data: eventData })) {
        return undefined;
      }
      return new Response("Upgrade failed", { status: 500 });
    }

    parseCookies(req);

    const method = req.method.toUpperCase();
    const routeKey = `${method}:${url.pathname}`;
    const handler = this.routes.get(routeKey);

    if (handler) {
      const response = await handler(req as BunRequest);
      return this.applyCors(req, response);
    }

    const isMethodMismatch = Array.from(this.routes.keys()).some((key) =>
      key.endsWith(`:${url.pathname}`),
    );

    const errorResponse = isMethodMismatch
      ? new Response("Method Not Allowed", { status: 405 })
      : new Response("Not Found", { status: 404 });

    return this.applyCors(req, errorResponse);
  }
}
