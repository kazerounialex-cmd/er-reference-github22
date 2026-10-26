function criPrintModel({tool,species,weight,values:v,method='r12'},C){
 if(!['Dog','Cat'].includes(species))throw Error('Select patient species and weight.');C.positive(weight);
 if(tool==='lidocaine'&&species==='Cat')throw Error('Lidocaine CRI printing is disabled for cats.');
 C.positive(v.criStock);
 if(tool==='insulin'){
 const r=C.insulinPreparation({weight,dose:v.insDose,stock:v.criStock,hours:v.insHours,pump:v.insPump,capacity:v.insCapacity}),volume=r.volume;return {...r,volume,dose:v.insDose,unit:'U/kg/hr',concentrationUnit:'U/mL',stock:v.criStock,title:'Regular insulin · DKA',diluentName:'0.9% NaCl',amount:r.units};
 }
 if(tool==='reglan'){
 if(!['r12','r6','rBag'].includes(method))throw Error('Select a preparation method.');const dose=v[method+'Dose'];
 const r=C.reglanPreparation({weight,dose,stock:v.criStock,hours:v[method+'Hours'],pump:v[method+'Pump'],volume:v[method+'Volume'],capacity:v[method+'Capacity'],bag:method==='rBag'}),volume=r.volume,concentration=r.concentration;
 return {...r,volume,concentration,dose,unit:'mg/kg/day',concentrationUnit:'mg/mL',stock:v.criStock,title:'Reglan · '+{r12:'syringe A',r6:'syringe B',rBag:'fluid bag'}[method],diluentName:'compatible diluent',amount:r.mg,doses:[1,1.25,1.5,1.75,2,dose],bag:method==='rBag'};
 }
 if(tool==='fentanyl'){
 C.positive(v.fentVolume,v.fentCapacity);if(v.fentVolume>v.fentCapacity)throw Error('Final volume exceeds syringe capacity.');
 const pump=C.rate(weight,v.criDose,v.fentConcentration,'mcg/kg/hr'),mix=C.mix(v.criStock,v.fentConcentration,v.fentVolume),hours=v.fentVolume/pump;C.positive(hours);
 return {...mix,volume:v.fentVolume,pump,hours,dose:v.criDose,concentration:v.fentConcentration,unit:'mcg/kg/hr',concentrationUnit:'mcg/mL',stock:v.criStock,title:'Fentanyl',diluentName:'0.9% NaCl',doses:[1,2,3,4,5,6,7,8,9,10,v.criDose]};
 }
 const dose=v.criDose,factor=tool==='lidocaine'?60/1000:1;
 const r=C.syringe(weight,dose*factor,v.criStock,v.prepHours,v.prepPump,v.prepCapacity);
 return {...r,dose,unit:tool==='lidocaine'?'mcg/kg/min':'mg/kg/hr',concentrationUnit:'mg/mL',stock:v.criStock,title:tool==='lidocaine'?'Lidocaine':'Ketamine',diluentName:'0.9% NaCl',doses:tool==='lidocaine'?[20,30,40,50,60,70,dose]:[.1,.2,.3,.4,.5,.6,dose]};
}
if(typeof module!=='undefined')module.exports=criPrintModel;
if(typeof document!=='undefined')(()=>{
 const $=id=>document.getElementById(id),tool=document.body.dataset.cri,show=x=>ReferenceNumbers.display(x);
 if(tool==='reglan')$('criPrintMethod').value='r12';
 $('criPrintPreview').hidden=true;
 $('criPrintToggle').onclick=()=>{update();$('criPrintPreview').hidden=!$('criPrintPreview').hidden;};
 $('criPrintButton').onclick=()=>{update();if(!$('criPrintButton').disabled)window.print();};
 function update(){
 $('criPrintButton').disabled=true;['criPrintMeta','criPrintMix','criPrintRate','criPrintFormula'].forEach(id=>$(id).textContent='');$('criPrintTable').innerHTML='';
 try{
 const fields=['criStock','criDose','fentHours','fentCapacity','fentPump','fentVolume','fentConcentration','prepHours','prepPump','prepCapacity','insHours','insPump','insCapacity','insDose',...['r12','r6','rBag'].flatMap(m=>['Dose','Pump','Hours','Capacity','Volume'].map(k=>m+k))];
 const values=Object.fromEntries(fields.map(id=>[id,$(id)?id==='rBagPump'&&typeof FluidReferenceNumbers!=='undefined'?FluidReferenceNumbers.value($(id)):ReferenceNumbers.read($(id)):NaN]));
 const weight=Number($('weight').value),species=$('species').value,method=tool==='reglan'?$('criPrintMethod').value:'r12';
 const r=criPrintModel({tool,species,weight,values,method},CriCalc);
 $('criPrintTitle').textContent=r.title+' · '+(tool==='insulin'?'insulin & dextrose reference':'titration reference');
 $('criPrintMeta').textContent=`${species} · ${show(weight)} kg | Fixed concentration: ${show(r.concentration)} ${r.concentrationUnit} | ${show(r.volume)} mL final.`;
 $('criPrintMix').textContent=`Preparation: ${show(r.drug)} mL stock (${show(r.stock)} ${tool==='insulin'?'U/mL':r.concentrationUnit}) + ${show(r.diluent)} mL ${r.diluentName} = ${show(r.volume)} mL final.`;
 $('criPrintRate').textContent=`Selected rate: ${show(r.pump)} mL/hr delivers ${show(r.dose)} ${r.unit}. Nominal duration: ${show(r.hours)} hours before priming/discard.`;
 if(tool==='insulin'){
 $('criPrintFormula').textContent=`Formula: ${show(weight)} kg × ${show(r.dose)} U/kg/hr × ${show(r.hours)} hr = ${show(r.units)} U; ÷ ${show(r.stock)} U/mL = ${show(r.drug)} mL stock. Pump = dose × weight ÷ prepared U/mL. Preparation run time does not set DKA treatment duration.`;
 }else{
 const conc=tool==='lidocaine'?r.concentration*1000:r.concentration;
 $('criPrintTable').innerHTML='<thead><tr><th scope="col">Rate · mL/hr</th><th scope="col">Dose · '+r.unit+'</th></tr></thead><tbody>'+[...new Set(r.doses)].sort((a,b)=>a-b).map(dose=>`<tr><td>${show(CriCalc.rate(weight,dose,conc,r.unit))}</td><td>${dose}</td></tr>`).join('')+'</tbody>';
 }
 $('criPrintStatus').textContent='Prints only this compact reference. Reprint if patient weight or concentration changes.';$('criPrintButton').disabled=false;
 }catch(e){$('criPrintStatus').textContent=e.message;}
 }
 document.querySelectorAll('input,select').forEach(f=>{if(!['masterWeight','masterSpecies','sharedFluidRate'].includes(f.id))f.addEventListener('input',update);});if(tool==='fentanyl')$('normalizeFent').addEventListener('click',update);document.querySelectorAll('[data-insulin]').forEach(b=>b.addEventListener('click',update));update();
})();
