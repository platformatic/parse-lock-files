import YAML from 'yaml';

/**
 * Parse pnpm pnpm-lock.yaml file
 * @param {string} content - The content of the pnpm-lock.yaml file
 * @returns {object} Parsed lockfile data
 */
export function parsePnpmLockfile(content) {
  let data;

  try {
    data = YAML.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse YAML: ${error.message}`);
  }

  // Validate it's a pnpm lockfile
  if (!data || !data.lockfileVersion) {
    throw new Error('Invalid pnpm lockfile: missing lockfileVersion field');
  }

  // Normalize packages format
  // pnpm v9+ uses two sections:
  // - packages: Contains metadata (resolution, engines, etc.)
  // - snapshots: Contains actual dependency trees
  const packages = {};

  if (data.packages) {
    for (const [key, value] of Object.entries(data.packages)) {
      // Extract version from the key itself
      // pnpm formats: "/package/version", "package@version", "@scope/package@version", or "/package@version"
      let version = value.version;
      if (!version) {
        // Try to extract from key
        // Match version after @ or after last /
        const atMatch = key.match(/@([\d.]+(?:-[a-z0-9.-]+)?(?:\+[a-z0-9.-]+)?)$/i); // "package@1.0.0" or "/package@1.0.0"
        const slashMatch = key.match(/\/([^/@]+)$/); // "/package/1.0.0" -> "1.0.0"

        if (atMatch) {
          version = atMatch[1];
        } else if (slashMatch && slashMatch[1].match(/^\d/)) {
          // Only use slash match if it looks like a version (starts with digit)
          version = slashMatch[1];
        }
      }

      // Get snapshot data if available (pnpm v9+)
      const snapshot = data.snapshots?.[key];

      // Normalize structure
      const resolution = value.resolution || {};
      packages[key] = {
        version: version || null,
        resolved: resolution.tarball || null,  // Extract tarball URL if present
        integrity: resolution.integrity || null,  // Extract integrity from resolution
        // Merge dependencies from both packages and snapshots sections
        // snapshots has the actual dependency tree in v9+
        dependencies: snapshot?.dependencies || value.dependencies || {},
        devDependencies: snapshot?.devDependencies || value.devDependencies || {},
        optionalDependencies: snapshot?.optionalDependencies || value.optionalDependencies || {},
        peerDependencies: value.peerDependencies || {},
        engines: value.engines || {},
        // Preserve pnpm-specific fields
        dev: value.dev,
        optional: snapshot?.optional || value.optional,
        hasBin: value.hasBin,
        cpu: value.cpu,
        os: value.os
      };
    }
  }

  return {
    type: 'pnpm',
    lockfileVersion: data.lockfileVersion,
    settings: data.settings,
    importers: data.importers,
    dependencies: data.dependencies,
    devDependencies: data.devDependencies,
    specifiers: data.specifiers,
    packages,
    snapshots: data.snapshots // Include snapshots for reference
  };
}
