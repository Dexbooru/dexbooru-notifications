import type { BunRequest } from "bun";
import BaseController from "../../core/base-controller";
import DependencyInjectionContainer from "../../core/dependency-injection-container";
import type { IController } from "../../core/interfaces/controller";
import ServiceTokens from "../../core/tokens/services";
import AuthenticationService from "../../services/authentication";
import Logger from "../../core/logger";
import AuthenticationMiddleware from "../../core/middleware/authentication";
import type { AppRequest } from "../../core/interfaces/request";
import type { TUserSession } from "../../models/authentication/session";
import { parseCookies } from "../../core/middleware/cookie-parser";

const controllerName = "AuthenticationController";

class AuthenticationController extends BaseController implements IController {
  public name: string = controllerName;

  private readonly authenticationService: AuthenticationService;

  constructor() {
    super("/auth");
    this.authenticationService =
      DependencyInjectionContainer.instance.getService<AuthenticationService>(
        ServiceTokens.AuthenticationService,
      );

    this.registerMiddleware("handleGet", [new AuthenticationMiddleware()]);
  }

  public override async handleGet(request: Request): Promise<Response> {
    const appRequest = request as AppRequest;
    const session = appRequest.context?.session as TUserSession;

    return this.ok("Session status retrieved", 200, {
      authenticated: true,
      userId: session.userId,
      issuedAt: session.issuedAt,
    });
  }

  public override async handlePost(request: Request): Promise<Response> {
    try {
      const originJwtToken = (request as BunRequest).cookies.get(
        AuthenticationService.DEXBOORU_WEBAPP_COOKIE_KEY,
      );

      if (!originJwtToken) {
        return this.error("Token cookie is required", 400);
      }

      const exchangeData =
        await this.authenticationService.exchangeJwtForSession(originJwtToken);

      if (!exchangeData) {
        return this.error("Invalid token", 401);
      }

      const { session, cookie } = exchangeData;

      const headers = new Headers();
      headers.append("Set-Cookie", cookie);

      return this.ok(
        "Session created successfully",
        200,
        {
          expiresAt: session.expiresAt,
          issuedAt: session.issuedAt,
        },
        headers.toJSON(),
      );
    } catch (error) {
      Logger.instance.error(
        "An unexpected error occured while authenticating: ",
        error,
      );

      return this.error(`Internal server error: ${error}`, 500);
    }
  }

  public override async handleDelete(request: Request): Promise<Response> {
    try {
      parseCookies(request);
      const appReq = request as AppRequest;
      const token = appReq.cookies?.get(
        AuthenticationService.DEXBOORU_NOTIFICATIONS_COOKIE_KEY,
      );

      if (!token) {
        return this.error("No session token provided", 400);
      }

      await this.authenticationService.invalidateSession(token);

      const clearCookie = this.authenticationService.buildClearSessionCookie();

      const headers = new Headers();
      headers.append("Set-Cookie", clearCookie);

      return new Response(null, {
        status: 204,
        headers,
      });
    } catch (error) {
      Logger.instance.error(
        "An unexpected error occured while logging out: ",
        error,
      );

      return this.error(`Internal server error: ${error}`, 500);
    }
  }
}

export default AuthenticationController;
