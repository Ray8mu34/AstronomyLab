"""Flat FLRW luminosity distances; model predictions, no supernova data fitting."""
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

OUT = Path(__file__).resolve().parent
plt.rcParams.update({'font.family': 'Microsoft YaHei', 'font.size': 12,
                     'axes.unicode_minus': False, 'svg.fonttype': 'none'})
z = np.linspace(0,1.2,2401)
c, h0 = 299792.458, 70.
def lumdist(om, ol):
    f = 1/np.sqrt(om*(1+z)**3+ol)
    integral = np.r_[0., np.cumsum((f[1:]+f[:-1])*.5*np.diff(z))]
    return (1+z)*c/h0*integral
d_acc = lumdist(.3,.7)
d_mat = lumdist(1.,0.)
fig, axes = plt.subplots(2,1,figsize=(9,7),sharex=True,
                         gridspec_kw={'height_ratios':[2.1,1]})
axes[0].plot(z,d_acc/1000,color='#1d6b92',lw=2.7,
            label=r'$\Omega_m=0.3,\ \Omega_\Lambda=0.7$')
axes[0].plot(z,d_mat/1000,color='#bb6237',lw=2.7,
            label=r'$\Omega_m=1,\ \Omega_\Lambda=0$')
axes[0].set(ylabel='光度距离（Gpc）')
axes[0].legend(frameon=False)
dm=5*np.log10(d_acc[1:]/d_mat[1:])
axes[1].plot(z[1:],dm,color='#1d6b92',lw=2.7)
axes[1].set(xlabel='红移 z',ylabel='距离模数之差（等）',ylim=(0,.7))
for ax in axes:
    ax.set_xlim(0,1.2)
    ax.grid(alpha=.2)
    ax.spines[['top','right']].set_visible(False)
fig.tight_layout()
for ext in ['png','svg']:
    fig.savefig(OUT/f'expansion-distance-models.{ext}',dpi=180,facecolor='white')
i=np.argmin(abs(z-.5))
print(f'z=0.5: dL(0.3,0.7)={d_acc[i]:.3f} Mpc; dL(1,0)={d_mat[i]:.3f} Mpc; delta_mu={5*np.log10(d_acc[i]/d_mat[i]):.5f} mag')
