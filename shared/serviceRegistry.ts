import * as fs from 'fs';
import * as path from 'path';

interface ServiceInfo {
  url: string;
  version: string;
  healthy: boolean;
  registeredAt: number;
  lastHealthCheck: number;
  pid: number;
}

export class ServiceRegistry {
  private registryFile: string;

  constructor() {
    this.registryFile = path.join(__dirname, 'services-registry.json');
    this.ensureRegistryFile();
  }

  private ensureRegistryFile(): void {
    if (!fs.existsSync(this.registryFile)) {
      this.writeRegistry({});
    }
  }

  private readRegistry(): Record<string, ServiceInfo> {
    try {
      const data = fs.readFileSync(this.registryFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  private writeRegistry(services: Record<string, ServiceInfo>): void {
    fs.writeFileSync(this.registryFile, JSON.stringify(services, null, 2));
  }

  register(serviceName: string, serviceInfo: Omit<ServiceInfo, 'healthy' | 'registeredAt' | 'lastHealthCheck' | 'pid'>): void {
    const services = this.readRegistry();
    
    services[serviceName] = {
      ...serviceInfo,
      healthy: true,
      registeredAt: Date.now(),
      lastHealthCheck: Date.now(),
      pid: process.pid
    };
    
    this.writeRegistry(services);
    console.log(`✅ Serviço registrado: ${serviceName} - ${serviceInfo.url}`);
  }

  discover(serviceName: string): ServiceInfo {
    const services = this.readRegistry();
    const service = services[serviceName];
    
    if (!service) {
      throw new Error(`Serviço não encontrado: ${serviceName}`);
    }
    
    if (!service.healthy) {
      throw new Error(`Serviço indisponível: ${serviceName}`);
    }
    
    return service;
  }

  listServices(): Record<string, Omit<ServiceInfo, 'pid'>> {
    const services = this.readRegistry();
    const result: Record<string, Omit<ServiceInfo, 'pid'>> = {};
    
    Object.entries(services).forEach(([name, service]) => {
      const { pid, ...serviceInfo } = service;
      result[name] = serviceInfo;
    });
    
    return result;
  }

  updateHealth(serviceName: string, healthy: boolean): void {
    const services = this.readRegistry();
    if (services[serviceName]) {
      services[serviceName].healthy = healthy;
      services[serviceName].lastHealthCheck = Date.now();
      this.writeRegistry(services);
    }
  }

  unregister(serviceName: string): boolean {
    const services = this.readRegistry();
    if (services[serviceName]) {
      delete services[serviceName];
      this.writeRegistry(services);
      console.log(`❌ Serviço removido: ${serviceName}`);
      return true;
    }
    return false;
  }

  cleanup(): void {
    const services = this.readRegistry();
    const currentPid = process.pid;
    let changed = false;

    Object.entries(services).forEach(([name, service]) => {
      if (service.pid === currentPid) {
        delete services[name];
        changed = true;
      }
    });

    if (changed) {
      this.writeRegistry(services);
    }
  }
}

// Singleton
export const serviceRegistry = new ServiceRegistry();

// Cleanup ao sair
process.on('exit', () => serviceRegistry.cleanup());
process.on('SIGINT', () => {
  serviceRegistry.cleanup();
  process.exit(0);
});
process.on('SIGTERM', () => {
  serviceRegistry.cleanup();
  process.exit(0);
});
