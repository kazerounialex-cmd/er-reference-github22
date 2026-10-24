"""Dependency-free static checks; does not replace a browser accessibility audit."""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1]
DIST=ROOT/'dist'
VOID={'input','meta','link','br','hr','img','source','col','area','base','embed','param','track','wbr'}
class Page(HTMLParser):
    def __init__(self,text):
        super().__init__(); self.nodes=[]; self.stack=[]; self.feed(text)
    def handle_starttag(self,tag,attrs):
        data=dict(attrs); self.nodes.append((tag,data,list(self.stack)))
        if tag not in VOID:self.stack.append((tag,data))
    def handle_endtag(self,tag):
        for i in range(len(self.stack)-1,-1,-1):
            if self.stack[i][0]==tag:self.stack=self.stack[:i];break
pages={path.name:Page(path.read_text()) for path in DIST.glob('*.html')}
def nav_links(page):
    return [data.get('href') for tag,data,parents in page.nodes if tag=='a' and any(t=='nav' and d.get('aria-label')=='Reference sections' for t,d in parents)]
expected_nav=['index.html','potassium.html','magnesium.html','phosphate.html','sodium.html','dextrose.html','blood-collection.html','cri-fentanyl.html','cri-lidocaine.html','cri-ketamine.html','cri-norepinephrine.html','cri-insulin.html','cri-reglan.html','chocolate.html','drugs.html','original-sheet.html','sources.html']
errors=[]
for name,page in pages.items():
    if nav_links(page)!=expected_nav:errors.append(name+': reference navigation differs from the required order')
    current=[data for tag,data,parents in page.nodes if tag=='a' and data.get('aria-current')=='page' and any(t=='nav' and d.get('aria-label')=='Reference sections' for t,d in parents)]
    if len(current)!=1 or current[0].get('href')!=name:errors.append(name+': navigation must mark only its own page as current')
    ids=Counter(data['id'] for _,data,_ in page.nodes if 'id' in data)
    labels={data['for'] for tag,data,_ in page.nodes if tag=='label' and 'for' in data}
    issues=['duplicate ID '+key for key,count in ids.items() if count>1]
    scripts=[data.get('src') for tag,data,_ in page.nodes if tag=='script' and data.get('src')]
    assert scripts[0]=='number-format.js',name+': shared formatter must load before calculators'
    for tag,data,parents in page.nodes:
        for attribute in ('aria-describedby','aria-labelledby','for'):
            for ref in data.get(attribute,'').split():
                if ref not in ids:issues.append('missing ID reference '+ref)
        hidden='hidden' in data or any('hidden' in ancestor for _,ancestor in parents)
        if tag in ('input','select','textarea') and data.get('type')!='hidden' and not hidden:
            named=(data.get('aria-label') or data.get('aria-labelledby') or any(t=='label' for t,_ in parents) or data.get('id') in labels)
            if not named:issues.append('unnamed control '+str(data.get('id')))
        if tag=='iframe' and not data.get('title'):issues.append('unnamed iframe')
        for attribute in ('href','src'):
            raw=data.get(attribute,''); url=urlsplit(raw)
            if not raw or url.scheme or url.netloc:continue
            target=(DIST/url.path) if url.path else DIST/name
            if not target.exists():issues.append('missing local resource '+raw);continue
            if url.fragment and target.name in pages:
                if not any(d.get('id')==url.fragment for _,d,_ in pages[target.name].nodes):issues.append('broken anchor '+raw)
    errors.extend(name+': '+issue for issue in issues)
if errors:raise SystemExit('\n'.join(errors))
print(f'Static checks passed on {len(pages)} pages: IDs, local resources/anchors, labels, ARIA references, iframe names and script order.')
