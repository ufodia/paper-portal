import { describe, expect, it } from 'vitest';
import {
  exportGameHtml,
  printCardsHtml,
  PuzzleEngine,
  sampleProject,
  validateProject,
  type Detection,
  type Project,
  type Rule,
} from '../src/core';

const card = (id: number, x = id * 100, y = 100, angle = 0): Detection => ({
  id,
  x,
  y,
  angle,
  width: 60,
  height: 60,
});
function single(rule: Rule, holdMs = 200): Project {
  const p = sampleProject();
  p.holdMs = holdMs;
  p.stages = [{ ...p.stages[0]!, rule }];
  return p;
}
function driver(engine: PuzzleEngine) {
  let sequence = 0;
  return (at: number, detections: Detection[]) =>
    engine.update({ at, sequence: sequence++, detections });
}

describe('project validation', () => {
  it('copies supported data, dropping unknown executable fields', () => {
    const raw = { ...sampleProject(), runtimeScript: 'alert(1)' };
    const result = validateProject(raw);
    expect(result).not.toHaveProperty('runtimeScript');
    expect(result.cards).not.toBe(raw.cards);
  });
  it.each([
    (p: Project) => ({ ...p, cards: p.cards.slice(0, 2) }),
    (p: Project) => ({ ...p, cards: [...p.cards, p.cards[0]] }),
    (p: Project) => ({ ...p, cards: p.cards.map((c, i) => (i === 0 ? { ...c, id: 8 } : c)) }),
    (p: Project) => ({
      ...p,
      cards: p.cards.map((c, i) =>
        i === 0 ? { ...c, color: 'red; background:url(https://evil.test)' } : c,
      ),
    }),
    (p: Project) => ({ ...p, holdMs: 199 }),
    (p: Project) => ({ ...p, holdMs: 3001 }),
    (p: Project) => ({ ...p, holdMs: 650.5 }),
    (p: Project) => ({ ...p, stages: [{ ...p.stages[0], rule: { kind: 'visible', ids: [7] } }] }),
    (p: Project) => ({ ...p, stages: [{ ...p.stages[0], rule: { kind: 'order', ids: [0] } }] }),
    (p: Project) => ({
      ...p,
      stages: [{ ...p.stages[0], rule: { kind: 'visible', ids: [0, 0] } }],
    }),
    (p: Project) => ({
      ...p,
      stages: [{ ...p.stages[0], rule: { kind: 'hidden', target: 0, witness: 0 } }],
    }),
    (p: Project) => ({
      ...p,
      stages: [{ ...p.stages[0], rule: { kind: 'rotation', id: 0, quarterTurn: 45 } }],
    }),
    (p: Project) => ({ ...p, stages: [] }),
  ])('rejects an invalid schema variation', (change) =>
    expect(() => validateProject(change(sampleProject()))).toThrow(),
  );
});

describe('fresh-frame progression', () => {
  it('requires a continuous hold and advances at most one stage per frame', () => {
    const project = sampleProject();
    project.holdMs = 200;
    project.stages = [
      { ...project.stages[0]!, rule: { kind: 'visible', ids: [1] } },
      { ...project.stages[1]!, rule: { kind: 'visible', ids: [1] } },
    ];
    const engine = new PuzzleEngine(project);
    const feed = driver(engine);
    expect(feed(0, [card(1)]).holding).toBe(0);
    expect(feed(100, [card(1)]).holding).toBe(0.5);
    const solved = feed(200, [card(1)]);
    expect(solved).toMatchObject({
      stageIndex: 1,
      completed: false,
      scene: 'console',
      solvedStageTitle: project.stages[0]!.title,
    });
    expect(feed(300, [card(1)]).holding).toBe(0);
    expect(feed(400, [card(1)]).completed).toBe(false);
    expect(feed(500, [card(1)]).completed).toBe(true);
  });
  it('never advances from stopped, repeated or time-reversed frames', () => {
    const engine = new PuzzleEngine(single({ kind: 'visible', ids: [0] }));
    engine.update({ at: 0, sequence: 0, detections: [card(0)] });
    expect(engine.update({ at: 200, sequence: 0, detections: [card(0)] }).completed).toBe(false);
    expect(engine.update({ at: 100, sequence: 1, detections: [card(0)] }).holding).toBe(0);
    expect(engine.update({ at: 50, sequence: 2, detections: [card(0)] }).completed).toBe(false);
    expect(engine.getState().holding).toBe(0);
  });
  it('resets the current hold after a frame gap above 300 ms', () => {
    const engine = new PuzzleEngine(single({ kind: 'visible', ids: [0] }));
    const feed = driver(engine);
    feed(0, [card(0)]);
    feed(100, [card(0)]);
    expect(feed(401, [card(0)]).holding).toBe(0);
    expect(feed(501, [card(0)]).completed).toBe(false);
    expect(feed(601, [card(0)]).completed).toBe(true);
  });
  it('latches solved scenes and preserves solved stages across pause', () => {
    const project = sampleProject();
    project.holdMs = 200;
    const engine = new PuzzleEngine(project);
    const feed = driver(engine);
    feed(0, [card(1)]);
    feed(100, [card(1)]);
    feed(200, [card(1)]);
    expect(engine.pause()).toMatchObject({ stageIndex: 1, scene: 'console', holding: 0 });
    expect(engine.getState()).not.toHaveProperty('solvedStageTitle');
    expect(engine.restart()).toMatchObject({
      stageIndex: 0,
      scene: 'night',
      completed: false,
      holding: 0,
    });
  });
});

