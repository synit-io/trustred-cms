# TrustRed CMS Architecture

TrustRed CMS combines a public Next.js application, a purpose-built editorial
workspace, and Payload CMS in one deployment.

## System boundaries

Payload is the source of truth for:

- content
- media
- authentication and roles
- forms
- site configuration
- page structure

The application exposes three main surfaces:

| Surface   | Purpose                                         |
| --------- | ----------------------------------------------- |
| `/`       | Public website and collection detail pages      |
| `/manage` | Normal editorial workspace                      |
| `/admin`  | Advanced Payload administration and maintenance |

The custom `/manage` application owns the everyday editorial experience.
Payload `/admin` remains available for super-admin support, debugging, schema
inspection, and advanced maintenance.

## Project structure

```text
src/
├── app/
│   ├── (frontend)/          # Public site and TrustRed editorial UI
│   └── (payload)/           # Payload admin and API integration
├── collections/             # Payload collection configuration
├── globals/                 # Payload global configuration
├── components/trustred/     # Public and editorial UI components
├── lib/trustred/            # CMS, page builder, setup, seed and editorial helpers
└── payload.config.ts        # Payload configuration
```

## Content model

Dedicated Payload collections model:

- pages
- news
- events
- operations
- team members
- vehicles and equipment
- FAQs
- media
- warning presets
- forms

Site-wide contact data, branding, navigation, theme, imprint, SMTP, and setup
state are stored as Payload globals or related configuration.

## Editorial workspace

| Path               | Purpose                                    |
| ------------------ | ------------------------------------------ |
| `/manage/login`    | Editor login                               |
| `/manage`          | Dashboard                                  |
| `/manage/content`  | Pages and public content                   |
| `/manage/forms`    | Forms                                      |
| `/manage/media`    | Media management                           |
| `/manage/settings` | Site, SMTP, branding, and contact settings |
| `/manage/warnings` | DWD and NINA warning presets               |

Payload authentication and role-based access control protect editorial
operations. Local API calls made for a user must set `overrideAccess: false` so
Payload enforces that user's permissions.

## Page rendering

The public frontend renders Payload-managed pages and structured collection
routes. The visual page builder stores typed blocks for hero content, rich text,
media, forms, warnings, equipment, operation lists, feeds, calls to action, and
allowlist-sanitized custom HTML.

Shared block labels and descriptions live in the typed `pageBlockRegistry`.
Defaults, summaries, and validation are owned by focused page-builder modules so
the client builder remains orchestration and editing UI.

Specialized routes serve collection overviews and details for news, events,
operations, equipment, team members, and FAQs.

Public CMS routes use dynamic server rendering so published changes are read at
request time instead of being frozen into the production build.

## Data and media

SQLite is the default database. The default container database URL is:

```text
file:./data/trustred-cms.db
```

Default container persistence paths:

```text
/app/data
/app/media
```

Media uses local storage by default. Configuring the S3 environment variables
enables S3-compatible object storage and disables local media storage.

## Forms and email

Payload Form Builder provides reusable public forms. Form definitions are
restricted to content roles through Payload; public pages receive them only
through the server renderer. Submission creation is accepted only through the
validated server action; submission PII is restricted to settings roles. The
server validates required fields, types, options, length,
honeypot state, and per-client rate limits before writing or sending email. SMTP
configuration is managed through `/manage/settings`, including host, port,
credentials, sender identity, TLS options, and test delivery. SMTP is disabled by
default.

## Database initialization and migrations

The container checks database state during startup.

`src/migrations/index.ts` is bundled into the image and pending migrations run
before the application server starts. Fresh databases run the baseline and all
later migrations. Databases created before migration tracking skip only the
baseline and run later idempotent migrations. This preserves existing data while
moving installations onto the tracked migration path.

Automatic startup migration checks can be disabled with:

```dotenv
TRUSTRED_RUN_MIGRATIONS=false
```

Database migrations must not seed customer-facing demo content by default. Any
migration intentionally writing demo data must use the demo-content guard.

The configured `SITE_TIMEZONE` is the single timezone used to interpret
editor-entered wall times and format public dates. ICS output remains UTC and
declares the configured site timezone.

Nested Payload operations inside hooks must receive the original `req` to remain
inside the same transaction. Hook-triggered writes must use context guards when
needed to prevent recursion.

## Deployment model

The production build uses Next.js standalone output. The Docker image bundles
the application server, migration runner, and seed utilities. SQLite data and
local media remain outside the container through persistent mounts.

See the [self-hosting guide](DEPLOYMENT.md) for runtime configuration, HTTPS,
storage, backups, and updates.

## Related documentation

- [Development](DEVELOPMENT.md)
- [Self-hosting](DEPLOYMENT.md)
- [Frontend design guide](DESIGN_GUIDE.md)
- [Project README](../README.md)
