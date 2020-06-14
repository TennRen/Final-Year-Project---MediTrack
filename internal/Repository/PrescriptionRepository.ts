import {BaseRepository} from "./BaseRepository";
import {PrescriptionModel} from "../models/PrescriptionModel";
import {UserModel} from "../models/UserModel";

class repo extends BaseRepository<PrescriptionModel>{

    constructor() {
        super(PrescriptionModel);
    }

    async getByIdentifier(reference:string){
        return await this.repo.findOne({
            where : {reference: reference},
            relations: ['medicationInfo']
        });
    }

    async getUserPrescriptions(user:UserModel){
        return await this.repo.find({
            where: {
                patient : {
                    id : user.id
                }
            },
            relations: ['medicationInfo']
        });
    }

}

export const PrescriptionRepository = new repo();