"""Course v0.2 batch B: fetch identified ESO media; draw explicit scientific models.
Run with conda run -n dl_env python assets/08/v02/create_batch_b_assets.py
Original media are untouched. No inputs from existing course drafts are overwritten.
"""
from pathlib import Path
import csv, hashlib, json, math
import requests
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from PIL import Image

ROOT=Path(__file__).resolve().parents[2]
plt.rcParams.update({'font.size':16,'axes.titlesize':19,'axes.labelsize':17,'figure.facecolor':'white','svg.fonttype':'none'})
photos=[
('08','light-pollution.jpg','https://cdn.eso.org/images/publicationjpg/potw1936a.jpg'),
('08','airglow.jpg','https://cdn.eso.org/images/publicationjpg/potw1638a.jpg'),
('09','primary-mirror.jpg','https://cdn.eso.org/images/large/recoating-ut4.jpg'),
('09','neptune-ao.jpg','https://cdn.eso.org/images/large/eso1824b.jpg'),
('10','flames-spectra.jpg','https://cdn.eso.org/images/large/eso0219b.jpg'),
]
records=[]
for nn,name,url in photos:
    folder=ROOT/nn/'v02'; folder.mkdir(parents=True,exist_ok=True)
    path=folder/name
    if not path.exists():
        r=requests.get(url,timeout=50);r.raise_for_status();path.write_bytes(r.content)
    with Image.open(path) as im:
        im.load(); size=im.size
    records.append({'path':str(path.relative_to(ROOT.parent)).replace('\\','/'),'url':url,'size':size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
def save(fig,nn,name):
    d=ROOT/nn/'v02';d.mkdir(parents=True,exist_ok=True)
    fig.savefig(d/(name+'.png'),dpi=180,bbox_inches='tight')
    fig.savefig(d/(name+'.svg'),bbox_inches='tight')
    plt.close(fig)

# Airmass and extinction: illustrative k=0.20 mag per airmass, planar atmosphere.
h=np.linspace(15,90,301);X=1/np.sin(np.deg2rad(h))
fig,ax=plt.subplots(1,2,figsize=(14,5))
ax[0].plot(h,X,color='#155c8a',lw=3);ax[0].set(xlabel='Altitude h (degrees)',ylabel='Relative airmass X',title='Plane-parallel model: X = 1 / sin(h)',xlim=(15,90),ylim=(0.9,4.2))
for a in [15,30,60,90]:
    x=1/math.sin(math.radians(a));ax[0].scatter(a,x,color='#e17825');ax[0].annotate(f'{x:.2f}',(a,x),xytext=(4,6),textcoords='offset points')
for k,c in [(0.10,'#e17825'),(0.20,'#155c8a'),(0.40,'#672e88')]:
    ax[1].plot(h,10**(-.4*k*X),lw=3,label=f'k = {k:.2f} mag / airmass',color=c)
ax[1].set(xlabel='Altitude h (degrees)',ylabel='Flux / above-atmosphere flux',title='Extinction model (no clouds)',xlim=(15,90),ylim=(0,1));ax[1].legend(fontsize=12)
for a in ax:a.grid(alpha=.25)
fig.tight_layout();save(fig,'08','airmass-extinction')

# Detector demonstration; model mean signals + same source above different background.
fig,ax=plt.subplots(1,3,figsize=(15,4.8));xx=np.arange(0,100)
for a,B in zip(ax,[20,100,500]):
    source=20*np.exp(-.5*((xx-50)/11)**2);a.plot(xx,np.full_like(xx,B),ls='--',color='#888888',label='Sky background B');a.plot(xx,B+source,color='#155c8a',lw=3,label='Source + sky')
    a.set(xlabel='Position (arbitrary units)',ylabel='Mean counts per cell',title=f'Same source, B = {B}',ylim=(0,550));a.text(.04,.80,f'Peak contrast = {20/B:.2f}',transform=a.transAxes)
ax[0].legend(fontsize=11);fig.suptitle('The object is unchanged; the background changes',y=1.04);fig.tight_layout();save(fig,'08','background-contrast')

# Two field angles form separate focal-plane positions; no eyepiece, no aberrations.
fig,ax=plt.subplots(figsize=(13,5.3));F=8;L=2
for theta,c in [(0,'#e17825'),(.11,'#155c8a')]:
    yfocus=F*theta
    for y in [-1.7,-.8,.8,1.7]:
        ax.plot([-4,0],[y-4*theta,y],color=c,lw=2)
        ax.plot([0,F],[y,yfocus],color=c,lw=2)
    ax.scatter(F,yfocus,c=c,s=70,zorder=3)
ax.plot([0,0],[-2.1,2.1],color='black',lw=7,alpha=.5)
ax.plot([F,F],[-2.2,2.2],color='#777777',lw=2,ls='--')
ax.annotate('',(0,-2.5),(F,-2.5),arrowprops={'arrowstyle':'<->'});ax.text(3,-2.85,'Focal length F')
ax.text(-.7,2.35,'Objective');ax.text(7.4,2.35,'Focal plane');ax.text(8.3,.5,'y = F tan(theta)');ax.text(-3,-2.8,'Two incoming directions')
ax.set(xlim=(-4.5,11),ylim=(-3.2,3),title='Directions become positions (ideal paraxial lens)',aspect='equal');ax.axis('off');save(fig,'09','focal-plane')

# Aperture wavelength angular resolution; rayleigh vs arbitrary illustrative seeing.
D=np.linspace(.06,.40,300)
fig,ax=plt.subplots(1,2,figsize=(14,5))
ax[0].plot(D*1000,1.22*550e-9/D*206265,color='#155c8a',lw=3,label='Rayleigh: 550 nm')
ax[0].plot(D*1000,1.22*800e-9/D*206265,color='#e17825',lw=3,label='Rayleigh: 800 nm')
ax[0].axhline(2,ls='--',color='#666666',label='Illustrative seeing FWHM: 2 arcsec')
ax[0].set(xlabel='Aperture D (mm)',ylabel='Angular scale (arcsec)',title='Different definitions of angular scale',ylim=(0,3.8));ax[0].legend(fontsize=11);ax[0].grid(alpha=.2)
xx=np.linspace(-4,4,1000)
for fw,c in [(.7,'#155c8a'),(2,'#e17825')]:
    sig=fw/2.355;y=np.exp(-.5*((xx-1)/sig)**2)+np.exp(-.5*((xx+1)/sig)**2)
    ax[1].plot(xx,y,lw=3,label=f'Gaussian PSF FWHM = {fw} arcsec',color=c)
ax[1].set(xlabel='Sky position (arcsec)',ylabel='Relative intensity',title='Two equal sources 2 arcsec apart');ax[1].legend(fontsize=11);ax[1].grid(alpha=.2)
fig.tight_layout();save(fig,'09','resolution-and-seeing')

# Planck B_lambda for equal emitting areas: absolute and each normalized to own peak.
lam=np.linspace(100,2200,1500);lm=lam*1e-9;H=6.62607015e-34;C=299792458;K=1.380649e-23
fig,ax=plt.subplots(1,2,figsize=(14,5))
for T,c in [(3000,'#b4482d'),(5800,'#e3a320'),(10000,'#2165a5')]:
    bb=2*H*C*C/lm**5/np.expm1(H*C/(lm*K*T))
    ax[0].plot(lam,bb/1e13,c=c,lw=3,label=f'{T} K');ax[1].plot(lam,bb/bb.max(),c=c,lw=3,label=f'{T} K')
for a in ax:
    a.axvspan(380,750,color='#a9a9a9',alpha=.12);a.set(xlabel='Wavelength (nm)',xlim=(100,2200));a.grid(alpha=.2);a.legend()
ax[0].set(ylabel='B_lambda (10^13 W sr^-1 m^-3)',title='Same emitting area: absolute spectral radiance')
ax[1].set(ylabel='B_lambda / individual peak',title='Shape comparison: each curve normalized',ylim=(0,1.08))
fig.tight_layout();save(fig,'10','planck-curves')

fig,ax=plt.subplots(1,2,figsize=(14,5))
dm=np.linspace(-1,6,300);ax[0].semilogy(dm,10**(-.4*dm),lw=3,color='#155c8a');ax[0].set(xlabel='m - reference magnitude',ylabel='Flux / reference flux',title='A magnitude step is a ratio, not a subtraction');ax[0].grid(alpha=.25)
d=np.linspace(1,100,300);ax[1].plot(d,5*np.log10(d/10),lw=3,color='#e17825');ax[1].set(xlabel='Distance (pc)',ylabel='m - M (no extinction)',title='Distance modulus: identical intrinsic luminosity');ax[1].grid(alpha=.25)
for dist in [10,25,100]:
    value=5*math.log10(dist/10);ax[1].scatter(dist,value,c='#155c8a');ax[1].annotate(f'{dist} pc: {value:.2f} mag',(dist,value),xytext=(-140,-25) if dist==100 else (8,8),textcoords='offset points',fontsize=12)
fig.tight_layout();save(fig,'10','magnitude-distance')

(ROOT/'08'/'v02'/'download-record.json').write_text(json.dumps(records,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(records,ensure_ascii=False,indent=2))
