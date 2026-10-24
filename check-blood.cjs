const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {bloodPlan,cageSheetMarkup,cageSheetDocument,bloodCSV}=require('./dist/blood-calc.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10);
const input={weight:1.23,volumePerKg:60,reductionPercent:15,dayPercent:1,fortnightPercent:10};
const r=bloodPlan(input);near(r.estimated,62.73);near(r.day,.6273);near(r.fortnight,6.273);
near(bloodPlan({...input,reductionPercent:0}).estimated,73.8);
for(const change of [{weight:0},{weight:-1},{reductionPercent:100},{volumePerKg:0},{dayPercent:-1},{fortnightPercent:101},{weight:Infinity}])assert.throws(()=>bloodPlan({...input,...change}));
const p={...input,patient:'<script>alert(1)</script>',record:'A"42',species:'Feline',start:'2026-10-17',clinician:'Dr Example',approvedDay:'',approvedFortnight:''};
const markup=cageSheetMarkup(p,r);
assert.equal((markup.match(/<tr>/g)||[]).length,17);assert.ok(markup.includes('0.63 mL'));assert.ok(markup.includes('6.27 mL'));assert.ok(!markup.includes('<script>'));assert.ok(markup.includes('&lt;script&gt;'));
assert.match(markup,/mL \/ 24 hr/);assert.match(markup,/mL \/ 14 days/);assert.match(markup,/Both time windows/);
assert.ok(cageSheetDocument(p,r).includes('window.print()'));
assert.match(cageSheetMarkup({},null),/________ mL/);
assert.match(bloodCSV({...p,patient:'=SUM(1,2)'},r),/"'=SUM\(1,2\)"/);assert.match(bloodCSV(p,r),/A""42/);

const html=fs.readFileSync('./dist/blood-collection.html','utf8'),elements={};
const attrs=raw=>Object.fromEntries([...raw.matchAll(/([\w-]+)(?:="([^"]*)")?/g)].map(m=>[m[1],m[2]??'']));
let downloads=0,printed='';
function element(a={}){return {value:a.value??'',textContent:'',disabled:'disabled'in a,readOnly:'readonly'in a,listeners:{},srcdoc:'',addEventListener(name,fn){const previous=this.listeners[name];this.listeners[name]=previous?event=>{previous(event);fn(event);}:fn;},dispatchEvent(event){this.listeners[event.type]?.(event);},focus(){},click(){downloads++;},checkValidity(){if(this.readOnly)return true;if(this.value==='')return !('required'in a);const n=Number(this.value);return Number.isFinite(n)&&(!('min'in a)||n>=Number(a.min))&&(!('max'in a)||n<=Number(a.max));}};}
for(const match of html.matchAll(/<[a-z][\w-]*\b([^>]*)>/gi)){const a=attrs(match[1]);if(a.id)elements[a.id]=element(a);}
for(const match of html.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/g)){const a=attrs(match[1]);elements[a.id].value=match[2].match(/<option[^>]*value="([^"]*)"/)[1];}
const ctx={document:{getElementById:id=>elements[id],createElement:()=>element()},bloodPlan,cageSheetDocument,bloodCSV,bloodFormat:n=>n.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2}),Date,Blob,URL:{createObjectURL:()=> 'blob:test',revokeObjectURL(){}},window:{open:()=>({opener:{},document:{open(){},write(value){printed=value;},close(){}}})},setTimeout:fn=>fn()};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('./dist/blood-collection.js','utf8'),ctx);
assert.equal(elements.bPrint.disabled,true);assert.match(elements.bPreview.srcdoc,/________ mL/);
elements.bWeight.value='1.23';elements.bPatient.value='Tiny';vm.runInContext('updateBlood()',ctx);
assert.equal(elements.bTotal.textContent,'62.73');assert.equal(elements.bPrint.disabled,false);assert.match(elements.bPreview.srcdoc,/Tiny/);
elements.bPrint.listeners.click();assert.match(printed,/0.63 mL/);assert.match(printed,/Clinician-approved plan/);assert.equal((printed.match(/<tr>/g)||[]).length,17);
elements.bCSV.listeners.click();elements.bDownload.listeners.click();assert.equal(downloads,2);
elements.bContext.value='baseline';vm.runInContext('updateBlood()',ctx);assert.equal(elements.bTotal.textContent,'73.80');
elements.bAssumptionsToggle.listeners.click();assert.equal(elements.bVolumePerKg.readOnly,false);
elements.bVolumePerKg.value='0';elements.bAssumptionsToggle.listeners.click();assert.equal(elements.bVolumePerKg.readOnly,false);
elements.bVolumePerKg.value='60';elements.bAssumptionsToggle.listeners.click();assert.equal(elements.bVolumePerKg.readOnly,true);
elements.bWeight.value='';vm.runInContext('updateBlood()',ctx);assert.equal(elements.bPrint.disabled,true);assert.equal(elements.bCSV.disabled,true);assert.doesNotMatch(elements.bPreview.srcdoc,/62.73 mL/);
console.log('Passed: workbook examples, baseline/adjusted plans, invalid inputs, escaped print HTML, CSV safety, 16 blank rows, live preview, exports, stock-style assumption locking, and stale-result clearing (simulated DOM).');
// Independent examples displayed in the reference comparison.
near(bloodPlan({weight:20}).estimated,1020);
near(bloodPlan({weight:20,reductionPercent:0}).day,12);
near(bloodPlan({weight:20,volumePerKg:85,reductionPercent:0}).day,17);
near(bloodPlan({weight:20,volumePerKg:85,reductionPercent:0}).fortnight,170);
assert.ok(html.indexOf('id="bPrint"')<html.indexOf('class="panel blood-patient"'));
assert.match(html,/Healthy \/ baseline — 60 mL\/kg, no reduction/);
assert.match(html,/<details class="panel"><summary>Cage-sheet preview/);
assert.match(html,/3–4-week recovery/);

