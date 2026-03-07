import BaseController from "../../core/base-controller";
import AuthenticationMiddleware from "../../core/middleware/authentication";
import { BodyValidator } from "../../core/middleware/request-validator";
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

const MarkAsReadBodySchema = z.object({
  all: z.boolean().optional().default(false),
  notificationIds: z
    .object({
      newPostLikeIds: z.array(z.string()).optional().default([]),
      newPostCommentIds: z.array(z.string()).optional().default([]),
      friendInviteIds: z.array(z.string()).optional().default([]),
    })
    .optional()
    .default({
      newPostCommentIds: [],
      friendInviteIds: [],
      newPostLikeIds: [],
    }),
});

type MarkAsReadBody = z.infer<typeof MarkAsReadBodySchema>;

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
    this.registerMiddleware("handlePatch", [
      new AuthenticationMiddleware(),
      new BodyValidator(MarkAsReadBodySchema),
    ]);
  }

  public override async handleGet(req: Request): Promise<Response> {
    const session = (req as AppRequest).context!.session as TUserSession;
    const sessionUserId = session.userId.toString();

    const { page, limit, read } = this.getParsedQuery<NotificationQuery>(req);

    const [newFriendInvites, newPostComments, newPostLikes] = await Promise.all(
      [
        this.friendInviteService.getUserInvites(
          sessionUserId,
          read,
          page,
          limit,
        ),
        this.newPostCommentService.getUserComments(
          sessionUserId,
          read,
          page,
          limit,
        ),
        this.newPostLikeNotificationService.getUserLikes(
          sessionUserId,
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

  public override async handlePatch(req: Request): Promise<Response> {
    const session = (req as AppRequest).context!.session as TUserSession;
    const sessionUserId = session.userId.toString();
    const { all, notificationIds } = this.getParsedBody<MarkAsReadBody>(req);

    let totalMarked = 0;

    if (all) {
      const [likes, comments, invites] = await Promise.all([
        this.newPostLikeNotificationService.markAllAsRead(sessionUserId),
        this.newPostCommentService.markAllAsRead(sessionUserId),
        this.friendInviteService.markAllAsRead(sessionUserId),
      ]);
      totalMarked = likes + comments + invites;
    } else {
      const { newPostLikeIds, newPostCommentIds, friendInviteIds } =
        notificationIds;

      const results = await Promise.all([
        newPostLikeIds.length > 0
          ? this.newPostLikeNotificationService.markAsRead(
              sessionUserId,
              newPostLikeIds,
            )
          : 0,
        newPostCommentIds.length > 0
          ? this.newPostCommentService.markAsRead(
              sessionUserId,
              newPostCommentIds,
            )
          : 0,
        friendInviteIds.length > 0
          ? this.friendInviteService.markAsRead(sessionUserId, friendInviteIds)
          : 0,
      ]);
      totalMarked = results.reduce((sum, count) => sum + count, 0);
    }

    return this.ok("Notifications marked as read", 200, {
      markedCount: totalMarked,
    });
  }
}
