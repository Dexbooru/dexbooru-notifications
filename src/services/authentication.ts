import DependencyInjectionContainer from "../core/dependency-injection-container";
import RepositoryTokens from "../core/tokens/repositories";
import type { UserSessionRepository } from "../repositories";
import type { TUserSession } from "../models/authentication/session";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Types } from "mongoose";

type TJwtPayload = jwt.JwtPayload & {
  id: string;
};

class AuthenticationService {
  public static readonly DEXBOORU_WEBAPP_COOKIE_KEY = "token";
  public static readonly DEXBOORU_NOTIFICATIONS_COOKIE_KEY =
    "dexbooru-notifications-session";

  private static readonly SESSION_ID_SIZE = 32;
  private static readonly SESSION_EXPIRATION_DAYS = 7;

  private readonly userSessionRepository: UserSessionRepository;

  constructor() {
    this.userSessionRepository =
      DependencyInjectionContainer.instance.getService<UserSessionRepository>(
        RepositoryTokens.UserSessionRepository,
      );
  }

  private verifyAndDecodeJwt(token: string): TJwtPayload {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined in environment variables");
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
      });

      return decoded as TJwtPayload;
    } catch (error) {
      throw new Error(`Invalid jwt token for the following reason: ${error}`);
    }
  }

  private generateSessionId(size: number): string {
    return crypto.randomBytes(size).toString("hex");
  }

  public async exchangeJwtForSession(token: string) {
    const decodedPayload = this.verifyAndDecodeJwt(token);
    if (!decodedPayload) return null;

    const sessionToken = this.generateSessionId(
      AuthenticationService.SESSION_ID_SIZE,
    );

    const expiresAt = new Date();
    expiresAt.setDate(
      expiresAt.getDate() + AuthenticationService.SESSION_EXPIRATION_DAYS,
    );

    const newUserSession = await this.userSessionRepository.create({
      userId: new Types.UUID(decodedPayload.id),
      token: sessionToken,
      expiresAt,
    });

    return newUserSession;
  }

  public async validateSession(token: string): Promise<TUserSession | null> {
    const session = await this.userSessionRepository.findOne({ token });
    if (!session) {
      return null;
    }

    const now = new Date();

    if (session.expiresAt <= now) {
      return null;
    }

    return session;
  }
}

export default AuthenticationService;
