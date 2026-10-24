"""Keep the conditional peripheral concentration warning in generated pages."""
from pathlib import Path
import runpy
ns=runpy.run_path(str(Path(__file__).with_name('compact-electrolytes.py')));P,N=ns['P'],ns['N']
p=Path(__file__).resolve().parents[1]/'dist/potassium.html';r=P(p.read_text()).root
if not r.all(lambda n:n.attrs.get('id')=='kPeripheralWarning'):
 panel=r.byid('kResults');notice=P('''<div id="kPeripheralWarning" class="k-peripheral-warning" role="alert" aria-atomic="true" hidden><strong id="kPeripheralHeading"></strong><p id="kPeripheralMessage"></p><p class="help">Peripheral concentration reference, not the dose-rate limit. Added KCl only; native carrier potassium is excluded. <a href="https://www.vin.com/apputil/project/defaultadv1.aspx?authorid=&amp;catid=&amp;id=8506449&amp;meta=&amp;pid=20539">WSAVA peripheral reference</a> · <a href="https://todaysveterinarypractice.com/internal-medicine/evaluation-and-management-of-the-hypokalemic-patient/">Alternative veterinary dilution guidance</a></p></div>''').root.children[0]
 primary=panel.one(lambda n:n.cls('k-primary')) if panel.all(lambda n:n.cls('k-primary')) else r.byid('kStatus')
 # Place immediately before the primary result so the warning is visible in context.
 target=r.byid('kAdd')
 while target.parent is not panel:target=target.parent
 panel.add(notice,panel.children.index(target))
 label=r.byid('kConcentration').parent.one(lambda n:n.tag=='span');label.children=['Added KCl concentration · mEq/mL']
# Use a small monitoring note beside the concentration, rather than an alert
# above the main preparation result. Apply to existing and regenerated pages.
box=r.byid('kPeripheralWarning');box.attrs['role']='status'
concentration=r.byid('kConcentration');line=concentration.parent
line.parent.add(box,line.parent.children.index(line)+1)
if not box.all(lambda n:n.tag=='details'):
 help=box.one(lambda n:n.tag=='p' and n.cls('help'))
 details=box.add(N('details',[('class','k-monitor-sources')]))
 details.add(N('summary',children=['Reference & context']))
 details.add(help)
 help.children[0]='Veterinary concentration recommendations vary; 0.06 mEq/mL is a conservative peripheral irritation reference, not a universal toxicity cutoff. Added KCl only; native carrier potassium is excluded. '
p.write_text(r.render())
