// Responsive presentation behavior must never expand math or alter calculation inputs.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let desktop=true,reduced=false,scroll=0,focus=0,bounds={top:150,bottom:500};
const destination={getBoundingClientRect:()=>bounds,scrollIntoView(options){scroll++;destination.options=options},focus(){focus++}};
const ctx={module:{exports:{}},document:{getElementById:()=>destination},window:{innerHeight:900,matchMedia:q=>({matches:q.includes('1160')?desktop:reduced})}};
vm.runInNewContext(fs.readFileSync('dist/electrolyte-layout.js','utf8'),ctx);const layout=ctx.module.exports;
layout.reveal('result','math');assert.equal(scroll,0);assert.equal(focus,0);
desktop=false;layout.reveal('result','math');assert.equal(scroll,0);assert.equal(focus,1);
bounds={top:950,bottom:1300};layout.reveal('result','math');assert.equal(scroll,1);assert.equal(destination.options.behavior,'smooth');
reduced=true;layout.reveal('result','math');assert.equal(scroll,2);assert.equal(destination.options.behavior,'auto');
for(const name of ['potassium','magnesium','phosphate','sodium','dextrose']){
 const html=fs.readFileSync('dist/'+name+'.html','utf8');assert(html.includes('electrolyte-compact'));assert(html.includes('src="electrolyte-layout.js"'));assert(!/<details[^>]*id="(?:kMath|[mpdn]\w*Math)"[^>]*\bopen\b/.test(html));
}
console.log('Compact electrolyte layout passed: desktop selections update in place, narrow screens reveal offscreen results, reduced-motion respected, math stays collapsed and all five pages use the shared behavior.');
