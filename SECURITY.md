# Security policy

## Sensitive boundaries

Security-sensitive areas include imported project validation, authored-text escaping, embedded-player generation, camera permission lifecycle and dependency integration.

Only the current main source is maintained at this stage. There is no promised response time or long-term support branch.

## Report privately

Use [Report a vulnerability](https://github.com/ufodia/paper-portal/security/advisories/new). Private vulnerability reporting is enabled for this repository. Do not publish exploit details or private camera data in an issue.

If that private channel is unavailable, ask the maintainer for a private reporting route without posting sensitive details. Include the affected commit, reproduction steps, impact and a minimal synthetic project through the private route.

## Local processing boundary

The studio and player process marker observations locally. An exported file cannot grant itself camera permission or bypass browser policy. Review authored content before distributing projects and use [privacy.md](docs/privacy.md) to understand the data in exports.
