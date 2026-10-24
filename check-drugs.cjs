const assert=require('node:assert/strict'),c=require('./dist/drug-calc.js'),catalog=require('./dist/drug-data.js');
const near=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`);
let r=c.preparation({weight:10,dose:.5,stock:5,mode:'sq'});near(r.mg,5);near(r.ml,1);
r=c.preparation({weight:10,dose:2,stock:5,mode:'syringe',volume:12});near(r.mg,10);near(r.ml,2);near(r.diluent,10);near(r.pump,1);
r=c.preparation({weight:10,dose:2,stock:5,mode:'bag',volume:500,rate:25});near(r.hours,20);near(r.mg,20*20/24);near(r.ml,20*20/24/5);near(r.mg/500*25,20/24);
for(const input of [{weight:0,dose:2,stock:5,mode:'syringe',volume:12},{weight:10,dose:2,stock:5,mode:'bag',volume:500,rate:0},{weight:100,dose:2,stock:5,mode:'syringe',volume:1},{weight:10,dose:.5,stock:5,mode:'syringe',volume:12}])assert.throws(()=>c.preparation(input));
near(c.single(10,5,'mcg/kg per dose',.5).ml,.1);near(c.single(10,.2,'mg/kg per dose',5).ml,.4);assert.equal(c.single(10,10,'mg/kg per dose',NaN).ml,null);near(c.norepi(10,.1,20),3);assert.throws(()=>c.norepi(10,.1,0));
assert.equal(new Set(catalog.map(x=>x.id)).size,catalog.length);
const fs=require('fs'),path=require('path');for(const f of fs.readdirSync('dist').filter(x=>x.endsWith('.html'))){let s=fs.readFileSync('dist/'+f,'utf8');assert(s.includes('href="drugs.html"'));for(const m of s.matchAll(/(?:src|href)="([^"#]+)"/g)){if(!/^(https?:|mailto:)/.test(m[1]))assert(fs.existsSync(path.join('dist',m[1].split('#')[0])),`${f}: ${m[1]}`);}}
console.log('Drug preparation, dose units, mass balance, invalid inputs, catalog IDs, navigation and local links passed.');
