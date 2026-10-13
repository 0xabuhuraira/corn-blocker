// Shared logic used by the background service worker (ES module).
// content.js contains a compact copy of normalize()/compileKeywords().

export const QUERY_PARAMS = new Set([
  'q', 'query', 'text', 'p', 'wd', 'word', 'search', 'search_query', 'searchquery',
  'searchterm', 'search_term', 's', 'k', 'kw', 'keyword', 'keywords', 'term', 'terms',
  'qs', 'find', 'k1', 'qry', 'ss', 'sq', 'string', 'phrase', 'input', 'oq', 'ask'
]);

export const BAD_TLDS = new Set(['xxx', 'porn', 'sex', 'sexy', 'adult', 'porno']);

export const DEFAULT_KEYWORDS = [
  // generic
  'porn', 'porno', 'pornography', 'pornstar', 'porn star', 'pornhub', 'xvideos', 'xnxx', 'xhamster',
  'redtube', 'youporn', 'spankbang', 'xxx', 'nsfw', 'sex video', 'sex videos', 'sex tape', 'sex cam',
  'sexcam', 'sex chat', 'live sex', 'sex stories', 'sex story', 'sex scene', 'sex movie', 'sex movies',
  'sex tube', 'sex pics', 'sex photos', 'sex gif', 'free sex', 'adult video', 'adult videos',
  'adult content', 'adult movie', 'adult movies', 'erotic', 'erotica', 'lewd', 'lewds', 'smut',
  'nude', 'nudes', 'naked', 'nudity', 'topless', 'camgirl', 'cam girl', 'cam girls', 'camwhore',
  'webcam girls', 'onlyfans leak', 'onlyfans leaks', 'onlyfans nudes', 'fansly leaks', 'leaked nudes',
  'horny', 'slut', 'sluts', 'whore', 'whores', 'hotwife', 'hot wife', 'swinger', 'swingers',
  'stripper', 'strippers', 'striptease', 'upskirt', 'voyeur', 'hidden cam', 'spycam', 'peeping',
  // acts / genres
  'blowjob', 'blow job', 'handjob', 'hand job', 'footjob', 'titjob', 'rimjob', 'deepthroat',
  'deep throat', 'facial cumshot', 'cumshot', 'cum shot', 'cumming', 'creampie', 'cream pie',
  'gangbang', 'gang bang', 'bukkake', 'orgy', 'threesome', 'foursome', 'anal', 'anal sex',
  'squirt', 'squirting', 'fisting', 'gloryhole', 'glory hole', 'dildo', 'vibrator porn', 'masturbate',
  'masturbating', 'masturbation video', 'jerk off', 'jerking off', 'jizz', 'orgasm video', 'milf',
  'cougar porn', 'big tits', 'tits', 'titties', 'titty', 'boobs', 'busty', 'pussy', 'cock',
  'big cock', 'big dick', 'dick pic', 'dick pics', 'nipple', 'nipples', 'booty porn', 'twerk porn',
  'lesbian sex', 'gay sex', 'bareback', 'hardcore porn', 'softcore', 'incest', 'stepmom porn',
  'step mom', 'stepsis', 'step sis', 'step sister porn', 'stepbro', 'taboo porn', 'rough sex',
  'creampied', 'ass fuck', 'fuck video', 'fucking video', 'fucked', 'fuck me', 'fuck her',
  // fetish / kink
  'fetish', 'bdsm', 'bondage', 'femdom', 'maledom', 'dominatrix', 'domme', 'submissive porn',
  'cuckold', 'cuckolding', 'cuck', 'cuckquean', 'hotwifing', 'sissy', 'sissification', 'chastity cage',
  'feet fetish', 'foot fetish', 'latex fetish', 'furry porn', 'yiff', 'futa', 'futanari', 'shemale',
  'ladyboy', 'trap porn', 'tgirl', 'trans porn', 'femboy', 'femboys', 'femboi', 'tentacle', 'ahegao',
  'bestiality', 'zoophilia', 'watersports', 'pegging', 'spanking video',
  // anime / hentai / drawn
  'hentai', 'hentia', 'henti', 'nhentai', 'e-hentai', 'ehentai', 'hanime', 'ecchi', 'doujin',
  'doujinshi', 'yaoi', 'rule 34', 'rule34', 'r34', 'rule xxxiv', 'paheal', 'gelbooru', 'danbooru',
  'e621', 'fakku', 'hitomi.la', 'overflow hentai', 'oppai', 'waifu porn', 'lolicon', 'shotacon',
  'jailbait', 'cp porn', 'lewd anime', 'sfm porn', 'sfm animation', 'vore',
  // site brand names commonly typed as searches
  'brazzers', 'bangbros', 'naughty america', 'realitykings', 'reality kings', 'chaturbate', 'stripchat',
  'bongacams', 'cam4', 'livejasmin', 'myfreecams', 'eporner', 'tube8', 'porntrex', 'pornhat',
  'beeg', 'motherless', 'thumbzilla', 'tnaflix', 'xtube', 'hqporner', 'fapello', 'fapomania',
  'erome', 'coomer', 'kemono party', 'simpcity', 'thothub', 'nudostar', 'sexyforums', 'camwhores',
  'javhd', 'jav porn', 'javbus', 'missav', 'supjav', 'tokyomotion', 'literotica', 'sexstories',
  // Russian (Yandex, etc.)
  'порно', 'порево', 'порнуха', 'порнография', 'порнхаб', 'секс видео', 'секс ролики', 'секс чат',
  'эротика', 'эротическое видео', 'голые', 'голая', 'голый', 'обнаженные', 'обнажённые', 'хентай',
  'минет', 'трах', 'трахает', 'шлюха', 'шлюхи', 'проститутки', 'инцест', 'анал', 'камшот',
  'домашнее порно', 'сиськи', 'жопа порно', 'ню', 'вебкам', 'мастурбация', 'кончает',
  // Bengali (light coverage; extend in Options)
  'পর্ণ', 'পর্ন', 'পর্নো', 'সেক্স ভিডিও', 'ন্যাংটা', 'বাংলা চটি', 'চটি গল্প', 'xxx video', 'bangla choti',
  'choti golpo', 'bangla sex', 'bangla porn', 'desi porn', 'desi sex', 'desi mms', 'mms video leaked',
  // other languages (common)
  'porno gratis', 'videos porno', 'pornografía', 'sexo video', 'porno gratuit', 'film porno', 'sexe video',
  'sex film', 'pornofilme', 'geile fotzen', 'porn video'
];

