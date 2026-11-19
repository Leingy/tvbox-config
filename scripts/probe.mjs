import fs from 'node:fs';

const TIMEOUT = Number(process.env.PROBE_TIMEOUT || 8000);
const CONCURRENCY = Number(process.env.PROBE_CONCURRENCY || 24);
const KEYWORD = process.env.PROBE_KEYWORD || '庆余年';

const cfg = JSON.parse(fs.readFileSync('tvbox.json', 'utf8'));
const sites = cfg.sites || [];
console.log(`probe ${sites.length} sites, concurrency=${CONCURRENCY}, timeout=${TIMEOUT}ms`);

async function probe(site) {
  let target = null;
  const api = typeof site.api === 'string' ? site.api : '';
  const ext = typeof site.ext === 'string' ? site.ext : JSON.stringify(site.ext ?? '');
  if (/^https?:\/\//.test(api)) target = api;
  else {
    const m = ext.match(/(https?:\/\/[^"'\s\\|]+)/);
    if (m) target = m[1];
  }
  if (!target) return { key: site.key, name: site.name, ok: false, ms: 0, hits: 0, reason: 'no-http-api' };

  const sep = target.includes('?') ? '&' : '?';
  const url = `${target}${sep}ac=videolist&wd=${encodeURIComponent(KEYWORD)}`;
  const t0 = Date.now();
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), TIMEOUT);
    const res = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': 'okhttp/3.15' } });
    clearTimeout(timer);
    const body = await res.text();
    const hits = (body.match(/"vod_id"/g) || []).length;
    return { key: site.key, name: site.name, ok: hits > 0, ms: Date.now() - t0, hits, status: res.status, reason: '' };
  } catch (e) {
    return {
      key: site.key,
      name: site.name,
      ok: false,
      ms: Date.now() - t0,
      hits: 0,
      reason: e.name === 'AbortError' ? 'timeout' : String(e.message).slice(0, 80)
    };
  }
}

const out = new Array(sites.length);
let cursor = 0;
let done = 0;
async function worker() {
  while (cursor < sites.length) {
    const i = cursor++;
    out[i] = await probe(sites[i]);
    done++;
    if (done % 100 === 0) console.log(`  ${done}/${sites.length}`);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/probe.json', JSON.stringify(out, null, 1));
const ok = out.filter(x => x.ok);
console.log(`reachable ${ok.length}/${out.length}`);
for (const t of ok.sort((a, b) => a.ms - b.ms).slice(0, 15)) {
  console.log(`  ${String(t.ms).padStart(5)}ms ${String(t.hits).padStart(3)} ${t.name} [${t.key}]`);
}
