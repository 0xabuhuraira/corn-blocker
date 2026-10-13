const api = globalThis.browser ?? globalThis.chrome;
const p = new URLSearchParams(location.search);
const r = p.get('r');
const h = (p.get('h') || '').replace(/[^a-z0-9.\-]/gi, '');
const msgs = {
  domain: h ? `The site "${h}" is on your blocklist.` : 'This site is on your blocklist.',
  search: 'That search contained a blocked term.',
  url: 'That address contained a blocked term.'
};
const quips = [
  'Time to husk this habit.',
  'Ear we go again. Take a breath.',
  "Don't be corny. Be proud of yourself.",
  'Every kernel of willpower counts.',
  'Stalk away from the screen for a minute.',
  'You are one tall glass of water away from a better mood.'
];
document.getElementById('msg').textContent = msgs[r] || 'Corn Blocker stopped this request.';
document.getElementById('quip').textContent = quips[Math.floor(Math.random() * quips.length)];
const NEWTAB = 'about:newtab';
document.getElementById('back').onclick = () => (history.length > 1 ? history.back() : api.tabs.update({ url: NEWTAB }));
document.getElementById('newtab').onclick = () => api.tabs.update({ url: NEWTAB });
