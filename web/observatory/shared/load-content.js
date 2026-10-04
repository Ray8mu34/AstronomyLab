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

export function validCatalog(data) {
  if (!data || !Array.isArray(data.articles) || data.articles.length !== 16 || !Array.isArray(data.assets)) return false;
  const numbers = new Set();
  for (const article of data.articles) {
    if (!article || !Number.isInteger(article.number) || article.number < 1 || article.number > 16 || typeof article.title !== 'string' || !article.title.trim() || numbers.has(article.number)) return false;
    numbers.add(article.number);
  }
  const assetIds = new Set();
  return data.assets.every(asset => {
    if (!asset || !['asset_id', 'title', 'local_path'].every(key => typeof asset[key] === 'string' && asset[key].trim()) || assetIds.has(asset.asset_id)) return false;
    if (!['creator', 'representation_type', 'credit', 'permission_or_license', 'modifications', 'source_page', 'used_by'].every(key => typeof asset[key] === 'string')) return false;
    assetIds.add(asset.asset_id);
    return true;
  });
}

export function validStatus(data) {
  return Boolean(data && typeof data.state === 'string' && data.state.trim() && Number.isInteger(data.count) && data.count >= 0);
}

export function validIntegration(data) {
  return validStatus(data) && typeof data.scope === 'string' && typeof data.model_visual_review === 'string';
}

export function validArticleHTML(html) {
  // An HTTP 200 error page or the application shell is not a lesson export.
  return typeof html === 'string' && /<body(?:\s[^>]*)?>[\s\S]*<\/body\s*>/i.test(html)
    && /<section\b[^>]*\bclass\s*=\s*["'][^"']*\blevel1\b[^"']*["'][^>]*>/i.test(html)
    && /<h1(?:\s[^>]*)?>[\s\S]+?<\/h1\s*>/i.test(html) && /<p(?:\s[^>]*)?>/i.test(html);
}

export async function loadArticleHTML(url, {signal, fetchImpl = globalThis.fetch} = {}) {
  const response = await fetchImpl(url, {signal, cache: 'no-cache'});
  if (!response.ok) throw new ContentLoadError(`请求失败（HTTP ${response.status}）`, {url, status: response.status});
  const html = await response.text();
  if (!validArticleHTML(html)) throw new ContentLoadError('返回的页面不是完整文章', {url});
  return html;
}

export function parseArticleHTML(html, Parser = globalThis.DOMParser) {
  const parsed = new Parser().parseFromString(html, 'text/html');
  if (!parsed.body?.querySelector('section.level1 > h1') || !parsed.body.querySelector('section.level1 p')) throw new ContentLoadError('文章缺少标题或正文');
  parsed.querySelector('#site-navigation')?.remove();
  parsed.querySelectorAll('script').forEach(script => script.remove());
  return parsed.body.innerHTML;
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
