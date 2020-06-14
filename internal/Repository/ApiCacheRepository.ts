import {BaseRepository} from "./BaseRepository";
import {ApiCacheModel} from "../models/ApiCacheModel";

class repo extends BaseRepository<ApiCacheModel>{

    constructor() {
        super(ApiCacheModel);
    }

    async getFirst(endpointPath:string, ignoreExpired:boolean=true){
        let result = await this.repo.findOne({
            where: {
                apiPath : endpointPath
            }
        });
        if (!result || (result.isOutdated && ignoreExpired === true)) return null;
        return result;
    }

}

export const ApiCacheRepository = new repo();
