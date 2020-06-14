
namespace Tools{

    let readyHandlers = [];
    let isReady = false;
    let buildInfoTapCount = 7;

    type scriptTagAttributes = { src:string, crossorigin?:string, async?:"async", defer?:"defer" };

    interface Attributes{
        [name:string]:number|string|boolean;
    }

    export function ElementBuilder(tagName:string)
    export function ElementBuilder(tagName:string, attributes?:Attributes)
    export function ElementBuilder(tagName:string, innerHtml?:string)
    export function ElementBuilder(tagName:string, attributes?:Attributes, innerHtml?:string)
    export function ElementBuilder(tagName:string, attributesOrInnerHtml?:Attributes|string, innerHtml?:string){

        let x = (typeof attributesOrInnerHtml === "string" || attributesOrInnerHtml instanceof String);

        let elementTagName = tagName;
        let elementAttrs:Attributes = x ? {} : <Attributes>attributesOrInnerHtml;
        let html = x ? <string>attributesOrInnerHtml : "";
        if (innerHtml) html = innerHtml;

        let element = document.createElement(elementTagName);

        if (elementAttrs) Object.keys(elementAttrs).forEach(key => {
            element.setAttribute(key, <string>elementAttrs[key]);
        });

        if (html) element.innerHTML = html;

        return {
            create: function(changeInterceptor?:(element:HTMLElement)=>void){
                if (changeInterceptor) changeInterceptor(element);
                return element;
            },
            valueOf: function(){
                return element;
            }
        }

    }

    export function getCookie(name:string){
        /// Adapted from https://www.w3schools.com/js/js_cookies.asp
        let nameEQ = name + "=";
        let ca = document.cookie.split(';');
        for(let i=0;i < ca.length;i++) {
            let c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return null;
    }

    export function csrfToken(){
        return getCookie("_csrf");
    }

    export function sessionKey(){
        return getCookie("_passport");
    }

    export function showLoading(autoStart:boolean=true){
        let id = "loading-fence";
        let l = {
            stop : ()=>{
                let wall = $('#'+id).removeClass('built');
                setTimeout(()=>{
                    wall.remove();
                },300);
                return l;
            },
            start : ()=>{
                let wall = $(`<div class="wall" id="${id}"> <i class="fas fa-spinner fa-pulse"></i> <h5>This may take up to a minute...</h5> </div>`);

                $(document.body).append(wall);

                setTimeout(()=>{
                    wall.addClass("built");
                },100);

                return l;
            }
        };

        return (autoStart ? l.start() : l);
    }

    export function ButtonStateSwapper(btn:HTMLElement){
        let content = "";
        let originalPointerEvent = "";
        let l = {
            setLoading : ()=>{
                content = btn.innerHTML;
                originalPointerEvent = btn.style.pointerEvents;
                btn.innerHTML = `<i class="fas fa-spinner fa-pulse"></i>`;
                btn.style.pointerEvents = "none";
                return l;
            },
            reset : ()=>{
                btn.innerHTML = content;
                btn.style.pointerEvents = originalPointerEvent;
                return l;
            }
        };
        return l;
    }

    export function showAlert(title:string, message:string, optionalCallback?){
        let m = new XModal(message,title, XModalType.ALERT);

        let initialOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        m.open({
            okay_btn: {
                type: XModalButtonType.PRIMARY,
                text: "Okay",
                callback: ()=>{
                    document.body.style.overflow = initialOverflow;
                    if (optionalCallback) optionalCallback();
                }
            }
        });
    }

    export function onReady(action){
        readyHandlers.push(action);
        if (isReady){
            action.call(Tools);
        }
    }

    export function loadScript(attr:scriptTagAttributes, callback:any){
        let scriptTag = document.createElement("script");
        scriptTag.src = attr.src;

        Object.keys(attr).filter(n => n!=="src").forEach(attrName => {
            scriptTag[attrName] = attr[attrName];
        });

        scriptTag.addEventListener('load',()=>{
            document.head.removeChild(scriptTag);
            callback();
        });

        document.head.appendChild(scriptTag);

        return scriptTag;
    }

    export function doCSS(selector:string, rule:{[propertyName:string]:string}, autoAppend:boolean=true){
        let style = document.createElement('style');
        style.innerHTML = `${selector} {`;
        Object.keys(rule).forEach(propName => {
            style.innerHTML += `    ${propName} : ${rule[propName]};`
        });
        style.innerHTML += `}`;
        if (autoAppend) document.head.appendChild(style);
        return style.sheet;
    }

    export function showBuildInfo(elem:HTMLElement,defaultVal:string){
        if (buildInfoTapCount >= 1){
            buildInfoTapCount --;

            if (elem.innerHTML !== defaultVal) elem.innerHTML = defaultVal;
        }
        else{
            buildInfoTapCount = 7;

            let v = (<HTMLMetaElement>document.querySelector('meta[property="bi:version"]')).content;
            let h = (<HTMLMetaElement>document.querySelector('meta[property="bi:hash"]')).content;

            elem.innerHTML = `v${v} - ${h}`;
        }
    }

    window.addEventListener('load', function () {
        isReady = true;
        readyHandlers.forEach(action => {
            action.call(Tools);
        });
    });

}