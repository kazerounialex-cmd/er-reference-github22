"""Exercise documented generators away from hand-edited working files."""
from pathlib import Path
import shutil
import subprocess
import tempfile

root = Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='er-generator-check-') as temporary:
    checkout = Path(temporary) / 'site'
    shutil.copytree(root, checkout, ignore=shutil.ignore_patterns(
        '.git', '.wrangler', '__pycache__', 'node_modules'))
    # A second pass catches duplicate navigation, controls and shared scripts.
    for attempt in range(2):
        subprocess.run(['python3', 'scripts/build-cri-pages.py'], cwd=checkout, check=True)
        subprocess.run(['node', 'scripts/check-all.cjs'], cwd=checkout, check=True)
print('CRI generation and complete suite passed twice in an isolated temporary copy.')
