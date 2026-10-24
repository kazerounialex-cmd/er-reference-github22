// Original layout adapter. All clinical arithmetic delegates to the existing calculators.
// Returns independent section errors so one unfinished preparation cannot hide other results.
function originalSheetCalculate(v, api) {
  const values={},errors={};
  const put=(key,value)=>{if(!Number.isFinite(value))throw Error('Inputs exceed calculation limits.');values[key]=value;};
  const section=(name,fn)=>{const before={...values};try{if(!['Dog','Cat'].includes(v.species)||!Number.isFinite(v.weight)||v.weight<=0)throw Error('Select species and enter patient weight above.');fn();}catch(error){Object.keys(values).forEach(k=>delete values[k]);Object.assign(values,before);errors[name]=error.message;}};
  for(const key of ['D4','D14','M4','M14','D26','M31','O31','M46','P57'])if(Number.isFinite(v.weight)&&v.weight>0)put(key,v.weight);
  for(const [species,prefix,keys] of [['Dog','dog',['E6','F6','E7','F7','E8','F10','F11']],['Cat','cat',['E16','F16','E17','F17','E18','F20']]])section(prefix,()=>{
    if(v.species!==species)throw Error('Select '+species+' above to use this fluid block.');
    const r=api.calculate({species:species.toLowerCase(),weight:v.weight,dehydration:v[prefix+'Dehydration'],hours:24,losses:v[prefix+'Losses'],bolus:v[prefix+'Bolus'],mode:'initial'});
    [r.maintenanceDaily,r.maintenanceHourly,r.deficit,r.replacementHourly,v[prefix+'Losses']*24,r.total].forEach((x,i)=>put(keys[i],x));
    if(species==='Dog')put('F11',api.calculate({species:'dog',weight:v.weight,dehydration:v.dogDehydration,hours:12,losses:v.dogLosses,bolus:v.dogBolus,mode:'initial'}).total);
  });
  section('phosphate',()=>{
    const r=api.phosphate({weight:v.weight,dose:v.phosDose,fluidRate:v.phosRate,volume:v.phosVolume,phosStock:v.phosStock,kStock:v.phosKStock,otherK:0,method:'final'});
    for(const [key,value] of Object.entries({R25:r.additive,R28:r.kRate,R29:r.potassiumAmount,R32:v.phosRate/v.weight,R34:r.bagHours,M32:v.phosDose,M33:v.phosRate,M34:v.phosVolume}))put(key,value);
  });
  section('potassium',()=>{
    if(v.includePhos&&errors.phosphate)throw Error('Complete KPhos inputs before including its potassium.');
    if(!Number.isFinite(v.kVolume)||!Number.isFinite(v.kRate)||v.kVolume<=0||v.kRate<=0)throw Error('KCl fluid volume and pump rate must be positive.');
    const other=v.otherK+(v.includePhos?values.R28:0);
    const rows=[[.5,.5],[.3,.4],[.2,.25],[.1,.15],[.05,.05]];
    put('V4',v.kVolume/v.kRate);
    rows.forEach(([low,high],i)=>{
      const row=i+6;
      for(const [dose,mass,amount,ml] of [[low,'N','Q','T'],[high,'O','R','U']]){
        // Other K can make only the lower suggestion infeasible; keep valid upper choices.
        try{const r=api.calculatePotassium({weight:v.weight,target:dose,fluidRate:v.kRate,volume:v.kVolume,stock:v.kStock,otherK:other,method:'final'});put(mass+row,dose*v.weight);put(amount+row,r.addedMEq);put(ml+row,r.additive);}catch(error){errors['k'+ml+row]=error.message;}
      }
    });
  });
  section('magnesium',()=>{
    for(const [dose,row] of [[1,17],[.5,19]]){
      const r=api.magnesium({weight:v.weight,dailyDose:dose,hours:24,stock:v.mgStock,volume:1000});put('P'+row,r.amount);put('S'+row,r.additive);
    }
  });
  section('water',()=>{
    const a=api.freeWater({weight:v.weight,current:v.naCurrent,target:v.naTarget,type:'chronic',customHours:null});
    const b=api.freeWater({weight:v.weight,current:v.naCurrent,target:v.naTarget,type:'chronic',customHours:v.waterHours});
    for(const [key,value] of Object.entries({G26:a.liters,H26:b.liters,G27:a.hours,G28:a.mlPerHour,H28:b.mlPerHour}))put(key,value);
  });
  section('sodium',()=>{
    for(const [row,base] of [[36,130],[38,140],[40,154]]){
      try{put('H'+row,api.mixFinal({volume:v.naVolume,target:v.naMixTarget,base,stock:1232}).additive);}catch(error){errors['na'+row]=error.message;}
    }
    for(const [col,add] of [['D',10],['E',25]])put(col+'45',api.mixVolumes({volumeA:1000,concentrationA:154,volumeB:add,concentrationB:1232}).concentration);
  });
  section('hypo',()=>{
    const r=api.mixFinal({volume:v.hypoVolume,target:v.hypoTarget,base:130,stock:0});put('D53',v.hypoTarget/130);put('D54',r.additive);put('D55',r.additive);
    for(const [col,lrs,d5] of [['D',900,100],['E',800,200]])put(col+'60',api.mixVolumes({volumeA:lrs,concentrationA:130,volumeB:d5,concentrationB:0}).concentration);
  });
  section('glucose',()=>{const r=api.correctedSodium({sodium:v.glucoseNa,glucose:v.glucose});put('G50',r.correction);put('H52',r.corrected);});
  section('dextrose',()=>{
    for(const [row,target] of [[40,2.5],[41,5]]){const r=api.mixFinal({volume:v.dextroseVolume,target,base:0,stock:50});put('Q'+row,r.additive);put('S'+row,r.carrier);}
  });
  section('blood',()=>{const r=api.bloodPlan({weight:v.weight});put('M48',r.estimated);put('M49',r.day);put('M51',r.fortnight);});
  section('norepi',()=>{
    const r=api.CriCalc.syringe(v.weight,v.neDose*60,v.neStock,v.neHours,1,12);
    if(!['peripheral','central'].includes(v.neAccess))throw Error('Choose norepinephrine access.');
    if(r.concentration>(v.neAccess==='central'?64:16))throw Error('1 mL/hr mix exceeds the selected access guardrail. Use the Norepinephrine CRI page to adjust concentration/rate.');
    put('N58',r.concentration);put('P58',v.neDose*60*v.weight/v.neStock);put('S58',r.drug);put('T58',r.diluent);
  });
  return {values,errors};
}
if(typeof module!=='undefined')module.exports=originalSheetCalculate;
