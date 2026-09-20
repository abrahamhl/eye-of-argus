import { isoFromMs } from '../time/clock.js';

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function honestyClass({ band, confidence, freshness }) {
  if (freshness === 'STALE') return 'stale';
  if (freshness === 'UNAVAILABLE') return 'unknown';
  if ((confidence ?? 0) < 0.4) return 'low-confidence';
  if (band === 'VERY HIGH' || band === 'HIGH') return 'solid';
  return 'inferred';
}

/**
 * A brief is traceable by construction: it carries the run metadata, the
 * per-source contribution table (value, weight, freshness, licence) and the
 * limitations, and it refuses to round an uncertain estimate into a count.
 */
export function buildPlaceBrief({
  place,
  signals,
  sources,
  generatedAtMs,
  methodologyVersion,
  commercialProfile,
  mode,
  runId = 'run-local',
  configurationHash = 'cfg-local',
  limitations = [],
}) {
  const sourceIndex = new Map(sources.map((s) => [s.id, s]));

  const signalRows = Object.entries(signals).map(([name, signal]) => ({
    name,
    estimate: signal.estimate,
    forecast: signal.forecast ?? null,
    contributions: signal.contributions ?? [],
  }));

  const json = {
    kind: 'place-brief',
    version: 1,
    place,
    mode,
    commercialProfile,
    generatedAt: isoFromMs(generatedAtMs),
    methodologyVersion,
    runId,
    configurationHash,
    signals: signalRows,
    sources,
    limitations,
  };

  const html = renderHtml({ place, mode, commercialProfile, generatedAtMs, methodologyVersion, runId, configurationHash, signalRows, sourceIndex, limitations });
  return { json, html };
}

function renderSignal(name, signalRow, sourceIndex) {
  const { estimate, forecast } = signalRow;
  const cls = honestyClass({ band: estimate.band, confidence: estimate.confidence });
  const scoreText = estimate.score === null
    ? 'UNAVAILABLE'
    : `${estimate.score} <span class="range">(${estimate.range.low}–${estimate.range.high})</span>`;
  const forecastRows = (forecast ?? [])
    .map((f) => `<tr><td>${escapeHtml(f.label)}</td><td>${f.score} (${f.range.low}–${f.range.high})</td><td>${escapeHtml(f.band)}</td><td>${f.confidence}</td></tr>`)
    .join('');

  const evidenceRows = signalRow.contributions
    .map((c) => {
      const manifest = sourceIndex.get(c.sourceId);
      const dim = c.included ? '' : ' class="demoted"';
      return `<tr${dim}><td>${escapeHtml(c.sourceId)}</td><td>${escapeHtml(c.provider)}</td><td>${c.rawValue}</td><td>${c.normalized}</td><td>${c.weight}</td><td>${escapeHtml(c.freshness)}</td><td>${escapeHtml(c.kind)}</td><td>${escapeHtml(manifest ? manifest.license : '?')}</td><td>${escapeHtml(c.reason)}</td></tr>`;
    })
    .join('');

  return `
  <section class="signal ${cls}">
    <h3>${escapeHtml(name)} — ${escapeHtml(estimate.band)}</h3>
    <p class="score">${scoreText} <span class="conf">confidence ${estimate.confidence}</span></p>
    <table>
      <thead><tr><th>Horizon</th><th>Estimate</th><th>Band</th><th>Confidence</th></tr></thead>
      <tbody>${forecastRows}</tbody>
    </table>
    <details>
      <summary>Evidence (${signalRow.contributions.length} contributions)</summary>
      <table>
        <thead><tr><th>Source</th><th>Provider</th><th>Raw</th><th>Normalized</th><th>Weight</th><th>Freshness</th><th>Kind</th><th>Licence</th><th>Decision</th></tr></thead>
        <tbody>${evidenceRows}</tbody>
      </table>
    </details>
  </section>`;
}

function renderHtml({ place, mode, commercialProfile, generatedAtMs, methodologyVersion, runId, configurationHash, signalRows, sourceIndex, limitations }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Eye of Argus — Place Brief — ${escapeHtml(place.name)}</title>
<style>
  :root { color-scheme: dark; }
  body { font: 14px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace; background:#0b0f14; color:#d7e0ea; margin:2rem; }
  h1,h2,h3 { color:#eaf2ff; }
  table { border-collapse: collapse; width:100%; margin:0.5rem 0 1rem; }
  th,td { border:1px solid #24303d; padding:4px 8px; text-align:left; }
  .range,.conf { color:#8aa0b4; font-weight:normal; }
  .signal { border:1px solid #24303d; border-radius:8px; padding:0 1rem 1rem; margin:1rem 0; }
  .signal.solid { border-left:6px solid #4ade80; }
  .signal.inferred { border-left:6px dashed #facc15; }
  .signal.low-confidence { border-left:6px dotted #94a3b8; }
  .signal.stale { border-left:6px solid #64748b; opacity:0.7; }
  .signal.unknown { border-left:6px solid #475569; opacity:0.6; }
  tr.demoted { opacity:0.45; text-decoration: line-through; }
  .meta { color:#8aa0b4; }
  .privacy { border:1px solid #3b2f5f; background:#160f2a; padding:0.5rem 1rem; border-radius:8px; }
</style>
</head>
<body>
<h1>Eye of Argus — Place Brief</h1>
<p class="meta">
  <strong>${escapeHtml(place.name)}</strong> (${place.lat.toFixed(5)}, ${place.lon.toFixed(5)}) ·
  mode <strong>${escapeHtml(mode)}</strong> ·
  licence profile <strong>${escapeHtml(commercialProfile)}</strong>
</p>
<p class="meta">
  Generated ${escapeHtml(isoFromMs(generatedAtMs))} ·
  methodology <strong>${escapeHtml(methodologyVersion)}</strong> ·
  runId ${escapeHtml(runId)} · config ${escapeHtml(configurationHash)}
</p>
<p class="privacy">Offline-first: every figure above is an estimate with a range and a confidence, not a person count.
Cells with fewer than K contributors are withheld. No device identifiers are processed. Freshness is shown per source;
cached or inferred data is never presented as live.</p>
${signalRows.map((row) => renderSignal(row.name, row, sourceIndex)).join('\n')}
<section>
  <h3>Sources</h3>
  <table>
    <thead><tr><th>Source</th><th>Provider</th><th>Licence</th><th>Commercial</th><th>Redistribution</th><th>Privacy class</th><th>Terms</th></tr></thead>
    <tbody>
    ${[...sourceIndex.values()].map((s) => `<tr><td>${escapeHtml(s.id)}</td><td>${escapeHtml(s.provider)}</td><td>${escapeHtml(s.license)}</td><td>${s.commercialUse}</td><td>${escapeHtml(s.redistribution)}</td><td>${escapeHtml(s.privacyClass)}</td><td>${escapeHtml(s.termsURL)}</td></tr>`).join('')}
    </tbody>
  </table>
</section>
<section>
  <h3>Limitations</h3>
  <ul>${limitations.map((l) => `<li>${escapeHtml(l)}</li>`).join('') || '<li>No additional limitations recorded.</li>'}</ul>
</section>
</body>
</html>`;
}
