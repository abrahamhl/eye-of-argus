/**
 * CI guard: fail if private strategic filenames appear outside `.private/`.
 *
 *   node bin/guard-private-boundary.mjs
 */
import { scanForbidden } from '../src/argus/product/boundary.js';
import { REPO_ROOT } from '../src/argus/product/truthSnapshot.js';

const violations = scanForbidden(REPO_ROOT);
if (violations.length) {
  process.stderr.write('private-boundary FAILED: private material outside .private/\n');
  for (const file of violations) process.stderr.write(`  - ${file}\n`);
  process.exit(1);
}
process.stdout.write('private boundary OK: no forbidden private filenames outside .private/.\n');
