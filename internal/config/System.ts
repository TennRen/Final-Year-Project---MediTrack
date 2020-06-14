import {SystemLogEntryModel} from "../models/SystemLogEntryModel";
import {SystemLogRepository} from "../Repository/SystemLogRepository";
import {AppError} from "./AppError";
import {CookieStore} from "./CookieHelper";
import {dbConnector as db} from "./DBConnection";
import * as core from "express-serve-static-core";
import {RouterController, RouterSet} from "./RouterSet";
import {isNullOrUndefined} from "./convenienceHelpers";
import {FSManager} from "./FSManager";
import {Passport} from "../Services/Passport";
import {HTTPStatusCode} from "./Net";
import {UserModel} from "../models/UserModel";
import {AuthController} from "../controllers/frontend/AuthController";

const eventManager = require('./GlobalEvents');

export namespace System{

    const backlog:SystemLogEntryModel[] = [];
    let interval = null;
    let isProd:boolean = null;
    let ignoreOutput:boolean = false;

    export const MAX_LOGIN_ATTEMPT = 5;
    export const LOGIN_BAN_TIMEOUT_MINUTES = 15;

    export let publicPath:string = "";
    export let storagePath:string = "";
    export let cookieStore:CookieStore;
    export let requestTimeStart:bigint;
    export let rootPath:string = "";

    export const fs = require("fs");
    export const path = require("path");

    export const InstanceId = require("crypto").randomBytes(12).toString('hex').substr(0, 12);

    export function isProduction(){
        // check if .env file exists; if so, we are running dev mode, otherwise prod
        if (isProd === null) isProd = (process.env.IS_PROD == "true");
        return isProd;
    }

    export enum OUTPUT_TYPE{
        UNKNOWN = 0x99,
        INTEGRATION_ERR,
        LOG,
        CALLBACK_ERR = 0x05,
        NAVIGATION,
        SIGNAL_ERR = 0x03,
        DB_BOOT = 0x02,
        APP_BOOT= 0x01,
        NORMAL = 0x00,
        NONE = 0x00
    }

    export async function randomString(size=8, clip:number=size*2){
        return new Promise<string>(resolve => {
            require("crypto").randomBytes(size, (err, buf)=>{
                let r = buf.toString('hex');
                if (r.length > clip) r = r.substring(0, clip);
                resolve(r);
            });
        });
    }

    export async function fatal(err:Error, errcode?:System.OUTPUT_TYPE, extraInfo?:string){
        await System.error(err, errcode, extraInfo);
        attemptSafeTerminate();
    }

    export async function error(err:Error|AppError, errcode?:System.OUTPUT_TYPE, extraInfo?:string){
        let e = <AppError>(!isNullOrUndefined(err['isAppError']) ? err : AppError.createFrom(err));
        let message = e.message;

        let xs = (err || err.stack).toString() + "\n\n\n";

        if (extraInfo) {
            message += "\n\n\t" + extraInfo;
            xs += extraInfo;
        }

        await System.log(e.type, `${e.originalStack ?? e.stack}\n\t${message}`, errcode, xs);
    }

    export async function log(title:string, message:string, errCode?:System.OUTPUT_TYPE, extras:string=""){

        if (ignoreOutput) return;

        if (!errCode) errCode = System.OUTPUT_TYPE.NONE;
        let err_code_normalized = System.OUTPUT_TYPE[errCode];

        if (System.isProduction()){
            let entry = new SystemLogEntryModel();
            entry.title = title;
            entry.message = message;
            entry.errorCode = err_code_normalized;
            entry.reference = System.InstanceId;
            entry.extraInfo = extras;

            if ( backlog.length > 0 || SystemLogRepository.isConnectionReady() === false ){
                pushToBacklog(entry);
            }
            else{
                await SystemLogRepository.save(entry);
            }
        }
        else{
            console.group("System Log");
            console.log("Title: " + title);
            console.log("Message: " + message);
            console.log("ErrCode: " + err_code_normalized);
            console.log("");
            console.groupEnd();
        }
    }

