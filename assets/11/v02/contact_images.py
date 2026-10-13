from pathlib import Path
from PIL import Image,ImageDraw
base=Path.cwd()
paths=['assets/11/v02/orion.jpg','assets/11/v02/ring.jpg','assets/11/v02/gaia-hr.jpg','assets/12/v02/sgr-a.jpg','assets/12/v02/sn1987a.jpg','assets/14/crab.jpg','assets/13/v02/gaia-sky.png','assets/13/v02/hudf.jpg','assets/13/v02/planck.jpg']
out=Image.new('RGB',(1800,1920),'#ececec');d=ImageDraw.Draw(out)
for i,p in enumerate(paths):
 im=Image.open(base/p).convert('RGB');im.thumbnail((590,600))
 x=(i%3)*600+(600-im.width)//2;y=(i//3)*640+30+(600-im.height)//2
 out.paste(im,(x,y));d.text(((i%3)*600+12,(i//3)*640+10),p,fill='black')
out.save(base/'assets/11/v02/contact-batch-C.jpg',quality=95)
