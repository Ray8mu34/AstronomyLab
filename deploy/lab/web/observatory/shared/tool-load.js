// Keep transport failures separate from valid, but unusable, published content.
export class ContentLoadError extends Error {
  constructor(message, {url, status, cause} = {}) {
    super(message, {cause});
    this.name = 'ContentLoadError';
    this.url = url;
    this.status = status;
  }
}

export async function loadJSON(url, {signal, validate, fetchImpl = globalThis.fetch} = {}) {
  const response = await fetchImpl(url, {signal, cache: 'no-cache'});
  if (!response.ok) throw new ContentLoadError(`请求失败（HTTP ${response.status}）`, {url, status: response.status});
  let data;
  try { data = await response.json(); }
  catch (cause) {
    if (cause.name === 'AbortError') throw cause;
    throw new ContentLoadError('返回的数据无法读取', {url, cause});
  }
  if (validate && !validate(data)) throw new ContentLoadError('返回的数据缺少必要内容', {url});
  return data;
}

export function createRouteRequests() {
  let serial = 0, controller;
  return {
    begin() {
      controller?.abort();
      controller = new AbortController();
      const id = ++serial;
      return {id, signal: controller.signal, isCurrent: () => id === serial && !controller.signal.aborted};
    },
    cancel() { controller?.abort(); serial++; }
  };
}
