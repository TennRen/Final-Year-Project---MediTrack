import {RouterSet} from "../../config/RouterSet";
import {PrescriptionRepository} from "../../Repository/PrescriptionRepository";
import {JSONResponse} from "../../config/JSONResponse";
import {MedicationService} from "../../Services/MedicationService";
import {MedicationRepository} from "../../Repository/MedicationRepository";
import {isNullOrUndefined} from "../../config/convenienceHelpers";
import {MedicationModel} from "../../models/MedicationModel";
import {PrescriptionModel} from "../../models/PrescriptionModel";

export const PrescriptionEndpointController = new RouterSet("/api/prescription", (router)=>{

    router.onGET("/list", async function(req, res){
        let prescriptions = await PrescriptionRepository.getUserPrescriptions(res.locals.currentUser);

        res.json(JSONResponse(
            true,
            "Success",
            {
                prescriptions
            }
        ))
    });

    router.onPOST("/add", async function(req, res){

        let user = res.locals.currentUser;
        let {terms, index, frequency, days} = req.body;

        let matches = await MedicationService.findDrugByName(terms);

        // check the results are more than available index
        if (matches.length > 0){
            let m = matches.length > index ? matches[index] : matches[0];
            let existingMedicationEntry = await MedicationRepository.getByDrugID(m.id);
            if (isNullOrUndefined(existingMedicationEntry)){
                let entry = new MedicationModel();
                entry.drugName = m.name;
                entry.drugBrand = m.title;
                entry.drugID = m.id;
                existingMedicationEntry = await MedicationRepository.save(entry);
            }

            let existingPrescription = await PrescriptionRepository.getByIdentifier(user.id + "_" + existingMedicationEntry.drugID);

            if (isNullOrUndefined(existingPrescription)){
                let prescription = new PrescriptionModel();
                prescription.patient = user;
                prescription.reference = user.id + "_" + existingMedicationEntry.drugID;
                prescription.medicationInfo = existingMedicationEntry;
                prescription.doseFrequency = frequency;
                prescription.days = (days ?? ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]).join(",");

                await PrescriptionRepository.save(prescription);
            }

            res.json(JSONResponse(
                true,
                "Added prescription",
                `Prescription for "${existingMedicationEntry.drugBrand}" has been added`
            ));
        }
        else{
            res.json(JSONResponse(
                false,
                "Medication not found",
                `No Medication called "${terms}" can been found`
            ));
        }

    });

    router.onPOST("/update", async function(req, res){

        let {reference, days, frequency} = req.body;

        let prescription = await PrescriptionRepository.getByIdentifier(reference);

        if (prescription){
            if (frequency) prescription.doseFrequency = frequency;
            if (days) prescription.days = (days ?? ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]).join(",");

            await PrescriptionRepository.update(prescription);

            res.json(JSONResponse(
                true,
                "Prescription updated",
                `Prescription for "${prescription.medicationInfo.drugBrand}" has been updated`
            ));
        }
        else{
            res.json(JSONResponse(
                false,
                "Prescription not found",
                `No Prescriptions with this reference can been found`
            ));
        }

    });

    router.onGET("/view", async function(req, res){

        let {reference} = req.query;

        let prescription = await PrescriptionRepository.getByIdentifier(<string>reference);

        if (prescription){
            res.json(JSONResponse(
                true,
                "",
                {
                    prescription
                }
            ));
        }
        else{
            res.json(JSONResponse(
                false,
                "Prescription not found",
                `No Prescriptions with this reference can been found`
            ));
        }

    });

    router.onPOST("/remove", async function(req, res){

        let {reference, day} = req.body;

        let prescription = await PrescriptionRepository.getByIdentifier(reference);

        day = day.trim().toLowerCase();

        if (prescription) {
            let pDays = prescription.days.split(',').map(p => p.trim().toLowerCase());
            if (pDays.length === 1 && pDays[0] === day){
                await PrescriptionRepository.delete(prescription);
            }
            else if (pDays.length > 0){
                prescription.days = pDays.filter(p => p !== day).join(",");
                await PrescriptionRepository.update(prescription);
            }
        };

        res.json(JSONResponse(
            true,
            "Prescription removed",
            `Prescription for "${prescription.medicationInfo.drugBrand}" has been removed`
        ));

    });

    return router;
});
