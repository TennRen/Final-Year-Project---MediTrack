
import {RouterSet} from "../../config/RouterSet";
import {Passport} from "../../Services/Passport";

export const AccountController = new RouterSet("/account", (router) => {

    router.onGET("/logout", async function(req, res){
        await Passport.voidSession();
        res.redirect("/");
    });

    return router;

});



