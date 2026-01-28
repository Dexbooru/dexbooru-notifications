import DependencyInjectionContainer from "../core/dependency-injection-container";
import ServiceTokens from "../core/tokens/services";
import type AuthenticationService from "./authentication";

type TGlobalEventData = {
  eventChannelName: string;
  userId: string;
};

class EventService {
  private get authenticationService(): AuthenticationService {
    return DependencyInjectionContainer.instance.getService<AuthenticationService>(
      ServiceTokens.AuthenticationService,
    );
  }

  public async generateStreamingData(
    token: string,
  ): Promise<TGlobalEventData | null> {
    const session = await this.authenticationService.validateSession(token);
    if (!session) return null;

    const eventChannelName = this.getChannelName(session.userId.toString());

    return {
      eventChannelName,
      userId: session.userId.toString(),
    };
  }

  public getChannelName(userId: string): string {
    return `events-${userId}`;
  }

  public computeChannelKey(payload: unknown): string | null {
    // Basic heuristics to find target user ID
    if (typeof payload === "object" && payload !== null) {
      const p = payload as Record<string, unknown>;
      // Check common fields for target user
      if (typeof p.userId === "string") return this.getChannelName(p.userId);
      if (typeof p.receiverUserId === "string")
        return this.getChannelName(p.receiverUserId);
      if (typeof p.receiverId === "string")
        return this.getChannelName(p.receiverId);
    }
    return null;
  }
}

export type { TGlobalEventData };

export default EventService;
