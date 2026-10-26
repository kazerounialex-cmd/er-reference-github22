"""Recreate Fluids!C3:V60 using the workbook's retained cell positions and dimensions."""
from pathlib import Path
import json,re,html,runpy
R=Path(__file__).resolve().parents[1];D=R/'dist'
a=json.loads((R/'scripts/original-sheet-layout.json').read_text())
def xy(addr):
 m=re.fullmatch(r'([A-Z]+)(\d+)',addr);c=0
 for ch in m[1]:c=c*26+ord(ch)-64
 return c,int(m[2])
def addr(c,r):
 t=''
 while c:c,k=divmod(c-1,26);t=chr(k+65)+t
 return t+str(r)
# Inputs keep their original sheet positions; shared weight cells are live outputs.
fields={
'C7':('dogDehydration',5,'% dehydration · dog'), 'F8':('dogLosses',0,'Ongoing losses · dog · mL/hr'),'E9':('dogBolus',0,'Bolus already given · dog · mL'),
'C17':('catDehydration',3,'% dehydration · cat'),'F18':('catLosses',0,'Ongoing losses · cat · mL/hr'),'E19':('catBolus',0,'Bolus already given · cat · mL'),
'R4':('kVolume',96,'KCl final fluid volume · mL'),'T4':('kRate',12,'KCl fluid rate · mL/hr'),'S3':('kStock',2,'KCl stock · mEq/mL'),
'S14':('mgStock',4,'MgSO4 stock · mEq/mL'),'D27':('naCurrent',177,'Patient sodium · mEq/L'),'D28':('naTarget',165,'Target sodium · mEq/L'),'H27':('waterHours',24,'Custom free-water correction · hours'),
'D33':('naVolume',1000,'Sodium final fluid volume · mL'),'D34':('naMixTarget',140,'Sodium target fluid concentration · mEq/L'),
'M29':('phosStock',3,'KPhos stock phosphate · mmol/mL'),'M30':('phosKStock',4.4,'KPhos stock potassium · mEq/mL'),'O32':('phosDose',.01,'Selected phosphate dose · mmol/kg/hr'),'O33':('phosRate',17,'KPhos fluid rate · mL/hr'),'O34':('phosVolume',100,'KPhos final fluid volume · mL'),
'M40':('dextroseVolume',450,'Dextrose target final volume · mL'),'D49':('hypoVolume',1000,'Hyponatremia fluid final volume · mL'),'D50':('hypoTarget',115,'Hyponatremia target fluid sodium · mEq/L'),'G48':('glucoseNa',154,'Sodium before glucose correction · mEq/L'),'G49':('glucose',504,'Blood glucose · mg/dL'),'L58':('neDose',.05,'Norepinephrine dose · mcg/kg/min'),'S57':('neHours',4,'Norepinephrine run time · hours')}
outputs='D4 D14 M4 M14 D26 M31 O31 M46 P57 E6 F6 E7 F7 E8 F10 F11 E16 F16 E17 F17 E18 F20 V4 G26 H26 G27 G28 H28 H36 H38 H40 D45 E45 D53 D54 D55 G50 H52 R25 R28 R29 R32 R34 M32 M33 M34 P17 S17 P19 S19 Q40 S40 Q41 S41 M48 M49 M51 N58 P58 S58 T58 D60 E60'.split()
for row in range(6,11):outputs += [c+str(row) for c in ['N','O','Q','R','T','U']]
# Explain/fix legacy labels while retaining their cells. No cached spreadsheet results are served.
replace={
'C3':'DOG · FLUID PLAN','D3':'132 × kg⁰·⁷⁵ / day','C13':'CAT · FLUID PLAN','D13':'80 × kg⁰·⁷⁵ / day','P3':'KCl stock (mEq/mL)','U4':'Bag hours','T5':'KCl to add (mL)','G8':'Enter measured/estimated ongoing losses in mL/hr.','G10':'mL/hr · deficit over 24 hr','G11':'mL/hr · deficit over 12 hr','G17':'Deficit spread over 24 hr','G18':'Enter ongoing losses in mL/hr.','M12':'Other K is entered in the toolbar above.','L15':'Mg reference: 1.5–2.5 mg/dL; use lab range.','T17':'mL stock, over 24 hr','U17':'Dilute before CRI','T19':'mL stock, over 24 hr','U19':'Dilute before CRI','L24':'PHOSPHATE · KPhos','Q27':'K contribution below must be considered with concurrent KCl.','T28':'mEq/kg/hr from KPhos','M35':'(dose × kg ÷ stock) × bag hours','P35':'KPhos K contribution shown above','S35':'','G31':'Final-volume mixing','H31':'Remove carrier volume, replace with stock.','D36':'7.2% NaCl','D38':'7.2% NaCl','D40':'7.2% NaCl','H35':'7.2% NaCl to add (mL)','H37':'7.2% NaCl to add (mL)','H39':'7.2% NaCl to add (mL)','F41':'Sodium target must lie between base and stock.','L44':'SMALL-PATIENT BLOOD COLLECTION','L45':'Workbook guide; clinician-approved limits apply.','L47':'Sick / geriatric / obese: 15% reduction','O50':'Per rolling 24 hr','L53':'TBV: 60 mL/kg, reduced 15% for this workbook guide.','C47':'FLUID FOR HYPONATREMIA','G47':'GLUCOSE-CORRECTED SODIUM','L57':'NOREPINEPHRINE · 1 mL/hr preparation','M59':'Dose in mcg/kg/min; titrate per clinician.','Q59':'12 mL syringe capacity','L60':'Access','N60':'Peripheral ≤16 / central ≤64 mcg/mL guardrails','S56':'Norepi (mL)','T56':'Diluent (mL)','L56':'Norepi stock (mcg/mL)','C22':'','H22':'Fluid planning: current site arithmetic','F43':'mL','F44':'mL','F27':'Correction hours · chronic ≤0.5 mEq/L/hr','F29':'0.6 × kg × (patient Na / target Na − 1)','F30':'(patient Na − target Na) / 0.5','F52':'Corrected sodium','M39':'Final volume (mL)','O39':'Target dextrose (%)','Q39':'D50 to add (mL)','S39':'Diluent (mL)','P46':'Date','Q46':'Time','R46':'Draw (mL)','S46':'Site','T46':'Reason','F35':'Carrier Na (mEq/L)','F37':'Carrier Na (mEq/L)','F39':'Carrier Na (mEq/L)'}
replace.update({'G31':'','H31':'','G32':'','H32':'','G33':'','H33':'','G34':'','D35':'7.2% NaCl stock','D37':'7.2% NaCl stock','D39':'7.2% NaCl stock','E35':'Stock Na','E37':'Stock Na','E39':'Stock Na','F35':'Carrier Na (mEq/L)','F37':'Carrier Na (mEq/L)','F39':'Carrier Na (mEq/L)','H35':'7.2% to add (mL)','H37':'7.2% to add (mL)','H39':'7.2% to add (mL)','F27':'Hours (≤0.5/hr)','M35':'(dose × kg / stock) × bag hours','F41':'Remove carrier; replace with 7.2% NaCl.'})
cells=a['cells'];cells.update(replace)
# Other editable controls use previously blank space, outside the original calculator cells.
fields['M56']=('neStock',1000,'Norepinephrine stock · mcg/mL')
merges={};covered=set()
for item in a['merges']:
 start,end=item.split(':');c,r=xy(start);ce,re_=xy(end)
 if c<3 or ce>22 or r<3:continue
 merges[start]=(ce-c+1,re_-r+1)
 for rr in range(r,re_+1):
  for cc in range(c,ce+1):
   if (cc,rr)!=(c,r):covered.add(addr(cc,rr))
