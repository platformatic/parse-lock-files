import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseNpmLockfile } from '../src/npm.js';

const fixturesDir = join(import.meta.dirname, '../fixtures');

describe('npm lockfile parser', () => {
  it('should parse package-lock.json v3 format', async () => {
    const lockfilePath = join(fixturesDir, 'npm/package-lock.json');
    const content = await readFile(lockfilePath, 'utf-8');
    const result = parseNpmLockfile(content);

    assert.ok(result, 'should return a result');
    assert.equal(result.type, 'npm', 'should identify as npm');
    assert.equal(result.lockfileVersion, 3, 'should identify lockfile version');
    assert.ok(result.packages, 'should have packages');
    assert.ok(typeof result.packages === 'object', 'packages should be an object');
  });

  it('should extract package information', async () => {
    const lockfilePath = join(fixturesDir, 'npm/package-lock.json');
    const content = await readFile(lockfilePath, 'utf-8');
    const result = parseNpmLockfile(content);

    const packages = result.packages;
    assert.ok(Object.keys(packages).length > 0, 'should have packages');

    // Check root package
    assert.ok(packages[''], 'should have root package');
    assert.ok(packages[''].dependencies, 'root should have dependencies');
    assert.equal(packages[''].dependencies.express, '4.18.2');
    assert.equal(packages[''].dependencies.lodash, '4.17.21');
  });

  it('should extract dependency information', async () => {
    const lockfilePath = join(fixturesDir, 'npm/package-lock.json');
    const content = await readFile(lockfilePath, 'utf-8');
    const result = parseNpmLockfile(content);

    const lodash = result.packages['node_modules/lodash'];
    assert.ok(lodash, 'should have lodash package');
    assert.equal(lodash.version, '4.17.21');
    assert.ok(lodash.resolved, 'should have resolved field');
    assert.ok(lodash.integrity, 'should have integrity field');
  });

  it('should handle nested dependencies', async () => {
    const lockfilePath = join(fixturesDir, 'npm/package-lock.json');
    const content = await readFile(lockfilePath, 'utf-8');
    const result = parseNpmLockfile(content);

    const express = result.packages['node_modules/express'];
    assert.ok(express, 'should have express package');
    assert.ok(express.dependencies, 'express should have dependencies');
    assert.ok(Object.keys(express.dependencies).length > 0, 'express should have multiple dependencies');
  });

  it('should throw error for invalid JSON', () => {
    assert.throws(() => {
      parseNpmLockfile('not valid json');
    }, /JSON/);
  });

  it('should throw error for non-npm lockfile', () => {
    assert.throws(() => {
      parseNpmLockfile('{"name": "test"}');
    }, /npm/);
  });
});
