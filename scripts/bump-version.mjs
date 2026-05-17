import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const newVersion = process.argv[2]

if (!newVersion) {
  console.error('Usage: node scripts/bump-version.mjs <version>')
  console.error('Example: node scripts/bump-version.mjs 0.1.2')
  process.exit(1)
}

if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(newVersion)) {
  console.error(`Invalid version: "${newVersion}" — use semver (e.g. 1.0.0, 1.0.0-beta.1)`)
  process.exit(1)
}

const packageJsonPath = resolve('package.json')
const plankManifestPath = resolve('src/plank.ts')

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
const previousPackageVersion = packageJson.version
packageJson.version = newVersion
writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')

let plankSource = readFileSync(plankManifestPath, 'utf8')
const previousManifestVersion = plankSource.match(/version:\s*"([^"]+)"/)?.[1] ?? null
plankSource = plankSource.replace(/version:\s*"[^"]+"/, `version: "${newVersion}"`)
writeFileSync(plankManifestPath, plankSource)

console.log(`\nBumped @plank-cms/addon-content-health to ${newVersion}\n`)
console.log(`  package.json   ${previousPackageVersion} → ${newVersion}`)
console.log(`  src/plank.ts   ${previousManifestVersion ?? 'unknown'} → ${newVersion}`)
console.log('\nDone.\n')
