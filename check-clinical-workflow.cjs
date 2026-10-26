const assert=require('node:assert/strict'),fs=require('node:fs');
const Drug=require('./dist/drug-calc.js'),catalog=require('./dist/drug-data.js');
const K=require('./dist/concurrent-potassium.js');
for(const [id,low,high] of [['lidocaine',2,4],['bupivacaine',1,2]]){
 const drug=catalog.find(d=>d.id===id);
 for(const dose of [low,high])assert.equal(Drug.referenceCheck(drug,dose,'mg/kg per dose').outside,false);
 for(const dose of [low/2,high+1])assert.equal(Drug.referenceCheck(drug,dose,'mg/kg per dose').outside,true);
 assert.equal(Drug.referenceCheck(drug,high*1000,'mcg/kg per dose').outside,false);
 assert(Drug.single(10,high+1,'mg/kg per dose',drug.stock).ml>0,'Advisory warnings preserve clinician customization');
}
assert.deepEqual(Drug.localExposure({weight:10,lidocaineMg:20,bupivacaineMg:10,priorLidocaineMg:5,priorBupivacaineMg:2}),{lidocaine:2.5,bupivacaine:1.2,combined:true});
assert.throws(()=>Drug.localExposure({weight:10,lidocaineMg:20,bupivacaineMg:10,priorLidocaineMg:NaN,priorBupivacaineMg:0}));
const records={kcl:{valid:true,rate:.2,other:.044},phosphate:{valid:true,rate:.044,other:.2}};
let r=K.summarize(records,{kcl:true,phosphate:true},'separate',true);
assert.equal(r.complete,true);assert(Math.abs(r.total-.244)<1e-12);assert.equal(r.contributions.length,2);assert.equal(r.caution,false);
assert.equal(K.summarize(records,{},'separate',true).total,undefined);
assert.equal(K.summarize(records,{kcl:true,phosphate:true},'same',true).complete,false);
assert.equal(K.summarize(records,{kcl:true,phosphate:true},'separate',false).complete,false);
assert.equal(K.summarize({...records,kcl:{...records.kcl,other:.1}},{kcl:true,phosphate:true},'separate',true).complete,false);
assert.equal(K.summarize({...records,kcl:{valid:false}},{kcl:true,phosphate:true},'separate',true).total,undefined);
r=K.summarize({kcl:{valid:true,rate:.48,other:0},phosphate:{valid:true,rate:.044,other:0}},{kcl:true,phosphate:true},'separate',true);assert.equal(r.caution,true);assert(Math.abs(r.total-.524)<1e-12);
// Preserve the newer, clinician-confirmed insulin protocol. No BG selector exists.
const insulin=fs.readFileSync('dist/cri-insulin.html','utf8');
for(const label of ['≥270','180 to &lt;270','100 to &lt;180','&lt;100'])assert(insulin.includes(label));
assert.equal((insulin.match(/Exactly 200 mg\/dL/g)||[]).length,2);assert(insulin.includes('Clinician choice required: select 2.5% or 5%.'));assert(insulin.includes('180–270 mg/dL'));
assert(fs.readFileSync('scripts/insulin-bg-reference.html','utf8').includes('180 to &lt;270'));
console.log('Clinical workflow checks passed: existing local references, advisory customization, unit conversion, prior exposure, explicit K inclusion, duplicate prevention, incomplete totals, existing K threshold and preserved newer insulin chart.');
// Human-facing precision is bounded, without turning small positive doses into zero.
const Numbers=require('./dist/number-format.js');
for(const [value,expected] of [[20.408163,'20.4'],[.099999999,'0.10'],[.03,'0.03'],[.15,'0.15'],[12,'12.0'],[1.095,'1.1'],[.00003,'3.0e-5']]) {
 assert.equal(Numbers.display(value),expected);
 assert.equal(Numbers.volume(value),expected);
}
for(const value of [.00003,.0015,.005,.03,.15,1.095,20.408163,1000]) {
 const shown=Numbers.volume(value);assert(Number(shown)>0);
 const mantissa=shown.split('e')[0];assert(new RegExp('^\\d+\\.\\d{'+(Math.abs(value)<1&&!shown.includes('e')?2:1)+'}$').test(mantissa),shown);
}

for(const [value,expected] of [[0,'0.00'],[-.15,'-0.15'],[-12.34,'-12.3'],[.999,'1.00'],[1,'1.0']])assert.equal(Numbers.display(value),expected);
// Generated input labels can be short without becoming the next calculation's inputs.
const linkedField={value:''};Numbers.write(linkedField,1/3);
assert.equal(linkedField.value,'0.33');assert.equal(Numbers.read(linkedField),1/3);
linkedField.value='0.34';assert.equal(Numbers.read(linkedField),.34);
Numbers.write(linkedField,1/3);Numbers.forget(linkedField);assert.equal(Numbers.read(linkedField),.33);
