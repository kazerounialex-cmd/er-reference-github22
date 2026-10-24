from pathlib import Path
import re
R=Path(__file__).resolve().parents[1]
def transform(id,body,number):
 if id in ['lidocaine','ketamine','norepinephrine']:
  best={
   'lidocaine':'Canine adjunct analgesia; reassess pain and cardiovascular status. Feline use is disabled in this tool.',
   'ketamine':'Adjunct to opioid analgesia when pain control is inadequate; reassess comfort and adverse effects.',
   'norepinephrine':'Titrate to blood pressure and perfusion after reassessing volume status; monitor the catheter site closely.'}
  refs={
   'lidocaine':'https://www.merckvetmanual.com/therapeutics/pain-assessment-and-management/local-and-regional-analgesic-techniques-in-animals',
   'ketamine':'https://www.merckvetmanual.com/emergency-medicine-and-critical-care/monitoring-the-critically-ill-small-animal/monitoring-the-critically-ill-small-animal-using-the-rule-of-20',
   'norepinephrine':'https://www.merckvetmanual.com/therapeutics/fluid-therapy/assessment-of-resuscitation-efforts-in-animals'}
  prefix=body.split('<p id="criNote"')[0]
  # Keep warning and compact dose reference visible; move concentration detail below preparation.
  prefix=re.sub(r'<section class="panel concentration-reference">.*?</section>','',prefix,flags=re.S)
  stock={'lidocaine':20,'ketamine':100,'norepinephrine':1000}[id]
  unit={'lidocaine':'mcg/kg/min','ketamine':'mg/kg/hr','norepinephrine':'mcg/kg/min'}[id]
  dose={'lidocaine':20,'ketamine':.1,'norepinephrine':.05}[id]
  dose_note={'lidocaine':'Canine analgesic reference: 20–50 mcg/kg/min; select the prescribed dose.', 'ketamine':'Workbook analgesic options: 0.1–0.6 mg/kg/hr; select the prescribed dose.', 'norepinephrine':'Start at 0.05–0.1 mcg/kg/min; titrate to blood-pressure response.'}[id]
  body=prefix+f'<p class="help best-use"><b>Best use:</b> {best[id]} <a href="#practice-source">Veterinary reference</a>.</p><section class="panel"><h2>Prepare an infusion</h2><p class="help">{dose_note}</p><div class="cri-controls">'+number('criDose','Selected dose',dose,unit)+number('prepHours','Run time',2 if id=='norepinephrine' else 6,'hours')+number('prepPump','Prescribed pump rate',5 if id=='norepinephrine' else 1,'mL/hr')+number('prepCapacity','Syringe capacity',12,'mL')+'</div>'
  if id=='norepinephrine':
   old=number('prepHours','Run time',2,'hours')+number('prepPump','Prescribed pump rate',5,'mL/hr')+number('prepCapacity','Syringe capacity',12,'mL')
   body=body.replace(old,'<label>Preparation method<select id="prepMode"><option value="target">Prepare to a target pump rate</option><option value="known" selected>Use a known concentration</option></select></label>'+number('targetPump','Target preparation pump rate',1,'mL/hr')+number('prepConcentration','Prepared concentration',15,'mcg/mL')+number('prepVolume','Final syringe volume',12,'mL'))
  if id=='norepinephrine':body=body.replace('id="prepConcentration"','aria-describedby="norepiConcentrationError" id="prepConcentration"',1)+'<small id="norepiConcentrationError" class="concentration-error" role="alert" hidden></small>'
  if id=='norepinephrine':body+='<fieldset class="access-choice"><legend>Access · workbook guardrails, not validated maximums</legend><label><input type="radio" name="criAccess" value="peripheral" checked> Peripheral workbook profile · ≤16 mcg/mL</label><label><input type="radio" name="criAccess" value="central"> Central workbook profile · ≤64 mcg/mL</label></fieldset>'
  body+='<div id="prepResult" aria-live="polite"></div><p class="help">Run time changes the amount prepared, not the prescribed dose. Changing the pump input calculates a new preparation; it does not titrate an existing syringe. Duration is nominal before priming/discard.</p><details class="stock-settings"><summary>Stock concentration · locked by default</summary>'+number('criStock','Vial stock',stock,'mg/mL' if id!='norepinephrine' else 'mcg/mL')+'<button type="button" id="criLock">Edit concentration</button></details></section><details class="panel"><summary>Worked math</summary><p id="prepMath"></p></details>'
  if id=='norepinephrine':body=body.replace('Run time changes the amount prepared, not the prescribed dose. Changing the pump input calculates a new preparation; it does not titrate an existing syringe. Duration is nominal before priming/discard.','Target-rate mode calculates concentration for a NEW preparation at the selected dose. Known-concentration mode lets you enter the concentration of a prepared syringe. Run time is calculated. Do not remake an existing syringe whenever the dose changes: keep its concentration fixed and titrate its pump rate. Duration is nominal before priming/discard.')
  if id=='norepinephrine':body=body.replace('<details class="panel"><summary>Worked math</summary>',(R/'scripts/norepi-practice-note.html').read_text()+'<details class="panel"><summary>Worked math</summary>',1)
  if id=='norepinephrine':body=body.replace('<section class="panel" id="norepi-practice">',(R/'scripts/norepi-titration-chart.html').read_text()+'<section class="panel" id="norepi-practice">',1)
  # Extra reference material, all below working inputs/results.
  import json
  data=json.loads((R/'scripts/cri-concentration-notes.json').read_text())
  body+='<details class="panel"><summary>More info · concentration reference</summary>'+data['notes'][id]+'</details>'
  body+=f'<section class="panel" id="practice-source"><h2>Practice source</h2><p><a href="{refs[id]}">Merck Veterinary Manual · veterinary clinical reference</a>. Best-use wording is a clinical summary, not a complete treatment protocol.</p></section>'+data['sources'][id]
 elif id=='insulin':
  # Existing BG chart and clinical defaults retained.
  body=body.replace('<p class="notice">','<p class="help best-use"><b>Best use:</b> Fixed-rate DKA insulin with dextrose support as needed; follow glucose, ketones, hydration and electrolytes. <a href="#insulin-page-sources">Veterinary sources</a>.</p><p class="notice">',1)
  body=body.replace(number('insVolume','Final 0.9% NaCl preparation',250,'mL'),number('insHours','Preparation run time',50,'hours')+number('insCapacity','Container capacity',250,'mL')+'<input id="insVolume" type="number" value="250" hidden>')
  body=re.sub(r'(<h1>Insulin CRI</h1>)(<section class="panel concentration-reference">.*?</section>)',r'\1',body,flags=re.S)
  # Collapse secondary presets rather than the selected-dose input.
  body=body.replace('<div class="cri-presets">','<details><summary>Alternative dosing presets</summary><div class="cri-presets">',1).replace('</div><div class="cri-controls">','</div></details><div class="cri-controls">',1)
  body=body.replace('displayed duration is nominal before priming/discard.','displayed duration is nominal before priming/discard. Run time sets preparation quantity, not how long DKA should be treated.')
 elif id=='reglan':
  body=body.replace('<p class="help">Assumed dose:', '<p class="help best-use"><b>Best use:</b> Prokinetic/antiemetic support when appropriate; exclude GI obstruction, perforation or hemorrhage. <a href="sources.html#drugs-source">Veterinary reference</a>.</p><p class="help">Assumed dose:',1)
  for mode,hours in [('r12',12),('r6',6)]:
   body=body.replace(number(mode+'Volume','Final preparation volume',hours,'mL'),number(mode+'Hours','Run time',hours,'hours')+number(mode+'Pump','Prescribed pump rate',1,'mL/hr')+number(mode+'Capacity','Syringe capacity',12,'mL')+f'<input id="{mode}Volume" type="number" value="{hours}" hidden>')
  body=body.replace('<h2>12-hour syringe</h2>','<h2>Syringe · starts at 12 hours</h2>').replace('<h2>6-hour syringe</h2>','<h2>Syringe · starts at 6 hours</h2>')
  body=re.sub(r'(<h1>Reglan CRI</h1>)(<section class="panel concentration-reference">.*?</section>)',r'\1',body,flags=re.S)
 return body
