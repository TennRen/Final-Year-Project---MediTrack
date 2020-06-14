import {BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, JoinTable, ManyToOne} from "typeorm";
import {BaseModel} from "./IModel";
import {MedicationModel} from "./MedicationModel";
import {UserModel} from "./UserModel";

export enum AdministerRoute{
    ORAL,
    INTRAVENOUS,
    BUCCAL, // inside tube
    ENTERAL, // via tube to intestine
    INHALABLE,
    INFUSED, // IV drip
    INTRAMUSCULAR,
    INTRATHECAL, // injected into spine
    NASAL,
    OPHTHALMIC,
    OTIC, // ear
    RECTAL,
    SUBCUTANEOUS, // under skin
    SUBLINGUAL, // under tongue
    TOPICAL, // skin
    TRANSDERMAL, // patch on skin
}

@Entity("prescription")
export class PrescriptionModel extends BaseModel{

    @Column("varchar", {length: 255, default: "a day"})
    public doseFrequency:string;

    @Column("varchar", {length: 255, default:""})
    public days:string;

    @Column("varchar", {length: 140, unique: true})
    public reference:string;

    @ManyToOne(type => UserModel, user => user.prescriptions)
    @JoinColumn()
    public patient:UserModel;

    @ManyToOne(type => MedicationModel)
    @JoinTable()
    public medicationInfo:MedicationModel;

    @BeforeInsert()
    private setReference(){
        if (this.reference === null) this.reference = [...Array(16)].map(_=>(~~(Math.random()*36)).toString(36)).join('')
    }

}