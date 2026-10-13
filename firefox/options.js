const api = globalThis.browser ?? globalThis.chrome;
const $ = (id) => document.getElementById(id);
const DEF = { enabled: true, scanUrls: true, strict: false, customKeywords: [], customDomains: [], allowDomains: [] };
const lines = (t) => t.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);

async function load() {
  const { settings = {}, listInfo } = await api.storage.local.get(['settings', 'listInfo']);
  const s = { ...DEF, ...settings };
  for (const k of ['enabled', 'scanUrls', 'strict']) $(k).checked = s[k];
  for (const k of ['customKeywords', 'customDomains', 'allowDomains']) $(k).value = s[k].join('\n');
  $('info').textContent = listInfo?.count
    ? `${listInfo.count.toLocaleString()} domains · source updated ${listInfo.listUpdated || '?'}` + (listInfo.ok === false ? ' · last refresh failed' : '')
    : 'Using built-in starter list. Download pending…';
}
$('save').onclick = async () => {
  const settings = {
    enabled: $('enabled').checked, scanUrls: $('scanUrls').checked, strict: $('strict').checked,
    customKeywords: lines($('customKeywords').value), customDomains: lines($('customDomains').value),
    allowDomains: lines($('allowDomains').value)
  };
  await api.storage.local.set({ settings });
  $('saved').textContent = 'Saved ✓';
  setTimeout(() => ($('saved').textContent = ''), 2000);
};
$('update').onclick = async () => {
  $('info').textContent = 'Downloading…';
  const r = await api.runtime.sendMessage({ type: 'updateLists' });
  if (!r?.ok) $('info').textContent = 'Update failed: ' + (r?.error || 'unknown');
  else await load();
};
load();
