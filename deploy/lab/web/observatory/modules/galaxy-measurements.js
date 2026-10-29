import {applyPresentation, bindDisclosures, getGraphicStyle} from '../shared/presentation.js';
import {mountWorkspaceNavigation} from '../shared/navigation.js';
import {bindControls, syncControls} from '../shared/core-controls.js';
import {plot} from '../shared/plot.js';
import {
  REFERENCE_MODULUS, REFERENCE_DISTANCE, MAX_THETA, CEPHEIDS,
  distanceFromModulus, angularLength, lineLuminosity, plMagnitude,
  fitModulus, plResidual, lightCurveMagnitude, referenceSpeed,
  projectedPosition, lineOfSightVelocity, inferAtAngle, rotationResidual,
} from './galaxy-measurements-physics.mjs';

const defaults = Object.freeze({mu: REFERENCE_MODULUS, cepheid: '6', inclination: 55, azimuth: 35, theta: 40, stellarScale: 1, haloScale: 1});
const modeNames = {distance: '造父测距', rotation: '速度场', mass: '质量分布'};
// Scientific component identities; interface colours come from presentation tokens.
const componentColours = {stars: '#9b5b24', gas: '#2c756c', halo: '#73609a'};
const signed = value => `${value > .05 ? '+' : ''}${Math.abs(value) < .05 ? '0.0' : value.toFixed(1)}`;
const range = (key, label, min, max, step, unit = '') => `<label class="al-parameter" for="gm-${key}"><span>${label}<output data-value="${key}"></output>${unit ? `<span>${unit}</span>` : ''}</span><input id="gm-${key}" type="range" data-key="${key}" min="${min}" max="${max}" step="${step}" aria-label="${label}${unit ? ' / ' + unit : ''}"></label>`;
const canvas = (name, label, className = '') => `<canvas data-plot="${name}" class="gm-plot ${className}" role="img" aria-label="${label}"></canvas>`;

