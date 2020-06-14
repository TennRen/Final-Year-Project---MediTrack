import {Connection, createConnection, getConnection} from "typeorm";
import {System} from "./System";

const eventManager = require("../config/GlobalEvents");
const ORMConfig = require("./../../ormconfig");

class DBConnector {
    private _conn:Connection = undefined;
    private _disabled:boolean = false;

    constructor(info) {

        createConnection(info).then(conn => {
            this._conn = conn;
            eventManager.trigger("DB_READY");
        }).catch(err => {
            System.fatal(err, System.OUTPUT_TYPE.DB_BOOT);
        });

    }

    public get isReleased():boolean{
        return this._disabled;
    }

    public get connection():Connection{
        if (this._disabled || (this._conn && this._conn.isConnected === false)) return undefined;
        return this._conn;
    };

    public end():Promise<void>{
        this._disabled = true;
        this._conn = undefined; // release the reference to the object so GC can claim it
        return new Promise<void>(resolve => {
            setTimeout(()=>{
                // wait 3s here to ensure the db connection hasn't been touched since it's reference was released
                resolve();
            },3000).unref();
        });
    }
}

export const dbConnector = new DBConnector( ORMConfig );
module.exports.default = dbConnector;