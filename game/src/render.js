// Drawing only: world state and screen in, pixels out. Vision cones are painted first
// (translucent red for guards, orange for cameras) so the danger reads at a glance;
// green cover strips, the amber loot and the alarm meter are kept bright on purpose —
// safe, danger and prize must be obvious in a single screenshot.
import { ALARM, CAMERA, FIELD, FONT, GUARD, PALETTE } from './config.js';
import { COVERS, EXIT, LOOT, OBSTACLES } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

function conePath(ctx, x, y, angle, length, half) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, length, angle - half, angle + half);
  ctx.closePath();
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(window.innerWidth * ratio);
    canvas.height = Math.round(window.innerHeight * ratio);
    view.scale = Math.min(canvas.width / FIELD.width, canvas.height / FIELD.height);
    view.x = (canvas.width - FIELD.width * view.scale) / 2;
    view.y = (canvas.height - FIELD.height * view.scale) / 2;
  }
  window.addEventListener('resize', resize);
  resize();

  function text(value, x, y, size, color, align = 'left', weight = 600) {
    ctx.font = `${weight} ${size}px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = 'middle';
    ctx.fillText(value, x, y);
  }

  function drawRoom(state) {
    ctx.fillStyle = PALETTE.floor;
    ctx.fillRect(0, FIELD.hud, FIELD.width, FIELD.height - FIELD.hud);
    // Subtle chequer so the open floor reads as a museum hall, not a void.
    const tile = 56;
    for (let y = FIELD.hud; y < FIELD.height; y += tile) {
      for (let x = 0; x < FIELD.width; x += tile) {
        if (((x / tile) + (y / tile)) % 2 === 0) { ctx.fillStyle = PALETTE.floorAlt; ctx.fillRect(x, y, tile, tile); }
      }
    }
    // West service corridor + north vent run: the two quieter routes, tinted apart.
    ctx.fillStyle = PALETTE.corridor;
    ctx.fillRect(28, 84, 236, 560);
    ctx.fillStyle = PALETTE.vent;
    ctx.fillRect(28, 84, 900, 44);
    text('VENT RUN', 480, 106, 13, '#57d9a3', 'center', 700);
    ctx.save();
    ctx.translate(52, 370); ctx.rotate(-Math.PI / 2);
    text('SERVICE CORRIDOR', 0, 0, 13, '#7f8bd0', 'center', 700);
    ctx.restore();
    // Outer walls.
    ctx.strokeStyle = PALETTE.obstacleEdge; ctx.lineWidth = 6;
    ctx.strokeRect(28, 84, FIELD.width - 56, FIELD.height - 112);
    // Cover strips: bright green = safe ground.
    for (const c of COVERS) {
      ctx.fillStyle = 'rgba(46,230,168,0.20)';
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.strokeStyle = PALETTE.coverEdge; ctx.lineWidth = 2;
      ctx.setLineDash([7, 5]); ctx.strokeRect(c.x, c.y, c.w, c.h); ctx.setLineDash([]);
    }
    text('COVER', 375, 217, 11, PALETTE.coverEdge, 'center', 700);
    // Display cases and crates block sight: draw them solid, with a glint of glass.
    for (const o of OBSTACLES) {
      ctx.fillStyle = PALETTE.obstacle;
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeStyle = PALETTE.obstacleEdge; ctx.lineWidth = 3; ctx.strokeRect(o.x, o.y, o.w, o.h);
      ctx.fillStyle = 'rgba(140,170,255,0.35)';
      ctx.fillRect(o.x + 8, o.y + 7, o.w - 16, 6);
      if (o.label) text(o.label, o.x + o.w / 2, o.y + o.h / 2 + 6, 12, '#aab4e8', 'center', 700);
    }
  }

  function drawLoot(state) {
    // The vault plinth and the Amber Star: the one amber thing in a blue room.
    ctx.beginPath(); ctx.arc(LOOT.x, LOOT.y, 40, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,176,32,0.16)'; ctx.fill();
    ctx.strokeStyle = PALETTE.loot; ctx.lineWidth = 3; ctx.stroke();
    if (!state.hasLoot) {
      const pulse = 1 + Math.sin(state.time * 4) * 0.12;
      ctx.save(); ctx.translate(LOOT.x, LOOT.y); ctx.scale(pulse, pulse); ctx.rotate(Math.PI / 4);
      ctx.fillStyle = PALETTE.loot; ctx.fillRect(-13, -13, 26, 26);
      ctx.fillStyle = PALETTE.lootGlow; ctx.fillRect(-7, -7, 14, 14);
      ctx.restore();
    } else {
      text('TAKEN', LOOT.x, LOOT.y, 13, PALETTE.loot, 'center', 800);
    }
    text('VAULT · AMBER STAR LOOT', LOOT.x, LOOT.y + 58, 15, PALETTE.lootGlow, 'center', 800);
  }

  function drawExit(state) {
    const open = state.hasLoot;
    ctx.fillStyle = open ? 'rgba(46,230,168,0.30)' : 'rgba(90,98,127,0.30)';
    ctx.fillRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
    ctx.strokeStyle = open ? PALETTE.exit : PALETTE.exitLocked; ctx.lineWidth = 4;
    ctx.strokeRect(EXIT.x, EXIT.y, EXIT.w, EXIT.h);
    text(open ? 'GETAWAY' : 'GETAWAY', EXIT.x + EXIT.w / 2, EXIT.y + 26, 15, open ? PALETTE.exit : PALETTE.muted, 'center', 800);
    text(open ? 'ESCAPE!' : 'NEEDS LOOT', EXIT.x + EXIT.w / 2, EXIT.y + 50, 12, open ? PALETTE.exit : PALETTE.muted, 'center', 700);
    // Entry door, south-west.
    ctx.fillStyle = 'rgba(108,92,231,0.25)'; ctx.fillRect(76, 596, 104, 76);
    ctx.strokeStyle = '#6c5ce7'; ctx.lineWidth = 3; ctx.strokeRect(76, 596, 104, 76);
    text('ENTRY', 128, 634, 14, '#b7adff', 'center', 800);
  }

  function drawCones(state) {
    for (const c of state.cameras) {
      conePath(ctx, c.x, c.y, c.angle, CAMERA.coneLength, CAMERA.coneHalfAngle);
      ctx.fillStyle = state.empTime > 0 ? 'rgba(120,120,140,0.08)' : PALETTE.coneCam; ctx.fill();
      ctx.strokeStyle = PALETTE.coneCamEdge; ctx.lineWidth = 1.5; ctx.stroke();
    }
    for (const g of state.guards) {
      conePath(ctx, g.x, g.y, g.angle, GUARD.coneLength, GUARD.coneHalfAngle);
      ctx.fillStyle = PALETTE.coneGuard; ctx.fill();
      ctx.strokeStyle = PALETTE.coneGuardEdge; ctx.lineWidth = 1.5; ctx.stroke();
    }
  }

  function drawActors(state) {
    // Cameras: orange wall boxes with a lens, labelled so they read in the cover.
    for (const c of state.cameras) {
      ctx.fillStyle = PALETTE.camera; ctx.fillRect(c.x - 14, c.y - 10, 28, 20);
      ctx.beginPath(); ctx.arc(c.x, c.y, 6, 0, Math.PI * 2); ctx.fillStyle = '#231300'; ctx.fill();
      text(state.empTime > 0 ? 'CAM OFF' : 'CAMERA', c.x, c.y + 24, 11, PALETTE.camera, 'center', 800);
    }
    if (state.noise) {
      ctx.beginPath(); ctx.arc(state.noise.x, state.noise.y, 10 + Math.sin(state.time * 10) * 3, 0, Math.PI * 2);
      ctx.strokeStyle = '#7ee0ff'; ctx.lineWidth = 3; ctx.stroke();
      text('NOISE!', state.noise.x, state.noise.y - 24, 12, '#7ee0ff', 'center', 800);
    }
    for (const g of state.guards) {
      ctx.beginPath(); ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      ctx.fillStyle = PALETTE.guardBody; ctx.fill();
      ctx.strokeStyle = PALETTE.guard; ctx.lineWidth = 3; ctx.stroke();
      ctx.beginPath(); ctx.arc(g.x, g.y, 7, 0, Math.PI * 2); ctx.fillStyle = PALETTE.guard; ctx.fill();
      text('GUARD', g.x, g.y - 28, 11, '#ff8b94', 'center', 800);
    }
    const p = state.player;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius + 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(108,92,231,0.30)'; ctx.fill();
    ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.thiefCoat; ctx.fill();
    ctx.strokeStyle = PALETTE.thief; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fillStyle = PALETTE.thief; ctx.fill();
    if (state.hasLoot) { ctx.beginPath(); ctx.arc(p.x + 14, p.y - 12, 6, 0, Math.PI * 2); ctx.fillStyle = PALETTE.loot; ctx.fill(); }
    text('YOU · THIEF', p.x, p.y - 30, 12, '#d9d4ff', 'center', 800);
  }

  function drawHud(state) {
    ctx.fillStyle = PALETTE.hud; ctx.fillRect(0, 0, FIELD.width, FIELD.hud);
    ctx.fillStyle = PALETTE.loot; ctx.fillRect(0, FIELD.hud - 3, FIELD.width, 3);
    text('MIDNIGHT VAULT', 20, 32, 19, PALETTE.text, 'left', 800);
    // The alarm meter: the single most important HUD element, big and centre-top.
    text('ALARM', 356, 32, 15, PALETTE.muted, 'right', 800);
    ctx.fillStyle = '#232744'; ctx.fillRect(368, 16, 300, 32);
    const ratio = state.alarm / 100;
    ctx.fillStyle = state.alarm >= ALARM.warnAt ? (state.seen ? PALETTE.danger : PALETTE.warn) : PALETTE.safe;
    ctx.fillRect(368, 16, 300 * ratio, 32);
    ctx.strokeStyle = '#5963b8'; ctx.lineWidth = 2; ctx.strokeRect(368, 16, 300, 32);
    text(`${Math.round(state.alarm)}%`, 520, 33, 16, '#ffffff', 'center', 800);
    text(state.hasLoot ? 'LOOT: TAKEN ✓' : 'LOOT: IN VAULT', 700, 32, 15, state.hasLoot ? PALETTE.loot : PALETTE.muted, 'left', 800);
    text(`Q NOISE ×${state.noiseLeft}   E EMP ×${state.empLeft}`, 920, 32, 14, '#7ee0ff', 'left', 700);
    const mm = String(Math.floor(state.time / 60)).padStart(2, '0');
    const ss = String(Math.floor(state.time % 60)).padStart(2, '0');
    text(`${mm}:${ss}  SCORE ${state.score}`, 1262, 32, 15, PALETTE.text, 'right', 800);
    if (state.seen && !state.over) {
      ctx.fillStyle = 'rgba(255,71,87,0.92)'; ctx.fillRect(390, 642, 500, 34);
      text('SPOTTED! BREAK LINE OF SIGHT!', 640, 660, 16, '#ffffff', 'center', 800);
    } else if (state.warned && !state.over) {
      ctx.fillStyle = 'rgba(255,211,42,0.9)'; ctx.fillRect(440, 646, 400, 30);
      text('GUARDS ARE SUSPICIOUS…', 640, 662, 14, '#231a00', 'center', 800);
    }
    if (state.empTime > 0) text(`EMP: CAMERAS FROZEN ${state.empTime.toFixed(0)}s`, 640, 690, 15, '#7ee0ff', 'center', 800);
  }

  function drawPanel(title, lines, prompt, accent) {
    ctx.fillStyle = PALETTE.panel; ctx.fillRect(340, 196, 600, 330);
    ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.strokeRect(340, 196, 600, 330);
    text(title, 640, 252, 40, accent, 'center', 800);
    lines.forEach((line, i) => text(line, 640, 306 + i * 34, 18, PALETTE.text, 'center', 500));
    text(prompt, 640, 486, 19, PALETTE.lootGlow, 'center', 800);
  }

  function draw(state, screen, best) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = PALETTE.backdrop; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawRoom(state);
    drawCones(state);
    drawLoot(state);
    drawExit(state);
    drawActors(state);
    drawHud(state);
    if (screen === SCREEN_TITLE) {
      drawPanel('MIDNIGHT VAULT', [
        'Steal the Amber Star. Reach the getaway door.',
        'WASD / arrows move · SHIFT sneak · click = walk there',
        'Q noisemaker lures a guard · E EMP freezes cameras',
        'Red cones raise the ALARM — green cover hides you.',
        `Best score: ${best}`,
      ], 'Press SPACE or click to start the heist', PALETTE.loot);
    } else if (screen === SCREEN_PAUSED) {
      drawPanel('PAUSED', ['The guards hold their breath too.'], 'Press P to resume', PALETTE.text);
    } else if (screen === SCREEN_OVER) {
      drawPanel('CAUGHT!', [`The alarm hit 100% at ${Math.floor(state.time)}s.`, state.hasLoot ? 'So close — the Star was in your bag.' : 'The Amber Star stays in its vault… this time.', `Score ${state.score} · Best ${best}`], 'Press R or SPACE to try again', PALETTE.danger);
    } else if (screen === SCREEN_WIN) {
      drawPanel('CLEAN GETAWAY!', [`You escaped with the Amber Star in ${Math.floor(state.time)}s.`, state.everSeen ? 'Seen, but never caught.' : 'Never seen at all: +250 ghost bonus.', `Score ${state.score} · Best ${best}`], 'Press SPACE to run it again', PALETTE.exit);
    }
  }

  return { draw };
}
