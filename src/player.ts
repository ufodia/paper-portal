import {
  PuzzleEngine,
  validateProject,
  type Detection,
  type EngineView,
  type Project,
} from './core';
import { detectMarkers } from './markers';

/** This entry is bundled as an IIFE and embedded in the exported game file. */
function boot(): void {
  const root = document.getElementById('paper-player');
  const projectNode = document.getElementById('paper-project');
  if (!root || !projectNode) return;
  let project: Project;
  try {
    project = validateProject(JSON.parse(projectNode.textContent ?? ''));
  } catch {
    const message = document.createElement('p');
    message.textContent = 'This game file is invalid. Ask its creator to export it again.';
    root.replaceChildren(message);
    return;
  }
  const style = document.createElement('style');
  style.textContent = `
    :root{font-family:Inter,ui-sans-serif,system-ui,sans-serif;color:#efeaf8;background:#111019;color-scheme:dark;font-synthesis:none}*{box-sizing:border-box}body{margin:0}button,input,select{font:inherit}button{cursor:pointer}button:disabled{cursor:default;opacity:.45}button:focus-visible,input:focus-visible,select:focus-visible,a:focus-visible{outline:3px solid #dac4ff;outline-offset:4px}button{border:1px solid #51465f;background:#25202f;color:#eee7f8;border-radius:9px;padding:11px 15px;font-size:13px;font-weight:650}.primary{background:#c7a6ef;color:#20122f;border-color:#c7a6ef}a{color:#d6baf5}.player-shell{max-width:1240px;margin:auto;padding:30px 36px 50px}.player-header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding-bottom:25px;border-bottom:1px solid #35303f}.wordmark{font-size:17px;letter-spacing:-.7px;font-weight:800}.wordmark span{color:#c6a2ef}.player-header small{font:10px ui-monospace,monospace;letter-spacing:2px;color:#a196b0}.intro{padding:38px 0 27px}.intro p{max-width:760px;color:#b2a7c1;line-height:1.65;font-size:14px}.eyebrow{font:10px ui-monospace,monospace;letter-spacing:2px;color:#be9de4;text-transform:uppercase}h1{font-size:38px;line-height:1.12;letter-spacing:-1.8px;margin:12px 0}h2{font-size:23px;letter-spacing:-.7px;margin:8px 0 12px}h3{font-size:13px;margin:0 0 18px}.player-grid{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:24px;align-items:start}.panel{border:1px solid #3b3347;background:#1a1722;border-radius:14px;overflow:hidden}.stage-copy{padding:24px 26px 18px}.stage-copy p{font-size:14px;line-height:1.65;color:#c4b8d0;min-height:46px;margin:0}.scene{position:relative;background:#151323;border-top:1px solid #352c42;border-bottom:1px solid #352c42}.scene svg{width:100%;height:auto;display:block}.scene .console-light{fill:#302a3c}.scene .gate-light{stroke:#51465f}.scene .portal-ring{opacity:0;transition:opacity 1s}.scene[data-scene=console] .console-light,.scene[data-scene=gate] .console-light,.scene[data-scene=portal] .console-light{fill:#c5a0f1}.scene[data-scene=gate] .gate-light,.scene[data-scene=portal] .gate-light{stroke:#ccaafa}.scene[data-scene=portal] .portal-ring{opacity:1}.scene-label{position:absolute;bottom:15px;left:22px;font:10px ui-monospace,monospace;letter-spacing:2px;color:#a99ab9}.hold-area{padding:20px 26px}.hold-label{display:flex;justify-content:space-between;font-size:11px;color:#baadc9;margin-bottom:10px}progress{display:block;width:100%;height:7px;accent-color:#c8a4f3;border:0;border-radius:8px;overflow:hidden;background:#37303f}progress::-webkit-progress-bar{background:#37303f}progress::-webkit-progress-value{background:#c8a4f3}.recent-event{min-height:20px;font-size:11px;color:#d4bcf1;margin:13px 0 0}.stage-list{display:flex;list-style:none;gap:7px;padding:0;margin:19px 0 0;flex-wrap:wrap}.stage-list li{font-size:10px;border:1px solid #43384f;border-radius:20px;padding:7px 10px;color:#9e90ac}.stage-list li[data-state=current]{border-color:#b792de;color:#e4d0fa}.stage-list li[data-state=done]{background:#2e263b;color:#cbb2e7}.controls{padding:22px}.camera-buttons{display:flex;gap:8px;flex-wrap:wrap}.camera-buttons button{flex:1;white-space:nowrap}.source-status{font-size:11px;color:#a99ab9;line-height:1.5;min-height:32px;margin:13px 0}.source-toggle{display:flex;align-items:center;gap:10px;border-top:1px solid #3a3145;padding-top:18px;font-size:13px}.source-toggle input,.sim-visible{accent-color:#c9a3f5;width:17px;height:17px}.source-note{font-size:11px;line-height:1.65;color:#a79ab6;margin:11px 0 0}.simulator{border-top:1px solid #3a3145;margin-top:20px;padding-top:20px}.simulator[hidden]{display:none}.sim-row{display:grid;grid-template-columns:1fr 50px 67px;gap:8px;align-items:center;padding:10px 0;border-bottom:1px solid #322a3d}.sim-card-label{display:flex;align-items:center;gap:8px;font-size:12px;min-width:0}.sim-card-label span{overflow:hidden;text-overflow:ellipsis}.sim-row input[type=number],.sim-row select{min-width:0;width:100%;background:#24202f;color:#ddd0ed;border:1px solid #4a3c59;border-radius:6px;padding:7px 5px;font-size:11px}.sim-head{display:grid;grid-template-columns:1fr 50px 67px;gap:8px;color:#8f809f;font-size:9px;text-transform:uppercase;letter-spacing:1px}.capture{margin-top:24px;padding:19px 22px}.feed{position:relative;background:#111019;border:1px solid #3b3148;border-radius:9px;overflow:hidden;margin-top:14px}.feed video{position:absolute;inset:0;width:100%;height:100%;object-fit:contain}.feed canvas{position:relative;z-index:1;width:100%;height:auto;display:block}.detection-summary{font-size:11px;line-height:1.5;color:#a99ab9;min-height:30px;margin:12px 0 0}.restart-row{margin-top:18px;display:flex;justify-content:space-between;align-items:center;gap:15px}.restart-row p{font-size:10px;color:#8f819f;line-height:1.6;max-width:420px}.complete-note{padding:12px 16px;border:1px solid #6c5483;background:#30233e;border-radius:9px;margin-top:18px;font-size:13px}.complete-note[hidden]{display:none}.screenreader{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}@media(max-width:940px){.player-grid{grid-template-columns:1fr 280px}.player-shell{padding:24px}.stage-copy{padding:20px}.controls{padding:18px}}@media(max-width:720px){.player-grid{grid-template-columns:1fr}.player-shell{padding:20px 16px}.player-header small{display:none}h1{font-size:31px}.intro{padding-top:28px}.player-grid aside{display:grid;grid-template-columns:1fr;gap:18px}.capture{margin-top:0}.restart-row{align-items:flex-start}.scene-label{font-size:8px}.stage-copy p{min-height:0}}@media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
  `;
  document.head.append(style);
  root.innerHTML = `<div class="player-shell"><header class="player-header"><div class="wordmark">paper<span>portal</span> <span aria-hidden="true">↗</span></div><small>ONE CAMERA. A FEW CARDS. ANOTHER WORLD.</small><a href="https://buymeacoffee.com/ufodia" target="_blank" rel="noopener noreferrer" style="font-size:11px">Support the maker ↗</a></header><section class="intro"><span class="eyebrow">A physical puzzle, in your browser</span><h1 id="game-title"></h1><p id="game-description"></p></section><div class="player-grid"><section><div class="panel"><div class="stage-copy"><span id="stage-count" class="eyebrow"></span><h2 id="current-stage"></h2><p id="engine-message" aria-live="polite"></p></div><div id="observatory-scene" class="scene" data-scene="night"><svg viewBox="0 0 800 420" aria-hidden="true"><defs><radialGradient id="sky"><stop stop-color="#3b2d57"/><stop offset="1" stop-color="#171322"/></radialGradient><linearGradient id="portal-glow" x2="0" y2="1"><stop stop-color="#ead5ff"/><stop offset="1" stop-color="#9863da"/></linearGradient></defs><rect width="800" height="420" fill="url(#sky)"/><g fill="#b6a0cf" opacity=".7"><circle cx="80" cy="70" r="1.5"/><circle cx="170" cy="130" r="1"/><circle cx="270" cy="50" r="1.6"/><circle cx="370" cy="105" r="1"/><circle cx="480" cy="60" r="1.4"/><circle cx="620" cy="100" r="1"/><circle cx="720" cy="42" r="1.4"/><circle cx="670" cy="175" r="1"/><circle cx="122" cy="215" r="1.4"/></g><circle cx="650" cy="75" r="26" fill="#bba2d4" opacity=".7"/><circle cx="662" cy="65" r="25" fill="#231b33"/><path d="M0 320L120 225L240 310L345 210L490 320L610 220L800 325V420H0Z" fill="#201b2d"/><ellipse cx="400" cy="374" rx="260" ry="20" fill="#0e0c16" opacity=".5"/><path d="M240 364V232Q240 142 330 142Q420 142 420 232V364Z" fill="#373044" stroke="#6e5a81" stroke-width="2"/><path d="M233 235Q233 135 330 135Q427 135 427 235" fill="none" stroke="#7e6695" stroke-width="10"/><path d="M310 137L388 72L403 88L340 145" fill="#544360"/><circle cx="398" cy="80" r="16" fill="#8b70a6"/><path d="M264 364V245H395V364" fill="#262031"/><rect x="283" y="262" width="94" height="68" rx="6" fill="#18141f" stroke="#61506e"/><rect class="console-light" x="296" y="274" width="26" height="8" rx="2"/><rect class="console-light" x="331" y="274" width="31" height="8" rx="2"/><rect class="console-light" x="296" y="292" width="66" height="4" rx="2"/><circle class="console-light" cx="307" cy="314" r="4"/><circle class="console-light" cx="328" cy="314" r="4"/><circle class="console-light" cx="349" cy="314" r="4"/><path d="M483 364V211Q483 156 537 156Q591 156 591 211V364" fill="#1c1725" stroke="#594769" stroke-width="10"/><path class="gate-light" d="M495 357V213Q495 170 537 170Q579 170 579 213V357" fill="none" stroke-width="3"/><path class="portal-ring" d="M504 355V216Q504 182 537 182Q570 182 570 216V355Z" fill="url(#portal-glow)"/><g class="portal-ring" fill="#e2ccfc"><circle cx="467" cy="231" r="3"/><circle cx="609" cy="270" r="2"/><circle cx="472" cy="321" r="2"/><circle cx="606" cy="206" r="2"/></g><path d="M210 365H620" stroke="#796486" stroke-width="3"/><path d="M315 365L270 420M355 365L380 420M530 365L575 420" stroke="#564562" stroke-width="2"/></svg><span id="scene-label" class="scene-label">OBSERVATORY / NIGHT</span></div><div class="hold-area"><div class="hold-label"><label for="hold-progress">Hold the pattern steady</label><span id="hold-label">0%</span></div><progress id="hold-progress" max="1" value="0">0%</progress><p id="recent-event" class="recent-event" aria-live="polite"></p><ol id="stage-list" class="stage-list" aria-label="Puzzle stages"></ol><div id="complete-note" class="complete-note" hidden>All stages complete. Your paper cards opened the portal.</div></div></div><div class="restart-row"><p>The camera view is unmirrored. Arrange cards left to right as they appear on screen. Pause or changing sources clears the current hold.</p><button id="restart-game" type="button">Restart game</button></div></section><aside><section class="panel controls"><h3>Choose your controls</h3><div class="camera-buttons"><button id="start-camera" class="primary" type="button">Start camera</button><button id="stop-camera" type="button" disabled>Stop camera</button></div><p id="source-status" class="source-status" role="status">Camera off. Nothing is being captured.</p><label class="source-toggle"><input id="use-simulator" type="checkbox">Use simulator</label><p class="source-note">Camera stays on this device. No audio, uploads or background recording. The simulator is an explicitly simulated input source.</p><div id="simulator-controls" class="simulator" hidden><h3>Arrange your virtual cards</h3><div class="sim-head"><span>In view</span><span>Place</span><span>Turn ↻</span></div><div id="simulator-cards"></div><p class="source-note">Change card presence, row position and clockwise orientation. The game uses continuously fresh simulated frames.</p></div></section><section class="panel capture"><span class="eyebrow">Input monitor</span><div class="feed"><video id="camera-video" autoplay muted playsinline hidden></video><canvas id="camera-view" width="640" height="360" aria-label="Camera or explicitly simulated card preview"></canvas></div><p id="detection-summary" class="detection-summary">No cards observed.</p></section></aside></div></div>`;

  const element = <T extends HTMLElement>(id: string): T => document.getElementById(id) as T;
  const engine = new PuzzleEngine(project);
  element('game-title').textContent = project.name;
  element('game-description').textContent = project.description;
  const start = element<HTMLButtonElement>('start-camera');
  const stop = element<HTMLButtonElement>('stop-camera');
  const simulator = element<HTMLInputElement>('use-simulator');
  const simControls = element('simulator-controls');
  const status = element('source-status');
  const video = element<HTMLVideoElement>('camera-video');
  const preview = element<HTMLCanvasElement>('camera-view');
  const previewContext = preview.getContext('2d')!;
  const analysis = document.createElement('canvas');
  const analysisContext = analysis.getContext('2d', { willReadFrequently: true })!;
  const stageNodes: HTMLLIElement[] = [];
  const controls = new Map<
    number,
    { visible: HTMLInputElement; position: HTMLInputElement; rotation: HTMLSelectElement }
  >();
  let source: 'idle' | 'camera' | 'simulator' = 'idle';
  let stream: MediaStream | null = null;
  let generation = 0;
  let sequence = 0;
  let animation = 0;
  let videoCallback = 0;
  let lastFrameAt = -Infinity;
  let lastMediaTime = -Infinity;
  let lastPresented = -Infinity;

  project.stages.forEach((stage) => {
    const li = document.createElement('li');
    li.textContent = stage.title;
    element('stage-list').append(li);
    stageNodes.push(li);
  });
  project.cards.forEach((card, index) => {
    const row = document.createElement('div');
    row.className = 'sim-row';
    const label = document.createElement('label');
    label.className = 'sim-card-label';
    const visible = document.createElement('input');
    visible.type = 'checkbox';
    visible.id = `sim-visible-${card.id}`;
    visible.className = 'sim-visible';
    visible.setAttribute('aria-label', `${card.label} visible`);
    const name = document.createElement('span');
    name.textContent = card.label;
    name.style.color = card.color;
    label.append(visible, name);
    const position = document.createElement('input');
    position.type = 'number';
    position.min = '1';
    position.max = '8';
    position.value = String(index + 1);
    position.id = `sim-position-${card.id}`;
    position.setAttribute('aria-label', `${card.label} position`);
    const rotation = document.createElement('select');
    rotation.id = `sim-rotation-${card.id}`;
    rotation.setAttribute('aria-label', `${card.label} clockwise rotation`);
    for (const angle of [0, 90, 180, 270]) {
      const option = document.createElement('option');
      option.value = String(angle);
      option.textContent = `${angle}°`;
      rotation.append(option);
    }
    row.append(label, position, rotation);
    element('simulator-cards').append(row);
    controls.set(card.id, { visible, position, rotation });
  });

  function render(view: EngineView): void {
    element('stage-count').textContent = view.completed
      ? `${project.stages.length} of ${project.stages.length} stages complete`
      : `Stage ${view.stageIndex + 1} of ${project.stages.length}`;
    element('current-stage').textContent = view.completed
      ? 'All stages complete.'
      : project.stages[view.stageIndex]!.title;
    element('engine-message').textContent = view.message;
    element<HTMLProgressElement>('hold-progress').value = view.holding;
    element('hold-label').textContent = `${Math.round(view.holding * 100)}%`;
    element('observatory-scene').dataset.scene = view.scene;
    element('scene-label').textContent = `OBSERVATORY / ${view.scene.toUpperCase()}`;
    element('complete-note').hidden = !view.completed;
    stageNodes.forEach((li, index) => {
      li.dataset.state =
        view.completed || index < view.stageIndex
          ? 'done'
          : index === view.stageIndex
            ? 'current'
            : 'waiting';
    });
    if (view.solvedStageTitle) element('recent-event').textContent = `✓ ${view.solvedStageTitle}`;
  }

  function idlePreview(): void {
    preview.width = 640;
    preview.height = 360;
    previewContext.fillStyle = '#15111e';
    previewContext.fillRect(0, 0, 640, 360);
    previewContext.fillStyle = '#8f7ca6';
    previewContext.font = '15px system-ui';
    previewContext.textAlign = 'center';
    previewContext.fillText('Your cards will appear here.', 320, 170);
    previewContext.font = '12px system-ui';
    previewContext.fillText('Start camera or choose the simulator.', 320, 196);
  }

  function processFrame(detections: Detection[], at: number): void {
    const view = engine.update({ at, sequence: sequence++, detections });
    render(view);
    element('detection-summary').textContent = detections.length
      ? `Observed: ${detections.map((d) => project.cards.find((c) => c.id === d.id)?.label ?? `Unknown #${d.id}`).join(', ')}`
      : 'No cards observed. Empty views never satisfy a hidden-card rule.';
    if (view.completed && source === 'camera') {
      stopCamera();
      status.textContent = 'Game complete. Camera stopped automatically.';
    }
  }

  function cancelLoops(): void {
    cancelAnimationFrame(animation);
    animation = 0;
    if (videoCallback && typeof video.cancelVideoFrameCallback === 'function')
      video.cancelVideoFrameCallback(videoCallback);
    videoCallback = 0;
  }

  function stopCamera(): void {
    generation++;
    cancelLoops();
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
    video.pause();
    video.srcObject = null;
    video.hidden = true;
    source = 'idle';
    lastFrameAt = -Infinity;
    lastMediaTime = -Infinity;
    lastPresented = -Infinity;
    start.disabled = false;
    stop.disabled = true;
    render(engine.pause());
    idlePreview();
    status.textContent = 'Camera off. Nothing is being captured.';
    element('detection-summary').textContent = 'No cards observed.';
  }

  function simulatedFrame(at: number): void {
    preview.width = 640;
    preview.height = 360;
    previewContext.fillStyle = '#15111e';
    previewContext.fillRect(0, 0, 640, 360);
    previewContext.font = '10px monospace';
    previewContext.textAlign = 'left';
    previewContext.fillStyle = '#a18ab9';
    previewContext.fillText('SIMULATOR / NO CAMERA USED', 20, 25);
    const detections: Detection[] = [];
    for (const card of project.cards) {
      const input = controls.get(card.id)!;
      if (!input.visible.checked) continue;
      const place = Math.max(1, Math.min(8, Number(input.position.value) || 1));
      const angle = Number(input.rotation.value);
      const x = 65 + (place - 1) * 70;
      const y = 180;
      detections.push({ id: card.id, x, y, width: 50, height: 50, angle });
      previewContext.save();
      previewContext.translate(x, y);
      previewContext.rotate((angle * Math.PI) / 180);
      previewContext.fillStyle = card.color;
      previewContext.fillRect(-27, -27, 54, 54);
      previewContext.fillStyle = '#23182e';
      previewContext.font = 'bold 20px system-ui';
      previewContext.textAlign = 'center';
      previewContext.fillText(String(card.id), 0, 7);
      previewContext.restore();
      previewContext.fillStyle = card.color;
      previewContext.font = '10px system-ui';
      previewContext.textAlign = 'center';
      previewContext.fillText(card.label.slice(0, 12), x, 230);
    }
    processFrame(detections, at);
  }

  function cameraFrame(at: number, mediaTime: number, presented?: number): void {
    if (
      source !== 'camera' ||
      video.readyState < 2 ||
      !video.videoWidth ||
      mediaTime <= lastMediaTime ||
      (presented !== undefined && presented <= lastPresented) ||
      at - lastFrameAt < 100
    )
      return;
    lastMediaTime = mediaTime;
    if (presented !== undefined) lastPresented = presented;
    lastFrameAt = at;
    const scale = Math.min(960 / video.videoWidth, 720 / video.videoHeight, 1);
    analysis.width = Math.max(1, Math.round(video.videoWidth * scale));
    analysis.height = Math.max(1, Math.round(video.videoHeight * scale));
    preview.width = analysis.width;
    preview.height = analysis.height;
    try {
      analysisContext.drawImage(video, 0, 0, analysis.width, analysis.height);
      const detections = detectMarkers(
        analysisContext.getImageData(0, 0, analysis.width, analysis.height),
      );
      previewContext.clearRect(0, 0, preview.width, preview.height);
      for (const detection of detections) {
        const card = project.cards.find((c) => c.id === detection.id);
        previewContext.strokeStyle = card?.color ?? '#ff8e92';
        previewContext.lineWidth = 3;
        previewContext.strokeRect(
          detection.x - detection.width / 2,
          detection.y - detection.height / 2,
          detection.width,
          detection.height,
        );
        previewContext.fillStyle = card?.color ?? '#ff8e92';
        previewContext.font = 'bold 15px system-ui';
        previewContext.textAlign = 'left';
        previewContext.fillText(
          card?.label ?? `Unknown #${detection.id}`,
          detection.x - detection.width / 2,
          Math.max(20, detection.y - detection.height / 2 - 8),
        );
      }
      processFrame(detections, at);
    } catch {
      stopCamera();
      status.textContent =
        'The camera frame could not be read. Try another camera or use the simulator.';
    }
  }

  function tick(at: number): void {
    if (source === 'simulator' && at - lastFrameAt >= 100) {
      lastFrameAt = at;
      simulatedFrame(at);
    } else if (source === 'camera' && typeof video.requestVideoFrameCallback !== 'function')
      cameraFrame(at, video.currentTime);
    if (
      source === 'simulator' ||
      (source === 'camera' && typeof video.requestVideoFrameCallback !== 'function')
    )
      animation = requestAnimationFrame(tick);
  }

  function scheduleVideo(ticket: number): void {
    videoCallback = video.requestVideoFrameCallback((at, metadata) => {
      videoCallback = 0;
      if (ticket !== generation || source !== 'camera') return;
      cameraFrame(at, metadata.mediaTime, metadata.presentedFrames);
      if (ticket === generation && source === 'camera') scheduleVideo(ticket);
    });
  }

  simulator.addEventListener('change', () => {
    stopCamera();
    simControls.hidden = !simulator.checked;
    if (simulator.checked) {
      source = 'simulator';
      status.textContent = 'Simulator active · no camera used.';
      lastFrameAt = -Infinity;
      animation = requestAnimationFrame(tick);
    }
  });
  start.addEventListener('click', async () => {
    stopCamera();
    simulator.checked = false;
    simControls.hidden = true;
    if (!navigator.mediaDevices?.getUserMedia) {
      status.textContent =
        'Camera access needs a supported browser and a secure context such as localhost or HTTPS. You can still use the simulator.';
      return;
    }
    const ticket = ++generation;
    start.disabled = true;
    stop.disabled = false;
    status.textContent = 'Waiting for your camera permission…';
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: { ideal: 'environment' },
        },
      });
      if (ticket !== generation || document.hidden) {
        cameraStream.getTracks().forEach((track) => track.stop());
        return;
      }
      stream = cameraStream;
      video.srcObject = cameraStream;
      video.hidden = false;
      cameraStream.getVideoTracks().forEach((track) =>
        track.addEventListener(
          'ended',
          () => {
            if (stream === cameraStream) stopCamera();
          },
          { once: true },
        ),
      );
      await video.play();
      if (ticket !== generation) return;
      source = 'camera';
      status.textContent = 'Camera active · processed locally · unmirrored view.';
      if (typeof video.requestVideoFrameCallback === 'function') scheduleVideo(ticket);
      else animation = requestAnimationFrame(tick);
    } catch (error) {
      if (ticket !== generation) return;
      stopCamera();
      status.textContent =
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'Camera permission was not granted. Choose the simulator or try again.'
          : 'Camera could not start. Check that it is available, or choose the simulator.';
    }
  });
  stop.addEventListener('click', stopCamera);
  element('restart-game').addEventListener('click', () => {
    render(engine.restart());
    element('recent-event').textContent = '';
    if (simulator.checked && source === 'idle') {
      source = 'simulator';
      status.textContent = 'Simulator active · no camera used.';
      lastFrameAt = -Infinity;
      animation = requestAnimationFrame(tick);
    }
  });
  window.addEventListener('pagehide', stopCamera);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopCamera();
      if (simulator.checked)
        status.textContent = 'Paused while this page is hidden. Toggle the simulator to resume.';
    }
  });
  render(engine.getState());
  idlePreview();
}

boot();
