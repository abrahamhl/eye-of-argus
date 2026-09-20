/* Eye of Argus — field validation PWA. Offline-first, no dependencies, no account.
   Stores ground-truth observations in localStorage and exports JSONL for the
   calibration pipeline. Never collects personal data. */

const STORAGE_KEY = 'eoa.groundtruth.v1';
const APP_VERSION = '0.1.0';

const $ = (id) => document.getElementById(id);

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function save(records) { localStorage.setItem(STORAGE_KEY, JSON.stringify(records)); }
function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function slug(text) {
  return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'place';
}

function setNet() {
  const net = $('net');
  net.textContent = navigator.onLine ? 'status: online (works offline too)' : 'status: OFFLINE — still recording';
  net.classList.toggle('offline', !navigator.onLine);
}

function useLocation() {
  const status = $('geoStatus');
  if (!navigator.geolocation) { status.textContent = 'geolocation unavailable — enter manually'; return; }
  status.textContent = 'locating…';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      $('lat').value = pos.coords.latitude.toFixed(5);
      $('lon').value = pos.coords.longitude.toFixed(5);
      status.textContent = `±${Math.round(pos.coords.accuracy)} m accuracy`;
    },
    (error) => { status.textContent = `location failed (${error.message}) — enter manually`; },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
  );
}

function render() {
  const records = load();
  $('count').textContent = String(records.length);
  const list = $('list');
  list.innerHTML = records.slice().reverse().map((r, i) => {
    const index = records.length - 1 - i;
    const counts = (r.countLow != null || r.countHigh != null) ? ` · ${r.countLow ?? '?'}–${r.countHigh ?? '?'}` : '';
    return `<li><b>${escapeHtml(r.band)}</b> · ${escapeHtml(r.name || r.placeId)}${escapeHtml(counts)} · ${escapeHtml(r.observer)} · ${escapeHtml(r.windowStart)} <button data-remove="${index}" class="link danger">remove</button></li>`;
  }).join('');
  list.querySelectorAll('[data-remove]').forEach((btn) => btn.addEventListener('click', () => {
    const next = load();
    next.splice(Number(btn.dataset.remove), 1);
    save(next);
    render();
  }));
}

function saveObservation() {
  const name = $('name').value.trim();
  const observer = $('observer').value.trim().toUpperCase();
  if (!name) { $('saveStatus').textContent = 'Enter a place name.'; return; }
  if (!observer) { $('saveStatus').textContent = 'Enter observer initials.'; return; }

  const lat = Number($('lat').value);
  const lon = Number($('lon').value);
  const record = {
    placeId: slug(name),
    name,
    lat: Number.isFinite(lat) ? lat : null,
    lon: Number.isFinite(lon) ? lon : null,
    windowStart: new Date().toISOString(),
    durationSec: Number($('duration').value) || 30,
    band: $('band').value,
    countLow: $('countLow').value === '' ? null : Number($('countLow').value),
    countHigh: $('countHigh').value === '' ? null : Number($('countHigh').value),
    observer,
    notes: $('notes').value.trim() || null,
    source: 'field',
    appVersion: APP_VERSION,
  };
  const records = load();
  records.push(record);
  save(records);
  $('saveStatus').textContent = `saved ${record.band} at ${record.windowStart}`;
  $('notes').value = '';
  render();
}

function exportJsonl() {
  const records = load();
  const text = records.map((r) => JSON.stringify(r)).join('\n') + (records.length ? '\n' : '');
  const blob = new Blob([text], { type: 'application/x-ndjson' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `eye-of-argus-groundtruth-${new Date().toISOString().slice(0, 10)}.jsonl`;
  a.click();
  URL.revokeObjectURL(url);
}

function importJsonl(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const existing = load();
    const seen = new Set(existing.map((r) => `${r.placeId}|${r.windowStart}|${r.observer}`));
    let added = 0;
    String(reader.result).split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      try {
        const record = JSON.parse(trimmed);
        const key = `${record.placeId}|${record.windowStart}|${record.observer}`;
        if (!seen.has(key)) { seen.add(key); existing.push(record); added += 1; }
      } catch { /* skip malformed line */ }
    });
    save(existing);
    $('saveStatus').textContent = `imported ${added} new observation(s)`;
    render();
  };
  reader.readAsText(file);
}

$('geo').addEventListener('click', useLocation);
$('save').addEventListener('click', saveObservation);
$('export').addEventListener('click', exportJsonl);
$('import').addEventListener('change', (e) => { if (e.target.files[0]) importJsonl(e.target.files[0]); });
$('clear').addEventListener('click', () => {
  if (confirm('Delete all observations stored on this device? Export first if unsure.')) { save([]); render(); }
});

window.addEventListener('online', setNet);
window.addEventListener('offline', setNet);
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

setNet();
render();
