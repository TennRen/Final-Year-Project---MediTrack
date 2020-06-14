import {BaseRepository} from "./BaseRepository";
import {UserModel} from "../models/UserModel";
import {ContactModel} from "../models/ContactModel";

class repo extends BaseRepository<ContactModel>{

    constructor() {
        super(ContactModel);
    }

    async getByUser(user:UserModel){
        return await this.repo.findOne({
            where : {
                patient : {
                    id : user.id
                }
            }
        });
    }

}

export const RelationsRepository = new repo();