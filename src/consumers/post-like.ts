import type { AsyncMessage } from "rabbitmq-client";
import BaseConsumer from "../core/base-consumer";
import type { IConsumer } from "../core/interfaces/consumer";

const queueName = "q.post_like_first";

class PostLikeConsumer extends BaseConsumer implements IConsumer {
  constructor() {
    super(queueName);
  }

  public override async onMessage(message: AsyncMessage): Promise<void> {
    console.log("PostLikeConsumer processing message:", message);
  }
}

export default PostLikeConsumer;
