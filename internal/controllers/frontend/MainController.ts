
import {RouterSet} from "../../config/RouterSet";
import {Passport} from "../../Services/Passport";

export const MainController = new RouterSet((router) => {

    router.onGET("/contact", async function(req, res){
        res.render("pages/contact"); // user-mode register
    });

    router.onGET("/settings", async function(req, res){
        res.render("pages/settings"); // user-mode register
    });

    return router;

});



