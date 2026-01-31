import pino from "pino";

class Logger {
  private logger: pino.Logger;
  static #instance: Logger | null = null;

  private constructor() {
    this.logger = pino({
      level: process.env.LOG_LEVEL || "info",
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
        },
      },
    });
  }

  public static get instance(): Logger {
    if (this.#instance === null) {
      this.#instance = new Logger();
    }
    return this.#instance;
  }

  public info(message: string, ...args: unknown[]): void {
    if (args.length > 0) {
      this.logger.info({ args }, message);
    } else {
      this.logger.info(message);
    }
  }

  public error(message: string, ...args: unknown[]): void {
    if (args.length > 0) {
      this.logger.error({ args }, message);
    } else {
      this.logger.error(message);
    }
  }

  public warn(message: string, ...args: unknown[]): void {
    if (args.length > 0) {
      this.logger.warn({ args }, message);
    } else {
      this.logger.warn(message);
    }
  }

  public debug(message: string, ...args: unknown[]): void {
    if (args.length > 0) {
      this.logger.debug({ args }, message);
    } else {
      this.logger.debug(message);
    }
  }
}

export default Logger;
