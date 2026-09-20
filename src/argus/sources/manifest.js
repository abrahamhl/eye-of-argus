/**
 * A SourceManifest is the single place a source declares what it is, how
 * trustworthy it is, and what its legal terms are. No adapter may hide a URL
 * or a licence inside component code.
 */

export const PRIVACY_CLASS = Object.freeze({
  PUBLIC_AGGREGATE: 'public-aggregate',
  PUBLIC_OBSERVED: 'public-observed',
  OPT_IN_AGGREGATE: 'opt-in-aggregate',
  SYNTHETIC: 'synthetic',
});

const REQUIRED = [
  'id',
  'provider',
  'type',
  'geographicCoverage',
  'temporalResolution',
  'license',
  'commercialUse',
  'redistribution',
  'privacyClass',
  'sourceURL',
  'termsURL',
  'adapterVersion',
  'confidencePrior',
];

export function createManifest(spec) {
  for (const field of REQUIRED) {
    if (spec[field] === undefined || spec[field] === null || spec[field] === '') {
      throw new Error(`manifest ${spec.id ?? '<unknown>'}: missing field "${field}"`);
    }
  }
  if (typeof spec.commercialUse !== 'boolean') {
    throw new Error(`manifest ${spec.id}: commercialUse must be a boolean`);
  }
  if (typeof spec.confidencePrior !== 'number' || spec.confidencePrior < 0 || spec.confidencePrior > 1) {
    throw new Error(`manifest ${spec.id}: confidencePrior must be within [0,1]`);
  }
  if (!Object.values(PRIVACY_CLASS).includes(spec.privacyClass)) {
    throw new Error(`manifest ${spec.id}: unknown privacyClass "${spec.privacyClass}"`);
  }
  if (!['allowed', 'share-alike', 'prohibited'].includes(spec.redistribution)) {
    throw new Error(`manifest ${spec.id}: redistribution must be allowed|share-alike|prohibited`);
  }
  if (spec.dataClass !== undefined && !['live', 'synthetic', 'unknown'].includes(spec.dataClass)) {
    throw new Error(`manifest ${spec.id}: dataClass must be live|synthetic|unknown`);
  }
  return Object.freeze({
    spatialResolution: 'unknown',
    authentication: 'none',
    rateLimit: 'unspecified',
    retrievedAt: null,
    dataClass: 'unknown',
    ...spec,
  });
}
