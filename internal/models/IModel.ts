import {CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn} from "typeorm";

export interface IModel {
    id: number;
    createdAt: Date;
    updatedAt: Date;
}

export abstract class BaseModel implements IModel{

    toJSON(){
        let ignores = this.constructor[Symbol.for( this.constructor.name )];
        let finalObject = {};

        Object.keys(this).forEach(propName => {
            if (ignores && ignores.indexOf(propName) > -1) return;
            if (this[propName] && this[propName]['toJSON']){
                finalObject[propName] = this[propName].toJSON();
            }
            else{
                finalObject[propName] = this[propName];
            }
        });
        return finalObject;
    }

    valueOf(){
        return this.toJSON();
    }

    toString(){
        return JSON.stringify(this.toJSON());
    }

    @PrimaryGeneratedColumn()
    id: number;

    @CreateDateColumn({name:"created_at"})
    createdAt: Date;

    @UpdateDateColumn({name:"updated_at"})
    updatedAt: Date;

}

export function jsonIgnore():any {
    return function (target, propertyKey: string, descriptor: PropertyDescriptor):void {
        let symb = Symbol.for( target.constructor.name );
        if (!target.constructor[ symb ]) target.constructor[ symb ] = [];
        target.constructor[ symb ].push(propertyKey);
    }
}