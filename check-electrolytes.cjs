const assert=require('node:assert/strict');
const {mixFinal,mixVolumes,magnesium,phosphate,freeWater,correctedSodium}=require('./dist/electrolyte-calc.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
// Magnesium: daily dose is not compressed into a shorter preparation.
const m={weight:4.38,dailyDose:1,hours:24,stock:4,volume:24};
let r=magnesium(m);near(r.additive,1.095);near(r.delivered,1);
let half=magnesium({...m,hours:12});near(half.amount,r.amount/2);near(half.hourlyDose,r.hourlyDose);near(half.delivered,1);
near(magnesium({...m,dailyDose:.5}).additive,.5475);
near(magnesium({...m,stock:4.06}).additive,4.38/4.06);
assert.throws(()=>magnesium({...m,volume:1}));assert.throws(()=>magnesium({...m,hours:0}));assert.throws(()=>magnesium({...m,dailyDose:2}));
// Phosphate: verify independent phosphate delivery and editable potassium contribution.
const p={weight:10,dose:.1,fluidRate:40,volume:1000,phosStock:3,kStock:4.4,otherK:0,method:'final'};
r=phosphate(p);near(r.additive,25/3);near(r.phosphateAmount,25);near(r.kRate,.1*4.4/3);near(r.delivered,.1);
near(phosphate({...p,kStock:2}).kRate,.1*2/3);
for(const method of ['final','add'])for(const weight of [.5,5,30])for(const dose of [.01,.02,.03,.06,.12]){
 const pp={...p,method,weight,dose},out=phosphate(pp);
 const infusedStock=out.additive*(pp.fluidRate*6/out.finalVolume);
 near(infusedStock*pp.phosStock/pp.weight/6,dose);
 near(infusedStock*pp.kStock/pp.weight/6,out.kRate);
 near(out.carrier+out.additive,out.finalVolume);
}
assert.throws(()=>phosphate({...p,otherK:.4}));assert.throws(()=>phosphate({...p,dose:.13}));assert.throws(()=>phosphate({...p,phosStock:.001}));
// Dextrose: AAHA 1-L final-volume examples, and baseline-containing carrier.
for(const [target,expected] of [[1.25,25],[2.5,50],[5,100]])near(mixFinal({volume:1000,target,base:0,stock:50}).additive,expected);
near(mixFinal({volume:450,target:2.5,base:0,stock:50}).carrier,427.5);
near(mixFinal({volume:1000,target:5,base:2.5,stock:50}).verified,5);
// Sodium: weighted concentration and target mixing, including original workbook examples.
near(mixFinal({volume:1000,target:140,base:130,stock:1232}).additive,9.074410163339382);
near(mixFinal({volume:1000,target:115,base:130,stock:0}).additive,115.38461538461539);
near(mixVolumes({volumeA:900,concentrationA:130,volumeB:100,concentrationB:0}).concentration,117);
near(mixVolumes({volumeA:800,concentrationA:130,volumeB:200,concentrationB:0}).concentration,104);
for(const base of [0,130,154])for(const stock of [0,140,1232])for(const fraction of [0,.25,.5,1]){
 const target=base+(stock-base)*fraction,out=mixFinal({volume:1000,target,base,stock});
 near(out.verified,target);near(out.carrier+out.additive,1000);
}
assert.throws(()=>mixFinal({volume:1000,target:140,base:154,stock:1232}));
assert.throws(()=>mixFinal({volume:1000,target:140,base:130,stock:130}));
near(mixFinal({volume:1000,target:130,base:130,stock:130}).additive,0);
assert.throws(()=>mixVolumes({volumeA:0,volumeB:0,concentrationA:130,concentrationB:0}));
// Free-water planning: chronic versus acute and zero-deficit boundary.
const n={weight:.47,current:177,target:165,type:'chronic',customHours:null};
r=freeWater(n);near(r.liters,.0205090909090909);near(r.hours,24);near(r.mlPerHour,.8545454545454545);
near(freeWater({...n,type:'acute'}).hours,12);
assert.throws(()=>freeWater({...n,customHours:12}));
near(freeWater({...n,customHours:48}).correction,.25);
r=freeWater({...n,target:177});near(r.liters,0);near(r.hours,0);near(r.mlPerHour,0);
assert.throws(()=>freeWater({...n,target:180}));assert.throws(()=>freeWater({...n,customHours:0}));
near(correctedSodium({sodium:154,glucose:504}).corrected,160.464);
near(correctedSodium({sodium:140,glucose:100}).corrected,140);
assert.throws(()=>correctedSodium({sodium:140,glucose:80}));
for(const value of [NaN,Infinity])assert.throws(()=>magnesium({...m,weight:value}));
assert.throws(()=>magnesium({...m,weight:1e308,hours:1e308}));
console.log('Passed: Mg daily-dose timing, editable stocks, phosphate and K mass balance, dextrose examples, sodium mixing, correction contexts, zero-deficit handling, and invalid inputs.');

const {magnesiumContext,sodiumResponse}=require('./dist/electrolyte-calc.js');
assert.deepEqual(magnesiumContext({value:1.2,lower:1.5,upper:2.5,refractory:false}),{band:'low',workbookDose:1});
assert.deepEqual(magnesiumContext({value:2,lower:1.5,upper:2.5,refractory:true}),{band:'within',workbookDose:.5});
assert.equal(magnesiumContext({value:2,lower:1.5,upper:2.5,refractory:false}).workbookDose,null);
assert.equal(magnesiumContext({value:3,lower:1.5,upper:2.5,refractory:true}).band,'high');
assert.equal(magnesiumContext({value:1.5,lower:1.5,upper:2.5,refractory:false}).band,'within');
assert.equal(magnesiumContext({value:2.5,lower:1.5,upper:2.5,refractory:false}).band,'within');
assert.equal(magnesiumContext({value:1.5,lower:1.8,upper:2.8,refractory:false}).band,'low');
assert.throws(()=>magnesiumContext({value:2,lower:3,upper:2,refractory:false}));
const response={weight:10,patientNa:115,fluidNa:140,fluidK:0,rate:25,hours:24};
near(sodiumResponse(response).change,25/7*.6);
near(sodiumResponse({...response,fluidK:5}).change,30/7*.6);
near(sodiumResponse({...response,hours:12}).change,sodiumResponse(response).change/2);
assert.ok(sodiumResponse({...response,fluidNa:100}).change<0);
assert.throws(()=>sodiumResponse({...response,rate:0}));
for(const base of [130,140,154]){
 const mixed=mixFinal({volume:1000,target:165,base,stock:1232});
 near((mixed.carrier*base+mixed.additive*1232)/1000,165);
}
console.log('Passed: Mg context boundaries and lab overrides, sodium-plus-K response estimates, interval scaling, and all three base-fluid preparations.');
