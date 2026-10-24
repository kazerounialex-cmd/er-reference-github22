"""Compact presentation adapter; preserves calculation IDs, input values and clinical content."""
from pathlib import Path
from html.parser import HTMLParser
from html import escape
R=Path(__file__).resolve().parents[1]
VOID={'input','meta','link','br','hr','img','source','col','area','base','embed','param','track','wbr'}
class N:
 def __init__(self,tag='',attrs=None,children=None):self.tag=tag;self.attrs=dict(attrs or []);self.children=children or [];self.parent=None
 def add(self,node,pos=None):
  if isinstance(node,N):
   if node.parent:node.parent.children.remove(node)
   node.parent=self
  if pos is None:self.children.append(node)
  else:self.children.insert(pos,node)
  return node
 def all(self,fn):
  out=[self] if fn(self) else []
  for c in self.children:
   if isinstance(c,N):out+=c.all(fn)
  return out
 def one(self,fn):return self.all(fn)[0]
 def byid(self,id):return self.one(lambda n:n.attrs.get('id')==id)
 def cls(self,c):return c in self.attrs.get('class','').split()
 def addcls(self,c):self.attrs['class']=' '.join(dict.fromkeys(self.attrs.get('class','').split()+c.split()))
 def remove(self):self.parent.children.remove(self);self.parent=None
 def render(self):
  if not self.tag:return ''.join(c.render() if isinstance(c,N) else c for c in self.children)
  attrs=''.join(' '+k+('="'+escape(v,quote=True)+'"' if v is not None else '') for k,v in self.attrs.items())
  return '<'+self.tag+attrs+'>'+('' if self.tag in VOID else ''.join(c.render() if isinstance(c,N) else c for c in self.children)+'</'+self.tag+'>')
class P(HTMLParser):
 def __init__(self,s):super().__init__(convert_charrefs=False);self.root=N();self.stack=[self.root];self.feed(s)
 def handle_starttag(self,t,a):
  n=self.stack[-1].add(N(t,a))
  if t not in VOID:self.stack.append(n)
 def handle_endtag(self,t):
  for i in range(len(self.stack)-1,0,-1):
   if self.stack[i].tag==t:self.stack=self.stack[:i];break
 def handle_data(self,s):self.stack[-1].add(s)
 def handle_entityref(self,s):self.handle_data('&'+s+';')
 def handle_charref(self,s):self.handle_data('&#'+s+';')
 def handle_decl(self,s):self.handle_data('<!'+s+'>')
 def handle_comment(self,s):self.handle_data('<!--'+s+'-->')
def text(n,s):n.children=[s]
def heading(n,s):text(n.one(lambda x:x.tag=='h2'),s)
def panel(n):return n.one(lambda x:x.tag=='section' and x.cls('panel'))
def hide_weight(root,id):
 label=root.byid(id).parent
 while label.tag!='label':label=label.parent
 label.attrs['hidden']=None
 label.remove();root.byid('main-content').add(label)
def detailize(node,summary):
 node.tag='details';h=node.one(lambda x:x.tag=='h2');h.tag='summary';text(h,summary)
def setintro(main,value):
 items=main.all(lambda n:n.tag=='p' and n.cls('intro'))
 if items:text(items[0],value)
def condense_phos(root):
 inputs=root.one(lambda n:n.cls('compact-inputs'))
 if inputs.all(lambda n:n.cls('phosphate-options')):return
 options=inputs.byid('pMethod').parent.parent
 d=N('details',[('class','preparation-settings phosphate-options')]);d.add(N('summary',children=['Preparation method & separate potassium']))
 index=inputs.children.index(options);d.add(options);inputs.add(d,index)
