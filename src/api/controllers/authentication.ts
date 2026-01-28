import type { BunRequest } from "bun";
import BaseController from "../../core/base-controller";
import DependencyInjectionContainer from "../../core/dependency-injection-container";
import type { IController } from "../../core/interfaces/controller";
import ServiceTokens from "../../core/tokens/services";
import AuthenticationService from "../../services/authentication";
import Logger from "../../core/logger";
import AuthenticationMiddleware from "../../core/middleware/authentication";
import type { AppRequest } from "../../core/interfaces/request";

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
    const session = appRequest.context?.session;

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

      const session =
        await this.authenticationService.exchangeJwtForSession(originJwtToken);

      if (!session) {
        return this.error("Invalid token", 401);
      }

      const headers = new Headers();
      headers.append("Set-Cookie", session.token);

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
}

export default AuthenticationController;
