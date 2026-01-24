import { z, ZodError } from "zod";
import BaseMiddleware from "../base-middleware";
import type { AppRequest } from "../interfaces/request";

export class BodyValidator<T> extends BaseMiddleware {
  constructor(private schema: z.ZodType<T>) {
    super();
  }

  public async run(req: Request): Promise<Response> {
    try {
      const body = await req.json();
      const parsed = this.schema.parse(body);
      
      (req as AppRequest).parsedBody = parsed;

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
          message: "Invalid JSON body"
      }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
      });
    }
  }
}