// Optional "strict mode" extras: broader words with more false positives.
export const STRICT_KEYWORDS = ['sex', 'sexy', 'sexual', 'sexting', 'sext', 'boob', 'breast', 'lingerie', 'bikini', 'hot girls', 'kinky', 'kink', 'seduce', 'seductive', 'xxx rated', 'escort', 'escorts', 'hookup', 'onlyfans', 'fansly', 'playboy', 'penthouse', 'penis', 'vagina', 'clitoris'];

// Instant coverage before the big list has been downloaded.
export const SEED_DOMAINS = [
  'pornhub.com', 'xvideos.com', 'xnxx.com', 'xhamster.com', 'redtube.com', 'youporn.com',
  'spankbang.com', 'eporner.com', 'tube8.com', 'porn.com', 'brazzers.com', 'chaturbate.com',
  'stripchat.com', 'bongacams.com', 'cam4.com', 'livejasmin.com', 'onlyfans.com', 'fansly.com',
  'rule34.xxx', 'rule34.paheal.net', 'nhentai.net', 'e-hentai.org', 'hanime.tv', 'hentaihaven.xxx',
  'gelbooru.com', 'e621.net', 'motherless.com', 'beeg.com', 'tnaflix.com', 'thumbzilla.com',
  'porntrex.com', 'hqporner.com', 'fapello.com', 'erome.com', 'literotica.com', 'xhamster.desi',
  'pornhubpremium.com', 'xvideos2.com', 'xnxx.tv', 'sex.com', 'efukt.com', 'ixxx.com'
];

export function normalize(input) {
  let s = String(input ?? '');
  try { s = decodeURIComponent(s.replace(/\+/g, ' ')); } catch { s = s.replace(/\+/g, ' '); }
  return s.toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')               // Latin diacritics only (keeps Bengali/etc. marks)
    .replace(/[\u200b-\u200f\u2060\ufeff\u00ad]/g, '')
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ')
    .trim();
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export function compileKeywords(list) {
  const parts = [];
  for (const k of new Set(list)) {
    const n = normalize(k);
    if (!n) continue;
    parts.push(n.split(' ').map(esc).join('\\s*'));
  }
  if (!parts.length) return null;
  parts.sort((a, b) => b.length - a.length);
  return new RegExp(
    '(?<![\\p{L}\\p{N}\\p{M}])(?:' + parts.join('|') + ')(?:s|es)?(?![\\p{L}\\p{N}\\p{M}])', 'u'
  );
}

export function extractQueryTexts(urlObj) {
  const out = [];
  const take = (params) => { for (const [k, v] of params) if (QUERY_PARAMS.has(k.toLowerCase()) && v) out.push(v); };
  take(urlObj.searchParams);
  const h = urlObj.hash.replace(/^#!?\/?/, '').replace(/^\?/, '');
  if (h.includes('=')) { try { take(new URLSearchParams(h)); } catch { /* ignore */ } }
  return out;
}

export function hostCandidates(host) {
  const parts = host.split('.');
  const out = [];
  for (let i = 0; i < parts.length - 1; i++) out.push(parts.slice(i).join('.'));
  return out;
}

export function cleanDomain(d) {
  return String(d || '').trim().toLowerCase()
    .replace(/^[a-z]+:\/\//, '').replace(/^\|\|/, '').replace(/[\/^?#:].*$/, '')
    .replace(/^www\./, '').replace(/\.$/, '');
}
