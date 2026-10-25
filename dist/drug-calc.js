const DrugCalc={
 // Only compare with the existing displayed workbook reference, in its units.
 // This is an advisory range check, never a new species-specific maximum.
 referenceCheck(drug,dose,units){
  const match=drug.reference.match(/(\d+(?:\.\d+)?)(?:[–-](\d+(?:\.\d+)?))? (mg|mcg)\/kg/);
  if(!match||!Number.isFinite(dose)||dose<=0)return null;
  const normalized=dose/(units.startsWith('mcg')?1000:1)*(match[3]==='mcg'?1000:1);
  return {outside:normalized<Number(match[1])-1e-12||normalized>Number(match[2]||match[1])+1e-12,
   low:Number(match[1]),high:Number(match[2]||match[1]),unit:match[3]+'/kg'};
 },
 localExposure({weight,lidocaineMg,bupivacaineMg,priorLidocaineMg,priorBupivacaineMg}){
  if(!Number.isFinite(weight)||weight<=0)throw Error('Enter patient weight.');
  const doses=[lidocaineMg,bupivacaineMg,priorLidocaineMg,priorBupivacaineMg];
  if(!doses.every(x=>Number.isFinite(x)&&x>=0))throw Error('Enter known prior exposure for both agents, including explicit zero when none.');
  const lidocaine=(lidocaineMg+priorLidocaineMg)/weight,bupivacaine=(bupivacaineMg+priorBupivacaineMg)/weight;
  if(![lidocaine,bupivacaine].every(Number.isFinite))throw Error('Inputs exceed calculation limits.');
  return {lidocaine,bupivacaine,combined:lidocaine>0&&bupivacaine>0};
 },
 preparation({weight,dose,stock,mode,volume,rate}){
  if(![weight,dose,stock].every(x=>Number.isFinite(x)&&x>0))throw Error('Enter weight, selected dose and a positive stock concentration.');
  if(mode==='sq'){if(dose<.2||dose>.5)throw Error('SQ reference range is 0.2–0.5 mg/kg per dose.');const r={mg:weight*dose,ml:weight*dose/stock};if(!Object.values(r).every(Number.isFinite))throw Error('Inputs exceed calculation limits.');return r;}
  if(!['syringe','bag'].includes(mode))throw Error('Choose an administration method.');
  if(dose<1||dose>2)throw Error('CRI reference range is 1–2 mg/kg/day.');
  if(!(volume>0&&Number.isFinite(volume)))throw Error('Enter the final preparation volume.');
  if(mode==='bag'&&!(rate>0&&Number.isFinite(rate)))throw Error('Enter a positive fluid pump rate.');
  const hours=mode==='syringe'?12:volume/rate, mg=weight*dose*hours/24, ml=mg/stock;
  if(ml>volume)throw Error('Stock volume exceeds the final preparation volume. Increase volume or review concentration.');
  if(![hours,mg,ml].every(Number.isFinite))throw Error('Inputs exceed calculation limits.');
  return {hours,mg,ml,diluent:volume-ml,pump:volume/hours,mgHour:weight*dose/24};
 },
 single(weight,dose,units,stock){if(![weight,dose].every(x=>Number.isFinite(x)&&x>0))throw Error('Enter weight and a prescribed dose.');const mg=weight*dose/(units.startsWith('mcg')?1000:1);const ml=Number.isFinite(stock)&&stock>0?mg/stock:null;if(!Number.isFinite(mg)||mg<=0||(ml!==null&&(!Number.isFinite(ml)||ml<=0)))throw Error('Inputs exceed calculation limits.');return {mg,ml};},
 norepi(weight,dose,concentration){if(![weight,dose,concentration].every(x=>Number.isFinite(x)&&x>0))throw Error('Enter weight, prescribed rate and prepared concentration.');const r=weight*dose*60/concentration;if(!Number.isFinite(r)||r<=0)throw Error('Inputs exceed calculation limits.');return r;}
};
if(typeof module!=='undefined')module.exports=DrugCalc;
