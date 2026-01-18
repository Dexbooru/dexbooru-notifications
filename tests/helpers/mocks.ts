import BaseConsumer from "../../src/core/base-consumer";
import BaseController from "../../src/core/base-controller";

export class MockConsumer extends BaseConsumer {
  override queueName = "test-queue";
  async onMessage() {}
  override async start(conn: any) { return Promise.resolve(); }
}

export class MockController extends BaseController {
  override getRoute() { return "/test"; }
  override async handleGet() { return new Response("OK"); }
}

export class TestRepository {}

export class TestService {}
