from pathlib import Path
import json,math,re
root=Path.cwd();G=6.67430e-11;M=1.99e30;R=6.96e8;L=3.83e26;c=299792458.;yr=365.25*86400;pc=3.085677581491367e16
values={'KH_year':G*M*M/R/L/yr,'nuclear_budget_year':.007*.1*.7*M*c*c/L/yr,'giant_L_sun':50**2*(3500/5770)**4,'WD_L_sun':.01**2*(10000/5770)**4,'three_mass_L_sun':3**3.5,'three_mass_lifetime_ratio':3**(-2.5),'WD_density_kg_m3':3*.6*M/(4*math.pi*(9e6)**3),'Schwarzschild_per_solar_km':2*G*M/c**2/1000,'collapse_binding_J':G*(1.4*M)**2/12000,'distance_bias_10pct':math.sqrt(1.1)-1,'galactic_period_year':2*math.pi*8000*pc/220000/yr,'galactic_mass_solar':220000**2*8000*pc/G/M,'lambda_peak_mm':2.897771955e-3/2.725*1000,'nu_peak_GHz':2.821439372*1.380649e-23*2.725/6.62607015e-34/1e9}
errors=[];counts={}
for p in root.glob('course/*/lesson.md'):
 if p.parent.name[:2] not in ['11','12','13']:continue
 s=p.read_text(encoding='utf-8');counts[p.parent.name]=len(re.findall(r'[\u4e00-\u9fff]',s))
 for target in re.findall(r'\]\(([^)]+)\)',s):
  if '://' in target:continue
  file,_,anchor=target.partition('#');q=(p.parent/file).resolve()
  if not q.is_file():errors.append(str(p)+': missing '+target)
  elif anchor and 'id="'+anchor+'"' not in q.read_text(encoding='utf-8-sig'):errors.append('missing anchor '+anchor)
(root/'assets/13/v02/numeric-link-check.json').write_text(json.dumps({'numerics':values,'Han_counts_including_captions':counts,'link_errors':errors},ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'numerics':values,'counts':counts,'link_errors':errors},ensure_ascii=False,indent=2))
