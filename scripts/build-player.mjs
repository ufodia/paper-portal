import { build } from 'vite';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { arucoCompat } from './aruco-compat.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));

/** Build a network-independent runtime that the studio embeds in game exports. */
export async function buildPlayer(watch = false) {
  return build({
    root,
    configFile: false,
    publicDir: false,
    plugins: [arucoCompat()],
    build: {
      target: 'es2022',
      lib: {
        entry: path.join(root, 'src/player.ts'),
        name: 'PaperPortalRuntime',
        formats: ['iife'],
        fileName: () => 'player.js',
      },
      outDir: path.join(root, '.generated'),
      emptyOutDir: true,
      minify: true,
      ...(watch ? { watch: {} } : {}),
    },
  });
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  await buildPlayer();
}
