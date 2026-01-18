import type { IController } from "./interfaces/controller";

abstract class BaseController {
  private route: string;
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

  public ok(
    message: string,
    status: number = 200,
    data: unknown = null
  ): Response {
    const okBody = {
      status,
      message,
      data,
    };

    return new Response(JSON.stringify(okBody), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  public error(
    message: string,
    status: number = 500,
    data: unknown = null
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
