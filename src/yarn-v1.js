/**
 * Parse Yarn v1 yarn.lock file
 * @param {string} content - The content of the yarn.lock file
 * @returns {object} Parsed lockfile data
 */
export function parseYarnV1Lockfile(content) {
  const lines = content.split('\n');

  // Check it's not a higher version
  if (content.match(/# yarn lockfile v[2-9]/)) {
    throw new Error('This parser only supports Yarn lockfile version 1');
  }

  // Check for yarn lockfile v1 header
  if (!content.includes('# yarn lockfile v1')) {
    throw new Error('Invalid Yarn lockfile: missing "# yarn lockfile v1" header');
  }

  const packages = {};
  let currentPackage = null;
  let currentField = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Skip comments and empty lines
    if (line.startsWith('#') || line.trim() === '') {
      continue;
    }

    // Check if this is a package declaration (starts without indentation, ends with :)
    if (line.match(/^[^ \t]/) && line.trim().endsWith(':')) {
      const packageDeclaration = line.trim().slice(0, -1); // Remove trailing :
      currentPackage = {
        version: null,
        resolved: null,
        integrity: null,
        dependencies: {},
        devDependencies: {},
        optionalDependencies: {},
        peerDependencies: {},
        engines: {}
      };
      packages[packageDeclaration] = currentPackage;
      currentField = null;
      continue;
    }

    // Parse indented fields
    if (currentPackage && line.match(/^  [^ \t]/)) {
      const trimmed = line.trim();

      // Check if it's a field header (dependencies:, optionalDependencies:, etc.)
      if (trimmed.endsWith(':')) {
        const fieldName = trimmed.slice(0, -1);
        if (fieldName === 'dependencies' || fieldName === 'optionalDependencies' || fieldName === 'peerDependencies') {
          currentField = fieldName;
          if (!currentPackage[fieldName]) {
            currentPackage[fieldName] = {};
          }
        }
        continue;
      }

      // Parse field with value
      const match = trimmed.match(/^(\w+)\s+(.+)$/);
      if (match) {
        const [, fieldName, fieldValue] = match;
        const unquotedValue = fieldValue.replace(/^"(.*)"$/, '$1');

        if (fieldName === 'version' || fieldName === 'resolved' || fieldName === 'integrity') {
          currentPackage[fieldName] = unquotedValue;
          currentField = null;
        }
      }
      continue;
    }

    // Parse dependency entries (double indented)
    if (currentPackage && currentField && line.match(/^    [^ \t]/)) {
      const trimmed = line.trim();
      const match = trimmed.match(/^(\S+)\s+(.+)$/);

      if (match) {
        const [, depName, depVersion] = match;
        const unquotedVersion = depVersion.replace(/^"(.*)"$/, '$1');
        currentPackage[currentField][depName] = unquotedVersion;
      }
    }
  }

  return {
    type: 'yarn',
    version: 1,
    packages
  };
}
