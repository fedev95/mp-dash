# Security Policy

## Reporting a vulnerability

Please don't open a public issue. Report it privately from the repository's **Security** tab > **Report a vulnerability**.

Include the steps to reproduce and the impact. This is a personal project, so responses are best effort.

## Supported versions

Only the latest commit on `main` is supported.

## Known dependency advisories

These remain open until the upgrade to Angular 21 and don't affect the app in the browser:

- `@grpc/grpc-js` (via `firebase` 11): only used by Firebase in Node.js servers. It isn't part of the browser bundle.
- Advisories inside `@angular/cli`: development and build tooling only.
