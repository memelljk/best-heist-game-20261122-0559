// Midnight Vault — the museum room, its routes, cover, patrols, cameras and the heist rules.
// No drawing and no browser in here: state in, fixed steps forward, event flags out.
//
// One room, three ways through it:
//   * the open main floor (fast, watched by two cameras and the centre patrol),
//   * the west service corridor (narrow, one guard, green cover alcoves),
//   * the north vent run behind the display cases (slow, mostly safe, one camera sweep).
// The thief starts at the south door, the Amber Star sits in the vault at the north-east,
// and the getaway door at the south-east only opens once the loot is taken.

import { ALARM, CAMERA, FIELD, GUARD, PLAYER, SCORE, TOOLS } from './config.js';

export const EVENT_LOOT = 1;
export const EVENT_CAUGHT = 2;
export const EVENT_ESCAPED = 4;
export const EVENT_SEEN = 8;
export const EVENT_TOOL = 16;

// Solid display cases, pillars and crates. They block movement and sight alike.
export const OBSTACLES = [
  { x: 300, y: 150, w: 150, h: 44, label: 'CASE' },
  { x: 540, y: 150, w: 150, h: 44, label: 'CASE' },
  { x: 300, y: 330, w: 150, h: 44, label: 'CASE' },
  { x: 540, y: 330, w: 150, h: 44, label: 'CASE' },
  { x: 806, y: 250, w: 44, h: 130, label: '' },
  { x: 806, y: 470, w: 44, h: 110, label: '' },
  { x: 180, y: 470, w: 110, h: 40, label: 'CRATES' },
  { x: 980, y: 330, w: 120, h: 40, label: 'CRATES' },
];

// Green cover: standing here halves detection and drains the alarm fast.
export const COVERS = [
  { x: 292, y: 202, w: 166, h: 30 },
  { x: 532, y: 202, w: 166, h: 30 },
  { x: 292, y: 382, w: 166, h: 30 },
  { x: 532, y: 382, w: 166, h: 30 },
  { x: 172, y: 518, w: 126, h: 30 },
  { x: 972, y: 378, w: 136, h: 30 },
  { x: 92, y: 96, w: 560, h: 26 },
];

export const LOOT = { x: 1096, y: 138, radius: 22 };
export const EXIT = { x: 1148, y: 596, w: 104, h: 76 };
export const START = { x: 128, y: 612 };

const GUARD_ROUTES = [
  [{ x: 250, y: 280 }, { x: 700, y: 280 }, { x: 700, y: 430 }, { x: 250, y: 430 }],
  [{ x: 920, y: 150 }, { x: 920, y: 560 }, { x: 1080, y: 560 }, { x: 1080, y: 150 }],
  [{ x: 120, y: 150 }, { x: 120, y: 430 }, { x: 230, y: 430 }, { x: 230, y: 150 }],
  [{ x: 470, y: 620 }, { x: 470, y: 520 }, { x: 760, y: 520 }, { x: 760, y: 620 }],
];

const CAMERA_SPOTS = [
  { x: 70, y: 84, base: 1.05, range: 0.8, phase: 0 },
  { x: 640, y: 84, base: 1.57, range: 0.8, phase: 2.1 },
  { x: 1210, y: 84, base: 2.3, range: 0.8, phase: 4.2 },
];

function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

function angleTo(ax, ay, bx, by) { return Math.atan2(by - ay, bx - ax); }

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

// Segment vs obstacle rectangles: true when a wall/case blocks the straight line.
function sightBlocked(x1, y1, x2, y2) {
  const steps = 14;
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t;
    for (const o of OBSTACLES) {
      if (x > o.x && x < o.x + o.w && y > o.y && y < o.y + o.h) return true;
    }
  }
  return false;
}

function hitsObstacle(x, y, r) {
  for (const o of OBSTACLES) {
    if (x + r > o.x && x - r < o.x + o.w && y + r > o.y && y - r < o.y + o.h) return true;
  }
  return false;
}

