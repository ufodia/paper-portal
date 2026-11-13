import './style.css';
import runtimeScript from '../.generated/player.js?raw';
import { sampleProject, validateProject, printCardsHtml, exportGameHtml } from './core';
import { markerSvg } from './markers';

type Project = ReturnType<typeof sampleProject>;
type Stage = Project['stages'][number];
type Card = Project['cards'][number];
type Rule = Stage['rule'];
type Scene = Stage['scene'];

const root = document.querySelector<HTMLDivElement>('#app');
if (!root) throw new Error('Paper Portal application root is missing.');
let project: Project = sampleProject();
let selectedStageId = project.stages[0]!.id;
let status = 'The Observatory is ready to explore. Edit the story, print the cards, then play.';
let statusKind: 'info' | 'success' | 'error' = 'info';
let unsaved = false;
let playerHtml: string | null = null;
const palette = [
  '#7158b7',
  '#d99358',
  '#5a8a8b',
  '#a36c94',
  '#6479ae',
  '#95824d',
  '#9f6f5d',
  '#76945a',
];

function h(value: unknown): string {
  return String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!,
  );
}
function icon(name: string): string {
  const paths: Record<string, string> = {
    plus: '<path d="M12 4v16M4 12h16"/>',
    upload: '<path d="M12 16V3m-5 5 5-5 5 5M4 17v4h16v-4"/>',
    save: '<path d="M5 3h12l4 4v14H3V3h2Zm2 0v6h10V3M7 21v-8h10v8"/>',
    print: '<path d="M7 8V3h10v5M7 17H3V8h18v9h-4M7 14h10v7H7v-7Zm10-3h.01"/>',
    play: '<path d="m8 4 12 8-12 8V4Z"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    up: '<path d="m6 15 6-6 6 6"/>',
    down: '<path d="m6 9 6 6 6-6"/>',
    coffee:
      '<path d="M4 7h13v8a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V7Zm13 1h2a3 3 0 0 1 0 6h-2M7 2v2m4-2v2m4-2v2"/>',
    sparkle:
      '<path d="m12 3 2 7 7 2-7 2-2 7-2-7-7-2 7-2 2-7Zm7-1 1 3 3 1-3 1-1 3-1-3-3-1 3-1 1-3Z"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    cards: '<rect x="7" y="3" width="14" height="17" rx="2"/><path d="m7 7-4 1v14l14-2"/>',
    reset: '<path d="M3 9a9 9 0 1 1 0 7M3 3v6h6"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  };
  return `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
}
function selectedStage(): Stage {
  return project.stages.find((stage) => stage.id === selectedStageId) || project.stages[0]!;
}
function tell(message: string, kind: typeof statusKind = 'info'): void {
  status = message;
  statusKind = kind;
}
function cardLabel(id: number): string {
  return project.cards.find((card) => card.id === id)?.label || `Card ${id}`;
}
function slug(): string {
  return (
    project.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'paper-portal'
  );
}
function save(content: string, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function changed(
  message = 'Story updated. Your changes stay in this tab until you save or download.',
): void {
  playerHtml = null;
  unsaved = true;
  tell(message);
}
function validate(value: Project): Project {
  return validateProject(value);
}
function ruleDescription(rule: Rule): string {
  if (rule.kind === 'visible') return `Show ${rule.ids.map(cardLabel).join(' + ')} together.`;
  if (rule.kind === 'hidden')
    return `Hide ${cardLabel(rule.target)} while ${cardLabel(rule.witness)} stays visible.`;
  if (rule.kind === 'order')
    return `Arrange ${rule.ids.map(cardLabel).join(' → ')} from left to right in the camera view.`;
  return `Turn ${cardLabel(rule.id)} ${rule.quarterTurn}° clockwise from its printed upright position.`;
}
function sceneArt(scene: Scene): string {
  const stars = [
    [58, 47],
    [111, 91],
    [177, 38],
    [228, 79],
    [314, 42],
    [383, 97],
    [433, 39],
    [507, 77],
    [550, 137],
    [47, 168],
    [89, 238],
    [472, 232],
    [532, 274],
    [181, 268],
    [356, 259],
  ];
  const starMarks = stars
    .map(
      ([x, y], i) =>
        `<g transform="translate(${x} ${y})" fill="${i % 3 === 0 ? '#e9c895' : '#a998d5'}"><circle r="${i % 3 === 0 ? 1.8 : 1}"/>${i % 3 === 0 ? '<path d="M-5 0H5M0-5V5" fill="none" stroke="currentColor" stroke-width=".7" color="#d5c5ed"/>' : ''}</g>`,
    )
    .join('');
  const common = `<defs><radialGradient id="night-glow"><stop stop-color="#8472c4" stop-opacity=".4"/><stop offset="1" stop-color="#30234e" stop-opacity="0"/></radialGradient><linearGradient id="portal-light" x1="0" x2="0" y1="0" y2="1"><stop stop-color="#c2a9ef"/><stop offset="1" stop-color="#655198"/></linearGradient><pattern id="scene-grid" width="27" height="27" patternUnits="userSpaceOnUse"><path d="M27 0H0V27" stroke="#b09cd20e" fill="none" stroke-width=".7"/></pattern></defs><rect width="600" height="325" fill="#25203b"/><rect width="600" height="325" fill="url(#scene-grid)"/><ellipse cx="300" cy="153" rx="250" ry="175" fill="url(#night-glow)"/>${starMarks}`;
  const art: Record<Scene, string> = {
    night: `<circle cx="300" cy="152" r="107" fill="none" stroke="#ad96d4" stroke-opacity=".3"/><circle cx="300" cy="152" r="91" fill="none" stroke="#ad96d4" stroke-opacity=".17" stroke-dasharray="2 7"/><path d="M193 152h214M300 45v214" stroke="#ad96d4" stroke-opacity=".18"/><g transform="rotate(-25 300 152)"><ellipse cx="300" cy="152" rx="127" ry="29" fill="none" stroke="#cfb8e8" stroke-width="2"/><circle cx="300" cy="152" r="62" fill="#7962a4" stroke="#d8bde8" stroke-width="1.2"/><path d="M245 135q55-25 110-5M240 157q60-24 120-6M247 180q54-21 107-7" fill="none" stroke="#b394cf" stroke-width="5" opacity=".46"/><path d="M173 152c0 16 57 29 127 29s127-13 127-29" fill="none" stroke="#e7d1ee" stroke-width="2"/></g><circle cx="403" cy="87" r="8" fill="#d9c0e6"/><path d="M192 274h216" stroke="#a797c1" stroke-opacity=".3"/><text x="300" y="299" fill="#b6a6cb" text-anchor="middle" font-size="9" letter-spacing="3" font-family="monospace">THE OBSERVATORY</text>`,
    console: `<path d="M158 73h284v177H158z" fill="#342c4b" stroke="#ab98ce" stroke-width="1.3"/><rect x="170" y="85" width="260" height="122" rx="4" fill="#171e2b" stroke="#655c81"/><path d="m191 106 10 9-10 9m21 0h29M191 148h104m-104 14h166m-166 14h137" fill="none" stroke="#99c3b5" stroke-width="2"/><circle cx="189" cy="229" r="5" fill="#cbb18c"/><circle cx="209" cy="229" r="5" fill="#8870ad"/><path d="M325 229h83" stroke="#8c79ac" stroke-width="3"/><path d="M147 251h306l18 17H129l18-17Z" fill="#53416e" stroke="#a08cc0"/><text x="300" y="299" fill="#b6a6cb" text-anchor="middle" font-size="9" letter-spacing="3" font-family="monospace">SIGNAL CONSOLE</text>`,
    gate: `<path d="M184 263V132a116 116 0 0 1 232 0v131" fill="#3b2e56" stroke="#b49cd4" stroke-width="1.5"/><path d="M205 263V133a95 95 0 0 1 190 0v130" fill="#1d1830" stroke="#75618e"/><path d="M300 38v223M222 81l156 156M378 81 222 237" stroke="#75618e" stroke-width="1"/><circle cx="300" cy="157" r="34" fill="#44335e" stroke="#c6a5d7"/><path d="m300 135 5 16 17 6-17 5-5 17-5-17-17-5 17-6 5-16Z" fill="#dfc091"/><path d="M166 263h268M153 276h294" stroke="#ad96cc" stroke-width="2"/><text x="300" y="305" fill="#b6a6cb" text-anchor="middle" font-size="9" letter-spacing="3" font-family="monospace">THE SEALED GATE</text>`,
    portal: `<ellipse cx="300" cy="281" rx="131" ry="15" fill="#161424" opacity=".5"/><ellipse cx="300" cy="147" rx="91" ry="126" fill="#3b2c57" stroke="#b699d6" stroke-width="2"/><ellipse cx="300" cy="147" rx="76" ry="110" fill="url(#portal-light)"/><ellipse cx="300" cy="147" rx="63" ry="96" fill="none" stroke="#ddd0ef" stroke-opacity=".65"/><path d="M257 88c82 20-63 77 35 109s-3 42-5 37M328 55c-56 72 43 65-1 136s-27 58-27 58" fill="none" stroke="#ead8f3" stroke-width="1.5" opacity=".7"/><circle cx="249" cy="125" r="3" fill="#f1d3a0"/><circle cx="336" cy="196" r="2" fill="#f1d3a0"/><path d="M188 281h224" stroke="#9680b8"/><text x="300" y="310" fill="#b6a6cb" text-anchor="middle" font-size="9" letter-spacing="3" font-family="monospace">THE OTHER SIDE</text>`,
  };
  return `<svg class="scene-art" viewBox="0 0 600 325" role="img" aria-label="Illustrated ${h(scene)} scene preview">${common}${art[scene]}</svg>`;
}

function cardOptions(selected: number, excluded?: number): string {
  return project.cards
    .filter((card) => card.id !== excluded)
    .map(
      (card) =>
        `<option value="${card.id}" ${card.id === selected ? 'selected' : ''}>${h(card.label)} · ${card.id}</option>`,
    )
    .join('');
}
function ruleEditor(rule: Rule): string {
  if (rule.kind === 'visible' || rule.kind === 'order') {
    return `<fieldset class="rule-cards"><legend>${rule.kind === 'visible' ? 'Cards to show together' : 'Cards in the sequence'}</legend>${project.cards.map((card) => `<label><input type="checkbox" data-rule-card="${card.id}" ${rule.ids.includes(card.id) ? 'checked' : ''}><span class="small-card-color" style="--card-color:${h(card.color)}"></span><span>${h(card.label)}</span><small>${card.id}</small></label>`).join('')}</fieldset>${rule.kind === 'order' ? `<div class="sequence-editor"><span class="field-label">LEFT → RIGHT</span>${rule.ids.map((id, index) => `<div class="sequence-row"><span>${index + 1}</span><strong>${h(cardLabel(id))}</strong><button class="icon-button" data-action="sequence-up" data-index="${index}" aria-label="Move ${h(cardLabel(id))} earlier" ${index === 0 ? 'disabled' : ''}>${icon('up')}</button><button class="icon-button" data-action="sequence-down" data-index="${index}" aria-label="Move ${h(cardLabel(id))} later" ${index === rule.ids.length - 1 ? 'disabled' : ''}>${icon('down')}</button></div>`).join('')}</div>` : ''}`;
  }
  if (rule.kind === 'hidden')
    return `<div class="stacked-fields"><label>Card to hide<select data-rule-field="target" aria-label="Hidden target card">${cardOptions(rule.target, rule.witness)}</select></label><label>Card that must stay visible<select data-rule-field="witness" aria-label="Witness card">${cardOptions(rule.witness, rule.target)}</select></label></div><p class="field-hint">The witness anchors the puzzle. Cover or turn away the target while keeping the witness in view.</p>`;
  return `<div class="stacked-fields"><label>Card to rotate<select data-rule-field="rotation-id" aria-label="Rotated card">${cardOptions(rule.id)}</select></label><label>Required angle<select data-rule-field="quarter-turn" aria-label="Required card rotation">${[0, 90, 180, 270].map((angle) => `<option value="${angle}" ${rule.quarterTurn === angle ? 'selected' : ''}>${angle}°${angle === 0 ? ' · upright' : ''}</option>`).join('')}</select></label></div><p class="field-hint">Use the printed card’s upright direction as the reference. Quarter turns are clockwise as the camera sees the printed card.</p>`;
}

function render(): void {
  const stage = selectedStage();
  const index = project.stages.indexOf(stage);
  root!.innerHTML = `<header class="site-header"><a class="brand" href="./" aria-label="Paper Portal home"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span>paper<span>portal</span><sup>↗</sup></span></a><span class="header-caption">STORIES YOU CAN TOUCH.</span><nav class="header-actions" aria-label="Project actions"><button class="button quiet" data-action="sample">Load sample</button><button class="button quiet" data-action="open">${icon('upload')} Open project</button><button class="button outline" data-action="save">${icon('save')} Save project</button><a class="support-button" href="https://buymeacoffee.com/ufodia" target="_blank" rel="noopener noreferrer" aria-label="Support ufodia on Buy Me a Coffee">${icon('coffee')}<span>Fuel the magic</span></a></nav></header>
  <main><section class="intro"><div><p class="eyebrow"><span class="tiny-star">✦</span> THE PHYSICAL PUZZLE STUDIO</p><h1>Make the table<br><span>part of the story.</span></h1><p>Build a puzzle from paper cards, a camera and a little imagination.</p></div><div class="intro-note"><span>01 / CREATE</span><span>02 / PRINT</span><span>03 / PLAY</span><p>Small pieces of paper.<br>A whole other world.</p></div></section>
  <section class="project-strip" aria-label="Project settings"><div class="project-name"><label for="project-name">YOUR STORY</label><input id="project-name" data-project-field="name" value="${h(project.name)}" maxlength="120" aria-label="Project name"></div><div class="project-description"><label for="project-description">THE SETUP</label><input id="project-description" data-project-field="description" value="${h(project.description)}" maxlength="800" aria-label="Project description"></div><div class="hold-setting"><label for="hold-ms">HOLD TO CONFIRM</label><div><input id="hold-ms" data-project-field="holdMs" type="number" min="200" max="3000" step="50" value="${project.holdMs}" aria-label="Hold duration in milliseconds"><span>ms</span></div></div></section>
  <div class="status-note ${statusKind}" role="status" aria-live="polite"><i></i><span>${h(status)}</span><span class="local-pill">LOCAL FILES · NO ACCOUNTS</span></div>
  <div class="studio-layout"><aside class="story-panel panel"><div class="panel-heading"><div><p class="eyebrow">01 / THE JOURNEY</p><h2>Story beats</h2></div><span class="count-pill">${project.stages.length} / 8</span></div><p class="panel-description">Each beat unlocks the next.</p><ol class="stage-list">${project.stages.map((item, itemIndex) => `<li class="stage-item ${item.id === stage.id ? 'selected' : ''}"><button class="stage-select" data-action="select-stage" data-id="${h(item.id)}" aria-label="Edit stage ${itemIndex + 1}: ${h(item.title)}" aria-current="${item.id === stage.id ? 'step' : 'false'}"><span class="stage-number">${String(itemIndex + 1).padStart(2, '0')}</span><span><strong>${h(item.title)}</strong><small>${h(item.rule.kind)} · ${h(item.scene)}</small></span><span class="stage-dot"></span></button><div class="stage-row-actions"><button class="icon-button" data-action="stage-up" data-id="${h(item.id)}" aria-label="Move stage ${itemIndex + 1} up" ${itemIndex === 0 ? 'disabled' : ''}>${icon('up')}</button><button class="icon-button" data-action="stage-down" data-id="${h(item.id)}" aria-label="Move stage ${itemIndex + 1} down" ${itemIndex === project.stages.length - 1 ? 'disabled' : ''}>${icon('down')}</button><button class="icon-button remove-button" data-action="remove-stage" data-id="${h(item.id)}" aria-label="Remove stage ${itemIndex + 1}" ${project.stages.length === 1 ? 'disabled' : ''}>${icon('close')}</button></div></li>`).join('')}</ol><button class="add-button" data-action="add-stage" ${project.stages.length >= 8 ? 'disabled' : ''}>${icon('plus')} Add a story beat</button><div class="journey-footnote">${icon('cards')}<p>Players solve one beat at a time. Keep the first one simple.</p></div></aside>
  <section class="preview-panel panel" aria-label="Scene preview"><div class="preview-heading"><span class="eyebrow">02 / THE WORLD</span><span class="preview-badge">${icon('eye')} EDITOR PREVIEW</span></div><div class="preview-story" data-testid="stage-preview"><div class="story-copy"><span class="chapter-label">CHAPTER ${String(index + 1).padStart(2, '0')} / ${String(project.stages.length).padStart(2, '0')}</span><h2>${h(stage.title)}</h2><p>${h(stage.instruction)}</p></div>${sceneArt(stage.scene)}<div class="scene-floor"><span class="scene-floor-dot"></span><span>A little paper can open a very big door.</span><span class="scene-floor-dot"></span></div></div><div class="rule-preview"><span class="rule-symbol">${icon('sparkle')}</span><div><span class="field-label">THE UNLOCK</span><p>${h(ruleDescription(stage.rule))}</p><span class="rule-hold">Hold the condition for ${(project.holdMs / 1000).toFixed(1)} seconds.</span></div></div><div class="success-preview"><span>THEN</span><p>“${h(stage.successText)}”</p></div><div class="play-actions"><button class="button primary" data-action="play">${icon('play')} Play puzzle</button><button class="button outline" data-action="download">${icon('download')} Download game</button></div><p class="preview-footnote">This illustration previews the scene. Open the player to use its camera and practice controls.</p></section>
  <section class="inspector-panel panel" aria-label="Selected stage settings"><div class="panel-heading"><div><p class="eyebrow">03 / THE RULES</p><h2>Shape the moment</h2></div><span class="selected-index">${String(index + 1).padStart(2, '0')}</span></div><div class="stacked-fields"><label>Stage title<input aria-label="Stage title" data-stage-field="title" value="${h(stage.title)}" maxlength="80"></label><label>Player instruction<textarea aria-label="Player instruction" data-stage-field="instruction" maxlength="500" rows="3">${h(stage.instruction)}</textarea></label><label>Success message<textarea aria-label="Success message" data-stage-field="successText" maxlength="200" rows="2">${h(stage.successText)}</textarea></label><label>Scene<select aria-label="Scene" data-stage-field="scene">${(['night', 'console', 'gate', 'portal'] as Scene[]).map((scene) => `<option value="${scene}" ${scene === stage.scene ? 'selected' : ''}>${scene === 'night' ? 'Night observatory' : scene === 'console' ? 'Signal console' : scene === 'gate' ? 'Sealed gate' : 'Open portal'}</option>`).join('')}</select></label></div><div class="rule-section"><label class="rule-type-label">Unlock condition<select aria-label="Unlock condition" id="rule-kind"><option value="visible" ${stage.rule.kind === 'visible' ? 'selected' : ''}>Show cards together</option><option value="hidden" ${stage.rule.kind === 'hidden' ? 'selected' : ''}>Hide one, keep a witness</option><option value="order" ${stage.rule.kind === 'order' ? 'selected' : ''}>Arrange left to right</option><option value="rotation" ${stage.rule.kind === 'rotation' ? 'selected' : ''}>Rotate a card</option></select></label>${ruleEditor(stage.rule)}</div></section></div>
  <section class="deck-panel panel"><div class="deck-header"><div><p class="eyebrow">04 / SOMETHING TO HOLD</p><h2>Your paper keys</h2><p>These are real ArUco markers. Print them clearly and keep their borders intact.</p></div><div><button class="button quiet" data-action="add-card" ${project.cards.length >= 8 ? 'disabled' : ''}>${icon('plus')} Add card</button><button class="button outline" data-action="print">${icon('print')} Print cards</button></div></div><div class="card-deck" data-testid="card-deck">${project.cards.map((card, cardIndex) => `<article class="paper-card" style="--card-color:${h(card.color)}"><div class="card-top"><label class="card-color" title="Card color"><input type="color" aria-label="Card ${card.id} color" data-card-id="${card.id}" data-card-field="color" value="${h(card.color)}"></label><span>CARD ${String(card.id).padStart(2, '0')}</span><button class="icon-button remove-button" data-action="remove-card" data-id="${card.id}" aria-label="Remove card ${h(card.label)}" ${project.cards.length <= 3 ? 'disabled' : ''}>${icon('close')}</button></div><div class="printed-marker" aria-label="ArUco marker ${card.id}">${markerSvg(card.id)}</div><label class="sr-only" for="card-label-${card.id}">Card ${card.id} label</label><input id="card-label-${card.id}" aria-label="Card ${card.id} label" data-card-id="${card.id}" data-card-field="label" value="${h(card.label)}" maxlength="32"><div class="card-bottom"><span>↑ THIS WAY UP</span><span>KEY ${String(cardIndex + 1).padStart(2, '0')}</span></div></article>`).join('')}</div><div class="deck-notes"><span>${icon('print')} Start with the print sheet’s size guide.</span><span>${icon('eye')} Bright, even light helps the camera see the cards.</span><span>${icon('cards')} ${project.cards.length} of 8 unique paper keys</span></div></section>
  <footer class="site-footer"><span><i>✦</i> Imagination, with something to hold.</span><span>MIT © ufodia <a href="https://github.com/ufodia/paper-portal" target="_blank" rel="noopener noreferrer">View source ↗</a></span></footer></main>
  <input id="project-file" type="file" accept="application/json,.json" aria-label="Import project" hidden><dialog id="player-dialog" aria-labelledby="player-dialog-title"><div class="player-dialog-header"><div><span class="eyebrow">LIVE PLAYER</span><h2 id="player-dialog-title">${h(project.name)}</h2></div><button class="button outline" data-action="close-player">${icon('close')} Close player</button></div>${playerHtml ? '<iframe id="puzzle-player" data-testid="player-frame" title="Paper Portal puzzle player" allow="camera; autoplay" sandbox="allow-scripts allow-same-origin"></iframe>' : ''}</dialog>`;
  bindEvents();
  if (playerHtml) {
    const frame = document.getElementById('puzzle-player') as HTMLIFrameElement;
    frame.srcdoc = playerHtml;
    (document.getElementById('player-dialog') as HTMLDialogElement).showModal();
  }
}

function replaceStage(stage: Stage): void {
  const next = {
    ...project,
    stages: project.stages.map((item) => (item.id === stage.id ? stage : item)),
  };
  project = validate(next);
  changed();
}
function replaceRule(rule: Rule): void {
  replaceStage({ ...selectedStage(), rule });
}
function repairRulesAfterRemovingCard(id: number): void {
  const ids = project.cards.map((card) => card.id);
  project.stages = project.stages.map((stage) => {
    const rule = stage.rule;
    if (rule.kind === 'visible')
      return {
        ...stage,
        rule: {
          kind: 'visible',
          ids: rule.ids.filter((item) => item !== id).length
            ? rule.ids.filter((item) => item !== id)
            : [ids[0]!],
        },
      };
    if (rule.kind === 'order') {
      const remaining = rule.ids.filter((item) => item !== id);
      return {
        ...stage,
        rule: { kind: 'order', ids: remaining.length >= 2 ? remaining : ids.slice(0, 2) },
      };
    }
    if (rule.kind === 'hidden') {
      const target = rule.target === id ? ids.find((item) => item !== rule.witness)! : rule.target;
      const witness = rule.witness === id ? ids.find((item) => item !== target)! : rule.witness;
      return { ...stage, rule: { kind: 'hidden', target, witness } };
    }
    return {
      ...stage,
      rule: {
        kind: 'rotation',
        id: rule.id === id ? ids[0]! : rule.id,
        quarterTurn: rule.quarterTurn,
      },
    };
  });
}
function closePlayer(): void {
  playerHtml = null;
  const iframe = document.getElementById('puzzle-player') as HTMLIFrameElement | null;
  if (iframe) {
    iframe.srcdoc = '';
    iframe.remove();
  }
  const dialog = document.getElementById('player-dialog') as HTMLDialogElement | null;
  if (dialog?.open) dialog.close();
  tell('Player closed. Your story is ready for another edit.');
  render();
}
function bindEvents(): void {
  root!.onclick = (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>('button[data-action]');
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    try {
      if (action === 'close-player') {
        closePlayer();
        return;
      }
      if (action === 'sample') {
        if (
          unsaved &&
          !window.confirm(
            'Replace this unsaved story with the sample? Save a project file first to keep your changes.',
          )
        )
          return;
        project = sampleProject();
        selectedStageId = project.stages[0]!.id;
        unsaved = false;
        playerHtml = null;
        tell('The Observatory sample is loaded. Print its cards or open the player.', 'success');
      }
      if (action === 'open') {
        document.getElementById('project-file')!.click();
        return;
      }
      if (action === 'save') {
        const checked = validate(project);
        save(JSON.stringify(checked, null, 2), `${slug()}.paper-portal.json`, 'application/json');
        unsaved = false;
        tell('Project saved. Keep this JSON file to continue editing your story.', 'success');
      }
      if (action === 'select-stage') {
        selectedStageId = button.dataset.id!;
        playerHtml = null;
      }
      if (action === 'add-stage') {
        if (project.stages.length >= 8) throw new Error('A story can contain up to eight beats.');
        const stage: Stage = {
          id: `stage-${crypto.randomUUID()}`,
          title: `A new discovery`,
          instruction: 'Show the paper key to reveal the next part of the story.',
          successText: 'A new path appears.',
          rule: { kind: 'visible', ids: [project.cards[0]!.id] },
          scene: 'night',
        };
        project = validate({ ...project, stages: [...project.stages, stage] });
        selectedStageId = stage.id;
        changed('A new story beat is ready. Give it a scene and an unlock condition.');
      }
      if (action === 'remove-stage') {
        if (project.stages.length <= 1) throw new Error('Keep at least one story beat.');
        const removed = project.stages.findIndex((stage) => stage.id === button.dataset.id);
        project = validate({
          ...project,
          stages: project.stages.filter((stage) => stage.id !== button.dataset.id),
        });
        if (selectedStageId === button.dataset.id)
          selectedStageId = project.stages[Math.min(removed, project.stages.length - 1)]!.id;
        changed('Story beat removed.');
      }
      if (action === 'stage-up' || action === 'stage-down') {
        const index = project.stages.findIndex((stage) => stage.id === button.dataset.id);
        const next = index + (action === 'stage-up' ? -1 : 1);
        if (index >= 0 && next >= 0 && next < project.stages.length) {
          [project.stages[index], project.stages[next]] = [
            project.stages[next]!,
            project.stages[index]!,
          ];
          changed('Story beats reordered.');
        }
      }
      if (action === 'add-card') {
        if (project.cards.length >= 8)
          throw new Error('The deck can contain up to eight unique cards.');
        const id = Array.from({ length: 8 }, (_, item) => item).find(
          (item) => !project.cards.some((card) => card.id === item),
        )!;
        project = validate({
          ...project,
          cards: [...project.cards, { id, label: `Key ${id + 1}`, color: palette[id]! }],
        });
        changed('A new paper key joined the deck. Add it to an unlock rule.');
      }
      if (action === 'remove-card') {
        if (project.cards.length <= 3) throw new Error('Keep at least three cards in the deck.');
        const id = Number(button.dataset.id);
        project.cards = project.cards.filter((card) => card.id !== id);
        repairRulesAfterRemovingCard(id);
        project = validate(project);
        changed('Card removed. Any rules using it were adjusted to the remaining deck.');
      }
      if (action === 'sequence-up' || action === 'sequence-down') {
        const stage = selectedStage();
        if (stage.rule.kind !== 'order') return;
        const ids = [...stage.rule.ids],
          index = Number(button.dataset.index),
          next = index + (action === 'sequence-up' ? -1 : 1);
        if (next >= 0 && next < ids.length) {
          [ids[index], ids[next]] = [ids[next]!, ids[index]!];
          replaceRule({ kind: 'order', ids });
        }
      }
      if (action === 'print') {
        const html = printCardsHtml(validate(project));
        const printWindow = window.open('', '_blank', 'width=1000,height=800');
        if (!printWindow)
          throw new Error('Allow pop-up windows to open the printable card sheets.');
        printWindow.opener = null;
        printWindow.document.open();
        printWindow.document.write(html);
        printWindow.document.close();
        tell(
          'Print sheets opened. Keep marker borders intact and use the included size guide.',
          'success',
        );
      }
      if (action === 'play') {
        playerHtml = exportGameHtml(validate(project), runtimeScript);
        tell('The live player is open. Close it to return to the studio.');
      }
      if (action === 'download') {
        save(exportGameHtml(validate(project), runtimeScript), `${slug()}-game.html`, 'text/html');
        tell('Your standalone game was downloaded with its deck and player included.', 'success');
      }
      render();
    } catch (error) {
      tell(error instanceof Error ? error.message : 'That edit could not be completed.', 'error');
      render();
    }
  };
  root!.onchange = (event) => {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    try {
      if (input.dataset.projectField) {
        const field = input.dataset.projectField;
        if (field === 'holdMs') project = validate({ ...project, holdMs: Number(input.value) });
        else if (field === 'name' || field === 'description')
          project = validate({ ...project, [field]: input.value.trim() });
        changed();
      } else if (input.dataset.stageField) {
        const field = input.dataset.stageField as 'title' | 'instruction' | 'successText' | 'scene';
        replaceStage({ ...selectedStage(), [field]: input.value.trim() });
      } else if (input.id === 'rule-kind') {
        const ids = project.cards.map((card) => card.id);
        if (input.value === 'visible') replaceRule({ kind: 'visible', ids: [ids[0]!] });
        if (input.value === 'hidden')
          replaceRule({ kind: 'hidden', target: ids[0]!, witness: ids[1]! });
        if (input.value === 'order')
          replaceRule({ kind: 'order', ids: ids.slice(0, Math.min(3, ids.length)) });
        if (input.value === 'rotation')
          replaceRule({ kind: 'rotation', id: ids[0]!, quarterTurn: 90 });
      } else if (input.dataset.ruleCard !== undefined) {
        const stage = selectedStage();
        if (stage.rule.kind !== 'visible' && stage.rule.kind !== 'order') return;
        const id = Number(input.dataset.ruleCard);
        const ids = (input as HTMLInputElement).checked
          ? [...stage.rule.ids, id]
          : stage.rule.ids.filter((cardId) => cardId !== id);
        if (ids.length < (stage.rule.kind === 'order' ? 2 : 1))
          throw new Error(
            stage.rule.kind === 'order'
              ? 'An order rule needs at least two cards.'
              : 'Choose at least one visible card.',
          );
        replaceRule({ kind: stage.rule.kind, ids });
      } else if (input.dataset.ruleField) {
        const rule = selectedStage().rule;
        const value = Number(input.value);
        if (
          rule.kind === 'hidden' &&
          (input.dataset.ruleField === 'target' || input.dataset.ruleField === 'witness')
        )
          replaceRule({ ...rule, [input.dataset.ruleField]: value });
        if (rule.kind === 'rotation' && input.dataset.ruleField === 'rotation-id')
          replaceRule({ ...rule, id: value });
        if (rule.kind === 'rotation' && input.dataset.ruleField === 'quarter-turn')
          replaceRule({ ...rule, quarterTurn: value as 0 | 90 | 180 | 270 });
      } else if (input.dataset.cardField) {
        const id = Number(input.dataset.cardId),
          field = input.dataset.cardField as 'label' | 'color';
        const cards: Card[] = project.cards.map((card) =>
          card.id === id ? { ...card, [field]: input.value.trim() } : card,
        );
        project = validate({ ...project, cards });
        changed();
      } else return;
      render();
    } catch (error) {
      tell(error instanceof Error ? error.message : 'Check the entered value.', 'error');
      render();
    }
  };
  document.getElementById('project-file')!.addEventListener('change', (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      tell('Project files must be smaller than 2 MB.', 'error');
      render();
      return;
    }
    void file
      .text()
      .then((text) => {
        const imported = validateProject(JSON.parse(text));
        if (unsaved && !window.confirm('Replace this unsaved story with the imported project?'))
          return;
        project = imported;
        selectedStageId = project.stages[0]!.id;
        unsaved = false;
        playerHtml = null;
        tell('Story opened. Its card deck and unlock rules are ready to edit.', 'success');
        render();
      })
      .catch((error) => {
        tell(error instanceof Error ? error.message : 'Could not read that project.', 'error');
        render();
      });
  });
  const dialog = document.getElementById('player-dialog') as HTMLDialogElement;
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closePlayer();
  });
}

window.addEventListener('beforeunload', (event) => {
  if (unsaved) {
    event.preventDefault();
    event.returnValue = '';
  }
});
render();
