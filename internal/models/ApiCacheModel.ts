import {BaseModel} from "./IModel";
import {BeforeInsert, BeforeUpdate, Column, Entity} from "typeorm";

@Entity("api_cache")
export class ApiCacheModel extends BaseModel{

    @Column("varchar",{length: 255, unique: true})
    public apiPath:string;

    @Column("longtext", {nullable: false})
    public result:string;

    @Column("datetime")
    public expiry:Date;

    @BeforeInsert()
    @BeforeUpdate()
    private setExpiry(){
        // set expiry to 28days in future from current time
        this.expiry = new Date( Date.now() + (28 * 24 * 60 * 60_000) );
    }

    public get isOutdated():boolean{
        return ( Date.now() >= this.expiry.getTime() );
    }

}