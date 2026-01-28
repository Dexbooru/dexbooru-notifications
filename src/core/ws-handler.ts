import type { ServerWebSocket } from "bun";
import Logger from "./logger";
import type { TGlobalEventData } from "../services/events";

class WebSocketHandler implements Bun.WebSocketHandler<TGlobalEventData> {
  data?: TGlobalEventData;
  publishToSelf?: boolean | undefined = true;
  maxPayloadLength?: number | undefined = 2096;
  idleTimeout?: number | undefined = 450;

  public message(
    _ws: ServerWebSocket<TGlobalEventData>,
    _message: string | Buffer<ArrayBuffer>,
  ): void {
    return;
  }

  public open(ws: ServerWebSocket<TGlobalEventData>): void {
    Logger.instance.info(
      `A user with id: ${ws.data.userId} joined the event stream and will subscribe to the channel with id: ${ws.data.eventChannelName}`,
    );

    ws.subscribe(ws.data.eventChannelName);
  }

  public close(ws: ServerWebSocket<TGlobalEventData>): void {
    Logger.instance.info(
      `A user with id: ${ws.data.userId} will leave the event stream and will unsubscribe from the channel with id: ${ws.data.eventChannelName}`,
    );

    ws.unsubscribe(ws.data.eventChannelName);
  }
}

export default WebSocketHandler;
