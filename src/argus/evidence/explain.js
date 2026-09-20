/**
 * Turns an estimate plus its contributions into a human-readable explanation.
 * This is what powers the Evidence Inspector: the user must be able to see WHY
 * a score is what it is, not just the number.
 */
export function explainEstimate({ estimate, contributions, place = null }) {
  const included = (contributions ?? []).filter((c) => c.included);
  const excluded = (contributions ?? []).filter((c) => !c.included);

  const steps = included.map((c) => ({
    sourceId: c.sourceId,
    provider: c.provider,
    rawValue: c.rawValue,
    unit: c.unit,
    normalized: c.normalized,
    baseWeight: c.baseWeight,
    correlationFactor: c.correlationFactor,
    correlationGroup: c.correlationGroup,
    effectiveWeight: c.weight,
    freshness: c.freshness,
    kind: c.kind,
    license: c.license,
    note: c.correlationFactor < 1 ? 'damped: correlated group' : 'full weight',
  }));

  const excludedSteps = excluded.map((c) => ({
    sourceId: c.sourceId,
    rawValue: c.rawValue,
    normalized: c.normalized,
    reason: c.reason,
  }));

  const scoreText = estimate.score === null ? 'UNAVAILABLE' : `${estimate.score} (${estimate.band})`;
  const explanation = [
    place ? `${place}:` : '',
    `${estimate.signal} = ${scoreText}`,
    `from ${included.length} normalized contribution(s)`,
    `evidence confidence ${estimate.confidence} (${estimate.confidenceState})`,
    `data class ${String(estimate.dataClass ?? 'unknown').toUpperCase()}`,
    excluded.length ? `${excluded.length} contribution(s) excluded` : 'nothing excluded',
  ].filter(Boolean).join(' · ');

  return {
    signal: estimate.signal,
    score: estimate.score,
    band: estimate.band,
    range: estimate.range,
    confidence: estimate.confidence,
    confidenceState: estimate.confidenceState,
    confidenceSemantics: estimate.confidenceSemantics,
    dataClass: estimate.dataClass,
    steps,
    excluded: excludedSteps,
    explanation,
  };
}
