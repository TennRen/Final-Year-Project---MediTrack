import {RouterSet} from "../../config/RouterSet";

export const MedController = new RouterSet("/med",(router) => {

    router.onGET("/pillbox", async function(req, res){
        res.render("pages/pillbox");
    });

    router.onGET("/interaction", async function(req, res){
        res.render("pages/medication");
    });

    return router;

});
