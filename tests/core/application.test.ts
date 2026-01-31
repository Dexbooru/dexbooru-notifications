import { describe, expect, test, mock, beforeEach, afterEach, spyOn } from "bun:test";
import Application from "../../src/core/application";
import mongoose from "mongoose";
import { MockConsumer, MockController, TestRepository, TestService } from "../helpers/mocks";

// Mock Mongoose
mock.module("mongoose", () => ({
  default: {
    connect: mock(() => Promise.resolve()),
  },
  connect: mock(() => Promise.resolve()),
}));

// Mock RabbitMQ
const mockRabbitOn = mock();
mock.module("rabbitmq-client", () => {
  return {
    Connection: class {
      on = mockRabbitOn;
    }
  };
});

// Mock DependencyInjectionContainer
const mockAddMany = mock();
const mockAdd = mock();
const mockSetServer = mock();
const mockGetService = mock(() => ({
  setServer: mockSetServer
}));
const mockContainerInstance = {
  addMany: mockAddMany,
  add: mockAdd,
  getService: mockGetService,
};
mock.module("../../src/core/dependency-injection-container", () => {
  return {
    default: {
      instance: mockContainerInstance
    }
  };
});

// Mock Logger
const mockLoggerInfo = mock();
const mockLoggerError = mock();
mock.module("../../src/core/logger", () => {
  return {
    default: {
      instance: {
        info: mockLoggerInfo,
        error: mockLoggerError,
      }
    }
  };
});

// Mock Repositories
mock.module("../../src/repositories/index.ts", () => ({
  TestRepository: TestRepository,
}));

// Mock Services
mock.module("../../src/services/index.ts", () => ({
  TestService: TestService,
}));

// Mock Consumers
mock.module("../../src/consumers", () => {
  return {
    TestConsumer: MockConsumer,
  };
});

// Mock Controllers
mock.module("../../src/api/controllers/index.ts", () => ({
  TestController: MockController,
}));

// Mock Tokens
mock.module("../../src/core/tokens/repositories", () => ({
  default: { TEST_REPO: "TestRepository" }
}));
mock.module("../../src/core/tokens/services", () => ({
  default: { 
    TEST_SERVICE: "TestService",
    WebSocketService: "WebSocketService",
    HealthCheckService: "HealthCheckService",
    AuthenticationService: "AuthenticationService",
    EventService: "EventService",
    NotificationSettingService: "NotificationSettingService",
    FriendInviteService: "FriendInviteService",
    NewPostCommentService: "NewPostCommentService",
  }
}));

describe("Application", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env.MONGODB_URI = "mongodb://localhost:27017/test";
    process.env.RABBITMQ_URL = "amqp://localhost";
    
    // Reset mocks
    mockAddMany.mockClear();
    mockRabbitOn.mockClear();
    mockLoggerInfo.mockClear();
    mockLoggerError.mockClear();
    (mongoose.connect as any).mockClear();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    mock.restore();
  });

  test("should initialize with a name", () => {
    const app = new Application("TestApp");
    expect(app).toBeDefined();
    expect((app as any).name).toBe("TestApp");
  });

  test("should throw error if MONGODB_URI is not set", () => {
    delete process.env.MONGODB_URI;
    const app = new Application("TestApp");
    expect(() => app.listen("3000")).toThrow("MONGODB_URI environment variable is not set");
  });

  test("should throw error if RABBITMQ_URL is not set", () => {
    delete process.env.RABBITMQ_URL;
    const app = new Application("TestApp");
    expect(() => app.listen("3000")).toThrow("RABBITMQ_URL environment variable is not set");
  });

  test("should throw error if port is invalid", () => {
    const app = new Application("TestApp");
    expect(() => app.listen("invalid")).toThrow("Port must be a valid number from 0 to 65535");
  });

  test("should connect to MongoDB on listen", () => {
    const app = new Application("TestApp");
    
    // Mock Bun.serve to avoid actually starting a server
    spyOn(Bun, "serve").mockImplementation(() => ({
      stop: () => {},
    } as any));

    app.listen("3000");
    expect(mongoose.connect).toHaveBeenCalledWith("mongodb://localhost:27017/test");
  });

  test("should register dependencies on listen", () => {
    const app = new Application("TestApp");
    spyOn(Bun, "serve").mockImplementation(() => ({ stop: () => {} } as any));

    app.listen("3000");

    // Repositories and Services should be registered
    expect(mockAddMany).toHaveBeenCalledTimes(2);
    
    // Check if our mocks were loaded
    const calls = mockAddMany.mock.calls;
    const tokens = calls.flatMap(c => c[0]);
    expect(tokens).toContain("TestRepository");
    expect(tokens).toContain("TestService");
  });

  test("should register rabbitmq connection on listen", () => {
    const app = new Application("TestApp");
    spyOn(Bun, "serve").mockImplementation(() => ({ stop: () => {} } as any));

    app.listen("3000");

    expect(mockRabbitOn).toHaveBeenCalledWith("error", expect.any(Function));
    expect(mockRabbitOn).toHaveBeenCalledWith("connection", expect.any(Function));
  });

  test("should register controllers and start server", () => {
    const app = new Application("TestApp");
    const mockServe = spyOn(Bun, "serve").mockImplementation(() => ({ stop: () => {} } as any));

    app.listen("3000");

    expect(mockServe).toHaveBeenCalled();
    const serveConfig = (mockServe as any)?.mock?.calls?.[0]?.[0] ?? 0;
    expect(serveConfig.port).toBe(3000);
    expect(serveConfig.fetch).toBeDefined();
    expect(serveConfig.websocket).toBeDefined();
  });
});