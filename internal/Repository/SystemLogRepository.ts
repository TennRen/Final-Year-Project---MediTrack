import {BaseRepository} from "./BaseRepository";
import {SystemLogEntryModel} from "../models/SystemLogEntryModel";

class repo extends BaseRepository<SystemLogEntryModel>{

    constructor() {
        super(SystemLogEntryModel);
    }

}

export const SystemLogRepository = new repo();