def finish_phos(root):
 inputs=root.one(lambda n:n.cls('compact-inputs'))
 if inputs.all(lambda n:n.cls('compact-settings-row')):return
 options=inputs.one(lambda n:n.cls('phosphate-options'))
 row=N('div',[('class','compact-settings-row')]);inputs.add(row)
 row.add(options);row.add(inputs.one(lambda n:n.cls('stock-settings')))
 for para in [n for n in inputs.children if isinstance(n,N) and n.tag=='p']:options.add(para)
 for button in root.all(lambda n:n.tag=='button' and n.cls('lyte-rate')):
  content=''.join(x for x in button.children if isinstance(x,str));parts=content.split(' ',1)
  if len(parts)==2 and parts[0] in ['Lower','Upper']:
   button.children=[];button.add(N('span',children=[parts[0]+' ']));button.add(parts[1])
def condense_mag(root):
 chart=root.one(lambda n:n.cls('compact-dose-chart'))
 if chart.all(lambda n:n.cls('compact-dose-notes')):return
 notes=N('details',[('class','compact-dose-notes')]);notes.add(N('summary',children=['Dose conventions & preparation timing']))
 for para in [n for n in chart.children if isinstance(n,N) and n.tag=='p' and n.cls('help')]:notes.add(para)
 context=chart.one(lambda n:n.cls('compact-mg-context'))
 for para in [n for n in context.children if isinstance(n,N) and n.tag=='p' and n.cls('help')]:notes.add(para)
 chart.add(notes)
