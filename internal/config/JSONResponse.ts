import {System} from "./System";

export class JSONResp{

    private readonly _success:boolean;
    private readonly _title:string;
    private readonly _message:string;
    private readonly _data:JSONObject = {};

    constructor(success:boolean,title?:string)
    constructor(success:boolean,title?:string,message?:string)
    constructor(success:boolean,title?:string,data?:any)
    constructor(success:boolean,title?:string,message?:string, data?:any)
    constructor(success:boolean,title?:string,messageOrData?:string|any,data?:any) {

        this._success = success;
        if (title) this._title = title;

        if (messageOrData && (typeof messageOrData === "string" || messageOrData instanceof String)){
            this._message = <string>messageOrData;
            if (data) this._data = data;
        }
        else if (messageOrData){
            this._message = "";
            this._data = messageOrData;
        }

    }

    public get object(): ICompleteResponseJSON{
        let t = Number((process.hrtime.bigint() - System.requestTimeStart) / BigInt(1000000));
        return {
            isSuccessful: this._success,
            title: this._title,
            message: this._message,
            payload: this._data,
            jobInfo:{
                duration: t,
                demand: t > 2000 ? "High" : "Low"
            }
        }
    }

    public toString(){
        return JSON.stringify(this.object);
    }

}

export function JSONResponse(success:boolean,title?:string)
export function JSONResponse(success:boolean,title?:string,message?:string)
export function JSONResponse(success:boolean,title?:string,data?:any)
export function JSONResponse(success:boolean,title?:string,message?:string,data?:any)
export function JSONResponse(success:boolean,title?:string,messageOrData?:string|any,data?:any){
    return (new JSONResp(success,title,messageOrData,data)).object;
}