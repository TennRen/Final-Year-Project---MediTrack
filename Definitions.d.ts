type Days = ("monday"|"tuesday"|"wednesday"|"thursday"|"friday"|"saturday"|"sunday")[];


interface ICookieStoreSetOptions{
    /**
     * a number representing the milliseconds from Date.now() for expiry
     */
    maxAge?: number;
    /**
     * a Date object indicating the cookie's expiration
     * date (expires at the end of session by default).
     */
    expires?: Date;
    /**
     * a string indicating the path of the cookie (/ by default).
     */
    path?: string;
    /**
     * a string indicating the domain of the cookie (no default).
     */
    domain?: string;
    /**
     * a boolean indicating whether the cookie is only to be sent
     * over HTTPS (false by default for HTTP, true by default for HTTPS).
     */
    secure?: boolean;
    /**
     * a boolean indicating whether the cookie is only to be sent over HTTP(S),
     * and not made available to client JavaScript (true by default).
     */
    httpOnly?: boolean;
    /**
     * a boolean indicating whether to overwrite previously set
     * cookies of the same name (false by default). If this is true,
     * all cookies set during the same request with the same
     * name (regardless of path or domain) are filtered out of
     * the Set-Cookie header when setting this cookie.
     */
    overwrite?: boolean;
}

type Optional<T> = { [P in keyof Partial<T>]: Pick<T, P> extends Partial<Pick<T, P>> ? T[P] : (T[P] | undefined); }

interface IGroup<T> extends Array<T>{
    readonly [n: number]: T;
}

interface ITask<T, O> { (...params:T[]):O; }

interface IRequiredInputValidator{
    validation: ITask<void, boolean>;
    failTitle: string;
    failMessage: string;
    errorStatusCode?: number;
}

type ErrorCallback<E = Error> = (err:E)=>void;

type ObjectProperties<O> = { [K in keyof O]?: O[K] };

type JSONObject = { [keyName:string]:any };
type StrictJSONObject = { [keyName:string]:string|boolean|number };

interface IResponseJSON extends IActionResult{
    title?: string;
    message?: string;
    payload?: JSONObject
}

interface ICompleteResponseJSON extends IResponseJSON{
    jobInfo:{
        duration: number,
        demand: "High"|"Low"
    }
}

interface IRequestResult{
    value: JSONObject | string,
    isJSON: boolean,
    status: number
}

interface IActionResult{
    isSuccessful: boolean;
    [key:string]:any;
}