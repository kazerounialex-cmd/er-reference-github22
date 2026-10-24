"""Apply shared, non-clinical markup after page generation."""
from pathlib import Path
import re,runpy
runpy.run_path(str(Path(__file__).resolve().parent / "compact-electrolytes.py"))
ROOT = Path(__file__).resolve().parents[1]
for page in (ROOT / 'dist').glob('*.html'):
    text = page.read_text()
    if 'src="number-format.js"' not in text:
        text = text.replace('<script src=', '<script src="number-format.js"></script><script src=', 1)
    text = re.sub(r'(id="(?:insVolume|r12Volume|r6Volume)" type=")number', r'\1hidden', text)
    if 'href="chocolate.html"' not in text:
        text=text.replace('<a href="sources.html"','<a href="chocolate.html">Chocolate Toxicity</a><a href="sources.html"',1)
    if page.name=='chocolate.html':
        text=text.replace('<a href="chocolate.html">Chocolate Toxicity</a>','<a href="chocolate.html" aria-current="page">Chocolate Toxicity<span class="current-page">Current</span></a>')
    if 'href="original-sheet.html"' not in text:
        text=text.replace('<a href="sources.html"','<a href="original-sheet.html">Original Sheet</a><a href="sources.html"',1)
    if page.name=='original-sheet.html':
        text=text.replace('<a href="original-sheet.html">Original Sheet</a>','<a href="original-sheet.html" aria-current="page">Original Sheet<span class="current-page">Current</span></a>')
    # Keep Drugs after Chocolate and before Original Sheet on every generated page.
    nav_pattern=r'(<nav aria-label="Reference sections">)(.*?)(</nav>)'
    def normalize_nav(match):
        nav=match.group(2)
        drug=re.search(r'<a href="drugs\.html"[^>]*>.*?</a>',nav)
        if drug:
            nav=nav[:drug.start()]+nav[drug.end():]
            nav=nav.replace('<a href="original-sheet.html"',drug.group(0)+'<a href="original-sheet.html"',1)
        return match.group(1)+nav+match.group(3)
    text=re.sub(nav_pattern,normalize_nav,text,flags=re.S)
    page.write_text(text)
runpy.run_path(str(Path(__file__).resolve().parent / 'preparation-controls.py'))
runpy.run_path(str(Path(__file__).resolve().parent / 'compact-blood.py'))
runpy.run_path(str(Path(__file__).resolve().parent / 'potassium-concentration-warning.py'))
runpy.run_path(str(Path(__file__).resolve().parent / 'shared-fluid-reference.py'))
