import {RouterSet} from "../../config/RouterSet";
import { MedicationService } from "../../Services/MedicationService";
import {JSONResponse} from "../../config/JSONResponse";
import {Utilities} from "../../config/convenienceHelpers";

export const MedicationEndpointController = new RouterSet("/api/medication", (router)=>{

    // api/medication/interactions/warfarin/sertraline
    router.onGET("/interactions/:drugName1/:drugName2", async (req,res)=>{
        MedicationService.getInteractions(req.params["drugName1"], req.params["drugName2"]).then(async result => {
            let notices = await MedicationService.generateInteractionNotice(result);
            res.json({
                err: null,
                notices: notices
            });
        }).catch(x => {
            res.json({
                err: x,
                notices: [x]
            });
        });
    });

    router.onGET("/search", async (req, res) => {
        let terms = <string>req.query['q'];
        let verbose = req.query['verbose'] == '1';
        MedicationService.findDrugByName(terms).then(async r => {
            if (verbose){
                r = Utilities.Collection.createFrom(await Promise.all(r.map(async entry => {
                    return Object.assign(entry, await MedicationService.getDrugInfo(entry));
                })));
            }
            res.json(JSONResponse(
                true,
                "Results",
                {
                    results: r
                }
            ));
        }).catch(ex => {
            res.json(JSONResponse(
                false,
                "Error",
                ex
            ));
        });
    });

    return router;
});
