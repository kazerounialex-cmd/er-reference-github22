// Shared arithmetic only. Dose selection and clinical context remain explicit in the UI.
function checkNumbers(values) {
  if (!Object.values(values).every(Number.isFinite)) throw Error('Complete all inputs with valid numbers.');
}
function safeResult(r) { checkNumbers(r); return r; }
function mixFinal({volume, target, base, stock}) {
  checkNumbers({volume,target,base,stock});
  if(volume<=0 || target<0 || base<0 || stock<0)throw Error('Volume must be positive; concentrations cannot be negative.');
  if(base===stock){if(target!==base)throw Error('Identical starting concentrations cannot produce this target.');return safeResult({additive:0,carrier:volume,finalVolume:volume,verified:base});}
  const proportion=(target-base)/(stock-base);
  if(proportion<0 || proportion>1)throw Error('Target must lie between the carrier and stock concentrations.');
  const additive=volume*proportion,carrier=volume-additive;
  if((proportion>0&&additive<=0)||(proportion<1&&carrier<=0))throw Error('Mixture volumes are below supported numeric precision.');
  return safeResult({additive,carrier,finalVolume:volume,verified:(additive*stock+carrier*base)/volume});
}
function mixVolumes({volumeA, concentrationA, volumeB, concentrationB}) {
  checkNumbers({volumeA,concentrationA,volumeB,concentrationB});
  if(volumeA<0 || volumeB<0 || concentrationA<0 || concentrationB<0 || volumeA+volumeB<=0)throw Error('Use nonnegative inputs and a positive total volume.');
  return safeResult({volume:volumeA+volumeB,concentration:(volumeA*concentrationA+volumeB*concentrationB)/(volumeA+volumeB)});
}
function magnesium({weight, dailyDose, hours, stock, volume}) {
  checkNumbers({weight,dailyDose,hours,stock,volume});
  if(weight<=0 || hours<=0 || stock<=0 || volume<=0 || dailyDose<0 || dailyDose>1)throw Error('Use positive weight, hours, stock, and final volume; this tool supports 0–1 mEq/kg/day.');
  const amount=weight*dailyDose*hours/24, additive=amount/stock;
  if((dailyDose>0&&(!(amount>0)||!(additive>0)))||!(volume/hours>0))throw Error('Magnesium preparation is below supported numeric precision.');
  if(additive>=volume)throw Error('Final volume must exceed the stock volume so the preparation is diluted.');
  return safeResult({amount,additive,carrier:volume-additive,pump:volume/hours,hourlyDose:dailyDose/24,delivered:amount/hours/weight*24});
}
function phosphate({weight,dose,fluidRate,volume,phosStock,kStock,otherK,method}) {
  checkNumbers({weight,dose,fluidRate,volume,phosStock,kStock,otherK});
  if(weight<=0 || fluidRate<=0 || volume<=0 || phosStock<=0 || kStock<0 || dose<0 || dose>.12 || otherK<0)throw Error('Use positive weight, flow, volume, and phosphate stock; dose must be 0–0.12 mmol/kg/hr.');
  if(!['final','add'].includes(method))throw Error('Choose a preparation method.');
  const c=dose*weight/fluidRate;
  if(c>=phosStock)throw Error('Stock must be more concentrated than the required mixture.');
  const additive=volume*c/(method==='final'?phosStock:phosStock-c);
  const carrier=method==='final'?volume-additive:volume, finalVolume=carrier+additive;
  if(dose>0&&(!(additive>0)||!(additive*phosStock>0)))throw Error('Phosphate preparation is below supported numeric precision.');
  const kRate=dose*kStock/phosStock,totalK=kRate+otherK;
  if(totalK>.5+1e-12)throw Error('Combined entered supplemental K exceeds this tool’s 0.5 mEq/kg/hr limit.');
  return safeResult({additive,carrier,finalVolume,bagHours:finalVolume/fluidRate,phosphateAmount:additive*phosStock,potassiumAmount:additive*kStock,kRate,totalK,delivered:additive*phosStock/finalVolume*fluidRate/weight});
}
function freeWater({weight,current,target,type,customHours}) {
  const values={weight,current,target};if(customHours!==null)values.customHours=customHours;checkNumbers(values);
  if(weight<=0 || current<=0 || target<=0 || target>current || (customHours!==null&&customHours<=0))throw Error('Use positive values and a target sodium at or below the current sodium.');
  if(!['chronic','acute'].includes(type))throw Error('Select acute or chronic hypernatremia.');
  const delta=current-target, liters=.6*weight*(current/target-1);
  const hours=customHours??delta/(type==='acute'?1:.5);
  const correction=delta===0?0:delta/hours;
  if(type==='chronic' && correction>.5+1e-12)throw Error('Custom duration exceeds 0.5 mEq/L/hr for chronic hypernatremia. Increase the duration.');
  if(type==='acute' && correction>1+1e-12)throw Error('Custom duration exceeds this tool’s acute reference estimate of 1 mEq/L/hr.');
  return safeResult({liters,hours,correction,mlPerHour:delta===0?0:liters*1000/hours,dayChange:Math.min(delta,correction*24)});
}
function correctedSodium({sodium,glucose}) {
  checkNumbers({sodium,glucose});
  if(sodium<=0 || glucose<100)throw Error('Use positive sodium and glucose ≥100 mg/dL; this tool models hyperglycemia.');
  const correction=(glucose-100)/100*1.6;
  return safeResult({correction,corrected:sodium+correction});
}
function magnesiumContext({value,lower,upper,refractory}) {
  checkNumbers({value,lower,upper});
  if(value<0 || lower<=0 || upper<=lower)throw Error('Use a nonnegative Mg result and valid lower/upper lab limits.');
  const band=value<lower?'low':value>upper?'high':'within';
  return {band,workbookDose:band==='low'?1:band==='within'&&refractory?.5:null};
}
function sodiumResponse({weight,patientNa,fluidNa,fluidK,rate,hours}) {
  checkNumbers({weight,patientNa,fluidNa,fluidK,rate,hours});
  if(weight<=0 || patientNa<=0 || fluidNa<0 || fluidK<0 || rate<=0 || hours<=0)throw Error('Complete patient weight/Na, selected fluid Na, total fluid K, rate, and duration.');
  const perLiter=(fluidNa+fluidK-patientNa)/(.6*weight+1),volume=rate*hours/1000;
  return safeResult({perLiter,volume,change:perLiter*volume,hourly:perLiter*rate/1000,dayChange:perLiter*rate*24/1000,predicted:patientNa+perLiter*volume});
}
if(typeof module!=='undefined')module.exports={mixFinal,mixVolumes,magnesium,phosphate,freeWater,correctedSodium,magnesiumContext,sodiumResponse};
