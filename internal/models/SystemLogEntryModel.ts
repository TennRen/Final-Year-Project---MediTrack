import {BeforeInsert, Column, Entity} from "typeorm";
import {BaseModel} from "./IModel";


@Entity("work_log")
export class SystemLogEntryModel extends BaseModel{

    @Column("varchar",{length: 255, nullable: true})
    public title:string;

    @Column("text")
    public message:string;

    @Column("varchar",{length:12, nullable: true, name:'err-code'})
    public errorCode:string;

    @BeforeInsert()
    private setExpiry(){
        this.expiry = new Date( Date.now() + 30 * 60_000 );
    }

    @Column("text",{ nullable : true })
    public extraInfo:string;

    @Column("varchar")
    public reference:string;

    @Column("datetime")
    public expiry:Date;

}