"""Compact cage-sheet workflow without changing workbook calculations."""
from pathlib import Path
import runpy
ns=runpy.run_path(str(Path(__file__).with_name('compact-electrolytes.py')));P,N=ns['P'],ns['N']
p=Path(__file__).resolve().parents[1]/'dist/blood-collection.html';r=P(p.read_text()).root
body=r.one(lambda n:n.tag=='body');main=r.byid('main-content')
if not body.cls('blood-compact'):
 body.addcls('blood-compact')
 form=r.byid('bloodForm');sections=[n for n in form.children if isinstance(n,N) and n.tag=='section'];patient,result,approved=sections
 patient.addcls('blood-patient');result.addcls('blood-results');approved.addcls('blood-approved')
 ns['heading'](patient,'Collection plan');ns['heading'](result,'Collection guides');ns['heading'](approved,'Clinician-approved volumes (optional)')
 for id in ['bWeight','bSpecies']:
  label=r.byid(id).parent;label.attrs['hidden']=None;main.add(label)
 # Demographics remain available but do not fill the first screen.
 labels=[r.byid(id).parent for id in ['bPatient','bRecord','bStart','bClinician']]
 details=N('details',[('class','blood-identity')]);details.add(N('summary',children=['Patient / cage details (optional)']));grid=details.add(N('div',[('class','grid')]))
 for label in labels:grid.add(label)
 patient.add(details,2)
 context=r.byid('bContext');context.parent.children[0]='Patient context '
 for opt in context.children:
  if isinstance(opt,N) and opt.tag=='option':
   opt.children=['Healthy / baseline — 60 mL/kg, no reduction' if opt.attrs.get('value')=='baseline' else 'Workbook adjusted — 60 mL/kg minus 15%']
 # Move existing export controls, preserving their IDs and listeners.
 printbutton=r.byid('bPrint');actions=printbutton.parent;actions.addcls('blood-top-actions');form.add(actions,0)
 printbutton.children=['Print calculated cage sheet / Save PDF']
 # Supplemental downloads stay nearby but use less emphasis.
 for id in ['bDownload','bCSV']:r.byid(id).addcls('secondary-action')
 status=r.byid('bExportStatus');form.add(status,1)
 preview=r.byid('bPreview').parent;preview.attrs.pop('open',None)
 main.one(lambda n:n.cls('notice')).children=['Sampling estimates require clinical review, particularly with anemia, hemorrhage or instability. Count prior draws and discarded blood. ',N('a',[('href','#blood-evidence')],['Compare references ↓'])]
 main.one(lambda n:n.cls('intro')).children=['Uses the shared patient above. Set context, review volumes, then print a cage-side log.']
 evidence=P('''<details class="panel blood-evidence" id="blood-evidence"><summary>Healthy-patient comparison & sources</summary><div class="table-wrap"><table><thead><tr><th>Reference</th><th>Blood-volume estimate</th><th>Collection / recovery guide</th></tr></thead><tbody><tr><th>Workbook default</th><td>60 mL/kg × 0.85 = 51 mL/kg adjusted; healthy/baseline option = 60 mL/kg</td><td>1% / 24 hr; 10% / 14 days</td></tr><tr><th>Indiana University IACUC</th><td>Healthy adult dog: 85 mL/kg</td><td>1% / 24 hr; 7.5% / 7 days; 10% / 2–4 weeks</td></tr><tr><th>NC3Rs</th><td>Dog: 70–110 mL/kg; cat: 47–65 mL/kg; breed/individual variation</td><td>1% / 24 hr for short-interval sampling; 10% single draw with 3–4 weeks before repeating</td></tr></tbody></table></div><p class="help">Interpretation: the workbook’s 60 mL/kg baseline lies within the cited feline range and below the cited canine range. Its 14-day window is shorter than NC3Rs’ 3–4-week recovery guidance. These healthy-animal research references do not validate a universal sick-patient sampling limit or a blood-donation protocol. NC3Rs describes a 15% lower estimate for obese/older animals; illness requires individual assessment rather than assuming that reduction is sufficient.</p><p class="help">For a 20 kg patient: workbook adjusted = 1,020 mL total, 10.2 mL / 24 hr and 102 mL / 14 days; baseline = 1,200 mL, 12 mL / 24 hr and 120 mL / 14 days. Using IU’s canine 85 mL/kg estimate gives 1,700 mL total, 17 mL at 1% and 170 mL at 10% (2–4-week interval).</p><p><a href="https://research.iu.edu/policies/animal-care/iu-indianapolis-iacuc-blood-collection-guidelines.html">Indiana University · blood collection volumes & frequency</a><br><a href="https://nc3rs.org.uk/3rs-resource-library/blood-sampling/blood-sampling-general-principles">NC3Rs · species ranges, health context & recovery</a><br><a href="sources.html#blood-collection-source">Original workbook method</a></p><p class="help">Reviewed October 22, 2026. Healthy/baseline keeps the workbook’s 60 mL/kg assumption; it does not automatically substitute a species-specific estimate. Assumptions can be deliberately edited below Collection plan.</p></details>''').root.children[0]
 main.add(evidence,main.children.index(preview))
p.write_text(r.render())
