"""独立参考：SciPy特殊函数及自适应积分，不读取JS计算结果。dl_env执行。"""
import json
from pathlib import Path
from scipy.special import j0, j1
from scipy.integrate import quad

root = Path(__file__).parent
values = []
for q in [0, .1, 1, 3.8317059702075125, 7.9, 8, 30, 160]:
    for beta in [0, 2, 20, 120]:
        for epsilon in [0, .22, .33]:
            import math
            real = quad(lambda r: r*j0(q*r)*math.cos(beta*r*r), epsilon, 1, epsabs=1e-11, limit=600)[0]
            imag = quad(lambda r: r*j0(q*r)*math.sin(beta*r*r), epsilon, 1, epsabs=1e-11, limit=600)[0]
            intensity = 4*(real*real+imag*imag)/(1-epsilon*epsilon)**2
            values.append(dict(q=q, beta=beta, epsilon=epsilon, intensity=intensity, j0=float(j0(q)), j1=float(j1(q))))
(root/'reference.json').write_text(json.dumps({'method': 'SciPy 1.17.0 scipy.special j0/j1 and scipy.integrate.quad; independent adaptive quadrature', 'unit': 'dimensionless', 'kind': 'mathematical calibration, not observed stars', 'cases': values}, ensure_ascii=False, indent=2), encoding='utf-8')
