import * as superagent from "superagent";
import {BaseService} from "./BaseService";
import {getHTMLDocument, Utilities} from "../config/convenienceHelpers";
import {ApiCacheService} from "./ApiCacheService";

namespace WebMD{

    import getAsync = Utilities.getAsync;
    import isNullOrUndefined = Utilities.isNullOrUndefined;

    export interface IDrugEntry{
        code: number;
        name: string;
        title: string;
        drug_id_s: string;
        id: string;
        istop_s: "true"|"false";
        mono_id_s: string;
        url_s: string;
    }

    export interface IDrugInteractionInformation{
        Strength: string;
        Severity: string;
        Comments: string;
        Mechanism: string;
    }

    export interface IDrugInteraction{
        id: number;
        primary: string;
        secondary: string;
        SeverityId: number;
        StrengthId: number;
        informationEntries: Array<IDrugInteractionInformation>;
    }

    export interface IDrugEntryInfo {
        howTo: string;
        sideEffects: string;
        images: Array<{
            src: string;
            alt: string;
        }>;
    }

    export async function findDrug(keyword:string):Promise<Utilities.Collection<IDrugEntry>>{
        return new Promise(resolve => {
            let url = `https://www.webmd.com/search/2/api/dfetypeahead?q=${ encodeURIComponent(keyword) }&type=AZFDBDRUGS&cache_2=true`;

            ApiCacheService.getWithFallback({
                endpointPath: url,
                ignoreExpired: true,
                includeExpiredOnFail: true,
                fallback: async (store, fail)=>{
                    superagent.get(url).then(res => {
                        store(res.text.trim());
                    }).catch(err => {
                        fail(err);
                    });
                }
            }).then((res:string) => {
                let document = JSON.parse(res.trim()).data.docs;
                let code = document.code;
                let results = document.docs;

                let v:Array<IDrugEntry> = results.map(r => {
                    return Object.assign(r, {
                        name: r.title,
                        code: code
                    });
                });
                resolve( new Utilities.Collection(v) );
            }).catch(err => {
                console.log("OUCH!", err);
            });
        });
    }

    export async function getDrugDetail(drugEntry:IDrugEntry):Promise<IDrugEntryInfo>{
        return new Promise(resolve => {
            let url = `https://www.webmd.com/${ drugEntry.url_s }`;

            ApiCacheService.getWithFallback({
                endpointPath: url,
                ignoreExpired: true,
                includeExpiredOnFail: true,
                fallback: async (store, fail)=>{
                    superagent.get(url).then(res => {
                        store(res.text.trim());
                    }).catch(err => {
                        fail(err);
                    });
                }
            }).then((res:string) => {
                let document = getHTMLDocument(res);

                let howToUseParas = Array.from(document.querySelectorAll('.monograph-drug-use > p') ?? []);
                let sideEffectParas = Array.from(document.querySelectorAll('[data-page="sideeffects"] + .tab-content > .tab-text > .inner-content p') ?? []);
                let images = Array.from(document.querySelectorAll('.drug-image-large img') ?? []);

                resolve( {
                    howTo: howToUseParas.map(p => p.textContent).join("<br/>"),
                    sideEffects: sideEffectParas.map(p => p.textContent).join("<br/>"),
                    images: images.map(i => {
                        return {
                            src: i.getAttribute('src'),
                            alt: i.getAttribute('alt')
                        }
                    })
                } );
            }).catch(err => {
                console.log("OUCH!", err);
            });
        });
    }

    export async function getInteractions(primaryDrug:Partial<IDrugEntry>, secondaryDrug:Partial<IDrugEntry>): Promise<Array<IDrugInteraction>> {
        return new Promise(async (resolve, reject) => {
            let url = `https://www.webmd.com/drugs/api/DrugInteractionChecker.svc/drugsinteraction`;

            if (isNullOrUndefined(primaryDrug) || isNullOrUndefined(secondaryDrug)){
                return reject("Drug unknown");
            }

            let data = {
                DrugIds: [primaryDrug.drug_id_s.replace("FDB_",""), secondaryDrug.drug_id_s.replace("FDB_","")],
                DrugType: "FDB",
                MaxSeverityLevel: "4",
                MetaInfoType: "Consumer",
                MinSeverityLevel: "0",
            };

            let res;
            let err;
            if (await ApiCacheService.hasEntry(url + JSON.stringify(data))){
                res = (await ApiCacheService.getEntry(url + JSON.stringify(data)))?.result;
            }
            else{
                let r = await getAsync((returnResult, returnError) => {
                    superagent.post(url).send(data).set('accept', 'text').end((err, res) => {
                        if (!err) {
                            ApiCacheService.setEntry({
                                result : res.text.trim(),
                                apiPath: url + JSON.stringify(data)
                            });
                            returnResult( res.text.trim() )
                        }
                        else returnError(err);
                    });
                });
                res = r.data;
                err = r.err;
            }

            if (!err){
                let response = JSON.parse(res.trim());
                resolve(response.data.map(r => {
                    return Utilities.createObject<IDrugInteraction>({
                        id: r.id,
                        informationEntries: r.MetaInfo.map(i => {
                            return {
                                Strength: i.Strength,
                                Severity: i.Severity,
                                Comments: i.Comments,
                                Mechanism: i.Mechanism
                            }
                        }),
                        primary: r.Object.Name,
                        secondary: r.Subject.Name,
                        SeverityId: r.SeverityId,
                        StrengthId: r.StrengthId
                    });
                }));
            }
            else{
                reject(err);
            }

        });
    }