for cell,span in {'L3':4,'L13':5,'L24':5,'L38':4,'L57':3,'L15':10,'M12':10,'F29':4,'F30':4,'M35':3,'P35':7,'F41':4,'L53':11,'L54':11,'G54':3,'M59':4,'Q59':4,'N60':9,'M19':2,'M17':2}.items():
    merges[cell]=(span,1)
    c,r=xy(cell)
    for cc in range(c+1,c+span):covered.add(addr(cc,r))
heads={'C3','C13','L3','L13','C24','L24','C31','L38','L44','C47','G47','L57'}
stock={'kStock','mgStock','phosStock','phosKStock','neStock'}
items=[]
for row in range(3,61):
 for col in range(3,23):
  cell=addr(col,row)
  if cell in covered:continue
  text=cells.get(cell,'');span,rows=merges.get(cell,(1,1))
  content='';classes=['os-cell'];hint=''
  if cell in heads:classes+=['os-heading']
  if cell in fields:
   name,value,label=fields[cell];readonly=' readonly' if name in stock else ''
   content=f'<input type="number" min="0" step="any" id="os-{name}" value="{value}" aria-label="{html.escape(label)}"{readonly}'+(' data-stock="true"' if name in stock else '')+'>'
   classes+=['os-input-cell']
  elif cell=='M60':
   content='<select id="os-neAccess" aria-label="Norepinephrine vascular access"><option value="peripheral">Peripheral</option><option value="central">Central</option></select>'
  elif cell in outputs:
   content=f'<output id="os-out-{cell}" aria-label="Calculated cell {cell}">—</output>';classes+=['os-output']
   if cell in ['R28','R29','F10','F11','F20','M49','M51'] or (cell[0] in 'TU' and 6<=row<=10):classes+=['os-primary']
  elif 47<=row<=52 and col>=16:
   label={16:'Date',17:'Time',18:'Blood removed (mL)',19:'Draw site',20:'Reason',21:'Reason'}[col] if col<=21 else 'Notes'
   if col==21:continue
   if col<=20:
    content=f'<input class="os-log" type="'+('number' if col==18 else 'text')+f'" min="0" step="any" aria-label="Blood log row {row-46}: {label}">'
  elif text:content=html.escape(text)
  if not content:continue
  if text.startswith('https:'):content='<a href="potassium.html">KCl detail & sources</a>'
  if cell=='H22':content='<a href="index.html">Fluid Planner & loss guidance</a>'
  items.append(f'<div class="{" ".join(classes)}" data-cell="{cell}" title="{html.escape(text,quote=True)}" style="grid-column:{col-2} / span {span};grid-row:{row-2} / span {rows}">{content}</div>')
