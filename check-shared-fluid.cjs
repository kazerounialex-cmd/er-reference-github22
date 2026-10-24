const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {calculate}=require('./dist/calc.js');
const code=fs.readFileSync('dist/fluid-reference.js','utf8');
const mathContext={module:{exports:{}},calculate};vm.runInNewContext(code,mathContext);
const {fluidReferenceResult,FluidReferenceNumbers}=mathContext.module.exports;
assert.equal(FluidReferenceNumbers.display(.0001),'0.0001');
assert.equal(FluidReferenceNumbers.display(157.015788),'157.02');
const inputs={dehydration:'8',hours:'12',losses:'5',bolus:'400'},patient={weight:20,species:'dog'};
const state={inputs,override:null};
const expected=(132*20**.75)/24+1200/12+5;
let r=fluidReferenceResult(state,patient);assert.equal(r.rate,expected);assert.equal(r.volume,expected*12);assert.equal(r.plan.remaining,1200);
assert.equal(fluidReferenceResult({...state,override:'50'},patient).volume,600);
for(const override of ['', '0','-1','NaN','Infinity'])assert.equal(fluidReferenceResult({...state,override},patient).rate,null);
assert.equal(fluidReferenceResult(state,{...patient,weight:0}).rate,null);
assert.equal(fluidReferenceResult(state,{...patient,species:''}).rate,null);
assert.equal(fluidReferenceResult({...state,inputs:{...inputs,dehydration:''}},patient).rate,null);
assert.equal(fluidReferenceResult({...state,inputs:{...inputs,dehydration:''},override:'50'},patient).rate,50);
assert.equal(fluidReferenceResult({...state,inputs:{...inputs,hours:'1e308'},override:'1e308'},patient).rate,null);
// Session and DOM behavior use the real controller, not a duplicate linking implementation.
const storage={};
function page(kind){
 const ids={},forms=[],windowEvents={};
 function el(id,value=''){const e={id,value,textContent:'',disabled:false,attrs:{},listeners:{},addEventListener(t,f){(this.listeners[t]??=[]).push(f);},dispatchEvent(event){for(const f of this.listeners[event.type]??[])f(event);if(this.parent)this.parent.dispatchEvent(event);},setAttribute(k,v){this.attrs[k]=v;}};if(id)ids[id]=e;return e;}
 for(const id of ['sharedFluidRate','sharedFluidStatus','sharedFluidBreakdown','sharedFluidAmounts','useCalculatedFluid','masterWeight','masterSpecies','clearPatient'])el(id);
 ids.masterWeight.value='20';ids.masterSpecies.value='dog';
 if(kind==='planner'){
  const form=el('planner');forms.push(form);
  for(const [id,value] of Object.entries({dehydration:'',hours:'24',losses:'0',bolus:'0'})){el(id,value).parent=form;}
 }
 if(kind==='k'||kind==='p'){const id=kind+'Rate';el(id);el(id+'LinkStatus');el(id+'UseShared');}
 // Detect accidental linking of separate infusion rates.
 el('mPump','7');el('prepPump','3');
 const ctx={calculate,ReferenceNumbers:require('./dist/number-format.js'),document:{getElementById:id=>ids[id]??null,querySelectorAll:()=>forms,activeElement:null},sessionStorage:{getItem:k=>storage[k]??null,setItem:(k,v)=>storage[k]=v},Event:class{constructor(type){this.type=type;}},window:{addEventListener(t,f){windowEvents[t]=f;}},setTimeout:f=>f()};
 vm.createContext(ctx);vm.runInContext(code,ctx);
 return {ids,exact(id){return vm.runInContext(`FluidReferenceNumbers.value(document.getElementById('${id}'))`,ctx);},input(id,value){ids[id].value=String(value);ids[id].dispatchEvent({type:'input'});},click(id){ids[id].dispatchEvent({type:'click'});},pageshow(){windowEvents.pageshow();}};
}
let p=page('planner');p.input('dehydration',8);p.input('hours',12);p.input('bolus',400);p.input('losses',5);
assert.equal(Number(p.ids.sharedFluidRate.value),Number(expected.toFixed(2)));
p=page('k');assert.equal(Number(p.ids.kRate.value),Number(expected.toFixed(2)));assert.equal(p.exact('kRate'),expected);assert.equal(p.ids.kRate.attrs['data-fluid-linked'],'true');
p.input('kRate','25');p.input('sharedFluidRate','60');assert.equal(p.ids.kRate.value,'25');assert.match(p.ids.kRateLinkStatus.textContent,/Local override/);
p=page('k');assert.equal(p.ids.kRate.value,'25');p.click('kRateUseShared');assert.equal(p.ids.kRate.value,'60');
p=page('p');assert.equal(p.ids.pRate.value,'60');p.input('sharedFluidRate','80');assert.equal(p.ids.pRate.value,'80');
p.input('sharedFluidRate','');assert.equal(p.ids.pRate.value,'');assert.equal(p.ids.pRateUseShared.disabled,true);
p.input('sharedFluidRate','0');assert.equal(p.ids.pRate.value,'');
p.click('useCalculatedFluid');assert.equal(Number(p.ids.pRate.value),Number(expected.toFixed(2)));assert.equal(p.exact('pRate'),expected);
p.input('masterWeight','10');const changed=(132*10**.75)/24+400/12+5;assert.equal(Number(p.ids.pRate.value),Number(changed.toFixed(2)));assert.equal(p.exact('pRate'),changed);
p=page('planner');assert.equal(p.ids.dehydration.value,'8');assert.equal(p.ids.hours.value,'12');assert.equal(p.ids.bolus.value,'400');
p.input('sharedFluidRate','70');p.input('losses','6');assert.equal(p.ids.sharedFluidRate.value,'70');assert.match(p.ids.sharedFluidStatus.textContent,/Manual/);
p.click('clearPatient');assert.equal(p.ids.dehydration.value,'');assert.equal(p.ids.sharedFluidRate.value,'');
p=page('k');assert.equal(p.ids.kRate.value,'');assert.equal(p.ids.mPump.value,'7');assert.equal(p.ids.prepPump.value,'3');
for(const file of fs.readdirSync('dist').filter(f=>f.endsWith('.html'))){const html=fs.readFileSync('dist/'+file,'utf8');assert.equal((html.match(/id="sharedFluidRate"/g)||[]).length,1,file);assert.equal((html.match(/src="calc.js"/g)||[]).length,1,file);assert.ok(html.indexOf('src="fluid-reference.js"')>html.indexOf('src="patient-context.js"'),file);}
console.log('Shared fluid reference passed: unrounded arithmetic, volume/duration, restored planner inputs, cross-page links, persistent local overrides, relinking, invalid/zero rates, patient changes and clearing; separate infusion rates untouched.');