export function inCover(x, y) {
  return COVERS.some((c) => x > c.x && x < c.x + c.w && y > c.y && y < c.y + c.h);
}

export function createWorld(random) {
  const player = { x: START.x, y: START.y, radius: PLAYER.radius, angle: -Math.PI / 2, moving: false };
  const guards = GUARD_ROUTES.map((route, i) => ({
    x: route[0].x, y: route[0].y, route, wp: 1, angle: angleTo(route[0].x, route[0].y, route[1].x, route[1].y),
    radius: GUARD.radius, lureX: 0, lureY: 0, lureTime: 0, id: i,
  }));
  const cameras = CAMERA_SPOTS.map((c) => ({ ...c, angle: c.base }));
  const state = {
    player, guards, cameras,
    alarm: 0, seen: false, everSeen: false, hasLoot: false, lootTaken: false,
    time: 0, score: 0, noiseLeft: TOOLS.noisemaker, empLeft: TOOLS.emp,
    empTime: 0, noise: null, over: false, won: false, warned: false,
  };

  function reset() {
    player.x = START.x; player.y = START.y; player.angle = -Math.PI / 2;
    guards.forEach((g, i) => { const r = GUARD_ROUTES[i]; g.x = r[0].x; g.y = r[0].y; g.wp = 1; g.lureTime = 0; g.angle = angleTo(r[0].x, r[0].y, r[1].x, r[1].y); });
    Object.assign(state, { alarm: 0, seen: false, everSeen: false, hasLoot: false, lootTaken: false, time: 0, score: 0, noiseLeft: TOOLS.noisemaker, empLeft: TOOLS.emp, empTime: 0, noise: null, over: false, won: false, warned: false });
  }

  function moveGuard(g, dt) {
    let tx; let ty;
    if (g.lureTime > 0) { g.lureTime -= dt; tx = g.lureX; ty = g.lureY; if (dist(g.x, g.y, tx, ty) < 10) return; }
    else {
      const target = g.route[g.wp];
      tx = target.x; ty = target.y;
      if (dist(g.x, g.y, tx, ty) < 8) { g.wp = (g.wp + 1) % g.route.length; return; }
    }
    const a = angleTo(g.x, g.y, tx, ty);
    g.angle = a;
    const nx = g.x + Math.cos(a) * GUARD.speed * dt;
    const ny = g.y + Math.sin(a) * GUARD.speed * dt;
    if (!hitsObstacle(nx, g.y, g.radius)) g.x = nx;
    if (!hitsObstacle(g.x, ny, g.radius)) g.y = ny;
  }

  function seenByGuard(g) {
    const d = dist(g.x, g.y, player.x, player.y);
    if (d > GUARD.coneLength) return 0;
    if (angleDiff(angleTo(g.x, g.y, player.x, player.y), g.angle) > GUARD.coneHalfAngle) return 0;
    if (sightBlocked(g.x, g.y, player.x, player.y)) return 0;
    return 1 - d / GUARD.coneLength;
  }

  function seenByCamera(c) {
    if (state.empTime > 0) return 0;
    const d = dist(c.x, c.y, player.x, player.y);
    if (d > CAMERA.coneLength) return 0;
    if (angleDiff(angleTo(c.x, c.y, player.x, player.y), c.angle) > CAMERA.coneHalfAngle) return 0;
    if (sightBlocked(c.x, c.y, player.x, player.y)) return 0;
    return 1 - d / CAMERA.coneLength;
  }

  // Tools. A noisemaker lands at (x,y) and pulls the nearest guard off its loop;
  // an EMP freezes every camera. Both are limited and cost score: depth, not a free pass.
  function useNoise(x, y) {
    if (state.noiseLeft <= 0 || state.over) return false;
    state.noiseLeft -= 1; state.score = Math.max(0, state.score - TOOLS.noiseCost);
    state.noise = { x, y, time: TOOLS.lureSeconds };
    let best = null; let bd = Infinity;
    for (const g of guards) { const d = dist(g.x, g.y, x, y); if (d < bd) { bd = d; best = g; } }
    if (best) { best.lureX = x; best.lureY = y; best.lureTime = TOOLS.lureSeconds; }
    return true;
  }

  function useEmp() {
    if (state.empLeft <= 0 || state.over) return false;
    state.empLeft -= 1; state.score = Math.max(0, state.score - TOOLS.empCost);
    state.empTime = TOOLS.empSeconds;
    return true;
  }

  function step(dt, move, sneak) {
    if (state.over) return 0;
    let events = 0;
    state.time += dt;
    if (state.empTime > 0) state.empTime -= dt;
    if (state.noise) { state.noise.time -= dt; if (state.noise.time <= 0) state.noise = null; }

    const speed = sneak ? PLAYER.sneakSpeed : PLAYER.speed;
    if (move.x !== 0 || move.y !== 0) {
      const len = Math.hypot(move.x, move.y) || 1;
      const nx = player.x + (move.x / len) * speed * dt;
      const ny = player.y + (move.y / len) * speed * dt;
      if (!hitsObstacle(nx, player.y, player.radius) && nx > 34 && nx < FIELD.width - 34) player.x = nx;
      if (!hitsObstacle(player.x, ny, player.radius) && ny > FIELD.hud + 26 && ny < FIELD.height - 30) player.y = ny;
      player.angle = Math.atan2(move.y, move.x);
      player.moving = true;
    } else player.moving = false;

    for (const g of guards) moveGuard(g, dt);
    for (const c of cameras) c.angle = c.base + Math.sin(state.time * CAMERA.sweepSpeed + c.phase) * c.range;

    let exposure = 0;
    for (const g of guards) exposure = Math.max(exposure, seenByGuard(g));
    let camExposure = 0;
    for (const c of cameras) camExposure = Math.max(camExposure, seenByCamera(c));
    const cover = inCover(player.x, player.y);
    const total = Math.max(exposure, camExposure * 0.8);
    state.seen = total > 0;
    if (state.seen) {
      state.everSeen = true; events |= EVENT_SEEN;
      let rise = exposure > 0 ? ALARM.riseFar + (ALARM.riseNear - ALARM.riseFar) * exposure : ALARM.cameraRise;
      if (cover) rise *= ALARM.coverFactor;
      state.alarm += rise * dt;
      if (state.alarm >= ALARM.warnAt) state.warned = true;
    } else {
      state.alarm -= (cover ? ALARM.coverDecay : ALARM.decay) * dt;
    }
    state.alarm = Math.min(100, Math.max(0, state.alarm));
    if (state.alarm >= ALARM.caughtAt) { state.over = true; state.won = false; events |= EVENT_CAUGHT; return events; }

    // Touching a guard is an instant, fair catch: you walked into them.
    for (const g of guards) {
      if (dist(g.x, g.y, player.x, player.y) < g.radius + player.radius - 2) { state.over = true; state.won = false; events |= EVENT_CAUGHT; return events; }
    }

    if (!state.hasLoot && dist(player.x, player.y, LOOT.x, LOOT.y) < LOOT.radius + player.radius + 6) {
      state.hasLoot = true; state.lootTaken = true; state.score += SCORE.loot; events |= EVENT_LOOT;
    }
    if (state.hasLoot && player.x > EXIT.x && player.x < EXIT.x + EXIT.w && player.y > EXIT.y && player.y < EXIT.y + EXIT.h) {
      state.over = true; state.won = true;
      const timeBonus = Math.max(0, SCORE.maxTimeBonus - Math.floor(state.time) * SCORE.secondBonus);
      state.score += SCORE.escape + timeBonus + (state.everSeen ? 0 : SCORE.unseenBonus);
      events |= EVENT_ESCAPED;
    }
    void random;
    return events;
  }

  return { state, reset, step, useNoise, useEmp };
}
