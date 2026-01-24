import type { ServerWebSocket } from "bun";
import Logger from "./logger";
import type { TGlobalEventData } from "../services/events";

class WebSocketHandler implements Bun.WebSocketHandler<TGlobalEventData> {
  data?: TGlobalEventData;

  public message(
    ws: ServerWebSocket<TGlobalEventData>,
    message: string | Buffer<ArrayBuffer>,
  ): void {
    
    
    Logger.instance.info("websocket message received", ws, message);
    ws.send(`hello client, you said: ${message}`);
  }

  public open(ws: ServerWebSocket<TGlobalEventData>): void {
    Logger.instance.info("websocket opened", ws);
  }

  public close(
    ws: ServerWebSocket<TGlobalEventData>,
    code: number,
    reason: string,
  ): void {}
}

export default WebSocketHandler;
