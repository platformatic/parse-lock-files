# parse-lock-files

A comprehensive Node.js library for parsing lockfiles from npm, Yarn (v1, v2, v3, v4), and pnpm (v7, v8, v9, v10).

## Features

- **Multi-format support**: Parse lockfiles from all major package managers
- **Version compatibility**: Supports multiple versions of each package manager
- **Type detection**: Automatically detect lockfile type
- **ESM-first**: Written as ECMAScript modules
- **Zero dependencies** (except `yaml` for YAML parsing)
- **TypeScript-ready**: Structured output format for easy integration

## Supported Formats

| Package Manager | Versions | Lockfile Name |
|----------------|----------|---------------|
| npm | v7+ | `package-lock.json` |
| Yarn Classic | v1.x | `yarn.lock` |
| Yarn Berry | v2.x, v3.x, v4.x | `yarn.lock` |
| pnpm | v7.x, v8.x, v9.x, v10.x | `pnpm-lock.yaml` |

## Installation

```bash
npm install parse-lock-files
```

## Usage

### Find Lockfile in Directory

Find the lockfile in a directory without parsing it:

```javascript
import { findLockfile } from 'parse-lock-files';

const lockfilePath = await findLockfile('./my-project');
// Returns: '/absolute/path/to/package-lock.json' (or yarn.lock, or pnpm-lock.yaml)
```

The function searches for lockfiles in this order:
1. `package-lock.json`
2. `yarn.lock`
3. `pnpm-lock.yaml`

### Find and Parse Lockfile in Directory

Find and parse the lockfile in one step:

```javascript
import { findAndParseLockfile } from 'parse-lock-files';

const result = await findAndParseLockfile('./my-project');

console.log(result.type); // 'npm', 'yarn', or 'pnpm'
console.log(result.packages); // Parsed package information
```

### Parse Lockfile Content

If you already have the lockfile content, you can parse it directly:

```javascript
import { parseLockfile } from 'parse-lock-files';
import { readFileSync } from 'fs';

const content = readFileSync('package-lock.json', 'utf-8');
const result = parseLockfile(content);

console.log(result.type); // 'npm', 'yarn', or 'pnpm'
console.log(result.packages); // Parsed package information
```

### Detect Lockfile Type

```javascript
import { detectLockfileType } from 'parse-lock-files';

const type = detectLockfileType(content);
// Returns: 'npm', 'yarn-v1', 'yarn-berry', 'pnpm', or null
```

### Use Specific Parsers

```javascript
import {
  parseNpmLockfile,
  parseYarnV1Lockfile,
  parseYarnBerryLockfile,
  parsePnpmLockfile
} from 'parse-lock-files';

// Parse npm lockfile
const npmResult = parseNpmLockfile(npmContent);

// Parse Yarn v1 lockfile
const yarnV1Result = parseYarnV1Lockfile(yarnV1Content);

// Parse Yarn Berry (v2+) lockfile
const yarnBerryResult = parseYarnBerryLockfile(yarnBerryContent);

// Parse pnpm lockfile
const pnpmResult = parsePnpmLockfile(pnpmContent);
```

## API

### `findLockfile(directory: string): Promise<string>`

Finds a lockfile in the given directory and returns its path. Searches for `package-lock.json`, `yarn.lock`, and `pnpm-lock.yaml` in that order.

**Parameters:**
- `directory`: Path to the directory containing a lockfile

**Returns:** Promise resolving to the absolute path of the found lockfile

**Throws:** Error if no lockfile is found in the directory

**Example:**
```javascript
const lockfilePath = await findLockfile('./my-project');
// '/absolute/path/to/my-project/package-lock.json'
```

### `findAndParseLockfile(directory: string): Promise<object>`

Finds a lockfile in the given directory, automatically detects its type, and parses it. Internally uses `findLockfile()` to locate the file.

**Parameters:**
- `directory`: Path to the directory containing a lockfile

**Returns:** Promise resolving to:
- `type`: `'npm'`, `'yarn'`, or `'pnpm'`
- `packages`: Object containing parsed package information
- Additional fields specific to each lockfile format

**Throws:** Error if no lockfile is found in the directory

