import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Private/public boundary guard. Private strategic material must live in the
 * gitignored `.private/` directory; this scans filenames that leak it into the
 * public tree. Filenames are a coarse signal, not the whole process — see
 * docs/DOCUMENT_BOUNDARY.md.
 */
export const FORBIDDEN_PRIVATE_PATTERNS = [
  /^PRICING/i,
  /^INVESTOR/i,
  /^FUNDING/i,
  /^COMPETITOR/i,
  /^CUSTOMERS?_PRIVATE/i,
  /^DUAL_USE/i,
  /^COMMERCIAL_/i,
  /_PRIVATE(\.[a-z0-9]+)?$/i,
  /^STRATEGY/i,
  /^INVESTMENT_MASTER/i,
];

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'upstream', 'out', '.private', '.next', 'dist', 'coverage', '.vercel', '.local_data',
]);

export function scanForbidden(rootDir) {
  const violations = [];
  const walk = (dir) => {
    let items;
    try { items = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const item of items) {
      const full = join(dir, item.name);
      if (item.isDirectory()) {
        if (SKIP_DIRS.has(item.name)) continue;
        walk(full);
        continue;
      }
      if (FORBIDDEN_PRIVATE_PATTERNS.some((re) => re.test(item.name))) {
        violations.push(relative(rootDir, full).replace(/\\/g, '/'));
      }
    }
  };
  walk(rootDir);
  return violations;
}
