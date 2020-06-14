import {UserModel} from "./internal/models/UserModel";
import {SessionModel} from "./internal/models/SessionModel";
import {SystemLogEntryModel} from "./internal/models/SystemLogEntryModel";
import {ApiCacheModel} from "./internal/models/ApiCacheModel";
import {MedicationModel} from "./internal/models/MedicationModel";
import {PrescriptionModel} from "./internal/models/PrescriptionModel";
import {ContactModel} from "./internal/models/ContactModel";

interface IConnectionInfo{
    type: string,
    host: string,
    port: number,
    username: string,
    password: string,
    database?: string,
    ssl?: {
        ca: string,
        key: string,
        cert: string
    },
    synchronize: boolean,
    logging: boolean,
    entities: any[],
    migrationsTableName: string,
    migrations: string[],
    cli: {[name:string]:string}
}

let x:IConnectionInfo = {
    type: "mysql",
    host: process.env.SQL_IP,
    port: Number(process.env.SQL_PORT),
    username: process.env.SQL_USER,
    password: process.env.SQL_PASS,
    database: process.env.SQL_BASE,
    synchronize: false,
    logging: false,
    entities: [
        UserModel,
        MedicationModel,
        PrescriptionModel,
        SessionModel,
        SystemLogEntryModel,
        ApiCacheModel,
        ContactModel
    ],
    migrationsTableName:'db_migrations',
    migrations: ["orm_migrations/*.js"],
    cli: {
        migrationsDir: "orm_migrations"
    }
};

module.exports = x;