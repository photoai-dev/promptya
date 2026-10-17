"""Offline asset preparation; commit the JPEGs so Vercel needs no Python runtime."""
import json
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont

root = Path('Promptya_Site')
for item in json.loads(Path('.local/social-assets.json').read_text('utf-8')):
    source = Path(item['source'])
    target = Path(item['output'])
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as original:
        image = ImageOps.exif_transpose(original).convert('RGB')
        # Complete presentation sheets must stay visible, including their titles.
        if '/viral-trend/' in item['path'] and item['path'] != '/viral-trend/':
            canvas = Image.new('RGB', (1200, 630), '#111216')
            image.thumbnail((1200, 630), Image.Resampling.LANCZOS)
            canvas.paste(image, ((1200-image.width)//2, (630-image.height)//2))
            image = canvas
        else:
            image = ImageOps.fit(image, (1200, 630), Image.Resampling.LANCZOS)
        image.save(target, 'JPEG', quality=85, optimize=True, progressive=True)

# A simple native brand mark, legible at 16 px, independent of external fonts on the site.
icon = Image.new('RGB', (512, 512), '#111216')
draw = ImageDraw.Draw(icon)
font = ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', 380)
draw.text((70, 13), 'P', font=font, fill='white', stroke_width=0)
draw.ellipse((351, 363, 426, 438), fill='#ff007f')
icon.save(root/'favicon.ico', sizes=[(16,16),(32,32),(48,48)])
icon.resize((180,180), Image.Resampling.LANCZOS).save(root/'apple-touch-icon.png', optimize=True)
(root/'favicon.svg').write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#111216"/><path fill="white" d="M15 12h18c11 0 17 6 17 15s-6 15-17 15h-7v12H15V12zm11 10v10h7c4 0 6-2 6-5s-2-5-6-5h-7z"/><circle cx="49" cy="49" r="6" fill="#ff007f"/></svg>', encoding='utf-8')
print('Sharing JPEGs, favicon and Apple touch icon ready.')
