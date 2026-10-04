"""定向提取已下载的官方 MIST EEP；不获取图片，不更改课程原文。"""
from pathlib import Path
import hashlib, json, math

HERE = Path(__file__).resolve().parent
FIELDS = ['star_age','star_mass','log_L','log_Teff','log_R','log_center_T',
          'center_h1','center_he4','center_c12','center_o16','he_core_mass',
          'c_core_mass','o_core_mass','log_LH','log_LHe','phase']
tracks = []
for path in sorted((HERE/'raw').glob('*.eep')):
    lines = path.read_text().splitlines()
    names = next(line[1:].split() for line in lines if 'star_age' in line and 'star_mass' in line)
    source_rows = [dict(zip(names, map(float, line.split()))) for line in lines if line.strip() and not line.startswith('#')]
    mass = float(next(line[1:].split()[0] for line in lines if line.startswith('# ') and 'E+' in line and 'low-mass' in line or line.startswith('# ') and 'E+' in line and 'high-mass' in line))
    # v2论文未涵盖更新的白矮星冷却；低质量截至头部列明的后AGB/冷却入口1420。
    stop = min(len(source_rows), 1420) if mass < 8 else len(source_rows)
    rows = []
    for eep, row in enumerate(source_rows[:stop], 1):
        if row['phase'] == -9: continue
        assert all(math.isfinite(row[field]) for field in FIELDS)
        rows.append([eep] + [row[field] for field in FIELDS])
    transitions = []
    for row in rows:
        if not transitions or row[-1] != transitions[-1]['phase']:
            transitions.append({'eep':row[0],'age_yr':row[1],'phase':row[-1]})
    tracks.append({'initial_mass_solar':mass, 'source_file':path.name,
                   'source_sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
                   'rows':rows,'transitions':transitions,
                   'retained_count':len(rows),'original_count':len(source_rows)})

output = {'model':'MIST 2.5 / MESA 11701', 'representation':'official web-interpolated stellar models; not observed star histories',
          'retrieved':'2026-10-03', 'initial_Y':0.2703,'initial_Z':0.0163577,
          'Fe_H':0,'alpha_Fe':0,'v_vcrit':0,
          'request':{'url':'https://mist.science/track_form.php','version':'MIST2','mass_list':'1 3 15','mass_type':'list','output_option':'theory','new_met_value':'0','alpha_value':'p0','v_div_vcrit':'vvcrit0.0'},
          'archive_url':'https://mist.science/output/MIST_eep_6ac070f22b8fb.zip',
          'archive_sha256':hashlib.sha256((HERE/'MIST2.5-1-3-15.zip').read_bytes()).hexdigest(),
          'license':'Official scientific download; no explicit open data redistribution license located. Local teaching only; public redistribution review pending.',
          'columns':['eep']+FIELDS,'tracks':tracks}
(HERE/'tracks.json').write_text(json.dumps(output,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
print([(t['initial_mass_solar'],t['retained_count'],t['transitions']) for t in tracks])
