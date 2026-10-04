"""定向处理官方 M17 教育 FITS，保留原 ZIP；不读取成品 RGB。"""
from pathlib import Path
from zipfile import ZipFile
import hashlib
import json
import numpy as np

base = Path(__file__).parent
def sha(data):
    return hashlib.sha256(data).hexdigest()
records = []
for code, line in [('502', '[O III]'), ('656', 'Hα'), ('673', '[S II]')]:
    p = base / 'raw' / (code + 'nmos.zip')
    zipped = p.read_bytes()
    with ZipFile(p) as z:
        name = code + 'nmos.fits'
        blob = z.read(name)
    cards, header = [], {}
    for pos in range(0, len(blob), 80):
        card = blob[pos:pos+80].decode('ascii')
        cards.append(card)
        key = card[:8].strip()
        if key == 'END':
            offset = ((pos + 80 + 2879) // 2880) * 2880
            break
        if card[8:10] == '= ':
            token = card[10:].split('/')[0].strip()
            if token.startswith("'"):
                value = token.strip("' ")
            elif token in ('T', 'F'):
                value = token == 'T'
            else:
                try:
                    value = float(token.replace('D', 'E'))
                except ValueError:
                    value = token
            header[key] = value
    assert header['BITPIX'] == -32 and header['NAXIS'] == 2
    w, h = int(header['NAXIS1']), int(header['NAXIS2'])
    assert w == h == 1600
    a = np.frombuffer(blob, dtype='>f4', count=w*h, offset=offset).reshape(h, w)
    a = a.astype(np.float64)*header.get('BSCALE', 1)+header.get('BZERO', 0)
    assert np.isfinite(a).all()
    # 平均 5×5 的线性值，未做拉伸；FITS 首行在下，浏览器首行在上，垂直翻转。
    reduced = a.reshape(320, 5, 320, 5).mean(axis=(1, 3))[::-1].astype('<f4')
    out = base / (code + '-linear.f32')
    out.write_bytes(reduced.tobytes())
    (base / 'raw' / (code+'-header.txt')).write_text('\n'.join(cards)+'\n', encoding='utf-8')
    good = reduced[reduced > 0]
    keys = ['TELESCOP','INSTRUME','FILTNAM1','DATE-OBS','TIME-OBS','EXPTIME','EQUINOX','BUNIT','PHOTFLAM','PHOTPLAM','CRVAL1','CRVAL2','CRPIX1','CRPIX2','CD1_1','CD1_2','CD2_1','CD2_2','BIASCORR','DARKCORR','FLATCORR','TARGNAME']
    rec = dict(code=code, line=line, url='https://esahubble.org/static/projects/fits_liberator/datasets/m17/'+p.name,
               zip_sha256=sha(zipped), fits_sha256=sha(blob), derived_sha256=sha(out.read_bytes()),
               header={k:header.get(k) for k in keys}, original_shape=[h,w], derived_shape=[320,320],
               min=float(reduced.min()), max=float(reduced.max()), positive_p995=float(np.percentile(good,99.5)),
               mean_original=float(a.mean()), mean_derived=float(reduced.mean()))
    records.append(rec)
    print(code, rec['header'], 'range', rec['min'],rec['max'])
metadata = dict(object='M17', institution='NASA/ESA Hubble Space Telescope; ESA/Hubble education dataset',
                accessed='2026-10-03', source_page='https://esahubble.org/projects/fits_liberator/m17data/',
                representation='已校准、拼接的真实单通道教育 FITS；不是未经校准探测器原始帧；不是成品RGB拆分',
                processing='主HDU -32 float FITS→BSCALE/BZERO→5×5均值320×320→垂直翻转→little-endian Float32。无拉伸。',
                units='BUNIT缺失，沿用FITS源数值；不宣称绝对线通量。PHOTFLAM/EXPTIME是原头字段，拼接归一未独立核实。',
                coordinate_limit='三通道所读CRVAL/CRPIX/CD头字段相同；教育拼接组在共同像素网格展示，精密星表/天测配准及拼接后WCS未独立验证。',
                channels=records)
(base/'m17-metadata.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
