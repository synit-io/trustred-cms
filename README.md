# TrustRed CMS

**A self-hostable website and content management system for fire departments,
emergency-service organizations, municipalities, and nonprofits.**

TrustRed CMS helps organizations publish news, operations, events, vehicles, team
information, warnings, public information, and more without assembling and
maintaining a collection of unrelated CMS plugins.

It combines a public website, purpose-built editorial workspace, structured
content models, media management, forms, warning information, and Docker-based
deployment in one application.

**Free for noncommercial use. Source-available. Self-hostable.**

[TrustRed by synit.io](https://www.synit.io/products/trustred) ·
[Live demo](https://demo-cms.trust-red.de/) ·
[Docker Hub](https://hub.docker.com/r/synitio/trustred-cms) ·
[Documentation](docs/README.md) · [License](LICENSE)

---

## Why TrustRed?

Public communication matters for modern fire departments, rescue organizations,
civil-protection units, municipalities, and nonprofits. Their websites are often
maintained by volunteers or employees whose primary job is not CMS
administration.

TrustRed is developed and maintained by
[synit.io](https://www.synit.io/products/trustred) with direct experience from the
volunteer fire service. It focuses on information these organizations actually
manage:

- operations and incident reports
- vehicles and equipment
- exercises and public events
- news and announcements
- team and department information
- recruitment and membership information
- public warning information
- contact and participation forms
- safety and prevention information

Practical requirements, simple editorial workflows, maintainability, privacy,
and reliable operation are core design principles.

## Who is TrustRed for?

TrustRed CMS is primarily designed for:

- volunteer and professional fire departments
- rescue and first-aid organizations
- civil-protection and disaster-response organizations
- municipal departments and public-safety organizations
- charities and nonprofit organizations
- community organizations and associations

The underlying CMS can support other organizations, but public-safety and
nonprofit use cases remain the primary focus.

## What can you build?

### News and public information

Publish announcements, training reports, recruiting content, community
information, and other updates.

### Operation reports

Maintain a structured public archive with dates, operation numbers, categories,
alarm keywords, locations, public reports, and associated media. The public
presentation supports useful reporting without requiring personal or sensitive
operational details.

### Events and exercises

Publish exercises, public events, training dates, information evenings, open
houses, and community activities. Events support date ranges, upcoming and
archive views, and ICS calendar export.

### Vehicles and equipment

Create profiles with structured facts, highlights, photographs, and equipment
compartments without manually building every page.

### Team and organization

Present leadership, firefighters, youth departments, specialist groups,
trainers, and other organizational roles through structured profiles.

### Warning information

Integrate public DWD and NINA information through reusable built-in and custom
warning presets.

### Forms

Create reusable forms for contact, membership inquiries, recruiting, event
registration, requests, and feedback.

### Media library

Manage uploads, metadata, previews, filters, usage inspection, and protection
against accidentally deleting media still in use.

### Flexible page building

Compose pages with structured blocks for hero sections, rich content, media,
forms, warnings, equipment, operation lists, feeds, calls to action, and custom
HTML where needed.

## Designed for organizations, not only developers

Editors use the dedicated TrustRed workspace at `/manage`. It provides the areas
needed for normal website maintenance without exposing the full underlying CMS
administration.

Typical editorial areas include:

```text
/manage
/manage/content
/manage/forms
/manage/media
/manage/settings
/manage/warnings
```

Payload's `/admin` interface remains available for super administrators,
support, schema inspection, troubleshooting, and maintenance.

## Core features

- responsive public frontend with configurable navigation and branding
- structured pages, news, events, operations, teams, equipment, FAQs, and forms
- purpose-built `/manage` editorial workspace with role-based access
- visual page builder with reusable typed content blocks
- local media storage or S3-compatible object storage
- media previews, filtering, usage inspection, and protected deletion
- upcoming events, archive views, and ICS export
- operation archives with year and category filters
- privacy-conscious public operation details
- DWD and NINA integrations with built-in and custom presets
- reusable Payload Form Builder forms
- SMTP configuration through the editorial interface
- first-run setup wizard
- SQLite by default
- Docker self-hosting or managed operation

## At a glance

|                             |                                                                               |
| --------------------------- | ----------------------------------------------------------------------------- |
| **Primary purpose**         | Public website and content management                                         |
| **Target users**            | Fire departments, public-safety organizations, municipalities, and nonprofits |
| **Deployment**              | Docker self-hosting or managed service                                        |
| **License**                 | PolyForm Noncommercial 1.0.0                                                  |
| **Editorial UI**            | Custom `/manage` workspace                                                    |
| **Advanced administration** | Payload `/admin`                                                              |
| **Database**                | SQLite by default                                                             |
| **Media**                   | Local storage or S3-compatible object storage                                 |
| **Forms**                   | Payload Form Builder                                                          |
| **Warnings**                | DWD and NINA integrations                                                     |
| **Container image**         | `synitio/trustred-cms`                                                        |

## Self-hosted or managed

### Self-hosted

Run TrustRed on your own Docker infrastructure when your organization wants
control over hosting and data, already has backup and update processes, or has
specific privacy and infrastructure requirements.

The official image will be distributed through
[Docker Hub](https://hub.docker.com/r/synitio/trustred-cms). See the complete
[self-hosting guide](docs/DEPLOYMENT.md).

### Managed TrustRed

[synit.io](https://www.synit.io/products/trustred), the maintainer of TrustRed,
offers managed deployment, hosting, updates, backups, technical operation,
support, and commercial licensing where required.

Organizations can focus on content and public communication instead of container
operations.

**[Learn more about TrustRed](https://www.synit.io/products/trustred)**

## Live demo

A demonstration installation for the fictional **Freiwillige Feuerwehr
Musterstadt** is available at:

**[https://demo-cms.trust-red.de/](https://demo-cms.trust-red.de/)**

The demo includes homepage content, news, operations, events, vehicles, team
members, warnings, FAQs, contact information, and recruiting content. A matching
demo dataset is included with the project.

## First-run experience

A fresh installation provides an interactive `/setup` process. When no user
exists, `/manage/login` redirects there automatically.

The setup wizard creates the first `super-admin` and captures organization,
branding, contact, imprint, homepage, theme, and optional SMTP settings. These
settings remain editable through the normal editorial workspace.

## What TrustRed is not

TrustRed CMS is designed for public communication and content management. It does
not replace:

- emergency dispatch systems
- control-room software
- paging or alerting systems
- incident command software
- mission-critical operational communication

Warning integrations and operation information are intended for public website
and information use.

## Technical documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Development](docs/DEVELOPMENT.md)
- [Self-hosting and deployment](docs/DEPLOYMENT.md)
- [Frontend design guide](docs/DESIGN_GUIDE.md)
- [Documentation index](docs/README.md)

## License

Copyright © 2026 [synit.io](https://www.synit.io).

TrustRed CMS is source-available under the
[PolyForm Noncommercial License 1.0.0](LICENSE). It permits noncommercial use,
including qualifying use by charitable, educational, public-research,
public-safety, public-health, environmental-protection, and government
organizations.

Commercial use requires a separate license from synit.io. If intended use is
unclear, contact [synit.io / TrustRed](https://www.synit.io/products/trustred).

## Maintainer and support

TrustRed CMS is developed and maintained by
[synit.io](https://www.synit.io/products/trustred), which provides development,
managed hosting, deployment assistance, upgrades, backups, support, and
commercial licensing.

## Built for the people behind the organization

Fire departments and nonprofits should be able to maintain a modern public
presence without turning website administration into another major technical
responsibility.

TrustRed aims to make publishing information about operations, people, equipment,
events, safety, and community work straightforward while allowing organizations
to retain control over their infrastructure and data.
