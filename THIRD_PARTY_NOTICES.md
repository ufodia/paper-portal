# Third-party notices

Paper Portal's original source is MIT-licensed, copyright © 2026 ufodia.
Dependencies retain their own copyright and license terms.

## js-aruco2 2.0.0

The marker generator and detector use [js-aruco2](https://github.com/damianofalcioni/js-aruco2).
Its package declares MIT and credits Damiano Falcioni (2020) and Juan Mellado (2011).
The upstream license file also includes notices for ArUco, OpenCV, AForge.NET,
and StackBoxBlur. Those notices are preserved in full:

- [Complete upstream license text](third_party/js-aruco2/LICENSE.txt)
- [Upstream source and package metadata](third_party/js-aruco2/)

The source snapshot is copied from the npm package locked at version 2.0.0.
Its license text is normalized from Windows-1252 to UTF-8 so the original
copyright symbols and quotation marks remain readable. Source files are not
modified. Builds use the exact locked npm dependency.

Exported games and printed-card documents carry the complete upstream notice
text. The source repository includes the player, engine, detector adapter, and
build scripts so the runtime can be inspected and rebuilt.

## Development tools

Vite, TypeScript, Vitest, Playwright, Prettier, and their dependencies retain the
licenses distributed with their packages. `package-lock.json` records the exact
dependency graph. The Paper Portal license does not replace those terms.
