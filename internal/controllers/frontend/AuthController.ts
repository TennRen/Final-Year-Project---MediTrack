
import {RouterSet} from "../../config/RouterSet";
import {Passport} from "../../Services/Passport";

export const AuthController = new RouterSet((router) => {

    router.onGET("/register", async function(req, res){
        res.render("pages/register"); // user-mode register
    });

    router.onGET("/", async function(req, res){
        res.render("pages/index");
    });

    router.onGET("/login", async function(req, res){
        if (res.locals.isAuthenticated){
            res.redirect("/");
        }
        else{
            res.render("pages/login")
        }
    });


    return router;

});