    export function haltOutput(){
        ignoreOutput = true;
    }

    export function releaseOutput(){
        ignoreOutput = false;
    }

    function pushToBacklog(logEntry:SystemLogEntryModel){

        backlog.push(logEntry);

        if (backlog.length !== 0 && interval === null){
            interval = setInterval(async ()=>{
                if ( SystemLogRepository.isConnectionReady() ){
                    clearInterval(interval);
                    interval = null;
                    while (backlog.length > 0){
                        let entry = backlog.shift();
                        await SystemLogRepository.save(entry);
                    }
                }
            },500).unref();
        }

    }

    function flushBacklog(){
        while (backlog.length > 0){
            let entry = backlog.shift();
            console.group("System Log Flush");
            console.log("Title: " + entry.title);
            console.log("Message: " + entry.message);
            console.log("ErrCode: " + entry.errorCode);
            console.log("");
            console.groupEnd();
        }
    }

    function signal(code:string){
        return err => {
            if (err && err.stack) System.error(err, OUTPUT_TYPE.SIGNAL_ERR, "Signal received with error");
            else System.log("Signal", code, OUTPUT_TYPE.NONE);
            System.attemptSafeTerminate();
        }
    }

    export function attemptSafeTerminate(){
        System.log("Status","Attempting safe terminate");
        let eventManager = require("./GlobalEvents");

        if (backlog.length > 0) flushBacklog(); // flushes backlog into stdout

        eventManager.listen("UNLOADED", ()=>{
            setTimeout(process.exit,1000).unref()
        }, { singleUse: true });

        eventManager.trigger("TERMINATE"); // tell app to shutdown
    }

    export function attachTerminateListeners(server){

        // catch app level errors in case
        process.on("uncaughtException",err => {
            System.fatal(err, System.OUTPUT_TYPE.APP_BOOT,"uncaughtException");
        });

        // catch process shutdown requests
        process.on("SIGTERM", signal("SIGTERM"));
        process.on("SIGINT", signal("SIGINT"));

        eventManager.listen("QUIT", ()=>{
            System.log("Status","Quitting instance...", OUTPUT_TYPE.LOG);
            // give app 5s to respond to shutdown request. If it takes longer, it will be killed with code of 1
            setTimeout(process.exit,5000, 1).unref()
        }, { singleUse: true });

        // listen for terminate events and gracefully release resources
        eventManager.listen("TERMINATE", async ()=>{

            System.log("Status","Releasing resources...", OUTPUT_TYPE.LOG);
            db.end().then(()=>{
                server.close(()=>{
                    if (db.isReleased) eventManager.trigger("UNLOADED");
                    else eventManager.trigger("QUIT");
                });
            });

        },{ singleUse: true });

        eventManager.listen("STACK_READY", async () => {
            await System.log("Status","Checking logs...", OUTPUT_TYPE.LOG);
            let allLogs = await SystemLogRepository.getAll();
            if (allLogs?.length > 0){
                await System.log("Status","Cleaning logs...", OUTPUT_TYPE.LOG);
                allLogs.forEach(element => {
                    if(Date.now() >= element.expiry.getTime()){
                        SystemLogRepository.delete(element);
                    }
                });
            }
        }, {autoTriggerIfMissed: true, singleUse: true});
    }

    export function loader(app:core.Express){
        const subdomain = require("express-subdomain");
        let loaders = {
            registerBaseControllers: (...routers:RouterSet[])=>{
                routers.forEach(r => {
                    let hostRouter = r.getRouter();
                    app.use("/", hostRouter.baseRouter);
                });
                return loaders;
            },
            registerSubDomainController: (sub:string, routers:RouterSet[])=>{
                let hostRouter:RouterController = undefined;
                routers.forEach(router => {
                    hostRouter = router.getRouter(hostRouter);
                });
                app.use(subdomain(sub, hostRouter.baseRouter));

                return loaders;
            }
        };

        return loaders;
    }

    export namespace Middlewares{

