import type { ServerWebSocket } from "bun";
import Logger from "./logger";

class WebSocketHandler implements Bun.WebSocketHandler<undefined> {
  data?: undefined;

  public message(
    ws: ServerWebSocket<undefined>,
    message: string | Buffer<ArrayBuffer>
  ): void {
    Logger.instance.info("websocket message received", ws, message);
    ws.send(`hello client, you said: ${message}`);
  }

  public open(ws: ServerWebSocket<undefined>): void {
    Logger.instance.info("websocket opened", ws);
  }

  public close(
    ws: ServerWebSocket<undefined>,
    code: number,
    reason: string
  ): void {}
}

export default WebSocketHandler;