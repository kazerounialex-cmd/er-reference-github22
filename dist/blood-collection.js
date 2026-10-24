const b=id=>document.getElementById(id);
const assumptionIds=['bVolumePerKg','bReduction','bDayPercent','bFortnightPercent'];
function bNumber(id,optional=false){const field=b(id);if(optional&&field.value.trim()==='')return null;if(field.value.trim()===''||!field.checkValidity()||!Number.isFinite(Number(field.value)))throw Error('Enter a valid weight, assumptions, and optional approved volumes.');return Number(field.value);}
function bloodPatient(){return {patient:b('bPatient').value,record:b('bRecord').value,species:b('bSpecies').value,weight:b('bWeight').value,start:b('bStart').value,clinician:b('bClinician').value,approvedDay:b('bApprovedDay').value,approvedFortnight:b('bApprovedFortnight').value};}
function bloodState(){
  const p={...bloodPatient(),weight:bNumber('bWeight'),volumePerKg:bNumber('bVolumePerKg'),reductionPercent:b('bContext').value==='baseline'?0:bNumber('bReduction'),dayPercent:bNumber('bDayPercent'),fortnightPercent:bNumber('bFortnightPercent')};
  for(const id of ['bApprovedDay','bApprovedFortnight']){const n=bNumber(id,true);if(n!==null&&n<0)throw Error('Approved collection volumes cannot be negative.');}
  return {p,r:bloodPlan(p)};
}
function updateBlood(){
  let p=bloodPatient(),r=null;
  try{
    ({p,r}=bloodState());b('bTotal').textContent=bloodFormat(r.estimated);b('bDay').textContent=bloodFormat(r.day);b('bFortnight').textContent=bloodFormat(r.fortnight);
    b('bStatus').textContent='Workbook estimates calculated. Both time windows include prior draws and other sheets; they are not independent fresh allowances.';
    b('bMath').textContent=`Baseline: ${p.weight} kg × ${p.volumePerKg} mL/kg = ${bloodFormat(r.baseline)} mL. After ${p.reductionPercent}% reduction: ${bloodFormat(r.estimated)} mL. ${p.dayPercent}% = ${bloodFormat(r.day)} mL / 24 hr; ${p.fortnightPercent}% = ${bloodFormat(r.fortnight)} mL / 14 days.`;
  }catch(error){for(const id of ['bTotal','bDay','bFortnight'])b(id).textContent='—';b('bStatus').textContent=error.message;b('bMath').textContent='';}
  for(const id of ['bPrint','bDownload','bCSV'])b(id).disabled=!r;
  const preview=cageSheetDocument(p,r).replace(/<div class="print-toolbar">[\s\S]*?<\/div>/,'');
  if(b('bPreview').srcdoc!==preview)b('bPreview').srcdoc=preview;
}
function exportBlood(action){try{const state=bloodState();action(state.p,state.r);}catch(error){b('bExportStatus').textContent=error.message;}}
function downloadBlood(content,type,extension,p){
  const blob=new Blob([content],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Blood-Collection-'+String(p.patient||'Cage-Sheet').replace(/[^a-z0-9_-]/gi,'-').slice(0,40)+extension;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
b('bPrint').addEventListener('click',()=>exportBlood((p,r)=>{
  const popup=window.open('','_blank');
  if(!popup){b('bExportStatus').textContent='The print page was blocked. Allow the popup, or download the calculated HTML sheet and print it from your browser.';return;}
  popup.opener=null;popup.document.open();popup.document.write(cageSheetDocument(p,r));popup.document.close();b('bExportStatus').textContent='The calculated cage sheet is open. Use its Print / Save as PDF button; the draw rows are blank for handwriting.';
}));
b('bDownload').addEventListener('click',()=>exportBlood((p,r)=>downloadBlood(cageSheetDocument(p,r),'text/html;charset=utf-8','.html',p)));
b('bCSV').addEventListener('click',()=>exportBlood((p,r)=>downloadBlood(bloodCSV(p,r),'text/csv;charset=utf-8','.csv',p)));
b('bAssumptionsToggle').addEventListener('click',()=>{
  const fields=assumptionIds.map(b),locking=!fields[0].readOnly;
  if(locking&&fields.some(f=>f.value.trim()===''||!f.checkValidity()||!Number.isFinite(Number(f.value)))){b('bAssumptionsState').textContent='Enter valid assumptions before locking';return;}
  fields.forEach(f=>f.readOnly=locking);b('bAssumptionsToggle').textContent=locking?'Edit assumptions':'Lock assumptions';b('bAssumptionsState').textContent=locking?'Locked':'Editing';if(!locking)fields[0].focus();updateBlood();
});
// Shared-patient fields may live outside the compact form. Listen directly
// so session restoration and banner edits recalculate without another click.
for(const id of ['bWeight','bSpecies']){
  b(id).addEventListener('input',updateBlood);
  b(id).addEventListener('change',updateBlood);
}
b('bloodForm').addEventListener('input',updateBlood);
b('bloodForm').addEventListener('submit',event=>event.preventDefault());
b('bloodForm').addEventListener('reset',()=>setTimeout(()=>{assumptionIds.forEach(id=>b(id).readOnly=true);b('bAssumptionsToggle').textContent='Edit assumptions';b('bAssumptionsState').textContent='Locked';setBloodDate();b('bExportStatus').textContent='Patient cleared. Enter a new weight to create a calculated sheet.';updateBlood();},0));
function setBloodDate(){const now=new Date();b('bStart').value=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');}
setBloodDate();updateBlood();
