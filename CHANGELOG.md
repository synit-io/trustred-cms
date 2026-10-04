# Changelog

Git history, using Conventional Commits and explanatory commit bodies, is the
source of truth for release notes. Dates and releases below describe repository
changes, not deployed instances.

## Unreleased

- Update the coordinated Payload stack to 3.90.2 and compatible application and
  test dependencies. Add the required password-reset throttling migration,
  preserve peer constraints for GraphQL, ESLint, and TypeScript, and align the
  declared Node/pnpm engines with the installed tooling.
- Preserve production mode in container seeding commands so development schema
  push cannot conflict with migrations. Keep the development user seed password
  compatible with the new minimum-length policy, and close CLI seed connections
  explicitly and set the exit status to prevent an Alpine ARM64 shutdown crash.
- Validate the technical analysis report and record unsupported claims and
  optional proposals separately.
- Encrypt saved SMTP passwords with authenticated encryption and migrate legacy
  credentials without changing their field shape.
- Require the application secret in development as well as production; validate
  partial S3 settings and the configured timezone at startup.
- Reject oversized media, weak new passwords, malformed login JSON, and
  cross-site custom auth requests. Add HTTP security headers and mutation logs.
- Remove unused feed queries, cache repeated feed requests, and handle invalid
  public dates safely.
- Use editable SEO metadata, add a route loading state, recover from login
  network errors, and keep SMTP failure details out of browser URLs.
- Patch vulnerable Next.js and compatible transitive dependencies; audit new
  high and critical advisories in CI while explicitly reporting the reviewed,
  unpatched `braces` build dependency.
- Add liveness/readiness probes, Docker health checking, rollback guidance, API
  documentation, and contribution instructions.
- Isolate test databases from local `.env` data and verify regressions with unit,
  integration, and browser tests.
