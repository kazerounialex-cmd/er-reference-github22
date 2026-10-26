(()=>{
  const $=id=>document.getElementById(id),grid=$('os-grid');
  const fields=['dogDehydration','dogLosses','dogBolus','catDehydration','catLosses','catBolus','kVolume','kRate','kStock','mgStock','naCurrent','naTarget','waterHours','naVolume','naMixTarget','phosStock','phosKStock','phosDose','phosRate','phosVolume','dextroseVolume','hypoVolume','hypoTarget','glucoseNa','glucose','neDose','neHours','neStock','otherK'];
  const defaults=Object.fromEntries(fields.map(name=>[name,$('os-'+name).value]));
  const api={calculate,calculatePotassium,magnesium,phosphate,freeWater,mixFinal,mixVolumes,correctedSodium,bloodPlan,CriCalc};
  const labels={dog:'Dog fluid plan',cat:'Cat fluid plan',potassium:'KCl',magnesium:'Magnesium',phosphate:'KPhos',water:'Free water',sodium:'Sodium mixing',hypo:'Hyponatremia',glucose:'Glucose correction',dextrose:'Dextrose',blood:'Blood collection',norepi:'Norepinephrine'};
  function update(){
    const v={species:$('species').value,weight:$('weight').value.trim()===''?NaN:Number($('weight').value),includePhos:$('os-includePhos').checked,neAccess:$('os-neAccess').value};
    for(const name of fields){const el=$('os-'+name);v[name]=el.value.trim()===''?NaN:Number(el.value);}
    grid.querySelectorAll('output').forEach(el=>{el.textContent='—';el.removeAttribute('title');el.removeAttribute('aria-invalid');});
    const result=originalSheetCalculate(v,api);
    for(const [cell,value] of Object.entries(result.values)){
      const el=$('os-out-'+cell);if(!el)continue;
      el.textContent=ReferenceNumbers.format(value);
      el.title='Calculated using current site arithmetic';
    }
    for(const [key,message] of Object.entries(result.errors)){
      const cell=key.startsWith('na')&&/^na\d+$/.test(key)?'H'+key.slice(2):/^k[TU]\d+$/.test(key)?key.slice(1):null;
      const el=cell?$('os-out-'+cell):null;if(el){el.title=message;el.setAttribute('aria-invalid','true');}
    }
    const notes=[],seen=new Set();
    for(const [key,message] of Object.entries(result.errors)){
      // The inactive species block is expected, rather than an error needing action.
      if((key==='dog'&&v.species==='Cat')||(key==='cat'&&v.species==='Dog'))continue;
      if(message==='Select species and enter patient weight above.'&&seen.has(message))continue;seen.add(message);
      const li=document.createElement('li');li.textContent=(labels[key]||(/na\d+/.test(key)?'Sodium mixture':key.startsWith('k')?'KCl suggestion':'Calculation'))+': '+message;notes.push(li);
    }
    if(!notes.length){const li=document.createElement('li');li.textContent='All active sections calculated.';notes.push(li);}
    $('os-errors').replaceChildren(...notes);
    for(const species of ['Dog','Cat'])grid.querySelectorAll(species==='Dog'?'[data-cell="C3"]':'[data-cell="C13"]').forEach(el=>el.setAttribute('data-selected',String(v.species===species)));
  }
  function fit(){grid.style.zoom=$('os-fit').checked?String(Math.min(1,$('os-viewport').clientWidth/grid.offsetWidth)):'1';}
  for(const name of fields)$('os-'+name).addEventListener('input',update);
  ['weight','species'].forEach(id=>$(id).addEventListener('input',update));
  $('os-neAccess').addEventListener('change',update);$('os-includePhos').addEventListener('change',update);
  $('os-stocks').addEventListener('click',()=>{const unlock=$('os-stocks').getAttribute('aria-pressed')!=='true';grid.querySelectorAll('[data-stock]').forEach(el=>{el.readOnly=!unlock;});$('os-stocks').setAttribute('aria-pressed',String(unlock));$('os-stocks').textContent=unlock?'Lock stock concentrations':'Unlock stock concentrations';});
  $('os-fit').addEventListener('change',fit);
  if(typeof ResizeObserver!=='undefined')new ResizeObserver(fit).observe($('os-viewport'));
  window.addEventListener('resize',fit);
  $('clearPatient').addEventListener('click',()=>{for(const name of fields)$('os-'+name).value=defaults[name];$('os-includePhos').checked=false;$('os-neAccess').value='peripheral';grid.querySelectorAll('.os-log').forEach(el=>{el.value='';});grid.querySelectorAll('[data-stock]').forEach(el=>{el.readOnly=true;});$('os-stocks').setAttribute('aria-pressed','false');$('os-stocks').textContent='Unlock stock concentrations';update();});
  update();fit();
})();
