import {JSONResp} from "../config/JSONResponse";
import {SessionModel} from "../models/SessionModel";
import {UserModel} from "../models/UserModel";
import {UserRepository} from "../Repository/UserRepository";
import {SessionRepository} from "../Repository/SessionRepository";
import {TimeHelper} from "../config/TimeHelper";
import {System} from "../config/System";
import {isNullOrUndefined} from "../config/convenienceHelpers";
import {v4 as uuid} from 'uuid';

const Crypto = require("crypto");

export namespace Passport{

    export async function getCurrentUser():Promise<UserModel>{
        let authCheck = await Passport.isAuthenticated();
        if (authCheck.object.isSuccessful) {
            return authCheck.object.payload['user'];
        }
        return undefined;
    }

    export async function getCurrentUserFromSession(sessionKey:string):Promise<UserModel>{
        let authCheck = await Passport.getSessionIfValid(sessionKey);
        return authCheck?.owner;
    }

    export function createSaltine(){
        let salt = Crypto.createHash("sha256").update(Crypto.randomBytes(128)).digest('hex');
        let iter = Math.random() * (32 - 8) + 8; // min 8 max 32
        return `${salt}::${iter}`;
    }

    export async function hashPassword(password:string,saltine?:string){
        return new Promise<string>(resolve => {

            let salt:string = saltine.split("::")[0];
            let iter:number = parseInt(saltine.split("::")[1]);

            if (iter < 0 || iter > 32) iter = 16;

            Crypto.scrypt(password, salt, 64, (err, key)=>{
                let k = key.toString('hex');
                while (iter > 0){
                    k = Crypto.createHash("sha256").update(k).digest('hex');
                    iter --;
                }
                resolve(k);
            });

        });
    }

    export async function authenticate(email:string, password:string){

        let result:JSONResp = await this.isCredentialValid(email,password);

        let acc = await UserRepository.getByEmail(email);

        if (acc === undefined) return result;

        let sesh = acc.currentSession;

        if (sesh){
            sesh.invalid = true;
            await SessionRepository.save(sesh);
        }

        if (result.object.isSuccessful){

            sesh = new SessionModel();
            sesh.expiry = TimeHelper.minutesFromNow(30);
            sesh.sessionKey = uuid();
            sesh.invalid = false;

            acc.currentSession = sesh;
            await UserRepository.save(acc);

            System.cookieStore.set("_passport", sesh.sessionKey,{expires: sesh.expiry});

            return new JSONResp(true, "Success", {
                token: sesh.sessionKey
            });

        }
        else{
            return result;
        }

    }

    export async function isCredentialValid(email:string, password:string){
        let user = await UserRepository.getByEmail(email);

        if (user === undefined){
            return new JSONResp(false,"Incorrect email address","No users with that email address was found",{
                email: email
            });
        }

        let hashedPassword = await this.hashPassword(password, user.saltine);
        if ( user.passHash === hashedPassword ){
            return new JSONResp(true);
        }
        return new JSONResp(false, "Incorrect password", "Password incorrect. Please try again");
    }

    export async function isAuthenticated(){

        let passportToken = System.cookieStore.get("_passport");

        if (passportToken){
            let session = await SessionRepository.getBySessionKey(passportToken);

            if (session && session.IsValid){
                return new JSONResp(true,"Authenticated",{ user: session.owner });
            }
            return new JSONResp(false);
        }
        else{
            return new JSONResp(false);
        }

    }

    export async function getSessionIfValid(sessionKey:string){

        let session = await SessionRepository.getBySessionKey(sessionKey);

        if (session && session.IsValid){
            return session;
        }
        return undefined;

    }

    export async function voidSession(){

        let authCheck = await this.isAuthenticated();

        if (authCheck.object.isSuccessful){
            // user is authenticated, void session
            let user:UserModel = authCheck.object.payload['user'];
            await voidSessionBySessionKey(user.currentSession.sessionKey);
        }

    }

    export async function voidSessionBySessionKey(sessionKey:string){

        let session = await getSessionIfValid(sessionKey);

        if ( isNullOrUndefined(session) === false ){
            session.owner.currentSession.invalid = true;
            await SessionRepository.save(session.owner.currentSession);
        }

    }

    export async function createHash64(){
        return require("crypto").randomBytes(32).toString('hex');
    }

}

module.exports.default = Passport;