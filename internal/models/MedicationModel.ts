import {Column, Entity} from "typeorm";
import {BaseModel} from "./IModel";

export enum DrugForm{
    TABLET,
    CREAM,
    LIQUID,
    CAPSULE,
    DROPS,
    INHALER,
    IMPLANT,
    PATCH
}

@Entity("medication")
export class MedicationModel extends BaseModel{

    @Column("varchar",{ length: 255, nullable:true})
    public drugBrand:string;

    @Column("varchar",{ length: 255 })
    public drugName:string;

    @Column("varchar", {length: 255})
    public drugID:string;

    @Column({
        type: "enum",
        enum: DrugForm,
        default: DrugForm.TABLET
    })
    public drugFormat:DrugForm;

}