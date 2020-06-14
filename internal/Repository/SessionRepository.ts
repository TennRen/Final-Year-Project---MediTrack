import {BaseRepository} from "./BaseRepository";
import {SessionModel} from "../models/SessionModel";

class repo extends BaseRepository<SessionModel>{

    constructor() {
        super(SessionModel);
    }

    async getBySessionKey(sessionKey:string){
        return await this.repo.findOne({
            where: {sessionKey},
            relations: ['owner']
        });
    }

}

export const SessionRepository = new repo();