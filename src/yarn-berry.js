import YAML from 'yaml';

/**
 * Parse Yarn Berry (v2+) yarn.lock file
 * @param {string} content - The content of the yarn.lock file
 * @returns {object} Parsed lockfile data
 */
export function parseYarnBerryLockfile(content) {
  let data;

  try {
    data = YAML.parse(content);
  } catch (error) {
    throw new Error(`Failed to parse YAML: ${error.message}`);
  }

  // Validate it's a Yarn Berry lockfile
  if (!data || !data.__metadata) {
    throw new Error('Invalid Yarn lockfile: missing __metadata field');
  }

  const metadataVersion = data.__metadata.version;

  // Map metadata version to Yarn version
  // Yarn v2: lockfile version 4
  // Yarn v3: lockfile version 6
  // Yarn v4: lockfile version 8
  let yarnVersion;
  if (metadataVersion <= 4) {
    yarnVersion = 2;
  } else if (metadataVersion <= 6) {
    yarnVersion = 3;
  } else {
    yarnVersion = 4;
  }

  // Extract packages (everything except __metadata)
  const { __metadata, ...packages } = data;

  return {
    type: 'yarn',
    version: yarnVersion,
    metadata: __metadata,
    packages
  };
}
