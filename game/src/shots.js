// Deterministic screenshot scenes behind ?shot=start|play|end (and cover).
// Each scene steps the real world forward with a fixed script, so seed=1 always
// paints the same frame: the cover scene puts the thief mid-room, in the open,
// with guard cones, camera cones, the loot and the alarm meter all in one frame.
import { STEP } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

function run(world, seconds, move, sneak = false) {
  const steps = Math.round(seconds / STEP);
  for (let i = 0; i < steps; i += 1) world.step(STEP, move, sneak);
}

export function stageShot(name, world) {
  world.reset();
  const s = world.state;
  if (name === 'cover') {
    // Advance patrols/cameras to a lively moment, then walk the thief to mid-room.
    run(world, 3.2, { x: 0, y: 0 });
    s.player.x = 452; s.player.y = 486; s.player.angle = 0.6;
    s.alarm = 26; s.warned = true;
    run(world, 0.4, { x: 0, y: 0 });
    s.alarm = 26;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'play') {
    // A tenser beat: a noisemaker is ticking in the east hall, the thief is caught
    // at the edge of a cone and the alarm is climbing — tools and danger together.
    run(world, 5.1, { x: 0, y: 0 });
    world.useNoise(1010, 470);
    s.player.x = 560; s.player.y = 268; s.player.angle = 0.2;
    s.alarm = 47; s.warned = true; s.seen = true;
    run(world, 0.3, { x: 0, y: 0 });
    s.alarm = 47; s.seen = true;
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'end') {
    run(world, 3.2, { x: 0, y: 0 });
    s.hasLoot = true; s.lootTaken = true; s.score = 1140; s.time = 74;
    s.player.x = 1170; s.player.y = 560;
    s.over = true; s.won = true;
    return { screen: SCREEN_WIN, best: 1140 };
  }
  if (name === 'caught') {
    run(world, 3.2, { x: 0, y: 0 });
    s.player.x = 470; s.player.y = 300; s.alarm = 100; s.over = true; s.won = false; s.score = 120;
    return { screen: SCREEN_OVER, best: 0 };
  }
  // start: title over the live room — every heist element still visible behind the panel edges.
  run(world, 2.4, { x: 0, y: 0 });
  return { screen: SCREEN_TITLE, best: 0 };
}
