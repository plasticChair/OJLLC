import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

test('lockfile includes every Cloudflare runtime platform package', () => {
  const lock = JSON.parse(readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));
  const runtime = lock.packages['node_modules/workerd'];
  assert.ok(runtime?.optionalDependencies, 'Cloudflare runtime dependencies are missing');

  for (const [name, version] of Object.entries(runtime.optionalDependencies)) {
    const platform = lock.packages[`node_modules/${name}`];
    assert.ok(platform, `${name} is missing from the lockfile`);
    assert.equal(platform.version, version, `${name} has an incompatible version`);
    assert.ok(platform.integrity, `${name} is missing its integrity hash`);
  }
});

test('security headers allow only the supported video providers to be embedded', () => {
  const headers = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
  assert.ok(headers.startsWith('/*'), '_headers must not start with a byte-order mark');
  assert.match(headers, /frame-src https:\/\/www\.youtube-nocookie\.com https:\/\/player\.vimeo\.com https:\/\/www\.loom\.com;/);
  assert.match(headers, /frame-ancestors 'none'/);
});
