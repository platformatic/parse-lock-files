import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parsePnpmLockfile } from '../src/pnpm.js';

const fixturesDir = join(import.meta.dirname, '../fixtures');

describe('pnpm lockfile parser', () => {
  const versions = [
    { dir: 'pnpm-v7', pnpmVersion: 7, lockfileVersion: '5.4' },
    { dir: 'pnpm-v8', pnpmVersion: 8, lockfileVersion: '6.0' },
    { dir: 'pnpm-v9', pnpmVersion: 9, lockfileVersion: '9.0' },
    { dir: 'pnpm', pnpmVersion: 10, lockfileVersion: '9.0' }
  ];

  for (const { dir, pnpmVersion, lockfileVersion } of versions) {
    describe(`pnpm v${pnpmVersion}`, () => {
      it(`should parse ${dir} pnpm-lock.yaml`, async () => {
        const lockfilePath = join(fixturesDir, `${dir}/pnpm-lock.yaml`);
        const content = await readFile(lockfilePath, 'utf-8');
        const result = parsePnpmLockfile(content);

        assert.ok(result, 'should return a result');
        assert.equal(result.type, 'pnpm', 'should identify as pnpm');
        assert.ok(result.lockfileVersion, 'should have lockfileVersion');
        assert.ok(result.packages, 'should have packages');
        assert.ok(typeof result.packages === 'object', 'packages should be an object');
      });

      it(`should extract package information from ${dir}`, async () => {
        const lockfilePath = join(fixturesDir, `${dir}/pnpm-lock.yaml`);
        const content = await readFile(lockfilePath, 'utf-8');
        const result = parsePnpmLockfile(content);

        const packages = result.packages;
        assert.ok(Object.keys(packages).length > 0, 'should have packages');

        // Check for specific packages - format varies between versions
        const lodashKey = Object.keys(packages).find(k =>
          k.includes('lodash') && packages[k].version === '4.17.21'
        );
        assert.ok(lodashKey, 'should have lodash package');
      });

      it(`should handle dependencies in ${dir}`, async () => {
        const lockfilePath = join(fixturesDir, `${dir}/pnpm-lock.yaml`);
        const content = await readFile(lockfilePath, 'utf-8');
        const result = parsePnpmLockfile(content);

        const packages = result.packages;
        const bodyParserKey = Object.keys(packages).find(k =>
          k.includes('body-parser') && packages[k].version
        );
        assert.ok(bodyParserKey, 'should have body-parser package');

        const bodyParser = packages[bodyParserKey];
        assert.ok(bodyParser.dependencies !== undefined, 'body-parser should have dependencies field');
        assert.ok(Object.keys(bodyParser.dependencies).length > 0, 'body-parser should have multiple dependencies');
      });
    });
  }

  it('should throw error for invalid YAML', () => {
    assert.throws(() => {
      parsePnpmLockfile('not valid yaml: [unclosed');
    }, /YAML/);
  });

  it('should throw error for non-pnpm lockfile', () => {
    assert.throws(() => {
      parsePnpmLockfile('valid: yaml\nbut: not-pnpm');
    }, /pnpm/i);
  });
});
