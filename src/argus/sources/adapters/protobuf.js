/**
 * Minimal, dependency-free protobuf wire reader/writer.
 *
 * Only what the GTFS-Realtime vehicle-position feed needs. We deliberately do
 * not pull a protobuf runtime into a zero-dependency, offline-first core.
 * Wire format: https://protobuf.dev/programming-guides/encoding/
 */

export function readVarint(buf, offset) {
  let result = 0n;
  let shift = 0n;
  let i = offset;
  for (;;) {
    if (i >= buf.length) throw new Error('protobuf: truncated varint');
    const byte = buf[i];
    result |= BigInt(byte & 0x7f) << shift;
    i += 1;
    if ((byte & 0x80) === 0) break;
    shift += 7n;
  }
  return { value: Number(result), next: i };
}

function readFixed(buf, offset, bytes) {
  if (offset + bytes > buf.length) throw new Error('protobuf: truncated fixed field');
  const view = new DataView(buf.buffer, buf.byteOffset + offset, bytes);
  return { value: bytes === 4 ? view.getFloat32(0, true) : view.getFloat64(0, true), next: offset + bytes };
}

export function decodeFields(buf) {
  const fields = [];
  let i = 0;
  while (i < buf.length) {
    const tag = readVarint(buf, i);
    i = tag.next;
    const fieldNumber = tag.value >>> 3;
    const wireType = tag.value & 7;
    if (wireType === 0) {
      const r = readVarint(buf, i);
      fields.push({ fieldNumber, wireType, value: r.value });
      i = r.next;
    } else if (wireType === 2) {
      const r = readVarint(buf, i);
      i = r.next;
      const length = r.value;
      if (i + length > buf.length) throw new Error('protobuf: truncated length-delimited field');
      fields.push({ fieldNumber, wireType, value: buf.subarray(i, i + length) });
      i += length;
    } else if (wireType === 5) {
      const r = readFixed(buf, i, 4);
      fields.push({ fieldNumber, wireType, value: r.value });
      i = r.next;
    } else if (wireType === 1) {
      const r = readFixed(buf, i, 8);
      fields.push({ fieldNumber, wireType, value: r.value });
      i = r.next;
    } else {
      throw new Error(`protobuf: unsupported wire type ${wireType}`);
    }
  }
  return fields;
}

/* ------------------------------- encoding ------------------------------- */

function varint(value) {
  let v = BigInt(value);
  const out = [];
  while (v > 0x7fn) {
    out.push(Number((v & 0x7fn) | 0x80n));
    v >>= 7n;
  }
  out.push(Number(v));
  return Buffer.from(out);
}

export function encodeVarintField(fieldNumber, value) {
  return Buffer.concat([varint((fieldNumber << 3) | 0), varint(value)]);
}

export function encodeStringField(fieldNumber, str) {
  const bytes = Buffer.from(str, 'utf8');
  return Buffer.concat([varint((fieldNumber << 3) | 2), varint(bytes.length), bytes]);
}

export function encodeMessageField(fieldNumber, message) {
  return Buffer.concat([varint((fieldNumber << 3) | 2), varint(message.length), message]);
}

export function encodeFloatField(fieldNumber, value) {
  const head = varint((fieldNumber << 3) | 5);
  const body = Buffer.alloc(4);
  body.writeFloatLE(value, 0);
  return Buffer.concat([head, body]);
}
