const assert=require('assert/strict'),vm=require('vm'),fs=require('fs'),{calculateGiLoss}=require('./dist/calc.js');
assert.equal(calculateGiLoss({weight:10,episodes:3,hours:6,perEpisode:3}),15);assert.equal(calculateGiLoss({weight:10,episodes:3,hours:6,perEpisode:4}),20);assert.equal(calculateGiLoss({weight:5,episodes:0,hours:4,perEpisode:3}),0);
for(const change of [{weight:0},{hours:0},{episodes:-1},{episodes:1.5},{perEpisode:NaN}])assert.throws(()=>calculateGiLoss({weight:10,episodes:3,hours:6,perEpisode:3,...change}));
const els={};for(const id of ['weight','giEpisodes','giHours','giPerEpisode','giEstimate','giApply','giSpeciesNote','losses','planner'])els[id]={value:'',textContent:'',disabled:false,listeners:{},addEventListener(t,f){this.listeners[t]=f},dispatchEvent(e){this.lastEvent=e}};
Object.entries({weight:'10',giEpisodes:'3',giHours:'6',giPerEpisode:'3',losses:'100'}).forEach(([id,v])=>els[id].value=v);let species='dog';vm.runInNewContext(fs.readFileSync('dist/gi-loss.js','utf8'),{calculateGiLoss,ReferenceNumbers:require('./dist/number-format.js'),document:{getElementById:id=>els[id],querySelector:()=>({value:species}),querySelectorAll:()=>[]},setTimeout:f=>f(),Event:class{constructor(type,options){this.type=type;Object.assign(this,options)}}});assert.equal(els.giEstimate.textContent,'15.0 mL/hr estimated');assert.equal(els.losses.value,'100');assert(els.giSpeciesNote.textContent.includes('extrapolated'));els.giApply.listeners.click();assert.equal(els.losses.value,'15.0');assert.equal(els.losses.lastEvent.bubbles,true);els.giHours.value='';els.giHours.listeners.input();assert.equal(els.giApply.disabled,true);assert(!els.giEstimate.textContent.includes('15.0'));els.planner.listeners.reset();assert.equal(els.giEpisodes.value,'');assert.equal(els.giPerEpisode.value,'3');console.log('GI helper: 3–4 estimates, zero episodes, invalid inputs, preview-only behavior, explicit replacement, live invalidation and reset passed.');

species='';els.giHours.value='6';els.giHours.listeners.input();assert.equal(els.giApply.disabled,true);assert(els.giSpeciesNote.textContent.includes('species'));

// Imported display stays compact while calculations retain the exact estimate.
species='dog';els.giEpisodes.value='1';els.giPerEpisode.value='3';els.giHours.value='7';
const numbers=require('./dist/number-format.js');
for(const [weight,display,expected] of [['9.8','4.2',29.4/7],['0.7','0.30',2.1/7],['0','',null]]){
 els.weight.value=weight;els.giHours.listeners.input();
 if(expected===null){assert.equal(els.giApply.disabled,true);continue;}
 els.giApply.listeners.click();assert.equal(els.losses.value,display);
 assert(Math.abs(numbers.read(els.losses)-expected)<1e-14);
}
els.weight.value='1';els.giHours.value='7';els.giApply.listeners.click();
assert.equal(els.losses.value,'0.43');assert.equal(numbers.read(els.losses),3/7);
els.losses.value='0.5';assert.equal(numbers.read(els.losses),0.5);
