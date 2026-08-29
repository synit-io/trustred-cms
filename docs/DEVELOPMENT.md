# TrustRed CMS Development

This guide covers local setup, starter data, code generation, tests, and project
rules for contributors.

## Prerequisites

- Node.js version from `.nvmrc`
- npm
- Git

Use the project Node installation before running Node-based commands:

```bash
export PATH="$HOME/.nvm/versions/node/v24.14.1/bin:$PATH"
```

## Install dependencies

```bash
npm ci
```

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
TRUSTRED_EDITOR_PASSWORD=change-me
```

`seed:user` and all example credentials are for local development only. Never use
development credentials on an internet-facing installation.

## Common commands

```bash
npm run dev
npm run build
npm run lint
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
