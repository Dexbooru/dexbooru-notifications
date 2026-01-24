import BaseMiddleware from "../base-middleware";
import { AuthenticationService } from "../../services";
import DependencyInjectionContainer from "../dependency-injection-container";
import ServiceTokens from "../tokens/services";
import { parseCookies } from "./cookie-parser";
import type { BunRequest } from "bun";

export default class AuthenticationMiddleware extends BaseMiddleware {
  private authenticationService: AuthenticationService;

  constructor() {
    super();
    this.authenticationService = DependencyInjectionContainer.instance.getService<AuthenticationService>(
      ServiceTokens.AuthenticationService
    );
  }

  public async run(req: Request): Promise<Response> {
    parseCookies(req);
    const cookies = (req as BunRequest).cookies;
    const sessionToken = cookies.get(AuthenticationService.DEXBOORU_NOTIFICATIONS_COOKIE_KEY);

    if (!sessionToken) {
      return new Response("Unauthorized: No session token provided", { status: 401 });
    }

    const isValid = await this.authenticationService.validateSession(sessionToken);

    if (!isValid) {
      return new Response("Unauthorized: Invalid or expired session token", { status: 401 });
    }

    return this.next(req);
  }
}
