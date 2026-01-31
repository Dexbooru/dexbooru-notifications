import mongoose from "mongoose";
import { Connection as RabbitMqConnection } from "rabbitmq-client";

type ServiceName = "mongodb" | "rabbitMq";

class HealthCheckService {
  private healthCheckRabbitConnection: RabbitMqConnection;

  constructor() {
    this.healthCheckRabbitConnection = new RabbitMqConnection(
      process.env.RABBITMQ_URL,
    );
  }

  private async isMongoDbHealthy(): Promise<boolean> {
    return mongoose.connection.readyState === 1;
  }

  private async isRabbitMqHealthy(): Promise<boolean> {
    try {
      const channel = await this.healthCheckRabbitConnection.acquire();
      await channel.close();

      return true;
    } catch (error) {
      return false;
    }
  }

  public async getHealthStatus(): Promise<Record<ServiceName, boolean>> {
    const mongoDbStatus = await this.isMongoDbHealthy();
    const rabbitMqStatus = await this.isRabbitMqHealthy();

    return {
      mongodb: mongoDbStatus,
      rabbitMq: rabbitMqStatus,
    };
  }
}

export default HealthCheckService;
