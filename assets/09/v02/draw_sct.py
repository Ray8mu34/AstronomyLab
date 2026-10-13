"""Idealized axial SCT ray routing, arbitrary scale; not an optical prescription."""
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
fig,ax=plt.subplots(figsize=(14,5.5))
ax.axhline(0,color='#bbbbbb',lw=1)
ax.plot([1,1],[-1.8,1.8],c='#444444',lw=5)
for sign in [-1,1]:
 y=sign*1.3;sy=sign*.65;ey=-sign*.65/7
 for x1,y1,x2,y2,c in [(0,y,8,y,'#155c8a'),(8,y,3,sy,'#b85c20'),(3,sy,11,ey,'#653c88'),(11,ey,12.8,ey,'#653c88')]:
  ax.plot([x1,x2],[y1,y2],color=c,lw=2.8)
  ax.annotate('',(x1+.60*(x2-x1),y1+.60*(y2-y1)),(x1+.45*(x2-x1),y1+.45*(y2-y1)),arrowprops={'arrowstyle':'-|>','color':c,'lw':2})
 for y1,y2 in [(.3,1.75),(-1.75,-.3)]:
  yy=np.linspace(y1,y2,50);xx=8+.10*(1-(yy/1.75)**2);ax.plot(xx,yy,c='#444444',lw=7)
yy=np.linspace(-.8,.8,70);xx=3+.15*(1-(yy/.8)**2);ax.plot(xx,yy,c='#444444',lw=5)
ax.plot([11,11],[-.55,.55],c='#444444',lw=5)
ax.scatter(10,0,s=65,c='#cf3131',zorder=4)
ax.text(.5,2,'Corrector plate',ha='left');ax.text(2.8,1.05,'Convex secondary',ha='center')
ax.text(7.1,-2.1,'Concave primary + central opening');ax.text(9.7,.5,'Rear focus',ha='center');ax.text(11.1,-.95,'Eyepiece')
ax.text(.1,-2.6,'Arrows show propagation. Curvatures and separations are schematic, not to scale.',fontsize=12)
ax.set(xlim=(-.35,13.4),ylim=(-2.9,2.7),title='Schmidt–Cassegrain: folded light path (axial schematic)')
ax.axis('off');fig.tight_layout()
d=Path(__file__).resolve().parent
for ext in ['png','svg']:fig.savefig(d/('schmidt-cassegrain.'+ext),dpi=180,bbox_inches='tight')
