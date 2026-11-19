import fs from 'node:fs';

const raw = JSON.parse(fs.readFileSync('tvbox.json', 'utf8'));
let fail = new Map();

if (fs.existsSync('data/probe.json')) {
  const probe = JSON.parse(fs.readFileSync('data/probe.json', 'utf8'));
  fail = new Map(
    probe
      .filter(p => !p.ok && p.reason && p.reason !== 'no-http-api')
      .map(p => [p.key, p.reason])
  );
} else {
  console.log('no probe data, keep every site');
}

const removed = [];
const kept = raw.sites.filter(s => {
  const isHttp = /^https?:\/\//.test(String(s.api || ''));
  if (isHttp && fail.has(s.key)) {
    removed.push({ key: s.key, name: s.name, reason: fail.get(s.key) });
    return false;
  }
  return true;
});

const slim = { ...raw, sites: kept };
fs.writeFileSync('tvbox.slim.json', JSON.stringify(slim, null, 2));

const stats = {
  updatedAt: new Date().toISOString(),
  upstreamSites: raw.sites.length,
  removed: removed.length,
  kept: kept.length,
  removedList: removed
};
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/stats.json', JSON.stringify(stats, null, 2));

console.log(`sites ${raw.sites.length} -> ${kept.length} (removed ${removed.length})`);
console.log(`tvbox.json ${(fs.statSync('tvbox.json').size / 1024).toFixed(0)} KB`);
console.log(`tvbox.slim.json ${(fs.statSync('tvbox.slim.json').size / 1024).toFixed(0)} KB`);
