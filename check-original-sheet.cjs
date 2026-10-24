const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const run=require('./dist/original-sheet-calc.js');
const api={...require('./dist/calc.js'),...require('./dist/electrolyte-calc.js'),...require('./dist/blood-calc.js'),CriCalc:require('./dist/cri-calc.js')};
const near=(a,b)=>assert(Math.abs(a-b)<1e-8,`${a} != ${b}`);
const v={species:'Dog',weight:6.2,dogDehydration:5,dogLosses:0,dogBolus:0,catDehydration:3,catLosses:0,catBolus:0,kVolume:96,kRate:12,kStock:2,otherK:0,includePhos:false,mgStock:4,phosStock:3,phosKStock:4.4,phosDose:.01,phosRate:17,phosVolume:100,naCurrent:177,naTarget:165,waterHours:24,naVolume:1000,naMixTarget:140,hypoVolume:1000,hypoTarget:115,glucoseNa:154,glucose:504,dextroseVolume:450,neStock:1000,neDose:.05,neHours:4,neAccess:'central'};
let r=run(v,api);assert.deepEqual(Object.keys(r.errors).sort(),['cat','na40']);
near(r.values.U6,12.4);near(r.values.T7,7.44);near(r.values.S17,1.55);near(r.values.S19,.775);near(r.values.G27,24);near(r.values.H36,10000/1102);near(r.values.G50,6.464);near(r.values.H52,160.464);near(r.values.Q40,22.5);near(r.values.S40,427.5);near(r.values.Q41,45);near(r.values.M48,316.2);near(r.values.M49,3.162);near(r.values.N58,18.6);near(r.values.S58,.0744);near(r.values.T58,3.9256);assert(!('F20' in r.values));
// Regression: changing deficit time must not double maintenance/ongoing losses.
near(r.values.F11-r.values.F10,310/24);
for(const species of ['Dog','Cat'])for(const weight of [.5,5,20]){
 const t={...v,species,weight};const out=run(t,api);const prefix=species==='Dog'?'dog':'cat';
 const plan=api.calculate({species:species.toLowerCase(),weight,dehydration:t[prefix+'Dehydration'],hours:24,losses:t[prefix+'Losses'],bolus:t[prefix+'Bolus'],mode:'initial'});
 near(out.values[species==='Dog'?'F10':'F20'],plan.total);
 const delivered=out.values.U6*2/96*12/weight;near(delivered,.5);
 near(out.values.R25*3/100*17/weight,.01);near(out.values.R28,.01*4.4/3);
}
r=run({...v,includePhos:true},api);near(r.values.U6*2/96*12/v.weight+r.values.R28,.5);
r=run({...v,phosRate:0,includePhos:true},api);assert(r.errors.phosphate&&r.errors.potassium);assert(!('R25'in r.values));assert(!('U6'in r.values));assert('F10'in r.values);
r=run({...v,neAccess:'peripheral'},api);assert(r.errors.norepi);assert(!('S58'in r.values));
r=run({...v,kStock:0},api);assert(r.errors.kU6);assert(!('U6'in r.values));
r=run({...v,weight:NaN},api);assert.equal(Object.keys(r.values).length,0);
r=run({...v,species:''},api);assert(!('F10'in r.values));assert(!('U6'in r.values));
r=run({...v,waterHours:1},api);assert(r.errors.water);assert(!('G26'in r.values));
// Exercise the actual DOM controller, including shared inputs, locks, conversion outputs and clear.
const html=fs.readFileSync('dist/original-sheet.html','utf8'),els={};
function el(id,value=''){return els[id]={id,value,textContent:'',checked:false,readOnly:false,attrs:{},listeners:{},style:{},children:[],clientWidth:900,offsetWidth:1800,addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)},fire(type){for(const fn of this.listeners[type]??[])fn()},setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]??null},removeAttribute(k){delete this.attrs[k]},replaceChildren(...a){this.children=a}};}
for(const m of html.matchAll(/<[^>]+id="([^"]+)"[^>]*>/g)){const node=el(m[1],m[0].match(/value="([^"]*)"/)?.[1]||'');node.readOnly=/ readonly/.test(m[0]);node.checked=/ checked/.test(m[0]);}
el('clearPatient');els.species.value='Dog';els.weight.value='6.2';els['os-neAccess'].value='central';
const stocks=['kStock','mgStock','phosStock','phosKStock','neStock'].map(k=>els['os-'+k]),outs=Object.values(els).filter(n=>n.id.startsWith('os-out-'));
els['os-grid'].querySelectorAll=selector=>selector==='output'?outs:selector==='[data-stock]'?stocks:[];
const context={...api,ReferenceNumbers:require('./dist/number-format.js'),originalSheetCalculate:run,document:{getElementById:id=>els[id],createElement:()=>el('note'+Math.random())},window:{addEventListener(){}}};
vm.runInNewContext(fs.readFileSync('dist/original-sheet.js','utf8'),context);
assert.equal(els['os-out-U6'].textContent,'12.4');assert.equal(els['os-fit'].checked,false);assert.equal(els['os-grid'].style.zoom,'1');els['os-fit'].checked=true;els['os-fit'].fire('change');assert.equal(els['os-grid'].style.zoom,'0.5');
els['os-stocks'].fire('click');assert(stocks.every(n=>!n.readOnly));els['os-stocks'].fire('click');assert(stocks.every(n=>n.readOnly));
els.species.value='Cat';els.species.fire('input');assert.equal(els['os-out-F10'].textContent,'—');assert.notEqual(els['os-out-F20'].textContent,'—');
els.weight.value='';els.weight.fire('input');assert(outs.every(n=>n.textContent==='—'));
els['os-phosRate'].value='0';els.clearPatient.fire('click');assert.equal(els['os-phosRate'].value,'17');assert(stocks.every(n=>n.readOnly));
console.log('Original Sheet passed: independent workbook examples, shared calculator agreement, species selection, KPhos/KCl balance, sodium invalid targets, norepi guardrails, dextrose/blood totals, stale-output clearing, stock locks and fit control.');
