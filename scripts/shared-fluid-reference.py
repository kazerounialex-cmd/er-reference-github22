"""Shared banner and opt-out fluid-rate links, retained after regeneration."""
from pathlib import Path
import runpy
ns=runpy.run_path(str(Path(__file__).with_name('compact-electrolytes.py')));P,N=ns['P'],ns['N']
for path in (Path(__file__).resolve().parents[1]/'dist').glob('*.html'):
 r=P(path.read_text()).root
 if not r.all(lambda n:n.attrs.get('id')=='sharedFluidRate'):
  header=r.one(lambda n:n.tag=='header')
  header.add(P('''<section class="shared-fluid" aria-label="Shared fluid plan"><div class="shared-fluid-top"><label for="sharedFluidRate">Fluid rate <span>mL/hr</span></label><input id="sharedFluidRate" type="number" min=".001" step="any" placeholder="From planner / enter rate" aria-describedby="sharedFluidStatus"><button type="button" id="useCalculatedFluid">Use calculated</button><a href="index.html">Fluid Planner ↗</a></div><div id="sharedFluidStatus" class="shared-fluid-status" role="status"></div><div id="sharedFluidBreakdown" class="shared-fluid-breakdown"></div><div id="sharedFluidAmounts" class="shared-fluid-amounts"></div></section>''').root.children[0])
 for id in ['kRate','pRate']:
  if not r.all(lambda n:n.attrs.get('id')==id):continue
  if r.all(lambda n:n.attrs.get('id')==id+'UseShared'):continue
  label=r.byid(id).parent
  label.add(N('span',[('class','shared-rate-controls')],children=[N('small',[('id',id+'LinkStatus'),('role','status')]),N('button',[('id',id+'UseShared'),('type','button')],['Use shared rate'])]))
 # Reuse pure fluid arithmetic on every page; initialize sharing after patient restore.
 scripts=r.all(lambda n:n.tag=='script')
 if not any(n.attrs.get('src')=='calc.js' for n in scripts):
  first=scripts[0];first.parent.add(N('script',[('src','calc.js')]),first.parent.children.index(first)+1)
 if not any(n.attrs.get('src')=='fluid-reference.js' for n in scripts):
  patient=r.one(lambda n:n.tag=='script' and n.attrs.get('src')=='patient-context.js');patient.parent.add(N('script',[('src','fluid-reference.js')]),patient.parent.children.index(patient)+1)
 path.write_text(r.render())
