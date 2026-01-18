import BaseController from "../../core/base-controller";
import DependencyInjectionContainer from "../../core/dependency-injection-container";
import type { IController } from "../../core/interfaces/controller";
import ServiceTokens from "../../core/tokens/services";
import type HealthCheckService from "../../services/health-check";

const controllerName = "HealthController";

class HealthController extends BaseController implements IController {
  public name: string = controllerName;
  private healthCheckService: HealthCheckService;

  constructor() {
    super("/health");
    this.healthCheckService =
      DependencyInjectionContainer.instance.getService<HealthCheckService>(
        ServiceTokens.HealthCheckService,
      );
  }

  public override async handleGet(_: Request): Promise<Response> {
    const serviceStatuses = await this.healthCheckService.getHealthStatus();

    let allServicesHealthy = true;
    for (const status of Object.values(serviceStatuses)) {
      if (!status) {
        allServicesHealthy = false;
        break;
      }
    }

    if (!allServicesHealthy) {
      return this.error("Some services are unhealthy", 503, serviceStatuses);
    }

    return this.ok("Server is healthy", 200, serviceStatuses);
  }
}

export default HealthController;
