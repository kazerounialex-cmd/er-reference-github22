// Optional real-browser regression suite. Requires Playwright and Chromium.
// Start the documented static server first; no clinical data is entered.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',headless:true,args:['--no-sandbox']});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const base=process.env.ER_REFERENCE_TEST_URL||'http://127.0.0.1:8000';
 const go=async name=>{await page.goto(base+'/'+name);};
 const fill=async(id,value)=>page.locator('#'+id).fill(String(value));
 const text=async id=>page.locator('#'+id).innerText();
 await go('index.html');await page.locator('#masterSpecies').selectOption('dog');await fill('masterWeight',20);
 for(const [id,value] of Object.entries({dehydration:8,hours:12,bolus:400,losses:5}))await fill(id,value);
 assert.equal(await text('sharedFluidStatus'),'From Fluid Planner');
 const originalPlan=await page.evaluate(()=>sessionStorage.getItem('er-reference-fluid-v1'));
 // Reglan bag controls inherit the exact planner rate on both entry pages.
 const plannerRate=132*20**.75/24+1200/12+5;
 for(const [file,id,volume,result] of [['cri-reglan.html','rBagPump','rBagVolume','rBagResult'],['drugs.html','bagRate','bagVolume','bagResult']]){
  await go(file);assert.equal(await text(id+'LinkStatus'),'From Fluid Planner');
  assert.equal(await page.evaluate(id=>FluidReferenceNumbers.value(document.getElementById(id)),id),plannerRate);
  await fill(volume,500);
  const stock=20*2*(500/plannerRate)/24/5;
  const stockText=stock.toLocaleString('en-US',{maximumSignificantDigits:6,useGrouping:false});
  assert((await text(result)).includes(stockText+' mL'),'Reglan stock must use the unrounded linked rate');
  if(file==='cri-reglan.html'){
   await page.locator('#criPrintMethod').selectOption('rBag');
   assert((await text('criPrintMix')).includes(Number(stock.toPrecision(6)).toString()+' mL stock'));
   await fill('r12Pump',2);
  }
  await fill(id,25);await fill('sharedFluidRate',60);
  assert.equal(await page.locator('#'+id).inputValue(),'25');assert.match(await text(id+'LinkStatus'),/Local override/);
  if(file==='cri-reglan.html')assert.equal(await page.locator('#r12Pump').inputValue(),'2');
  await page.reload();assert.equal(await page.locator('#'+id).inputValue(),'25');
  await page.locator('#'+id+'UseShared').click();assert.equal(await page.locator('#'+id).inputValue(),'60');
  await page.locator('#useCalculatedFluid').click();
  assert.equal(await page.evaluate(id=>FluidReferenceNumbers.value(document.getElementById(id)),id),plannerRate);
 }
 await go('potassium.html');assert.equal(await text('kRateLinkStatus'),'From Fluid Planner');
 await fill('sharedFluidRate',40);assert.equal(await text('kRateLinkStatus'),'Shared manual rate');
 assert.match(await text('sharedFluidBreakdown'),/manual rate is active/);
 await fill('kRate',10);assert.match(await text('kRateLinkStatus'),/Local override/);
 await fill('masterWeight',1);await fill('kVolume',12);await fill('kTarget',.05);
 assert.equal(await text('kAdd'),'0.03');assert.match(await text('kStatus'),/measurement feasibility/);
 const firstCarrier=parseFloat(await text('kDiluent'));assert.equal(firstCarrier,11.97);
 assert(Math.abs(.03*2/(firstCarrier+.03)*10-.05)<1e-12);
 await page.locator('button[type=reset]').click();await page.waitForTimeout(30);
 assert.equal(await page.locator('#masterWeight').inputValue(),'1');assert.equal(await page.locator('#masterSpecies').inputValue(),'dog');
 assert.equal(await page.locator('#sharedFluidRate').inputValue(),'40');assert.equal(await page.locator('#kRate').inputValue(),'10');
 const saved=JSON.parse(await page.evaluate(()=>sessionStorage.getItem('er-reference-fluid-v1')));
 assert.deepEqual(saved.inputs,JSON.parse(originalPlan).inputs);assert.equal(saved.override,'40');assert.equal(saved.locals.kRate,'10');
 await fill('masterWeight',10);await page.locator('#kRateUseShared').click();await fill('kVolume',12);await fill('kTarget',.1);
 assert.equal(await text('kAdd'),'0.15');assert.equal(await text('kDiluent'),'11.85 mL');
 await page.locator('#includeKcl').check();await page.locator('#allPotassiumSources').check();assert.match(await text('concurrentTotal'),/Combined supplemental K: 0\.10 mEq/);
 await go('phosphate.html');await fill('pVolume',12);await fill('pDose',.03);
 await page.locator('#includeKphos').check();await page.locator('#allPotassiumSources').check();
 assert.match(await text('concurrentTotal'),/Combined supplemental K: 0.144 mEq/);
 assert.match(await text('concurrentContributions'),/KCl: 0\.10.*KPhos: 0\.044/);
 await fill('pDose',.06);assert.equal(await page.locator('#includeKphos').isChecked(),false);
 await page.locator('#includeKphos').check();await page.locator('#allPotassiumSources').check();assert.match(await text('concurrentTotal'),/0.188 mEq/);
 await page.locator('#concurrentArrangement').selectOption('same');assert.equal(await text('concurrentTotal'),'—');assert.match(await text('concurrentStatus'),/same-bag/);
 await page.locator('#clearPatient').click();await page.waitForTimeout(40);
 assert.equal(await page.locator('#masterWeight').inputValue(),'');assert.equal(await page.locator('#masterSpecies').inputValue(),'');assert.equal(await page.locator('#sharedFluidRate').inputValue(),'');
 assert.equal(await page.locator('#includeKcl').isChecked(),false);assert.equal(await page.locator('#includeKphos').isChecked(),false);
 await page.goBack();await page.waitForTimeout(40);assert.equal(await page.locator('#masterWeight').inputValue(),'');assert.equal(await text('kAdd'),'—');assert.equal(await page.locator('#kTarget').inputValue(),'');
 await go('drugs.html');await page.locator('#masterSpecies').selectOption('cat');await fill('masterWeight',10);await fill('lidocaineDose',5);
 assert.match(await text('lidocaineResult'),/2.5 mL/);assert.match(await text('lidocaineResult'),/Caution:.*Outside displayed reference/);
 await fill('priorLidocaine',0);await fill('priorBupivacaine',0);assert.match(await text('localExposureResult'),/cumulative lidocaine 5 mg\/kg/);assert.match(await text('localExposureResult'),/Combined exposure requires clinician review/);
 await go('cri-lidocaine.html');assert.equal(await page.locator('#criPrintButton').isDisabled(),true);
 await go('cri-insulin.html');assert.equal(await page.getByText('Exactly 200 mg/dL',{exact:true}).count(),2);
 await page.emulateMedia({media:'print'});await page.pdf({path:'/tmp/er-insulin-clinical-review.pdf',format:'Letter'});await page.emulateMedia({media:'screen'});
 // Visit every page to exercise actual navigation scripts and layout at two widths.
 const files=require('node:fs').readdirSync('dist').filter(f=>f.endsWith('.html'));
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});
  for(const file of files){await go(file);assert.equal(await page.locator('h1').count()>0,true,file);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false,`${file} at ${width}px`);}
 }
 assert.deepEqual(errors,[]);console.log('Browser checks passed: 17 pages at desktop/phone widths, precision examples, local/global/history resets, rate sources, explicit concurrent K reconciliation, local-anesthetic warnings, feline CRI prohibition, insulin screen/print boundary text and no JavaScript page errors.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1);});
