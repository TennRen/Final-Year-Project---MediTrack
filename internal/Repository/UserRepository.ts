import {BaseRepository} from "./BaseRepository";
import {UserModel} from "../models/UserModel";

class repo extends BaseRepository<UserModel>{

    constructor() {
        super(UserModel);
    }

    async getByEmail(emailAddress:string){
        return await this.repo.findOne({
            where : {email: emailAddress}
        });
    }

}

export const UserRepository = new repo();