// Run the real shared-patient controller with the real blood controller.
// Hidden patient fields are outside bloodForm after the compact layout change.
elements.bContext.value='adjusted';elements.bReduction.value='15';elements.bVolumePerKg.value='60';
elements.masterSpecies.options=['','dog','cat'].map(value=>({value}));
elements.bSpecies.options=['Canine','Feline','Other'].map(value=>({value}));
ctx.document.querySelectorAll=()=>[];
ctx.window.addEventListener=()=>{};
ctx.Event=class{constructor(type){this.type=type;}};
let savedPatient=JSON.stringify({weight:'20',species:'dog'});
ctx.sessionStorage={getItem:()=>savedPatient,setItem:(_,value)=>{savedPatient=value;}};
vm.runInContext(fs.readFileSync('./dist/patient-context.js','utf8'),ctx);
assert.equal(elements.bWeight.value,'20');assert.equal(elements.bSpecies.value,'Canine');
assert.equal(elements.bTotal.textContent,'1,020.00');assert.equal(elements.bDay.textContent,'10.20');assert.equal(elements.bFortnight.textContent,'102.00');
assert.equal(elements.bPrint.disabled,false);assert.match(elements.bPreview.srcdoc,/reduced 15%/);
elements.masterWeight.value='5';elements.masterWeight.dispatchEvent(new ctx.Event('input'));
assert.equal(elements.bTotal.textContent,'255.00');assert.equal(elements.bDay.textContent,'2.55');
elements.masterSpecies.value='cat';elements.masterSpecies.dispatchEvent(new ctx.Event('change'));
assert.equal(elements.bSpecies.value,'Feline');assert.match(elements.bPreview.srcdoc,/Feline/);
elements.clearPatient.dispatchEvent(new ctx.Event('click'));assert.equal(elements.bPrint.disabled,true);assert.equal(elements.bDay.textContent,'—');
console.log('Blood/shared-patient integration passed: initial session restore, adjusted default, banner edits, species, print enablement and clearing without manual recalculation.');
