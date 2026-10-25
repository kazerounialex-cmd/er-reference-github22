(()=>{
const $=id=>document.getElementById(id),num=id=>Number($(id).value),fmt=x=>ReferenceNumbers.format(x);
const felineBlocked=['enrofloxacin','meloxicam','meloxicam-po','carprofen','carprofen-po'];
const groupOrder=['GI','Analgesia','Sedation / Premedication','Induction','Local / Regional','Antibiotics','Oral'];
function rowGroup(d){
 if(d.groups.includes('Oral'))return 'Oral';
 if(d.id.startsWith('ketamine-induction')||d.id.startsWith('propofol')||d.id==='alfaxalone')return 'Induction';
 if(d.id.includes('premed')||d.id.startsWith('ketamine-sed')||d.id.startsWith('dexmedetomidine')||d.id==='midazolam'||d.id==='acepromazine')return 'Sedation / Premedication';
 return d.groups[0];
}
const ordered=groupOrder.flatMap(group=>DRUG_CATALOG.filter(d=>rowGroup(d)===group));
let previousGroup='';
$('drugRows').innerHTML=ordered.map(d=>{const group=rowGroup(d);const heading=group!==previousGroup?`<tr class="drug-group"><th colspan="5" scope="colgroup"><h3>${group}</h3></th></tr>`:'';previousGroup=group;return heading+`<tr data-drug="${d.id}"><th scope="row">${d.name}<small>${d.reference}</small></th><td>${d.route}</td><td><label class="sr-only" for="${d.id}Dose">${d.name} prescribed dose</label><input id="${d.id}Dose" type="number" min="0" step="any" value="${d.defaultDose}"><select id="${d.id}Unit" aria-label="${d.name} dose units"><option>mg/kg per dose</option><option ${d.defaultUnit.startsWith('mcg')?'selected':''}>mcg/kg per dose</option></select></td><td><input id="${d.id}Stock" aria-label="${d.name} stock mg/mL" type="number" min="0" step="any" value="${d.stock??''}" readonly placeholder="Solid"></td><td id="${d.id}Result" class="line-result">—</td></tr>`;}).join('');
$('stockLock').onclick=()=>{const el=$('stock');el.readOnly=!el.readOnly;$('stockLock').textContent=el.readOnly?'Edit concentration':'Lock concentration';};
let locked=true;$('rowLock').onclick=()=>{locked=!locked;DRUG_CATALOG.forEach(d=>$(d.id+'Stock').readOnly=locked);$('rowLock').textContent=locked?'Edit stocks':'Lock stocks';};
function updateDrug(d,ready=num('weight')>0&&!!$('species').value){const out=$(d.id+'Result');if(!ready){out.textContent='—';return;}if($('species').value==='Cat'&&felineBlocked.includes(d.id)){out.textContent='Feline protocol needed';return;}if(!$(d.id+'Dose').value){out.textContent='—';return;}
try{const r=DrugCalc.single(num('weight'),num(d.id+'Dose'),$(d.id+'Unit').value,num(d.id+'Stock'));const check=DrugCalc.referenceCheck(d,num(d.id+'Dose'),$(d.id+'Unit').value);if(d.id==='acepromazine'&&r.mg>1)throw Error('Exceeds workbook 1 mg cap');out.innerHTML=`<b>${r.ml===null?'No liquid stock':fmt(r.ml)+' mL'}</b><small>${fmt(r.mg)} mg total</small>${check?.outside?'<p class="dose-caution"><b>Caution:</b> Outside displayed reference. Verify prescribed dose, species, route, formulation and prior exposure. Reference is not a validated maximum.</p>':''}${['lidocaine','bupivacaine'].includes(d.id)?'<small>Check: local/regional use only. Species-specific maximum is not configured. Review prior and combined local-anesthetic exposure below.</small>':''}`;}catch(e){out.textContent=e.message;}}
function updateLocalExposure(){
 const out=$('localExposureResult');if(!out)return;
 try{
  if(!$('species').value)throw Error('Choose species before reviewing exposure.');
  const prior=id=>$(id).value.trim()===''?NaN:num(id);
  const current=id=>DrugCalc.single(num('weight'),num(id+'Dose'),$(id+'Unit').value,num(id+'Stock')).mg;
  const r=DrugCalc.localExposure({weight:num('weight'),lidocaineMg:current('lidocaine'),bupivacaineMg:current('bupivacaine'),priorLidocaineMg:prior('priorLidocaine'),priorBupivacaineMg:prior('priorBupivacaine')});
  out.textContent=`Check: if BOTH displayed doses are planned, cumulative lidocaine ${fmt(r.lidocaine)} mg/kg; bupivacaine ${fmt(r.bupivacaine)} mg/kg. ${r.combined?'Combined exposure requires clinician review; individual reference ranges do not establish combination safety.':''} No maximum or safe-combination determination is calculated. Verify timing, species, route and formulation.`;
 }catch(error){out.textContent='Check: '+error.message+' No complete cumulative exposure assessment.';}
}
function update(){const ready=num('weight')>0&&!!$('species').value;$('stockValue').textContent=$('stock').value;
for(const mode of ['sq','syringe','bag']){const out=$(mode+'Result'),math=$(mode+'Math');math.textContent='';if(!ready){out.textContent='Enter weight and species above.';continue;}if(!$(mode+'Dose').value){out.textContent='Enter selected dose.';continue;}
try{const r=DrugCalc.preparation({weight:num('weight'),dose:num(mode+'Dose'),stock:num('stock'),mode,volume:mode==='sq'?0:num(mode+'Volume'),rate:mode==='bag'?num('bagRate'):0});out.innerHTML=`<strong>${fmt(r.ml)} mL</strong><span>${mode==='sq'?'GIVE SQ ONCE':'STOCK TO ADD'}</span><small>${fmt(r.mg)} mg total</small>`;
if(mode!=='sq'){const v=num(mode+'Volume');out.innerHTML+=mode==='syringe'?`<p>Add ${fmt(r.diluent)} mL compatible diluent to make ${fmt(v)} mL final.</p>`:`<p>Remove ${fmt(r.ml)} mL from measured carrier, add ${fmt(r.ml)} mL Reglan stock; keep ${fmt(v)} mL final.</p>`;out.innerHTML+=`<p><b>Pump ${fmt(r.pump)} mL/hour</b> · lasts ${fmt(r.hours)} hours.${mode==='bag'?' Recalculate when fluid rate changes.':''}</p>`;}
math.textContent=mode==='sq'?`${num('weight')} kg × ${num(mode+'Dose')} mg/kg ÷ ${num('stock')} mg/mL = ${r.ml} mL.`:`${num('weight')} kg × ${num(mode+'Dose')} mg/kg/day ÷ 24 = ${r.mgHour} mg/hour. × ${r.hours} hours = ${r.mg} mg. ÷ ${num('stock')} mg/mL = ${r.ml} mL stock. Final volume ÷ duration = ${r.pump} mL/hour.`;
}catch(e){out.textContent=e.message;}}
DRUG_CATALOG.forEach(d=>updateDrug(d,ready));updateLocalExposure();
try{if(!ready)throw Error('Enter weight and species.');$('nResult').textContent=`${fmt(DrugCalc.norepi(num('weight'),num('nDose'),num('nStock')))} mL/hour`;}catch(e){$('nResult').textContent=e.message;}
}
const rowControls=new Map(DRUG_CATALOG.flatMap(drug=>['Dose','Unit','Stock'].map(suffix=>[drug.id+suffix,drug])));
document.querySelectorAll('input,select').forEach(el=>{if(!['masterWeight','masterSpecies','sharedFluidRate'].includes(el.id))el.addEventListener('input',()=>{const drug=rowControls.get(el.id);if(drug){updateDrug(drug);if(['lidocaine','bupivacaine'].includes(drug.id))updateLocalExposure();}else update();});});update();
})();
