import {Column, Entity, JoinColumn, OneToOne} from "typeorm";
import {BaseModel} from "./IModel";
import {UserModel} from "./UserModel";


@Entity("sessions")
export class SessionModel extends BaseModel{

    @Column("varchar",{length: 255, unique:true})
    public sessionKey:string;

    @Column("datetime")
    public expiry:Date;

    @Column("bool",{default:false})
    public invalid:boolean;

    @OneToOne(type => UserModel, user => user.currentSession )
    public owner:UserModel;

    public get IsValid(){
        return (this.invalid === false && (Date.now() < this.expiry.getTime() + (30 * 60 * 1000) ) );
    }

}