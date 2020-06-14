function isNullOrUndefined(obj:any){
    if (obj === void 0) return true;
    return obj === null;
}

namespace MediTrack{

    export function getInteractions(primaryDrugName:String, secondaryDrugName:String):Promise<ICompleteResponseJSON>{
        return new Promise((resolve, reject)=>{
            $.ajax({
                url: `/api/medication/interactions/${primaryDrugName}/${secondaryDrugName}`,
                type: "get",
                processData: false,
                success: resolve,
                error: reject
            });
        });
    }

    export function searchDrug(terms:string, verbose:boolean=false):Promise<ICompleteResponseJSON>{
        return new Promise( (resolve, reject) => {
            $.ajax({
                url: `/api/medication/search?q=${encodeURIComponent(terms)}&verbose=${verbose ? '1' : '0'}`,
                type: "get",
                processData: false,
                success: resolve,
                error: reject
            });
        });
    }

    export function getPrescriptions():Promise<ICompleteResponseJSON>{
        return new Promise( (resolve, reject) => {
            $.ajax({
                url: `/api/prescription/list`,
                type: "get",
                processData: false,
                success: resolve,
                error: reject
            });
        });
    }

    export function addNewPrescriptions(term:string, index:number, frequency:string, days:Days):Promise<ICompleteResponseJSON>{
        return new Promise( (resolve, reject) => {
            $.ajax({
                url: `/api/prescription/add`,
                type: "post",
                data: {
                    terms: term,
                    index: index,
                    frequency: frequency,
                    days: days
                },
                processData: true,
                success: resolve,
                error: reject
            });
        });
    }

    export function updatePrescriptions(reference:string, values:{frequency?:string, days?:Days}):Promise<ICompleteResponseJSON>{
        return new Promise( (resolve, reject) => {
            $.ajax({
                url: `/api/prescription/update`,
                type: "post",
                data: {
                    reference: reference,
                    frequency: values.frequency,
                    days: values.days
                },
                processData: true,
                success: resolve,
                error: reject
            });
        });
    }

    export function removePrescriptions(reference:string, day:string):Promise<ICompleteResponseJSON>{
        return new Promise( (resolve, reject) => {
            $.ajax({
                url: `/api/prescription/remove`,
                type: "post",
                data: {
                    reference: reference,
                    day: day
                },
                processData: true,
                success: resolve,
                error: reject
            });
        });
    }

    export function getSpecificPrescription(reference:string):Promise<ICompleteResponseJSON>{
        return new Promise( (resolve, reject) => {
            $.ajax({
                url: `/api/prescription/view?reference=${reference}`,
                type: "get",
                processData: false,
                success: resolve,
                error: reject
            });
        });
    }

    export async function getDrugInfo(terms:string){
        let result = await searchDrug(terms, true);
        let howTo = "Not Found. Please refer to your Doctor for guidance";
        let sideEffects = "No listed side-effects. Please refer to your Doctor for more information";

        for (let entry of result.payload.results){
            if (terms.split(" ")[0] === entry.title.split(" ")[0]){
                if (entry.howTo) howTo = entry.howTo;
                if (entry.sideEffects) sideEffects = entry.sideEffects;
            }
        }

        return {
            howTo,
            sideEffects,
            results: result.payload.results
        }
    }

    export namespace UI{

        export function showLoader(message?:string, rootDom?:HTMLElement){
            let overlayEl = document.createElement("div");
            overlayEl.className = 'overlay';
            overlayEl.innerHTML = `<div class="center-container">
                <div class="loader"></div> ${ message ? `<span>${message}</span>` : '' }
            </div>`;
            (rootDom ?? document.body).appendChild(overlayEl);

            setTimeout(()=> overlayEl.classList.add('visible'),50);

            return {
                close: (callback?)=>{
                    setTimeout(()=> {
                        overlayEl.remove();
                        callback?.();
                    }, 350);
                }
            }
        }

    }

}