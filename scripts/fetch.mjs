import fs from 'node:fs';

const UPSTREAMS = [
  'https://fastly.jsdelivr.net/gh/Lightconer/tvbox-ysc-config@main/output/%E5%8D%95%E4%BB%93%E8%81%9A%E5%90%88.json',
  'https://cdn.jsdelivr.net/gh/Lightconer/tvbox-ysc-config@main/output/%E5%8D%95%E4%BB%93%E8%81%9A%E5%90%88.json',
  'https://gcore.jsdelivr.net/gh/Lightconer/tvbox-ysc-config@main/output/%E5%8D%95%E4%BB%93%E8%81%9A%E5%90%88.json',
  'https://gh-proxy.org/https://raw.githubusercontent.com/Lightconer/tvbox-ysc-config/main/output/%E5%8D%95%E4%BB%93%E8%81%9A%E5%90%88.json',
  'https://ghproxy.net/https://raw.githubusercontent.com/Lightconer/tvbox-ysc-config/main/output/%E5%8D%95%E4%BB%93%E8%81%9A%E5%90%88.json'
];

let text = null;
for (const url of UPSTREAMS) {
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 20000);
    const res = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': 'okhttp/3.15' } });
    clearTimeout(timer);
    if (!res.ok) { console.log(`skip ${res.status} ${url}`); continue; }
    const body = await res.text();
    const cfg = JSON.parse(body);
    if (!Array.isArray(cfg.sites) || cfg.sites.length === 0) { console.log(`skip empty ${url}`); continue; }
    text = JSON.stringify(cfg, null, 2);
    console.log(`OK ${cfg.sites.length} sites from ${url}`);
    break;
  } catch (e) {
    console.log(`fail ${url} :: ${e.message}`);
  }
}

if (!text) {
  console.error('所有上游都失败，保留现有 tvbox.json');
  process.exit(0);
}

fs.writeFileSync('tvbox.json', text);
console.log(`wrote tvbox.json ${(text.length / 1024).toFixed(0)} KB`);
