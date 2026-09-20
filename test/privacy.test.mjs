import test from 'node:test';
import assert from 'node:assert/strict';
import {
  suppressCell,
  aggregateSpatialGrid,
  createPrivacyBudget,
  CELL_STATE,
  occupancyBand,
  DEFAULT_K,
} from '../src/argus/privacy/suppression.js';

test('a cell below the k threshold is suppressed and exposes no value', () => {
  const result = suppressCell({ count: DEFAULT_K - 1 });
  assert.equal(result.suppressed, true);
  assert.equal(result.state, CELL_STATE.SUPPRESSED);
  assert.equal('value' in result, false);
});

test('a cell at or above k is released with a band, never a count or identity list', () => {
  const result = suppressCell({ count: 30 });
  assert.equal(result.suppressed, false);
  assert.equal(result.state, CELL_STATE.RELEASED);
  assert.equal(result.band, 'MODERATE');
  assert.equal('value' in result, false, 'released cells must not expose the exact count');
  assert.equal('identities' in result, false);
});

test('a missing count is UNAVAILABLE rather than zero', () => {
  assert.equal(suppressCell({}).state, CELL_STATE.UNAVAILABLE);
});

test('occupancy bands are coarse', () => {
  assert.equal(occupancyBand(5), 'LOW');
  assert.equal(occupancyBand(20), 'MODERATE');
  assert.equal(occupancyBand(50), 'HIGH');
  assert.equal(occupancyBand(90), 'VERY HIGH');
});

test('grid aggregation suppresses small buckets and releases large ones', () => {
  const cells = [
    { lat: 51.98, lon: 5.9, count: 2 },
    { lat: 51.9801, lon: 5.9001, count: 3 }, // merges with the first -> 5
    { lat: 52.1, lon: 6.1, count: 12 },
  ];
  const result = aggregateSpatialGrid({ cells, cellSizeM: 500, k: 5 });
  assert.equal(result.suppressed, 0);
  assert.equal(result.released.length, 2);
});

test('privacy budget degrades gracefully instead of overspending', () => {
  const budget = createPrivacyBudget({ windowMs: 1000, maxQueries: 2 });
  assert.equal(budget.consume(0).allowed, true);
  assert.equal(budget.consume(100).allowed, true);
  assert.equal(budget.consume(200).allowed, false);
  assert.equal(budget.consume(2000).allowed, true);
});

test('privacy budget rejects a non-monotonic clock instead of being reset by it', () => {
  const budget = createPrivacyBudget({ windowMs: 100, maxQueries: 5 });
  assert.equal(budget.consume(1000).allowed, true);
  const rewound = budget.consume(10);
  assert.equal(rewound.allowed, false);
  assert.equal(rewound.reason, 'non-monotonic-clock');
});
