// Boot and the one loop: input every frame, the world in fixed 1/60 s steps, the
// renderer paints what is there. Screens: title, play, paused, caught, escaped.
// ?seed=N fixes the layout; ?shot=start|play|cover|end stages a deterministic scene,
// paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, FIELD, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_CAUGHT, EVENT_ESCAPED, EVENT_LOOT, EVENT_TOOL } from './world.js';
import { ACTION_CONFIRM, ACTION_EMP, ACTION_NOISE, ACTION_PAUSE, ACTION_RESTART, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';

const MAX_FRAME = 0.25;
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 1;

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try { return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; } catch { return 0; }
}
function saveBest(value) {
  try { window.localStorage.setItem(BEST_KEY, String(value)); } catch { /* private window: best lasts the visit */ }
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let clickTarget = null;

  function announce(message) { status.textContent = message; }
  function startGame() {
    world.reset(); clickTarget = null; accumulator = 0; screen = SCREEN_PLAY;
    announce('Heist started. Steal the Amber Star and reach the getaway door.');
  }
  function finish() {
    if (world.state.score > best) { best = world.state.score; saveBest(best); }
    screen = world.state.won ? SCREEN_WIN : SCREEN_OVER;
    if (world.state.won) { audio.escaped(); announce(`Escaped! Score ${world.state.score}.`); }
    else { audio.caught(); announce(`Caught. Score ${world.state.score}.`); }
  }

  function handleActions() {
    const actions = input.takeActions();
    const click = input.takeClick();
    if (click && screen === SCREEN_PLAY) {
      // Click-to-walk: convert the click into logical field coordinates.
      const scale = Math.min(click.rect.width / FIELD.width, click.rect.height / FIELD.height);
      const ox = (click.rect.width - FIELD.width * scale) / 2;
      const oy = (click.rect.height - FIELD.height * scale) / 2;
      clickTarget = { x: (click.x - ox) / scale, y: (click.y - oy) / scale };
    }
    if ((actions & ACTION_CONFIRM) && (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN)) startGame();
    else if ((actions & ACTION_RESTART) && (screen === SCREEN_OVER || screen === SCREEN_WIN || screen === SCREEN_PLAY)) startGame();
    else if ((actions & ACTION_PAUSE) && screen === SCREEN_PLAY) { screen = SCREEN_PAUSED; announce('Paused.'); }
    else if ((actions & (ACTION_PAUSE | ACTION_CONFIRM)) && screen === SCREEN_PAUSED) { screen = SCREEN_PLAY; announce('Playing.'); }
    if (screen === SCREEN_PLAY && (actions & ACTION_NOISE)) {
      const p = world.state.player;
      if (world.useNoise(p.x + 130, p.y - 40)) audio.tool();
    }
    if (screen === SCREEN_PLAY && (actions & ACTION_EMP)) {
      if (world.useEmp()) audio.tool();
    }
  }

  function stepOnce() {
    let move = input.move();
    if ((move.x === 0 && move.y === 0) && clickTarget) {
      const p = world.state.player;
      const dx = clickTarget.x - p.x; const dy = clickTarget.y - p.y;
      if (Math.hypot(dx, dy) < 12) clickTarget = null;
      else move = { x: Math.sign(dx), y: Math.sign(dy) };
    }
    if (move.x !== 0 || move.y !== 0) clickTarget = clickTarget && (move.x !== 0 || move.y !== 0) && input.move().x === 0 && input.move().y === 0 ? clickTarget : null;
    const events = world.step(STEP, move, input.sneak());
    if (events & EVENT_LOOT) { audio.loot(); announce('Loot taken! Get to the getaway door.'); }
    if (events & (EVENT_CAUGHT | EVENT_ESCAPED)) finish();
    void EVENT_TOOL;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    if (screen === SCREEN_PLAY) {
      while (accumulator >= STEP && screen === SCREEN_PLAY) { stepOnce(); accumulator -= STEP; }
    } else if (screen === SCREEN_TITLE) {
      // The room stays alive behind the title: guards patrol, cameras sweep.
      while (accumulator >= STEP) { world.step(STEP, { x: 0, y: 0 }, false); accumulator -= STEP; }
    } else accumulator = 0;
    renderer.draw(world.state, screen, best);
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) { screen = SCREEN_PAUSED; announce('Paused.'); }
  });
  announce('Midnight Vault. Press Space or click to start the heist.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
