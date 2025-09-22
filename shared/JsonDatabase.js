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
exports.JsonDatabase = void 0;
const fs = __importStar(require("fs-extra"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
class JsonDatabase {
    constructor(dbPath, collectionName) {
        this.dbPath = dbPath;
        this.collectionName = collectionName;
        this.filePath = path.join(dbPath, `${collectionName}.json`);
        this.indexPath = path.join(dbPath, `${collectionName}_index.json`);
        this.ensureDatabase();
    }
    async ensureDatabase() {
        await fs.ensureDir(this.dbPath);
        if (!await fs.pathExists(this.filePath)) {
            await fs.writeJson(this.filePath, []);
        }
        if (!await fs.pathExists(this.indexPath)) {
            await fs.writeJson(this.indexPath, {});
        }
    }
    async create(data) {
        const documents = await this.readAll();
        const document = {
            ...data,
            id: data.id || (0, uuid_1.v4)(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        documents.push(document);
        await this.writeAll(documents);
        return document;
    }
    async findById(id) {
        const documents = await this.readAll();
        return documents.find(doc => doc.id === id) || null;
    }
    async find(filter = {}) {
        const documents = await this.readAll();
        if (Object.keys(filter).length === 0) {
            return documents;
        }
        return documents.filter(doc => {
            return Object.entries(filter).every(([key, value]) => {
                return doc[key] === value;
            });
        });
    }
    async update(id, updates) {
        const documents = await this.readAll();
        const index = documents.findIndex(doc => doc.id === id);
        if (index === -1)
            return null;
        documents[index] = {
            ...documents[index],
            ...updates,
            id: documents[index].id,
            updatedAt: new Date().toISOString()
        };
        await this.writeAll(documents);
        return documents[index];
    }
    async delete(id) {
        const documents = await this.readAll();
        const index = documents.findIndex(doc => doc.id === id);
        if (index === -1)
            return false;
        documents.splice(index, 1);
        await this.writeAll(documents);
        return true;
    }
    async search(query, fields) {
        const documents = await this.readAll();
        const searchTerm = query.toLowerCase();
        return documents.filter(doc => {
            return fields.some(field => {
                const value = doc[field];
                return value && value.toString().toLowerCase().includes(searchTerm);
            });
        });
    }
    async count(filter = {}) {
        const documents = await this.find(filter);
        return documents.length;
    }
    async readAll() {
        try {
            return await fs.readJson(this.filePath);
        }
        catch {
            return [];
        }
    }
    async writeAll(documents) {
        await fs.writeJson(this.filePath, documents, { spaces: 2 });
    }
}
exports.JsonDatabase = JsonDatabase;
