// Verification of what the displayed preparation quantities would deliver.
// This never changes the prescribed target or feeds display rounding into the
// pure calculators. A discrepancy requires preparation review, not a new dose.
const PreparationCheck=(()=>{
 const numbers=typeof ReferenceNumbers==='undefined'?require('./number-format.js'):ReferenceNumbers;
 const shown=value=>Number(numbers.volume(value));
 function checked({stockVolume,stock,volume,pump,weight,target,multiplier=1,other=0,unit,carrier}){
  if(![stockVolume,stock,volume,pump,weight,target,multiplier,other].every(Number.isFinite)||stockVolume<0||stock<=0||volume<=0||pump<=0||weight<=0||target<0||multiplier<=0||other<0)throw Error('Invalid preparation verification inputs.');
  const drug=shown(stockVolume),finalVolume=carrier===undefined?shown(volume):carrier+drug,rate=shown(pump);
  if(![drug,finalVolume,rate].every(Number.isFinite)||finalVolume<=0||rate<=0)throw Error('Displayed preparation is outside supported numeric limits.');
  if(drug>finalVolume)throw Error('Displayed stock volume exceeds the displayed final volume. Verify preparation.');
  const amount=drug*stock,concentration=amount/finalVolume,ownDelivery=concentration*rate/weight*multiplier,delivered=ownDelivery+other,hours=finalVolume/rate;
  if(![amount,concentration,delivered,hours].every(Number.isFinite)||hours<=0||(drug>0&&(!(amount>0)||!(ownDelivery>0))))throw Error('Preparation verification exceeds numeric limits.');
  const difference=target>0?(delivered-target)/target*100:0;
  const changed=target===0?delivered!==0:Math.abs(difference)>1e-9;
  const note=changed?`Caution: displayed stock and pump quantities deliver ${numbers.display(delivered)} ${unit}, ${difference>0?'+':''}${numbers.display(difference)}% versus the prescribed target ${target} ${unit}. Verify measurable volumes and the preparation before use; the prescribed target is unchanged.`:'';
  return {perPump:concentration/weight*multiplier,drug,volume:finalVolume,pump:rate,diluent:finalVolume-drug,amount,concentration,delivered,hours,changed,note};
 }
 function cri(model,tool,weight){
  const multiplier=tool==='lidocaine'?1000/60:tool==='norepinephrine'?1/60:tool==='reglan'?24:1;
  return checked({stockVolume:model.drug,stock:model.stock,volume:model.volume,pump:model.pump,weight,target:model.dose,multiplier,unit:model.unit});
 }
 function potassium(p,r){
  const result=checked({stockVolume:r.additive,stock:p.stock,volume:r.finalVolume,carrier:p.method==='add'?p.volume:undefined,pump:p.fluidRate,weight:p.weight,target:p.target,other:p.otherK,unit:'mEq/kg/hr'});
  if(result.delivered>.5+1e-12)throw Error('Displayed preparation exceeds the existing 0.5 mEq/kg/hr supplemental-potassium limit. Verify stock volume and pump rate.');
  return result;
 }
 function phosphate(p,r){
  const result=checked({stockVolume:r.additive,stock:p.phosStock,volume:r.finalVolume,carrier:p.method==='add'?p.volume:undefined,pump:p.fluidRate,weight:p.weight,target:p.dose,unit:'mmol/kg/hr'});
  const potassiumAmount=result.drug*p.kStock,potassiumRate=potassiumAmount/result.volume*result.pump/p.weight,totalK=potassiumRate+p.otherK;
  if(totalK>.5+1e-12)throw Error('Displayed preparation exceeds the existing 0.5 mEq/kg/hr supplemental-potassium limit. Verify all concurrent sources.');
  return {...result,potassiumAmount,potassiumRate,totalK};
 }
 function single({stockVolume,stock,weight,target}){
  if(![stockVolume,stock,weight,target].every(Number.isFinite)||stockVolume<=0||stock<=0||weight<=0||target<=0)throw Error('Invalid stock volume or dose verification inputs.');
  const drug=shown(stockVolume),amount=drug*stock,delivered=amount/weight,difference=(delivered-target)/target*100;
  if(![amount,delivered,difference].every(Number.isFinite)||amount<=0||delivered<=0)throw Error('Dose verification exceeds numeric limits.');
  return {drug,amount,delivered,note:Math.abs(difference)>1e-9?`Caution: displayed volume contains ${numbers.display(amount)} mg (${numbers.display(delivered)} mg/kg), ${difference>0?'+':''}${numbers.display(difference)}% versus the prescribed ${target} mg/kg. Verify the preparation before use.`:''};
 }
 function mixture({stockVolume,stock,base,volume,target,unit}){
  if(![stockVolume,stock,base,volume,target].every(Number.isFinite)||stockVolume<0||stock<0||base<0||volume<=0||target<0)throw Error('Invalid mixture verification inputs.');
  const drug=shown(stockVolume),finalVolume=shown(volume),diluent=finalVolume-drug;
  if(diluent<0)throw Error('Displayed stock does not fit in the final mixture.');
  const concentration=(drug*stock+diluent*base)/finalVolume;
  if(!Number.isFinite(concentration))throw Error('Mixture verification exceeds numeric limits.');
  const difference=target>0?(concentration-target)/target*100:0,changed=target===0?concentration!==0:Math.abs(difference)>1e-9;
  return {drug,volume:finalVolume,diluent,concentration,changed,note:changed?`Caution: displayed stock volume produces ${numbers.display(concentration)} ${unit}, versus prescribed ${target} ${unit}. Verify the mixture before use; nominal planning math is unchanged.`:''};
 }
 function concentration(value){
  const compact=numbers.display(value);
  // Keep ordinary labels compact, but do not conceal a different prepared
  // concentration behind the stock/pump display convention.
  return Math.abs(Number(compact)-value)<=Math.abs(value)*1e-12?compact:numbers.format(value,6);
 }
 function instruction(result,diluent){return `Use ${numbers.volume(result.drug)} mL stock and add ${diluent} to ${numbers.volume(result.volume)} mL final. Carrier volume is approximately ${numbers.volume(result.diluent)} mL.`;}
 return {infusion:checked,cri,potassium,phosphate,single,mixture,concentration,instruction};
})();
if(typeof module!=='undefined')module.exports=PreparationCheck;
