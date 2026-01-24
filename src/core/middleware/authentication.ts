import BaseMiddleware from "../base-middleware";
import { AuthenticationService } from "../../services";
import DependencyInjectionContainer from "../dependency-injection-container";
import ServiceTokens from "../tokens/services";
import { parseCookies } from "./cookie-parser";
import type { AppRequest } from "../interfaces/request";

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
    const appReq = req as AppRequest;
    const cookies = appReq.cookies;
    
    // Cookie map might not be initialized if parseCookies failed or something, but parseCookies ensures it is.
    // However, TypeScript might complain if we don't check.
    const sessionToken = cookies?.get(AuthenticationService.DEXBOORU_NOTIFICATIONS_COOKIE_KEY);

    if (!sessionToken) {
      return new Response("Unauthorized: No session token provided", { status: 401 });
    }

    const session = await this.authenticationService.validateSession(sessionToken);

    if (!session) {
      return new Response("Unauthorized: Invalid or expired session token", { status: 401 });
    }

    // Initialize context if it doesn't exist
    if (!appReq.context) {
        appReq.context = {};
    }
    
    appReq.context.session = session;

    return this.next(req);
  }
}
