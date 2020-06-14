
// INTERACTIONS FORM
(()=>{
    let $form = $('#interactions-form');

    $form.on("submit", ev => {

        ev.preventDefault();

        let med1Txt = <HTMLInputElement>$form.find("[name=med1]")[0];
        let med2Txt = <HTMLInputElement>$form.find("[name=med2]")[0];

        console.log("Submitting", med1Txt.value, med2Txt.value);

        MediTrack.getInteractions(med1Txt.value, med2Txt.value).then(res => {

            Tools.showAlert("Result", res['notices']);

        });

    });

    let $pillbox = $('#pillbox');
    let days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

    if ($pillbox.length > 0){
        let d = new Date();
        let id = `#${days[d.getUTCDay()]}`;
        $(id).addClass('active');

        $pillbox.on('click','.day',function(ev){
            showPillboxDay(this.id ?? days[d.getUTCDay()]);
        });
    }
})();

async function showPillboxDay(dayName:string){
    let dayNameCaps = dayName[0].toUpperCase() + dayName.substr(1);

    let prescriptions = (await MediTrack.getPrescriptions()).payload.prescriptions;

    let loader = MediTrack.UI.showLoader();

    let rows = prescriptions.filter(p => p.days.split(",").map(p => p.trim().toLowerCase()).indexOf(dayName) > -1).map(o => {
        return `<tr>
          <td>${o.medicationInfo.drugName}</td> 
          <td>${o.doseFrequency}</td>
          <td> <a data-do="info" data-val="${o.medicationInfo.drugName}" href="#"><i class="fas fa-info-circle"></i></a> </td>
          <td> <a data-do="edit" data-ref="${o.reference}" href="#"><i class="fas fa-pen"></i></a> </td>
          <td> <a data-do="trash" data-ref="${o.reference}" href="#"><i class="fas fa-trash-alt"></i></a> </td>
        </tr>`;
    });

    let overlay = document.createElement('div');
    overlay.className = "overlay center-mid";
    overlay.innerHTML = `<div class="form-container wider">
      <button class="close-btn"><i class="fas fa-times"></i></button>
      <p class="form-sign">${dayNameCaps}</p>
      <p class="sign-desc">Here are your medication for ${dayNameCaps}</p>
      <br>
      <div class="scroll-container">
          <table>
            <tr>
              <th>Medication</th>
              <th>Info</th>
              <th></th>
              <th></th>
              <th></th>
            </tr>
            ${ rows.join("\n") }
          </table>
      </div>
      <br>
      <button class="submit-btn" onclick="showNewPrescriptionForm()">Add new prescription</button>
    </div>`;
    (document.querySelector('main') ?? document.body).append(overlay);

    loader.close();

    overlay.querySelector('.close-btn').addEventListener('click', ()=>{
        overlay.classList.remove('visible');
        setTimeout(()=>{
            overlay.remove();
        }, 300);
    });

    $(overlay).on('click', '[data-do=info]', function(){
        showMedicationInfo( this.getAttribute('data-val') );
    });

    $(overlay).on('click', '[data-do=edit]', function(){
        showAmendPrescriptionForm( this.getAttribute('data-ref') );
    });

    $(overlay).on('click', '[data-do=trash]', function(){
        promptRemovePrescription( this.getAttribute('data-ref'), dayName );
    });

    setTimeout(()=>{
        overlay.classList.add('visible');
    }, 100);

}

async function showMedicationInfo(name:string){
    let loader = MediTrack.UI.showLoader("Getting information...");
    let info = (await MediTrack.getDrugInfo(name));

    let howTo = info.howTo.split("<br/>").map(p => `<p class="para">${p}</p>`).join('');
    let sideEff = info.sideEffects.split("<br/>").map(p => `<p class="para">${p}</p>`).join('');

    let overlay = document.createElement('div');
    overlay.className = "overlay center-mid";
    overlay.innerHTML = `<div class="form-container wider">
      <button class="close-btn"><i class="fas fa-times"></i></button>
      <p class="form-sign">${name}</p>
      <p class="sign-desc">Here are some information about ${name}</p>
      <div class="scroll-container">
        <br>
        <p class="para"><strong>How To:</strong></p>
        ${howTo}
        <br/>
        <p class="para"><strong>Side Effects:</strong></p>
        ${sideEff} 
      </div>
    </div>`;
    (document.querySelector('main') ?? document.body).append(overlay);

    loader.close();

    overlay.querySelector('.close-btn').addEventListener('click', ()=>{
        overlay.classList.remove('visible');
        setTimeout(()=>{
            overlay.remove();
        }, 300);
    });

    setTimeout(()=>{
        overlay.classList.add('visible');
    }, 100);
}

async function showNewPrescriptionForm(){
    let overlay = document.createElement('div');
    overlay.className = "overlay center-mid";
    overlay.innerHTML = `<div class="form-container">
      <button class="close-btn"><i class="fas fa-times"></i></button>
      <p class="form-sign">New Prescription</p>
      <p class="sign-desc">Set up a new prescription for your pillbox</p>
      <br>
      <div class="scroll-container">
        <form class="form" action="#" method="post">
            <label>
                <span>Medication Name:</span>
                <input class="form-input" name="med_term" type="text" placeholder="Find Medication" required>
                <input type="hidden" name="med_index">
            </label>
            <label>
                <span>Frequency:</span>
                <input class="form-input" name="frequency" type="text" placeholder="e.g. Twice a day" required>
            </label>
            <label>
                <span>Days (comma seperated):</span>
                <input class="form-input" name="days" type="text" placeholder="e.g. monday, tuesday" required>
            </label>
            <br>
            <button type="submit" class="submit-btn">Set up</button>
        </form>
      </div>
    </div>`;
    (document.querySelector('main') ?? document.body).append(overlay);

    setTimeout(()=>{
        overlay.classList.add('visible');
    }, 100);

    $(overlay).on('submit', 'form', function(ev){
        ev.preventDefault();
        let fd = new FormData(this);
        MediTrack.addNewPrescriptions(
            <string>fd.get("med_term"),
            Number(<string>fd.get("med_index")),
            <string>fd.get("frequency"),
            <Days>(<string>fd.get("days")).split(",")
        ).then(r => {
            if (r.isSuccessful){
                overlay.classList.remove('visible');
                setTimeout(()=>{
                    overlay.remove();
                }, 300);
            }
            else{
                Tools.showAlert(r.title, r.message);
            }
        });
        return false;
    });

    overlay.querySelector('.close-btn').addEventListener('click', ()=>{
        overlay.classList.remove('visible');
        setTimeout(()=>{
            overlay.remove();
        }, 300);
    });
}

