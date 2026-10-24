from pathlib import Path
import re
import json
R=Path(__file__).resolve().parents[1];D=R/'dist'
base=(D/'drugs.html').read_text();prefix=base.split('<main id="main-content"')[0]
concentration_refs=json.loads((R/'scripts/cri-concentration-notes.json').read_text())
items=[('fentanyl','Fentanyl'),('lidocaine','Lidocaine'),('ketamine','Ketamine'),('norepinephrine','Norepinephrine'),('insulin','Insulin'),('reglan','Reglan')]
def number(id,label,value='',unit=''):
 return f'<label>{label} {unit}<input id="{id}" type="number" min="0" step="any" value="{value}"></label>'
patient='<div hidden><input id="weight" type="number"><select id="species"><option value=""></option><option>Dog</option><option>Cat</option></select></div>'
stock=lambda value,unit:f'<details class="stock-settings"><summary>Stock concentration · locked by default</summary>{number("criStock","Stock",value,unit)}<button type="button" id="criLock">Edit concentration</button></details>'
import runpy
transform=runpy.run_path(str(R/'scripts/cri-workflow-layout.py'))['transform']
for id,title in items:
 head=prefix.replace('Drugs · ER Reference',title+' CRI · ER Reference').replace('data-tool="drugs"',f'data-cri="{id}"').replace('— Drugs','— '+title+' CRI')
 head=re.sub(r' aria-current="page"','',head);head=head.replace('<span class="current-page">Current</span>','')
 body=f'<main id="main-content" class="cri-page"><div class="eyebrow">CRI / {title.upper()}</div><h1>{title} CRI</h1>{patient}<p class="help">Uses the shared species and weight above. <a href="sources.html#cri-source">Workbook profiles & clinical references</a>.</p>'
 if id in ['fentanyl','lidocaine','ketamine','norepinephrine']:
  body+='''<p id="criNote" class="help"></p><section class="panel"><div class="cri-controls">'''+number('criDose','Assumed / selected dose')+number('criConcentration','Prepared concentration')+number('criVolume','Final syringe volume',20,'mL')+'</div>'
  if id=='fentanyl':body+='<button type="button" id="normalizeFent">Use patient-specific mix: 1 mL/hr = 1 mcg/kg/hr</button>'
  if id=='norepinephrine':body+='<details><summary>Prepare to run at 1 mL/hr</summary>'+number('norepiHours','Preparation duration',4,'hours')+'<button type="button" id="normalizeNorepi">Calculate 1 mL/hr preparation</button><p class="help">Uses the selected dose and patient weight. Check access limits before preparing.</p></details>'
  if id=='norepinephrine':body+='<fieldset class="access-choice"><legend>Access · workbook guardrails (not validated maximums)</legend><label><input type="radio" name="criAccess" value="peripheral" checked> Peripheral workbook profile · ≤16 mcg/mL</label><label><input type="radio" name="criAccess" value="central"> Central workbook profile · ≤64 mcg/mL</label></fieldset>'
  body+='<div id="criResult" aria-live="polite"></div>'+stock('', '')+'<p id="criMixHelp" class="help"></p></section><section class="panel"><h2>Quick rates · mL/hr</h2><p class="help">Every concentration stays visible. Click a pump-rate cell to select its dose and concentration; selected preparation updates above.</p><div class="table-wrap"><table id="criRateTable"></table></div></section><details class="panel"><summary>Worked math</summary><p id="criMath"></p></details>'
 elif id=='insulin':
  body+='''<p class="notice">Regular insulin IV CRI · Fixed-rate DKA default: 0.1 U/kg/hr for dogs and cats. Confirm hydration, potassium, glucose monitoring and dextrose support before starting. No automatic titration or stop rule.</p><section class="panel"><h2>Fixed-rate DKA preparation</h2><div class="cri-presets"><button type="button" data-insulin="fixed">Fixed rate · Dog / Cat · 0.1 U/kg/hr</button><button type="button" data-insulin="cat">Cat · variable-rate starting alternative · 0.045 U/kg/hr</button><button type="button" data-insulin="edka">Workbook EDKA option · 0.06 U/kg/hr · review</button></div><div class="cri-controls">'''+number('insDose','Selected insulin dose','','U/kg/hr')+number('insVolume','Final 0.9% NaCl preparation',250,'mL')+number('insPump','Prescribed pump rate',5,'mL/hr')+'</div><div id="insResult" aria-live="polite"></div>'+stock(100,'U/mL')+'''<p class="help">Assumed U-100 regular insulin; verify vial. Tiny stock volumes are shown with extra precision: use a validated measuring/dilution method when needed. Account for line adsorption/priming under your insulin protocol; displayed duration is nominal before priming/discard.</p><p class="help">Fixed-rate protocol: support glucose with dextrose as needed while treating ketosis; monitor BG frequently and follow the treating veterinarian’s adjustment/hold criteria if glucose falls too low. Monitor potassium, phosphorus, hydration and ketones. Do not stop insulin solely because glucose normalizes. The 0.045 feline alternative is a variable-rate starting approach, not the fixed-rate default. <a href="sources.html#insulin-fixed-source">Dose evidence & protocol limits</a>. <a href="dextrose.html">Dextrose preparation</a>.</p></section><details class="panel"><summary>Worked math</summary><p id="insMath"></p></details>'''
 else:
  body+='<p class="help">Assumed dose: <b>2 mg/kg/day</b> · daily dose scales to preparation duration. No SQ or loading dose included here; <a href="drugs.html">single SQ calculator remains in Drugs</a>.</p>'+stock(5,'mg/mL')+'<div class="reglan-grid">'
  for mode,title2,hours,volume in [('r12','12-hour syringe',12,12),('r6','6-hour syringe',6,6),('rBag','Fluid bag',None,'')]:
   body+=f'<section class="panel reglan-method"><h2>{title2}</h2>'+number(mode+'Dose','Selected daily dose',2,'mg/kg/day')+number(mode+'Volume','Final preparation volume',volume,'mL')
   if hours is None:body+=number(mode+'Pump','Fluid pump rate','','mL/hr')
   body+=f'<div id="{mode}Result" aria-live="polite"></div><details><summary>Math</summary><p id="{mode}Math"></p></details></section>'
  body+='</div><p id="reglanUndiluted" class="help"></p><p class="help">Reference 1–2 mg/kg/day IV CRI. Review GI obstruction/perforation/hemorrhage, renal/hepatic adjustment and interacting drugs. Verify diluent compatibility and stability locally. <a href="sources.html#drugs-source">Reglan references</a>.</p>'
 if id=='fentanyl':body=body.split('<p id="criNote"')[0]+(R/'scripts/fentanyl-workflow.html').read_text()
 if id=='insulin':body=body.replace('<p class="notice">',(R/'scripts/insulin-quick-chart.html').read_text()+'<p class="notice">',1)+'<details class="panel insulin-other-charts" id="insulin-other-charts"><summary>More info / Other charts</summary>'+(R/'scripts/insulin-bg-reference.html').read_text()+'</details>'+(R/'scripts/insulin-page-sources.html').read_text()
 if id!='fentanyl':body=body.replace('</h1>', '</h1>'+concentration_refs['notes'][id],1)
 if id=='fentanyl':body+='<section class="panel" id="fentanyl-practice-source"><h2>Practice source</h2><p><a href="https://www2.zoetis.com.au/content/_assets/Digital-Resource-Update/Guidelines/Perianaesthetic-Analgesic-Guidelines_DIGITAL.pdf">Perianaesthetic Analgesic Guidelines, fentanyl, page 22</a>: short duration supports infusion use; dog/cat dose references and adverse-effect precautions. This perianaesthetic reference is not a universal ER dose protocol. Best-use wording is a clinical summary.</p></section>'
 body+=concentration_refs['sources'][id]
 if id=='lidocaine':body=body.replace('<h1>Lidocaine CRI</h1>','<h1>Lidocaine CRI</h1>'+'<section id="catLidocaineWarning" class="cat-lidocaine-warning" role="alert" hidden><strong>CAT SELECTED — LIDOCAINE CRI DISABLED</strong><p>No feline dose, preparation volume or pump rate is provided. Cats are more sensitive to lidocaine’s cardiovascular and central nervous system effects. This tool does not support feline lidocaine CRIs.</p><p><b>All lidocaine CRI controls and rate selections are disabled.</b> Confirm the intended drug and patient species with the treating veterinarian. <a href="sources.html#cri-source">Clinical reference</a>.</p></section>')
 body=transform(id,body,number)
 if id!='norepinephrine':
  methods='<label>Preparation to print<select id="criPrintMethod"><option value="r12">Syringe A · starts at 12 hours</option><option value="r6">Syringe B · starts at 6 hours</option><option value="rBag">Fluid bag</option></select></label>' if id=='reglan' else ''
  bg=(R/'scripts/insulin-quick-chart.html').read_text().replace('<section class="panel insulin-quick-guide">','<div class="print-bg-guide">').replace('</section>','</div>') if id=='insulin' else ''
  foot='Clinical glucose/ketone/electrolyte monitoring and line priming follow the treating veterinarian’s protocol.' if id=='insulin' else 'Fixed preparation for every row. Reference math, not a dose escalation protocol or a maximum dose. Follow the prescribed dose and clinical goal.'
  if id=='lidocaine':foot+=' Upper workbook comparison rows are not endorsed as routine analgesic doses. Dogs only.'
  if id=='reglan':foot+=' Bag rate changes also change fluid delivery; follow the prescribed fluid plan.'
  print_card='<section class="panel cri-print" id="criPrintCard"><h2>Print reference</h2>'+methods+'<div class="chart-actions"><button type="button" id="criPrintButton" disabled>Print chart only</button><button type="button" id="criPrintToggle">Show / hide chart</button></div><p class="help" id="criPrintStatus"></p><div id="criPrintPreview" class="chart-preview" hidden><h3 id="criPrintTitle"></h3><p>Patient / cage: ____________________</p><p id="criPrintMeta"></p><p id="criPrintMix"></p><p id="criPrintRate"></p><p id="criPrintFormula"></p><table id="criPrintTable"></table>'+bg+'<p class="chart-footnote">'+foot+'</p></div></section>'
  anchor='<p id="reglanUndiluted"' if id=='reglan' else '<details class="panel"><summary>Worked math</summary>'
  body=body.replace(anchor,print_card+anchor,1)
 body+='<footer>Development draft · Workbook dose tables are references for review, not automatic treatment protocols. Independent clinical and browser validation pending.</footer></main><script src="cri-calc.js"></script><script src="cri-data.js"></script><script src="cri.js"></script><script src="navigation.js"></script><script src="patient-context.js"></script></body></html>'
 if id=='fentanyl':body=body.replace('src="cri.js"','src="fentanyl.js"')
 if id in ['lidocaine','ketamine','norepinephrine']:body=body.replace('src="cri.js"','src="cri-preparation.js"')
 if id!='norepinephrine':body=body.replace('<script src="navigation.js">','<script src="cri-print.js"></script><script src="navigation.js">',1)
 (D/f'cri-{id}.html').write_text(head+body)
# Same ordered expandable CRI group on every page.
for p in D.glob('*.html'):
 s=p.read_text();s=re.sub(r'<details class="nav-group cri-nav".*?</details>','',s,flags=re.S)
 links=''.join(f'<a href="cri-{id}.html"'+(' aria-current="page"' if p.name==f'cri-{id}.html' else '')+'>'+title+('<span class="current-page">Current</span>' if p.name==f'cri-{id}.html' else '')+'</a>' for id,title in items)
 group='<details class="nav-group cri-nav"'+(' open' if p.name.startswith('cri-') else '')+'><summary>CRIs</summary><div class="nav-children">'+links+'</div></details>'
 s=s.replace('<a href="sources.html"',group+'<a href="sources.html"',1)
 s=re.sub(r'(<a href="cri-lidocaine.html"[^>]*>)Lidocaine',r'\1<span class="lidocaine-nav-label">Lidocaine</span><span class="cat-restriction" hidden>Unavailable for cats</span>',s)
 p.write_text(s)

# Shared markup must stay consistent after regeneration.
runpy.run_path(str(R/"scripts/finalize-site.py"))
