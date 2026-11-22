// Midnight Vault — every tuning number and colour in one place.
// The playfield is a fixed 1280x720 logical area; the renderer scales it to the window.
export const FIELD = { width: 1280, height: 720, hud: 64 };
export const STEP = 1 / 60;
export const PLAYER = { radius: 15, speed: 178, sneakSpeed: 108 };
export const GUARD = { radius: 16, speed: 74, coneLength: 218, coneHalfAngle: 0.46 };
export const CAMERA = { coneLength: 196, coneHalfAngle: 0.38, sweepSpeed: 0.55 };
export const ALARM = { riseNear: 46, riseFar: 17, cameraRise: 22, decay: 20, coverDecay: 34, coverFactor: 0.38, warnAt: 32, caughtAt: 100 };
export const TOOLS = { noisemaker: 2, emp: 2, noiseCost: 75, empCost: 75, empSeconds: 5, lureSeconds: 4.5 };
export const SCORE = { loot: 500, escape: 400, secondBonus: 6, maxTimeBonus: 600, unseenBonus: 250 };
export const PALETTE = {
  backdrop: '#070812', wall: '#171a33', floor: '#1d2142', floorAlt: '#232850',
  corridor: '#141838', vent: '#123332', cover: '#1d5c46', coverEdge: '#39d98a',
  obstacle: '#2e3468', obstacleEdge: '#5963b8', glass: '#3a4a8f',
  thief: '#f4f6ff', thiefCoat: '#6c5ce7', loot: '#ffb020', lootGlow: '#ffe08a',
  guard: '#ff5964', guardBody: '#8f1d2c', coneGuard: 'rgba(255,60,80,0.20)', coneGuardEdge: 'rgba(255,90,105,0.55)',
  coneCam: 'rgba(255,145,40,0.17)', coneCamEdge: 'rgba(255,170,60,0.5)',
  camera: '#ffa53a', exit: '#2ee6a8', exitLocked: '#5a627f',
  text: '#eef1ff', muted: '#9aa3c7', danger: '#ff4757', warn: '#ffd32a', safe: '#2ee6a8',
  panel: 'rgba(10,12,30,0.88)', hud: 'rgba(8,10,26,0.92)',
};
export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const BEST_KEY = 'midnight-vault.best';
