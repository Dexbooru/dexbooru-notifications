import BaseController from "../../core/base-controller";
import AuthenticationMiddleware from "../../core/middleware/authentication";
import { UrlQueryValidator } from "../../core/middleware/url-query-validator";
import { PaginationSchema } from "../../core/request-schemas/pagination";
import type { AppRequest } from "../../core/interfaces/request";
import DependencyInjectionContainer from "../../core/dependency-injection-container";
import ServiceTokens from "../../core/tokens/services";
import type FriendInviteService from "../../services/friend-invites";
import { z } from "zod";
import Logger from "../../core/logger";

const NotificationQuerySchema = PaginationSchema.extend({
  read: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }),
});

type NotificationQuery = z.infer<typeof NotificationQuerySchema>;

export default class NotificationsController extends BaseController {
  private friendInviteService: FriendInviteService;

  constructor() {
    super("/notifications");
    this.friendInviteService =
      DependencyInjectionContainer.instance.getService<FriendInviteService>(
        ServiceTokens.FriendInviteService,
      );
    this.registerMiddleware("handleGet", [
      new AuthenticationMiddleware(),
      new UrlQueryValidator(NotificationQuerySchema),
    ]);
  }

  public override async handleGet(req: Request): Promise<Response> {
    try {
      const { session } = (req as AppRequest).context!;
      const { page, limit, read } = this.getParsedQuery<NotificationQuery>(req);

      const newFriendInvites = await this.friendInviteService.getUserInvites(
        session.userId,
        read,
        page,
        limit,
      );

      const combinedNotifications = {
        newFriendInvites,
      };

      return this.ok(
        "Notifications fetched successfully",
        200,
        combinedNotifications,
      );
    } catch (error) {
      Logger.instance.error(
        "An unexpected error occured while fetching user notifications",
        error,
      );

      return this.error(
        "An unexpected error occured while fetching user notifications",
        500,
      );
    }
  }
}
