// A small DOM simulation checks the form wiring; it does not replace browser QA.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const calculations=require('./dist/electrolyte-calc.js');
function loadPage(file){
 const html=fs.readFileSync('./dist/'+file,'utf8'),all=[],ids={};
 const camel=s=>s.replace(/-([a-z])/g,(_,x)=>x.toUpperCase());
 function attributes(raw){const out={};for(const m of raw.matchAll(/([\w-]+)(?:="([^"]*)")?/g))out[m[1]]=m[2]??'';return out;}
 function element(tag,a={}){
  const obj={tag,attrs:a,value:a.value??'',textContent:'',className:a.class??'',readOnly:'readonly'in a,disabled:false,open:'open'in a,children:[],listeners:{},dataset:{},addEventListener(name,fn){const previous=this.listeners[name];this.listeners[name]=previous?event=>{previous(event);fn(event);}:fn;},dispatchEvent(event){this.listeners[event.type]?.(event);},setAttribute(k,v){this.attrs[k]=v;},replaceChildren(...children){this.children=children;},append(...children){this.children.push(...children);},focus(){},scrollIntoView(){},checkValidity(){if(this.readOnly)return true;if(this.value==='')return !('required'in a);const n=Number(this.value);return Number.isFinite(n)&&(!('min'in a)||n>=Number(a.min))&&(!('max'in a)||n<=Number(a.max));},querySelectorAll(selector){return select(selector).filter(x=>!this.contents||this.contents.includes(x.attrs.id??x.attrs['data-lock']??'___'));}};
  for(const [k,v]of Object.entries(a))if(k.startsWith('data-'))obj.dataset[camel(k.slice(5))]=v;
  all.push(obj);if(a.id)ids[a.id]=obj;return obj;
 }
 for(const match of html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/gi))element(match[1],attributes(match[2]));
 for(const match of html.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g)){const a=attributes(match[1]),option=match[2].match(/<option[^>]*value="([^"]*)"/);ids[a.id].value=option?.[1]??'';}
 const forms=all.filter(x=>x.tag==='form');let i=0;for(const m of html.matchAll(/<form\b[^>]*>([\s\S]*?)<\/form>/g))forms[i++].contents=m[1];
 function select(selector){
  if(selector==='form[data-electrolyte]'||selector==='form')return forms;
  if(selector==='input[name="species"]'||selector==='a[href="cri-lidocaine.html"]')return [];
  if(selector.startsWith('.'))return all.filter(x=>x.className.split(' ').includes(selector.slice(1)));
  const m=selector.match(/^\[([\w-]+)(?:="([^"]*)")?\]$/);
  if(m)return all.filter(x=>m[1]in x.attrs&&(m[2]===undefined||x.attrs[m[1]]===m[2]));
  throw Error('Unsupported selector: '+selector);
 }
 for(const match of html.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g)){const a=attributes(match[1]);ids[a.id].options=[...match[2].matchAll(/<option[^>]*value="([^"]*)"/g)].map(m=>({value:m[1]}));}
 const body=all.find(x=>x.tag==='body');
 const ctx={ReferenceNumbers:require('./dist/number-format.js'),window:{matchMedia:()=>({matches:true}),innerHeight:900},...calculations,document:{body,getElementById:id=>ids[id]??null,querySelectorAll:select,querySelector:s=>select(s)[0],createElement:tag=>element(tag)},setTimeout:fn=>fn()};
 vm.createContext(ctx);vm.runInContext(fs.readFileSync('./dist/electrolyte-layout.js','utf8'),ctx);vm.runInContext(fs.readFileSync('./dist/electrolytes.js','utf8'),ctx);
 const update=()=>vm.runInContext('updatePage()',ctx);
 const fill=values=>{for(const [id,value]of Object.entries(values))ids[id].value=String(value);update();};
 const pick=(target,value)=>select('.lyte-rate').find(b=>b.dataset.target===target&&Number(b.dataset.value)===value).listeners.click();
 const text=id=>{const read=x=>x.textContent+x.children.map(read).join(' ');return read(ids[id]);};
 const share=()=>{ctx.Event=class{constructor(type){this.type=type;}};ctx.window.addEventListener=()=>{};let saved=JSON.stringify({weight:'20',species:'dog'});ctx.sessionStorage={getItem:()=>saved,setItem:(_,v)=>{saved=v;}};vm.runInContext(fs.readFileSync('./dist/patient-context.js','utf8'),ctx);};
 const patient=(weight,species)=>{if(weight!==undefined){ids.masterWeight.value=String(weight);ids.masterWeight.dispatchEvent({type:'input'});}if(species!==undefined){ids.masterSpecies.value=species;ids.masterSpecies.dispatchEvent({type:'change'});}};
 return {ids,fill,pick,text,select,update,share,patient};
}
let page=loadPage('magnesium.html');
page.fill({mWeight:4.38,mVolume:24});assert.match(page.ids.mMl0.textContent,/1\.095 mL/);
page.pick('mDose',1);assert.equal(page.ids.mResultMath.open,false);assert.match(page.text('mResult'),/1\.095 mL/);
page.fill({mHours:12});assert.match(page.text('mResultSteps'),/0\.548/);
// Pump edits preserve unrounded duration for dose calculations.
page.fill({mVolume:250,mHours:24});assert.equal(Number(page.ids.mPump.value),Number((250/24).toPrecision(12)));
page.ids.mPump.value='3';page.ids.mPump.listeners.input();page.update();
assert.equal(Number(page.ids.mHours.value),Number((250/3).toPrecision(12)));
assert.match(page.text('mResultSteps'),/3\.802/);
page.fill({mVolume:500});assert.equal(Number(page.ids.mPump.value),6);
page.ids.mHours.value='10';page.ids.mHours.listeners.input();page.update();assert.equal(Number(page.ids.mPump.value),50);
for(const invalid of ['', '0', '-1']){
 page.ids.mPump.value=invalid;page.ids.mPump.listeners.input();page.update();
 assert.equal(page.ids.mHours.value,'');assert.ok(page.select('.lyte-rate').every(b=>b.disabled));
}
page.fill({mVolume:24,mHours:12});
page.fill({mBloodwork:1.2});assert.match(page.ids.mInterpretation.textContent,/LOW/);assert.equal(page.ids.mContext0.attrs['data-context-match'],'true');
page.fill({mBloodwork:2,mRefractory:'yes'});assert.match(page.ids.mInterpretation.textContent,/0.5/);assert.equal(page.ids.mContext1.attrs['data-context-match'],'true');
page.fill({mBloodwork:3});assert.ok(page.select('.lyte-rate').every(b=>b.disabled));assert.equal(page.ids.mResultMath.open,false);
page.fill({mBloodwork:'',mRefractory:'unknown'});
let button=page.select('[data-lock]')[0];button.listeners.click();assert.equal(page.ids.mStock.readOnly,false);
page.ids.mStock.value='0';button.listeners.click();assert.equal(page.ids.mStock.readOnly,false);
page.ids.mStock.value='4.06';button.listeners.click();assert.equal(page.ids.mStock.readOnly,true);
page.fill({mWeight:''});assert.equal(page.ids.mResultMath.open,false);assert.ok(page.select('.lyte-rate').every(b=>b.disabled));
page=loadPage('phosphate.html');page.fill({pWeight:10,pRate:40,pVolume:1000});
page.pick('pDose',.06);assert.match(page.text('pResult'),/0.088 mEq\/kg\/hr/);assert.equal(page.ids.pKRateHero.textContent,'0.088');assert.equal(page.ids.pKHourlyHero.textContent,'0.880');assert.equal(page.ids.pKAmountHero.textContent,'22.0');
page.fill({pKStock:2});assert.match(page.text('pResult'),/0.040 mEq\/kg\/hr/);
page.fill({pOtherK:.6});assert.ok(page.select('.lyte-rate').every(b=>b.disabled));assert.match(page.text('pResult'),/exceeds/);assert.equal(page.ids.pResultMath.open,false);assert.equal(page.ids.pKRateHero.textContent,'—');
page=loadPage('dextrose.html');page.fill({dVolume:1000});assert.equal(page.ids.dMl1.textContent,'50.00 mL');
page.pick('dTarget',2.5);assert.match(page.text('dResult'),/50\.00 mL/);assert.equal(page.ids.dResultMath.open,false);
page.fill({dStock:1,dBase:5});assert.ok(page.select('.lyte-rate').every(b=>b.disabled));assert.equal(page.ids.dResultMath.open,false);
page=loadPage('sodium.html');page.fill({nWeight:.47,nCurrent:177,nGoal:165});assert.match(page.text('nWater'),/0.85 mL\/hr/);
page.fill({nGoal:177});assert.doesNotMatch(page.text('nWaterSteps'),/NaN|Infinity/);assert.match(page.text('nWaterSteps'),/no free-water deficit/);
page.fill({nVolume:1000,nFluidGoal:115,nPreset:'0'});page.ids.nPreset.listeners.change();assert.equal(page.ids.nStock.value,'0');assert.match(page.ids.nCardStockLabel0.textContent,/Sodium-free replacement/);page.select('[data-base="130"]')[0].listeners.click();assert.match(page.text('nMix'),/115\.385 mL/);
page.fill({qVolumeA:900,qVolumeB:100});assert.match(page.text('nQuick'),/117.0 mEq\/L/);
page.fill({gNa:154,gGlucose:504,gSpecies:'cat'});assert.match(page.text('nGlucose'),/160.5 mEq\/L/);assert.match(page.text('nGlucose'),/extrapolation/);
page.select('[data-path="hypo"]')[0].listeners.click();assert.equal(page.ids.hypoWorkflow.hidden,false);assert.equal(page.ids.hyperWorkflow.hidden,true);
page.fill({nWeight:10,nCurrent:115,nFluidGoal:140,nStock:1232,nPreset:'1232'});assert.equal(page.ids.nCardStockLabel0.textContent,'7.2% NaCl TO ADD TO LRS');assert.equal(page.ids.nCardStockLabel1.textContent,'7.2% NaCl TO ADD TO Plasma-Lyte');assert.match(page.ids.nCardNote0.textContent,/of 7.2% NaCl/);page.select('[data-base="130"]')[0].listeners.click();page.fill({hFluidK:0,hRate:25,hHours:24});assert.match(page.text('hResponse'),/2.14 mEq\/L/);
page.ids.nFluidGoal.value='145';page.ids.nFluidGoal.listeners.input();assert.equal(page.ids.hFluidK.value,'');assert.equal(page.ids.hResponseMath.open,false);
page.fill({nFluidGoal:135});assert.equal(page.select('[data-base="140"]')[0].disabled,true);assert.equal(page.select('[data-base="130"]')[0].disabled,false);
console.log('Passed simulated UI: all four pages, live dose choices, worked math, stock locking, invalid-state clearing, K contribution, sodium presets, equal-target state, and feline source caveat.');

// Integration: restored/shared patient updates must reach calculations without
// manually calling updatePage or editing another preparation field.
page=loadPage('magnesium.html');page.fill({mVolume:24,mDose:1});page.share();
assert.equal(page.ids.mMl0.textContent,'5.00 mL');page.patient(10);assert.equal(page.ids.mMl0.textContent,'2.50 mL');
assert.match(page.text('mResult'),/2\.50 mL/);page.patient('');assert.equal(page.ids.mMl0.textContent,'— mL');assert.doesNotMatch(page.text('mResult'),/2\.50 mL/);
page=loadPage('phosphate.html');page.fill({pRate:40,pVolume:1000,pDose:.06});page.share();
assert.equal(page.ids.pKHourlyHero.textContent,'1.760');page.patient(10);assert.equal(page.ids.pKHourlyHero.textContent,'0.880');
page.patient('');assert.equal(page.ids.pKHourlyHero.textContent,'—');assert.ok(page.select('.lyte-rate').every(b=>b.disabled));
page=loadPage('sodium.html');page.fill({nCurrent:177,nGoal:165,gNa:154,gGlucose:504});page.share();
assert.match(page.text('nWater'),/36.36 mL\/hr/);page.patient(10);assert.match(page.text('nWater'),/18.18 mL\/hr/);
page.patient(undefined,'cat');assert.match(page.text('nGlucose'),/extrapolation/);
page.patient('');assert.doesNotMatch(page.text('nWater'),/18.18/);
console.log('Electrolyte/shared-patient integration passed: session restoration, live weight edits, species caveat and cleared results.');
