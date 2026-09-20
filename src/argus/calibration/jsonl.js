/** Tiny JSONL reader/writer. Tolerates a BOM and blank/comment lines. */

export function parseJsonl(text) {
  const clean = String(text).replace(/^\uFEFF/, '');
  const records = [];
  const lines = clean.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line || line.startsWith('#')) continue;
    try {
      records.push(JSON.parse(line));
    } catch (error) {
      throw new Error(`invalid JSONL at line ${i + 1}: ${error.message}`);
    }
  }
  return records;
}

export function toJsonl(records) {
  return records.map((record) => JSON.stringify(record)).join('\n') + '\n';
}
