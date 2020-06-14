import {RequestHandler, Router} from "express";
import {IRouterMatcher, Response} from "express-serve-static-core";
import {HTTPStatusCode} from "./Net";
import {isNonValue} from "./convenienceHelpers";
import {JSONResponse} from "./JSONResponse";

export class RouterController{

    public routePrefix:string = undefined;
    private readonly router:Router;

    constructor(router:Router)
    constructor(routePrefix:string ,router:Router)
    constructor(routePrefixOrRouter:string|Router, router?:Router) {
        if ((typeof routePrefixOrRouter === "string" || <any>routePrefixOrRouter instanceof String) && router){
            this.router = router;
            this.routePrefix = <string>routePrefixOrRouter;
        }
        else{
            this.router = <Router>routePrefixOrRouter;
        }
    }

    private buildAction(method:string, path:string, handler:RequestHandler[]){
        let prefix = (this.routePrefix=== undefined ? "/" : this.routePrefix);
        let finalPath:string;
        if (prefix !== "/"){
            if (prefix.endsWith("/") && path.startsWith("/")){
                finalPath = prefix + path.substr(1);
            }
            else if (!prefix.endsWith("/") && !path.startsWith("/")){
                finalPath = prefix + "/" + path;
            }
            else {
                finalPath = prefix + path;
            }
        }
        else{
            finalPath = path;
        }

        return this.router[method](finalPath, ...handler);
    }

    public get baseRouter():Router{
        return this.router;
    }

    public use(handler){
        return this.router.use(handler);
    }

    public onGET:IRouterMatcher<any> = (path,...handler)=>{
        return this.buildAction("get", path, handler);
    };

    public onPOST:IRouterMatcher<any> = (path,...handler)=>{
        return this.buildAction("post", path, handler);
    };

    public onDELETE:IRouterMatcher<any> = (path,...handler)=>{
        return this.buildAction("delete", path, handler);
    };
}

export class RouterSet {

    private readonly controllerPath:string = undefined;
    private readonly handler:(route:RouterController)=>RouterController;

    constructor(handler:(route:RouterController)=>RouterController)
    constructor(controllerPath:string, handler:(route:RouterController)=>RouterController)
    constructor(controllerPathOrHandler:string|((route:RouterController)=>RouterController), handler?:(route:RouterController)=>RouterController) {
        if (handler && (typeof controllerPathOrHandler === "string" || controllerPathOrHandler instanceof String)){
            this.handler = handler;
            this.controllerPath = <string>controllerPathOrHandler;
            if (!this.controllerPath.startsWith("/")) this.controllerPath = "/" + this.controllerPath;
        }
        else{
            this.handler = <any>controllerPathOrHandler;
        }
    }

    public getRouter(bRouter?:RouterController):RouterController{
        let cPath = this.getControllerPath();
        let baseRouter = bRouter || new RouterController(cPath, require('express').Router());
        if (bRouter) baseRouter.routePrefix = cPath;
        return this.handler(baseRouter);
    }

    public path(route:string):string{
        let cPath = this.getControllerPath();
        let prefix = (cPath === undefined ? "/" : cPath);
        let finalPath:string;
        if (prefix === "/"){
            finalPath = route;
        }
        else{
            if (!prefix.endsWith("/") && !route.startsWith("/")){
                finalPath = prefix + "/" + route;
            }
            else if (prefix.endsWith("/") && route.startsWith("/")){
                finalPath = prefix + route.substr(1);
            }
            else{
                finalPath = prefix + route;
            }
        }
        return finalPath;
    }

    public getControllerPath(){
        return this.controllerPath === undefined ? "/" : this.controllerPath;
    }

}

export namespace RouterValidation{

    export async function Prepare(response: Response, requiredInputValidators: IRequiredInputValidator[]):Promise<boolean>{
        for (let validator of requiredInputValidators){
            if (isNonValue(await validator.validation())) {
                if (validator.errorStatusCode){
                    response.status(validator.errorStatusCode).json(
                        JSONResponse(
                            false,
                            validator.failTitle,
                            validator.failMessage
                        )
                    );
                }
                else{
                    response.json(JSONResponse(
                        false,
                        validator.failTitle,
                        validator.failMessage
                    ));
                }
                return false;
            }
        }

        return true;
    }

    export function Check(validation: ITask<void, any>, failTitle: string, failMessage: string, statusCode?: number):IRequiredInputValidator{
        return {
            validation,
            failTitle,
            failMessage,
            errorStatusCode: statusCode
        }
    }

    export function CheckEmpty(validation: ITask<void, any>, failTitle: string, failMessage: string, statusCode?: number){
        return {
            validation: async ()=> (await validation()).length === 0 ? undefined : "_",
            failTitle,
            failMessage,
            errorStatusCode: statusCode
        }
    }

    export function CheckAuth(validation: ITask<void, any>){
        return Check(validation, "Not Authenticated", "You must be logged in to perform this action", HTTPStatusCode.Unauthorized);
    }

    export function CheckPermission(validation: ITask<void, any>, message:string){
        return Check(validation, "No access", message, HTTPStatusCode.Forbidden);
    }

}