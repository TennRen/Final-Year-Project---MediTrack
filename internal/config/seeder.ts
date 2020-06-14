import {UserModel} from "../models/UserModel";
import {Passport} from "../Services/Passport";
import {System} from "./System";
import {UserRepository} from "../Repository/UserRepository";
import {MedicationModel} from "../models/MedicationModel";
import {MedicationRepository} from "../Repository/MedicationRepository";
import {AdministerRoute, PrescriptionModel} from "../models/PrescriptionModel";
import {PrescriptionRepository} from "../Repository/PrescriptionRepository";
import {MedicationService} from "../Services/MedicationService";

(async function(){

    async function seedUser(props:Partial<UserModel>){
        let user = new UserModel();
        Object.keys(props).forEach(propName => {
            if (propName === "saltine" || propName === "passHash") return;
            user[propName] = props[propName];
        });

        user.saltine = Passport.createSaltine();
        user.passHash = await Passport.hashPassword("password1", user.saltine);

        console.log("adding",props.firstName,"account");

        let existingUser = await UserRepository.getByEmail(props.email);
        if (existingUser === undefined ){
            return await UserRepository.save(user);
        }

        return existingUser;
    }

    async function seedMedication(props:Partial<MedicationModel>){
        let medicationModel = new MedicationModel();
        Object.keys(props).forEach(propName => {
            medicationModel[propName] = props[propName];
        });

        console.log(`adding ${props.drugName} (${props.drugBrand})`);

        let existingMedication = await MedicationRepository.getByDrugID(props.drugID);
        if (existingMedication === undefined ){
            return await MedicationRepository.save(medicationModel);
        }
        return existingMedication;
    }

    async function seedPrescription(props:Partial<PrescriptionModel>){
        let prescription = new PrescriptionModel();
        Object.keys(props).forEach(propName => {
            prescription[propName] = props[propName];
        });

        console.log(`adding ${props.medicationInfo.drugName} (${props.medicationInfo.drugBrand}) to prescription ${props.reference}`);

        let existingPrescription = await PrescriptionRepository.getByIdentifier(props.reference);
        if (existingPrescription === undefined ){
            return await PrescriptionRepository.save(prescription);
        }
        return existingPrescription;
    }

    await System.log('Status',"SEEDING...", System.OUTPUT_TYPE.NONE);

    let getMed = (async (n)=>{
        let m = (await MedicationService.findDrugByName(n)).firstOrDefault;
        return await seedMedication({
            drugBrand: m?.name,
            drugName: m?.name,
            drugID: m?.drug_id_s
        });
    });

    let mainAccount = await seedUser({
        firstName: "Tennessee",
        lastName : "Renvoize",
        email : "missuberdevils@gmail.com",
        isAdmin : true,
        DOB:"26/09/1996"
    });

    let testAccount = await seedUser({
        firstName: "Avery",
        lastName : "Bird",
        email : "cuckoo.bird@mail.com"
    });

    await System.log('Status',"SEEDING COMPLETE", System.OUTPUT_TYPE.LOG);
})();