// Display rounding must not alter the rate used by linked electrolyte math.
const FluidReferenceNumbers={
 values:new WeakMap(),
 value(field){const saved=this.values.get(field);return saved&&saved.display===field.value?saved.exact:Number(field.value);},
 display(value){return (typeof ReferenceNumbers==='undefined'?require('./number-format.js'):ReferenceNumbers).display(value);}
};
// Shared fluid reference. The existing Fluid Planner arithmetic is reused exactly.
function fluidReferenceResult(state,patient){
 const positive=x=>Number.isFinite(x)&&x>0;
 const numeric=x=>String(x??'').trim()===''?NaN:Number(x);
 if(!positive(patient.weight)||!['dog','cat'].includes(patient.species))return {rate:null,plan:null,volume:null,hours:null,message:'Enter patient weight and species.'};
 const inputs=state.inputs;
 let plan=null;
 try{plan=calculate({...patient,dehydration:numeric(inputs.dehydration),hours:numeric(inputs.hours),losses:numeric(inputs.losses),bolus:numeric(inputs.bolus),mode:'initial'});}catch{}
 const manual=state.override!==null;
 const rate=manual?numeric(state.override):plan?.total;
 const hours=numeric(inputs.hours);
 if(!positive(rate))return {rate:null,plan,volume:null,hours:positive(hours)?hours:null,message:manual?'Enter a positive shared fluid rate.':'Complete the Fluid Planner, or enter a shared rate.'};
 const volume=positive(hours)?rate*hours:null;
 if(volume!==null&&!Number.isFinite(volume))return {rate:null,plan:null,volume:null,hours:null,message:'Inputs exceed calculation limits.'};
 return {rate,plan,volume,hours:positive(hours)?hours:null,message:manual?'Shared manual rate':'From Fluid Planner'};
}
if(typeof module!=='undefined')module.exports={fluidReferenceResult,FluidReferenceNumbers};
if(typeof document!=='undefined')(()=>{
 const $=id=>document.getElementById(id),key='er-reference-fluid-v1';
 const defaults=()=>({inputs:{dehydration:'',hours:'24',losses:'0',bolus:'0'},override:null,locals:{}});
 function read(){
  const state=defaults();
  try{const saved=JSON.parse(sessionStorage.getItem(key));
   for(const name of Object.keys(state.inputs))if(typeof saved?.inputs?.[name]==='string')state.inputs[name]=saved.inputs[name];
   if(typeof saved?.override==='string')state.override=saved.override;
   for(const id of ['kRate','pRate','rBagPump','bagRate'])if(typeof saved?.locals?.[id]==='string')state.locals[id]=saved.locals[id];
  }catch{}
  return state;
 }
 let state=read(),busy=false;
 const planner=$('planner'),rateInput=$('sharedFluidRate');
 if(!rateInput)return;
 const fmt=n=>ReferenceNumbers.display(n);
 const fields=['kRate','pRate','rBagPump','bagRate'].map($).filter(Boolean);
 const patient=()=>({weight:Number($('masterWeight').value),species:$('masterSpecies').value});
 function save(){try{sessionStorage.setItem(key,JSON.stringify(state));}catch{}}
 function emit(field){field.dispatchEvent(new Event('input',{bubbles:true}));}
 function readPlanner(){if(planner)for(const id of Object.keys(state.inputs))state.inputs[id]=$(id).value;}
 function restorePlanner(){if(!planner)return;for(const id of Object.keys(state.inputs))$(id).value=state.inputs[id];emit($('dehydration'));}
 function render(){
  const r=fluidReferenceResult(state,patient());busy=true;
  try{
   // Keep the full numeric value: display formatting never drives downstream math.
   if(state.override===null)rateInput.value=r.rate===null?'':FluidReferenceNumbers.display(r.rate);
   else if(document.activeElement!==rateInput)rateInput.value=state.override;
   $('sharedFluidStatus').textContent=r.message;
   $('sharedFluidBreakdown').textContent=r.plan?`Calculated planner rate ${fmt(r.plan.total)} mL/hr${state.override!==null?' · manual rate is active':''} · Maintenance ${fmt(r.plan.maintenanceHourly)} + deficit ${fmt(r.plan.replacementHourly)} + losses ${fmt(Number(state.inputs.losses))} mL/hr`:'Fluid Planner breakdown not yet available.';
   $('sharedFluidAmounts').textContent=r.volume===null?'Set a duration in Fluid Planner to show planned volume.':`${fmt(r.volume)} mL over ${fmt(r.hours)} hr at the shared rate${r.plan?` · deficit remaining ${fmt(r.plan.remaining)} mL`:''}`;
   $('useCalculatedFluid').disabled=!r.plan||state.override===null;
   for(const field of fields){
    const local=Object.prototype.hasOwnProperty.call(state.locals,field.id);
    const desired=local?state.locals[field.id]:r.rate===null?'':FluidReferenceNumbers.display(r.rate);
    const previous=FluidReferenceNumbers.values.get(field)?.exact;
    if(local||r.rate===null)FluidReferenceNumbers.values.delete(field);
    else FluidReferenceNumbers.values.set(field,{display:desired,exact:r.rate});
    if(field.value!==desired||(!local&&previous!==r.rate)){field.value=desired;emit(field);}
    const status=$(field.id+'LinkStatus'),button=$(field.id+'UseShared');
    status.textContent=local?`Local override${r.rate===null?' · no shared rate':` · shared ${fmt(r.rate)} mL/hr`}`:r.rate===null?'Linked · set a shared rate above':state.override!==null?'Shared manual rate':'From Fluid Planner';
    button.disabled=r.rate===null||!local;
    field.setAttribute('data-fluid-linked',String(!local));
   }
  }finally{busy=false;}
 }
 rateInput.addEventListener('input',()=>{state.override=rateInput.value;save();render();});
 $('useCalculatedFluid').addEventListener('click',()=>{state.override=null;save();render();});
 for(const field of fields){
  field.addEventListener('input',()=>{if(busy)return;FluidReferenceNumbers.values.delete(field);state.locals[field.id]=field.value;save();render();});
  $(field.id+'UseShared').addEventListener('click',()=>{delete state.locals[field.id];save();render();});
 }
 for(const id of ['masterWeight','masterSpecies'])$(id).addEventListener(id==='masterWeight'?'input':'change',render);
 if(planner)planner.addEventListener('input',()=>{if(busy)return;readPlanner();save();render();});
 function clear(){state=defaults();save();restorePlanner();render();}
 $('clearPatient').addEventListener('click',clear);
 // A local preparation reset retains planner inputs, shared overrides and local
 // rate choices. Reapply them after the browser resets the form controls.
 document.querySelectorAll('form').forEach(form=>form.addEventListener('reset',()=>setTimeout(()=>{restorePlanner();render();},0)));
 window.addEventListener('pageshow',()=>{state=read();restorePlanner();render();});
 window.addEventListener('patientrestored',()=>{state=read();restorePlanner();render();});
 restorePlanner();render();
 // Header can wrap on tablets; keep sticky navigation/results below its real height.
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(entries=>{
  document.documentElement.style.setProperty('--patient-header-height',entries[0].target.getBoundingClientRect().height+'px');
 }).observe(document.querySelector('.patient-header'));
})();
