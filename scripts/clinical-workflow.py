"""Idempotent clinical workflow markup; keeps generated pages in agreement."""
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
LOCAL_PANEL='''<section class="panel" id="local-anesthetic-review"><h2>Local-anesthetic exposure review</h2><p class="help">Displayed doses are workbook references, not validated species-specific maximum doses. Enter all prior exposure during the clinically relevant interval, including other routes and formulations. Verify the interval with the treating clinician; no elimination or recovery is assumed.</p><div class="grid"><label>Prior lidocaine · mg total (enter 0 if none)<input id="priorLidocaine" type="number" min="0" step="any"></label><label>Prior bupivacaine · mg total (enter 0 if none)<input id="priorBupivacaine" type="number" min="0" step="any"></label></div><p id="localExposureResult" class="dose-caution" role="status"></p><p class="help"><b>Caution:</b> Combining local anesthetics may cause additive toxicity. Being below each individual reference does not establish a safe combination. Current calculations do not enforce a species-specific maximum. <a href="sources.html#local-anesthetic-review-source">Evidence and approval status →</a></p></section>'''
CONCURRENT_PANEL='''<section class="panel" id="concurrentPotassium"><h2>Concurrent supplemental potassium</h2><p class="help">Explicitly select planned preparations confirmed as concurrently active. Opening a page does not activate it. Reconfirm inclusion after changing preparation inputs, patient or linked rate; this is not a medication administration record.</p><div class="concurrent-controls"><label><input id="includeKcl" type="checkbox"> Include KCl preparation</label><label><input id="includeKphos" type="checkbox"> Include KPhos preparation</label><label>Infusion arrangement<select id="concurrentArrangement"><option value="separate">Separate infusions</option><option value="same">Same bag — requires separate review</option></select></label><label><input id="allPotassiumSources" type="checkbox"> I have included all supplemental potassium sources</label></div><p id="concurrentContributions"></p><strong id="concurrentTotal">—</strong><p id="concurrentStatus" role="status"></p><p class="help">Assumes native carrier-fluid potassium is excluded, matching the existing preparation calculation. Each selected contribution is counted once; manually entered separate-K fields are checked against the counterpart and are not added again. This summary does not establish physical compatibility. <a href="potassium.html">KCl →</a> · <a href="phosphate.html">KPhos →</a> · <a href="sources.html#potassium-source">Sources →</a></p></section>'''
SOURCE_PANEL='''<section class="panel" id="local-anesthetic-review-source"><h2>Local-anesthetic limits · approval status</h2><p>The existing workbook displays local/regional lidocaine 2–4 mg/kg and bupivacaine 1–2 mg/kg. These are reference ranges, not approved species-specific maximum doses. The interface warns outside those ranges without imposing new limits. No safe combined-exposure ceiling is calculated.</p><p>Species, route, formulation, previous doses and their timing require clinician review. The existing feline lidocaine CRI prohibition remains specific to CRI and is not applied to local/regional use.</p><p>Further source review is required before enabling new limits: <a href="https://www.aaha.org/resources/2020-aaha-anesthesia-and-monitoring-guidelines-for-dogs-and-cats/">2020 AAHA Anesthesia and Monitoring Guidelines for Dogs and Cats</a> and <a href="https://www.merckvetmanual.com/management-and-nutrition/pain-assessment-and-management/local-and-regional-analgesic-techniques-in-animals">Merck Veterinary Manual · Local and Regional Analgesic Techniques in Animals</a>. Species-specific maximum doses require source review and clinician approval before activation.</p></section>'''
ASSUMPTIONS={
 'index.html':('id="status"', 'Assumes dog maintenance 132 × kg⁰·⁷⁵ or cat maintenance 80 × kg⁰·⁷⁵ mL/day; initial dehydration estimate with credited boluses subtracted once. Individualize for age and clinical condition.', 'fluid-source'),
 'potassium.html':('id="kStatus"', 'Assumes supplemental potassium only; native carrier-fluid potassium is excluded. Verify separate infusions and actual stock concentration.', 'potassium-source'),
 'phosphate.html':('id="pKHeroStatus"', 'Assumes the entered phosphate and potassium stock concentrations are correct; native carrier-fluid potassium is excluded. KPhos contributes potassium even when phosphate is the treatment target.', 'phosphate-source'),
 'sodium.html':('id="nWater"', 'Assumes total body water = 0.6 × body weight in kg (liters). This starting-plan estimate does not predict serial measured sodium; account for other inputs and losses.', 'sodium-source'),
 'blood-collection.html':('id="bStatus"', 'Assumes the entered blood-volume estimate and reduction apply to this patient. Default workbook method: 60 mL/kg reduced by 15%; collection guides are not universal safe limits.', 'blood-collection-source'),
 'chocolate.html':('id="chocStatus"', 'Assumes estimated total methylxanthine concentrations, including a rough cocoa-% model; products and recipes vary. Canine interpretation only.', 'chocolate-source'),
}
for page in (ROOT/'dist').glob('*.html'):
 text=page.read_text()
 text=text.replace('id="clearPatient">Clear patient</button>','id="clearPatient">New patient / clear all</button>')
 if page.name=='drugs.html' and 'id="local-anesthetic-review"' not in text:
  text=text.replace('</main>',LOCAL_PANEL+'</main>',1)
 if page.name=='sources.html' and 'id="local-anesthetic-review-source"' not in text:
  text=text.replace('</main>',SOURCE_PANEL+'</main>',1)
 if page.name in ['potassium.html','phosphate.html'] and 'id="concurrentPotassium"' not in text:
  text=text.replace('</main>',CONCURRENT_PANEL+'</main>',1)
  text=text.replace('</body>','<script src="concurrent-potassium.js"></script></body>')
 if page.name in ASSUMPTIONS and 'id="resultAssumptions"' not in text:
  marker,note,source=ASSUMPTIONS[page.name]
  # Insert directly after the result/status element when present.
  match=re.search(r'<(?:p|div)[^>]*'+re.escape(marker)+r'[^>]*>.*?</(?:p|div)>',text,re.S)
  if match:
   text=text[:match.end()]+f'<p id="resultAssumptions" class="help result-assumptions">{note} <a href="sources.html#{source}">Details &amp; sources →</a></p>'+text[match.end():]
 if page.name=='index.html':
  text=text.replace('type="reset">Clear planner inputs</button>','type="button" data-clear-all>New patient / clear all</button>')
 if page.name=='potassium.html' and 'id="kPump"' not in text:
  ordered=[]
  for id,label in [('kDelivered','Delivers supplemental K'),('kHours','Lasts')]:
   match=re.search(r'<div class="line"><span>[^<]*</span><b id="'+id+r'">.*?</b></div>',text)
   if match:
    ordered.append(re.sub(r'<span>[^<]*</span>','<span>'+label+'</span>',match[0]))
    text=text[:match.start()]+text[match.end():]
  anchor=re.search(r'<p id="kStatus"',text)
  if anchor:text=text[:anchor.start()]+'<div class="line clinical-run"><span>Run at</span><b id="kPump">—</b></div>'+''.join(ordered)+text[anchor.start():]
  text=text.replace('<div class="rate-label">KCL STOCK TO ADD</div>','<div class="rate-label">PREPARE · KCL STOCK TO ADD</div>')
 page.write_text(text)
