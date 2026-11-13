# Restore Paper Portal from GitHub

The repository contains the studio, player source, non-secret configuration, dependency lockfile, tests and documentation. Your saved games are separate local files; back them up when you need to retain them.

## Fresh setup

Install Git and Node.js 24 LTS, then run:

```sh
git clone https://github.com/ufodia/paper-portal.git
cd paper-portal
git switch main
git pull --ff-only origin main
git rev-parse HEAD
npm ci
npm run verify
npm run dev
```

Record the full source SHA when reproducing an exact version. Open the local address printed by the development server, then reopen your saved project through the studio.

## Generated player runtime

The generated runtime is intentionally ignored by Git. The tracked player source and build script recreate it during the normal dev/build workflow. Its absence immediately after cloning is expected; do not copy an old generated runtime from an unrelated checkout.

Use the committed dependency lockfile. If an export build fails, rerun dependency installation and the normal build, then inspect the actual error rather than downloading a detector script from an arbitrary CDN.

## Update carefully

Inspect git status and preserve local changes before updating. With a clean checkout on main, use a normal fast-forward pull from origin/main, reinstall from the lockfile and run the checks.

The source repository does not preserve browser permissions, unsaved games or physical camera qualification. Recheck camera permission and the printed deck on a replacement computer.
