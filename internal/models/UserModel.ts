import {BaseModel, jsonIgnore} from "./IModel";
import {Column, Entity, JoinColumn, OneToMany, OneToOne} from "typeorm";
import {SessionModel} from "./SessionModel";
import {PrescriptionModel} from "./PrescriptionModel";
import {ContactModel} from "./ContactModel";

@Entity("users")
export class UserModel extends BaseModel{

    @Column("varchar",{length:255, nullable: true})
    public firstName:string;

    @Column("varchar",{length:255, nullable: true})
    public lastName:string;

    @Column("varchar", {length:255, nullable:true})
    public email:string;

    @Column("varchar", {length: 255, default: "01/01/1969"})
    @jsonIgnore()
    public DOB:string; // DD/MM/YYYY

    @Column("varchar",{length:255, nullable:true, name:"password_hash"})
    @jsonIgnore()
    public passHash:string;

    @Column("boolean", {default: false})
    public isAdmin:boolean;

    @Column("varchar", {length:255,nullable:true, name:"saltine"})
    @jsonIgnore()
    public saltine:string;

    @OneToOne( type => SessionModel, session => session.owner ,   {
        nullable: true,
        cascade:['insert','update','remove'],
        eager: true
    } )
    @JoinColumn()
    @jsonIgnore()
    public currentSession:SessionModel;

    @OneToMany(type => PrescriptionModel, prescription => prescription.patient, {
        onDelete: "CASCADE",
        eager:true
    })
    public prescriptions:PrescriptionModel[];

    @OneToMany(type => ContactModel, feedback => feedback.patient, {
        onDelete: "CASCADE",
        eager:true
    })
    public communications:ContactModel[];

}