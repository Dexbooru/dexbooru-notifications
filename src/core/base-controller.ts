import type { IController } from "./interfaces/controller";
import type BaseMiddleware from "./base-middleware";
import type { AppRequest } from "./interfaces/request";

abstract class BaseController {
  private route: string;
  protected middlewares: Map<string, BaseMiddleware[]> = new Map();

  public static readonly HTTP_METHODS = [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
  ];
  public static readonly BASE_ROUTE = "/api";

  constructor(route: string) {
    this.route = route;
  }

  public getRoute(): string {
    return this.route;
  }

  protected registerMiddleware(
    methodName: string,
    middlewares: BaseMiddleware[],
  ) {
    this.middlewares.set(methodName, middlewares);
  }

  public getMiddlewares(methodName: string): BaseMiddleware[] {
    return this.middlewares.get(methodName) || [];
  }

  protected getParsedBody<T>(request: Request): T {
    return (request as AppRequest).parsedBody as T;
  }

  protected getParsedQuery<T>(request: Request): T {
    return (request as AppRequest).parsedQuery as T;
  }

  public ok(
    message: string,
    status: number = 200,
    data: unknown = null,
    optionalHeaders: Record<string, string> = {},
  ): Response {
    const okBody = {
      status,
      message,
      data,
    };

    return new Response(JSON.stringify(okBody), {
      status,
      headers: { "Content-Type": "application/json", ...optionalHeaders },
    });
  }

  public error(
    message: string,
    status: number = 500,
    data: unknown = null,
  ): Response {
    const errorBody = {
      status,
      message,
      data,
    };

    return new Response(JSON.stringify(errorBody), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  protected handleGet?(request: Request): Promise<Response>;
  protected handlePost?(request: Request): Promise<Response>;
  protected handlePut?(request: Request): Promise<Response>;
  protected handleDelete?(request: Request): Promise<Response>;
  protected handlePatch?(request: Request): Promise<Response>;
}

export default BaseController;
