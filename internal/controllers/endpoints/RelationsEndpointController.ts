import {Passport} from "../../Services/Passport";
import {RouterSet} from "../../config/RouterSet";
import getCurrentUser = Passport.getCurrentUser;
import {ContactModel} from "../../models/ContactModel";
import {RelationsRepository} from "../../Repository/RelationsRepository";
import {UserRepository} from "../../Repository/UserRepository";
import {JSONResponse} from "../../config/JSONResponse";

export const RelationsEndpointController = new RouterSet("/api/relation", (router)=>{

    router.onPOST("/feedback", async function (req, res) {

        let user = await getCurrentUser();
        let title = req.body['title'];
        let message = req.body['message'];

        if (title.trim().length <= 2){
            res.json(JSONResponse(
                false,
                "Title too short",
                "The title should be more than 2 characters long"
            ));
            res.end();
            return;
        }

        if (message.trim().length <= 16){
            res.json(JSONResponse(
                false,
                "Message too short",
                "The message should be more than 16 characters long"
            ));
            res.end();
            return;
        }

        let feedback = new ContactModel();
        feedback.title = title;
        feedback.message = message;
        feedback.patient = user;
        await RelationsRepository.save(feedback);
        user.communications.push(feedback);
        await UserRepository.update(user);

        res.json(JSONResponse(
            true,
            "Thank you",
            "Thanks for getting in touch"
        ));
        res.end();

    });

    return router;
});


