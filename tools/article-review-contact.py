"""Make review sheets from actual browser screenshots; no source images edited."""
from pathlib import Path
from PIL import Image, ImageOps, ImageDraw, ImageFont
import math
root=Path(__file__).resolve().parents[1]
folder=root/'build/qa/v02-article-render'
out=root/'build/qa/v02-contact'
out.mkdir(exist_ok=True)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',18)
for n in range(1,17):
    files=sorted(folder.glob(f'L{n:02}-*.png'))
    if not files: continue
    w,h=600,760
    sheet=Image.new('RGB',(w*2,h*math.ceil(len(files)/2)),'#d9dfe5')
    draw=ImageDraw.Draw(sheet)
    for k,p in enumerate(files):
        x,y=(k%2)*w,(k//2)*h
        draw.text((x+12,y+8),p.stem,fill='black',font=font)
        with Image.open(p) as im:
            thumb=ImageOps.contain(im.convert('RGB'),(w-16,h-42))
        sheet.paste(thumb,(x+(w-thumb.width)//2,y+34))
    sheet.save(out/f'L{n:02}.jpg',quality=92)
    print(f'L{n:02}: {len(files)} actual screenshot views')
