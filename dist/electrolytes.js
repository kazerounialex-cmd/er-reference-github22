const referenceScrollBehavior=typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth';
const e=id=>document.getElementById(id);
const format=n=>ReferenceNumbers.display(n);
const ml=n=>ReferenceNumbers.volume(n)+' mL';
let magnesiumHours=null;
function number(id,optional=false){
  const field=e(id);
  if(optional && field.value.trim()==='')return null;
  if(field.value.trim()==='' || !field.checkValidity() || !Number.isFinite(Number(field.value)))throw Error('Complete the inputs with valid numbers.');
  if(id==='pRate'&&typeof FluidReferenceNumbers!=='undefined')return FluidReferenceNumbers.value(field);
  return id==='mHours'&&magnesiumHours?.display===field.value?magnesiumHours.exact:Number(field.value);
}
function clearResult(id,message){
  const p=document.createElement('p');p.className='help';p.textContent='Invalid: '+message;e(id).replaceChildren(p);e(id+'Steps').replaceChildren();e(id+'Math').open=false;
}
function result(id,rows,steps,note=''){
  // Keep the stock volume first, followed by pump, delivery and duration when
  // those outputs exist. Secondary quantities and math remain below.
  const priority=label=>/pump rate|Run at/i.test(label)?1:/Verified.*rate|Daily-equivalent|Combined entered supplemental K/i.test(label)?2:/duration|Lasts/i.test(label)?3:4;
  rows=[rows[0],...rows.slice(1).sort((a,b)=>priority(a[0])-priority(b[0]))];
  const lines=rows.map(([label,value],i)=>{const line=document.createElement('div');line.className='line'+(i===0?' primary-output':'');const name=document.createElement('span');name.textContent=label;const v=document.createElement('b');v.textContent=value;line.append(name,v);return line;});
  if(note){const p=document.createElement('p');p.className='help'+(/ABOVE|DECREASE|Caution/.test(note)?' critical-note':'');p.textContent=note;lines.push(p);}
  e(id).replaceChildren(...lines);
  e(id+'Steps').replaceChildren(...steps.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
}
function attempt(id,fn){try{fn();}catch(error){clearResult(id,error.message);}}
function chart(rates,run,render,targetId){
  const calculated=new Map();
  for(const dose of new Set(rates.flat())){try{calculated.set(dose,run(dose));}catch{calculated.set(dose,null);}}
  rates.forEach((row,i)=>render(i,row.map(dose=>calculated.get(dose))));
  document.querySelectorAll(`[data-target="${targetId}"]`).forEach(button=>{
    button.disabled=!calculated.get(Number(button.dataset.value));
    button.setAttribute('aria-pressed',String(e(targetId).value!==''&&Number(e(targetId).value)===Number(button.dataset.value)));
  });
}

function syncMagnesiumPump(){
  if(!e('mPump'))return;
  try{const hours=number('mHours'),volume=number('mVolume');
    e('mPump').value=hours>0&&volume>0?ReferenceNumbers.display(volume/hours):'';
  }catch{e('mPump').value='';}
}
function updateMagnesium(){
  syncMagnesiumPump();
  let context=null, contextError='';
  try{
    const lower=number('mLower'),upper=number('mUpper');
    if(lower<=0||upper<=lower)throw Error('Check the bloodwork reference limits.');
    e('mBand0').textContent=`Below ${lower} mg/dL — higher workbook option`;
    e('mBand1').textContent=`${lower}–${upper} mg/dL + refractory K — lower workbook option`;
    if(e('mBloodwork').value.trim()==='')e('mInterpretation').textContent=`Total Mg below ${lower} mg/dL: review 1 mEq/kg/day. Within ${lower}–${upper} with refractory K: review 0.5. Above ${upper}: neither workbook replacement option applies.`;
    else{
      context=magnesiumContext({value:number('mBloodwork'),lower,upper,refractory:e('mRefractory').value==='yes'});
      e('mInterpretation').textContent=context.band==='low'?`LOW total Mg relative to entered lab limits. Matching workbook option: higher dose, 1 mEq/kg/day. Select explicitly below.`:context.band==='high'?`HIGH total Mg relative to entered lab limits. Neither workbook replacement option applies; reassess before supplementation.`:context.workbookDose===.5?`WITHIN lab interval, with refractory K selected. Matching workbook option: lower dose, 0.5 mEq/kg/day.`:`WITHIN lab interval. The 0.5 workbook option also requires refractory hypokalemia; normal Mg alone does not establish an indication.`;
    }
  }catch(error){contextError=error.message;e('mInterpretation').textContent=contextError;}
  e('mContext0').setAttribute('data-context-match',String(context?.workbookDose===1));
  e('mContext1').setAttribute('data-context-match',String(context?.workbookDose===.5));
  const run=dailyDose=>{if(contextError)throw Error(contextError);if(context?.band==='high')throw Error('Current total Mg is above the entered interval; neither workbook replacement option applies.');return magnesium({weight:number('mWeight'),hours:number('mHours'),volume:number('mVolume'),stock:number('mStock'),dailyDose});};
  chart([[1],[.5]],run,(i,values)=>{e('mAmount'+i).textContent=values[0]?format(values[0].amount)+' mEq':'—';e('mMl'+i).textContent=values[0]?ml(values[0].additive):'— mL';},'mDose');
  attempt('mResult',()=>{
    const dose=number('mDose'),r=run(dose),weight=number('mWeight'),hours=number('mHours'),stock=number('mStock'),volume=number('mVolume');
    const verified=PreparationCheck.infusion({stockVolume:r.additive,stock,volume,pump:r.pump,weight,target:dose,multiplier:24,unit:'mEq/kg/day'});
    result('mResult',[['MgSO₄ STOCK TO ADD',ml(r.additive)],['Carrier volume (approx.)',ml(verified.diluent)],['Prepared infusion volume',ml(verified.volume)],['Magnesium for this preparation',format(verified.amount)+' mEq'],['Diluted preparation pump rate',format(verified.pump)+' mL/hr'],['Delivered daily-equivalent dose',format(verified.delivered)+' mEq/kg/day']],[`Daily amount: ${weight} kg × ${dose} mEq/kg/day = ${format(weight*dose)} mEq/day.`,`Preparation amount: ${format(weight*dose)} × ${hours}/24 = ${format(r.amount)} mEq.`,`Stock volume: ${format(r.amount)} ÷ ${stock} mEq/mL = ${format(r.additive,6)} mL.`,`Carrier: ${volume} − ${format(r.additive,6)} = ${format(r.carrier,6)} mL.`,`Pump: ${volume} mL ÷ ${hours} hr = ${format(r.pump)} mL/hr.`,`Verification: ${format(r.amount)} mEq ÷ ${hours} hr ÷ ${weight} kg × 24 = ${format(r.delivered)} mEq/kg/day.`],'Stock volume is not an undiluted infusion rate. Dilute to the stated final volume; the carrier estimate is rounded. '+verified.note);
  });
}
function updatePhosphate(){
  for(const id of ['pKRateHero','pKHourlyHero','pKAmountHero'])e(id).textContent='—';
  e('pKHeroStatus').textContent='Choose a valid phosphate rate to show its potassium contribution.';
  const run=dose=>{const p={weight:number('pWeight'),fluidRate:number('pRate'),volume:number('pVolume'),phosStock:number('pStock'),kStock:number('pKStock'),otherK:number('pOtherK'),method:e('pMethod').value,dose};const r=phosphate(p);return {...r,verification:PreparationCheck.phosphate(p,r)};};
  chart([[.01,.02],[.03,.06],[.06,.12]],run,(i,values)=>{e('pK'+i).textContent=values.map(v=>v?format(v.verification.potassiumRate):'—').join(' – ');e('pMl'+i).textContent=values.map(v=>v?ml(v.additive):'— mL').join(' – ');},'pDose');
  attempt('pResult',()=>{
    const dose=number('pDose'),r=run(dose),weight=number('pWeight'),flow=number('pRate'),stock=number('pStock'),k=number('pKStock'),volume=number('pVolume'),other=number('pOtherK'),c=dose*weight/flow,verified=r.verification;
    e('pKRateHero').textContent=format(verified.potassiumRate);e('pKHourlyHero').textContent=format(verified.potassiumRate*weight);e('pKAmountHero').textContent=format(verified.potassiumAmount,1);
    e('pKHeroStatus').textContent=`Selected phosphate rate: ${dose} mmol/kg/hr. Combined entered supplemental K, including separate infusions: ${format(verified.totalK)} mEq/kg/hr.`;
    result('pResult',[['KPHOS STOCK TO ADD',ml(r.additive)],['Carrier volume (approx.)',ml(verified.diluent)],['Final prepared volume',ml(verified.volume)],['Phosphate in preparation',format(verified.amount)+' mmol'],['Potassium in preparation',format(verified.potassiumAmount)+' mEq'],['K from KPhos',format(verified.potassiumRate)+' mEq/kg/hr'],['Combined entered supplemental K',format(verified.totalK)+' mEq/kg/hr'],['Run at',ReferenceNumbers.display(flow)+' mL/hr'],['Lasts',format(verified.hours)+' hr'],['Delivered phosphate rate',format(verified.delivered)+' mmol/kg/hr']],[`Phosphate needed: ${dose} mmol/kg/hr × ${weight} kg = ${format(dose*weight)} mmol/hr.`,`Required phosphate concentration: ${format(dose*weight)} ÷ ${flow} = ${format(c,6)} mmol/mL.`,e('pMethod').value==='final'?`Stock: ${volume} × ${format(c,6)} ÷ ${stock} = ${format(r.additive,6)} mL.`:`Stock: ${volume} × ${format(c,6)} ÷ (${stock} − ${format(c,6)}) = ${format(r.additive,6)} mL.`,`K contribution: ${dose} × ${k} ÷ ${stock} = ${format(r.kRate,6)} mEq/kg/hr.`,`Total entered supplemental K: ${format(r.kRate,6)} + ${other} = ${format(r.totalK,6)} mEq/kg/hr.`,`Phosphate check: ${format(r.phosphateAmount)} mmol ÷ ${format(r.finalVolume)} mL × ${flow} mL/hr ÷ ${weight} kg = ${format(r.delivered)} mmol/kg/hr.`],'No KCl co-mixing is calculated. Dilute to the final volume; the carrier estimate is rounded. If separately infused, use the displayed K contribution in the KCl separate-infusion field. '+verified.note);
  });
}
function updateDextrose(){
  const run=target=>{const base=number('dBase'),stock=number('dStock');if(stock<=base)throw Error('Dextrose stock must exceed carrier concentration.');return mixFinal({volume:number('dVolume'),target,base,stock});};
  chart([[1.25],[2.5],[5]],run,(i,values)=>{e('dCarrier'+i).textContent=values[0]?ml(values[0].carrier):'— mL';e('dMl'+i).textContent=values[0]?ml(values[0].additive):'— mL';},'dTarget');
  attempt('dResult',()=>{
    const target=number('dTarget'),r=run(target),stock=number('dStock'),base=number('dBase'),volume=number('dVolume');
    if(stock<=base)throw Error('Dextrose stock must be more concentrated than the carrier.');
    const verified=PreparationCheck.mixture({stockVolume:r.additive,stock,base,volume,target,unit:'% dextrose'});
    result('dResult',[['DEXTROSE STOCK TO ADD',ml(r.additive)],['Carrier volume (approx.)',ml(verified.diluent)],['Final prepared volume',ml(verified.volume)],['Verified displayed preparation',format(verified.concentration)+'%']],[`Stock volume: ${volume} × (${target} − ${base}) ÷ (${stock} − ${base}) = ${format(r.additive,6)} mL.`,`Carrier volume: ${volume} − ${format(r.additive,6)} = ${format(r.carrier,6)} mL.`,`Verification: (${format(r.additive,6)} × ${stock} + ${format(r.carrier,6)} × ${base}) ÷ ${volume} = ${format(r.verified,3)}%.`],(target>5||verified.concentration>5?'Selected/displayed concentration is above 5%; review central access per AAHA. ':'')+'Dilute to the stated final volume; carrier volume is approximate. '+verified.note);
  });
}
function updateSodium(){
  attempt('nWater',()=>{
    const p={weight:number('nWeight'),current:number('nCurrent'),target:number('nGoal'),type:e('nType').value,customHours:number('nHours',true)},r=freeWater(p);
    result('nWater',[['Estimated free-water deficit',format(r.liters*1000,1)+' mL'],['Free-water-only rate estimate',format(r.mlPerHour,2)+' mL/hr'],['Replacement duration',format(r.hours,1)+' hr'],['Planned average Na decrease',format(r.correction,3)+' mEq/L/hr'],['Planned change in first 24 hr',format(r.dayChange,1)+' mEq/L']],[`Free water: 0.6 × ${p.weight} × (${p.current}/${p.target} − 1) = ${format(r.liters,6)} L.`,`Duration: ${p.customHours!==null?'custom '+p.customHours+' hr':`${p.current} − ${p.target} divided by ${p.type==='acute'?1:.5} mEq/L/hr = ${format(r.hours,3)} hr`}.`,r.hours===0?'Current sodium equals the target: no free-water deficit or replacement rate is calculated.':`Rate: ${format(r.liters*1000,6)} mL ÷ ${format(r.hours,3)} hr = ${format(r.mlPerHour,3)} mL/hr.`],'This is a planning estimate, not a prediction of the measured sodium response. Account for other water/solute inputs and losses, and reassess sodium serially.');
  });
  const fluids=[{name:'LRS',na:130,k:4},{name:'Plasma-Lyte',na:140,k:5},{name:'0.9% NaCl',na:154,k:0}];
  const stockLabel=({'1232':'7.2% NaCl','1283':'7.5% NaCl','513':'3% NaCl','0':'Sodium-free replacement'})[e('nPreset').value] || `Custom stock (${e('nStock').value||'—'} mEq/L Na)`;
  fluids.forEach((fluid,i)=>{
    e('nCardStockLabel'+i).textContent=`${stockLabel} TO ADD TO ${fluid.name}`;
    try{
      const r=mixFinal({volume:number('nVolume'),target:number('nFluidGoal'),base:fluid.na,stock:number('nStock')});
      const verified=PreparationCheck.mixture({stockVolume:r.additive,stock:number('nStock'),base:fluid.na,volume:number('nVolume'),target:number('nFluidGoal'),unit:'mEq/L Na'});
      e('nCardMl'+i).textContent=ml(r.additive);e('nCardCarrier'+i).textContent='Carrier retained: '+ml(r.carrier);
      e('nCardNote'+i).textContent=`Add ${ml(r.additive)} of ${stockLabel} to the retained ${fluid.name}. Dilute to the stated final volume; retained carrier volume is approximate. Displayed preparation Na: ${format(verified.concentration)} mEq/L. ${verified.note} Carrier-only K after mixing: ${format(fluid.k*r.carrier/r.finalVolume,2)} mEq/L.`;
      document.querySelector(`[data-base="${fluid.na}"]`).disabled=false;
    }catch(error){e('nCardMl'+i).textContent='Not achievable';e('nCardCarrier'+i).textContent='Carrier: — mL';e('nCardNote'+i).textContent=error.message;document.querySelector(`[data-base="${fluid.na}"]`).disabled=true;}
    document.querySelector(`[data-base="${fluid.na}"]`).setAttribute('aria-pressed',String(e('nBase').value===String(fluid.na)));
  });
  e('hFluidNa').value='';
  attempt('nMix',()=>{
    if(e('nBase').value==='')throw Error('Choose a base-fluid card to see the selected preparation.');
    const p={volume:number('nVolume'),target:number('nFluidGoal'),base:number('nBase'),stock:number('nStock')},r=mixFinal(p);
    const verified=PreparationCheck.mixture({stockVolume:r.additive,...p,unit:'mEq/L Na'});
    e('hFluidNa').value=String(r.verified);e('nSelectedFluid').textContent=`Selected: ${e('nFluidName').value}. Prepared fluid Na: ${format(r.verified,1)} mEq/L.`;
    result('nMix',[[stockLabel+' TO ADD',ml(r.additive)],['Base fluid selected',e('nFluidName').value],['Carrier volume (approx.)',ml(verified.diluent)],['Final prepared volume',ml(verified.volume)],['Verified displayed FLUID sodium',format(verified.concentration)+' mEq/L']],[p.base===p.stock?'Carrier and stock equal the requested concentration; use carrier only.':`Stock replacement: ${p.volume} × (${p.target} − ${p.base}) ÷ (${p.stock} − ${p.base}) = ${format(r.additive,6)} mL.`,`Carrier: ${p.volume} − ${format(r.additive,6)} = ${format(r.carrier,6)} mL.`,`Verification: (${format(r.additive,6)} × ${p.stock} + ${format(r.carrier,6)} × ${p.base}) ÷ ${p.volume} = ${format(r.verified)} mEq/L.`],'Dilute to the final volume; carrier volume is approximate. Sodium-response estimates use the unrounded nominal prescribed mixture; verify any displayed-mixture difference before using that estimate. '+verified.note);
  });
  if(e('hFluidNa').value==='')e('nSelectedFluid').textContent='No valid fluid mixture selected.';
  attempt('hResponse',()=>{
    const p={weight:number('nWeight'),patientNa:number('nCurrent'),fluidNa:number('hFluidNa'),fluidK:number('hFluidK'),rate:number('hRate'),hours:number('hHours')},r=sodiumResponse(p);
    let note='Approximate starting-plan estimate only. Recheck measured Na 2–4 hours after starting therapy and adjust; subsequent intervals depend on stability and severity.';
    if(r.change<0)note='This selected fluid predicts a DECREASE in Na. Reassess whether that matches the intended hyponatremia plan. '+note;
    else if(r.hourly>.5||r.dayChange>12)note='ABOVE chronic reference limits (>0.5 mEq/L/hr or >12 mEq/L/24 hr). Reassess this plan. '+note;
    else if(r.dayChange>10)note='Predicted 24-hour rise is above the conservative 10 mEq/L target; review the correction ceiling and monitoring. '+note;
    result('hResponse',[['Estimated Na change over entered interval',format(r.change,2)+' mEq/L'],['Estimated average hourly change',format(r.hourly,3)+' mEq/L/hr'],['Estimated change at this rate over 24 hr',format(r.dayChange,2)+' mEq/L'],['Estimated end-interval Na',format(r.predicted,1)+' mEq/L'],['Planned fluid volume',format(r.volume*1000,1)+' mL']],[`Total body water: 0.6 × ${p.weight} = ${format(.6*p.weight)} L.`,`Change per 1 L: (${p.fluidNa} + ${p.fluidK} − ${p.patientNa}) ÷ (${format(.6*p.weight)} + 1) = ${format(r.perLiter,6)} mEq/L.`,`Planned volume: ${p.rate} mL/hr × ${p.hours} hr ÷ 1,000 = ${format(r.volume,6)} L.`,`Scaled change: ${format(r.perLiter,6)} × ${format(r.volume,6)} = ${format(r.change,6)} mEq/L.`],note);
  });
  attempt('nQuick',()=>{
    const p={volumeA:number('qVolumeA'),concentrationA:number('qNaA'),volumeB:number('qVolumeB'),concentrationB:number('qNaB')},r=mixVolumes(p);
    result('nQuick',[['Final fluid sodium',format(r.concentration,1)+' mEq/L'],['Final volume',ml(r.volume)]],[`Final volume: ${p.volumeA} + ${p.volumeB} = ${format(r.volume)} mL.`,`Weighted concentration: (${p.volumeA} × ${p.concentrationA} + ${p.volumeB} × ${p.concentrationB}) ÷ ${r.volume} = ${format(r.concentration)} mEq/L.`]);
  });
  attempt('nGlucose',()=>{
    const sodium=number('gNa'),glucose=number('gGlucose'),r=correctedSodium({sodium,glucose});
    result('nGlucose',[['Glucose-corrected sodium',format(r.corrected,1)+' mEq/L'],['Added correction',format(r.correction,1)+' mEq/L']],[`Correction: (${glucose} − 100) ÷ 100 × 1.6 = ${format(r.correction)} mEq/L.`,`Corrected Na: ${sodium} + ${format(r.correction)} = ${format(r.corrected)} mEq/L.`],e('gSpecies').value==='cat'?'Feline selection: the cited correction-factor study was in dogs; feline use is extrapolation.':'Canine correction-factor source: 2024 JAVMA hyperglycemic-crisis study.');
  });
}
const updatePage=()=>({magnesium:updateMagnesium,phosphate:updatePhosphate,dextrose:updateDextrose,sodium:updateSodium}[document.body.dataset.tool])();
// Compact layouts keep shared patient fields outside the calculation forms.
for(const id of ['mWeight','pWeight','nWeight','gSpecies']){
  if(e(id))e(id).addEventListener('input',updatePage);
}
function lockFields(button,restore=false){
  const ids=button.dataset.lock.split(','),fields=ids.map(e),locking=restore||!fields[0].readOnly;
  if(locking&&!restore&&fields.some(f=>f.value.trim()===''||!f.checkValidity()||!Number.isFinite(Number(f.value)))){button.textContent='Enter valid concentrations, then lock';return;}
  fields.forEach(f=>f.readOnly=locking);button.textContent=locking?'Edit concentrations':'Lock concentrations';
  document.querySelector(`[data-lock-state="${button.dataset.lock}"]`).textContent=locking?'Locked':'Editing — verify labels';
  if(!locking)fields[0].focus();
}
document.querySelectorAll('[data-lock]').forEach(button=>button.addEventListener('click',()=>{lockFields(button);updatePage();}));
document.querySelectorAll('.lyte-rate').forEach(button=>button.addEventListener('click',()=>{
  e(button.dataset.target).value=button.dataset.value;updatePage();
  if(typeof ReferenceLayout!=='undefined'){ReferenceLayout.reveal(button.dataset.result+'Section',button.dataset.result+'Math');return;}
  e(button.dataset.result+'Math').open=true;const destination=button.dataset.result==='pResult'?'pKHeroPanel':button.dataset.result+'Section';e(destination).scrollIntoView({behavior:referenceScrollBehavior,block:'start'});e(destination).focus({preventScroll:true});
}));
document.querySelectorAll('form[data-electrolyte]').forEach(form=>{
  form.addEventListener('submit',event=>event.preventDefault());form.addEventListener('input',updatePage);
  form.addEventListener('reset',()=>setTimeout(()=>{form.querySelectorAll('[data-lock]').forEach(button=>lockFields(button,true));updatePage();},0));
});
document.querySelectorAll('[data-base]').forEach(button=>button.addEventListener('click',()=>{e('nBase').value=button.dataset.base;e('nFluidName').value=button.dataset.fluid;e('hFluidK').value='';updatePage();if(typeof ReferenceLayout!=='undefined'){ReferenceLayout.reveal('nMixSection','nMixMath');return;}e('nMixMath').open=true;e('nMixSection').scrollIntoView({behavior:referenceScrollBehavior,block:'start'});}));
document.querySelectorAll('[data-path]').forEach(button=>button.addEventListener('click',()=>{const hypo=button.dataset.path==='hypo';e('hyperWorkflow').hidden=hypo;e('hypoWorkflow').hidden=!hypo;e('hypoPlan').hidden=!hypo;document.querySelectorAll('[data-path]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
for(const id of ['nVolume','nFluidGoal','nStock'])if(e(id))e(id).addEventListener('input',()=>{e('hFluidK').value='';if(id==='nStock')e('nPreset').value='custom';updatePage();});
if(e('nPreset'))e('nPreset').addEventListener('change',()=>{if(e('nPreset').value!=='custom')e('nStock').value=e('nPreset').value;e('hFluidK').value='';updatePage();});
if(e('mPump')){
  e('mPump').addEventListener('input',()=>{
    const pump=e('mPump'),volume=Number(e('mVolume').value),rate=Number(pump.value);
    magnesiumHours=null;
    if(pump.value.trim()!==''&&pump.checkValidity()&&rate>0&&Number.isFinite(volume)&&volume>0){
      const exact=volume/rate,display=ReferenceNumbers.display(exact);
      e('mHours').value=display;magnesiumHours={exact,display};
    }else e('mHours').value='';
  });
  e('mHours').addEventListener('input',()=>{magnesiumHours=null;});
  e('mHours').form?.addEventListener('reset',()=>{magnesiumHours=null;});
}
updatePage();
