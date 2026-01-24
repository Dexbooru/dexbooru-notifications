import type { AppRequest } from "../interfaces/request";

export class AppCookieMap {
  private cookies: Map<string, string> = new Map();

  constructor(cookieHeader: string | null) {
    if (cookieHeader) {
      cookieHeader.split(";").forEach((cookie) => {
        const parts = cookie.split("=");
        const name = parts[0]?.trim();
        const value = parts.slice(1).join("=").trim();
        if (name) {
          this.cookies.set(name, value);
        }
      });
    }
  }

  get(name: string): string | undefined {
    return this.cookies.get(name);
  }

  // Add other methods from Bun's CookieMap if needed in the future
  getAll(): Record<string, string> {
    return Object.fromEntries(this.cookies);
  }

  has(name: string): boolean {
    return this.cookies.has(name);
  }
}

export function parseCookies(req: Request): void {
  const appReq = req as AppRequest;
  if (!appReq.cookies) {
    appReq.cookies = new AppCookieMap(req.headers.get("Cookie"));
  }
}
