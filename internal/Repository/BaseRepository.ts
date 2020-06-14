import {IModel} from "../models/IModel";
import {Repository} from "typeorm";
import {dbConnector as db} from "./../config/DBConnection";

export class BaseRepository<T extends IModel>{

    protected get repo():Repository<T>{
        return db.connection.getRepository(this.modelType);
    }

    constructor(public modelType:{new(): T}) { }

    async save(model:T):Promise<T>{
        return await db.connection.manager.save(model);
    }

    async update(model:T):Promise<T>{
        return await this.save(model);
    }

    async delete(model:T):Promise<T>{
        return await this.repo.remove(model);
    }

    async getAll():Promise<T[]>{
        return await this.repo.find();
    }

    isConnectionReady():boolean{
        return db.connection !== undefined;
    }

}