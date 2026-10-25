// Shared patient values last for this browser tab's session only.
(()=>{
const $=id=>document.getElementById(id),key='er-reference-patient-v1';
const weights=['weight','kWeight','mWeight','pWeight','nWeight','bWeight'].map($).filter(Boolean);
const species=['species','bSpecies','gSpecies'].map($).filter(Boolean);
const radios=Array.from(document.querySelectorAll('input[name="species"]'));
const masterWeight=$('masterWeight'),masterSpecies=$('masterSpecies');
let busy=false;
const normalize=value=>({Dog:'dog',Canine:'dog',Feline:'cat',Cat:'cat',dog:'dog',cat:'cat'}[value]||'');
function read(){try{const s=JSON.parse(sessionStorage.getItem(key));return {weight:s&&Number.isFinite(Number(s.weight))&&Number(s.weight)>0?String(s.weight):'',species:normalize(s?.species)};}catch{return {weight:'',species:''};}}
let state=read();
const generationKey='er-reference-patient-generation-v1';
const savedGeneration=()=>{try{return sessionStorage.getItem(generationKey)||'';}catch{return '';}};
let generation=savedGeneration();
let entryGeneration=window.history?.state?.erReferenceGeneration??generation;
function rememberEntry(){window.history?.replaceState({...window.history.state,erReferenceGeneration:entryGeneration},'');}
rememberEntry();
function resetPreparations(){
 // Clear browser form state and non-form preparation controls, including
 // restored history entries. Shared values are restored separately below.
 document.querySelectorAll('form').forEach(form=>form.reset?.());
 document.querySelectorAll('input,select,textarea').forEach(field=>{
  if(['masterWeight','masterSpecies','sharedFluidRate'].includes(field.id))return;
  if(field.tagName==='SELECT'){
   const options=Array.from(field.options);
   field.value=(options.find(o=>o.defaultSelected)||options[0])?.value??'';
  }else if(field.type==='checkbox'||field.type==='radio')field.checked=field.defaultChecked;
  else field.value=field.defaultValue??'';
  emit(field);
 });
}

function save(){try{sessionStorage.setItem(key,JSON.stringify(state));}catch{} }
function emit(el){el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
function apply(){busy=true;try{masterWeight.value=state.weight;masterSpecies.value=state.species;
 const changed=[];
 for(const el of weights){if(el.value!==state.weight){el.value=state.weight;changed.push(el);}}
 for(const el of species){const option=Array.from(el.options).find(o=>normalize(o.value)===state.species);const value=option?.value??'';if(el.value!==value){el.value=value;changed.push(el);}}
 for(const el of radios){const checked=el.value===state.species;if(el.checked!==checked){el.checked=checked;changed.push(el);}}
 document.querySelectorAll('a[href="cri-lidocaine.html"]').forEach(link=>{
  const blocked=state.species==='cat';
  link.classList.toggle('cat-unavailable',blocked);
  link.querySelector('.cat-restriction').hidden=!blocked;
  link.setAttribute('aria-label',blocked?'Lidocaine CRI — unavailable for cats; open warning':'Lidocaine CRI');
 });
 changed.forEach(emit);
 $('patientSessionNote').textContent=state.weight||state.species?'Shared across pages · this browser tab only':'Shared patient · this browser tab only';
}finally{busy=false;}
}
function setWeight(value){state.weight=Number.isFinite(Number(value))&&Number(value)>0?value:'';save();apply();}
masterWeight.addEventListener('input',()=>{if(!busy)setWeight(masterWeight.value);});
masterSpecies.addEventListener('change',()=>{if(!busy){state.species=masterSpecies.value;save();apply();}});
weights.forEach(el=>el.addEventListener('input',()=>{if(!busy)setWeight(el.value);}));
[...species,...radios].forEach(el=>el.addEventListener('change',()=>{if(busy||el.type==='radio'&&!el.checked)return;state.species=normalize(el.value);if(!state.species)state.weight='';save();apply();}));
$('clearPatient').addEventListener('click',()=>{
 generation=String(Date.now())+'-'+Math.random();
 try{sessionStorage.setItem(generationKey,generation);}catch{}
 entryGeneration=generation;rememberEntry();
 resetPreparations();state={weight:'',species:''};save();apply();
 window.dispatchEvent?.(new Event('newpatient'));
 // Run after browser form reset callbacks so no previous patient survives.
 setTimeout(apply,0);
});
document.querySelectorAll('form').forEach(form=>form.addEventListener('reset',()=>setTimeout(apply,0)));
document.querySelectorAll('[data-clear-all]').forEach(button=>button.addEventListener('click',()=>$('clearPatient').click()));
window.addEventListener('pageshow',()=>{
 const current=savedGeneration();
 const stale=current!==entryGeneration;
 generation=current;entryGeneration=current;rememberEntry();
 // Browsers may restore form values AFTER pageshow. Clear stale history state
 // on the next task, then restore the authoritative patient/fluid session.
 setTimeout(()=>{
  state=read();if(stale||(!state.weight&&!state.species))resetPreparations();
  apply();window.dispatchEvent?.(new Event('patientrestored'));
 },0);
});
apply();
})();
