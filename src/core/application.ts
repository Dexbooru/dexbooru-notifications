import * as controllers from "../api/controllers";
import * as services from "../services";
import * as consumers from "../consumers";
import * as repositories from "../repositories";
import BaseController from "./base-controller";
import BaseConsumer from "./base-consumer";
import type { BunRequest } from "bun";
import DependencyInjectionContainer from "./dependency-injection-container";
import ServiceTokens from "./tokens/services";
import RepositoryTokens from "./tokens/repositories";
import { Connection as RabbitMqConnection } from "rabbitmq-client";
import Logger from "./logger";
import RequestHandler from "./request-handler";
import WebSocketHandler from "./ws-handler";
import mongoose from "mongoose";
import type { TGlobalEventData } from "../services/events";

// Define types for module exports
type Constructor<T = unknown> = new () => T;
type ModuleExports = Record<string, Constructor>;

class Application {
  private name: string;
  private rabbitConnection?: RabbitMqConnection;
  private routes: Map<
    string,
    (req: BunRequest) => Response | Promise<Response>
  > = new Map();

  constructor(name: string) {
    this.name = name;
  }

  private registerMongodbConnection(): void {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    mongoose
      .connect(process.env.MONGODB_URI)
      .then(() => {
        Logger.instance.info("Connected to MongoDB");
      })
      .catch((err) => {
        Logger.instance.error("Failed to connect to MongoDB", err);
      });
  }

  private registerRepositories(): void {
    const container = DependencyInjectionContainer.instance;

    const tokenNames = Object.values(RepositoryTokens) as string[];
    const repositoryInstances: Record<string, unknown> = {};
    const repos = repositories as ModuleExports;

    tokenNames.forEach((token) => {
      const RepositoryClass = repos[token];
      if (typeof RepositoryClass === "function") {
        repositoryInstances[token] = new RepositoryClass();
      }
    });

    container.addMany(tokenNames, repositoryInstances);
  }

  private registerServices(): void {
    const container = DependencyInjectionContainer.instance;

    const tokenNames = Object.values(ServiceTokens) as string[];
    const serviceInstances: Record<string, unknown> = {};
    const servs = services as ModuleExports;

    tokenNames.forEach((token) => {
      const ServiceClass = servs[token];
      if (typeof ServiceClass === "function") {
        serviceInstances[token] = new ServiceClass();
      }
    });

    container.addMany(tokenNames, serviceInstances);
  }

  private registerConsumers(): void {
    if (!process.env.RABBITMQ_URL) {
      throw new Error("RABBITMQ_URL environment variable is not set");
    }

    this.rabbitConnection = new RabbitMqConnection(process.env.RABBITMQ_URL);

    this.rabbitConnection.on("error", (err) => {
      Logger.instance.error("RabbitMQ connection error", err);
    });

    this.rabbitConnection.on("connection", () => {
      Logger.instance.info("Connection to RabbitMQ established");
    });

    const cons = consumers as Record<string, unknown>;

    Object.values(cons).forEach((ConsumerClass) => {
      if (
        typeof ConsumerClass === "function" &&
        ConsumerClass.prototype instanceof BaseConsumer
      ) {
        const Ctor = ConsumerClass as new () => BaseConsumer;
        const instance = new Ctor();

        Logger.instance.info(
          `Registering consumer ${ConsumerClass.name} on queue: ${instance.queueName}`,
        );

        if (this.rabbitConnection) {
          instance.start(this.rabbitConnection).catch((err) => {
            Logger.instance.error(
              `Failed to start consumer ${ConsumerClass.name} (${instance.queueName})`,
              err,
            );
          });
        }
      }
    });
  }

  private registerDependencies(): void {
    this.registerRepositories();
    this.registerServices();
    this.registerConsumers();
  }

  private registerControllers(): void {
    const controllerInstances = Object.values(controllers).map((Controller) => {
      Logger.instance.info(`Registering controller: ${Controller.name}`);
      return new Controller();
    });

    controllerInstances.forEach((instance) => {
      const prototype = Object.getPrototypeOf(instance);
      const classMethods = Object.getOwnPropertyNames(prototype);

      const route = `${BaseController.BASE_ROUTE}${instance.getRoute()}`;

      classMethods.forEach((methodName) => {
        if (!methodName.startsWith("handle") || methodName === "constructor") {
          return;
        }

        const capitalizedHttpMethod = methodName
          .replace(/^handle/, "")
          .toUpperCase();

        if (!BaseController.HTTP_METHODS.includes(capitalizedHttpMethod)) {
          return;
        }

        const method = (instance as unknown as Record<string, unknown>)[
          methodName
        ];

        if (typeof method !== "function") {
          return;
        }

        const routeKey = `${capitalizedHttpMethod}:${route}`;

        const middlewares = instance.getMiddlewares(methodName);

        this.routes.set(routeKey, async (req: BunRequest) => {
          const boundMethod = method.bind(instance) as (
            req: Request,
          ) => Promise<Response>;

          if (middlewares.length > 0) {
            // Link middlewares
            for (let i = 0; i < middlewares.length - 1; i++) {
              const current = middlewares[i];
              const next = middlewares[i + 1];
              if (current && next) current.setNext(next);
            }

            // Link last middleware to controller handler
            const lastMiddleware = middlewares[middlewares.length - 1];
            if (lastMiddleware) {
              lastMiddleware.setHandler(boundMethod);
            }

            // Execute first middleware
            const firstMiddleware = middlewares[0];
            if (firstMiddleware) {
              const response = await firstMiddleware.run(req);
              Logger.instance.info(
                `${req.method} ${new URL(req.url).pathname} ${response.status}`,
              );
              return response;
            }
          }

          const response = await boundMethod(req);
          Logger.instance.info(
            `${req.method} ${new URL(req.url).pathname} ${response.status}`,
          );
          return response;
        });
      });
    });
  }

  public listen(port: string): Bun.Server<TGlobalEventData> {
    const parsedPort = parseInt(port, 10);
    if (isNaN(parsedPort)) {
      throw new Error("Port must be a valid number from 0 to 65535");
    }

    this.registerMongodbConnection();
    this.registerDependencies();
    this.registerControllers();

    const requestHandler = new RequestHandler(this.routes);
    const websocketHandler = new WebSocketHandler();

    const server = Bun.serve<TGlobalEventData>({
      development: {
        hmr: true,
      },
      port: parsedPort,
      fetch: requestHandler.handle.bind(requestHandler),
      websocket: websocketHandler,
    });

    Logger.instance.info(
      `${this.name} started and listening on port ${parsedPort}`,
    );

    return server;
  }
}

export default Application;
