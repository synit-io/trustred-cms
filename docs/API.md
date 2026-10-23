# TrustRed HTTP API

Payload exposes its standard REST API at `/api`, with authentication, collection
access rules, filters, sorting, and `page` / `limit` pagination. For example,
`GET /api/posts?page=2&limit=20` returns published posts to anonymous callers.
Forms and submissions require editorial permissions; the public website submits
forms through Next.js Server Actions. See the
[Payload REST documentation](https://payloadcms.com/docs/rest-api/overview).

## Custom routes

| Method and path            | Request                                             | Response                                                                                                                                                                                                             |
| -------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /manage/auth/login`  | JSON with string `email` and `password`             | `200`: `{ ok, redirectTo, user }` and an HTTP-only `payload-token` cookie. `400`: invalid JSON or credentials shape. `401`: invalid credentials or locked account. `403`: rejected origin or missing editorial role. |
| `POST /manage/auth/logout` | No body; browser requests must have the same origin | `200`: `{ ok: true }` and an expired cookie. `403`: rejected origin.                                                                                                                                                 |
| `GET /termine/:slug/ics`   | Public event slug                                   | `200`: `text/calendar` attachment. `404`: event does not exist or is not public.                                                                                                                                     |
| `GET /health`              | No authentication                                   | `200`: `{ status: "ok" }`. Checks the HTTP process.                                                                                                                                                                  |
| `GET /ready`               | No authentication                                   | `200`: `{ status: "ready" }` after a database query. `503`: `{ status: "unavailable" }`.                                                                                                                             |

Probe responses disable caching. Login errors use
`{ errors: [{ message: "..." }] }`; clients should use the HTTP status rather
than matching message text. Browser auth mutations compare Origin to the request
host, using `X-Forwarded-Host` when a trusted reverse proxy supplies it. Configure
the proxy to overwrite forwarded headers rather than accepting client values.

Payload locks an account after five failed attempts for ten minutes. Public
forms allow five submissions per form and source-address fingerprint in ten minutes,
with a honeypot and field validation. These controls do not constitute a global
API traffic limit; configure that limit at the deployment's reverse proxy.

Session cookies use `HttpOnly` and `SameSite=Lax`. Production HTTPS requests set
`Secure`. Editorial logout revokes the current server session and removes the
browser cookie. Other signed-in devices keep their separate sessions.

Media uploads reject files above 10 MiB through both Payload HTTP parsing and
the Local API. Payload validates restricted file types. This project retains
support for non-image attachments rather than introducing an image-only policy.
Media deletion returns a conflict while a published page or post, its current
draft, site settings, or another content record still references the file; this
check applies to both the editorial workspace and Payload API.
