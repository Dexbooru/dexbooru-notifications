import type { BunRequest } from "bun";
import BaseController from "../../core/base-controller";
import DependencyInjectionContainer from "../../core/dependency-injection-container";
import type { IController } from "../../core/interfaces/controller";
import ServiceTokens from "../../core/tokens/services";
import AuthenticationService from "../../services/authentication";
import Logger from "../../core/logger";

const controllerName = "AuthenticationController";

class AuthenticationController extends BaseController implements IController {
  public name: string = controllerName;

  private authenticationService: AuthenticationService;

  constructor() {
    super("/auth");
    this.authenticationService =
      DependencyInjectionContainer.instance.getService<AuthenticationService>(
        ServiceTokens.AuthenticationService,
      );
  }

  public override async handlePost(request: Request): Promise<Response> {
    try {
      const token = (request as BunRequest).cookies.get(
        AuthenticationService.DEXBOORU_WEBAPP_COOKIE_KEY,
      );

      if (!token) {
        return this.error("Token cookie is required", 400);
      }

      const sessionToken =
        await this.authenticationService.exchangeJwtForSession(token);

      if (!sessionToken) {
        return this.error("Invalid token", 401);
      }

      const headers = new Headers();
      headers.append("Set-Cookie", sessionToken.token);

      return this.ok(
        "Session created successfully",
        200,
        {
          expiresAt: sessionToken.expiresAt,
          issuedAt: sessionToken.issuedAt,
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
