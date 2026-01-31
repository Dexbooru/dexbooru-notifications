import { z, ZodError } from "zod";
import BaseMiddleware from "../base-middleware";
import type { AppRequest } from "../interfaces/request";

export class UrlQueryValidator<T> extends BaseMiddleware {
  constructor(private schema: z.ZodType<T>) {
    super();
  }

  public async run(req: Request): Promise<Response> {
    try {
      const url = new URL(req.url);
      const queryParams = Object.fromEntries(url.searchParams.entries());
      
      const parsed = this.schema.parse(queryParams);
      
      (req as AppRequest).parsedQuery = parsed;

      return this.next(req);
    } catch (error) {
      if (error instanceof ZodError) {
        return new Response(JSON.stringify({
          status: 400,
          message: "Validation Error",
          errors: error.issues
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      return new Response(JSON.stringify({
          status: 400,
          message: "Invalid Query Parameters"
      }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
      });
    }
  }
}
