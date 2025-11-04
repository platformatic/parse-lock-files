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

### Find and Parse Lockfile in Directory

The easiest way to use this library is to point it at a directory and let it find and parse the lockfile:

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

### `findAndParseLockfile(directory: string): Promise<object>`

Finds a lockfile in the given directory, automatically detects its type, and parses it. Searches for `package-lock.json`, `yarn.lock`, and `pnpm-lock.yaml` in that order.

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

### Parser-Specific Functions

#### `parseNpmLockfile(content: string)`

Parses npm `package-lock.json` (lockfileVersion 3+).

**Returns:**
```javascript
{
  type: 'npm',
  lockfileVersion: number,
  name: string,
  version: string,
  packages: {
    [key: string]: {
      version: string,
      resolved: string,
      integrity: string,
      dependencies: object,
      devDependencies: object,
      // ... other fields
    }
  }
}
```

#### `parseYarnV1Lockfile(content: string)`

Parses Yarn v1 `yarn.lock` files.

**Returns:**
```javascript
{
  type: 'yarn',
  version: 1,
  packages: {
    [key: string]: {
      version: string,
      resolved: string,
      integrity: string,
      dependencies: object,
      optionalDependencies: object,
      peerDependencies: object
    }
  }
}
```

#### `parseYarnBerryLockfile(content: string)`

Parses Yarn Berry (v2, v3, v4) `yarn.lock` files.

**Returns:**
```javascript
{
  type: 'yarn',
  version: number, // 2, 3, or 4
  metadata: {
    version: number,
    cacheKey: string
  },
  packages: {
    [key: string]: {
      version: string,
      resolution: string,
      dependencies: object,
      checksum: string,
      languageName: string,
      linkType: string
    }
  }
}
```

#### `parsePnpmLockfile(content: string)`

Parses pnpm `pnpm-lock.yaml` files (v7, v8, v9, v10).

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
  packages: {
    [key: string]: {
      version: string,
      resolution: object,
      dependencies: object, // Note: v9+ has limitations
      devDependencies: object,
      engines: object,
      dev: boolean,
      optional: boolean
    }
  }
}
```

## Known Limitations

### pnpm v9+ Dependencies

pnpm v9 and v10 use a YAML format with duplicate keys for storing package metadata and dependencies separately. The standard YAML parser cannot merge these duplicate keys automatically. As a result:

- Package metadata (resolution, engines, etc.) is parsed correctly
- Dependencies may be empty for some packages in v9+
- This is a limitation of the YAML specification and parser

For v7 and v8, all dependency information is parsed correctly.

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
