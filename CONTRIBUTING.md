# Contributing to Paper Portal

Small reproducible rule cases, marker fixtures, clearer authoring controls and useful game examples are welcome. Keep camera evidence distinct from simulator evidence.

## Set up

Use Node.js 24 LTS:

```sh
npm ci
npm run dev
```

The command builds the player runtime from tracked source. Read [the architecture](docs/architecture.md) before changing input or game-state handling and [the rule reference](docs/reference.md) before changing stage semantics.

## Report a useful bug

Include the source commit, browser, operating system, input source and exact steps. Prefer a minimal saved project and synthetic marker image over private camera footage. If the issue depends on physical detection, describe card size, lighting, focus and distance accurately.

Do not call a simulator run a camera test. Follow [SECURITY.md](SECURITY.md) for sensitive findings.

## Preserve the mechanic

- Keep marker detection separate from temporal rule evaluation.
- Preserve the hidden-stage prior-target and visible-witness requirements.
- Reset pending evidence on frame gaps, ambiguity, pause and source changes as defined by the engine.
- Keep camera activation explicit and stop media tracks when they are no longer used.
- Escape authored text in studio and player exports.
- Keep the player self-contained and preserve upstream license notices.

Add a focused regression test for the rule you change. Document any saved-data or mechanic change before making it the default. Keep all project content in English.

Do not commit camera recordings, credentials, dependency folders, generated runtime or build output. Pair dependency changes with the lockfile. Use original or properly licensed game art and retain required attribution.

## Verify and submit

```sh
npm run verify
npx playwright install --no-shell chromium
npm run test:e2e
```

Describe the checks you actually ran and their limits. Include a screenshot for a visual change and a minimal project for a rule change when helpful. By contributing, you agree that your contribution uses the repository's [MIT license](LICENSE) and follows the [code of conduct](CODE_OF_CONDUCT.md).
