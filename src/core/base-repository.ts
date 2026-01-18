import { Model } from "mongoose";
import type { UpdateQuery, QueryFilter } from "mongoose";
import type { IRepository } from "./interfaces/repository";

abstract class BaseRepository<T> implements IRepository<T> {
  protected repositoryName: string;
  protected model: Model<T>;

  constructor(repositoryName: string, model: Model<T>) {
    this.repositoryName = repositoryName;
    this.model = model;
  }

  public async create(data: Partial<T>): Promise<T> {
    try {
      const created = await this.model.create(data as any);
      return created as unknown as T;
    } catch (error) {
      console.error(`Error in ${this.repositoryName}.create:`, error);
      throw error;
    }
  }

  public async findAll(filter: QueryFilter<T> = {}): Promise<T[]> {
    try {
      return await this.model.find(filter).exec();
    } catch (error) {
      console.error(`Error in ${this.repositoryName}.findAll:`, error);
      throw error;
    }
  }

  public async findById(id: string): Promise<T | null> {
    try {
      return await this.model.findById(id).exec();
    } catch (error) {
      console.error(`Error in ${this.repositoryName}.findById:`, error);
      throw error;
    }
  }

  public async update(id: string, data: UpdateQuery<T>): Promise<T | null> {
    try {
      return await this.model.findByIdAndUpdate(id, data, { new: true }).exec();
    } catch (error) {
      console.error(`Error in ${this.repositoryName}.update:`, error);
      throw error;
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      const result = await this.model.findByIdAndDelete(id).exec();
      return !!result;
    } catch (error) {
      console.error(`Error in ${this.repositoryName}.delete:`, error);
      throw error;
    }
  }
}

export default BaseRepository;
