import * as http from "http";
import {System} from "./System";
import {Passport} from "../Services/Passport";
import {UserModel} from "../models/UserModel";
import {UserRepository} from "../Repository/UserRepository";
import {AuthController} from "../controllers/frontend/AuthController";
import {MedController} from "../controllers/frontend/MedController";
import {MainController} from "../controllers/frontend/MainController";
import {AccountController} from "../controllers/frontend/AccountController";
import {LoginEndpointController} from "../controllers/endpoints/LoginEndpointController";
import { MedicationEndpointController } from "../controllers/endpoints/MedicationEndpointController";
import {RelationsEndpointController} from "../controllers/endpoints/RelationsEndpointController";
import {PrescriptionEndpointController} from "../controllers/endpoints/PrescriptionEndpointController";


const PORT = process.env.PORT || 3000;
const eventManager = require('./GlobalEvents');

let isTest:boolean = false;

let server:http.Server = null;

module.exports = {

    bootstrap : (express)=>{
        const app = express();
        const loader = System.loader(app);
        require("./DBConnection");

        // CORS requests
        app.use(System.Middlewares.CORSMiddleware());

        app.set('views', require("path").resolve(__dirname,"../views") );
        app.set('view engine', 'ejs');
        app.set('env', System.isProduction() ? "production" : "development");

        app.use(express.json());                                    // to support JSON-encoded bodies
        app.use(express.urlencoded({ extended: true }));    // to support URL-encoded bodies
        app.use('/public',express.static("public"));    // makes public folder directly accessible

        // Log request
        app.use(System.Middlewares.TimeRequest());

        // Cookies
        app.use(System.Middlewares.CookieHandler());

        // Log request
        app.use(System.Middlewares.LogRequest());

        // CSRF tokens
        app.use(System.Middlewares.SecurityMiddleware());

        app.use(System.Middlewares.FormHandlerMiddleware());

        app.use(System.Middlewares.GlobalVariableMiddleware(async (req, res)=>{
            let authCheck = await Passport.isAuthenticated();
            let isAuthorized = authCheck.object.isSuccessful;
            let user:UserModel = authCheck.object.payload['user'];
            return {
                productName: "MediTrack",
                isAuthenticated : isAuthorized,
                currentUser : user,
                isAdmin : user?.isAdmin,
                SystemInfo: {
                    instance: System.InstanceId,
                    hostName: "localhost:3000"
                },
                title: ''
            }
        }));

        // Routes
        loader.registerBaseControllers(
            AuthController,
            MedController,
            MainController,
            AccountController,
            LoginEndpointController,
            MedicationEndpointController,
            RelationsEndpointController,
            PrescriptionEndpointController
        );


        server =  app.listen(PORT, () => {
            eventManager.trigger("APP_READY", PORT);

            eventManager.listen("DB_READY", ()=>{
                eventManager.trigger("STACK_READY",server);
                System.log('Status',`DB is running on port 3306 (${PORT})`);

                if (!System.isProduction() && !isTest) require("./seeder");
            },{singleUse:true,autoTriggerIfMissed:true});
        });

        System.attachTerminateListeners(server);

        return server;
    },

    setStoragePath : (p:string)=>{
        System.storagePath = p;
    },

    setPublicPath : (p:string)=>{
        System.publicPath = p;
    },

    enableTestMode: ()=>{
        isTest = true;
        System.haltOutput();
    },

    getServer: async ()=>{
        return new Promise<http.Server>(resolve => {
            if (server === null){
                eventManager.listen("STACK_READY", function(serv){
                    resolve(serv);
                });
            }
            else resolve(server);
        });
    }

};