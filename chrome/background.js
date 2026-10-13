import {
  DEFAULT_KEYWORDS, STRICT_KEYWORDS, SEED_DOMAINS, BAD_TLDS,
  compileKeywords, normalize, extractQueryTexts, hostCandidates, cleanDomain
} from './lib.js';

const META_URL = 'https://raw.githubusercontent.com/Bon-Appetit/porn-domains/main/meta.json';
const DEFAULTS = { enabled: true, scanUrls: true, strict: false, customKeywords: [], customDomains: [], allowDomains: [] };

/* ---------- settings / keyword state ---------- */
let cache = null;
async function getState() {
  if (cache) return cache;
  const { settings = {} } = await chrome.storage.local.get('settings');
  const s = { ...DEFAULTS, ...settings };
  const kws = [...DEFAULT_KEYWORDS, ...(s.strict ? STRICT_KEYWORDS : []), ...s.customKeywords];
  cache = {
    s, kws,
    regex: compileKeywords(kws),
    custom: new Set(s.customDomains.map(cleanDomain).filter(Boolean)),
    allow: new Set(s.allowDomains.map(cleanDomain).filter(Boolean))
  };
  return cache;
}
async function publishKeywords() {
  const st = await getState();
  await chrome.storage.local.set({ activeKeywords: st.kws });
}

/* ---------- domain list (large Set, lazily loaded) ---------- */
let domainLoading = null;
function loadDomains() {
  if (!domainLoading) {
    domainLoading = (async () => {
      const { domainBlob } = await chrome.storage.local.get('domainBlob');
      const set = new Set(SEED_DOMAINS);
      if (domainBlob) for (const l of domainBlob.split('\n')) if (l) set.add(l);
      return set;
    })();
  }
  return domainLoading;
}

function parseDomains(text) {
  const out = [];
  for (let line of text.split(/\r?\n/)) {
    line = line.trim();
    if (!line || line[0] === '#' || line[0] === '!') continue;
    const tok = line.split(/\s+/).pop();               // supports hosts-file format too
    const d = cleanDomain(tok);
    if (d && d.includes('.')) out.push(d);
  }
  return out;
}

async function updateLists() {
  try {
    const meta = await (await fetch(META_URL, { cache: 'no-store' })).json();
    const block = parseDomains(await (await fetch(meta.blocklist.raw_url)).text());
    let allow = new Set();
    try { allow = new Set(parseDomains(await (await fetch(meta.allowlist.raw_url)).text())); } catch { /* optional */ }
    const final = block.filter((d) => !allow.has(d));
    await chrome.storage.local.set({
      domainBlob: final.join('\n'),
      listInfo: { count: final.length, listUpdated: meta.blocklist.updated, fetchedAt: Date.now(), ok: true }
    });
    domainLoading = null;
    return { ok: true, count: final.length };
  } catch (e) {
    await chrome.storage.local.set({ listInfo: { ...(await chrome.storage.local.get('listInfo')).listInfo, ok: false, error: String(e) } });
    return { ok: false, error: String(e) };
  }
}

/* ---------- evaluation ---------- */
async function evaluate(urlStr) {
  const st = await getState();
  if (!st.s.enabled) return null;
  let u;
  try { u = new URL(urlStr); } catch { return null; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;

  const host = cleanDomain(u.hostname);
  const cands = hostCandidates(host);
  if (cands.some((c) => st.allow.has(c))) return null;

  // 1. domain
  if (BAD_TLDS.has(host.split('.').pop())) return { reason: 'domain', host };
  const set = await loadDomains();
  if (cands.some((c) => set.has(c) || st.custom.has(c))) return { reason: 'domain', host };

  if (!st.regex) return null;

  // 2. search queries (any engine: q, text, query, p, wd, ...)
  for (const t of extractQueryTexts(u)) if (st.regex.test(normalize(t))) return { reason: 'search' };

  // 3. keywords in hostname / path (address bar URLs)
  if (st.s.scanUrls) {
    let path = u.pathname;
    try { path = decodeURIComponent(path); } catch { /* keep raw */ }
    if (st.regex.test(normalize(host.replace(/\./g, ' ') + ' ' + path))) return { reason: 'url' };
  }
  return null;
}

function block(tabId, info) {
  const q = new URLSearchParams({ r: info.reason });
  if (info.reason === 'domain' && info.host) q.set('h', info.host);
  chrome.tabs.update(tabId, { url: chrome.runtime.getURL('blocked.html?' + q) }).catch(() => {});
}

async function onNav(d) {
  if (d.frameId !== 0) return;
  const hit = await evaluate(d.url);
  if (hit) block(d.tabId, hit);
}

// Registered synchronously so they survive service-worker restarts.
chrome.webNavigation.onBeforeNavigate.addListener(onNav);
chrome.webNavigation.onCommitted.addListener(onNav);                 // catches redirect targets
chrome.webNavigation.onHistoryStateUpdated.addListener(onNav);       // SPA searches (pushState)
chrome.webNavigation.onReferenceFragmentUpdated.addListener(onNav);  // #q= style searches

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  if (msg?.type === 'block' && sender.tab) { block(sender.tab.id, { reason: 'search' }); }
  if (msg?.type === 'updateLists') { updateLists().then(respond); return true; }
});

chrome.storage.onChanged.addListener((ch, area) => {
  if (area !== 'local') return;
  if (ch.settings) { cache = null; publishKeywords(); }
});

chrome.action.onClicked.addListener(() => chrome.runtime.openOptionsPage());

function ensureAlarm() { chrome.alarms.create('update-lists', { periodInMinutes: 60 * 24 * 3 }); }
chrome.alarms.onAlarm.addListener((a) => { if (a.name === 'update-lists') updateLists(); });
chrome.runtime.onInstalled.addListener(() => { publishKeywords(); ensureAlarm(); updateLists(); });
chrome.runtime.onStartup.addListener(() => { publishKeywords(); ensureAlarm(); });