# Per-section status messages stay outside the fixed cell grid to preserve spacing.
prefix=(D/'index.html').read_text().split('<main id="main-content"')[0]
prefix=prefix.replace('<title>Fluid Planner', '<title>Original Sheet').replace('— Fluid Planner','— Original Sheet').replace('data-tool="fluids"','data-tool="original"')
prefix=re.sub(r' aria-current="page"','',prefix).replace('<span class="current-page">Current</span>','')
cols=' '.join(f'{w*7+5:.2f}px' for w in a['columns'][2:22]);heights=' '.join(f'{max(20,a["rowHeights"].get(str(row),15)*4/3):.2f}px' for row in range(3,61))
body='''<main id="main-content" class="original-main"><div class="eyebrow">WHERE WE STARTED</div><h1>Original Sheet</h1><p class="help">Original Fluids-tab layout and spacing, with current site calculations. Use the shared patient above. Only the selected species’ fluid block calculates; other sections use that same weight.</p><p class="help">Workbook reference calculations use unrounded prescribed inputs. Displayed values are rounded; verify the delivered dose from rounded preparation quantities in the dedicated calculator before preparing medication.</p><div hidden><input id="weight" type="number"><select id="species"><option value=""></option><option>Dog</option><option>Cat</option></select></div>
<div class="os-toolbar"><label><input id="os-fit" type="checkbox"> Fit sheet to width</label><button id="os-stocks" type="button" aria-pressed="false">Unlock stock concentrations</button><label>Other supplemental K (mEq/kg/hr)<input id="os-otherK" type="number" min="0" step="any" value="0"></label><label><input id="os-includePhos" type="checkbox"> Include this KPhos preparation’s K in KCl calculations</label><a href="sources.html">Sources</a></div>
<p class="help">Blue outlined cells are editable; stock cells require unlocking. KCl/KPhos use final volume: remove the additive volume from the carrier before adding it. The KCl table excludes native carrier potassium. <a href="cri-norepinephrine.html">Norepinephrine CRI detail</a> · <a href="blood-collection.html">Printable blood collection chart</a></p>
<div id="os-viewport" class="os-viewport" tabindex="0" role="region" aria-label="Original Fluids worksheet; scroll horizontally or use Fit sheet to width"><div id="os-grid" class="os-grid" style="grid-template-columns:COLS;grid-template-rows:ROWS">ITEMS</div></div>
<section class="panel os-messages"><h2>Calculation notes / incomplete sections</h2><ul id="os-errors" aria-live="polite"></ul><p class="help">The original sheet’s 12-hour dog plan divided maintenance and ongoing losses by 12 as well; this page changes only the deficit replacement time, matching the current Fluid Planner. Impossible sodium mixtures produce a message rather than a negative additive. The norepinephrine dose unit is mcg/kg/min. Blood log entries are temporary handwritten-style records, not rolling totals; Clear patient clears these entries.</p></section><footer>Layout: original Fluids!C3:V60. Clinical context and detailed preparation controls remain on the dedicated pages.</footer></main><script src="calc.js"></script><script src="electrolyte-calc.js"></script><script src="blood-calc.js"></script><script src="cri-calc.js"></script><script src="original-sheet-calc.js"></script><script src="original-sheet.js"></script><script src="navigation.js"></script><script src="patient-context.js"></script></body></html>'''
body=body.replace('COLS',cols).replace('ROWS',heights).replace('ITEMS',''.join(items))
(D/'original-sheet.html').write_text(prefix+body)
runpy.run_path(str(R/'scripts/finalize-site.py'))
