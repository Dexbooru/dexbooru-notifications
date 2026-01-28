import BaseConsumer from "../core/base-consumer";
import DependencyInjectionContainer from "../core/dependency-injection-container";
import ServiceTokens from "../core/tokens/services";
import type WebSocketService from "../services/websocket";
import type EventService from "../services/events";
import Logger from "../core/logger";
import { z } from "zod";

const GlobalEventPayloadSchema = z.record(z.string(), z.unknown());

type TGlobalEventPayload = z.infer<typeof GlobalEventPayloadSchema>;

class GlobalEventConsumer extends BaseConsumer<TGlobalEventPayload> {
  private static readonly queueName = "global_events";
  private static readonly batchSize = 10;
  private static readonly visibilityTimeout = 500;
  private static readonly routingKey = "event.#";

  private readonly webSocketService: WebSocketService;
  private readonly eventService: EventService;

  constructor() {
    super(
      GlobalEventConsumer.queueName,
      GlobalEventConsumer.batchSize,
      GlobalEventConsumer.visibilityTimeout,
      GlobalEventPayloadSchema,
      GlobalEventConsumer.routingKey,
    );

    const container = DependencyInjectionContainer.instance;

    this.webSocketService = container.getService<WebSocketService>(
      ServiceTokens.WebSocketService,
    );
    this.eventService = container.getService<EventService>(
      ServiceTokens.EventService,
    );
  }

  protected async onBatch(messages: TGlobalEventPayload[]): Promise<void> {
    for (const payload of messages) {
      const eventChannelName = this.eventService.computeChannelKey(payload);

      if (!eventChannelName) {
        Logger.instance.warn(
          "Could not compute channel key for payload",
          payload,
        );
        continue;
      }

      const data = JSON.stringify(payload);

      Logger.instance.info(`Broadcasting to ${eventChannelName}: ${data}`);
      this.webSocketService.publish(eventChannelName, data);
    }
  }
}

export default GlobalEventConsumer;
