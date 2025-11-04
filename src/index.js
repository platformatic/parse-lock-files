import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { parseNpmLockfile } from './npm.js';
import { parseYarnV1Lockfile } from './yarn-v1.js';
import { parseYarnBerryLockfile } from './yarn-berry.js';
import { parsePnpmLockfile } from './pnpm.js';

/**
 * Detect the type of lockfile from its content
 * @param {string} content - The content of the lockfile
 * @returns {string|null} The detected lockfile type ('npm', 'yarn-v1', 'yarn-berry', 'pnpm', or null)
 */
export function detectLockfileType(content) {
  // Check for npm package-lock.json
  if (content.trim().startsWith('{')) {
    try {
      const data = JSON.parse(content);
      if (data.lockfileVersion !== undefined && data.packages) {
        return 'npm';
      }
    } catch {
      // Not valid JSON, continue checking
    }
  }

  // Check for Yarn v1 yarn.lock
  if (content.includes('# yarn lockfile v1')) {
    return 'yarn-v1';
  }

  // Check for Yarn Berry (v2+) or pnpm (both use YAML)
  if (content.includes('__metadata:')) {
    return 'yarn-berry';
  }

  if (content.match(/lockfileVersion:\s*['"']?[\d.]+/)) {
    return 'pnpm';
  }

  return null;
}

/**
 * Parse a lockfile with automatic type detection
 * @param {string} content - The content of the lockfile
 * @returns {object} Parsed lockfile data with type information
 */
export function parseLockfile(content) {
  const type = detectLockfileType(content);

  if (!type) {
    throw new Error('Unable to detect lockfile type');
  }

  switch (type) {
    case 'npm':
      return parseNpmLockfile(content);
    case 'yarn-v1':
      return parseYarnV1Lockfile(content);
    case 'yarn-berry':
      return parseYarnBerryLockfile(content);
    case 'pnpm':
      return parsePnpmLockfile(content);
    default:
      throw new Error(`Unknown lockfile type: ${type}`);
  }
}

/**
 * Find a lockfile in a directory
 * @param {string} directory - Path to the directory containing the lockfile
 * @returns {Promise<string>} Path to the found lockfile
 * @throws {Error} If no lockfile is found in the directory
 */
export async function findLockfile(directory) {
  // List of lockfiles to search for, in order of preference
  const lockfileNames = [
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml'
  ];

  // Try to find any lockfile in the directory
  for (const lockfileName of lockfileNames) {
    const lockfilePath = join(directory, lockfileName);
    try {
      await access(lockfilePath);
      // File exists, return its path
      return lockfilePath;
    } catch {
      // File doesn't exist, try the next one
      continue;
    }
  }

  throw new Error(`No lockfile found in directory: ${directory}`);
}

/**
 * Find and read a lockfile from a directory, detect its type, and parse it
 * @param {string} directory - Path to the directory containing the lockfile
 * @returns {Promise<object>} Parsed lockfile data with type information
 * @throws {Error} If no lockfile is found in the directory
 */
export async function findAndParseLockfile(directory) {
  const lockfilePath = await findLockfile(directory);
  const content = await readFile(lockfilePath, 'utf-8');
  return parseLockfile(content);
}

// Export individual parsers for direct use
export {
  parseNpmLockfile,
  parseYarnV1Lockfile,
  parseYarnBerryLockfile,
  parsePnpmLockfile
};
