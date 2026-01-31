import BaseConsumer from "../../src/core/base-consumer";
import BaseController from "../../src/core/base-controller";

import type { Connection } from "rabbitmq-client";

export class MockConsumer extends BaseConsumer {
  override queueName = "test-queue";
  protected async onBatch(_messages: unknown[]): Promise<void> {
    return Promise.resolve();
  }
  override async start(_conn: Connection) {
    return Promise.resolve();
  }
}

export class MockController extends BaseController {
  override getRoute() {
    return "/test";
  }
  override async handleGet() {
    return new Response("OK");
  }
}

export class TestRepository {}

export class TestService {}
