/**
 * Parse npm package-lock.json file
 * @param {string} content - The content of the package-lock.json file
 * @returns {object} Parsed lockfile data
 */
export function parseNpmLockfile(content) {
  let data;

  try {
    data = JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error.message}`);
  }

  // Validate it's an npm lockfile
  if (!data.lockfileVersion && !data.packages) {
    throw new Error('Invalid npm lockfile: missing lockfileVersion or packages field');
  }

  return {
    type: 'npm',
    lockfileVersion: data.lockfileVersion,
    name: data.name,
    version: data.version,
    packages: data.packages || {},
    dependencies: data.dependencies,
    requires: data.requires
  };
}
