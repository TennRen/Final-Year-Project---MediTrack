import {BaseRepository} from "./BaseRepository";
import {MedicationModel} from "../models/MedicationModel";

class repo extends BaseRepository<MedicationModel>{

    constructor() {
        super(MedicationModel);
    }

    async getByDrugID(drugID:string){
        return await this.repo.findOne({
            where : {drugID: drugID}
        });
    }

}

export const MedicationRepository = new repo();