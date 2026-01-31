import { describe, expect, test, mock, beforeEach, afterEach } from "bun:test";
import HealthCheckService from "../../src/services/health-check";
import mongoose from "mongoose";

// Mock Mongoose
const mockMongooseConnection = {
  readyState: 1,
};

mock.module("mongoose", () => ({
  default: {
    connection: mockMongooseConnection,
  },
  connection: mockMongooseConnection,
}));

// Mock RabbitMQ
const mockChannelClose = mock(() => Promise.resolve());
const mockAcquire = mock(() =>
  Promise.resolve({
    close: mockChannelClose,
  }),
);

mock.module("rabbitmq-client", () => {
  return {
    Connection: class {
      acquire = mockAcquire;
    },
  };
});

describe("HealthCheckService", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env.RABBITMQ_URL = "amqp://localhost";

    // Reset mocks
    mockMongooseConnection.readyState = 1;
    mockAcquire.mockClear();
    mockChannelClose.mockClear();

    // Reset implementation of acquire to default success
    mockAcquire.mockImplementation(() =>
      Promise.resolve({
        close: mockChannelClose,
      }),
    );
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    mock.restore();
  });

  test("should be defined", () => {
    const service = new HealthCheckService();
    expect(service).toBeDefined();
  });

  test("should return true for both services when they are healthy", async () => {
    const service = new HealthCheckService();
    const status = await service.getHealthStatus();

    expect(status.mongodb).toBe(true);
    expect(status.rabbitMq).toBe(true);
    expect(mockAcquire).toHaveBeenCalled();
    expect(mockChannelClose).toHaveBeenCalled();
  });

  test("should return false for mongodb when readyState is not 1", async () => {
    mockMongooseConnection.readyState = 0; // Disconnected

    const service = new HealthCheckService();
    const status = await service.getHealthStatus();

    expect(status.mongodb).toBe(false);
    expect(status.rabbitMq).toBe(true);
  });

  test("should return false for rabbitMq when acquire throws error", async () => {
    mockAcquire.mockImplementationOnce(() =>
      Promise.reject(new Error("Connection failed")),
    );

    const service = new HealthCheckService();
    const status = await service.getHealthStatus();

    expect(status.mongodb).toBe(true);
    expect(status.rabbitMq).toBe(false);
  });
});
