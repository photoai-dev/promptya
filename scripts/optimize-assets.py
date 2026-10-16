"""Encode supplied visual assets for web delivery; keep source files intact.
No crop, retouching, compositing or identity modification is performed.
"""
from pathlib import Path
from PIL import Image
for folder in [Path('Promptya_Site/assets/gallery'), Path('Promptya_Site/assets/viral')]:
    for path in folder.iterdir():
        if path.suffix.lower() not in ('.png', '.jpg', '.jpeg'):
            continue
        target = path.with_suffix('.webp')
        if target.exists() and target.stat().st_mtime >= path.stat().st_mtime:
            continue
        with Image.open(path) as image:
            image.convert('RGB').save(target, 'WEBP', quality=90, method=6)
print('Visuels WebP prêts, originaux conservés.')