        export function LogRequest(){
            return function(req,res,next){
                System.log("Request", req.url, System.OUTPUT_TYPE.NAVIGATION, JSON.stringify({
                    headers : req.headers,
                    params : req.params,
                    query : req.query
                },null,"\t"));
                next();
            }
        }

        export function TimeRequest(){
            return function(req,res,next){
                System.requestTimeStart = process.hrtime.bigint();
                next();
            }
        }

        export function CookieHandler(){
            return async function(req, res, next){
                cookieStore = new CookieStore(req, res);
                next();
                return;
            }
        }

        export function SecurityMiddleware(){
            const CSRFCookieName = "_csrf";
            return async function (req, res, next){
                let authCheck = await Passport.isAuthenticated();
                let isAuthorized = authCheck.object.isSuccessful;
                let user:UserModel = authCheck.object.payload['user'];

                if ( req.subdomains[0] === "api" || req.url.startsWith("/api/") ){
                    let cookieCSRF = cookieStore.get(CSRFCookieName);

                    if (System.isProduction()){
                        if (cookieCSRF === undefined){
                            res.status(HTTPStatusCode.Forbidden);
                            res.send('CSRF token invalid');
                            return;
                        }
                        else{
                            let providedCSRFToken = req.header('CSRF-Token') ?? req.header('X-CSRF-TOKEN') ?? req.query['CSRF_Token'] ?? req.body['CSRF_Token'];
                            if (providedCSRFToken === undefined || providedCSRFToken !== cookieCSRF){
                                res.status(HTTPStatusCode.Forbidden);
                                res.send('CSRF token mismatch');
                                return;
                            }
                        }
                    }
                    next();
                }
                else{
                    let csrfToken = require("crypto").randomBytes(32).toString('hex');
                    cookieStore.set(CSRFCookieName, csrfToken, {overwrite: true});
                    req.csrfToken = function(){ return csrfToken };

                    if (req.url.startsWith("/login") || req.url.startsWith("/register")){
                        next();
                    }
                    else if (req.url.startsWith("/admin/") && !user.isAdmin){
                        res.status(HTTPStatusCode.Forbidden)
                            .render("pages/not_authorized", {
                                message: "You do not have permission to access this page"
                            });
                    }
                    else if (isAuthorized){
                        next();
                    }
                    else res.redirect(AuthController.path("/login"));
                }
            }
        }

        export function FormHandlerMiddleware(){
            let multer = require("multer");
            return function(req,res,next){
                let accept = multer({
                    preservePath: true,
                    limits: {
                        fileSize: 10_000_000
                    },
                    storage : multer.diskStorage({
                        destination: System.storagePath,
                        filename: function (req, file, cb) {
                            cb(null, `${Date.now()}-${file.originalname}`);
                        }
                    })
                }).any();
                accept(req, res, function(){
                    FSManager.setIncomingFiles(req.files);
                    req.files = FSManager.getIncomingFiles();
                    next();
                });
            }
        }

        export function GlobalVariableMiddleware(options:JSONObject)
        export function GlobalVariableMiddleware(optionBuilder:Function)
        export function GlobalVariableMiddleware(optionOrBuilder:JSONObject|Function){
            return async function(req,res,next){
                let options = typeof(optionOrBuilder) === "function" ? await optionOrBuilder.call(req, res) : optionOrBuilder;
                for (const k of Object.keys(options)) {
                    res.locals[k] = typeof(options[k]) === "function" ? await options[k].call(null, req, res) : options[k];
                }
                next();
            }
        }

        export function CORSMiddleware(){
            const cors = require("cors");

            return function(req, res, next){
                return cors(function (req, callback) {
                    // if (originWhitelist.indexOf(req.header('Origin')) > -1) {
                        res.header("Access-Control-Allow-Credentials", "true");
                        callback(null, {origin: true});
                    // } else {
                    //     callback(null, {origin: false});
                    // }
                })(req, res, next);
            }
        }
    }

}

module.exports.default = System;