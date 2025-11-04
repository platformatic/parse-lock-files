import YAML from 'yaml';

/**
 * Parse pnpm pnpm-lock.yaml file
 * @param {string} content - The content of the pnpm-lock.yaml file
 * @returns {object} Parsed lockfile data
 */
export function parsePnpmLockfile(content) {
  let data;

  try {
    // Parse with uniqueKeys: false to handle pnpm's duplicate key format
    data = YAML.parse(content, { uniqueKeys: false });
  } catch (error) {
    throw new Error(`Failed to parse YAML: ${error.message}`);
  }

  // Validate it's a pnpm lockfile
  if (!data || !data.lockfileVersion) {
    throw new Error('Invalid pnpm lockfile: missing lockfileVersion field');
  }

  // Normalize packages format
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

      packages[key] = {
        version: version || null,
        resolution: value.resolution,
        dependencies: value.dependencies || {},
        devDependencies: value.devDependencies || {},
        optionalDependencies: value.optionalDependencies || {},
        peerDependencies: value.peerDependencies || {},
        engines: value.engines,
        dev: value.dev,
        optional: value.optional
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
    packages
  };
}
