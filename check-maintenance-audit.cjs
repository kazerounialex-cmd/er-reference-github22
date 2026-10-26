const assert=require('node:assert/strict');
const C=require('./dist/cri-calc.js'),D=require('./dist/drug-calc.js'),E=require('./dist/electrolyte-calc.js');
const {calculatePotassium}=require('./dist/calc.js'),P=require('./dist/preparation-check.js');
const near=(actual,expected)=>assert(Math.abs(actual-expected)<1e-10,`${actual} != ${expected}`);
// 0.5 kg × 0.1 U/kg/hr × 50 hr = 2.5 U = 0.025 mL of U100.
// The displayed 0.03 mL contains 3 U; 3/250 × 5/0.5 = 0.12 U/kg/hr.
const insulin=C.insulinPreparation({weight:.5,dose:.1,stock:100,hours:50,pump:5,capacity:250});
near(insulin.drug,.025);near(insulin.units,2.5);
const checked=P.cri({...insulin,stock:100,dose:.1,unit:'U/kg/hr'},'insulin',.5);
near(checked.drug,.03);near(checked.amount,3);near(checked.delivered,.12);assert(checked.note.includes('+20.0%'));near(insulin.units,2.5);
// Unit conversions independently checked against the displayed physical preparation.
near(P.cri({drug:.06,stock:20,volume:6,pump:1,dose:20,unit:'mcg/kg/min'},'lidocaine',1).delivered,20/6);
// 1.2 mg / 6 mL × 1 mL/hr / 1 kg × 1000 / 60 = 10/3 mcg/kg/min.
near(P.cri({drug:2,stock:5,volume:12,pump:1,dose:2,unit:'mg/kg/day'},'reglan',10).delivered,2);
near(P.cri({drug:.18,stock:1000,volume:12,pump:1,dose:.05,unit:'mcg/kg/min'},'norepinephrine',5).delivered,.05);
// 0.5 kg, 0.06 mmol/kg/hr, 10 mL/hr, 12 mL, 3 mmol/mL -> .012 mL stock.
// Displayed .01 mL: .03 mmol/12×10/.5=.05 mmol/kg/hr; K=.044/12×10/.5=11/150.
const phosphate={weight:.5,dose:.06,fluidRate:10,volume:12,phosStock:3,kStock:4.4,otherK:0,method:'final'};
const ph=P.phosphate(phosphate,E.phosphate(phosphate));near(ph.delivered,.05);near(ph.potassiumRate,11/150);
// An ideal mixture below the existing K limit can exceed it after stock rounding.
const overK={...phosphate,dose:.04,otherK:.43};assert(E.phosphate(overK).totalK<.5);assert.throws(()=>P.phosphate(overK,E.phosphate(overK)),/0.5/);
const k={weight:.05,target:.5,fluidRate:10,volume:12,stock:2,otherK:0,method:'final'};
near(calculatePotassium(k).additive,.015);assert.throws(()=>P.potassium(k,calculatePotassium(k)),/0.5/);
// Final-volume carrier estimate must not get rounded and added back into delivery math.
const small={weight:1,target:.05,fluidRate:10,volume:12,stock:2,otherK:0,method:'final'};
const kr=P.potassium(small,calculatePotassium(small));near(kr.diluent,11.97);near(kr.delivered,.05);
// Stock/solute amounts are checked against the amount actually displayed.
const single=P.single({stockVolume:.025,stock:100,weight:.5,target:5});near(single.amount,3);near(single.delivered,6);assert(single.note.includes('+20.0%'));
// Sodium-free replacement: 1.4 mL water + 10.6 mL at 130 mEq/L in 12 mL final.
const sodium=P.mixture({stockVolume:12*(130-115)/130,stock:0,base:130,volume:12,target:115,unit:'mEq/L Na'});
near(sodium.concentration,130*10.6/12);assert(sodium.changed);
// Fail closed on representational underflow; positive prescriptions cannot become zero volume.
assert.throws(()=>D.preparation({weight:1e-300,dose:.5,stock:1e100,mode:'sq'}));
assert.throws(()=>D.preparation({weight:1e-300,dose:2,stock:1e100,mode:'syringe',volume:12}));
assert.throws(()=>E.magnesium({weight:1e-300,dailyDose:.5,hours:24,stock:1e100,volume:12}));
assert.throws(()=>E.phosphate({...phosphate,weight:1e-300,phosStock:1e100}));
assert.throws(()=>calculatePotassium({...small,weight:1e-300,stock:1e100}));
assert.throws(()=>E.mixFinal({volume:Number.MIN_VALUE,target:.5,base:0,stock:1}));
console.log('Maintenance audit regressions passed: physical preparation delivery, mg/mcg and daily/hourly conversions, supplemental K, rounded guards, final-volume accounting and numeric underflow.');
