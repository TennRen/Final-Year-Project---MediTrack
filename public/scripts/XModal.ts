
enum XModalType{
    INFORMATION,
    WARNING,
    ALERT,
    QUESTION
}

enum XModalButtonType{
    PRIMARY,
    DANGER,
    CANCEL
}

interface XModalButtons {
    [buttonIdentifier:string]:{
        type: XModalButtonType,
        text: string,
        callback?: Function
    };
}

class XModal extends HTMLElement{

    private _shadow:ShadowRoot = null;
    private _title:string = "";
    private _message:string = "";
    private _type:XModalType = XModalType.INFORMATION;

    static get observedAttributes() { return ['type','open']; }

    constructor(message:string=null, title:string="Message", type:XModalType=XModalType.INFORMATION) {
        super();
        this._shadow = this.attachShadow({ mode: "closed" });
        this._type = type;
        this._message = message;
        this._title = title ? title : this._getTitle();

        let eb = Tools.ElementBuilder;

        let s = eb("link",{
            href: "/public/styles/xmodal.css",
            rel: "stylesheet"
        }).create();
        let h3 = eb("h3", {id:"title"} ,this._title).create();
        let p = eb("p",{id:"message"}, this._message).create();
        let div = eb("div",{id : "btn-container"}).create();

        this._shadow.appendChild(s);
        this._shadow.appendChild(h3);
        this._shadow.appendChild(p);
        this._shadow.appendChild(div);

        this.style.display = "none";
        document.body.appendChild(this);
    }

    private _getTitle(){
        switch (this._type) {
            case XModalType.INFORMATION:
                return "Information";
            case XModalType.WARNING:
                return "Important!";
            case XModalType.ALERT:
                return "Attention!";
            case XModalType.QUESTION:
                return "Are you sure?";
        }
    }

    private _getButtonClass(buttonType:XModalButtonType){
        this._title = this._title + "";
        switch (buttonType) {
            case XModalButtonType.PRIMARY:
                return "primary filled";
            case XModalButtonType.DANGER:
                return "danger filled";
            case XModalButtonType.CANCEL:
                return "";
        }
    }

    public setType(type:XModalType){
        this._type = type;
        return this;
    }

    public setTitle(title:string){
        this._title = title;
        return this;
    }

    public setMessage(message:string){
        this._message = message;
        return this;
    }

    close(){
        this.setAttribute("open","close");
        return new Promise(resolve => {
            setTimeout(()=>{
                this.remove();
                resolve();
            },300);
        });
    }

    open(buttons:XModalButtons){
        setTimeout(()=>{
            let eb = Tools.ElementBuilder;

            let el = this._shadow.querySelector("#btn-container");
            el.innerHTML = "";

            this._shadow.querySelector("#title").innerHTML = this._title;
            this._shadow.querySelector("#message").innerHTML = this._message;

            Object.keys(buttons).forEach(buttonIdentifier => {

                let buttonInfo = buttons[buttonIdentifier];

                let button = eb("button",{
                    id: buttonIdentifier,
                    class: this._getButtonClass(buttonInfo.type)
                }, buttonInfo.text).create();

                button.addEventListener("click", (e)=>{
                    if (buttonInfo.callback) buttonInfo.callback(e);
                    this.close();
                });

                el.appendChild(button);

            });

            if (this.isConnected === false){ document.body.appendChild(this); }

            this.removeAttribute("style");
            setTimeout(()=>{
                this.setAttribute("open","true");
            },300);
        }, 10);
    }

}

customElements.define('x-modal', XModal);