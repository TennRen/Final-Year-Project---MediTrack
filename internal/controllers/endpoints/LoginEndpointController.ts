import {Passport} from "../../Services/Passport";
import {RouterSet} from "../../config/RouterSet";
import {UserService} from "../../Services/UserService";
import {UserModel} from "../../models/UserModel";
import {JSONResponse} from "../../config/JSONResponse";
import {isEmailAddressValid} from "../../config/convenienceHelpers";

export const LoginEndpointController = new RouterSet("/api/auth", (router)=>{

    router.onPOST("/do-login", async function (req, res) {

        let email = req.body['email'];    // set using form data
        let password = req.body['password'];    // set using form data

        let result = await Passport.authenticate(email, password);

        res. json( result.object );
        res.end();

    });

    router.onPOST("/do-signup", async function (req, res) {

        let email = (req.body['email'] || "").trim();
        let password = (req.body['password'] || "").trim();
        let firstName = req.body['firstName'];
        let lastName = req.body['lastName'];

        if (!isEmailAddressValid(email)){
            res.json(
                JSONResponse(
                    false,
                    "Email error",
                    `The email address '${email}' is not valid`,
                    {
                        type : "INVALID"
                    }
                )
            );
            res.end();
            return;
        }

        if (password.length <= 5){
            res.json(
                JSONResponse(
                    false,
                    "Password error",
                    "A password is required and must be more than 5 characters in length",
                    {
                        type : "INVALID"
                    }
                )
            );
            res.end();
            return;
        }

        if (await UserService.doesUserExist({email})){

            res.json(
                JSONResponse(
                    false,
                    "Account already exists",
                    "A user is already registered with this email address. Please sign in instead",
                    {
                        kind : "UAEXISTS"
                    }
                )
            );
            res.end();
            return;

        }

        let newAccount = new UserModel();
        newAccount.email = email;
        newAccount.firstName = firstName;
        newAccount.lastName = lastName;
        newAccount.saltine = Passport.createSaltine();
        newAccount.passHash = await Passport.hashPassword(password, newAccount.saltine);

        await UserService.registerUser(newAccount);

        res. json(
            JSONResponse(
                true,
                "Successfully signed up",
                "Please sign in to continue"
            )
        );
        res.end();

    });

    router.onPOST("/do-logout", async function(req, res){
        await Passport.voidSessionBySessionKey( req.query['sessionKey'].toString() || req.header('sessionKey') );
        res.json(JSONResponse(true));
    });

    return router;
});


