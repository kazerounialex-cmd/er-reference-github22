(()=>{
 const $=id=>document.getElementById(id),ids=['weight','giEpisodes','giHours','giPerEpisode'];
 function estimate(){
  if(ids.some(id=>$(id).value.trim()===''))throw Error('Enter weight, episodes and hours.');
  return calculateGiLoss({weight:Number($('weight').value),episodes:Number($('giEpisodes').value),hours:Number($('giHours').value),perEpisode:Number($('giPerEpisode').value)});
 }
 function updateEstimate(){
  const species=document.querySelector('[name=species]:checked')?.value;
  if(!['dog','cat'].includes(species)){$('giSpeciesNote').textContent='Select species in the shared banner.';$('giEstimate').textContent='Select species and enter patient weight to estimate losses.';$('giApply').disabled=true;return;}
  $('giSpeciesNote').textContent=species==='dog'?'Canine use extrapolated from a feline source.':'Feline clinical rule of thumb; measure when possible.';
  try{const rate=estimate();$('giEstimate').textContent=`${rate.toLocaleString('en-US',{maximumFractionDigits:1,minimumFractionDigits:1})} mL/hr estimated`;$('giApply').disabled=false;}
  catch(error){$('giEstimate').textContent=error.message;$('giApply').disabled=true;}
 }
 [...ids.map($),...document.querySelectorAll('[name=species]')].forEach(field=>field.addEventListener('input',updateEstimate));
 $('giApply').addEventListener('click',()=>{try{$('losses').value=String(estimate());$('losses').dispatchEvent(new Event('input',{bubbles:true}));}catch{updateEstimate();}});
 $('planner').addEventListener('reset',()=>{setTimeout(()=>{$('giEpisodes').value='';$('giHours').value='';$('giPerEpisode').value='3';updateEstimate();},0);});
 updateEstimate();
})();
