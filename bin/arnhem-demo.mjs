/**
 * Eye of Argus — first vertical slice (Arnhem, synthetic).
 *
 * Produces Crowd / Calm / Social Opportunity / Confidence for two nearby
 * destinations at NOW / +15 / +30 / +60, shows the evidence breakdown, compares
 * the two, and writes a traceable place brief (JSON + HTML). Fully offline.
 *
 *   npm run demo:arnhem
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createArnhemFixture } from '../src/argus/regional/arnhem/fixtures.js';
import { filterByProfile, PROFILE } from '../src/argus/sources/registry.js';
import { crowdIndex } from '../src/argus/crowd/crowdIndex.js';
import { calmIndex } from '../src/argus/calm/calmIndex.js';
import { socialOpportunity } from '../src/argus/social/socialOpportunity.js';
import { forecast } from '../src/argus/forecast/temporal.js';
import { buildPlaceBrief } from '../src/argus/reports/placeBrief.js';
import { METHODOLOGY_VERSION } from '../src/argus/config/methodology.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'out');
const FIXED_NOW = Date.parse('2026-09-20T18:00:00Z');
const MODE = { CALM: 'CALM', SOCIAL: 'SOCIAL' };

function computeSignals({ place, registry, manifestsById, nowMs, invert }) {
  const profile = PROFILE.COMMERCIAL_SAFE;
  const crowdFilter = filterByProfile(place.crowd, registry, profile);
  const calmFilter = filterByProfile(place.calm, registry, profile);
  const socialFilter = filterByProfile(place.social, registry, profile);
  const excluded = [...new Set([...crowdFilter.excluded, ...calmFilter.excluded, ...socialFilter.excluded])];

  const crowd = crowdIndex({ observations: crowdFilter.kept, manifestsById, nowMs });
  const calm = calmIndex({
    crowdEstimate: crowd.estimate,
    calmObservations: calmFilter.kept,
    manifestsById,
    nowMs,
    invert,
  });
  const social = socialOpportunity({ observations: socialFilter.kept, manifestsById, nowMs });
  return { crowd, calm, social, excluded };
}

function withForecast({ score, confidence }, priorsByHour, nowMs) {
  return forecast({ currentScore: score, currentConfidence: confidence, priorsByHour, nowMs });
}

function rank(places, mode) {
  const key = mode === MODE.CALM ? 'calm' : 'social';
  return [...places].sort((a, b) => {
    const av = a.signals[key].estimate.score ?? -1;
    const bv = b.signals[key].estimate.score ?? -1;
    if (bv !== av) return bv - av;
    return (b.signals[key].estimate.confidence ?? 0) - (a.signals[key].estimate.confidence ?? 0);
  });
}

function contributingSources(registry, signals) {
  const ids = new Set();
  for (const name of ['crowd', 'calm', 'social']) {
    for (const contribution of signals[name].contributions ?? []) ids.add(contribution.sourceId);
  }
  return registry.all().filter((manifest) => ids.has(manifest.id));
}

function main() {
  const fixture = createArnhemFixture(FIXED_NOW);
  const { registry, manifestsById, nowMs, priorsByHour, calmInvert } = fixture;

  const evaluated = fixture.places.map((place) => {
    const signals = computeSignals({ place, registry, manifestsById, nowMs, invert: calmInvert });
    return {
      place,
      excluded: signals.excluded,
      signals: {
        crowd: {
          estimate: signals.crowd.estimate,
          contributions: signals.crowd.contributions,
          forecast: withForecast({ score: signals.crowd.estimate.score, confidence: signals.crowd.estimate.confidence }, priorsByHour, nowMs),
        },
        calm: {
          estimate: signals.calm.estimate,
          contributions: signals.calm.contributions,
          forecast: withForecast({ score: signals.calm.estimate.score, confidence: signals.calm.estimate.confidence }, priorsByHour, nowMs),
        },
        social: {
          estimate: signals.social.estimate,
          contributions: signals.social.contributions,
          forecast: withForecast({ score: signals.social.estimate.score, confidence: signals.social.estimate.confidence }, priorsByHour, nowMs),
        },
      },
    };
  });

  mkdirSync(OUT, { recursive: true });
  const lines = [];
  lines.push('******************************************************************');
  lines.push('*  SYNTHETIC DEMO — NOT LIVE TELEMETRY                            *');
  lines.push('*  Arnhem values below are synthetic development fixtures only.   *');
  lines.push('******************************************************************');
  lines.push('EYE OF ARGUS — Arnhem vertical slice (synthetic, offline)');
  lines.push(`now=${new Date(nowMs).toISOString()}  profile=${PROFILE.COMMERCIAL_SAFE}`);
  lines.push('');

  for (const evaluatedPlace of evaluated) {
    const { place, signals, excluded } = evaluatedPlace;
    lines.push(`${place.name}`);
    for (const name of ['crowd', 'calm', 'social']) {
      const estimate = signals[name].estimate;
      const range = estimate.range ? `${estimate.range.low}-${estimate.range.high}` : 'n/a';
      lines.push(
        `  ${name.padEnd(6)} ${String(estimate.score).padStart(6)}  band=${estimate.band.padEnd(9)} range=${range.padEnd(9)} confidence=${estimate.confidence} (${signals[name].forecast[0].confidence} @ now)`,
      );
    }
    lines.push('  forecast (crowd): ' + signals.crowd.forecast.map((f) => `${f.label}=${f.score}[${f.range.low}-${f.range.high}]`).join('  '));
    lines.push('');

    const brief = buildPlaceBrief({
      place,
      signals,
      sources: contributingSources(registry, signals),
      excludedSources: excluded.map((id) => ({ id, reason: `excluded by ${PROFILE.COMMERCIAL_SAFE} licence profile` })),
      generatedAtMs: nowMs,
      methodologyVersion: METHODOLOGY_VERSION,
      commercialProfile: PROFILE.COMMERCIAL_SAFE,
      mode: 'BALANCED',
      runId: 'arnhem-slice-001',
      configurationHash: 'cfg-arnhem-0.1',
      limitations: [
        'All source values in this slice are synthetic fixtures, not live feeds.',
        'Estimates are bands with ranges; they are not person counts.',
        'Opt-in aggregate telemetry never carries device identifiers and is suppressed below k contributors.',
        'Historical priors are illustrative and not yet calibrated against ground truth.',
      ],
    });
    writeFileSync(join(OUT, `${place.id}.json`), JSON.stringify(brief.json, null, 2));
    writeFileSync(join(OUT, `${place.id}.html`), brief.html);
  }

  for (const mode of [MODE.CALM, MODE.SOCIAL]) {
    const ordered = rank(evaluated, mode);
    lines.push(`MODE ${mode} ranking: ` + ordered.map((e, i) => `${i + 1}. ${e.place.name} (${(mode === MODE.CALM ? e.signals.calm : e.signals.social).estimate.score})`).join(' | '));
  }

  writeFileSync(join(OUT, 'compare.json'), JSON.stringify(
    evaluated.map((e) => ({ place: e.place.id, crowd: e.signals.crowd.estimate.score, calm: e.signals.calm.estimate.score, social: e.signals.social.estimate.score })),
    null,
    2,
  ));

  process.stdout.write(lines.join('\n') + '\n');
  process.stdout.write(`\nWrote briefs to ${OUT}\n`);
}

main();
