import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseYarnBerryLockfile } from '../src/yarn-berry.js';

describe('Yarn Berry (v2+) lockfile parser', () => {
  const versions = [
    { dir: 'yarn-v2', yarnVersion: 2, metadataVersion: 4 },
    { dir: 'yarn-v3', yarnVersion: 3, metadataVersion: 6 },
    { dir: 'yarn-v4', yarnVersion: 4, metadataVersion: 8 }
  ];

  for (const { dir, yarnVersion, metadataVersion } of versions) {
    describe(`Yarn v${yarnVersion}`, () => {
      it(`should parse ${dir} yarn.lock`, async () => {
        const lockfilePath = join(process.cwd(), `fixtures/${dir}/yarn.lock`);
        const content = await readFile(lockfilePath, 'utf-8');
        const result = parseYarnBerryLockfile(content);

        assert.ok(result, 'should return a result');
        assert.equal(result.type, 'yarn', 'should identify as yarn');
        assert.equal(result.version, yarnVersion, `should identify as version ${yarnVersion}`);
        assert.equal(result.metadata.version, metadataVersion, `should have metadata version ${metadataVersion}`);
        assert.ok(result.packages, 'should have packages');
        assert.ok(typeof result.packages === 'object', 'packages should be an object');
      });

      it(`should extract package information from ${dir}`, async () => {
        const lockfilePath = join(process.cwd(), `fixtures/${dir}/yarn.lock`);
        const content = await readFile(lockfilePath, 'utf-8');
        const result = parseYarnBerryLockfile(content);

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

      it(`should handle dependencies in ${dir}`, async () => {
        const lockfilePath = join(process.cwd(), `fixtures/${dir}/yarn.lock`);
        const content = await readFile(lockfilePath, 'utf-8');
        const result = parseYarnBerryLockfile(content);

        const bodyParserEntry = Object.entries(result.packages).find(([key]) =>
          key.includes('body-parser@')
        );
        assert.ok(bodyParserEntry, 'should have body-parser package');
        const [, bodyParser] = bodyParserEntry;
        assert.ok(bodyParser.dependencies, 'body-parser should have dependencies');
        assert.ok(Object.keys(bodyParser.dependencies).length > 0, 'body-parser should have multiple dependencies');
      });
    });
  }

  it('should throw error for invalid YAML', () => {
    assert.throws(() => {
      parseYarnBerryLockfile('not valid yaml: [unclosed');
    }, /YAML/);
  });

  it('should throw error for non-yarn lockfile', () => {
    assert.throws(() => {
      parseYarnBerryLockfile('valid: yaml\nbut: not-yarn');
    }, /yarn/i);
  });
});
