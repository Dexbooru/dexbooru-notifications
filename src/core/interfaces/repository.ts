export interface IRepository<T> {
  create(data: Partial<T>): Promise<T>;
  findAll(filter?: Record<string, unknown>): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  update(id: string, data: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
}
