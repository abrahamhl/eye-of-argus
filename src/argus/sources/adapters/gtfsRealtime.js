import { decodeFields, encodeMessageField, encodeStringField, encodeFloatField, encodeVarintField } from './protobuf.js';

/**
 * GTFS-Realtime vehicle positions (FeedMessage).
 *
 * Field map (gtfs-realtime.proto):
 *   FeedMessage.entity            = 2 (repeated FeedEntity)
 *   FeedEntity.id                 = 1 (string)
 *   FeedEntity.vehicle            = 4 (VehiclePosition)
 *   VehiclePosition.trip          = 1 (TripDescriptor)
 *   VehiclePosition.position      = 2 (Position)
 *   VehiclePosition.timestamp     = 5? — see note; we read timestamp at 5 if 4 is absent
 *   Position.latitude             = 1 (float)
 *   Position.longitude            = 2 (float)
 *
 * Only latitude/longitude and the feed timestamp are read. No vehicle
 * identifiers are retained beyond the counts this function returns.
 */
export function parseVehiclePositions(buf) {
  const feed = decodeFields(buf);
  let feedTimestamp = null;
  const vehicles = [];

  for (const field of feed) {
    if (field.fieldNumber === 1) {
      // FeedHeader.gtfs_realtime_version = 1, .incrementality = 2, .timestamp = 3
      const header = decodeFields(field.value);
      const ts = header.find((f) => f.fieldNumber === 3);
      if (ts && typeof ts.value === 'number') feedTimestamp = ts.value;
    } else if (field.fieldNumber === 2) {
      const entity = decodeFields(field.value);
      const vehiclePositionField = entity.find((f) => f.fieldNumber === 4);
      if (!vehiclePositionField) continue;
      const vp = decodeFields(vehiclePositionField.value);
      const positionField = vp.find((f) => f.fieldNumber === 2);
      if (!positionField) continue;
      const position = decodeFields(positionField.value);
      const latitude = position.find((f) => f.fieldNumber === 1);
      const longitude = position.find((f) => f.fieldNumber === 2);
      if (latitude && longitude && Number.isFinite(latitude.value) && Number.isFinite(longitude.value)) {
        vehicles.push({ lat: latitude.value, lon: longitude.value });
      }
    }
  }
  return { feedTimestamp, vehicles };
}

/** Encodes a minimal vehicle-position feed. Used to build deterministic fixtures. */
export function encodeVehiclePositions({ timestamp, vehicles }) {
  const header = Buffer.concat([
    encodeStringField(1, '2.0'),
    encodeVarintField(3, timestamp),
  ]);
  const parts = [encodeMessageField(1, header)];
  vehicles.forEach((vehicle, index) => {
    const position = Buffer.concat([
      encodeFloatField(1, vehicle.lat),
      encodeFloatField(2, vehicle.lon),
    ]);
    const vehiclePosition = encodeMessageField(2, position);
    const entity = Buffer.concat([
      encodeStringField(1, `v${index}`),
      encodeMessageField(4, vehiclePosition),
    ]);
    parts.push(encodeMessageField(2, entity));
  });
  return Buffer.concat(parts);
}
