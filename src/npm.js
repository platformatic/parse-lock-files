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

  // Normalize package structure
  const packages = {};
  for (const [key, pkg] of Object.entries(data.packages || {})) {
    packages[key] = {
      version: pkg.version || null,
      resolved: pkg.resolved || null,
      integrity: pkg.integrity || null,
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
      optionalDependencies: pkg.optionalDependencies || {},
      peerDependencies: pkg.peerDependencies || {},
      engines: pkg.engines || {},
      // Preserve other npm-specific fields
      license: pkg.license,
      bin: pkg.bin,
      funding: pkg.funding,
      cpu: pkg.cpu,
      os: pkg.os
    };
  }

  return {
    type: 'npm',
    lockfileVersion: data.lockfileVersion,
    name: data.name,
    version: data.version,
    packages,
    dependencies: data.dependencies,
    requires: data.requires
  };
}
