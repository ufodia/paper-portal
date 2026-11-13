import arucoLicense from '../third_party/js-aruco2/LICENSE.txt?raw';
import { markerSvg } from './markers';

export interface Card {
  id: number;
  label: string;
  color: string;
}
export type Rule =
  | { kind: 'visible'; ids: number[] }
  | { kind: 'hidden'; target: number; witness: number }
  | { kind: 'order'; ids: number[] }
  | { kind: 'rotation'; id: number; quarterTurn: 0 | 90 | 180 | 270 };
export interface Stage {
  id: string;
  title: string;
  instruction: string;
  successText: string;
  rule: Rule;
  scene: 'night' | 'console' | 'gate' | 'portal';
}
export interface Project {
  version: 1;
  name: string;
  description: string;
  cards: Card[];
  stages: Stage[];
  holdMs: number;
}
export interface Detection {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
}
export interface Frame {
  at: number;
  sequence: number;
  detections: Detection[];
}
export interface EngineView {
  stageIndex: number;
  completed: boolean;
  holding: number;
  message: string;
  scene: Stage['scene'];
  solvedStageTitle?: string;
}

const SCENES = ['night', 'console', 'gate', 'portal'] as const;
const MAX_GAP_MS = 300;
const ACQUIRE_MS = 100;
const ABSENCE_MS = 500;
const ROTATION_TOLERANCE = 20;
const finite = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);
const object = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
const escapeHtml = (value: string): string =>
  value.replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!,
  );

function text(value: unknown, label: string, max: number, allowEmpty = false): string {
  if (
    typeof value !== 'string' ||
    value.length > max ||
    (!allowEmpty && !value.trim()) ||
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)
  )
    throw new Error(`${label} must contain ${allowEmpty ? '0' : '1'}–${max} readable characters.`);
  return value.trim();
}

