const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const field={value:'',readOnly:false,disabled:false,events:[],dispatchEvent(event){this.events.push(event);}};
const button={dataset:{volumeTarget:'mVolume',volumeValue:'250'},addEventListener(type,fn){this.click=fn;}};
vm.runInNewContext(fs.readFileSync('dist/volume-presets.js','utf8'),{document:{querySelectorAll:()=>[button],getElementById:()=>field},Event});
button.click();assert.equal(field.value,'250');assert.deepEqual(field.events.map(e=>e.type),['input','change']);assert.ok(field.events.every(e=>e.bubbles));
field.readOnly=true;field.value='12';button.click();assert.equal(field.value,'12');
for(const name of ['potassium','magnesium','phosphate','sodium','dextrose','cri-fentanyl','cri-norepinephrine','cri-insulin','cri-lidocaine','cri-ketamine','cri-reglan','drugs','original-sheet']){
 const html=fs.readFileSync(`dist/${name}.html`,'utf8');
 for(const group of html.matchAll(/<span class="volume-presets"[^>]*>([\s\S]*?)<\/span>/g))assert.deepEqual([...group[1].matchAll(/data-volume-value="(\d+)"/g)].map(m=>m[1]),['12','250','500','1000']);
 assert.match(html,/data-volume-for=/,name);
}
const k=fs.readFileSync('dist/potassium.html','utf8');
for(const b of k.matchAll(/<button[^>]*class="rate-pick"[^>]*>([\s\S]*?)<\/button>/g))assert.match(b[1],/mEq\/kg\/hr/);
console.log('Passed volume shortcut events, locked-field protection, all preparation pages, and potassium button units.');
