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

    const eventChannelName = `events-${session.userId}`;

    return {
      eventChannelName,
      userId: session.userId.toString(),
    };
  }
}

export type { TGlobalEventData };

export default EventService;
