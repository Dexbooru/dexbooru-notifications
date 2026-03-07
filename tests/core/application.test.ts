import {
  describe,
  expect,
  test,
  mock,
  beforeEach,
  afterEach,
  spyOn,
} from "bun:test";
import mongoose from "mongoose";
import DependencyInjectionContainer from "../../src/core/dependency-injection-container";
import ServiceTokens from "../../src/core/tokens/services";
import RepositoryTokens from "../../src/core/tokens/repositories";

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
    Connection: mock(() => ({
      on: mockRabbitOn,
      createPublisher: mock(() => ({
        send: mock(),
        close: mock(),
      })),
      createConsumer: mock(() => ({
        close: mock(),
      })),
    })),
  };
});

// Mock Logger
mock.module("../../src/core/logger", () => {
  return {
    default: {
      instance: {
        info: mock(),
        error: mock(),
        warn: mock(),
      },
    },
  };
});

import Application from "../../src/core/application";

describe("Application", () => {
  const ORIGINAL_ENV = process.env;
  let addManySpy: any;
  let addSpy: any;
  let getServiceSpy: any;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env.MONGODB_URI = "mongodb://localhost:27017/test";
    process.env.RABBITMQ_URL = "amqp://localhost";

    // Clear the real container
    DependencyInjectionContainer.instance.clear();

    // Spies
    addManySpy = spyOn(DependencyInjectionContainer.instance, "addMany");
    addSpy = spyOn(DependencyInjectionContainer.instance, "add");

    const mockRabbitConn = {
      on: mockRabbitOn,
      createPublisher: mock(() => ({
        send: mock(),
        close: mock(),
      })),
      createConsumer: mock(() => ({
        close: mock(),
      })),
    };

    getServiceSpy = spyOn(
      DependencyInjectionContainer.instance,
      "getService",
    ).mockImplementation((token: string) => {
      if (token === ServiceTokens.WebSocketService) {
        return { setServer: mock() } as any;
      }
      if (token === ServiceTokens.RabbitMqConnection) {
        return mockRabbitConn as any;
      }
      return {} as any;
    });

    mockRabbitOn.mockClear();
    (mongoose.connect as any).mockClear();
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
    addManySpy.mockRestore();
    addSpy.mockRestore();
    getServiceSpy.mockRestore();
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
    expect(() => app.listen("3000")).toThrow(
      "MONGODB_URI environment variable is not set",
    );
  });

  test("should throw error if RABBITMQ_URL is not set", () => {
    delete process.env.RABBITMQ_URL;
    const app = new Application("TestApp");
    expect(() => app.listen("3000")).toThrow(
      "RABBITMQ_URL environment variable is not set",
    );
  });

  test("should throw error if port is invalid", () => {
    const app = new Application("TestApp");
    expect(() => app.listen("invalid")).toThrow(
      "Port must be a valid number from 0 to 65535",
    );
  });

  test("should connect to MongoDB on listen", () => {
    const app = new Application("TestApp");

    // Mock Bun.serve to avoid actually starting a server
    spyOn(Bun, "serve").mockImplementation(
      () =>
        ({
          stop: () => {},
        }) as any,
    );

    app.listen("3000");
    expect(mongoose.connect).toHaveBeenCalledWith(
      "mongodb://localhost:27017/test",
    );
  });

  test("should register dependencies on listen", () => {
    const app = new Application("TestApp");
    spyOn(Bun, "serve").mockImplementation(() => ({ stop: () => {} }) as any);

    app.listen("3000");

    // Repositories and Services should be registered
    // We expect at least one call for repositories and one for services
    expect(addManySpy).toHaveBeenCalled();

    const tokens = addManySpy.mock.calls.flatMap((c: unknown[]) => c[0]);
    expect(tokens).toContain(RepositoryTokens.FriendInviteRepository);
    expect(tokens).toContain(ServiceTokens.AuthenticationService);
  });

  test("should register rabbitmq connection on listen", () => {
    const app = new Application("TestApp");
    spyOn(Bun, "serve").mockImplementation(() => ({ stop: () => {} }) as any);

    app.listen("3000");

    expect(mockRabbitOn).toHaveBeenCalledWith("error", expect.any(Function));
    expect(mockRabbitOn).toHaveBeenCalledWith(
      "connection",
      expect.any(Function),
    );
  });

  test("should register controllers and start server", () => {
    const app = new Application("TestApp");
    const mockServe = spyOn(Bun, "serve").mockImplementation(
      () => ({ stop: () => {} }) as any,
    );

    app.listen("3000");

    expect(mockServe).toHaveBeenCalled();
    const serveConfig = (mockServe as any)?.mock?.calls?.[0]?.[0] ?? 0;
    expect(serveConfig.port).toBe(3000);
    expect(serveConfig.fetch).toBeDefined();
    expect(serveConfig.websocket).toBeDefined();
  });
});
