(()=>{
const $=id=>document.getElementById(id),n=id=>ReferenceNumbers.read($(id)),show=x=>ReferenceNumbers.display(x),put=(id,x)=>{ReferenceNumbers.write($(id),x);};
$('criStock').readOnly=true;
$('criLock').onclick=()=>{const f=$('criStock');f.readOnly=!f.readOnly;$('criLock').textContent=f.readOnly?'Edit concentration':'Lock concentration';};
$('normalizeFent').onclick=()=>{try{CriCalc.positive(n('weight'));put('fentConcentration',n('weight'));update('fentConcentration');}catch(e){$('fentResult').textContent=e.message;$('fentMath').textContent='';}};
function update(edited){
 $('fentPump').parentElement.firstChild.textContent='Pump rate for selected dose · mL/hr';
 $('fentResult').innerHTML='';$('fentMath').textContent='';
 try{
 if(!['Dog','Cat'].includes($('species').value))throw Error('Select species in the shared banner.');
 const weight=n('weight'),dose=n('criDose'),stock=n('criStock');CriCalc.positive(weight,dose,stock);
 let volume=n('fentVolume'),pump=n('fentPump'),concentration=n('fentConcentration');
 if(edited==='fentHours'){
 CriCalc.positive(n('fentHours'),pump);volume=n('fentHours')*pump;put('fentVolume',volume);concentration=weight*dose/pump;put('fentConcentration',concentration);
 }else if(edited==='fentPump'||(concentration<=0&&edited!=='fentConcentration')){
 CriCalc.positive(pump,volume);concentration=weight*dose/pump;put('fentConcentration',concentration);
 }else{
 pump=CriCalc.rate(weight,dose,concentration,'mcg/kg/hr');put('fentPump',pump);
 }
 $('fentPump').parentElement.firstChild.textContent=`Pump rate for ${show(dose)} mcg/kg/hr · mL/hr`;
 CriCalc.positive(volume,pump,concentration,n('fentCapacity'));const hours=volume/pump;CriCalc.positive(hours);put('fentHours',hours);
 if(volume>n('fentCapacity'))throw Error('Final volume exceeds syringe capacity. Shorten the run time, reduce final volume or select a suitable larger syringe.');
 const mix=CriCalc.mix(stock,concentration,volume);
 const verified=PreparationCheck.cri({...mix,stock,volume,pump,dose,unit:'mcg/kg/hr'},'fentanyl',weight);
 $('fentResult').innerHTML=`<div class="cri-output"><div><small>FENTANYL STOCK</small><strong>${show(mix.drug)} mL</strong></div><div><small>0.9% NaCl DILUENT</small><strong>${show(mix.diluent)} mL</strong></div></div><p>${PreparationCheck.instruction(verified,'0.9% NaCl')} Prepared concentration <b>${PreparationCheck.concentration(verified.concentration)} mcg/mL</b>. Run at <b>${show(pump)} mL/hr</b> for <b>${show(hours)} hours</b>.</p><p class="help"><b>Current equation:</b> ${show(weight)} kg × ${show(dose)} mcg/kg/hr ÷ ${show(concentration)} mcg/mL ≈ ${show(pump)} mL/hr. Prescribed calculation before rounding; verify the displayed preparation below.</p><p class="preparation-check" role="status">${verified.note}</p>`;
 $('fentMath').textContent=`Prescribed calculation before display rounding: Volume ≈ ${show(pump)} mL/hr × ${show(hours)} hr ≈ ${show(volume)} mL. Drug ≈ ${show(concentration)} mcg/mL × ${show(volume)} mL ≈ ${show(mix.amount)} mcg. Stock ≈ ${show(mix.amount)} ÷ ${show(stock)} ≈ ${show(mix.drug)} mL. Diluent ≈ ${show(volume)} − ${show(mix.drug)} ≈ ${show(mix.diluent)} mL.`;
 }catch(e){if(edited==='fentPump'&&!(n('fentPump')>0)){$('fentHours').value='';$('fentConcentration').value='';}if(edited==='fentConcentration'&&!(n('fentConcentration')>0)){$('fentPump').value='';$('fentHours').value='';}$('fentResult').textContent=e.message;}
}
document.querySelectorAll('input,select').forEach(f=>{if(!['masterWeight','masterSpecies','sharedFluidRate'].includes(f.id))f.addEventListener('input',()=>{ReferenceNumbers.forget(f);update(f.id);});});update('fentPump');
})();
