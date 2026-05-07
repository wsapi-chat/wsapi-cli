import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..');
const dist = join(repoRoot, 'dist', 'index.js');
const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as {
  version: string;
};

describe('built CLI', () => {
  it.skipIf(!existsSync(dist))('reports the version from package.json', () => {
    const out = execFileSync('node', [dist, '--version'], { encoding: 'utf8' }).trim();
    expect(out).toBe(pkg.version);
  });
});
