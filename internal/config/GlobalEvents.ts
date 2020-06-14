
interface GlobalEventProperties {
    singleUse?:boolean;
    autoTriggerIfMissed?:boolean;
}

class GlobalEventManager{
    private eventRegister:Array<GlobalEvent> = [];
    private triggeredEventNames:Array<string> = [];

    public listen(eventNames:string[], handler:Function, properties?:GlobalEventProperties)
    public listen(eventName:string, handler:Function, properties?:GlobalEventProperties)
    public listen(eventNameOrNames:string|string[], handler:Function, properties:GlobalEventProperties={}){

        let listOfEventNames:string[];
        if (typeof eventNameOrNames === "string" || eventNameOrNames instanceof String){
            listOfEventNames = [<string>eventNameOrNames];
        }
        else{
            listOfEventNames = <string[]>eventNameOrNames;
        }

        listOfEventNames.forEach(eventName => {
            let p = GlobalEvent.fixProperties(properties);
            let e = new GlobalEvent(eventName,handler,p);
            this.eventRegister.push(e);
            if (p.autoTriggerIfMissed === true && this.triggeredEventNames.indexOf(eventName) > -1) e.trigger();
        });

        return this;
    }

    public trigger(eventName:string,...params:any[]){
        this.eventRegister = this.eventRegister.filter(e => {
            if (e.eventName.toLowerCase() === eventName.toLowerCase()){
                e.trigger(...params);
                return true;
            }
            else if (e.isInvalid === true){
                return false;
            }
            return true;
        });
        this.triggeredEventNames.push(eventName);
        return this;
    }
}

class GlobalEvent{
    private handler:Function = ()=>{};
    private props:GlobalEventProperties = {};
    private triggeredCount:number = 0;

    public isInvalid:boolean = false;
    public eventName:string;

    constructor(eventName:string, handler:Function, prop:GlobalEventProperties={}) {
        this.eventName = eventName;
        this.handler = handler;
        this.props = GlobalEvent.fixProperties(prop);
    }

    public trigger(...params:any[]){
        this.handler.apply(this,params);
        this.triggeredCount ++;
        if (this.props.singleUse === true && this.triggeredCount > 0){
            this.isInvalid = true;
        }
    }

    public static fixProperties(prop:GlobalEventProperties):GlobalEventProperties{
        return <GlobalEventProperties>(Object.assign({
            singleUse:false,
            autoTriggerIfMissed:false
        },prop));
    }
}

module.exports = new GlobalEventManager();