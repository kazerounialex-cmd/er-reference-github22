(()=>{
const $=id=>document.getElementById(id),n=id=>ReferenceNumbers.read($(id)),tool=document.body.dataset.cri,c=CRI_DATA[tool];
const fmt=x=>ReferenceNumbers.format(x);
$('criStock').readOnly=true;$('criLock').onclick=()=>{const f=$('criStock');f.readOnly=!f.readOnly;$('criLock').textContent=f.readOnly?'Edit concentration':'Lock concentration';};
if(tool==='norepinephrine'){
 $('prepMode').value='known';$('norepiChartPreview').hidden=true;
 $('previewNorepiChart').onclick=()=>{$('norepiChartPreview').hidden=!$('norepiChartPreview').hidden;};
 $('printNorepiChart').onclick=()=>{if(!$('printNorepiChart').disabled)window.print();};
}

function concentrationError(message){$('prepConcentration').setAttribute('aria-invalid','true');$('norepiConcentrationError').hidden=false;$('norepiConcentrationError').textContent='CONCENTRATION ERROR — '+message;throw Error(message);}
function update(){
 if(tool==='norepinephrine'){$('prepConcentration').setAttribute('aria-invalid','false');$('norepiConcentrationError').hidden=true;$('norepiConcentrationError').textContent='';$('printNorepiChart').disabled=true;$('norepiChartTable').innerHTML='';$('norepiChartMeta').textContent='Enter a valid preparation to generate the chart.';}
 if(tool==='norepinephrine'){const target=$('prepMode').value==='target';$('prepConcentration').readOnly=target;$('targetPump').disabled=false;$('targetPump').readOnly=!target;$('targetPump').parentElement.firstChild.textContent=target?'Target preparation pump rate · mL/hr':'Current calculated pump rate · mL/hr · locked';if(!target)$('targetPump').value='';if(target)$('prepConcentration').value='';}
 const cat=tool==='lidocaine'&&$('species').value==='Cat';
 if(tool==='lidocaine'){$('catLidocaineWarning').hidden=!cat;['criDose','prepHours','prepPump','prepCapacity','criStock','criLock'].forEach(id=>$(id).disabled=cat);}
 $('prepResult').innerHTML='';
 $('prepMath').textContent='';
 try{
 if(cat)throw Error('Lidocaine CRI is not enabled for cats. All preparation controls are disabled.');
 if(!['Dog','Cat'].includes($('species').value))throw Error('Select species in the shared banner.');
 if(tool==='norepinephrine'){
 const targetMode=$('prepMode').value==='target';
 $('prepConcentration').readOnly=targetMode;
 if(targetMode){$('prepConcentration').value='';CriCalc.positive(n('weight'),n('criDose'),n('targetPump'));const derived=n('weight')*n('criDose')*60/n('targetPump');CriCalc.positive(derived);ReferenceNumbers.write($('prepConcentration'),derived);}
 const concentration=n('prepConcentration'),volume=n('prepVolume');
 if(!Number.isFinite(concentration)||concentration<=0)concentrationError('Enter a positive prepared concentration.');
 CriCalc.positive(n('criStock'));
 if(concentration>n('criStock'))concentrationError('Prepared concentration exceeds vial stock concentration.');
 const pump=CriCalc.rate(n('weight'),n('criDose'),concentration,'mcg/kg/min'),mix=CriCalc.mix(n('criStock'),concentration,volume),hours=volume/pump;
 CriCalc.positive(pump,hours,mix.amount,mix.drug);
 if(!targetMode)ReferenceNumbers.write($('targetPump'),pump);
 const access=document.querySelector('[name=criAccess]:checked').value,limit=access==='peripheral'?16:64;
 // Round a displayed minimum upward so shortening the text never suggests a rate below the guardrail.
 const minimumPump=n('weight')*n('criDose')*60/limit,scale=minimumPump<1?100:10;
 if(concentration>limit)concentrationError(`Prepared concentration ${fmt(concentration)} mcg/mL exceeds the ${access} workbook guardrail (${limit} mcg/mL). Review access or choose a more dilute preparation${targetMode?` by increasing the target pump rate (at least ${fmt(Math.ceil(minimumPump*scale)/scale)} mL/hr)`:''}. These are workbook guardrails, not validated maximums.`);
 const display=x=>ReferenceNumbers.display(x);
 const doses=[...new Set([...c.rates,n('criDose')])].sort((a,b)=>a-b);
 $('norepiChartMeta').textContent=`${$('species').value} · ${n('weight')} kg | Prepared concentration: ${display(concentration)} mcg/mL | Final volume: ${display(volume)} mL. Fixed preparation for every row.`;
 $('norepiChartTable').innerHTML='<thead><tr><th scope="col">Rate · mL/hr</th><th scope="col">Dose · mcg/kg/min</th></tr></thead><tbody>'+doses.map(dose=>`<tr><td>${display(CriCalc.rate(n('weight'),dose,concentration,'mcg/kg/min'))}</td><td>${dose}</td></tr>`).join('')+'</tbody>';
 $('printNorepiChart').disabled=false;
 $('prepResult').innerHTML=`<div class="cri-output"><div><small>CALCULATED PUMP RATE</small><strong>${fmt(pump)} mL/hr</strong></div><div><small>CALCULATED RUN TIME</small><strong>${fmt(hours)} hours</strong></div></div><p>Draw up <b>${fmt(mix.drug)} mL norepinephrine stock</b> + <b>${fmt(mix.diluent)} mL D5W</b> to make <b>${fmt(volume)} mL final</b>.</p><p class="help">New preparation calculation · delivers ${n('criDose')} mcg/kg/min · prepared concentration ${fmt(concentration)} mcg/mL · ${fmt(mix.amount)} mcg total. Verify the actual formulation and diluent compatibility.</p>`;
 const mathFmt=x=>ReferenceNumbers.display(x);
 $('prepMath').textContent=`Pump = ${n('weight')} kg × ${n('criDose')} mcg/kg/min × 60 min/hr ÷ ${concentration} mcg/mL = ${mathFmt(pump)} mL/hr. Run time = ${volume} mL ÷ ${mathFmt(pump)} mL/hr = ${mathFmt(hours)} hours. Stock = ${concentration} mcg/mL × ${volume} mL ÷ ${n('criStock')} mcg/mL = ${mathFmt(mix.drug)} mL. Diluent = ${volume} − ${mathFmt(mix.drug)} = ${mathFmt(mix.diluent)} mL.`;
 return;
 }
 const factor=tool==='lidocaine'?60/1000:tool==='norepinephrine'?60:1;
 const r=CriCalc.syringe(n('weight'),n('criDose')*factor,n('criStock'),n('prepHours'),n('prepPump'),n('prepCapacity'));

 $('prepResult').innerHTML=`<div class="cri-output"><div><small>${c.title.toUpperCase()} STOCK</small><strong>${fmt(r.drug)} mL</strong></div><div><small>${c.diluent} DILUENT</small><strong>${fmt(r.diluent)} mL</strong></div></div><p>Make <b>${fmt(r.volume)} mL final</b>. Run at <b>${fmt(r.pump)} mL/hr</b> for <b>${fmt(r.hours)} hours</b>.</p><p class="help">Delivers ${n('criDose')} ${c.unit} · prepared concentration ${fmt(r.concentration)} ${c.stockUnit} · total ${fmt(r.amount)} ${tool==='norepinephrine'?'mcg':'mg'}. Verify the actual formulation and diluent compatibility.</p>`;
 const mathFmt=x=>ReferenceNumbers.display(x);
 $('prepMath').textContent=`Volume = ${mathFmt(r.hours)} hr × ${mathFmt(r.pump)} mL/hr = ${mathFmt(r.volume)} mL. Drug amount = ${n('weight')} kg × ${n('criDose')} ${c.unit} × ${mathFmt(factor)} hourly/unit factor × ${mathFmt(r.hours)} hr = ${mathFmt(r.amount)} ${tool==='norepinephrine'?'mcg':'mg'}. Stock = ${mathFmt(r.amount)} ÷ ${n('criStock')} = ${mathFmt(r.drug)} mL. Diluent = ${mathFmt(r.volume)} − ${mathFmt(r.drug)} = ${mathFmt(r.diluent)} mL.`;
 }catch(e){$('prepResult').textContent=e.message;}
}
document.querySelectorAll('input,select').forEach(f=>{if(!['masterWeight','masterSpecies','sharedFluidRate'].includes(f.id))f.addEventListener('input',()=>{ReferenceNumbers.forget(f);update();});});update();
})();
