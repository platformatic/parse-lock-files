import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseYarnV1Lockfile } from '../src/yarn-v1.js';

describe('Yarn v1 lockfile parser', () => {
  it('should parse yarn.lock v1 format', async () => {
    const lockfilePath = join(process.cwd(), 'fixtures/yarn-v1/yarn.lock');
    const content = await readFile(lockfilePath, 'utf-8');
    const result = parseYarnV1Lockfile(content);

    assert.ok(result, 'should return a result');
    assert.equal(result.type, 'yarn', 'should identify as yarn');
    assert.equal(result.version, 1, 'should identify as version 1');
    assert.ok(result.packages, 'should have packages');
    assert.ok(typeof result.packages === 'object', 'packages should be an object');
  });

  it('should extract package information', async () => {
    const lockfilePath = join(process.cwd(), 'fixtures/yarn-v1/yarn.lock');
    const content = await readFile(lockfilePath, 'utf-8');
    const result = parseYarnV1Lockfile(content);

    const packages = result.packages;
    assert.ok(Object.keys(packages).length > 0, 'should have packages');

    // Check for specific packages
    const lodashEntry = Object.entries(packages).find(([key]) => key.includes('lodash@'));
    assert.ok(lodashEntry, 'should have lodash package');
    const [, lodash] = lodashEntry;
    assert.equal(lodash.version, '4.17.21');
    assert.ok(lodash.resolved, 'should have resolved field');
    assert.ok(lodash.integrity, 'should have integrity field');
  });

  it('should handle dependencies', async () => {
    const lockfilePath = join(process.cwd(), 'fixtures/yarn-v1/yarn.lock');
    const content = await readFile(lockfilePath, 'utf-8');
    const result = parseYarnV1Lockfile(content);

    const bodyParserEntry = Object.entries(result.packages).find(([key]) => key.includes('body-parser@'));
    assert.ok(bodyParserEntry, 'should have body-parser package');
    const [, bodyParser] = bodyParserEntry;
    assert.ok(bodyParser.dependencies, 'body-parser should have dependencies');
    assert.ok(Object.keys(bodyParser.dependencies).length > 0, 'body-parser should have multiple dependencies');
    assert.ok(bodyParser.dependencies.bytes, 'should have bytes dependency');
  });

  it('should handle multiple version ranges for same package', async () => {
    const lockfilePath = join(process.cwd(), 'fixtures/yarn-v1/yarn.lock');
    const content = await readFile(lockfilePath, 'utf-8');
    const result = parseYarnV1Lockfile(content);

    // Some packages have multiple ranges like "call-bind-apply-helpers@^1.0.1, call-bind-apply-helpers@^1.0.2"
    const multiRangeEntry = Object.entries(result.packages).find(([key]) =>
      key.includes(',') && key.includes('call-bind-apply-helpers')
    );
    assert.ok(multiRangeEntry, 'should have package with multiple ranges');
  });

  it('should throw error for invalid yarn v1 lockfile', () => {
    assert.throws(() => {
      parseYarnV1Lockfile('not a valid lockfile');
    }, /yarn/i);
  });

  it('should throw error for non-v1 yarn lockfile', () => {
    assert.throws(() => {
      parseYarnV1Lockfile('# yarn lockfile v2\n');
    }, /version 1/i);
  });
});
