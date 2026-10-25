// Explicitly selected, separate planned preparations only. This is not a MAR.
const SupplementalPotassium={
 summarize(records,included,arrangement,reviewed){
  const names=['kcl','phosphate'].filter(name=>included[name]);
  if(!names.length)return {complete:false,message:'Select the preparations explicitly confirmed as concurrently active.',contributions:[]};
  if(arrangement!=='separate')return {complete:false,message:'Incomplete: same-bag preparation is not reconciled here. Verify both additive amounts, final volume, pump rate and physical compatibility separately.',contributions:[]};
  const contributions=[];
  for(const name of names){const record=records[name];if(!record?.valid||!Number.isFinite(record.rate)||record.rate<0)return {complete:false,message:`Incomplete: revisit ${name==='kcl'?'KCl':'KPhos'} and confirm valid current inputs and inclusion.`,contributions};contributions.push({name,rate:record.rate});}
  for(const {name} of contributions){const other=records[name].other;
   const counterpart=contributions.find(c=>c.name!==name);
   if(other>0&&(!counterpart||Math.abs(other-counterpart.rate)>1e-8))return {complete:false,message:'Incomplete: an entered separate-K rate does not match the selected counterpart. Reconcile that entry and any additional sources; it is not added again.',contributions};
  }
  const total=contributions.reduce((sum,c)=>sum+c.rate,0);
  if(!reviewed)return {complete:false,total,message:'Selected-source subtotal only: confirm that all supplemental potassium sources are included before treating this as a combined total.',contributions};
  return {complete:true,total,caution:total>.5+1e-12,message:total>.5+1e-12?'Caution: combined supplemental potassium exceeds the existing 0.5 mEq/kg/hr tool limit. Review before administration.':'Selected supplemental potassium reconciled; this is not an administration authorization.',contributions};
 }
};
if(typeof module!=='undefined')module.exports=SupplementalPotassium;
if(typeof document!=='undefined')(()=>{
 const $=id=>document.getElementById(id);if(!$('concurrentPotassium'))return;
 const key='er-reference-concurrent-k-v1';
 const empty=()=>({records:{},included:{},arrangement:'separate',reviewed:false});
 const read=()=>{try{const s=JSON.parse(sessionStorage.getItem(key));return s&&s.records&&s.included?s:empty();}catch{return empty();}};
 let state=read();
 const current=$('kTarget')?'kcl':'phosphate';
 const saved=key=>{try{return sessionStorage.getItem(key);}catch{return null;}};
 const patient=()=>JSON.stringify([$('masterWeight').value,$('masterSpecies').value,saved('er-reference-patient-generation-v1')]);
 function save(){try{sessionStorage.setItem(key,JSON.stringify(state));}catch{}}
 function numeric(id){const f=$(id);if(!f||f.value.trim()===''||!f.checkValidity())throw Error('Missing input');return Number(f.value);}
 function capture(){
  let r;
  try{
   const weight=Number($('masterWeight').value),flow=FluidReferenceNumbers.value($(current==='kcl'?'kRate':'pRate'));
   if(!['dog','cat'].includes($('masterSpecies').value))throw Error('Choose species');
   const linked=$(current==='kcl'?'kRate':'pRate').getAttribute('data-fluid-linked')==='true';
   const input=current==='kcl'?{weight,target:numeric('kTarget'),fluidRate:flow,volume:numeric('kVolume'),stock:numeric('kStock'),otherK:numeric('kOther'),method:$('kMethod').value}:{weight,dose:numeric('pDose'),fluidRate:flow,volume:numeric('pVolume'),phosStock:numeric('pStock'),kStock:numeric('pKStock'),otherK:numeric('pOtherK'),method:$('pMethod').value};
   const value=current==='kcl'?calculatePotassium(input):phosphate(input);
   r={valid:true,rate:current==='kcl'?value.delivered-input.otherK:value.kRate,other:input.otherK,flow,linked,patient:patient(),signature:JSON.stringify(input),volume:value.finalVolume};
  }catch{r={valid:false,patient:patient()};}
  const old=state.records[current];
  if(old?.signature!==r.signature||old?.patient!==r.patient){state.included[current]=false;state.reviewed=false;}
  state.records[current]=r;
  // A changed patient or changed linked pump rate invalidates the old selection.
  let shared=null;
  try{const fluid=JSON.parse(sessionStorage.getItem('er-reference-fluid-v1'));shared=fluidReferenceResult(fluid,{weight:Number($('masterWeight').value),species:$('masterSpecies').value}).rate;}catch{}
  for(const name of ['kcl','phosphate']){const record=state.records[name];if(record&&(record.patient!==patient()||(record.linked&&record.flow!==shared))){record.valid=false;state.included[name]=false;state.reviewed=false;}}
  save();render();
 }
 function render(){
  $('includeKcl').checked=!!state.included.kcl;$('includeKphos').checked=!!state.included.phosphate;
  $('concurrentArrangement').value=state.arrangement;$('allPotassiumSources').checked=state.reviewed;
  const r=SupplementalPotassium.summarize(state.records,state.included,state.arrangement,state.reviewed);
  const fmt=n=>ReferenceNumbers.format(n,8);
  $('concurrentContributions').textContent=r.contributions.map(c=>`${c.name==='kcl'?'KCl':'KPhos'}: ${fmt(c.rate)} mEq/kg/hr (${fmt(state.records[c.name].volume)} mL final at ${fmt(state.records[c.name].flow)} mL/hr)`).join(' · ')||'No valid preparations selected.';
  $('concurrentTotal').textContent=r.total===undefined?'—':`${r.complete?'Combined supplemental K':'Incomplete · selected-source subtotal'}: ${fmt(r.total)} mEq/kg/hr`;
  $('concurrentStatus').textContent=r.message;
 }
 for(const [id,name] of [['includeKcl','kcl'],['includeKphos','phosphate']])$(id).addEventListener('change',()=>{state.included[name]=$(id).checked;state.reviewed=false;save();render();});
 $('concurrentArrangement').addEventListener('change',()=>{state.arrangement=$('concurrentArrangement').value;state.reviewed=false;save();render();});
 $('allPotassiumSources').addEventListener('change',()=>{state.reviewed=$('allPotassiumSources').checked;save();render();});
 document.addEventListener('input',event=>{if(!event.target.closest('#concurrentPotassium'))capture();});
 document.addEventListener('change',event=>{if(!event.target.closest('#concurrentPotassium'))capture();});
 document.addEventListener('click',event=>{if(event.target.closest('.rate-pick,.lyte-rate,[data-volume-target]'))setTimeout(capture,0);});
 document.querySelectorAll('form').forEach(form=>form.addEventListener('reset',()=>setTimeout(()=>{state.included[current]=false;state.reviewed=false;capture();},0)));
 window.addEventListener('newpatient',()=>{state=empty();save();render();});
 window.addEventListener('patientrestored',()=>{state=read();capture();});
 window.addEventListener('pageshow',()=>{state=read();capture();});
 capture();
})();
