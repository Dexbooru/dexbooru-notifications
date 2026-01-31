import type { BunRequest } from "bun";
import type { AppCookieMap } from "../middleware/cookie-parser";

export interface AppRequest extends Request {
  cookies?: AppCookieMap;
  parsedBody?: unknown;
  parsedQuery?: unknown;
  context?: Record<string, unknown>;
}

export interface AppBunRequest extends Omit<BunRequest, "cookies"> {
  cookies?: AppCookieMap;
  parsedBody?: unknown;
  parsedQuery?: unknown;
  context?: Record<string, unknown>;
}