for name in ['potassium','magnesium','phosphate','sodium','dextrose']:
 path=R/'dist'/f'{name}.html';root=P(path.read_text()).root;body=root.one(lambda n:n.tag=='body')
 if body.cls('electrolyte-compact'):continue
 body.addcls('electrolyte-compact');main=root.byid('main-content');main.addcls('electrolyte-main')
 if name!='sodium':
  form=main.one(lambda n:n.tag=='form');form.addcls('electrolyte-workspace')
  sections=[n for n in form.children if isinstance(n,N) and n.tag=='section']
  if name=='magnesium':
   context,inputs,chart=sections
   context.remove();context.attrs['class']='compact-mg-context';chart.add(context,1)
   # Keep bloodwork + refractory-K visible; lab reference overrides remain one disclosure away.
   g=context.one(lambda n:n.cls('patient-grid'));ref=context.byid('mRefractory').parent
   while ref.tag!='label':ref=ref.parent
   g.add(ref)
   labs=N('details',[('class','compact-lab-limits')]);labs.add(N('summary',children=['Lab interval · default 1.5–2.5 mg/dL']))
   labgrid=labs.add(N('div',[('class','grid')]))
   for id in ['mLower','mUpper']:labgrid.add(context.byid(id).parent)
   context.add(labs,context.children.index(g)+1)
   title=context.one(lambda n:n.tag=='h2');title.tag='h3';text(title,'Bloodwork → dose option')
   para=context.one(lambda n:n.tag=='p');text(para,'Total Mg, not ionized Mg. Use the lab’s reference interval; replacement is selected explicitly.')
   heading(inputs,'Preparation');heading(chart,'Choose a daily dose')
   result=main.byid('mResultSection');hide_weight(root,'mWeight')
  elif name=='potassium':
   inputs,chart=sections;result=main.byid('kResults');hide_weight(root,'kWeight');heading(inputs,'Fluid & preparation');heading(chart,'Choose by current serum K')
   setintro(main,'Uses the shared patient above. Choose a rate; the preparation updates beside the chart.')
   # Keep the never-bolus warning beside the active preparation.
   notice=main.one(lambda n:n.cls('notice'));result.add(notice,1)
   extended=[n for n in result.children if isinstance(n,N) and n.tag=='p' and n.cls('help')]
   conventions=main.one(lambda n:n.tag=='details' and n.cls('panel'))
   for note in extended:conventions.add(note)
   helps=[n for n in chart.children if isinstance(n,N) and n.tag=='p' and n.cls('help')]
   if helps:text(helps[0],'All rows update live. Select a dose or enter a custom rate. Bold values are mL of KCl stock, rounded to 0.1 mL.')
  elif name=='phosphate':
   inputs,chart=sections;result=main.byid('pResultSection');hide_weight(root,'pWeight');heading(inputs,'Fluid & preparation');heading(chart,'Choose by current phosphorus')
   hero=main.byid('pKHeroPanel');hero.attrs['class']='compact-potassium-contribution';heading(hero,'Potassium from this KPhos dose');result.add(hero,2)
  else:
   inputs,chart=sections;result=main.byid('dResultSection');heading(inputs,'Final volume & stock');heading(chart,'Choose final dextrose')
  inputs.addcls('compact-inputs');chart.addcls('compact-dose-chart');result.addcls('compact-result');heading(result,'Selected preparation');form.add(result)
  # Preserve visible clinical cautions while removing oversized title/paragraph gaps.
  if name!='potassium':
   for notice in [n for n in main.children if isinstance(n,N) and n.cls('notice')]:notice.addcls('compact-caution')
  if name=='magnesium':condense_mag(root)
  if name=='phosphate':
   condense_phos(root);finish_phos(root)
  for btn in form.all(lambda n:n.tag=='button' and n.attrs.get('type')=='reset'):text(btn,'Clear preparation')
 else:
  hide_weight(root,'nWeight');hide_weight(root,'gSpecies')
  patientform=main.one(lambda n:n.tag=='form');patientform.addcls('compact-sodium-patient');heading(patientform,'Patient sodium & context')
  # Native disclosure retains the assessment checklists without occupying the initial viewport.
  for card in main.all(lambda n:n.cls('workflow-card')):
   ordered=card.one(lambda n:n.tag=='ol');d=N('details',[('class','workflow-checklist')]);d.add(N('summary',children=['Assessment checklist']));idx=card.children.index(ordered);d.add(ordered);card.add(d,idx)
   for btn in card.all(lambda n:'data-path' in n.attrs):text(btn,'High sodium' if btn.attrs['data-path']=='hyper' else 'Low sodium')
  hypo=root.byid('hypoWorkflow');workup=panel(hypo);detailize(workup,'Hyponatremia workup & investigation');hypo.add(N('div',[('class','notice compact-caution')],['Neurologic compromise or hypoperfusion: assess and stabilize urgently. The mixing cards are not a rescue-bolus protocol.']),0)
  mix=root.byid('mixingTool');heading(mix,'Compare base fluids + NaCl stock');mix.addcls('compact-sodium-mix')
  mixform=mix.one(lambda n:n.tag=='form');result=root.byid('nMixSection');result.addcls('compact-result');heading(result,'Selected fluid preparation')
  grid=N('div',[('class','sodium-mix-workspace')]);mix.add(grid);grid.add(mixform);grid.add(result)
  for card in mix.all(lambda n:n.cls('fluid-card')):
   note=card.one(lambda n:n.attrs.get('id','').startswith('nCardNote'));d=card.add(N('details',[('class','fluid-card-details')]))
   d.add(N('summary',children=['Preparation detail']));d.add(note)
   button=card.one(lambda n:'data-base' in n.attrs);text(button,'Use '+button.attrs['data-fluid'])
  for id,title in [('nWaterSection','Free-water estimate'),('hResponseSection','Predicted sodium response'),('nGlucoseSection','Corrected sodium'),('nQuickSection','Mixed fluid')]:
   res=root.byid(id);res.addcls('compact-result');heading(res,title)
  # Keep planned-flow inputs in one small grid alongside their output.
  plan=root.byid('hypoPlan');pform=plan.one(lambda n:n.tag=='form');ppanel=panel(pform);pgrid=N('div',[('class','grid')]);ppanel.add(pgrid,1)
  for label in [n for n in ppanel.children if isinstance(n,N) and n.tag=='label']:pgrid.add(label)
  heading(ppanel,'Hyponatremia starting plan')
  setintro(main,'Uses the shared patient above. Choose high or low sodium, then plan the preparation and reassess the measured response.')
 # Load the shared presentation behavior before either calculator controller.
 scripts=root.all(lambda n:n.tag=='script' and n.attrs.get('src') in ['potassium.js','electrolytes.js'])
 for script in scripts:
  script.parent.add(N('script',[('src','electrolyte-layout.js')]),script.parent.children.index(script))
 path.write_text(root.render())
