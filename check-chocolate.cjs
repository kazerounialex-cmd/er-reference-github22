const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('./dist/chocolate-calc.js'),near=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`);
near(C.toGrams(1,'oz'),28.349523125);near(C.toGrams(1,'g'),1);
let r=C.estimate({species:'Dog',weight:10,items:[{type:'milk',grams:100}]});near(r.lowDose,23);assert.equal(r.band,'gi');
r=C.estimate({species:'Dog',weight:10,items:[{type:'dark',grams:100}]});near(r.lowDose,53);near(r.highDose,56);assert.equal(r.band,'cardiac');
near(C.concentration('percent',65).low,10.075);near(C.concentration('percent',100).low,15.5);
r=C.estimate({species:'Dog',weight:10,items:[{type:'milk',grams:100},{type:'cocoa',grams:10}]});near(r.highDose,51.5);
for(const [dose,band] of [[0,'below'],[19.999,'below'],[20,'gi'],[39.999,'gi'],[40,'cardiac'],[50,'cardiac'],[60,'neuro'],[99.999,'neuro'],[100,'lethal'],[200,'lethal']])assert.equal(C.band(dose),band);
for(const call of [()=>C.toGrams(-1,'g'),()=>C.toGrams(1,'lb'),()=>C.concentration('unknown',0),()=>C.concentration('percent',0),()=>C.concentration('percent',101),()=>C.estimate({species:'Cat',weight:5,items:[{type:'milk',grams:100}]}),()=>C.estimate({species:'Dog',weight:0,items:[]}),()=>C.estimate({species:'Dog',weight:10,items:[{type:'milk',grams:null}]}),()=>C.estimate({species:'Dog',weight:10,items:[{type:'cocoa',grams:1e308}]})])assert.throws(call);
for(const [dose,position] of [[0,0],[10,.05],[20,.1],[30,.15],[40,.2],[50,.25],[60,.3],[80,.4],[100,.5],[150,.75],[200,1],[300,1]])near(C.position(dose),position);
for(const dose of [-1,NaN,Infinity])assert.throws(()=>C.position(dose));
// A minimal DOM exercises the real UI controller and its dynamic entry listeners.
const elements={},cards={};
function el(id=''){
 const node={id,value:'',textContent:'',hidden:false,style:{values:{},setProperty(key,value){this.values[key]=value}},attrs:{},listeners:{},children:[],className:'',
 addEventListener(type,fn){(this.listeners[type]??=[]).push(fn)},fire(type){for(const fn of this.listeners[type]??[])fn()},setAttribute(name,value){this.attrs[name]=value},append(child){this.children.push(child)},replaceChildren(){this.children=[]},remove(){},querySelector(selector){return selector==='svg'?this.svg:this.marker},
 set innerHTML(html){this.html=html;for(const m of html.matchAll(/<(?:input|select|label|button|small)[^>]*id="([^"]+)"[^>]*>/g)){const n=el(m[1]);n.value=m[1].startsWith('chocUnit')?'oz':'';}},get innerHTML(){return this.html||''}};
 if(id)elements[id]=node;return node;
}
for(const id of ['weight','species','chocWhiteConcern','chocPoisonRecommendation','chocRiskLabel','chocQuickMath','chocDefaults','chocComparison','chocDose','chocDoseIcon','chocRiskDot','chocPosition','chocTotal','chocStatus','chocMath','chocEntryCount','chocEntries','chocAdd','chocClear','clearPatient'])el(id);
elements.weight.value='10';elements.species.value='Dog';
for(const band of ['below','gi','cardiac','neuro','lethal']){cards[band]=el();cards[band].marker=el();cards[band].svg={outerHTML:`<svg data-icon="${band}"></svg>`};}
const context={ChocolateCalc:C,ReferenceNumbers:require('./dist/number-format.js'),document:{getElementById:id=>elements[id],createElement:()=>el(),querySelectorAll:()=>Object.values(cards),querySelector:selector=>cards[selector.match(/="([^"]+)"/)[1]]}};
vm.runInNewContext(fs.readFileSync('dist/chocolate.js','utf8'),context);
assert.equal(elements.chocDose.textContent,'Compare chocolate types');assert.equal(elements.chocComparison.hidden,false);assert(!elements.chocComparison.innerHTML.includes('known cocoa'));assert(elements.chocMath.textContent.includes('Milk chocolate'));
elements.weight.value='';elements.species.value='';elements.weight.fire('input');assert(elements.chocDefaults.textContent.includes('20.0 kg'));assert(elements.chocTotal.textContent.includes('20.0 kg dog'));
elements.chocSource1.value='milk';elements.chocSource1.fire('input');assert.equal(elements.chocDose.textContent,'3.3 mg/kg');assert.equal(elements.chocPoisonRecommendation.hidden,true);assert(elements.chocMath.textContent.includes('÷ 20.0 kg'));
elements.weight.value='10';elements.species.value='Dog';elements.weight.fire('input');
elements.chocSource1.value='milk';elements.chocSource1.fire('input');elements.chocAmount1.value='1';elements.chocAmount1.fire('input');
const ozResult=elements.chocDose.textContent;assert.equal(ozResult,'6.5 mg/kg');assert.equal(cards.below.attrs['data-active'],'true');assert(elements.chocDoseIcon.innerHTML.includes('below'));assert.equal(elements.chocRiskDot.hidden,false);near(parseFloat(elements.chocRiskDot.style.values['--risk-position']),C.position(28.349523125*2.3/10)*100);
elements.chocG1.fire('click');assert.equal(elements.chocG1.attrs['aria-pressed'],'true');near(Number(elements.chocAmount1.value),28.34952313);assert.equal(elements.chocDose.textContent,ozResult);
elements.chocOz1.fire('click');assert.equal(elements.chocOz1.attrs['aria-pressed'],'true');assert.equal(elements.chocDose.textContent,ozResult);assert.equal(elements.chocAmount1.value,'1');
elements.chocSource1.value='percent';elements.chocSource1.fire('input');assert.equal(elements.chocDose.textContent,'—');assert.equal(elements.chocPercentLabel1.hidden,false);
elements.chocPercent1.value='65';elements.chocPercent1.fire('input');assert.equal(cards.gi.attrs['data-active'],'true');assert(elements.chocDoseIcon.innerHTML.includes('gi'));assert(elements.chocMath.textContent.includes('10.1 mg/g'));
elements.chocAdd.fire('click');assert.equal(elements.chocDose.textContent,'—');assert.equal(elements.chocEntryCount.textContent,'2 products');
elements.chocSource2.value='cocoa';elements.chocSource2.fire('input');elements.chocUnit2.value='g';elements.chocUnit2.fire('change');elements.chocAmount2.value='10';elements.chocAmount2.fire('input');assert.notEqual(elements.chocDose.textContent,'—');
elements.species.value='Cat';elements.species.fire('input');assert.equal(elements.chocDose.textContent,'—');assert(elements.chocStatus.textContent.includes('Canine calculator only'));assert(elements.chocMath.textContent.includes('Complete the exposure'));assert.equal(elements.chocDoseIcon.hidden,true);assert.equal(elements.chocDoseIcon.innerHTML,'');assert.equal(elements.chocRiskDot.hidden,true);assert(Object.values(cards).every(card=>card.attrs['data-active']==='false'));
elements.species.value='Dog';elements.weight.value='10';elements.species.fire('input');
elements.chocRemove2.fire('click');elements.chocSource1.value='milk';elements.chocSource1.fire('input');elements.chocUnit1.value='g';elements.chocUnit1.fire('change');
for(const [grams,hidden] of [[173,true],[174,false],[261,false],[435,false]]){elements.chocAmount1.value=String(grams);elements.chocAmount1.fire('input');assert.equal(elements.chocPoisonRecommendation.hidden,hidden);assert(elements.chocQuickMath.textContent.includes('unrounded'));if(grams===173){assert.equal(elements.chocDose.textContent,'39.8 mg/kg');assert.equal(elements.chocRiskLabel.textContent,'GI effects reference');}}
elements.chocSource1.value='';elements.chocSource1.fire('input');assert(elements.chocComparison.innerHTML.includes('Call animal poison control.'));assert.equal(elements.chocPoisonRecommendation.hidden,true);
elements.chocAmount1.value='-1';elements.chocAmount1.fire('input');assert.equal(elements.chocPoisonRecommendation.hidden,true);
elements.chocSource1.value='white';elements.chocSource1.fire('input');elements.chocAmount1.value='1';elements.chocAmount1.fire('input');assert.equal(elements.chocWhiteConcern.hidden,false);assert.equal(elements.chocRiskLabel.textContent,'Below the listed dose threshold');
elements.chocAmount1.value='0';elements.chocAmount1.fire('input');assert.equal(elements.chocWhiteConcern.hidden,true);
elements.chocAmount1.value='1';elements.chocAmount1.fire('input');elements.chocAdd.fire('click');assert.equal(elements.chocWhiteConcern.hidden,true);
elements.chocSource3.value='milk';elements.chocSource3.fire('input');elements.chocAmount3.value='1';elements.chocAmount3.fire('input');assert.equal(elements.chocWhiteConcern.hidden,false);
elements.chocClear.fire('click');assert.equal(elements.chocEntryCount.textContent,'1 product');assert.equal(elements.chocDose.textContent,'Compare chocolate types');
console.log('Chocolate checks passed: Merck values, combined products, cocoa %, risk boundaries, invalid inputs, oz/g preservation, dynamic entries, source changes, clearing and feline block.');
