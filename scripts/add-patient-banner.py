from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
BANNER='''<header class="patient-header"><a class="brand" href="index.html">ER<span>REFERENCE</span></a><div class="master-patient" role="group" aria-label="Shared patient"><label>Species<select id="masterSpecies"><option value="">Select species</option><option value="dog">Dog</option><option value="cat">Cat</option></select></label><label>Weight · kg<input id="masterWeight" type="number" inputmode="decimal" min="0.001" step="any" placeholder="Patient kg"></label><button type="button" id="clearPatient">New patient / clear all</button><small id="patientSessionNote">Shared patient · this browser tab only</small></div></header>'''
for p in (ROOT/'dist').glob('*.html'):
 s=p.read_text();s=re.sub(r'<header[^>]*>.*?</header>',lambda m:BANNER,s,count=1,flags=re.S)
 if 'src="patient-context.js"' not in s:s=s.replace('</body>','<script src="patient-context.js"></script></body>')
 p.write_text(s)
