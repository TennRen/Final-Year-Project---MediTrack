import {isNullOrUndefined} from "./convenienceHelpers";

export class AppError extends Error{

    private _type:string;
    private _message:string;
    private _originalStack:any;

    public detail:string;
    public errCode:string;
    public originalError:any;

    public get type(){ return this._type }
    public get message(){ return this._message }
    public get originalStack(){ return this._originalStack }

    public readonly isAppError:boolean = true;

    public static createFrom(error:Error, originalError?:any){
        let xe = new AppError();
        xe.name = "AppError";
        xe._type = error.name;
        xe._message = error.message;
        xe._originalStack = error.stack;

        if (!isNullOrUndefined(originalError)) xe.originalError = originalError;
        else xe.originalError = error;

        xe.createStack(this.createFrom);
        return xe;
    }

    public static fromMessage(message:string, originalError?:any){
        let e = new Error(message);
        return this.createFrom(e,originalError);
    }

    protected createStack( implementation?:any ){
        if ( isNullOrUndefined(implementation) ) implementation = ( this.createStack || AppError );
        Error.captureStackTrace( this, implementation );
    }

}