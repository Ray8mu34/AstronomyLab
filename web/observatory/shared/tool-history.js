export const routeAddress=url=>url.pathname+url.search+url.hash;
export function createHistoryState(previous=null){
 const base=previous&&typeof previous==='object'?previous:{};
 const entryId=globalThis.crypto?.randomUUID?.()||`entry-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
 return {...base,astronomy:{...(base.astronomy&&typeof base.astronomy==='object'?base.astronomy:{}),entryId}};
}