describe('physical rules', () => {
  it('handles circular rotations at 359/0 degrees and rejects the opposite angle', () => {
    const engine = new PuzzleEngine(single({ kind: 'rotation', id: 0, quarterTurn: 0 }));
    const feed = driver(engine);
    feed(0, [card(0, 0, 100, 359)]);
    feed(100, [card(0, 0, 100, 1)]);
    expect(feed(200, [card(0, 0, 100, 0)]).completed).toBe(true);
    const wrong = new PuzzleEngine(single({ kind: 'rotation', id: 0, quarterTurn: 0 }));
    const f = driver(wrong);
    f(0, [card(0, 0, 100, 180)]);
    expect(f(200, [card(0, 0, 100, 180)]).completed).toBe(false);
  });
  it('rejects overlapping or vertically scattered card orders', () => {
    for (const cards of [
      [card(0, 0), card(1, 10), card(2, 20)],
      [card(0, 0, 0), card(1, 100, 150), card(2, 200, 0)],
      [card(2, 0), card(1, 100), card(0, 200)],
    ]) {
      const engine = new PuzzleEngine(single({ kind: 'order', ids: [0, 1, 2] }));
      const feed = driver(engine);
      feed(0, cards);
      expect(feed(200, cards).completed).toBe(false);
    }
    const engine = new PuzzleEngine(single({ kind: 'order', ids: [0, 1, 2] }));
    const feed = driver(engine);
    feed(0, [card(0), card(1), card(2)]);
    expect(feed(200, [card(0), card(1), card(2)]).completed).toBe(true);
  });
  it('does not accept absence before the target is acquired during the current stage', () => {
    const engine = new PuzzleEngine(single({ kind: 'hidden', target: 1, witness: 0 }));
    const feed = driver(engine);
    for (let at = 0; at <= 2000; at += 100) expect(feed(at, [card(0)]).completed).toBe(false);
  });
  it('requires stable acquisition, 500 ms witnessed absence, and the authored hold', () => {
    const engine = new PuzzleEngine(single({ kind: 'hidden', target: 1, witness: 0 }));
    const feed = driver(engine);
    feed(0, [card(1)]);
    feed(100, [card(1)]);
    for (let at = 200; at < 900; at += 100) expect(feed(at, [card(0)]).completed).toBe(false);
    expect(feed(900, [card(0)]).completed).toBe(true);
  });
  it('empty, unknown and duplicate detections interrupt witnessed absence', () => {
    for (const ambiguous of [[], [card(7)], [card(0), card(0)]]) {
      const engine = new PuzzleEngine(single({ kind: 'hidden', target: 1, witness: 0 }));
      const feed = driver(engine);
      feed(0, [card(1)]);
      feed(100, [card(1)]);
      feed(200, [card(0)]);
      feed(300, [card(0)]);
      feed(400, ambiguous);
      for (let at = 500; at < 1200; at += 100) expect(feed(at, [card(0)]).completed).toBe(false);
      expect(feed(1200, [card(0)]).completed).toBe(true);
    }
  });
  it('requires fresh target history after a stage transition, pause or camera gap', () => {
    const project = sampleProject();
    project.holdMs = 200;
    project.stages = [
      { ...project.stages[0]!, rule: { kind: 'visible', ids: [1] } },
      { ...project.stages[2]! },
    ];
    const engine = new PuzzleEngine(project);
    const feed = driver(engine);
    feed(0, [card(1)]);
    feed(100, [card(1)]);
    feed(200, [card(1)]);
    for (let at = 300; at <= 1200; at += 100) expect(feed(at, [card(0)]).completed).toBe(false);
    feed(1300, [card(1)]);
    feed(1400, [card(1)]);
    engine.pause();
    for (let at = 1500; at <= 2500; at += 100) expect(feed(at, [card(0)]).completed).toBe(false);
    feed(2600, [card(1)]);
    feed(2700, [card(1)]);
    expect(feed(3101, [card(0)]).completed).toBe(false);
    for (let at = 3201; at <= 4201; at += 100) expect(feed(at, [card(0)]).completed).toBe(false);
  });
});

describe('safe portable exports', () => {
  it('escapes project data, card labels and closing script tags', () => {
    const project = sampleProject();
    project.name = '</script><img src=x onerror=alert(1)>';
    project.cards[0]!.label = '<script>x()</script>';
    const html = exportGameHtml(project, 'console.log("</script>");');
    expect(html).toContain('\\u003c/script>');
    expect(html).toContain('console.log("<\\/script>");');
    expect(html).not.toContain('<img src=x');
    const print = printCardsHtml(project);
    expect(print).toContain('&lt;script&gt;x()&lt;/script&gt;');
    expect(html).toContain('Damiano Falcioni');
    expect(html).toContain('Juan Mellado');
    expect(html).toContain('AForge.NET');
  });
  it('includes all authored cards and instructions without external resource URLs', () => {
    const html = printCardsHtml(sampleProject());
    expect(html.match(/class="card"/g)).toHaveLength(3);
    expect(html).toContain('@page{size:A4 portrait;margin:10mm}');
    expect(html).not.toMatch(/<(?:script|img|link)[^>]+(?:src|href)="https?:/);
    expect(() => exportGameHtml(sampleProject(), '')).toThrow(/bundle/);
  });
});
