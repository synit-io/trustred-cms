# Contributing to TrustRed CMS

Read [the development guide](docs/DEVELOPMENT.md), [architecture](docs/ARCHITECTURE.md),
and [AGENTS.md](AGENTS.md) before changing the application. Use the Node version
in `.nvmrc` and install dependencies with `npm ci`.

Keep changes focused. Describe the problem, resulting behavior, compatibility
impact, and relevant verification in your pull request. Add regression tests for
bugs, use the existing test suites, and update affected documentation. Tests use
temporary SQLite databases and must never delete data from a development or
production instance.

Before submitting, run `npm run lint`, `npx tsc --noEmit`, `npm run test:int`, and
`npm run build`. Run `npm run test:e2e` for route, UI, setup, or authentication
changes. Generate Payload types after schema changes and regenerate the admin
import map after component changes. Include migrations for stored-data changes.

Use Conventional Commits with a short description of what changed and a body
explaining why. The Git history is the source for the structured changelog.
Do not include secrets, local databases, generated test reports, or unrelated
work in commits. Agent sessions require user confirmation before finalizing a
commit, as specified by the working agreement.

Contributions use the repository's [PolyForm Noncommercial license](LICENSE).
Commercial usage requires separate permission from the maintainer.