### `parseLockfile(content: string): object`

Automatically detects the lockfile type from content and parses it.

**Parameters:**
- `content`: The lockfile content as a string

**Returns:**
- `type`: `'npm'`, `'yarn'`, or `'pnpm'`
- `packages`: Object containing parsed package information
- Additional fields specific to each lockfile format

### `detectLockfileType(content: string): string | null`

Detects the type of lockfile from its content.

**Parameters:**
- `content`: The lockfile content as a string

**Returns:** `'npm'`, `'yarn-v1'`, `'yarn-berry'`, `'pnpm'`, or `null`

### Normalized Package Structure

All parsers return packages in a normalized structure with the following core fields:

```javascript
{
  version: string,              // Resolved version number
  resolved: string,             // Download URL or resolution string
  integrity: string,            // Integrity/checksum hash
  dependencies: object,         // Runtime dependencies
  devDependencies: object,      // Development dependencies
  optionalDependencies: object, // Optional dependencies
  peerDependencies: object,     // Peer dependencies
  engines: object,              // Engine requirements
  // ... plus format-specific fields
}
```

Each lockfile format may include additional format-specific fields:
- **npm**: `license`, `bin`, `funding`, `cpu`, `os`
- **Yarn Berry**: `languageName`, `linkType`, `bin`, `conditions`
- **pnpm**: `dev`, `optional`, `hasBin`, `cpu`, `os`

### Parser-Specific Functions

#### `parseNpmLockfile(content: string)`

Parses npm `package-lock.json` (lockfileVersion 3+).

**Package Keys:** `"node_modules/package-name"`

**Returns:**
```javascript
{
  type: 'npm',
  lockfileVersion: number,
  name: string,
  version: string,
  packages: { [key: string]: NormalizedPackage },
  dependencies: object,
  requires: object
}
```

#### `parseYarnV1Lockfile(content: string)`

Parses Yarn v1 `yarn.lock` files.

**Package Keys:** `"package@version-range"` (e.g., `"lodash@^4.0.0"`)

**Returns:**
```javascript
{
  type: 'yarn',
  version: 1,
  packages: { [key: string]: NormalizedPackage }
}
```

#### `parseYarnBerryLockfile(content: string)`

Parses Yarn Berry (v2, v3, v4) `yarn.lock` files.

**Package Keys:** `"package@npm:version-range"` (e.g., `"lodash@npm:^4.0.0"`)

**Returns:**
```javascript
{
  type: 'yarn',
  version: number, // 2, 3, or 4
  metadata: {
    version: number,
    cacheKey: string
  },
  packages: { [key: string]: NormalizedPackage }
}
```

#### `parsePnpmLockfile(content: string)`

Parses pnpm `pnpm-lock.yaml` files (v7, v8, v9, v10).

**Package Keys:** `"package@version"` (e.g., `"lodash@4.17.21"`)

**Returns:**
```javascript
{
  type: 'pnpm',
  lockfileVersion: string,
  settings: object,
  importers: object, // v9+
  dependencies: object,
  devDependencies: object,
  specifiers: object, // v7
  packages: { [key: string]: NormalizedPackage },
  snapshots: object // v9+ dependency trees
}
```

## Development

### Running Tests

```bash
npm test
```

### Running Tests in Watch Mode

```bash
npm run test:watch
```

### Project Structure

```
.
├── src/
│   ├── index.js         # Main entry point with unified API
│   ├── npm.js           # npm lockfile parser
│   ├── yarn-v1.js       # Yarn v1 parser
│   ├── yarn-berry.js    # Yarn Berry (v2+) parser
│   └── pnpm.js          # pnpm parser
├── test/
│   ├── index.test.js
│   ├── npm.test.js
│   ├── yarn-v1.test.js
│   ├── yarn-berry.test.js
│   └── pnpm.test.js
└── fixtures/            # Test fixtures with real lockfiles
    ├── npm/
    ├── yarn-v1/
    ├── yarn-v2/
    ├── yarn-v3/
    ├── yarn-v4/
    ├── pnpm-v7/
    ├── pnpm-v8/
    ├── pnpm-v9/
    └── pnpm/
```

## License

Apache-2.0

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
