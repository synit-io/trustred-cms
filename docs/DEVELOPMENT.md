# TrustRed CMS Development

This guide covers local setup, starter data, code generation, tests, and project
rules for contributors.

## Prerequisites

- Node.js version from `.nvmrc`
- npm
- Git

Use the project Node installation before running Node-based commands:

```bash
export PATH="$HOME/.nvm/versions/node/v24.22.1/bin:$PATH"
```

## Install dependencies

```bash
npm ci
```

Keep `payload` and all direct `@payloadcms/*` dependencies on the same stable
release, currently `3.90.2`. Next.js `16.4.2` and React `19.3.0` satisfy this
release's peer requirements. The remaining compatibility constraints are:

- GraphQL stays on `16.x`, as required by Payload.
- ESLint stays on `9.x` because `eslint-plugin-react` does not support ESLint 10.
  ESLint 9 is stable but is marked unsupported upstream.
- TypeScript stays on `6.0.x` because TypeScript-ESLint requires `<6.1.0`.
- npm is the package manager used by the lockfile and CI.
- jsdom `30.1.2` requires Node `^22.22.2 || ^24.15.0 || >=26`; `.nvmrc` selects
  Node `24.22.1`, which includes the [October 2026 security fixes](https://nodejs.org/en/blog/vulnerability/october-2026-security-releases).
- Node type definitions currently use `26.x`; avoid using runtime APIs absent
  from supported Node 22/24 installations. Docker uses Node `24.22.1`.
- The optional pnpm dependency uses `12.x`; npm remains the installation and CI
  workflow. The package engine accepts pnpm 9 through 12.

The 2026-10-04 dependency refresh updates all direct packages that fit these
constraints and refreshes compatible transitive dependencies. Dotenv `18.0.5`
retains the project's `import 'dotenv/config'` loading path; this project does
not use its removed `.env.vault` support. Payload's scoped Undici override stays
on the supported 7.x line, now `7.30.0`, rather than forcing Undici 8 into Payload.

Payload 3.90 adds an authentication field for password-reset throttling. Run the
committed migrations before serving an existing database with the new version.
The migration preserves existing users and sessions. See the
[Payload 3.90 upgrade notes](https://github.com/payloadcms/payload/releases/tag/v3.90.0)
for the related authentication and upload security changes.

Direct dependencies use stable releases. Upstream dependencies still require
`body-scroll-lock@4.0.0-beta.0`, `gensync@1.0.0-beta.2`, and
`resolve@2.0.0-next.7`; do not force incompatible stable replacements through
overrides.

After changing dependencies, update `package-lock.json` and verify a clean
installation with peer and engine validation enabled:

```bash
npm ci --legacy-peer-deps=false --strict-peer-deps --engine-strict
npm ls --all
```

Normal `npm ci` does not require `--legacy-peer-deps` or `--force`.

Dependency install scripts are explicitly reviewed through
`package.json#allowScripts`. When an approved transitive build dependency changes
version, review its installation script before updating the pinned entry.

## Local environment

Create the environment file:

```bash
cp .env.example .env
```

Minimum development configuration:

```dotenv
DATABASE_URL=file:./data/trustred-cms.db
PAYLOAD_SECRET=replace-with-a-local-secret
SETUP_TOKEN=replace-with-a-local-setup-token
TRUSTRED_PUBLIC_ORIGIN=http://localhost:3000
SITE_TIMEZONE=Europe/Berlin
```

Start development mode:

```bash
npm run dev
```

## Local URLs

| Interface              | URL                                  |
| ---------------------- | ------------------------------------ |
| Public website         | `http://localhost:3000/`             |
| Initial setup          | `http://localhost:3000/setup`        |
| Editorial login        | `http://localhost:3000/manage/login` |
| Editorial workspace    | `http://localhost:3000/manage`       |
| Payload administration | `http://localhost:3000/admin`        |

## Starter and demo content

TrustRed provides separate initialization modes for real installations and
development demos.

### Clean starter

```bash
npm run seed:empty
```

This creates required globals, navigation, base pages, warning presets, and form
infrastructure. It does not create public demo records or bundled demo media.

### Demo installation

```bash
npm run seed
```

This creates the fictional **Freiwillige Feuerwehr Musterstadt** environment,
including pages, news, events, operations, vehicles, crew profiles, FAQs, forms,
warning presets, media, and bundled demo images.

Demo content is intentionally separate from database migrations. Migrations must
not silently introduce customer-facing demo content.

The editorial **Demo Daten löschen** action removes known demo records and
unreferenced demo media. It preserves all existing pages and site settings,
including edits to seeded pages and organization/contact details. Missing base
pages and forms are restored; use an explicit edit to reset existing content.

Run `npm run migrate` before either seed command on a new or upgraded database.
The source runner uses `src/migrations/index.ts`; the Docker image runs the same
logic against its bundled migration index. Existing databases created by
Payload's development schema push skip the baseline and continue with additive
migrations without an interactive prompt.

### Development user

```bash
npm run seed:user
```

Optional overrides:

```dotenv
TRUSTRED_EDITOR_EMAIL=editor@example.com
TRUSTRED_EDITOR_PASSWORD=change-this-development-password
```

`seed:user` and all example credentials are for local development only. Never use
development credentials on an internet-facing installation.

## Common commands

```bash
npm run dev
npm run build
npm run lint
npm run audit:dependencies
npm test
npm run test:int
npm run test:e2e
npm run generate:types
npm run generate:importmap
npm run migrate
npm run seed
npm run seed:empty
npm run seed:user
npm run verify:starter
```

## Code generation

- Run `npm run generate:types` after Payload schema changes.
- Run `npm run generate:importmap` after adding or changing Payload admin
  components.
- Import project document types from `src/payload-types.ts`.
- Commit a Payload migration for every schema change. CI verifies generated types
  and the import map are current.

## Payload safety rules

- When passing a user to the Payload Local API, set `overrideAccess: false`.
- Pass `req` to nested Payload operations inside hooks so they share the original
  transaction.
- Use hook context flags when nested writes could trigger the same hook again.
- Keep access restrictive by default and verify roles when changing protected
  collections or globals.

## Verification

Recommended checks:

```bash
npx tsc --noEmit
npm run lint
npm run test:int
npm run build
```

Run `npm test` for the complete integration and browser test suite. The combined
script uses npm throughout so it reuses the dependencies installed by `npm ci`.
Using pnpm inside this script can trigger an automatic install and replace the
npm dependency tree.

The 2026-10-04 refresh updated 20 direct dependencies and compatible transitive
packages. Verification passed strict peer/engine installation, `npm ls --all`,
TypeScript, lint, stable generated types/import map, 34 unit/integration tests,
six Chromium tests, production and Docker builds, and migration retry/rollback
with existing users and sessions. An Alpine ARM64 container passed all three
seed commands, demo rendering, login cookies, media upload/resizing/delivery,
unsafe SVG rejection, invalid seed-password account preservation, and Docker
health checks. Validation used disposable databases and containers.

The only deferred direct updates are GraphQL `17.0.2`, ESLint `10.12.0`, and
TypeScript `7.0.2`, which violate the peer constraints listed above. The four
open Payload Dependabot proposals are covered by the coordinated update; their
pull requests were not merged. Node 24/26 and the configured GitHub Action major
versions were already current. No production database or external S3 service
was changed.

Vitest runs utility tests from `tests/unit` and integration tests from
`tests/int`. Both suites use dedicated temporary SQLite databases. Playwright
workers inherit one dedicated suite database through `TRUSTRED_E2E_DATABASE_URL`.
Neither test runner reuses `DATABASE_URL` from `.env`. Tests include deterministic
query-count checks for feed rendering instead of machine-dependent timing limits.
Upload fixtures disable S3 so they cannot write to configured external storage.
Server-side upload checks use Vitest's Node environment, matching Payload's
native Buffer and Sharp runtime rather than jsdom's typed-array realm.

`npm run audit:dependencies` fails for new high or critical advisories and for
audit service errors. Run it separately from CI so audit failures do not block
the other checks. The exact unpatched `braces` build advisory is explicitly
reported and reviewed; the legacy esbuild development-server advisory is also
reported. Revisit both when upstream publishes compatible fixes. Do not apply
`npm audit fix --force`, which currently proposes incompatible downgrades of
the Payload stack.

Keep Payload packages on the same version: their exact peer requirements prevent
updating the SEO plugin independently. Keep the audit's high/critical failure
policy intact when refreshing vulnerable transitive dependencies.

Run end-to-end tests when changing frontend routes, authentication, setup, or
editorial workflows:

```bash
npm run test:e2e
```

## Docker development

Build the local image:

```bash
npm run docker:build
```

Production operation belongs in the [self-hosting guide](DEPLOYMENT.md).

## Related documentation

- [Architecture](ARCHITECTURE.md)
- [Self-hosting](DEPLOYMENT.md)
- [Frontend design guide](DESIGN_GUIDE.md)
- [Project README](../README.md)
