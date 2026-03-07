import BasePublisher from "../core/base-publisher";
import DependencyInjectionContainer from "../core/dependency-injection-container";
import ServiceTokens from "../core/tokens/services";
import { Connection } from "rabbitmq-client";

class RealtimePublisherService extends BasePublisher<Record<string, unknown>> {
  public static REALTIME_EXCHANGE = "realtime_events";

  constructor() {
    const connection =
      DependencyInjectionContainer.instance.getService<Connection>(
        ServiceTokens.RabbitMqConnection,
      );
    super(connection, RealtimePublisherService.REALTIME_EXCHANGE);
  }
}

export default RealtimePublisherService;
