import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseLockfile, detectLockfileType, findAndParseLockfile } from '../src/index.js';

const fixturesDir = join(import.meta.dirname, '../fixtures');

describe('Unified API', () => {
  describe('detectLockfileType', () => {
    it('should detect npm lockfile', async () => {
      const content = await readFile(join(fixturesDir, 'npm/package-lock.json'), 'utf-8');
      assert.equal(detectLockfileType(content), 'npm');
    });

    it('should detect Yarn v1 lockfile', async () => {
      const content = await readFile(join(fixturesDir, 'yarn-v1/yarn.lock'), 'utf-8');
      assert.equal(detectLockfileType(content), 'yarn-v1');
    });

    it('should detect Yarn Berry lockfile', async () => {
      const content = await readFile(join(fixturesDir, 'yarn-v4/yarn.lock'), 'utf-8');
      assert.equal(detectLockfileType(content), 'yarn-berry');
    });

    it('should detect pnpm lockfile', async () => {
      const content = await readFile(join(fixturesDir, 'pnpm/pnpm-lock.yaml'), 'utf-8');
      assert.equal(detectLockfileType(content), 'pnpm');
    });

    it('should return null for unknown format', () => {
      assert.equal(detectLockfileType('random content'), null);
    });
  });

  describe('parseLockfile', () => {
    it('should parse npm lockfile automatically', async () => {
      const content = await readFile(join(fixturesDir, 'npm/package-lock.json'), 'utf-8');
      const result = parseLockfile(content);

      assert.equal(result.type, 'npm');
      assert.ok(result.packages);
    });

    it('should parse Yarn v1 lockfile automatically', async () => {
      const content = await readFile(join(fixturesDir, 'yarn-v1/yarn.lock'), 'utf-8');
      const result = parseLockfile(content);

      assert.equal(result.type, 'yarn');
      assert.equal(result.version, 1);
      assert.ok(result.packages);
    });

    it('should parse Yarn Berry lockfile automatically', async () => {
      const content = await readFile(join(fixturesDir, 'yarn-v4/yarn.lock'), 'utf-8');
      const result = parseLockfile(content);

      assert.equal(result.type, 'yarn');
      assert.ok(result.version >= 2);
      assert.ok(result.packages);
    });

    it('should parse pnpm lockfile automatically', async () => {
      const content = await readFile(join(fixturesDir, 'pnpm/pnpm-lock.yaml'), 'utf-8');
      const result = parseLockfile(content);

      assert.equal(result.type, 'pnpm');
      assert.ok(result.lockfileVersion);
      assert.ok(result.packages);
    });

    it('should throw error for unknown format', () => {
      assert.throws(() => {
        parseLockfile('random content');
      }, /Unable to detect lockfile type/);
    });
  });

  describe('findAndParseLockfile', () => {
    it('should find and parse npm lockfile in directory', async () => {
      const result = await findAndParseLockfile(join(fixturesDir, 'npm'));

      assert.equal(result.type, 'npm');
      assert.ok(result.packages);
    });

    it('should find and parse Yarn lockfile in directory', async () => {
      const result = await findAndParseLockfile(join(fixturesDir, 'yarn-v1'));

      assert.equal(result.type, 'yarn');
      assert.ok(result.packages);
    });

    it('should find and parse pnpm lockfile in directory', async () => {
      const result = await findAndParseLockfile(join(fixturesDir, 'pnpm'));

      assert.equal(result.type, 'pnpm');
      assert.ok(result.packages);
    });

    it('should throw error if no lockfile found', async () => {
      await assert.rejects(
        async () => await findAndParseLockfile('/tmp/nonexistent'),
        /No lockfile found/
      );
    });
  });
});
