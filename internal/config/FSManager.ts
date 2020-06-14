import {AppError} from "./AppError";
import {System} from "./System";

let fs = require("fs");
let path = require("path");

export class TempFile{
    public originalName:string; //name on client computer
    public encoding:string;
    public mimeType:string;
    public size:number; //in bytes
    public destinationPath:string;
    public buffer:Buffer;
    public uniqueName:string;

    public get exists(){
        return fs.existsSync(this.destinationPath);
    }

    private _shouldKeep:boolean = false;

    constructor() {
        setTimeout(()=>{
            if (this._shouldKeep === false) this.destroy();
        },15_000).unref();
    }

    public static createFrom(file:any){
        let f = new TempFile();
        f.originalName = file['originalname'];
        f.encoding = file['encoding'];
        f.mimeType = file['mimetype'];
        f.size = file['size'];
        f.destinationPath = file['path'];
        f.buffer = file['buffer'];
        f.uniqueName = path.basename(file['path']);

        return f;
    }

    public keep(){
        if (this.exists === false) throw new AppError("The incoming file is no longer available");
        this._shouldKeep = true;
        return this.uniqueName;
    }

    public destroy(){
        fs.unlinkSync(this.destinationPath);
    }
}

class handler{
    private _files:TempFile[] = [];

    public setIncomingFiles(f){
        if (fs.existsSync(System.storagePath) === false) fs.mkdirSync(System.storagePath);
        this._files = f?.map(file => TempFile.createFrom(file));
    }

    public getIncomingFiles():TempFile[]{
        return this._files;
    }

}

export const FSManager = new handler();