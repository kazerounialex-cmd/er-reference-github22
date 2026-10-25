(()=>{
const $=id=>document.getElementById(id),n=id=>id==='rBagPump'&&typeof FluidReferenceNumbers!=='undefined'?FluidReferenceNumbers.value($(id)):Number($(id).value),tool=document.body.dataset.cri;
const fmt=x=>ReferenceNumbers.format(x);
const ready=()=>{CriCalc.positive(n('weight'));if(!$('species').value)throw Error('Select species in the shared banner.');};
const clear=(out,math,message)=>{$(out).textContent=message;if($(math))$(math).textContent='';};
$('criStock').readOnly=true;$('criLock').onclick=()=>{const field=$('criStock');field.readOnly=!field.readOnly;$('criLock').textContent=field.readOnly?'Edit concentration':'Lock concentration';};
let priorSpecies='';
if(tool==='insulin'){
 document.querySelectorAll('[data-insulin]').forEach(button=>button.onclick=()=>{const preset=button.dataset.insulin;if((preset==='dog'&&$('species').value!=='Dog')||(preset==='cat'&&$('species').value!=='Cat'))return;$('insDose').value=preset==='fixed'?.1:preset==='cat'?.045:.06;update();});

}
function update(){
if(tool==='insulin'){
 const species=$('species').value;if(species!==priorSpecies){$('insDose').value=['Dog','Cat'].includes(species)?.1:'';priorSpecies=species;}
 document.querySelectorAll('[data-insulin]').forEach(button=>button.disabled=(button.dataset.insulin==='dog'&&species!=='Dog')||(button.dataset.insulin==='cat'&&species!=='Cat'));
 try{ready();const r=CriCalc.insulinPreparation({weight:n('weight'),dose:n('insDose'),stock:n('criStock'),hours:n('insHours'),pump:n('insPump'),capacity:n('insCapacity')});$('insVolume').value=r.volume;$('insResult').innerHTML=`<div class="cri-output"><div><small>REGULAR INSULIN TO ADD</small><strong>${fmt(r.units)} U</strong></div><div><small>STOCK VOLUME · ${n('criStock')} U/mL</small><strong>${fmt(r.drug)} mL</strong></div></div><p>Add to ${fmt(r.diluent)} mL 0.9% NaCl to make <b>${fmt(n('insVolume'))} mL final</b>. Prepared concentration: ${fmt(r.concentration)} U/mL.</p><p><b>Pump ${fmt(r.pump)} mL/hr</b> delivers ${n('insDose')} U/kg/hr. Nominal duration ${fmt(r.hours)} hours before priming/discard.</p>`;$('insMath').textContent=`${n('insVolume')} mL ÷ ${r.pump} mL/hr = ${r.hours} hr. ${n('weight')} kg × ${n('insDose')} U/kg/hr × ${r.hours} hr = ${r.units} U. ÷ ${n('criStock')} U/mL = ${r.drug} mL stock. Daily-equivalent dose ${n('insDose')*24} U/kg/day. The fixed-rate default is 0.1 U/kg/hr (2.4 U/kg/day if uninterrupted); older workbook daily headings do not set this dose.`;}catch(e){clear('insResult','insMath',e.message);}
}else if(tool==='reglan'){
 for(const [mode,duration] of [['r12',12],['r6',6],['rBag',null]])try{ready();const dose=n(mode+'Dose'),r=CriCalc.reglanPreparation({weight:n('weight'),dose,stock:n('criStock'),hours:duration===null?undefined:n(mode+'Hours'),pump:n(mode+'Pump'),volume:n(mode+'Volume'),capacity:duration===null?undefined:n(mode+'Capacity'),bag:duration===null}),volume=r.volume,hours=r.hours;$(mode+'Volume').value=volume;$(mode+'Result').innerHTML=`<div class="method-result"><strong>${fmt(r.drug)} mL</strong><span>REGLAN STOCK TO ADD</span><small>${fmt(r.mg)} mg for ${fmt(hours)} hours</small></div><p>${duration===null?`Remove ${fmt(r.drug)} mL from measured carrier, then add Reglan stock; keep ${fmt(volume)} mL final.`:`Add ${fmt(r.diluent)} mL compatible diluent to make ${fmt(volume)} mL final.`}</p><p><b>Pump ${fmt(r.pump)} mL/hr.</b>${duration===null?' Recalculate if fluid rate changes.':''}</p>`;$(mode+'Math').textContent=`${n('weight')} kg × ${dose} mg/kg/day × ${hours}/24 = ${r.mg} mg ÷ ${n('criStock')} mg/mL = ${r.drug} mL stock. ${volume} mL final ÷ ${hours} hr = ${r.pump} mL/hr.`;}catch(e){clear(mode+'Result',mode+'Math',e.message);}
 try{ready();CriCalc.positive(n('criStock'));$('reglanUndiluted').textContent=`At 2 mg/kg/day: undiluted-stock equivalent = ${fmt(n('weight')*2/24/n('criStock'))} mL/hr (${n('criStock')} mg/mL stock). This is an arithmetic equivalent, not a recommendation to administer undiluted.`;}catch{$('reglanUndiluted').textContent='';}
}
}
document.querySelectorAll('input,select').forEach(field=>{if(!['masterWeight','masterSpecies','sharedFluidRate'].includes(field.id))field.addEventListener('input',update);});update();
})();
