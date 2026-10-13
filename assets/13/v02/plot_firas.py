from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
p=Path(__file__).parent
x=np.loadtxt(p/'firas_monopole_spec_v1.txt')
f=x[:,0]*29.9792458
h=6.62607015e-34;k=1.380649e-23;c=299792458.;T=2.725
nu=np.linspace(f.min(),f.max(),1200)*1e9
bb=2*h*nu**3/c**2/np.expm1(h*nu/(k*T))*1e20
plt.rcParams.update({'font.family':'DejaVu Sans','font.size':12})
fig,(a,b)=plt.subplots(2,1,figsize=(10,7.6),sharex=True,gridspec_kw={'height_ratios':[2,1]},layout='constrained')
a.plot(nu/1e9,bb,color='#c86822',lw=2,label='2.725 K blackbody')
a.errorbar(f,x[:,1],yerr=x[:,3]/1000,fmt='o',ms=4,color='#165778',label='Published FIRAS monopole')
a.set(ylabel='Spectral intensity (MJy/sr)',title='COBE / FIRAS: CMB mean spectrum and residuals')
a.legend(loc='upper right');a.grid(alpha=.2)
b.errorbar(f,x[:,2],yerr=x[:,3],fmt='o',ms=4,capsize=2,color='#165778')
b.axhline(0,color='#c86822',lw=1.4)
b.set(xlabel='Frequency (GHz)',ylabel='Residual (kJy/sr)')
b.grid(alpha=.2)
fig.supxlabel('NASA/LAMBDA v1 (2005), Fixsen et al. 1996 / Fixsen & Mather 2002; errors: 1 sigma',fontsize=9)
fig.savefig(p/'firas-spectrum.png',dpi=210)
fig.savefig(p/'firas-spectrum.svg')
print('Rows:',len(x),'Frequency range GHz:',f.min(),f.max(),'Max plotted uncertainty kJy/sr:',max(x[:,3]))
