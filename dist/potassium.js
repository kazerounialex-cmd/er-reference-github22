const referenceScrollBehavior=typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth';
// Form and chart behavior. The arithmetic remains in calc.js.
const get=id=>document.getElementById(id);
const kFormat=(n,d=3)=>n.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});
const kVolume=n=>ReferenceNumbers.volume(n);
const kQuantity=n=>Number(kVolume(n));
const bands=[[.5],[.3,.4],[.2,.25],[.1,.15],[.05]];
const outputIds=['kAdd','kDiluent','kFinalVolume','kAddedMEq','kConcentration','kHours','kDelivered'];
function readBase(){
 const fields=['kWeight','kRate','kVolume','kStock','kOther'];
 if(fields.some(id=>get(id).value.trim()==='' || !get(id).checkValidity()))throw Error('Enter valid weight, fluid rate, volume, stock concentration, and separate K rate.');
 return {weight:Number(get('kWeight').value),fluidRate:typeof FluidReferenceNumbers==='undefined'?Number(get('kRate').value):FluidReferenceNumbers.value(get('kRate')),volume:Number(get('kVolume').value),stock:Number(get('kStock').value),otherK:Number(get('kOther').value),method:get('kMethod').value};
}
function renderChart(base){
 let available=0;
 bands.forEach((rates,i)=>{
  const values=rates.map(target=>{try{return calculatePotassium({...base,target});}catch{return null;}});
  get('kEq'+i).textContent=values.map(v=>v?ReferenceNumbers.format(v.addedMEq,8)+' mEq':'—').join(' – ');
  get('kMl'+i).textContent=values.map(v=>v?kVolume(v.additive)+' mL':'— mL').join(' – ');
  document.querySelectorAll(`[data-row="${i}"]`).forEach((button,j)=>{
   button.disabled=!values[j];
   const selected=get('kTarget').value!=='' && Number(get('kTarget').value)===rates[j];
   button.setAttribute('aria-pressed',String(selected));
   if(values[j])available++;
  });
 });
 get('kChartStatus').textContent=!base?'Enter weight, fluid rate, and preparation volume to fill the chart.':available===8?'Calculated from the current inputs. Choose a rate to see its math.':'Some rates cannot be prepared with these inputs (—). Check separate potassium infusions, fluid rate, and stock concentration.';
}
function updatePeripheralWarning(concentration=null){
 const box=get('kPeripheralWarning');
 if(!box)return;
 const valid=Number.isFinite(concentration),near=valid&&concentration>=0.06-1e-12;
 box.hidden=!near;
 get('kConcentration').setAttribute('data-monitor',String(near));
 get('kPeripheralHeading').textContent='';get('kPeripheralMessage').textContent='';
 if(!near){box.setAttribute('data-level','');return;}
 const above=concentration>0.06+1e-12;
 box.setAttribute('data-level',above?'above':'near');
 get('kPeripheralHeading').textContent='Catheter monitoring';
 const current=concentration.toLocaleString('en-US',{maximumSignificantDigits:8,useGrouping:false});
 get('kPeripheralMessage').textContent=`Current: ${current} mEq/mL · Peripheral reference: 0.06 mEq/mL. Monitor the catheter site for pain, redness, swelling or phlebitis; reassess the catheter and vascular access if irritation develops.`;
}
function clearSelected(message){
 updatePeripheralWarning();
 if(get('kPump'))get('kPump').textContent='—';
 outputIds.forEach(id=>get(id).textContent='—');get('kStatus').textContent=message;
 get('kMathSteps').replaceChildren();get('kMath').open=false;
}
function showMath(p,r){
 const net=p.target-p.otherK;
 const c=net*p.weight/p.fluidRate;
 const steps=[
  `KCl rate needed: ${p.target} − ${p.otherK} = ${kFormat(net)} mEq/kg/hr.`,
  `KCl delivery: ${kFormat(net)} × ${p.weight} kg = ${kFormat(net*p.weight)} mEq/hr.`,
  `Required added-K concentration: ${kFormat(net*p.weight)} mEq/hr ÷ ${p.fluidRate} mL/hr = ${kFormat(c,6)} mEq/mL.`,
  p.method==='final'?`KCl stock volume: ${p.volume} mL × ${kFormat(c,6)} mEq/mL ÷ ${p.stock} mEq/mL = ${kVolume(r.additive)} mL.`:`KCl stock volume: (${p.volume} mL × ${kFormat(c,6)} mEq/mL) ÷ (${p.stock} − ${kFormat(c,6)}) mEq/mL = ${kVolume(r.additive)} mL.`,
  `Preparation: ${kVolume(r.diluent)} mL carrier + ${kVolume(r.additive)} mL KCl = ${kVolume(r.finalVolume)} mL final.`,
  `KCl in bag: ${kVolume(r.additive)} mL × ${p.stock} mEq/mL = ${ReferenceNumbers.format(r.addedMEq,8)} mEq.`,
  `Verification: (${ReferenceNumbers.format(r.addedMEq,8)} mEq ÷ ${kVolume(r.finalVolume)} mL) × ${p.fluidRate} mL/hr ÷ ${p.weight} kg + ${p.otherK} mEq/kg/hr = ${ReferenceNumbers.format(r.delivered,8)} mEq/kg/hr.`
 ];
 get('kMathSteps').replaceChildren(...steps.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));
}
function updatePotassium(){
 const method=get('kMethod').value;
 get('kSettingsLabel').textContent=method==='final'?'Preparation settings · final prepared volume':'Preparation settings · starting carrier volume';
 get('kMethodHelp').textContent=method==='final'?'Volume means the final total: remove the calculated KCl volume from measured carrier, then replace with KCl.':'Volume means the measured starting carrier: added KCl increases the final total.';
 get('kStockDisplay').textContent=get('kStock').value || '—';
 let base;
 try{base=readBase();}catch{renderChart(null);clearSelected('Complete the patient and fluid inputs, then choose a rate.');return;}
 renderChart(base);
 if(get('kTarget').value.trim()==='' || !get('kTarget').checkValidity()){clearSelected('Choose a rate from the chart, or enter a custom rate from 0–0.5 mEq/kg/hr.');return;}
 try{
  const p={...base,target:Number(get('kTarget').value)};
  const r=calculatePotassium(p);
  // Verify what the displayed preparation quantities deliver. Never feed these
  // display quantities back into the underlying calculation or linked rates.
  const shownFinal=kQuantity(r.additive)+kQuantity(r.diluent);
  const shownDelivered=kQuantity(r.additive)*p.stock/shownFinal*p.fluidRate/p.weight+p.otherK;
  updatePeripheralWarning(r.finalConcentration/1000);
  if(get('kPump'))get('kPump').textContent=ReferenceNumbers.format(p.fluidRate,8)+' mL/hr';
  get('kAdd').textContent=kVolume(r.additive);
  for(const [id,value,unit] of [['kDiluent',r.diluent,'mL'],['kFinalVolume',r.finalVolume,'mL'],['kAddedMEq',r.addedMEq,'mEq'],['kConcentration',r.finalConcentration/1000,'mEq/mL'],['kHours',r.bagHours,'hr'],['kDelivered',shownDelivered,'mEq/kg/hr']])get(id).textContent=(unit==='mEq/mL'?value.toLocaleString('en-US',{maximumSignificantDigits:8,useGrouping:false}):(unit==='mL'?kVolume(value):['mEq/kg/hr','mEq'].includes(unit)?ReferenceNumbers.format(value,8):kFormat(value,3)))+' '+unit;
  get('kStatus').textContent=method==='final'?`Selected ${p.target} mEq/kg/hr. Remove ${kVolume(r.additive)} mL carrier and replace with the same volume of KCl stock.`:`Selected ${p.target} mEq/kg/hr. Add ${kVolume(r.additive)} mL KCl stock to the measured starting carrier volume.`;
  get('kStatus').textContent+=' Check measurement feasibility, especially for very small stock volumes; verify equipment precision and use a clinician-approved dilution if needed. No dilution recipe is assumed.';
  showMath(p,{...r,addedMEq:kQuantity(r.additive)*p.stock,delivered:shownDelivered});
 }catch(e){clearSelected('Invalid: '+e.message);}
}
function toggleStock(){
 const input=get('kStock');
 if(input.readOnly){
  input.readOnly=false;get('kStockEditor').hidden=false;
  get('kStockToggle').textContent='Lock concentration';get('kStockToggle').setAttribute('aria-expanded','true');
  get('kLockState').textContent='Editing — verify vial';input.focus();
 }else{
  if(input.value.trim()==='' || !Number.isFinite(Number(input.value)) || Number(input.value)<=0 || !input.checkValidity()){get('kStockHelp').textContent='Enter a positive stock concentration before locking.';input.focus();return;}
  input.readOnly=true;get('kStockEditor').hidden=true;
  get('kStockToggle').textContent='Edit concentration';get('kStockToggle').setAttribute('aria-expanded','false');get('kLockState').textContent='Locked';
 }
 updatePotassium();
}
function selectRate(button){
 get('kTarget').value=button.dataset.rate;
 updatePotassium();
 if(typeof ReferenceLayout!=='undefined'){ReferenceLayout.reveal('kResults','kMath');return;}
 get('kMath').open=true;
 get('kResults').scrollIntoView({behavior:referenceScrollBehavior,block:'start'});get('kResults').focus({preventScroll:true});
}
get('kStockToggle').addEventListener('click',toggleStock);
get('potassiumForm').addEventListener('submit',event=>event.preventDefault());
document.querySelectorAll('.rate-pick').forEach(button=>button.addEventListener('click',()=>selectRate(button)));
// The shared weight field lives outside the compact form.
get('kWeight').addEventListener('input',updatePotassium);
get('potassiumForm').addEventListener('input',updatePotassium);
get('potassiumForm').addEventListener('reset',()=>setTimeout(()=>{
 get('kStock').readOnly=true;get('kStockEditor').hidden=true;get('kStockToggle').textContent='Edit concentration';get('kStockToggle').setAttribute('aria-expanded','false');get('kLockState').textContent='Locked';updatePotassium();
},0));
updatePotassium();
