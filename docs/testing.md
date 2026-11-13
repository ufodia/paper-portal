# Verify the studio and player

This guide describes checks for Paper Portal 0.1.0. Automated marker tests and simulator flows have a different scope from a real camera session.

## Install and verify source

Use Node.js 24 LTS and the tracked lockfile:

```sh
npm ci
npm run verify
```

The verification command combines type checking, unit tests and the complete production build. The build recreates the ignored standalone-player runtime from tracked source.

## Run browser workflows

```sh
npx playwright install --no-shell chromium
npm run test:e2e
```

The suite uses the full Chromium channel. Linux CI installs browser OS dependencies with `npx playwright install --with-deps --no-shell chromium`.

## Keep test claims separate

| Check                          | What it can establish                                                                                     |
| ------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Project validation             | Supported schema, bounds and safe handling of authored text                                               |
| Rule-engine observations       | Temporal progress, stage transitions, witness requirements and reset behavior                             |
| Synthetic marker images        | Detector recognition for the supplied generated pixels                                                    |
| Synthetic canvas-camera stream | Fresh video frames passing through the real detector and media-track lifecycle, without physical hardware |
| Simulator workflow             | Authoring controls and rule behavior through simulated observations                                       |
| Exported-player workflow       | Embedded runtime, saved project fidelity and independent play behavior                                    |
| Physical camera session        | Recognition with your camera, printed cards, focus, lighting and placement                                |

A successful synthetic image or simulator test does not establish hardware-camera reliability. Report exactly which input path was used.

## Manual activity check

Before using the game with a group:

1. Print the actual deck and verify that marker borders and white surrounds remain intact.
2. Test camera permission in the intended browser and local/HTTPS context.
3. Play every stage with the real cards at the intended distance and lighting.
4. Cover or stop the camera during a hidden stage; confirm it does not complete without the required witness evidence.
5. Try pause, restart and source changes so pending progress cannot survive as stale evidence.
6. Open the exported player in the recipient's intended environment.
7. Test keyboard controls and readable focus in the studio and player.

Record the source commit, browser, camera path and physical conditions with any camera report. Avoid claiming general reliability from one setup.
