from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[1]
GROUP={'potassium.html','magnesium.html','phosphate.html','sodium.html','dextrose.html'}
def group_links(links,filename):
    children=re.findall(r'<a\b[^>]*href="(?:potassium|magnesium|phosphate|sodium|dextrose)\.html"[^>]*>.*?</a>',links)
    if not children:return links
    group='<details class="nav-group"'+(' open' if filename in GROUP else '')+'><summary>Additives / Electrolytes</summary><div class="nav-children">'+''.join(children)+'</div></details>'
    for child in children[1:]:links=links.replace(child,'')
    links=links.replace(children[0],group)
    return links
if __name__=='__main__':
 for p in (ROOT/'dist').glob('*.html'):
    s=p.read_text();match=re.search(r'(<nav aria-label="Reference sections">)(.*?)(</nav>)',s,re.S)
    if not match:continue
    links=match[2]
    if 'class="nav-group"' in links:continue
    s=s[:match.start(2)]+group_links(links,p.name)+s[match.end(2):];p.write_text(s)
