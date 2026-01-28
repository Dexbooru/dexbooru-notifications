import { z } from "zod";
import BaseController from "../../core/base-controller";
import DependencyInjectionContainer from "../../core/dependency-injection-container";
import ServiceTokens from "../../core/tokens/services";
import NotificationSettingService from "../../services/notification-settings";
import AuthenticationMiddleware from "../../core/middleware/authentication";
import { BodyValidator } from "../../core/middleware/request-validator";
import type { AppRequest } from "../../core/interfaces/request";
import { toResponseDTO } from "../../models/settings/notification-setting";

const controllerName = "NotificationSettingController";

const createSettingsSchema = z.object({
  receiveRealTimeCommentNotifications: z.boolean(),
  receiveRealTimePostNotifications: z.boolean(),
  receiveRealTimeCollectionNotifications: z.boolean(),
  receiveEmailCommentNotifications: z.boolean(),
  receiveEmailPostNotifications: z.boolean(),
  receiveEmailCollectionNotifications: z.boolean(),
});

const updateSettingsSchema = createSettingsSchema.partial();

class NotificationSettingController extends BaseController {
  public name: string = controllerName;
  private service: NotificationSettingService;

  constructor() {
    super("/settings");
    this.service =
      DependencyInjectionContainer.instance.getService<NotificationSettingService>(
        ServiceTokens.NotificationSettingService,
      );

    const authMiddleware = new AuthenticationMiddleware();

    this.registerMiddleware("handleGet", [authMiddleware]);
    this.registerMiddleware("handlePost", [
      authMiddleware,
      new BodyValidator(createSettingsSchema),
    ]);
    this.registerMiddleware("handlePut", [
      authMiddleware,
      new BodyValidator(updateSettingsSchema),
    ]);
    this.registerMiddleware("handleDelete", [authMiddleware]);
  }

  public override async handleGet(request: Request): Promise<Response> {
    const appRequest = request as AppRequest;
    const userId = appRequest.context?.session?.userId;

    if (!userId) {
      return this.error("Unauthorized", 401);
    }

    const settings = await this.service.getSettings(userId.toString());

    if (!settings) {
      return this.error("Settings not found", 404);
    }

    return this.ok(
      "Settings retrieved successfully",
      200,
      toResponseDTO(settings),
    );
  }

  public override async handlePost(request: Request): Promise<Response> {
    const appRequest = request as AppRequest;
    const userId = appRequest.context?.session?.userId;

    if (!userId) {
      return this.error("Unauthorized", 401);
    }

    const data =
      this.getParsedBody<z.infer<typeof createSettingsSchema>>(request);

    try {
      const settings = await this.service.createSettings(
        userId.toString(),
        data,
      );
      return this.ok(
        "Settings created successfully",
        201,
        toResponseDTO(settings),
      );
    } catch (error: any) {
      if (error.message === "Settings already exist for this user") {
        return this.error(error.message, 409);
      }
      return this.error(`Internal server error: ${error}`, 500);
    }
  }

  public override async handlePut(request: Request): Promise<Response> {
    const appRequest = request as AppRequest;
    const userId = appRequest.context?.session?.userId;

    if (!userId) {
      return this.error("Unauthorized", 401);
    }

    const data =
      this.getParsedBody<z.infer<typeof updateSettingsSchema>>(request);

    const settings = await this.service.updateSettings(userId.toString(), data);

    if (!settings) {
      return this.error("Settings not found", 404);
    }

    return this.ok(
      "Settings updated successfully",
      200,
      toResponseDTO(settings),
    );
  }

  public override async handleDelete(request: Request): Promise<Response> {
    const appRequest = request as AppRequest;
    const userId = appRequest.context?.session?.userId;

    if (!userId) {
      return this.error("Unauthorized", 401);
    }

    const result = await this.service.deleteSettings(userId.toString());

    if (!result) {
      return this.error("Settings not found", 404);
    }

    return this.ok("Settings deleted successfully", 200);
  }
}

export default NotificationSettingController;
