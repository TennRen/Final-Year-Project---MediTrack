import {BaseService} from "./BaseService";
import {ApiCacheModel} from "../models/ApiCacheModel";
import {isNullOrUndefined, loadProperties} from "../config/convenienceHelpers";
import {ApiCacheRepository} from "../Repository/ApiCacheRepository";

class service extends BaseService{

    async getEntry(endpointPath:string, ignoreExpired:boolean=true):Promise<ApiCacheModel>{
        return await ApiCacheRepository.getFirst(endpointPath, ignoreExpired);
    }

    async hasEntry(endpointPath:string){
        return !isNullOrUndefined(await this.getEntry(endpointPath));
    }

    async setEntry(properties:ObjectProperties<ApiCacheModel>){
        let existingOption = await this.getEntry(properties.apiPath);

        if ( !isNullOrUndefined(existingOption) ) {
            loadProperties(existingOption,properties);
            return await ApiCacheRepository.save(existingOption);
        }

        let option = new ApiCacheModel();
        loadProperties(option, properties);
        return await ApiCacheRepository.save(option);
    }

    async getWithFallback(options:{endpointPath:string, ignoreExpired?:boolean, includeExpiredOnFail?:boolean, fallback:(store:(v:any)=>void, fail:(e:any)=>void)=>any}){
        return new Promise(async (resolve, reject) => {
            let entry = await this.getEntry(options.endpointPath, options.ignoreExpired ?? true);
            if (!entry) {
                console.log("not found");
                try{
                    options.fallback(value => {
                        this.setEntry({
                            apiPath: options.endpointPath,
                            result: value
                        });
                        resolve(value);
                    }, err => {
                        reject(err);
                    })
                }
                catch(err) { reject(err) }
            }
            else if (entry && entry.isOutdated){
                console.log("entry not found")
                try{
                    options.fallback(value => {
                        this.setEntry({
                            apiPath: entry.apiPath,
                            result: value
                        });
                        resolve(value);
                    }, err => {
                        reject(err);
                    });
                }
                catch(err){
                    if (options.includeExpiredOnFail) resolve(entry);
                    else reject(err);
                }
            }
            else {
                resolve(entry.result);
            }
        });
    }

}

export const ApiCacheService = new service();