import type { Server } from "bun";
import type { TGlobalEventData } from "./events";
import Logger from "../core/logger";

class WebSocketService {
  private server: Server<TGlobalEventData> | undefined;

  public setServer(server: Server<TGlobalEventData>): void {
    this.server = server;
  }

  public publish(topic: string, data: string): void {
    if (!this.server) {
      Logger.instance.warn(
        "WebSocketService: Server instance not set. Cannot publish message.",
      );
      return;
    }

    this.server.publish(topic, data);
  }
}

export default WebSocketService;
