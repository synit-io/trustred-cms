import { execFileSync } from 'node:child_process'

let output
try {
  output = execFileSync('npm', ['audit', '--json'], { encoding: 'utf8' })
} catch (error) {
  output = error.stdout?.toString()
}
const audit = JSON.parse(output || '{}')
if (audit.error || !audit.metadata || !audit.vulnerabilities) {
  throw new Error('Dependency audit failed to return vulnerability data.')
}

// braces has no published patched release. It processes trusted build globs only.
// Keep the exact advisory visible and fail CI on every other high/critical advisory.
const reviewedBuildAdvisory = 'https://github.com/advisories/GHSA-vfj7-8cjw-p6xm'
let failures = 0
const seen = new Set()
for (const vulnerability of Object.values(audit.vulnerabilities)) {
  for (const advisory of vulnerability.via.filter((item) => typeof item === 'object')) {
    if (seen.has(advisory.url)) continue
    seen.add(advisory.url)
    const reviewed = advisory.url === reviewedBuildAdvisory && advisory.name === 'braces'
    console.log(
      `${advisory.severity}: ${advisory.name}: ${advisory.url}${reviewed ? ' (reviewed build dependency; no patched release)' : ''}`,
    )
    if (!reviewed && ['high', 'critical'].includes(advisory.severity)) failures += 1
  }
}
console.log(JSON.stringify(audit.metadata.vulnerabilities))
process.exitCode = failures > 0 ? 1 : 0
