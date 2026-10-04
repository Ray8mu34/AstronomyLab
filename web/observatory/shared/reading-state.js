const STORE_KEY = 'astronomy:reading:v1';
const ENTRY_PATTERN = /^[a-zA-Z0-9_-]{1,100}$/;
const BLOCK_SELECTOR = 'h1,h2,h3,h4,p,figure,table,pre,li';

function newEntryId() {
  return globalThis.crypto?.randomUUID?.() ?? `entry-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function createHistoryState(previous = null, entryId = newEntryId()) {
  const base = previous && typeof previous === 'object' ? previous : {};
  return {...base, astronomy: {...(base.astronomy && typeof base.astronomy === 'object' ? base.astronomy : {}), entryId}};
}

export function ensureHistoryEntry(win = window) {
  const current = win.history.state;
  if (typeof current?.astronomy?.entryId === 'string' && ENTRY_PATTERN.test(current.astronomy.entryId)) return current.astronomy.entryId;
  const state = createHistoryState(current);
  win.history.replaceState(state, '', win.location.href);
  return state.astronomy.entryId;
}

export function routeAddress(location) {
  return location.pathname + location.search + location.hash;
}

export function normalizeSnapshot(value) {
  if (!value || !Number.isFinite(value.y) || value.y < 0 || value.y > 10000000) return null;
  const block = Number.isInteger(value.block) && value.block >= 0 && value.block < 10000 ? value.block : null;
  return {
    y: value.y, block,
    offset: block !== null && Number.isFinite(value.offset) && Math.abs(value.offset) < 1000000 ? value.offset : 0,
    openDetails: Array.isArray(value.openDetails) ? value.openDetails.filter(index => Number.isInteger(index) && index >= 0 && index < 100) : []
  };
}

export function createReadingStore(storage, limit = 60) {
  const memory = new Map();
  try {
    const saved = JSON.parse(storage?.getItem(STORE_KEY) || 'null');
    if (saved?.version === 1 && Array.isArray(saved.entries)) {
      for (const item of saved.entries.slice(-limit)) {
        const snapshot = normalizeSnapshot(item?.snapshot);
        if (snapshot && typeof item.id === 'string' && ENTRY_PATTERN.test(item.id) && typeof item.href === 'string' && /^\/read\/\d{2}(?:[?#]|$)/.test(item.href)) memory.set(item.id, {href: item.href, snapshot});
      }
    }
  } catch { /* Session storage may be disabled; this tab still has memory. */ }
  const persist = () => {
    try { storage?.setItem(STORE_KEY, JSON.stringify({version: 1, entries: [...memory].map(([id, value]) => ({id, ...value}))})); }
    catch { /* A full or disabled store must not block navigation. */ }
  };
  return {
    save(id, href, value) {
      const snapshot = normalizeSnapshot(value);
      if (!snapshot || !ENTRY_PATTERN.test(id) || !/^\/read\/\d{2}(?:[?#]|$)/.test(href)) return;
      memory.delete(id);
      memory.set(id, {href, snapshot});
      while (memory.size > limit) memory.delete(memory.keys().next().value);
      persist();
    },
    get(id, href) {
      const record = memory.get(id);
      return record?.href === href ? normalizeSnapshot(record.snapshot) : null;
    }
  };
}

export function indexReadingBlocks(root) {
  const blocks = [...root.querySelectorAll(BLOCK_SELECTOR)].filter(node => !node.closest('#TOC,.article-tools,.paragraph-experiments'));
  blocks.forEach((node, index) => node.dataset.readingBlock = String(index));
  return blocks;
}

export function captureReadingPosition(root, win = window) {
  const blocks = [...root.querySelectorAll('[data-reading-block]')];
  let chosen = null, distance = Infinity;
  for (const node of blocks) {
    if (!node.getClientRects().length) continue;
    const rect = node.getBoundingClientRect();
    if (rect.bottom < 0) continue;
    const score = rect.top <= 0 ? Math.abs(rect.top) : rect.top + win.innerHeight;
    if (score < distance) { chosen = node; distance = score; }
  }
  return {
    y: Math.max(0, win.scrollY), block: chosen ? Number(chosen.dataset.readingBlock) : null,
    offset: chosen?.getBoundingClientRect().top ?? 0,
    openDetails: [...root.querySelectorAll('details')].flatMap((node, index) => node.open ? [index] : [])
  };
}

export function restorationTarget({kind, snapshot, hash}) {
  if (['initial', 'pop', 'retry'].includes(kind) && normalizeSnapshot(snapshot)) return {snapshot: normalizeSnapshot(snapshot)};
  return hash ? {hash} : {top: true};
}

export function decodeAnchor(hash) {
  const value = String(hash || '').replace(/^#/, '');
  try { return decodeURIComponent(value); } catch { return value; }
}

// Follow the paragraph, rather than a raw pixel offset, while images and styles settle.
// A wheel, touch, pointer, or navigation key immediately gives control back to the reader.
export function restoreReadingPosition(root, win = window, target = {}, onSettled = () => {}) {
  const snapshot = normalizeSnapshot(target.snapshot);
  const details = [...root.querySelectorAll('details')];
  if (snapshot) details.forEach((node, index) => node.open = snapshot.openDetails.includes(index));
  const anchor = target.hash ? win.document.getElementById(decodeAnchor(target.hash)) : null;
  for (let node = anchor?.parentElement; node; node = node.parentElement) if (node.tagName === 'DETAILS') node.open = true;
  const block = snapshot?.block !== null && snapshot ? root.querySelector(`[data-reading-block="${snapshot.block}"]`) : null;
  const oldOverflowAnchor = root.style.overflowAnchor;
  root.style.overflowAnchor = 'none';
  let stopped = false, frame = null, quietTimer = null, pending = 0;
  const removers = [];
  const listen = (host, type, listener, options) => {
    host.addEventListener(type, listener, options);
    removers.push(() => host.removeEventListener(type, listener, options));
  };
  const cancel = () => {
    if (stopped) return;
    stopped = true;
    if (frame !== null) win.cancelAnimationFrame(frame);
    win.clearTimeout(quietTimer);
    win.clearTimeout(deadline);
    observer?.disconnect();
    removers.forEach(remove => remove());
    root.style.overflowAnchor = oldOverflowAnchor;
    onSettled();
  };
  const apply = () => {
    frame = null;
    if (stopped || !root.isConnected) return;
    let top = snapshot?.y ?? 0;
    if (block?.getClientRects().length) top = win.scrollY + block.getBoundingClientRect().top - snapshot.offset;
    else if (anchor?.getClientRects().length) top = win.scrollY + anchor.getBoundingClientRect().top - 24;
    win.scrollTo({left: 0, top: Math.max(0, top), behavior: 'instant'});
    if (!pending) {
      win.clearTimeout(quietTimer);
      quietTimer = win.setTimeout(cancel, 180);
    }
  };
  const schedule = () => {
    if (stopped) return;
    win.clearTimeout(quietTimer);
    if (frame === null) frame = win.requestAnimationFrame(apply);
  };
  const waitFor = (host, success, failure) => {
    pending++;
    let done = false;
    const settled = () => {
      if (done) return;
      done = true;
      pending--;
      schedule();
    };
    listen(host, success, settled, {once: true});
    listen(host, failure, settled, {once: true});
  };
  for (const image of root.querySelectorAll('img')) if (!image.complete) waitFor(image, 'load', 'error');
  for (const link of win.document.querySelectorAll('link[rel="stylesheet"]')) if (!link.sheet) waitFor(link, 'load', 'error');
  if (win.document.fonts?.status === 'loading') {
    pending++;
    win.document.fonts.ready.then(() => { pending--; schedule(); }, () => { pending--; schedule(); });
  }
  const observer = win.ResizeObserver ? new win.ResizeObserver(schedule) : null;
  observer?.observe(root);
  const scrollingKey = event => {
    if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) cancel();
  };
  listen(win, 'wheel', cancel, {passive: true});
  listen(win, 'touchstart', cancel, {passive: true});
  listen(win, 'pointerdown', cancel, {passive: true});
  listen(win, 'keydown', scrollingKey);
  const deadline = win.setTimeout(cancel, 15000);
  schedule();
  return {cancel, isPending: () => !stopped};
}
