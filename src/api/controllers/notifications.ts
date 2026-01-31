import BaseController from "../../core/base-controller";
import AuthenticationMiddleware from "../../core/middleware/authentication";
import { UrlQueryValidator } from "../../core/middleware/url-query-validator";
import { PaginationSchema } from "../../core/request-schemas/pagination";
import type { AppRequest } from "../../core/interfaces/request";
import DependencyInjectionContainer from "../../core/dependency-injection-container";
import ServiceTokens from "../../core/tokens/services";
import type FriendInviteService from "../../services/friend-invites";
import type NewPostCommentService from "../../services/new-post-comment";
import type NewPostLikeNotificationService from "../../services/new-post-like";
import type { TUserSession } from "../../models/authentication/session";
import { z } from "zod";

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
  private newPostCommentService: NewPostCommentService;
  private newPostLikeNotificationService: NewPostLikeNotificationService;

  constructor() {
    super("/notifications");
    this.friendInviteService =
      DependencyInjectionContainer.instance.getService<FriendInviteService>(
        ServiceTokens.FriendInviteService,
      );
    this.newPostCommentService =
      DependencyInjectionContainer.instance.getService<NewPostCommentService>(
        ServiceTokens.NewPostCommentService,
      );
    this.newPostLikeNotificationService =
      DependencyInjectionContainer.instance.getService<NewPostLikeNotificationService>(
        ServiceTokens.NewPostLikeNotificationService,
      );
    this.registerMiddleware("handleGet", [
      new AuthenticationMiddleware(),
      new UrlQueryValidator(NotificationQuerySchema),
    ]);
  }

  public override async handleGet(req: Request): Promise<Response> {
    const session = (req as AppRequest).context!.session as TUserSession;
    const { page, limit, read } = this.getParsedQuery<NotificationQuery>(req);

    const [newFriendInvites, newPostComments, newPostLikes] = await Promise.all(
      [
        this.friendInviteService.getUserInvites(
          session.userId.toString(),
          read,
          page,
          limit,
        ),
        this.newPostCommentService.getUserComments(
          session.userId.toString(),
          read,
          page,
          limit,
        ),
        this.newPostLikeNotificationService.getUserLikes(
          session.userId.toString(),
          read,
          page,
          limit,
        ),
      ],
    );

    const combinedNotifications = {
      newFriendInvites,
      newPostComments,
      newPostLikes,
    };

    return this.ok(
      "Notifications fetched successfully",
      200,
      combinedNotifications,
    );
  }
}