/** Validate and copy authored data. Imported projects cannot supply executable code. */
export function validateProject(value: unknown): Project {
  if (!object(value) || value.version !== 1)
    throw new Error('Choose a Paper Portal version 1 project.');
  if (!Array.isArray(value.cards) || value.cards.length < 3 || value.cards.length > 8)
    throw new Error('A project needs 3–8 cards.');
  const ids = new Set<number>();
  const cards = value.cards.map((item: unknown): Card => {
    if (
      !object(item) ||
      !finite(item.id) ||
      !Number.isInteger(item.id) ||
      item.id < 0 ||
      item.id > 7 ||
      ids.has(item.id)
    )
      throw new Error('Card ids must be unique whole numbers from 0 to 7.');
    ids.add(item.id);
    if (typeof item.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(item.color))
      throw new Error('Card colors must be six-digit hexadecimal colors.');
    return {
      id: item.id,
      label: text(item.label, 'Card label', 32),
      color: item.color.toLowerCase(),
    };
  });
  const ref = (id: unknown): number => {
    if (!finite(id) || !Number.isInteger(id) || !ids.has(id))
      throw new Error('Every rule must reference a card in this project.');
    return id;
  };
  const list = (raw: unknown, minimum: number): number[] => {
    if (!Array.isArray(raw) || raw.length < minimum || raw.length > 8)
      throw new Error(`This rule needs ${minimum}–8 card references.`);
    const result = raw.map(ref);
    if (new Set(result).size !== result.length)
      throw new Error('A rule cannot repeat the same card.');
    return result;
  };
  if (!Array.isArray(value.stages) || value.stages.length < 1 || value.stages.length > 8)
    throw new Error('A project needs 1–8 stages.');
  const stageIds = new Set<string>();
  const stages = value.stages.map((item: unknown): Stage => {
    if (!object(item) || !object(item.rule)) throw new Error('Every stage needs a valid rule.');
    const id = text(item.id, 'Stage id', 48);
    if (!/^[a-zA-Z0-9_-]+$/.test(id) || stageIds.has(id))
      throw new Error('Stage ids must be unique letters, numbers, dashes or underscores.');
    stageIds.add(id);
    let rule: Rule;
    if (item.rule.kind === 'visible') rule = { kind: 'visible', ids: list(item.rule.ids, 1) };
    else if (item.rule.kind === 'order') rule = { kind: 'order', ids: list(item.rule.ids, 2) };
    else if (item.rule.kind === 'hidden') {
      const target = ref(item.rule.target);
      const witness = ref(item.rule.witness);
      if (target === witness)
        throw new Error('A hidden-card rule needs a different visible witness card.');
      rule = { kind: 'hidden', target, witness };
    } else if (item.rule.kind === 'rotation') {
      const id = ref(item.rule.id);
      const angle = item.rule.quarterTurn;
      if (![0, 90, 180, 270].includes(angle as number))
        throw new Error('Choose a clockwise rotation of 0, 90, 180 or 270 degrees.');
      rule = { kind: 'rotation', id, quarterTurn: angle as 0 | 90 | 180 | 270 };
    } else throw new Error('Choose a visible, hidden, order or rotation rule.');
    if (!SCENES.includes(item.scene as Stage['scene']))
      throw new Error('Choose a supported observatory scene.');
    return {
      id,
      title: text(item.title, 'Stage title', 80),
      instruction: text(item.instruction, 'Stage instruction', 500),
      successText: text(item.successText, 'Stage success text', 200),
      rule,
      scene: item.scene as Stage['scene'],
    };
  });
  if (
    !finite(value.holdMs) ||
    !Number.isInteger(value.holdMs) ||
    value.holdMs < 200 ||
    value.holdMs > 3000
  )
    throw new Error('Hold time must be a whole number from 200 to 3,000 milliseconds.');
  return {
    version: 1,
    name: text(value.name, 'Game name', 120),
    description: text(value.description, 'Game description', 800, true),
    cards,
    stages,
    holdMs: value.holdMs,
  };
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

/** Stateful progression uses fresh observations only, never wall-clock animation time. */
export class PuzzleEngine {
  readonly project: Project;
  private stageIndex = 0;
  private completed = false;
  private scene: Stage['scene'] = 'night';
  private message: string;
  private holding = 0;
  private holdStart: number | null = null;
  private lastAt = -Infinity;
  private lastSequence = -Infinity;
  private seenStart: number | null = null;
  private seenCount = 0;
  private targetAcquired = false;
  private absenceStart: number | null = null;

  constructor(project: Project) {
    this.project = validateProject(project);
    this.message = this.project.stages[0]!.instruction;
  }

  private resetPending(clearHistory = false): void {
    this.holdStart = null;
    this.holding = 0;
    this.absenceStart = null;
    this.seenStart = null;
    this.seenCount = 0;
    if (clearHistory) this.targetAcquired = false;
  }

  getState(): EngineView {
    return {
      stageIndex: this.stageIndex,
      completed: this.completed,
      holding: this.holding,
      message: this.message,
      scene: this.scene,
    };
  }

  pause(): EngineView {
    this.resetPending(true);
    this.lastAt = -Infinity;
    this.lastSequence = -Infinity;
    if (!this.completed)
      this.message = 'Paused. Show the current stage cards again when you resume.';
    return this.getState();
  }

  restart(): EngineView {
    this.stageIndex = 0;
    this.completed = false;
    this.scene = 'night';
    this.message = this.project.stages[0]!.instruction;
    this.resetPending(true);
    this.lastAt = -Infinity;
    this.lastSequence = -Infinity;
    return this.getState();
  }

  update(frame: Frame): EngineView {
    if (this.completed) return this.getState();
    if (
      !frame ||
      !finite(frame.at) ||
      frame.at < 0 ||
      !finite(frame.sequence) ||
      !Number.isInteger(frame.sequence) ||
      frame.sequence < 0 ||
      frame.at <= this.lastAt ||
      frame.sequence <= this.lastSequence
    ) {
      this.resetPending(true);
      this.message = 'Waiting for a new camera frame. Frozen or repeated frames do not count.';
      return this.getState();
    }
    if (frame.at - this.lastAt > MAX_GAP_MS) this.resetPending(true);
    this.lastAt = frame.at;
    this.lastSequence = frame.sequence;
    const validIds = new Set(this.project.cards.map((card) => card.id));
    if (
      !Array.isArray(frame.detections) ||
      frame.detections.length > 8 ||
      frame.detections.some(
        (d) =>
          !d ||
          !Number.isInteger(d.id) ||
          !validIds.has(d.id) ||
          ![d.x, d.y, d.width, d.height, d.angle].every(finite) ||
          d.width <= 0 ||
          d.height <= 0,
      ) ||
      new Set(frame.detections.map((d) => d.id)).size !== frame.detections.length
    ) {
      this.resetPending();
      this.message =
        'Keep only one copy of each project card in view. Unknown or ambiguous markers do not count.';
      return this.getState();
    }
    const detections = new Map(frame.detections.map((d) => [d.id, d]));
    const stage = this.project.stages[this.stageIndex]!;
    const rule = stage.rule;
    let satisfied = false;
    this.message = stage.instruction;
    if (rule.kind === 'visible') satisfied = rule.ids.every((id) => detections.has(id));
    else if (rule.kind === 'rotation') {
      const card = detections.get(rule.id);
      if (card)
        satisfied =
          Math.abs(((((card.angle - rule.quarterTurn + 540) % 360) + 360) % 360) - 180) <=
          ROTATION_TOLERANCE;
    } else if (rule.kind === 'order') {
      const cards = rule.ids.map((id) => detections.get(id));
      if (cards.every((card): card is Detection => !!card)) {
        const minimumSeparation = median(cards.map((card) => card.width)) * 0.4;
        const rowSpread =
          Math.max(...cards.map((card) => card.y)) - Math.min(...cards.map((card) => card.y));
        satisfied =
          rowSpread <= median(cards.map((card) => card.height)) &&
          cards.every(
            (card, index) => index === 0 || card.x - cards[index - 1]!.x >= minimumSeparation,
          );
      }
    } else {
      const targetPresent = detections.has(rule.target);
      if (targetPresent) {
        this.absenceStart = null;
        this.holdStart = null;
        this.holding = 0;
        if (!this.targetAcquired) {
          if (this.seenStart === null) this.seenStart = frame.at;
          this.seenCount++;
          if (this.seenCount >= 2 && frame.at - this.seenStart >= ACQUIRE_MS)
            this.targetAcquired = true;
        }
        this.message = this.targetAcquired
          ? 'Card recognized. Hide the target while keeping its witness continuously visible.'
          : 'First hold the target card visibly for a moment.';
      } else if (!this.targetAcquired) {
        this.seenStart = null;
        this.seenCount = 0;
        this.message =
          'First show the target card during this stage; absence alone cannot unlock it.';
      } else if (detections.size > 0 && detections.has(rule.witness)) {
        if (this.absenceStart === null) this.absenceStart = frame.at;
        satisfied = frame.at - this.absenceStart >= ABSENCE_MS;
        this.message = satisfied
          ? 'Target hidden. Keep the witness steady to finish.'
          : 'Confirming the hidden card. Keep the witness visible.';
      } else {
        this.absenceStart = null;
        this.message = 'The witness must stay visible. An empty camera view does not count.';
      }
    }
    if (!satisfied) {
      this.holdStart = null;
      this.holding = 0;
      return this.getState();
    }
    if (this.holdStart === null) this.holdStart = frame.at;
    this.holding = Math.min(1, Math.max(0, (frame.at - this.holdStart) / this.project.holdMs));
    if (this.holding < 1) return this.getState();
    this.scene = stage.scene;
    this.message = stage.successText;
    if (this.stageIndex === this.project.stages.length - 1) this.completed = true;
    else this.stageIndex++;
    this.resetPending(true);
    return { ...this.getState(), solvedStageTitle: stage.title };
  }
}

export function sampleProject(): Project {
  return {
    version: 1,
    name: 'The midnight observatory',
    description:
      'Wake the console, align the sky keys, and open a small impossible door. Three paper cards are all you need.',
    holdMs: 650,
    cards: [
      { id: 0, label: 'Sun', color: '#f2cb75' },
      { id: 1, label: 'Key', color: '#bfa7f4' },
      { id: 2, label: 'Moon', color: '#8fd0da' },
    ],
    stages: [
      {
        id: 'power',
        title: 'Wake the console',
        instruction: 'Show the Key card and hold it steady.',
        successText: 'The observatory is listening. The console is awake.',
        scene: 'console',
        rule: { kind: 'visible', ids: [1] },
      },
      {
        id: 'align',
        title: 'Align the sky keys',
        instruction: 'Arrange Sun, Key, Moon from left to right in one row, as seen by the camera.',
        successText: 'The sky keys align. The gate is unlocked.',
        scene: 'gate',
        rule: { kind: 'order', ids: [0, 1, 2] },
      },
      {
        id: 'open',
        title: 'Make the key disappear',
        instruction:
          'First show Key and Sun in this stage. Then hide Key while keeping Sun continuously visible.',
        successText: 'A small impossible door is open. You made paper move a world.',
        scene: 'portal',
        rule: { kind: 'hidden', target: 1, witness: 0 },
      },
    ],
  };
}

export function printCardsHtml(input: Project): string {
  const project = validateProject(input);
  const pages: string[] = [];
  for (let index = 0; index < project.cards.length; index += 6) {
    pages.push(
      `<section class="sheet"><header>${escapeHtml(project.name)} · Paper Portal cards · keep white borders clear</header><div class="cards">${project.cards
        .slice(index, index + 6)
        .map(
          (card) =>
            `<article class="card"><div class="card-top"><span style="background:${card.color}"></span><strong>${escapeHtml(card.label)}</strong><small>${card.id}</small></div><div class="marker">${markerSvg(card.id)}</div><p>↑ upright · ARUCO ${card.id}</p></article>`,
        )
        .join(
          '',
        )}</div><footer>Paper Portal · ufodia · Cut around the outer card border, never through the marker’s white quiet zone.</footer></section>`,
    );
  }
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(project.name)} — printable cards</title><style>@page{size:A4 portrait;margin:10mm}*{box-sizing:border-box}body{margin:0;background:#e7e7ed;color:#1d1c2d;font-family:system-ui,sans-serif}.controls,.licenses{max-width:900px;padding:25px;margin:25px auto;background:white;border-radius:12px;line-height:1.5}button{background:#493477;color:white;border:0;padding:12px 20px;border-radius:8px;font:inherit;cursor:pointer}.sheet{width:190mm;min-height:277mm;margin:16px auto;background:white;break-after:page;page-break-after:always}.sheet:last-of-type{break-after:auto;page-break-after:auto}header{height:10mm;font-size:2.8mm;line-height:8mm;white-space:nowrap;overflow:hidden}.cards{display:grid;grid-template-columns:90mm 90mm;gap:5mm}.card{width:90mm;height:80mm;border:0.3mm dashed #a4a2b2;padding:4mm;break-inside:avoid}.card-top{display:flex;align-items:center;gap:3mm;font-size:4mm}.card-top span{width:3mm;height:3mm;border-radius:50%}.card-top small{margin-left:auto;color:#6c657c;font-size:3mm}.marker{width:55mm;height:55mm;margin:auto}.marker svg{display:block;width:100%;height:100%}.card p{text-align:center;margin:0;font-size:2.7mm}footer{font-size:2.4mm;margin-top:5mm}.licenses pre{white-space:pre-wrap;font:11px monospace}@media print{body{background:white}.controls,.licenses{display:none}.sheet{margin:0}}</style></head><body><div class="controls"><h1>Paper cards, real controls.</h1><p>Print on A4 portrait at 100% / Actual size. Use matte white paper, keep the black squares sharp and leave the white borders intact. Print one copy of each card; duplicate ids are ambiguous.</p><button type="button" onclick="window.print()">Print cards</button></div>${pages.join('')}<section class="licenses"><h2>Third-party notices</h2><p>Marker generation and detection: js-aruco2 2.0.0. Complete upstream notices are retained below.</p><pre>${escapeHtml(arucoLicense)}</pre></section></body></html>`;
}

export function exportGameHtml(input: Project, runtimeScript: string): string {
  const project = validateProject(input);
  if (
    typeof runtimeScript !== 'string' ||
    runtimeScript.trim().length < 10 ||
    runtimeScript.length > 4 * 1024 * 1024
  )
    throw new Error(
      'The standalone player bundle is unavailable. Run the project build and try again.',
    );
  const data = JSON.stringify(project)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
  const runtime = runtimeScript.replace(/<\/script/gi, '<\\/script');
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="referrer" content="no-referrer"><title>${escapeHtml(project.name)} — Paper Portal</title></head><body><main id="paper-player"><noscript>This local game needs JavaScript. No camera is requested until you choose Start camera.</noscript></main><script id="paper-project" type="application/json">${data}</script><script>${runtime}</script><details id="paper-licenses" style="max-width:1100px;margin:20px auto;padding:18px;color:#b6aec8;font:12px system-ui,sans-serif"><summary>Paper Portal · ufodia · Third-party notices</summary><p>Includes js-aruco2 2.0.0. The complete upstream notice follows.</p><pre style="white-space:pre-wrap">${escapeHtml(arucoLicense)}</pre></details></body></html>`;
}
