// Best-effort search-box interception. Network-level blocking lives in background.js.
(() => {
  const PARAMS = new Set(['q','query','text','p','wd','word','search','search_query','searchquery','searchterm','s','k','kw','keyword','keywords','term','terms','qs','find','qry','ask']);
  const ENGINE = /(^|\.)(google|bing|duckduckgo|yandex|yahoo|brave|ecosia|startpage|baidu|qwant|naver|seznam|mojeek|kagi|ask|search)\./i;
  const onEngine = ENGINE.test(location.hostname);

  const norm = (input) => {
    let s = String(input ?? '');
    try { s = decodeURIComponent(s.replace(/\+/g, ' ')); } catch { s = s.replace(/\+/g, ' '); }
    return s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[\u200b-\u200f\u2060\ufeff\u00ad]/g, '').replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ').trim();
  };
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const compile = (list) => {
    const parts = [...new Set(list.map(norm).filter(Boolean))].map((n) => n.split(' ').map(esc).join('\\s*'));
    if (!parts.length) return null;
    parts.sort((a, b) => b.length - a.length);
    return new RegExp('(?<![\\p{L}\\p{N}\\p{M}])(?:' + parts.join('|') + ')(?:s|es)?(?![\\p{L}\\p{N}\\p{M}])', 'u');
  };

  let re = null, enabled = true, allowed = false;
  async function load() {
    try {
      const d = await chrome.storage.local.get(['activeKeywords', 'settings']);
      enabled = d.settings?.enabled !== false;
      const allow = (d.settings?.allowDomains || []).map((x) => String(x).trim().toLowerCase());
      allowed = allow.some((a) => a && (location.hostname === a || location.hostname.endsWith('.' + a)));
      re = d.activeKeywords?.length ? compile(d.activeKeywords) : null;
    } catch { /* extension reloaded; ignore */ }
  }
  load();
  chrome.storage.onChanged.addListener(load);

  function isSearchField(el) {
    if (!el || el.nodeType !== 1) return false;
    const tag = el.tagName;
    const type = (el.getAttribute('type') || 'text').toLowerCase();
    const role = (el.getAttribute('role') || '').toLowerCase();
    if (tag === 'INPUT' && !['text', 'search', ''].includes(type)) return false;
    const editable = el.isContentEditable;
    if (tag !== 'INPUT' && tag !== 'TEXTAREA' && !editable) return false;
    if (onEngine) return true;           // any text box on a search engine
    if (type === 'search' || role === 'searchbox' || role === 'combobox') return true;
    if (editable) return false;
    const name = (el.getAttribute('name') || '').toLowerCase();
    if (PARAMS.has(name)) return true;
    const hay = [name, el.id, el.getAttribute('placeholder'), el.getAttribute('aria-label')].join(' ');
    return /search|query|\bfind\b/i.test(hay);
  }

  const textOf = (el) => (el.isContentEditable ? el.textContent : el.value) || '';
  const bad = (el) => enabled && !allowed && re && isSearchField(el) && re.test(norm(textOf(el)));

  function stop(e, el) {
    e.preventDefault();
    e.stopImmediatePropagation();
    try { if (el.isContentEditable) el.textContent = ''; else el.value = ''; } catch { /* ignore */ }
    chrome.runtime.sendMessage({ type: 'block' }).catch(() => {});
  }

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' || e.isComposing) return;
    const el = e.composedPath()[0];
    if (bad(el)) stop(e, el);
  }, true);

  document.addEventListener('submit', (e) => {
    const f = e.target;
    if (!(f instanceof HTMLFormElement)) return;
    for (const el of f.elements) if (bad(el)) { stop(e, el); return; }
  }, true);
})();
