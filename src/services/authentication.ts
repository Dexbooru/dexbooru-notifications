import DependencyInjectionContainer from "../core/dependency-injection-container";
import RepositoryTokens from "../core/tokens/repositories";
import type { UserSessionRepository } from "../repositories";
import type { TUserSession } from "../models/authentication/session";
import jwt, { type JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import { Types } from "mongoose";

type TJwtPayload = jwt.JwtPayload & {
  id: string;
};

class AuthenticationService {
  public static readonly DEXBOORU_WEBAPP_COOKIE_KEY = "dexbooru-session";
  public static readonly DEXBOORU_NOTIFICATIONS_COOKIE_KEY =
    "dexbooru-notifications-session";

  public static readonly SESSION_ID_SIZE = 32;
  public static readonly SESSION_EXPIRATION_DAYS = 7;
  public static readonly SESSION_COOKIE_MAX_AGE =
    AuthenticationService.SESSION_EXPIRATION_DAYS * 24 * 60;

  private readonly userSessionRepository: UserSessionRepository;

  constructor() {
    this.userSessionRepository =
      DependencyInjectionContainer.instance.getService<UserSessionRepository>(
        RepositoryTokens.UserSessionRepository,
      );
  }

  private buildSessionCookieData(token: string): string {
    const name = AuthenticationService.DEXBOORU_NOTIFICATIONS_COOKIE_KEY;
    const maxAge = AuthenticationService.SESSION_COOKIE_MAX_AGE;
    const isProd = process.env.NODE_ENV === "production";

    const cookieParts = [
      `${name}=${token}`,
      `Max-Age=${maxAge}`,
      `Path=/`,
      `HttpOnly`,
      `SameSite=Lax`,
    ];

    if (isProd) {
      cookieParts.push("Secure");
    }

    return cookieParts.join("; ");
  }

  private verifyAndDecodeJwt(token: string): JwtPayload | null {
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
      return null;
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

    const cookieContent = this.buildSessionCookieData(newUserSession.token);

    return {
      session: newUserSession,
      cookie: cookieContent,
    };
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

  public async invalidateSession(token: string): Promise<boolean> {
    return this.userSessionRepository.deleteByToken(token);
  }

  public buildClearSessionCookie(): string {
    const name = AuthenticationService.DEXBOORU_NOTIFICATIONS_COOKIE_KEY;
    const isProd = process.env.NODE_ENV === "production";

    const cookieParts = [
      `${name}=`,
      `Max-Age=0`,
      `Path=/`,
      `HttpOnly`,
      `SameSite=Lax`,
    ];

    if (isProd) {
      cookieParts.push("Secure");
    }

    return cookieParts.join("; ");
  }
}

export default AuthenticationService;
