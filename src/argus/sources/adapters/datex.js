/**
 * Bounded streaming parser for NDW "snelheden en intensiteiten" DATEX II v3.
 *
 * Why a custom parser: the combined publication is ~217 MB of namespaced XML.
 * We cannot pull an XML/DATEX library into a zero-dependency core, and a DOM
 * parse would blow memory. This is a forward-only tokenizer that keeps only the
 * fields we need and discards the rest as it streams.
 *
 * It reads, per measurement site: id + point coordinates (latitude/longitude),
 * and per siteMeasurements block: the first valid TrafficFlow.vehicleFlowRate
 * and TrafficSpeed.averageVehicleSpeed. Negative/unknown values (-1) are
 * ignored. No XML entities beyond the numeric values we parse are resolved.
 */

function localName(name) {
  const index = name.indexOf(':');
  return index >= 0 ? name.slice(index + 1) : name;
}

function parseAttributes(source) {
  const out = {};
  const re = /([\w:.-]+)\s*=\s*"([^"]*)"/g;
  let match;
  while ((match = re.exec(source)) !== null) out[match[1]] = match[2];
  return out;
}

export function createDatexSpeedIntensityParser() {
  const sites = new Map();
  const values = new Map();
  let publicationTime = null;
  let carry = '';
  let text = '';
  const path = [];
  let currentSite = null;
  let currentMeasurement = null;
  let pendingType = null;

  function handleStart(name, attrs, selfClosing) {
    path.push(name);
    text = '';
    if (name === 'measurementSite') currentSite = { id: attrs.id ?? null, lat: null, lon: null };
    else if (name === 'siteMeasurements') currentMeasurement = { ref: null, flow: null, speed: null };
    else if (name === 'measurementSiteReference' && currentMeasurement && path.includes('siteMeasurements') && attrs.id) currentMeasurement.ref = attrs.id;
    else if (name === 'basicData') {
      const type = attrs['xsi:type'] || '';
      pendingType = type.endsWith('TrafficFlow') ? 'flow' : type.endsWith('TrafficSpeed') ? 'speed' : null;
    }
    if (selfClosing) path.pop();
  }

  function handleEnd(name) {
    const value = text.trim();
    if (name === 'latitude' && currentSite && value && currentSite.lat === null) currentSite.lat = Number(value);
    else if (name === 'longitude' && currentSite && value && currentSite.lon === null) currentSite.lon = Number(value);
    else if (name === 'publicationTime' && value && publicationTime === null) publicationTime = value;
    else if (name === 'vehicleFlowRate' && currentMeasurement && pendingType === 'flow' && value) {
      const parsed = Number(value);
      if (currentMeasurement.flow === null && Number.isFinite(parsed) && parsed >= 0) currentMeasurement.flow = parsed;
    } else if (name === 'speed' && currentMeasurement && pendingType === 'speed' && value) {
      const parsed = Number(value);
      if (currentMeasurement.speed === null && Number.isFinite(parsed) && parsed >= 0) currentMeasurement.speed = parsed;
    } else if (name === 'measurementSite' && currentSite) {
      if (currentSite.id && Number.isFinite(currentSite.lat) && Number.isFinite(currentSite.lon) && !sites.has(currentSite.id)) {
        sites.set(currentSite.id, { lat: currentSite.lat, lon: currentSite.lon });
      }
      currentSite = null;
    } else if (name === 'siteMeasurements' && currentMeasurement) {
      if (currentMeasurement.ref && !values.has(currentMeasurement.ref)) {
        values.set(currentMeasurement.ref, { flow: currentMeasurement.flow, speed: currentMeasurement.speed });
      }
      currentMeasurement = null;
    } else if (name === 'basicData') pendingType = null;

    path.pop();
    text = '';
  }

  function push(chunk) {
    carry += chunk;
    let i = 0;
    let lt = carry.indexOf('<', i);
    while (lt !== -1) {
      const between = carry.slice(i, lt);
      if (between) text += between;
      const gt = carry.indexOf('>', lt);
      if (gt === -1) { carry = carry.slice(lt); return; }
      const raw = carry.slice(lt + 1, gt).trim();
      if (raw.startsWith('/')) handleEnd(localName(raw.slice(1).trim()));
      else if (raw.startsWith('?') || raw.startsWith('!')) { /* declaration/comment */ }
      else {
        const selfClosing = raw.endsWith('/');
        const body = selfClosing ? raw.slice(0, -1).trim() : raw;
        const match = body.match(/^([^\s]+)\s*([\s\S]*)$/);
        if (match) handleStart(localName(match[1]), parseAttributes(match[2] || ''), selfClosing);
      }
      i = gt + 1;
      lt = carry.indexOf('<', i);
    }
    carry = carry.slice(i);
  }

  return {
    push,
    end: () => ({ publicationTime, sites, values }),
    sites,
    values,
  };
}

