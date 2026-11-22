// Keyboard and pointer input. Held keys give a movement vector; one-shot presses
// (confirm, pause, tools) are queued as bit flags and taken once by the loop.
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_NOISE = 4;
export const ACTION_EMP = 8;
export const ACTION_RESTART = 16;

const KEYS = {
  up: new Set(['ArrowUp', 'KeyW']), down: new Set(['ArrowDown', 'KeyS']),
  left: new Set(['ArrowLeft', 'KeyA']), right: new Set(['ArrowRight', 'KeyD']),
};

export function createInput(target) {
  const held = { up: false, down: false, left: false, right: false, sneak: false };
  let actions = 0;
  let click = null;

  window.addEventListener('keydown', (event) => {
    if (KEYS.up.has(event.code)) held.up = true;
    else if (KEYS.down.has(event.code)) held.down = true;
    else if (KEYS.left.has(event.code)) held.left = true;
    else if (KEYS.right.has(event.code)) held.right = true;
    else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') held.sneak = true;
    else if (event.code === 'Space' || event.code === 'Enter') { if (!event.repeat) actions |= ACTION_CONFIRM; }
    else if (event.code === 'KeyP' || event.code === 'Escape') { if (!event.repeat) actions |= ACTION_PAUSE; }
    else if (event.code === 'KeyQ') { if (!event.repeat) actions |= ACTION_NOISE; }
    else if (event.code === 'KeyE') { if (!event.repeat) actions |= ACTION_EMP; }
    else if (event.code === 'KeyR') { if (!event.repeat) actions |= ACTION_RESTART; }
    else return;
    event.preventDefault();
  });
  window.addEventListener('keyup', (event) => {
    if (KEYS.up.has(event.code)) held.up = false;
    else if (KEYS.down.has(event.code)) held.down = false;
    else if (KEYS.left.has(event.code)) held.left = false;
    else if (KEYS.right.has(event.code)) held.right = false;
    else if (event.code === 'ShiftLeft' || event.code === 'ShiftRight') held.sneak = false;
  });
  window.addEventListener('blur', () => { held.up = held.down = held.left = held.right = held.sneak = false; });
  target.addEventListener('pointerdown', (event) => {
    const rect = target.getBoundingClientRect();
    click = { x: event.clientX - rect.left, y: event.clientY - rect.top, rect };
    actions |= ACTION_CONFIRM;
  });

  return {
    move() { return { x: (held.right ? 1 : 0) - (held.left ? 1 : 0), y: (held.down ? 1 : 0) - (held.up ? 1 : 0) }; },
    sneak() { return held.sneak; },
    takeActions() { const taken = actions; actions = 0; return taken; },
    takeClick() { const taken = click; click = null; return taken; },
  };
}
