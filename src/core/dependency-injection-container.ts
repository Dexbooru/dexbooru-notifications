import Logger from "./logger";

class DependencyInjectionContainer {
  private services: Map<string, unknown>;
  static #instance: DependencyInjectionContainer | null = null;

  constructor() {
    this.services = new Map();
  }

  public static get instance(): DependencyInjectionContainer {
    if (this.#instance === null) {
      this.#instance = new DependencyInjectionContainer();
    }
    return this.#instance;
  }

  public add<T>(name: string, service: T): void {
    Logger.instance.info(`Registering service: ${name}`);
    this.services.set(name, service);
  }

  public addMany(names: string[], services: Record<string, unknown>): void {
    Logger.instance.info(`Registering multiple services: ${names.join(", ")}`);

    names.forEach((name) => {
      const serviceInstance = services[name] ?? null;
      if (!serviceInstance) {
        throw new Error(
          `Service with name ${name} not found in provided services`,
        );
      }

      this.add(name, serviceInstance);
    });
  }

  public getService<T>(name: string): T {
    if (!this.services.has(name)) {
      throw new Error(`Service with name ${name} not found`);
    }

    return this.services.get(name) as T;
  }

  public clear(): void {
    this.services.clear();
  }

  public getTotalServices(): number {
    return this.services.size;
  }
}

export default DependencyInjectionContainer;
