const assert=require('node:assert/strict');
const {calculate}=require('./dist/calc.js');
const base={species:'dog',weight:20,dehydration:8,hours:12,losses:0,bolus:400,mode:'initial'};
let r=calculate(base);assert.equal(r.remaining,1200);assert.equal(r.replacementHourly,100);
assert.ok(Math.abs(r.total-((132*20**.75)/24+100))<1e-10);
assert.equal(calculate({...base,mode:'current',dehydration:6}).total,r.total);
assert.equal(calculate({...base,hours:24}).maintenanceHourly,r.maintenanceHourly);
assert.equal(calculate({...base,losses:10}).total,r.total+10);
assert.equal(calculate({...base,bolus:2000}).remaining,0);
assert.equal(calculate({...base,species:'cat'}).maintenanceDaily,80*20**.75);
for(const change of [{weight:0},{hours:0},{losses:-1},{weight:NaN}])assert.throws(()=>calculate({...base,...change}));
console.log('Passed: both estimate modes, replacement periods, losses, species, excess boluses, and invalid input.');

const {calculatePotassium}=require('./dist/calc.js');
const k={weight:20,target:0.1,fluidRate:50,volume:1000,stock:2,otherK:0,method:'final'};
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} differs from ${b}`);
let mix=calculatePotassium(k);
near(mix.additive,20);near(mix.diluent,980);near(mix.finalVolume,1000);near(mix.addedMEq,40);near(mix.delivered,.1);
mix=calculatePotassium({...k,method:'add'});
near(mix.additive,20.408163265306122);near(mix.finalVolume,1020.4081632653061);near(mix.delivered,.1);
near(calculatePotassium({...k,otherK:.02}).additive,16);
near(calculatePotassium({...k,stock:1}).additive,40);
near(calculatePotassium({...k,fluidRate:100}).additive,10);
near(calculatePotassium({...k,target:0}).additive,0);
near(calculatePotassium({...k,otherK:.1}).additive,0);
near(calculatePotassium({...k,weight:6.2,fluidRate:12,volume:96,target:.5}).additive,12.4); // Original workbook sample, final-volume convention.
for(const method of ['add','final'])for(const weight of [0.5,5,30])for(const target of [.05,.2,.5])for(const otherK of [0,.01]){
 const v={...k,method,weight,target,otherK};const result=calculatePotassium(v);
 // Independent physical check: amount delivered = drug concentration × pump volume.
 const deliveredVolume=v.fluidRate*3;
 const deliveredFromBag=result.additive*v.stock*(deliveredVolume/result.finalVolume);
 const deliveredSeparately=otherK*weight*3;
 near((deliveredFromBag+deliveredSeparately)/(weight*3),target);
 near(result.diluent+result.additive,result.finalVolume);
}
for(const change of [{weight:0},{fluidRate:0},{volume:0},{stock:0},{target:.501},{otherK:.11},{target:-1},{stock:.01},{weight:Infinity},{method:'invalid'}])assert.throws(()=>calculatePotassium({...k,...change}));
console.log('Passed: potassium preparation methods, concurrent supplementation, stock and flow changes, workbook sample, zero-addition and invalid cases, and 36 mass-balance scenarios.');

// Exercise chart, selection, and stock-lock behavior without a browser.
const vm=require('node:vm'),fs=require('node:fs');
const elements={};
function element(value='') {return {value,textContent:'',hidden:false,readOnly:false,open:false,disabled:false,attrs:{},listeners:{},children:[],addEventListener(name,fn){const previous=this.listeners[name];this.listeners[name]=previous?event=>{previous(event);fn(event);}:fn;},dispatchEvent(event){this.listeners[event.type]?.(event);},setAttribute(k,v){this.attrs[k]=v;},replaceChildren(...children){this.children=children;},focus(){},scrollIntoView(){},checkValidity(){return this.value!=='' && Number.isFinite(Number(this.value)) && Number(this.value)>=0;}};}
for(const id of ['kPeripheralWarning','kPeripheralHeading','kPeripheralMessage','kWeight','kTarget','kRate','kVolume','kStock','kOther','kMethod','kMethodHelp','kAdd','kDiluent','kFinalVolume','kAddedMEq','kConcentration','kHours','kDelivered','kStatus','potassiumForm','kStockDisplay','kChartStatus','kMath','kMathSteps','kStockToggle','kStockEditor','kLockState','kStockHelp','kResults','kSettingsLabel'])elements[id]=element();
const rates=[[.5],[.3,.4],[.2,.25],[.1,.15],[.05]];
const buttons=[];
rates.forEach((rr,i)=>{elements['kEq'+i]=element();elements['kMl'+i]=element();rr.forEach(rate=>{const b=element();b.dataset={rate:String(rate),row:String(i)};buttons.push(b);});});
for(const [id,value] of Object.entries({kWeight:'20',kTarget:'',kRate:'50',kVolume:'1000',kStock:'2',kOther:'0',kMethod:'final'}))elements[id].value=value;
elements.kStock.readOnly=true;elements.kStockEditor.hidden=true;
const ctx={PreparationCheck:require('./dist/preparation-check.js'),ReferenceNumbers:require('./dist/number-format.js'),document:{getElementById:id=>elements[id],createElement:()=>element(),querySelectorAll:selector=>selector==='.rate-pick'?buttons:buttons.filter(b=>selector===`[data-row="${b.dataset.row}"]`)},calculatePotassium,setTimeout:fn=>fn()};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('./dist/potassium.js','utf8'),ctx);
// All rows calculate before a target is selected.
assert.equal(elements.kMl1.textContent,'60.0 mL – 80.0 mL');assert.equal(elements.kAdd.textContent,'—');assert.ok(buttons.every(b=>!b.disabled));
buttons.find(b=>b.dataset.rate==='0.3').listeners.click();
assert.equal(elements.kTarget.value,'0.3');assert.equal(elements.kAdd.textContent,'60.0');assert.equal(elements.kMath.open,true);assert.equal(elements.kMathSteps.children.length,7);
assert.match(elements.kMathSteps.children[0].textContent,/0.3/);
assert.equal(buttons.find(b=>b.dataset.rate==='0.3').attrs['aria-pressed'],'true');
// Fluid changes update both chart rows and selected math.
elements.kRate.value='100';vm.runInContext('updatePotassium()',ctx);assert.equal(elements.kMl1.textContent,'30.0 mL – 40.0 mL');assert.equal(elements.kAdd.textContent,'30.0');
// Intentional unlock and lock; lock refuses an invalid concentration.
elements.kStockToggle.listeners.click();assert.equal(elements.kStock.readOnly,false);assert.equal(elements.kStockEditor.hidden,false);
elements.kStock.value='0';elements.kStockToggle.listeners.click();assert.equal(elements.kStock.readOnly,false);assert.match(elements.kStockHelp.textContent,/positive/);
elements.kStock.value='1';elements.kStockToggle.listeners.click();assert.equal(elements.kStock.readOnly,true);assert.equal(elements.kStockEditor.hidden,true);assert.equal(elements.kAdd.textContent,'60.0');
// Invalid input clears results and math, and disables calculated selections.
elements.kWeight.value='';vm.runInContext('updatePotassium()',ctx);assert.equal(elements.kAdd.textContent,'—');assert.equal(elements.kMl1.textContent,'— mL – — mL');assert.equal(elements.kMath.open,false);assert.ok(buttons.every(b=>b.disabled));
// A conflicting concurrent infusion disables only impossible rates.
elements.kWeight.value='20';elements.kOther.value='.2';vm.runInContext('updatePotassium()',ctx);assert.equal(buttons.find(b=>b.dataset.rate==='0.05').disabled,true);assert.equal(buttons.find(b=>b.dataset.rate==='0.3').disabled,false);
// Existing-volume mode and custom target still work.
elements.kOther.value='0';elements.kStock.value='2';elements.kRate.value='50';elements.kTarget.value='.1';elements.kMethod.value='add';vm.runInContext('updatePotassium()',ctx);assert.equal(elements.kAdd.textContent,'20.4');assert.match(elements.kStatus.textContent,/starting carrier/);
// Browser resets values before reset callback; simulate that default action.
elements.kStock.readOnly=false;elements.kStock.value='2';elements.kWeight.value='';elements.kTarget.value='';elements.potassiumForm.listeners.reset();assert.equal(elements.kStock.readOnly,true);assert.equal(elements.kStockEditor.hidden,true);assert.equal(elements.kStockDisplay.textContent,'2');assert.equal(elements.kAdd.textContent,'—');
const html=fs.readFileSync('./dist/potassium.html','utf8');assert.match(html, /id="kStock"[^>]*readonly/);assert.ok(html.indexOf('dose-reference-title')<html.indexOf('id="kResults"'));
console.log('Passed: live chart, lower/upper selection, worked math, flow updates, stock lock/unlock, invalid-state clearing, concurrent K conflicts, custom target, preparation mode, and reset (simulated DOM).');

// Integrate actual shared-patient events, including fields outside the form.
for(const id of ['masterWeight','masterSpecies','clearPatient','patientSessionNote'])elements[id]=element();
elements.masterSpecies.options=['','dog','cat'].map(value=>({value}));
elements.kWeight.value='';elements.kTarget.value='.1';elements.kMethod.value='final';
ctx.window={addEventListener(){}};ctx.Event=class{constructor(type){this.type=type;}};
let storedPatient=JSON.stringify({weight:'20',species:'dog'});
ctx.sessionStorage={getItem:()=>storedPatient,setItem:(_,v)=>{storedPatient=v;}};
vm.runInContext(fs.readFileSync('./dist/patient-context.js','utf8'),ctx);
assert.equal(elements.kAdd.textContent,'20.0');
elements.masterWeight.value='10';elements.masterWeight.dispatchEvent(new ctx.Event('input'));
assert.equal(elements.kAdd.textContent,'10.0');assert.equal(elements.kMl1.textContent,'30.0 mL – 40.0 mL');
elements.clearPatient.dispatchEvent(new ctx.Event('click'));
assert.equal(elements.kAdd.textContent,'—');assert.ok(buttons.every(b=>b.disabled));assert.equal(elements.kMathSteps.children.length,0);
console.log('Potassium/shared-patient integration passed: restored weight, live edits, chart updates, clearing and disabled selections.');

// Use unrounded final preparation concentration for peripheral warnings.
Object.assign(elements.kWeight,{value:'20'});elements.kOther.value='0';elements.kRate.value='50';elements.kVolume.value='1000';elements.kStock.value='2';elements.kMethod.value='final';
function warningAt(c){elements.kTarget.value=String(c*50/20);vm.runInContext('updatePotassium()',ctx);}
for(const c of [.039999,.04,.059999]){warningAt(c);assert.equal(elements.kConcentration.attrs['data-monitor'],'false');assert.equal(elements.kPeripheralWarning.hidden,true);assert.equal(elements.kPeripheralMessage.textContent,'');}
warningAt(.06);assert.equal(elements.kPeripheralWarning.hidden,false);assert.equal(elements.kConcentration.attrs['data-monitor'],'true');assert.equal(elements.kPeripheralHeading.textContent,'Catheter monitoring');assert.equal(elements.kPeripheralWarning.attrs['data-level'],'near');assert.match(elements.kPeripheralMessage.textContent,/Current: 0.06 mEq\/mL/);assert.match(elements.kPeripheralMessage.textContent,/pain, redness, swelling or phlebitis/);assert.doesNotMatch(elements.kPeripheralMessage.textContent,/ABOVE|NEAR|before administration/);
warningAt(.060001);assert.equal(elements.kPeripheralWarning.attrs['data-level'],'above');
elements.kMethod.value='add';vm.runInContext('updatePotassium()',ctx);assert.equal(elements.kPeripheralWarning.attrs['data-level'],'above');
// Potassium delivered separately is not part of this bag's concentration.
elements.kOther.value='.1';elements.kTarget.value='.15';vm.runInContext('updatePotassium()',ctx);assert.equal(elements.kPeripheralWarning.hidden,true);assert.equal(elements.kConcentration.textContent,'0.02 mEq/mL');
elements.kWeight.value='';elements.kWeight.dispatchEvent({type:'input'});assert.equal(elements.kPeripheralWarning.hidden,true);assert.equal(elements.kPeripheralMessage.textContent,'');assert.equal(elements.kConcentration.textContent,'—');
console.log('Peripheral KCl warnings passed: below/at/above 0.06 mEq/mL, both preparation methods, separate K exclusion and stale-warning clearing.');

assert.match(fs.readFileSync('dist/potassium.html','utf8'),/id="kPeripheralWarning"[^>]*role="status"/);

// The shared banner rounds for readability; potassium uses its exact rate.
ctx.FluidReferenceNumbers=require('./dist/fluid-reference.js').FluidReferenceNumbers;
const exactShared=157.01578849517466;
elements.kWeight.value='20';elements.kRate.value='157.02';elements.kTarget.value='.1';elements.kOther.value='0';elements.kMethod.value='final';
ctx.FluidReferenceNumbers.values.set(elements.kRate,{display:'157.02',exact:exactShared});
vm.runInContext('updatePotassium()',ctx);
assert.match(elements.kMathSteps.children[2].textContent,/157\.0/);
assert.equal(elements.kAdd.textContent,'6.4');

// Independent final-volume examples: concentration × final volume / stock.
for (const [weight,target,flow,expected] of [[1,.05,10,.03],[10,.1,40,.15]]) {
 Object.assign(elements.kWeight,{value:String(weight)});elements.kTarget.value=String(target);
 elements.kRate.value=String(flow);elements.kVolume.value='12';elements.kStock.value='2';elements.kOther.value='0';elements.kMethod.value='final';
 vm.runInContext('updatePotassium()',ctx);
 assert.equal(Number(elements.kAdd.textContent),expected);
 const carrier=Number(elements.kDiluent.textContent.split(' ')[0]);
 const delivered=expected*2/(carrier+expected)*flow/weight;
 assert(Math.abs(Number(elements.kDelivered.textContent.split(' ')[0])-delivered)<=.005);
 assert(elements.kStatus.textContent.includes('clinician-approved dilution'));
 assert(elements.kMathSteps.children.some(x=>x.textContent.includes(ctx.ReferenceNumbers.volume(expected)+' mL')));
}
for(const value of [1e-12,.00003,.03,.15,.99999,12,1e12]) {
 const shown=Number(ctx.ReferenceNumbers.volume(value));assert(shown>0);
 if(value>=.01)assert(Math.abs(shown-value)<=(value<1?.005:.05));else assert(Math.abs(shown/value-1)<.051);
}
// A nonterminating add-on preparation verifies the displayed (not idealized) dose.
elements.kWeight.value='20';elements.kRate.value='50';elements.kVolume.value='1000';elements.kTarget.value='.1';elements.kMethod.value='add';
vm.runInContext('updatePotassium()',ctx);
assert.equal(elements.kAdd.textContent,'20.4');
const shownAdd=20.4,shownCarrier=1000;
const expectedShownDose=shownAdd*2/(shownCarrier+shownAdd)*50/20;
assert(Math.abs(Number(elements.kDelivered.textContent.split(' ')[0])-expectedShownDose)<.005);
assert.equal(elements.kDelivered.textContent,'0.10 mEq/kg/hr');
