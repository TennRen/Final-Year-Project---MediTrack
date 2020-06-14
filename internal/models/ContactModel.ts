import {Column, Entity, JoinColumn, ManyToOne} from "typeorm";
import {BaseModel} from "./IModel";
import {UserModel} from "./UserModel";

@Entity("feedback")
export class ContactModel extends BaseModel{

    @Column("varchar", {length: 255})
    public title:string;

    @Column("text")
    public message:string;

    @Column("text", {nullable:true})
    public response:string;

    @ManyToOne(type => UserModel, user => user.communications)
    @JoinColumn()
    public patient:UserModel;

    public hasResponse():boolean{
        return this.response !== null && this.response !== "";
    }
}