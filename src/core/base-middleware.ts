export default abstract class BaseMiddleware {
  private nextMiddleware: BaseMiddleware | null = null;
  private controllerHandler: ((req: Request) => Promise<Response>) | null =
    null;

  public setNext(next: BaseMiddleware): void {
    this.nextMiddleware = next;
  }

  public setHandler(handler: (req: Request) => Promise<Response>): void {
    this.controllerHandler = handler;
  }

  protected async next(req: Request): Promise<Response> {
    if (this.nextMiddleware) {
      return this.nextMiddleware.run(req);
    }
    if (this.controllerHandler) {
      return this.controllerHandler(req);
    }
    return new Response("Internal Server Error: No handler configured", {
      status: 500,
    });
  }

  public abstract run(req: Request): Promise<Response>;
}
