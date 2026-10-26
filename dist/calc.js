// Pure calculation: values enter here; the browser displays the returned results.
function calculate({species, weight, dehydration, hours, losses, bolus, mode}) {
  if (!['dog','cat'].includes(species)) throw Error('Select species in the shared banner.');
  if (!['initial','current'].includes(mode)) throw Error('Choose a valid estimate mode.');
  if (![weight,dehydration,hours,losses,bolus].every(Number.isFinite) || weight<=0 || hours<=0 || dehydration<0 || dehydration>100 || losses<0 || bolus<0) throw Error('Enter valid numbers. Weight and replacement hours must be greater than zero.');
  const maintenanceDaily=(species==='dog'?132:80)*weight**0.75;
  const deficit=weight*dehydration/100*1000;
  const credit=mode==='initial'?bolus:0;
  const remaining=Math.max(0,deficit-credit);
  const result={maintenanceDaily, maintenanceHourly:maintenanceDaily/24, deficit, credit, remaining, replacementHourly:remaining/hours, total:maintenanceDaily/24+remaining/hours+losses, excess:Math.max(0,credit-deficit)};
  if(!Object.values(result).every(Number.isFinite))throw Error('Inputs exceed calculation limits.');
  return result;
}
// The clinician selects the target. This function only solves the mixture.
function calculatePotassium({weight, target, fluidRate, volume, stock, otherK, method}) {
  if (![weight,target,fluidRate,volume,stock,otherK].every(Number.isFinite)) throw Error('Complete all potassium inputs with valid numbers.');
  if(weight<=0 || fluidRate<=0 || volume<=0 || stock<=0 || target<0 || otherK<0) throw Error('Weight, fluid rate, volume, and stock concentration must be positive. Potassium rates cannot be negative.');
  if(!['final','add'].includes(method)) throw Error('Choose a preparation method.');
  if(target>0.5) throw Error('Target exceeds this tool’s 0.5 mEq/kg/hr limit. No preparation calculated.');
  if(otherK>target) throw Error('Other potassium infusions already exceed the selected target.');
  const desiredConcentration=(target-otherK)*weight/fluidRate; // mEq/mL in this bag
  const base=0; // Carrier potassium is intentionally excluded at the owner’s request.
  if(desiredConcentration<base-1e-12) throw Error('Other infusions exceed the supplemental potassium target.');
  if(stock<=base || stock<=desiredConcentration) throw Error('Stock must be more concentrated than the target mixture.');
  const additive=volume*Math.max(0,desiredConcentration-base)/(method==='final'?stock-base:stock-desiredConcentration);
  if(method==='final' && additive>=volume) throw Error('The required additive does not fit within the final volume.');
  const diluent=method==='final'?volume-additive:volume;
  const finalVolume=diluent+additive;
  const addedMEq=additive*stock;
  const nativeMEq=diluent*base;
  const delivered=(addedMEq+nativeMEq)/finalVolume*fluidRate/weight+otherK;
  const values={additive,diluent,finalVolume,addedMEq,nativeMEq,delivered,bagHours:finalVolume/fluidRate,finalConcentration:(addedMEq+nativeMEq)/finalVolume*1000};
  if(target>otherK&&(!(additive>0)||!(addedMEq>0)||!(desiredConcentration>0)))throw Error('Required potassium volume is below supported numeric precision. No zero-volume preparation calculated.');
  if(!Object.values(values).every(Number.isFinite)) throw Error('Inputs are outside the supported numeric range.');
  return values;
}
if(typeof module!=='undefined') module.exports={calculate,calculatePotassium};

// Episode-based GI loss estimate; a rule of thumb rather than measured output.
function calculateGiLoss({weight,episodes,hours,perEpisode}) {
 if(![weight,episodes,hours,perEpisode].every(Number.isFinite)||weight<=0||hours<=0||episodes<0||!Number.isInteger(episodes)||perEpisode<0)throw Error('Enter weight, whole episodes, positive hours and a nonnegative episode estimate.');
 const rate=weight*episodes*perEpisode/hours;
 if(!Number.isFinite(rate))throw Error('Inputs exceed calculation limits.');
 return rate;
}
if(typeof module!=='undefined')module.exports.calculateGiLoss=calculateGiLoss;
