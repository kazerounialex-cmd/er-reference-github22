const el=id=>document.getElementById(id);
const fmt=n=>ReferenceNumbers.display(n);
function update(){
 const keys=['total','maintenance','replacement','lossRate','deficit','credit','remaining'];
 if(!el('planner').checkValidity()){keys.forEach(k=>el(k).textContent='—');el('status').textContent='Enter valid weight, dehydration, replacement hours, and losses.';return;}
 try{
 const p={species:document.querySelector('[name=species]:checked')?.value??'',weight:Number(el('weight').value),dehydration:Number(el('dehydration').value),hours:Number(el('hours').value),losses:Number(el('losses').value),bolus:Number(el('bolus').value),mode:'initial'};
 const r=calculate(p);
 el('total').textContent=fmt(r.total);
 for(const [id,v] of Object.entries({maintenance:r.maintenanceHourly,replacement:r.replacementHourly,lossRate:p.losses}))el(id).textContent=fmt(v)+' mL/hr';
 for(const id of ['deficit','credit','remaining'])el(id).textContent=fmt(r[id])+' mL';
 el('status').textContent=r.excess>0?'Credited boluses exceed the estimated deficit. Deficit replacement is set to zero; reassess the plan.':`Deficit replacement over ${p.hours} hours`;
 }catch(e){keys.forEach(k=>el(k).textContent='—');el('status').textContent=e.message;}
}
el('planner').addEventListener('submit',event=>event.preventDefault());
el('planner').addEventListener('input',update);
el('planner').addEventListener('reset',()=>setTimeout(update,0));
update();

// Open the calculation panel when its small introduction link is followed.
el('fluid-math-link').addEventListener('click',()=>{el('fluid-math').open=true;});
