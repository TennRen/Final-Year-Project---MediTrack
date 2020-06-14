import {System} from "./System";

const Cookies = require("cookies");

export class CookieStore{

    private _originalCookieLibInstance;

    constructor(req, res) {
        this._originalCookieLibInstance = new Cookies(req, res, { keys: ["_PASSPORT_KEY_"] });
    }

    get(cookieName:string):string|undefined{
        return this._originalCookieLibInstance.get(cookieName, {signed: true});
    }

    set(name:string, value:string, options?:ICookieStoreSetOptions):this{
        let defaultOptions = Object.assign({
            httpOnly: false,
            secure: false,
            path: "/",
            overwrite: false
        }, options);

        defaultOptions['signed'] = true;
        defaultOptions['sameSite'] = 'strict';

        this._originalCookieLibInstance.set(name,value, defaultOptions);
        return this;
    }

    del(name:string):this{
        this._originalCookieLibInstance.set(name);
        return this;
    }

}