(()=>{
  const $=id=>document.getElementById(id),show=x=>ReferenceNumbers.format(x),items=new Map();
  const names={below:'Below the listed dose threshold',gi:'GI effects reference',cardiac:'Cardiac effects reference',neuro:'Neurologic effects reference',lethal:'Severe toxicity / LD₅₀ reference'};
  const dose=x=>ReferenceNumbers.display(x);
  let nextId=0;
  function update(){
    $('chocDose').className='';$('chocRiskLabel').textContent='';$('chocQuickMath').textContent='';
    $('chocDose').textContent='—';$('chocTotal').textContent='—';$('chocMath').textContent='Complete the exposure entries to show the calculation.';
    $('chocPoisonRecommendation').hidden=true;$('chocWhiteConcern').hidden=true;
    $('chocComparison').innerHTML='';$('chocComparison').hidden=true;$('chocDefaults').textContent='';
    $('chocDoseIcon').innerHTML='';$('chocDoseIcon').hidden=true;$('chocRiskDot').hidden=true;
    $('chocPosition').textContent='Enter an exposure to place the dose marker.';
    document.querySelectorAll('[data-choc-band]').forEach(card=>{card.setAttribute('data-active','false');card.querySelector('.band-match').textContent='';});
    $('chocEntryCount').textContent=items.size+' product'+(items.size===1?'':'s');
    try{
      const first=[...items.values()][0],single=items.size===1;
      const species=$('species').value||'Dog',weight=$('weight').value.trim()===''?20:Number($('weight').value);
      const assumed=[];
      if(!$('species').value)assumed.push('Dog');
      if($('weight').value.trim()==='')assumed.push('20 kg');
      const defaultAmount=single && first.amount.value.trim()==='';
      if(defaultAmount)assumed.push('1 oz');
      const amountContext=single?(defaultAmount?'1 oz':first.amount.value+' '+first.unit.value):items.size+' products';
      $('chocDefaults').textContent=species+(!$('species').value?' [DEFAULT]':'')+' · '+show(weight)+' kg'+($('weight').value.trim()===''?' [DEFAULT]':'')+' · '+amountContext+(defaultAmount?' [DEFAULT]':'');
      const entries=[...items.values()].map(item=>({type:item.source.value,grams:defaultAmount?ChocolateCalc.gramsPerOz:item.grams,percent:item.percent.value.trim()===''?NaN:Number(item.percent.value)}));
      if(single && !first.source.value){
        const results=Object.entries(ChocolateCalc.products).filter(([key])=>key!=='percent').map(([key,product])=>({product,r:ChocolateCalc.estimate({species,weight,items:[{...entries[0],type:key}]})}));
        const range=(low,high)=>low===high?show(low):show(low)+'–'+show(high);
        $('chocDose').textContent='Compare chocolate types';$('chocDose').className='comparison-heading';
        $('chocTotal').textContent=show(entries[0].grams)+' g eaten · '+show(weight)+' kg '+species.toLowerCase();
        $('chocStatus').textContent='Select a chocolate source for a single result, matching icon and moving marker.';
        $('chocComparison').innerHTML='<table><caption>Possible exposure by chocolate type</caption><thead><tr><th scope="col">Chocolate</th><th scope="col">Dose (mg/kg)</th><th scope="col">Upper reference / recommendation</th></tr></thead><tbody>'+results.map(({product,r})=>`<tr><th scope="row">${product.name}</th><td>${r.lowDose===r.highDose?dose(r.lowDose):dose(r.lowDose)+'–'+dose(r.highDose)}</td><td>${names[r.band]}${r.highDose>=40?'<br><strong>Call animal poison control.</strong>':''}${r.rows[0].type==='white'?'<br><strong>High-fat concern: GI upset; consider pancreatitis in susceptible patients.</strong>':''}</td></tr>`).join('')+'</tbody></table>';
        $('chocComparison').hidden=false;
        $('chocQuickMath').textContent='grams eaten × methylxanthines (mg/g) ÷ patient kg = exposure (mg/kg). See the type-by-type comparison below.';
        $('chocMath').textContent=results.map(({product,r})=>`${product.name}: ${show(r.grams)} g × ${range(r.rows[0].concentration.low,r.rows[0].concentration.high)} mg/g ÷ ${show(weight)} kg = ${range(r.lowDose,r.highDose)} mg/kg.`).join('\n');
        $('chocPosition').textContent='Select a chocolate source to place one dose marker.';
        return;
      }
      const r=ChocolateCalc.estimate({species,weight,items:entries});
      const range=(low,high)=>low===high?show(low):show(low)+'–'+show(high);
      $('chocPoisonRecommendation').hidden=r.highDose<40;
      $('chocWhiteConcern').hidden=!r.rows.some(row=>row.type==='white' && row.grams>0);
      $('chocDose').textContent=(r.lowDose===r.highDose?dose(r.lowDose):dose(r.lowDose)+'–'+dose(r.highDose))+' mg/kg';
      $('chocRiskLabel').textContent=names[r.band];
      $('chocQuickMath').textContent=range(r.lowMg,r.highMg)+' mg ÷ '+show(weight)+' kg = '+(r.lowDose===r.highDose?dose(r.lowDose):dose(r.lowDose)+'–'+dose(r.highDose))+' mg/kg. Display rounded; reference uses the unrounded estimate.';
      $('chocTotal').textContent=range(r.lowMg,r.highMg)+' mg total methylxanthines';
      $('chocStatus').textContent=(r.band!==r.lowBand?'Range crosses reference bands; the upper estimate is highlighted.':'Estimated exposure does not predict the individual clinical outcome.');
      const card=document.querySelector(`[data-choc-band="${r.band}"]`);card.setAttribute('data-active','true');card.querySelector('.band-match').textContent='CURRENT ESTIMATE';
      $('chocDoseIcon').innerHTML=card.querySelector('svg').outerHTML;$('chocDoseIcon').hidden=false;
      $('chocRiskDot').style.setProperty('--risk-position',(ChocolateCalc.position(r.highDose)*100)+'%');$('chocRiskDot').hidden=false;
      $('chocPosition').textContent='● Upper estimate: '+dose(r.highDose)+' mg/kg · '+names[r.band]+(r.highDose>200?' · marker capped at 200 mg/kg':'');
      $('chocMath').textContent=r.rows.map((row,i)=>`${i+1}. ${ChocolateCalc.products[row.type].name}: ${show(row.grams)} g × ${range(row.concentration.low,row.concentration.high)} mg/g = ${range(row.lowMg,row.highMg)} mg.`).join('\n')+`\nTotal ${range(r.lowMg,r.highMg)} mg ÷ ${show(weight)} kg = ${range(r.lowDose,r.highDose)} mg/kg.`;
    }catch(error){$('chocStatus').textContent=error.message;}
    $('chocEntryCount').textContent=items.size+' product'+(items.size===1?'':'s');
  }
  function addEntry(){
    const id=++nextId,row=document.createElement('div');row.className='chocolate-entry';
    row.innerHTML=`<label>Chocolate source<select id="chocSource${id}"><option value="">Select source</option>${Object.entries(ChocolateCalc.products).map(([key,p])=>`<option value="${key}">${p.name}</option>`).join('')}</select></label><label>Amount eaten<input id="chocAmount${id}" type="number" min="0" step="any" placeholder="Amount" aria-describedby="chocPortionHint${id}"></label><label hidden>Amount unit<select id="chocUnit${id}"><option value="oz">oz</option><option value="g">g</option></select></label><fieldset class="chocolate-unit-switch"><legend>Unit</legend><button type="button" id="chocOz${id}" aria-label="Ounces for product ${id}" aria-pressed="true">oz</button><button type="button" id="chocG${id}" aria-label="Grams for product ${id}" aria-pressed="false">g</button></fieldset><label id="chocPercentLabel${id}" hidden>Cocoa percentage<input id="chocPercent${id}" type="number" min="0" max="100" step="any" placeholder="e.g. 65"></label><button type="button" id="chocRemove${id}" aria-label="Remove chocolate entry ${id}">Remove</button><small id="chocPortionHint${id}" class="help chocolate-portion-hint">Rough guide: 1 oz ≈ 28 g ≈ 2 Tbsp (⅛ cup) chocolate chips; ¼ cup ≈ 2 oz. Bar squares vary: use package weight ÷ number of pieces. Weigh when possible. <a href="#chocolate-portion-source">Portion source</a>.</small><small id="chocConcentration${id}" class="help entry-concentration">Select a source to show its assumed concentration.</small>`;
    $('chocEntries').append(row);
    const item={row,source:$('chocSource'+id),amount:$('chocAmount'+id),unit:$('chocUnit'+id),percent:$('chocPercent'+id),grams:null};items.set(id,item);
    function showSource(){
      $('chocPercentLabel'+id).hidden=item.source.value!=='percent';
      try{const c=ChocolateCalc.concentration(item.source.value,item.percent.value.trim()===''?NaN:Number(item.percent.value));$('chocConcentration'+id).textContent=`Assumed total methylxanthines: ${show(c.low)}${c.high===c.low?'':'–'+show(c.high)} mg/g.`;}catch(error){$('chocConcentration'+id).textContent=error.message;}
      update();
    }
    item.source.addEventListener('input',showSource);item.percent.addEventListener('input',showSource);
    item.amount.addEventListener('input',()=>{try{item.grams=item.amount.value.trim()===''?null:ChocolateCalc.toGrams(Number(item.amount.value),item.unit.value);}catch{item.grams=null;}update();});
    function syncUnits(){ $('chocOz'+id).setAttribute('aria-pressed',String(item.unit.value==='oz'));$('chocG'+id).setAttribute('aria-pressed',String(item.unit.value==='g')); }
    for(const [button,unit] of [['chocOz','oz'],['chocG','g']])$(button+id).addEventListener('click',()=>{item.unit.value=unit;if(item.grams!==null)item.amount.value=ReferenceNumbers.format(unit==='oz'?item.grams/ChocolateCalc.gramsPerOz:item.grams,10);syncUnits();update();});
    item.unit.addEventListener('change',()=>{syncUnits();if(item.grams!==null)item.amount.value=ReferenceNumbers.format(item.unit.value==='oz'?item.grams/ChocolateCalc.gramsPerOz:item.grams,10);update();});
    $('chocRemove'+id).addEventListener('click',()=>{items.delete(id);row.remove();if(!items.size)addEntry();else update();});
    update();
  }
  $('chocAdd').addEventListener('click',addEntry);
  $('chocClear').addEventListener('click',()=>{items.clear();$('chocEntries').replaceChildren();addEntry();});
  ['weight','species'].forEach(id=>$(id).addEventListener('input',update));
  $('clearPatient').addEventListener('click',()=>{items.clear();$('chocEntries').replaceChildren();addEntry();});
  addEntry();
})();
