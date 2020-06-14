
export class Net{
    public HTTP = require("superagent");
}

export enum HTTPStatusCode{
    BadRequest = 400,
    Unauthorized,
    PaymentRequired,
    Forbidden,
    NotFound,
    MethodNotAllowed,
    RequestTimeout = 408,
    Conflict,
    Gone,
    LengthRequired,
    PayloadTooLarge = 413,
    UnsupportedMediaType = 415,
    TooManyRequests = 429
}

export const NetManager = new Net();