import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const arucoPath = require.resolve('js-aruco2');
const cvPath = path.join(path.dirname(arucoPath), 'cv.js');
const virtualId = '\0paper-portal:aruco-compat';

function removeExactly(source, statement) {
  if (source.split(statement).length !== 2) {
    throw new Error('The pinned js-aruco2 packaging changed. Review the compatibility adapter.');
  }
  return source.replace(statement, '');
}

/**
 * Adapt the upstream legacy module boundary to ESM without eval or changes to
 * its recognition algorithms. Both the editor and exported player use this.
 * The original sources and complete notices are retained in third_party/.
 */
export function arucoCompat() {
  return {
    name: 'paper-portal-aruco-compat',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'js-aruco2') return virtualId;
    },
    async load(id) {
      if (id !== virtualId) return;
      this.addWatchFile(arucoPath);
      this.addWatchFile(cvPath);
      const [rawCv, rawAruco] = await Promise.all([
        readFile(cvPath, 'utf8'),
        readFile(arucoPath, 'utf8'),
      ]);
      const cv = removeExactly(rawCv, 'this.CV = CV;');
      const aruco = removeExactly(
        removeExactly(rawAruco, "var CV = this.CV || require('./cv').CV;"),
        'this.AR = AR;',
      );
      return `${cv}\n${aruco}\nexport default { AR };\n`;
    },
  };
}
