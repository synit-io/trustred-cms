# Self-Hosting TrustRed CMS

TrustRed CMS runs as a single Docker container with SQLite and local media by
default. The official image will be published as
[`synitio/trustred-cms`](https://hub.docker.com/r/synitio/trustred-cms) on Docker
Hub:

```text
synitio/trustred-cms:latest
```

Confirm that the `latest` tag is listed on Docker Hub before deployment. Until
the first image is published, build the image from this repository.

The `main` GitHub Actions workflow publishes `latest` after linting, type checks,
integration tests, and end-to-end tests pass. Repository maintainers must define
`DOCKERHUB_USERNAME` as a GitHub Actions variable and `DOCKERHUB_TOKEN` as a
GitHub Actions secret. The token needs write access to the public
`synitio/trustred-cms` Docker Hub repository.

Image builds use a public build-only `PAYLOAD_SECRET` placeholder because Next.js
loads the Payload configuration while collecting page data. The placeholder is
not retained as a runtime environment variable. Every deployed container still
requires its own stable `PAYLOAD_SECRET`.

This guide targets a Linux server with Docker Engine, Docker Compose v2, a domain,
and an HTTPS reverse proxy. The product is free for uses permitted by the
[PolyForm Noncommercial License 1.0.0](../LICENSE). Commercial use requires a
separate license from [synit.io](https://www.synit.io/products/trustred).

For hosted operation, updates, backups, and support managed by the maintainer,
see the [TrustRed managed service](https://www.synit.io/products/trustred).

## 1. Prepare the server

Install current Docker Engine and the Docker Compose plugin using the
instructions for your Linux distribution. Verify both commands:

```bash
docker --version
docker compose version
```

Create the deployment directory and persistent storage. The image runs as UID and
GID `1001`, so the mounted directories must be writable by that account.

```bash
sudo mkdir -p /opt/trustred-cms/data /opt/trustred-cms/media
sudo chown -R 1001:1001 /opt/trustred-cms/data /opt/trustred-cms/media
cd /opt/trustred-cms
```

## 2. Create the environment file

Generate independent application and setup secrets:

```bash
openssl rand -hex 32
openssl rand -hex 32
```

Create `/opt/trustred-cms/.env`:

```dotenv
DATABASE_URL=file:./data/trustred-cms.db
PAYLOAD_SECRET=replace-with-the-generated-secret
SETUP_TOKEN=replace-with-the-second-generated-secret
SITE_TIMEZONE=Europe/Berlin
TRUSTRED_RUN_MIGRATIONS=true

S3_BUCKET=
S3_REGION=
S3_ENDPOINT=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_FORCE_PATH_STYLE=false
```

Protect the file:

```bash
chmod 600 .env
```

Keep `PAYLOAD_SECRET` stable. Replacing it invalidates existing sessions and may
break data protected with that secret. Never use the repository's development
fallback in production. `SETUP_TOKEN` is required to create the first
super-admin. Rotate it after setup and keep the replacement private.

## 3. Create the Compose file

Create `/opt/trustred-cms/docker-compose.yml`:

```yaml
name: trustred-cms

services:
  app:
    image: synitio/trustred-cms:latest
    restart: unless-stopped
    env_file:
      - .env
    environment:
      DATABASE_URL: ${DATABASE_URL:-file:./data/trustred-cms.db}
      PAYLOAD_SECRET: ${PAYLOAD_SECRET:?Set PAYLOAD_SECRET in .env}
      SETUP_TOKEN: ${SETUP_TOKEN:?Set SETUP_TOKEN in .env}
      SITE_TIMEZONE: ${SITE_TIMEZONE:-Europe/Berlin}
      TRUSTRED_RUN_MIGRATIONS: ${TRUSTRED_RUN_MIGRATIONS:-true}
    ports:
      - '127.0.0.1:3000:3000'
    volumes:
      - ./data:/app/data
      - ./media:/app/media
```

Binding to `127.0.0.1` keeps the application port off the public network. Publish
the site through an HTTPS reverse proxy.

## 4. Start the application

Pull and start the image:

```bash
docker compose pull
docker compose up -d
```

Check the container and startup migration:

```bash
docker compose ps
docker compose logs -f app
```

The entrypoint runs pending migrations before starting Next.js. Leave
`TRUSTRED_RUN_MIGRATIONS=true` during normal operation. Disable it only for a
specific recovery procedure.

## 5. Configure HTTPS

Point the domain's DNS record at the server. Forward HTTPS traffic to
`127.0.0.1:3000` and preserve the original host and protocol headers.

Minimal Caddy example:

```caddyfile
cms.example.org {
  reverse_proxy 127.0.0.1:3000
}
```

Minimal Nginx location block:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

Configure a suitable request-body limit in the proxy when editors upload large
media files.

## 6. Complete first-run setup

Open `https://cms.example.org/setup` after the first start and enter the
`SETUP_TOKEN` from `.env`. The token-protected, transactional setup creates the
first `super-admin` user and captures the initial organization, branding,
contact, imprint, and optional SMTP settings.

After setup:

- editors use `/manage`
- super-admin maintenance remains available at `/admin`
- public content is served from `/`

Do not share the setup token. Rotate it after setup succeeds.

## Persistent data

Default local storage uses:

- `/app/data` for the SQLite database
- `/app/media` for uploaded media and generated image sizes

Both paths are mounted from the deployment directory. Back up `data`, `media`,
`.env`, and `docker-compose.yml` together. SMTP configuration stored through the
management UI resides in the database and is therefore included in the database
backup.

### Optional S3-compatible media storage

Set all required S3 values in `.env` to move uploaded media to S3-compatible
storage:

```dotenv
S3_BUCKET=trustred-media
S3_REGION=eu-central-1
S3_ENDPOINT=https://s3.example.org
S3_ACCESS_KEY_ID=replace-me
S3_SECRET_ACCESS_KEY=replace-me
S3_FORCE_PATH_STYLE=false
```

`S3_ENDPOINT` is optional for AWS S3 and normally required for other compatible
providers. When S3 is configured, Payload disables local media storage. Back up
the bucket according to the storage provider's procedures.

## Backups

For a consistent filesystem backup, briefly stop writes before archiving the
deployment data:

```bash
cd /opt/trustred-cms
docker compose stop app
sudo tar --exclude='./backups' -czf "trustred-backup-$(date +%F-%H%M%S).tar.gz" \
  data media .env docker-compose.yml
docker compose start app
```

Copy backups off the server and test restoration regularly. To restore, stop the
container, extract a known-good archive into `/opt/trustred-cms`, restore ownership
with `sudo chown -R 1001:1001 data media`, then start the container.

## Updates

Back up the instance first. Then pull and recreate the container:

```bash
cd /opt/trustred-cms
docker compose pull
docker compose up -d --remove-orphans
docker compose logs --tail=100 app
```

The persistent directories remain in place. The new container runs pending
migrations before serving traffic. Review release notes before updating and use a
fixed image tag instead of `latest` when versioned tags are available and strict
change control is required.

## Seeding and maintenance commands

Run bundled maintenance scripts inside the container:

```bash
docker compose exec app npm run seed:empty
docker compose exec app npm run seed
docker compose exec app npm run seed:user
```

- `seed:empty` creates clean starter structure without public demo content.
- `seed` creates the Musterstadt demonstration content and images.
- `seed:user` creates the configured development user and should only be used when
  its credentials are explicitly set for the target environment.

Set `TRUSTRED_EDITOR_EMAIL` and `TRUSTRED_EDITOR_PASSWORD` before using
`seed:user`. Never use its development defaults on a public instance.

## Troubleshooting

Show recent logs:

```bash
docker compose logs --tail=200 app
```

Common causes:

- `permission denied` below `/app/data` or `/app/media`: restore ownership to UID
  and GID `1001`
- startup or login failures after moving the instance: restore the original
  `PAYLOAD_SECRET`
- database startup failure: verify `DATABASE_URL` and available disk space
- failed media uploads: verify proxy request limits, media-directory ownership, or
  S3 credentials
- container unavailable through the domain: verify DNS, TLS, proxy headers, and
  that the app listens on `127.0.0.1:3000`

## Security checklist

- use a unique, backed-up `PAYLOAD_SECRET`
- use a separate private `SETUP_TOKEN` and rotate it after setup
- configure the organization's IANA `SITE_TIMEZONE`
- expose only HTTPS through the reverse proxy
- keep `.env` readable only by administrators
- update the host, Docker Engine, proxy, and TrustRed image regularly
- keep tested off-server backups of database and media
- restrict SSH and firewall access to administrators
- review the [license](../LICENSE) before commercial deployment

## Managed operation and commercial licensing

[synit.io](https://www.synit.io/products/trustred) maintains TrustRed CMS and
offers managed hosting, deployment, updates, backups, support, and commercial
licensing.