    export async function getInteractionByNames(...drugNames:string[]): Promise<Utilities.Collection<IDrugInteraction>>{
        return new Promise((resolve, reject) => {
            let possiblePairs = Utilities.getPossiblePairs(drugNames);
            Utilities.mixMatch<string>(possiblePairs[0], possiblePairs[1], async (first, second) => {
                let drugInfo1 = await WebMD.findDrug(first);
                let drugInfo2 = await WebMD.findDrug(second);
                if (!drugInfo1) console.log(`FAIL FOR ${first}`);
                if (!drugInfo2) console.log(`FAIL FOR ${second}`);
                if (!drugInfo1 || !drugInfo2) return;

                WebMD.getInteractions(drugInfo1.firstOrDefault, drugInfo2.firstOrDefault).then(v => {
                    resolve( Utilities.Collection.createFrom(v) );
                }).catch(x => {
                    reject(x);
                });
            });
        });
    }

    export async function generateInteractionTexts(collection:Utilities.Collection<IDrugInteraction>){
        if (!collection.isEmpty()){
            let c =  collection.map(v => {
                return [
                    `[${v.informationEntries[0].Severity}] ${v.primary} and ${v.secondary} interact`,
                    v.informationEntries[0].Comments,
                    v.informationEntries[0].Strength,
                    `How: ${v.informationEntries[0].Mechanism}`
                ].filter(t => t !== null).join(". ").replace(/[.]{2}/gm,".")
            });
            return Utilities.Collection.createFrom(c).unique();
        }
        return Utilities.Collection.createFrom([`There are no known interactions`]);
    }

    export async function getInteractionTexts(primaryDrugName:string, secondaryDrugName:string):Promise<Utilities.Collection<string>>{
        let r = await getInteractionByNames(primaryDrugName, secondaryDrugName);
        return generateInteractionTexts(r);
    }

}

export type DrugCollection = Utilities.Collection<WebMD.IDrugEntry>;
export type DrugInteractionCollection = Utilities.Collection<WebMD.IDrugInteraction>;

class service extends BaseService{

    async findDrugByName(name:string): Promise<DrugCollection> {
        return new Promise((resolve, reject) => {
            WebMD.findDrug(name).then(resolve).catch(reject);
        });
    }

    async getDrugInfo(drug:WebMD.IDrugEntry): Promise<WebMD.IDrugEntryInfo> {
        return new Promise((resolve, reject) => {
            WebMD.getDrugDetail(drug).then(resolve).catch(reject);
        });
    }

    async getDrugToDrugInteraction(primaryDrugID:string, secondaryDrugID:string): Promise<DrugInteractionCollection> {
        return new Promise((resolve, reject) => {
            WebMD.getInteractions({drug_id_s: primaryDrugID}, {drug_id_s: secondaryDrugID})
                .then(v => resolve( Utilities.Collection.createFrom(v) ))
                .catch(reject);
        });
    }

    async getInteractions(primaryDrugName:string, secondaryDrugName:string): Promise<DrugInteractionCollection> {
        return new Promise((resolve, reject) => {
            WebMD.getInteractionByNames(primaryDrugName, secondaryDrugName).then(resolve).catch(reject);
        });
    }

    async generateInteractionNotice(interactions:DrugInteractionCollection): Promise<string> {
        return new Promise((resolve, reject) => {
            WebMD.generateInteractionTexts(interactions).then(v => resolve(v.join("\n"))).catch(reject);
        });
    }

}

export const MedicationService = new service();