export async function mount(el, {mode = 'distance', signal} = {}) {
  if (signal?.aborted) return () => {};
  const state = {...defaults};
  let currentMode = Object.hasOwn(modeNames, mode) ? mode : 'distance';
  let disposed = false;
  const doc = el.ownerDocument, win = doc.defaultView;
  const root = doc.createElement('section');
  root.className = 'gm-shell';
  root.setAttribute('aria-label', 'M33 星系测量');
  root.innerHTML = `
    <div class="al-mode-nav gm-modes" role="group" aria-label="星系测量模式">${Object.entries(modeNames).map(([id, name]) => `<button type="button" data-mode="${id}" aria-pressed="false">${name}</button>`).join('')}</div>
    <button class="al-button" type="button" data-gm-reset>复位</button>
    <header class="gm-heading"><h1>M33</h1><p data-gm-identity>合成造父样本 · 近红外 Wesenheit</p></header>
    <section data-gm-panel="distance" aria-label="造父测距图版">
      <div class="gm-distance-grid">
        <figure class="gm-main-figure"><figcaption>周期—平均星等</figcaption>${canvas('pl', '12 颗合成造父变星的周期与平均 Wesenheit 星等，直线随距离模数移动')}
          <div class="gm-fit-row"><button type="button" class="al-button" data-gm-fit>拟合样本</button><output data-gm-read="plResidual"></output></div>
        </figure>
        <figure class="gm-light-figure"><figcaption><label>变星 <select data-key="cepheid" aria-label="选择合成造父变星">${CEPHEIDS.map((star, i) => `<option value="${i}">${star.id} · ${star.period} d</option>`).join('')}</select></label></figcaption>
          ${canvas('lightcurve', '所选合成造父变星的周期光变曲线与强度平均星等')}
          <div class="gm-star-reading"><output data-gm-read="period"></output><output data-gm-read="magnitude"></output></div>
          <div class="gm-scale-figure">${canvas('scales', '在固定角尺度与通量下，长度和光度随采用距离变化的相对比例')}</div>
        </figure>
      </div>
      <div class="gm-distance-quantities"><output data-gm-read="arcsecond"></output><output data-gm-read="fieldWidth"></output><output data-gm-read="luminosity"></output></div>
    </section>
    <section data-gm-panel="rotation" aria-label="星系投影速度场" hidden>
      <div class="gm-rotation-grid">
        <figure class="gm-field-figure"><figcaption>盘面投影 <span>Δv<sub>los</sub> / km s⁻¹</span></figcaption>${canvas('field', '薄圆盘的合成视向速度场、选定圆环与取样点，蓝色为接近，红色为远离', 'gm-field')}
          <div class="gm-field-reading"><output data-gm-read="vlos"></output><output data-gm-read="axisRatio"></output></div>
        </figure>
        <figure><figcaption>同一方位角上的速度</figcaption>${canvas('rotation', '圆周速度与当前方位角处视向速度随半径变化的曲线')}
          <div class="gm-field-reading"><output data-gm-read="vc"></output><output data-gm-read="selectedRadius"></output></div>
        </figure>
      </div>
      <div class="gm-controls-pair">${range('inclination', '盘面倾角 i', 0, 80, 1, '°')}${range('azimuth', '盘内方位角 φ', 0, 360, 1, '°')}</div>
    </section>
    <section data-gm-panel="mass" aria-label="星系旋转与质量图版" hidden>
      <div class="gm-mass-grid">
        <figure><figcaption>旋转速度的分量</figcaption>${canvas('mass-speed', '合成旋转速度取样与恒星、气体、暗晕模型的速度分量')}
          <div class="gm-component-key"><span style="--gm-component:${componentColours.stars}">恒星</span><span style="--gm-component:${componentColours.gas}">气体</span><span style="--gm-component:${componentColours.halo}">暗晕</span></div>
        </figure>
        <figure><figcaption>球对称等效质量</figcaption>${canvas('mass-profile', '由旋转速度和半径计算的球对称等效质量，与可见物质的等效引力贡献')}
          <div class="gm-field-reading"><output data-gm-read="mass"></output><output data-gm-read="rotationResidual"></output></div>
        </figure>
      </div>
      <div class="gm-controls-pair">${range('stellarScale', '恒星质量光度比', .25, 2, .05, '×基准')}${range('haloScale', '暗晕引力强度', 0, 2, .05, '×基准')}</div>
    </section>
    <div class="gm-common-controls">
      <div class="gm-distance-control">${range('mu', '距离模数 μ', 23.8, 25.4, .001, 'mag')}<output class="gm-distance-output" data-gm-read="distance"></output></div>
      <div data-gm-radius-control>${range('theta', '盘内角半径 θ', 1, 90, .1, '′')}<output class="gm-radius-output" data-gm-read="radius"></output></div>
    </div>
    <details class="al-disclosure gm-info" data-learning-guide><summary>模型与来源</summary><div class="gm-reading">
      <p data-mode-boundary>近邻距离近似；图中点与曲线来自教学模型。</p>
      <div data-gm-notes="distance">
        <p>12 颗变星是按同一周光关系生成的合成样本，光变曲线为周期性通量模型。圆点表示强度平均 Wesenheit 星等；点选周光图或选择变星可联动光变曲线。</p>
        <p class="al-number">w = −3.26 log₁₀(P / 1日) − 2.575 + μ<br>d / kpc = 10<sup>(μ − 10) / 5</sup></p>
        <p>斜率和校准项取自 Breuval 等（2023）的近红外 Wesenheit 测距方案；基准 μ = 24.622。Wesenheit 指数将多个滤镜的星等组合以校正消光。这里使用共同校准后的合成样本。</p>
        <p>尺度图固定角尺度和通量，以 d₀ = ${REFERENCE_DISTANCE.toFixed(1)} kpc 为基准。画幅宽度取 ESO M33 图像的 68.01′；谱线通量采用算例 F = 10⁻¹⁵ W m⁻²。长度 s = dθ，谱线光度 L = 4πd²F。</p>
      </div>
      <div data-gm-notes="rotation" hidden>
        <p>薄圆盘沿圆轨道运动。i 是视线与盘轴的夹角，φ 从退行侧长轴在盘内量起。速度场已减去系统速度，色标固定为 −150 至 +150 km/s。点选盘面与两个角度滑块使用同一组坐标。</p>
        <p class="al-number">Δv<sub>los</sub> = v<sub>c</sub> sin i cos φ<br>b / a = cos i</p>
        <p>曲线由恒星盘、气体盘和有核暗晕组成的解析模型生成，半径和速度采用 M33 的量级。真实 M33 的外盘翘曲由不同半径的倾斜环模型描述。</p>
      </div>
      <div data-gm-notes="mass" hidden>
        <p>圆点是基准解析模型的固定速度取样；实线是当前参数的合成模型。恒星与气体采用 Kuzmin 薄盘，暗晕采用有核对数势。各项径向引力相加，对应速度的平方相加。</p>
        <p class="al-number">v<sub>c</sub>² = v<sub>★</sub>² + v<sub>gas</sub>² + v<sub>halo</sub>²<br>M<sub>eq</sub> = v²R / G</p>
        <p>右图把每项引力换算为球对称等效质量。薄盘实际的包围质量需由盘的面密度积分。改变采用距离时，角尺度和光谱速度保持固定；恒星质量光度比固定时，测光质量随 d² 变化，动力学等效质量随 d 变化。</p>
      </div>
      <p><a href="/sources/galaxy-measurements.md" target="_blank" rel="noopener">参数、公式与研究来源 ↗</a> · <a href="/lab/galaxy?mode=galaxy">银河系视角</a></p>
    </div></details>`;
  el.append(root);
  const q = selector => root.querySelector(selector);
  q('.gm-heading').after(q('.gm-common-controls'));
  for (const panel of root.querySelectorAll('[data-gm-panel]')) {
    const controls = panel.querySelector('.gm-controls-pair');
    if (controls) panel.querySelector('figure').append(controls);
  }
  const commonControls = q('.gm-common-controls'), radiusControl = q('[data-gm-radius-control]');
  const plots = Object.fromEntries([...root.querySelectorAll('[data-plot]')].map(node => [node.dataset.plot, node]));
  let fieldGeometry = null, plGeometry = null;
  const setRead = (key, text) => { q(`[data-gm-read="${key}"]`).textContent = text; };
  const disposePresentation = applyPresentation(root, {surface: 'paper', redraw: draw});
  const disposeNavigation = mountWorkspaceNavigation(root, {modeNav: q('.gm-modes'), actions: [q('[data-gm-reset]')], label: '星系测量导航'});
  const disposeDisclosures = bindDisclosures(root);
  const disposeControls = bindControls(root, state, () => draw());

  function mark(chart, x, y, colour, radius = 6) {
    const c = chart.canvas.getContext('2d'), p = chart.toPixel(x, y);
    c.save(); c.strokeStyle = colour; c.fillStyle = chart.style.background;
    c.lineWidth = 2; c.beginPath(); c.arc(...p, radius, 0, Math.PI * 2); c.fill(); c.stroke(); c.restore();
  }
  function guide(chart, x) {
    const c = chart.canvas.getContext('2d'), p = chart.toPixel(x, 0);
    c.save(); c.strokeStyle = chart.style.muted; c.setLineDash([4, 5]); c.lineWidth = 1;
    c.beginPath(); c.moveTo(p[0], chart.bounds.y); c.lineTo(p[0], chart.bounds.y + chart.bounds.height); c.stroke(); c.restore();
  }
  function chart(name, options) {
    const result = {...plot(plots[name], {...options, onFontReady: false}), canvas: plots[name]};
    if (options.showLegend !== false && options.series?.[0]?.connect === false && options.series[0].label) {
      const c = result.canvas.getContext('2d');
      c.fillStyle = result.style.background; c.fillRect(result.bounds.x - 1, 29, 20, 11);
      c.fillStyle = options.series[0].color || result.style.accent;
      c.beginPath(); c.arc(result.bounds.x + 8, 34, result.style.pointRadius, 0, 2 * Math.PI); c.fill();
    }
    return result;
  }
  function drawDistance(style, distance) {
    const star = CEPHEIDS[Number(state.cepheid)] || CEPHEIDS[6];
    const line = [2.5, 65].map(period => [period, plMagnitude(period, state.mu)]);
    plGeometry = chart('pl', {series: [
      {points: CEPHEIDS.map(row => [row.period, row.magnitude]), color: style.text, connect: false, label: '合成样本'},
      {points: line, color: style.accent, label: '当前距离'},
    ], xDomain: [2.5, 65], yDomain: [22.5, 15], logX: true,
    xTicks: [3, 5, 10, 20, 40, 60], yTicks: [16, 18, 20, 22], xLabel: '周期 P / d', yLabel: '平均 w / mag'});
    mark(plGeometry, star.period, star.magnitude, style.focus, 8);
    setRead('plResidual', `均方根残差 ${plResidual(state.mu).toFixed(3)} mag`);
    const days = Math.ceil(star.period * 2.2);
    chart('lightcurve', {series: [
      {points: Array.from({length: 301}, (_, i) => [i * days / 300, lightCurveMagnitude(star, i * days / 300)]), color: style.accent},
      {points: [[0, star.magnitude], [days, star.magnitude]], color: style.muted, dash: [5, 4]},
    ], xDomain: [0, days], yDomain: [star.magnitude + .38, star.magnitude - .38], xLabel: '时间 / d', yLabel: 'w / mag', yFormat: n => n.toFixed(1), showLegend: false, margins: {top: 31}});
    setRead('period', `P = ${star.period.toFixed(1)} d`);
    setRead('magnitude', `平均 w = ${star.magnitude.toFixed(2)} mag`);
    const ratio = distance / REFERENCE_DISTANCE;
    const ratios = Array.from({length: 81}, (_, i) => .65 + i * .85 / 80);
    const scaleChart = chart('scales', {series: [
      {points: ratios.map(x => [x, x]), color: style.text, label: '长度 s / s₀'},
      {points: ratios.map(x => [x, x * x]), color: style.accent, dash: [6, 4], label: '光度 L / L₀'},
    ], xDomain: [.65, 1.5], yDomain: [.35, 2.3], xTicks: [.7, 1, 1.3, 1.5], yTicks: [.5, 1, 1.5, 2], xLabel: '采用距离 d / d₀', yLabel: '相对基准'});
    guide(scaleChart, ratio); mark(scaleChart, ratio, ratio, style.text); mark(scaleChart, ratio, ratio * ratio, style.accent);
    setRead('arcsecond', `1″ = ${(angularLength(distance, 1 / 60) * 1000).toFixed(2)} pc`);
    setRead('fieldWidth', `68.01′ = ${angularLength(distance, 68.01).toFixed(2)} kpc`);
    setRead('luminosity', `L线 = ${(lineLuminosity(distance) / 1e30).toFixed(2)} × 10³⁰ W`);
    plots.pl.setAttribute('aria-label', `合成造父周光图，距离模数 ${state.mu.toFixed(3)} mag，所选 ${star.id} 周期 ${star.period} 日，平均星等 ${star.magnitude.toFixed(2)} mag`);
  }
  function velocityColour(value) {
    const neutral = [236, 238, 238], end = value < 0 ? [40, 107, 158] : [185, 68, 68];
    const mix = Math.min(1, Math.abs(value) / 150);
    return `rgb(${neutral.map((v, i) => Math.round(v + (end[i] - v) * mix)).join(',')})`;
  }
  function drawField(distance) {
    const node = plots.field, width = node.clientWidth, height = node.clientHeight;
    const style = getGraphicStyle(node);
    const fixed = win.getComputedStyle(node), mapInk = fixed.getPropertyValue('--al-ink').trim(), mapPaper = fixed.getPropertyValue('--al-paper').trim();
    const dpr = Math.min(win.devicePixelRatio || 1, 2);
    node.width = Math.round(width * dpr); node.height = Math.round(height * dpr);
    const c = node.getContext('2d'); c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = style.background; c.fillRect(0, 0, width, height);
    const radius = Math.max(30, Math.min((width - 54) / 2, (height - 120) / 2));
    const cx = width / 2, cy = (height - 65) / 2, flatten = Math.cos(state.inclination * Math.PI / 180);
    fieldGeometry = {cx, cy, radius, flatten, width, height};
    c.save(); c.translate(cx, cy); c.scale(1, flatten);
    c.fillStyle = mapPaper; c.beginPath(); c.arc(0, 0, radius + .4, 0, 2 * Math.PI); c.fill();
    const rings = 32, sectors = 96;
    for (let ring = 0; ring < rings; ring++) {
      const outer = radius * (ring + 1) / rings, inner = radius * ring / rings;
      const vc = referenceSpeed(angularLength(REFERENCE_DISTANCE, MAX_THETA * (ring + .5) / rings));
      for (let sector = 0; sector < sectors; sector++) {
        const a0 = 2 * Math.PI * sector / sectors, a1 = 2 * Math.PI * (sector + 1) / sectors;
        const vlos = lineOfSightVelocity(vc, state.inclination, -(a0 + a1) * 90 / Math.PI);
        c.fillStyle = velocityColour(vlos); c.beginPath(); c.arc(0, 0, outer + .4, a0, a1 + .002); c.arc(0, 0, inner, a1 + .002, a0, true); c.closePath(); c.fill();
      }
    }
    c.restore(); c.strokeStyle = mapInk; c.lineWidth = 1;
    for (const fraction of [.25, .5, .75, 1]) { c.beginPath(); c.ellipse(cx, cy, radius * fraction, radius * fraction * flatten, 0, 0, 2 * Math.PI); c.stroke(); }
    c.setLineDash([3, 5]); c.beginPath(); c.moveTo(cx - radius - 9, cy); c.lineTo(cx + radius + 9, cy); c.moveTo(cx, cy - radius * flatten - 9); c.lineTo(cx, cy + radius * flatten + 9); c.stroke(); c.setLineDash([]);
    const selectionRadius = radius * state.theta / MAX_THETA;
    c.strokeStyle = mapInk; c.lineWidth = 2;
    c.beginPath(); c.ellipse(cx, cy, selectionRadius, selectionRadius * flatten, 0, 0, 2 * Math.PI); c.stroke();
    const selected = projectedPosition(state.theta, state.azimuth, state.inclination);
    const x = cx + selected[0] / MAX_THETA * radius, y = cy - selected[1] / MAX_THETA * radius;
    c.beginPath(); c.moveTo(cx, cy); c.lineTo(x, y); c.stroke();
    c.fillStyle = mapPaper; c.beginPath(); c.arc(x, y, 7, 0, 2 * Math.PI); c.fill(); c.stroke();
    c.fillStyle = mapInk; c.beginPath(); c.arc(cx, cy, 3, 0, 2 * Math.PI); c.fill();
    c.font = style.tickFont; c.textAlign = 'center'; c.fillText(state.inclination === 0 ? '0' : '−', cx - radius * .72, cy + 5); c.fillText(state.inclination === 0 ? '0' : '+', cx + radius * .72, cy + 5);
    const scaleWidth = Math.min(width - 60, 280), scaleX = (width - scaleWidth) / 2, scaleY = height - 55;
    c.fillStyle = mapPaper; c.fillRect(scaleX, scaleY, scaleWidth, 11);
    for (let i = 0; i < scaleWidth; i++) { c.fillStyle = velocityColour(-150 + 300 * i / scaleWidth); c.fillRect(scaleX + i, scaleY, 1.2, 11); }
    c.fillStyle = style.muted; c.font = style.tickFont; c.textAlign = 'left'; c.fillText('−150', scaleX, scaleY + 32); c.textAlign = 'center'; c.fillText('0', width / 2, scaleY + 32); c.textAlign = 'right'; c.fillText('+150', scaleX + scaleWidth, scaleY + 32);
    const physical = angularLength(distance, state.theta), vc = referenceSpeed(angularLength(REFERENCE_DISTANCE, state.theta));
    const vlos = lineOfSightVelocity(vc, state.inclination, state.azimuth);
    setRead('vlos', `Δvlos = ${signed(vlos)} km/s`);
    setRead('axisRatio', `b/a = ${flatten.toFixed(3)}`);
    setRead('vc', `vc = ${vc.toFixed(1)} km/s`);
    setRead('selectedRadius', `R = ${physical.toFixed(2)} kpc`);
    node.setAttribute('aria-label', `合成视向速度场，倾角 ${state.inclination} 度，方位角 ${state.azimuth} 度，当前视向速度 ${signed(vlos)} 千米每秒`);
  }
  function drawRotation(style, distance) {
    drawField(distance);
    const samples = Array.from({length: 181}, (_, i) => inferAtAngle(i * .5, distance));
    const rotationChart = chart('rotation', {series: [
      {points: samples.map(r => [r.radius, r.observedSpeed]), color: style.text, label: 'vc'},
      {points: samples.map(r => [r.radius, lineOfSightVelocity(r.observedSpeed, state.inclination, state.azimuth)]), color: style.accent, dash: [7, 4], label: 'Δvlos'},
    ], xDomain: [0, angularLength(distance, MAX_THETA)], yDomain: [-150, 160], xLabel: '半径 R / kpc', yLabel: '速度 / km s⁻¹', yTicks: [-100, 0, 100]});
    const selected = inferAtAngle(state.theta, distance);
    guide(rotationChart, selected.radius); mark(rotationChart, selected.radius, selected.observedSpeed, style.text);
    mark(rotationChart, selected.radius, lineOfSightVelocity(selected.observedSpeed, state.inclination, state.azimuth), style.accent);
  }
  function drawMass(style, distance) {
    const samples = Array.from({length: 181}, (_, i) => inferAtAngle(i * .5, distance, state.stellarScale, state.haloScale));
    const points = [5, 10, 18, 28, 40, 55, 70, 85].map(theta => inferAtAngle(theta, distance));
    const selected = inferAtAngle(state.theta, distance, state.stellarScale, state.haloScale);
    const speedChart = chart('mass-speed', {series: [
      {points: points.map(r => [r.radius, r.observedSpeed]), connect: false, color: style.text, label: '基准取样'},
      {points: samples.map(r => [r.radius, r.modelSpeed]), color: style.accent, label: '合成模型'},
      ...['stars', 'gas', 'halo'].map(name => ({points: samples.map(r => [r.radius, Math.sqrt(r[name + '2'])]), color: componentColours[name], dash: [5, 4], width: 1.6})),
    ], xDomain: [0, angularLength(distance, MAX_THETA)], yDomain: [0, 200], xLabel: '半径 R / kpc', yLabel: 'vc / km s⁻¹', yTicks: [0, 50, 100, 150, 200]});
    guide(speedChart, selected.radius); mark(speedChart, selected.radius, selected.observedSpeed, style.text);
    const massChart = chart('mass-profile', {series: [
      {points: samples.map(r => [r.radius, r.dynamicalMass / 1e10]), color: style.text, label: '旋转所需'},
      {points: samples.map(r => [r.radius, r.baryonicEquivalentMass / 1e10]), color: style.accent, dash: [6, 4], label: '恒星 + 气体'},
    ], xDomain: [0, angularLength(distance, MAX_THETA)], yDomain: [0, 12], xLabel: '半径 R / kpc', yLabel: 'Meq / 10¹⁰ M☉', yTicks: [0, 4, 8, 12]});
    guide(massChart, selected.radius); mark(massChart, selected.radius, selected.dynamicalMass / 1e10, style.text); mark(massChart, selected.radius, selected.baryonicEquivalentMass / 1e10, style.accent);
    setRead('mass', `Meq = ${(selected.dynamicalMass / 1e10).toFixed(2)} × 10¹⁰ M☉`);
    setRead('rotationResidual', `速度残差 ${rotationResidual(distance, state.stellarScale, state.haloScale).toFixed(1)} km/s`);
  }
  function draw() {
    if (disposed || !root.isConnected) return;
    const style = getGraphicStyle(root), distance = distanceFromModulus(state.mu);
    q('[data-value="mu"]').textContent = state.mu.toFixed(3);
    q('[data-value="theta"]').textContent = state.theta.toFixed(1);
    q('[data-value="stellarScale"]').textContent = state.stellarScale.toFixed(2);
    q('[data-value="haloScale"]').textContent = state.haloScale.toFixed(2);
    setRead('distance', `${distance.toFixed(1)} kpc`);
    setRead('radius', `R = ${angularLength(distance, state.theta).toFixed(2)} kpc`);
    if (currentMode === 'distance') drawDistance(style, distance);
    else if (currentMode === 'rotation') drawRotation(style, distance);
    else drawMass(style, distance);
  }
  function setMode(next) {
    currentMode = Object.hasOwn(modeNames, next) ? next : 'distance';
    for (const button of root.querySelectorAll('[data-mode]')) button.setAttribute('aria-pressed', String(button.dataset.mode === currentMode));
    for (const panel of root.querySelectorAll('[data-gm-panel]')) panel.hidden = panel.dataset.gmPanel !== currentMode;
    for (const note of root.querySelectorAll('[data-gm-notes]')) note.hidden = note.dataset.gmNotes !== currentMode;
    commonControls.append(radiusControl);
    radiusControl.hidden = currentMode === 'distance';
    commonControls.classList.toggle('gm-common-single', currentMode === 'rotation');
    if (currentMode === 'rotation') {
      q('.gm-field-figure').append(radiusControl);
      q('[data-gm-panel="rotation"]').append(commonControls);
    } else q('.gm-heading').after(commonControls);
    q('[data-gm-identity]').textContent = currentMode === 'distance' ? '合成造父样本 · 近红外 Wesenheit' : '解析教学模型 · M33 参考尺度';
    draw();
  }
  function inputValue(key, value) {
    const input = q(`[data-key="${key}"]`);
    input.value = String(value); input.dispatchEvent(new win.Event('input', {bubbles: true}));
  }
  const click = event => {
    const modeButton = event.target.closest('button[data-mode]');
    if (modeButton) setMode(modeButton.dataset.mode);
    if (event.target.closest('[data-gm-reset]')) {Object.assign(state, defaults); syncControls(root, state); draw();}
    if (event.target.closest('[data-gm-fit]')) inputValue('mu', fitModulus());
  };
  const selectField = event => {
    if (!fieldGeometry || currentMode !== 'rotation') return;
    const box = plots.field.getBoundingClientRect(), g = fieldGeometry;
    const x = (event.clientX - box.left - g.cx) / g.radius * MAX_THETA;
    const y = -(event.clientY - box.top - g.cy) / g.radius / g.flatten * MAX_THETA;
    const theta = Math.hypot(x, y);
    if (theta < 1 || theta > MAX_THETA) return;
    inputValue('theta', theta); inputValue('azimuth', (Math.atan2(y, x) * 180 / Math.PI + 360) % 360);
  };
  const selectCepheid = event => {
    if (!plGeometry || currentMode !== 'distance') return;
    const box = plots.pl.getBoundingClientRect(), x = event.clientX - box.left, y = event.clientY - box.top;
    let best = null, bestDistance = 28;
    CEPHEIDS.forEach((star, i) => {const p = plGeometry.toPixel(star.period, star.magnitude), delta = Math.hypot(x - p[0], y - p[1]); if (delta < bestDistance) {best = i; bestDistance = delta;}});
    if (best !== null) inputValue('cepheid', best);
  };
  root.addEventListener('click', click); plots.field.addEventListener('click', selectField); plots.pl.addEventListener('click', selectCepheid);
  let resizeFrame = 0;
  const observer = new win.ResizeObserver(() => {win.cancelAnimationFrame(resizeFrame); resizeFrame = win.requestAnimationFrame(draw);});
  observer.observe(root);
  syncControls(root, state); setMode(currentMode);
  return () => {
    if (disposed) return; disposed = true;
    observer.disconnect(); win.cancelAnimationFrame(resizeFrame);
    root.removeEventListener('click', click); plots.field.removeEventListener('click', selectField); plots.pl.removeEventListener('click', selectCepheid);
    disposeControls(); disposeDisclosures(); disposeNavigation(); disposePresentation(); root.remove();
  };
}
