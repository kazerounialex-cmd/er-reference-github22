const assert = require('node:assert/strict');
const C = require('./dist/cri-calc.js');
const D = require('./dist/drug-calc.js');
const { calculate } = require('./dist/calc.js');
const format = require('./dist/number-format.js').format;
const printModel = require('./dist/cri-print.js');
for (const call of [
  () => C.mix(1e308, 1e308, 12),
  () => C.timed(1e308, 1e308, 1e308, 6, 12),
  () => C.insulin(1e308, 1e308, 1e308, 12, 1),
  () => C.rate(Number.MIN_VALUE, Number.MIN_VALUE, 1, 'mcg/kg/hr'),
  () => D.single(1e308, 1e308, 'mg/kg per dose', 1e308),
  () => D.preparation({weight:1e308,dose:.5,stock:Number.MIN_VALUE,mode:'sq'}),
  () => D.norepi(1e308, 1e308, 1),
  () => calculate({species:'dog',mode:'initial',weight:1e308,dehydration:10,hours:12,losses:0,bolus:0})
]) assert.throws(call);
assert.equal(format(.14), '0.14');
assert.equal(format(1.875), '1.875');
assert.equal(format(.060000000000000005), '0.06');
assert.throws(() => format(Infinity));
// Shared UI/print models: compare entire valid preparations, not a copied formula.
for (const weight of [.5,5,30]) {
  const params={weight,dose:.1,stock:100,hours:10,pump:2,capacity:250};
  const ui=C.insulinPreparation(params);
  const print=printModel({tool:'insulin',species:'Cat',weight,values:{criStock:100,insDose:.1,insHours:10,insPump:2,insCapacity:250}},C);
  for(const key of ['drug','diluent','concentration','pump','hours','volume','units'])assert.equal(ui[key],print[key]);
  const reg=C.reglanPreparation({weight,dose:2,stock:5,hours:12,pump:1,capacity:12,bag:false});
  const regPrint=printModel({tool:'reglan',species:'Dog',weight,method:'r12',values:{criStock:5,r12Dose:2,r12Hours:12,r12Pump:1,r12Capacity:12}},C);
  for(const key of ['drug','diluent','concentration','pump','hours','volume','mg'])assert.equal(reg[key],regPrint[key]);
}
console.log('Audit regressions passed: numeric overflow/underflow, small-volume precision and shared screen/print preparations.');
