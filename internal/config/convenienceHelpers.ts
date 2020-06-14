import {NetManager} from "./Net";
import {System} from "./System";

export type HTTP2PushObject = {
    path : string,
    as : "image"|"style"|"script"
}

export const Version = (v:string) => {
    let parts = v.split("."); // 2.3.93.1223
    let r = {
        major: Number(parts[0]),
        minor: Number(parts[1]),
        patch: Number(parts[2]),
        build: Number(parts.length === 4 ? parts[3] : parts[2]),
    };
    return {
        get incrementBuild(){ return r.build++ },
        get incrementPatch(){ return r.patch++ },
        get incrementMinor(){ return r.minor++ },
        get incrementMajor(){ return r.major++ },
        get value () { return r },
        get asString(){ return [r.major, r.minor, r.patch, r.build].join('.') },
        increment: (segment)=> r[segment]++
    }
}

export function extendObject(out, properties:JSONObject){
    for (let p in properties){
        out[p] = properties[p];
    }
    return out;
}

export function loadProperties<C>(option:C, properties:ObjectProperties<C>):C{
    for (let propertyName in properties){
        if (properties.hasOwnProperty(propertyName))
            if (!isNullOrUndefined(properties[propertyName])) option[propertyName] = properties[propertyName];
    }
    return option;
}

export function isNonValue(value:any){
    if (isNullOrUndefined(value)) return true;
    return value === false;
}

export function isNullOrUndefined(value:any){
    if (value === void 0) return true;
    return value === null;
}

export function isEmptyOrUndefined(value:any){
    if ((typeof value === "string" || value instanceof String) && value.trim() === "") return true;
    return isNullOrUndefined(value);
}

export function isVoid(value:any){
    if (value === void 0) return true;
    return value === null;
}

export function isBoolean(val:any){
    return (val === true || val === false);
}

export function objToQuery(val){
    let q = "";
    Object.keys(val).forEach(key => {
        q += "&" + key + "=" + val[key];
    });
    return q.substr(1);
}

export async function MakeRequest(url:string, data, type:"GET"|"POST"|"DELETE"="GET", token=null){
    const userAgent = "rejig-wrecked-genie";
    let headers = {"User-Agent" : userAgent};

    if (data == null) data = {};

    if (token !== null) headers = Object.assign(headers, {
        Authorization : `token ${token}`
    });


    if(data) {
        for (let [key, value] of Object.entries(data)) {
            if (isBoolean(value)) data[key] = value ? 'true' : 'false';
        }
    }

    let results:any = null;

    if (type === "GET"){
        if(Object.keys(data).length > 0) url += '?' + objToQuery(data);
        results = await NetManager.HTTP.get(url).set(headers)
    }
    else if (type === "POST"){
        headers = Object.assign(headers, {"Content-type":"application/json"})
        results = await NetManager.HTTP.post(url)
            .set(headers)
            .send(data ? JSON.stringify(data) : null);
    }
    else if (type === "DELETE"){
        headers = Object.assign(headers, {"Content-type":"application/json"})
        results = await NetManager.HTTP.delete(url)
            .set(headers)
            .send(data ? JSON.stringify(data) : null);
    }

    // if (typeof results === "string" || results instanceof String){
    //     return results.toString();
    // }
    // else{
    //     return JSON.stringify(results);
    // }

    await System.log("REQUEST", `Made to ${url} with header ${JSON.stringify(headers)}`,System.OUTPUT_TYPE.NONE, results?.text)

    return results?.text;
}

export function getHTMLDocument(val:string ): Document {
    const JSDom = require("jsdom").JSDOM;

    // prevent "Could not parse CSS stylesheet" errors
    let strippedContent = val.replace(/(?:<style>)[^]+?(?:<\/style>)/gm,'');

    return (new JSDom(strippedContent)).window.document;
}

export function randomString(len:number=18){
    return [...Array(len)].map(_=>(~~(Math.random()*36)).toString(36)).join('');
}

export function isEmailAddressValid(email:string){
    let emailRegexPattern = /[a-zA-Z0-9-_]+(?:[.a-zA-Z0-9-_]*[a-zA-Z0-9-_]+)*@[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]+)*/gm;
    return emailRegexPattern.test(email);
}

export namespace Utilities{
    export class Collection<T> extends Array<T>{
        constructor(items:T[]) {
            super();
            if (items?.length > 0) this.push(...items);
        }

        get firstOrDefault():T{
            return this[0] ?? null;
        }

        unique(): Utilities.Collection<T> {
            let set = new Set(this);
            return new Collection(Array.from(set.values()))
        }

        stripNonValue(): Utilities.Collection<T> {
            return new Collection(this.filter(t => t !== null));
        }

        isEmpty(): boolean {
            return this.length === 0;
        }

        static createFrom<T>(arrayLike:ArrayLike<T>):Collection<T>{
            return new Collection<T>(Array.from(arrayLike));
        }
    }

    export function createObject<Shape>(properties:Required<Shape>){
        return <Shape>Object.assign({},properties);
    }

    export function mixMatch<T>(arrayOne:Array<T>, arrayTwo:Array<T>, forEachHandler:(first:T,second:T)=>void):void{
        for (let itemOne of arrayOne){
            for (let itemTwo of arrayTwo){
                forEachHandler(itemOne,itemTwo);
            }
        }
    }

    export function getPossiblePairs<T>(array:Array<T>){
        let getPairs = arr => {
            if (arr.length < 2) return [];
            let first = arr[0];
            let rest = arr.splice(1);
            let pairs = rest.map(r => [first, r]);
            return pairs.concat(getPairs(rest));
        };
        let pairs = getPairs(array);
        return [
            pairs.map(p => p[0]),
            pairs.map(p => p[1])
        ]
    }

    export async function getAsync(asyncFunction:(resolve, reject)=>void){
        return new Promise<{data:any,err:any}>((resolve) => {
            asyncFunction(data => {
                resolve({
                    data,
                    err:null
                })
            }, err => {
                resolve({
                    data:null,
                    err
                })
            });
        });
    }

    export function isNullOrUndefined(obj:any){
        if (obj === void 0) return true;
        return obj === null;
    }
}
