"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.serviceRegistry = exports.ServiceRegistry = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ServiceRegistry {
    constructor() {
        this.registryFile = path.join(__dirname, 'services-registry.json');
        this.ensureRegistryFile();
    }
    ensureRegistryFile() {
        if (!fs.existsSync(this.registryFile)) {
            this.writeRegistry({});
        }
    }
    readRegistry() {
        try {
            const data = fs.readFileSync(this.registryFile, 'utf8');
            return JSON.parse(data);
        }
        catch {
            return {};
        }
    }
    writeRegistry(services) {
        fs.writeFileSync(this.registryFile, JSON.stringify(services, null, 2));
    }
    register(serviceName, serviceInfo) {
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
    discover(serviceName) {
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
    listServices() {
        const services = this.readRegistry();
        const result = {};
        Object.entries(services).forEach(([name, service]) => {
            const { pid, ...serviceInfo } = service;
            result[name] = serviceInfo;
        });
        return result;
    }
    updateHealth(serviceName, healthy) {
        const services = this.readRegistry();
        if (services[serviceName]) {
            services[serviceName].healthy = healthy;
            services[serviceName].lastHealthCheck = Date.now();
            this.writeRegistry(services);
        }
    }
    unregister(serviceName) {
        const services = this.readRegistry();
        if (services[serviceName]) {
            delete services[serviceName];
            this.writeRegistry(services);
            console.log(`❌ Serviço removido: ${serviceName}`);
            return true;
        }
        return false;
    }
    cleanup() {
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
exports.ServiceRegistry = ServiceRegistry;
// Singleton
exports.serviceRegistry = new ServiceRegistry();
// Cleanup ao sair
process.on('exit', () => exports.serviceRegistry.cleanup());
process.on('SIGINT', () => {
    exports.serviceRegistry.cleanup();
    process.exit(0);
});
process.on('SIGTERM', () => {
    exports.serviceRegistry.cleanup();
    process.exit(0);
});
