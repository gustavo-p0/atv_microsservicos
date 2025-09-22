import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export class JsonDatabase<T extends { id?: string }> {
  private filePath: string;
  private indexPath: string;

  constructor(private dbPath: string, private collectionName: string) {
    this.filePath = path.join(dbPath, `${collectionName}.json`);
    this.indexPath = path.join(dbPath, `${collectionName}_index.json`);
    this.ensureDatabase();
  }

  private async ensureDatabase(): Promise<void> {
    await fs.ensureDir(this.dbPath);
    
    if (!await fs.pathExists(this.filePath)) {
      await fs.writeJson(this.filePath, []);
    }
    
    if (!await fs.pathExists(this.indexPath)) {
      await fs.writeJson(this.indexPath, {});
    }
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const documents = await this.readAll();
    const document = {
      ...data,
      id: (data as any).id || uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } as unknown as T;

    documents.push(document);
    await this.writeAll(documents);
    return document;
  }

  async findById(id: string): Promise<T | null> {
    const documents = await this.readAll();
    return documents.find(doc => doc.id === id) || null;
  }

  async find(filter: Partial<T> = {}): Promise<T[]> {
    const documents = await this.readAll();
    
    if (Object.keys(filter).length === 0) {
      return documents;
    }

    return documents.filter(doc => {
      return Object.entries(filter).every(([key, value]) => {
        return doc[key as keyof T] === value;
      });
    });
  }

  async update(id: string, updates: Partial<T>): Promise<T | null> {
    const documents = await this.readAll();
    const index = documents.findIndex(doc => doc.id === id);

    if (index === -1) return null;

    documents[index] = {
      ...documents[index],
      ...updates,
      id: documents[index].id,
      updatedAt: new Date().toISOString()
    };

    await this.writeAll(documents);
    return documents[index];
  }

  async delete(id: string): Promise<boolean> {
    const documents = await this.readAll();
    const index = documents.findIndex(doc => doc.id === id);

    if (index === -1) return false;

    documents.splice(index, 1);
    await this.writeAll(documents);
    return true;
  }

  async search(query: string, fields: (keyof T)[]): Promise<T[]> {
    const documents = await this.readAll();
    const searchTerm = query.toLowerCase();

    return documents.filter(doc => {
      return fields.some(field => {
        const value = doc[field];
        return value && value.toString().toLowerCase().includes(searchTerm);
      });
    });
  }

  async count(filter: Partial<T> = {}): Promise<number> {
    const documents = await this.find(filter);
    return documents.length;
  }

  private async readAll(): Promise<T[]> {
    try {
      return await fs.readJson(this.filePath);
    } catch {
      return [];
    }
  }

  private async writeAll(documents: T[]): Promise<void> {
    await fs.writeJson(this.filePath, documents, { spaces: 2 });
  }
}