async function showAmendPrescriptionForm(reference:string){
    let prescription = (await MediTrack.getSpecificPrescription(reference)).payload.prescription;

    let overlay = document.createElement('div');
    overlay.className = "overlay center-mid";
    overlay.innerHTML = `<div class="form-container">
      <button class="close-btn"><i class="fas fa-times"></i></button>
      <p class="form-sign">Amend Prescription</p>
      <p class="sign-desc">Set up this prescription for your pillbox</p>
      <br>
      <div class="scroll-container">
        <form class="form" action="#" method="post">
            <label>
                <span>Medication Name:</span>
                <input value="${prescription.medicationInfo.drugBrand}" readonly class="form-input" name="med_term" type="text" placeholder="Find Medication" required>
                <input type="hidden" name="med_index">
            </label>
            <label>
                <span>Frequency:</span>
                <input value="${prescription.doseFrequency}" class="form-input" name="frequency" type="text" placeholder="e.g. Twice a day" required>
            </label>
            <label>
                <span>Days (comma seperated):</span>
                <input value="${prescription.days}" class="form-input" name="days" type="text" placeholder="e.g. monday, tuesday" required>
            </label>
            <br>
            <button type="submit" class="submit-btn">Update</button>
        </form>
      </div>
    </div>`;
    (document.querySelector('main') ?? document.body).append(overlay);

    setTimeout(()=>{
        overlay.classList.add('visible');
    }, 100);

    $(overlay).on('submit', 'form', function(ev){
        ev.preventDefault();
        let fd = new FormData(this);
        MediTrack.updatePrescriptions(
            reference,
            {
                frequency: <string>fd.get("frequency"),
                days: <Days>(<string>fd.get("days")).split(",")
            }
        ).then(r => {
            if (r.isSuccessful){
                overlay.classList.remove('visible');
                setTimeout(()=>{
                    overlay.remove();
                }, 300);
            }
            else{
                Tools.showAlert(r.title, r.message);
            }
        });
        return false;
    });

    overlay.querySelector('.close-btn').addEventListener('click', ()=>{
        overlay.classList.remove('visible');
        setTimeout(()=>{
            overlay.remove();
        }, 300);
    });
}

async function promptRemovePrescription(reference:string, day:string){
    let overlay = document.createElement('div');
    overlay.className = "overlay center-mid";
    overlay.innerHTML = `<div class="form-container wider">
      <button class="close-btn"><i class="fas fa-times"></i></button>
      <p class="form-sign">Are you sure?</p>
      <p class="sign-desc">You are about to remove this prescription from your pillbox. Are you sure?</p>
      <div class="scroll-container">
        <form class="form" action="#" method="post">
            <button type="submit" name="btn-val" value="no" class="submit-btn">Don't Remove</button>
            <button type="submit" name="btn-val" value="yes" class="submit-btn">Yes, Remove</button>
        </form> 
      </div>
    </div>`;
    (document.querySelector('main') ?? document.body).append(overlay);

    let $form = $(overlay).find('form');
    let closeFn =  ()=>{
        overlay.classList.remove('visible');
        setTimeout(()=>{
            overlay.remove();
        }, 300);
    };

    overlay.querySelector('.close-btn').addEventListener('click', closeFn);

    $(overlay).on('submit', 'form', function(ev){
        ev.preventDefault();
        return false;
    });

    $(overlay).on('click', 'button', function(){
        let btnValue = this.getAttribute('value');
        if (btnValue == "yes"){
            MediTrack.removePrescriptions(reference, day).then(r => {
                if (r.isSuccessful){
                    location.reload();
                }
                else{
                    Tools.showAlert(r.title, r.message);
                }
            });
        }
        closeFn();
    });

    setTimeout(()=>{
        overlay.classList.add('visible');
    }, 100);
}

function performLogin(em, pw){
    $.post("/api/auth/do-login", {
        email:em,
        password:pw
    }, (e)=>{
        if (e.isSuccessful){
            location.href = "/";
        }
        else{
            Tools.showAlert(e.message, e.title);
        }
    });
}

function performRegister(fn, ln, em, pw){
    $.post("/api/auth/do-signup", {
        email:em,
        password:pw,
        firstName:fn,
        lastName:ln
    }, (e)=>{
        if (e.isSuccessful){
            Tools.showAlert(e.message, e.title, ()=>{
                location.href = "/";
            });
        }
        else{
            Tools.showAlert(e.message, e.title);
        }
    });
}

function sendFeedback(title, message){
    $.post("/api/relation/feedback", {
        message:message,
        title:title
    }, (e)=>{
        if (e.isSuccessful){
            Tools.showAlert(e.message, e.title, ()=>{
                location.href = "/";
            });
        }
        else{
            Tools.showAlert(e.message, e.title);
        }
    });
}