export function joinBbox({ sites, values }, bbox) {
  const rows = [];
  for (const [id, coord] of sites) {
    if (coord.lat < bbox.minLat || coord.lat > bbox.maxLat) continue;
    if (coord.lon < bbox.minLon || coord.lon > bbox.maxLon) continue;
    const value = values.get(id) || {};
    rows.push({ id, lat: coord.lat, lon: coord.lon, flow: value.flow ?? null, speed: value.speed ?? null });
  }
  return rows;
}

/**
 * Traffic pressure (0..100) from flow and congestion. HEURISTIC, not calibrated.
 * - flowScore: average vehicles/hour relative to a reference
 * - congestion: low average speed contributes pressure
 */
export function trafficPressure(rows, { flowReference = 3000 } = {}) {
  const flows = rows.map((r) => r.flow).filter((v) => typeof v === 'number');
  const speeds = rows.map((r) => r.speed).filter((v) => typeof v === 'number' && v > 0);
  const avgFlow = flows.length ? flows.reduce((a, b) => a + b, 0) / flows.length : null;
  const avgSpeed = speeds.length ? speeds.reduce((a, b) => a + b, 0) / speeds.length : null;
  const flowScore = avgFlow === null ? 0 : Math.min(100, (avgFlow / flowReference) * 100);
  const congestion = avgSpeed === null ? 0 : Math.max(0, Math.min(1, (80 - avgSpeed) / 80));
  const value = Math.round(Math.max(0, Math.min(100, 0.7 * flowScore + 0.3 * congestion * 100)));
  return { value, avgFlow, avgSpeed, sites: rows.length, congestion: Number(congestion.toFixed(3)) };
}

/** Emits a small DATEX-shaped XML fixture that exercises the same parser path. */
export function buildDatexFixture({ publicationTime, rows }) {
  const ns = 'xmlns:mc="http://datex2.eu/schema/3/messageContainer" xmlns:roa="http://datex2.eu/schema/3/roadTrafficData" xmlns:loc="http://datex2.eu/schema/3/locationReferencing" xmlns:com="http://datex2.eu/schema/3/common" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"';
  const sites = rows.map((r) => `<roa:measurementSite id="${r.id}" version="1"><roa:measurementSiteLocation xsi:type="roa:PointLocation"><loc:pointByCoordinates><loc:pointCoordinates><loc:latitude>${r.lat}</loc:latitude><loc:longitude>${r.lon}</loc:longitude></loc:pointCoordinates></loc:pointByCoordinates></roa:measurementSiteLocation></roa:measurementSite>`).join('');
  const measurements = rows.map((r) => `<roa:siteMeasurements><roa:measurementSiteReference targetClass="roa:MeasurementSite" id="${r.id}" version="1"/><roa:physicalQuantity index="1"><roa:physicalQuantity xsi:type="roa:SinglePhysicalQuantity"><roa:basicData xsi:type="roa:TrafficFlow"><roa:vehicleFlow accuracy="0.0"><com:vehicleFlowRate>${r.flow ?? 0}</com:vehicleFlowRate></roa:vehicleFlow></roa:basicData></roa:physicalQuantity></roa:physicalQuantity><roa:physicalQuantity index="2"><roa:physicalQuantity xsi:type="roa:SinglePhysicalQuantity"><roa:basicData xsi:type="roa:TrafficSpeed"><roa:averageVehicleSpeed accuracy="0.0"><com:speed>${r.speed ?? -1}</com:speed></roa:averageVehicleSpeed></roa:basicData></roa:physicalQuantity></roa:physicalQuantity></roa:siteMeasurements>`).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><mc:messageContainer ${ns} modelBaseVersion="3"><mc:payload xsi:type="roa:MeasurementSiteTablePublication"><com:publicationTime>${publicationTime}</com:publicationTime><roa:measurementSiteTable id="FIXTURE"><roa:measurementSite id="__unused__" version="1"></roa:measurementSite>${sites}</roa:measurementSiteTable></mc:payload><mc:payload xsi:type="roa:MeasuredDataPublication"><com:publicationTime>${publicationTime}</com:publicationTime>${measurements}</mc:payload></mc:messageContainer>`;
}
