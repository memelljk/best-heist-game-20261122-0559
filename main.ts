// A working best-game-01 entry (Node 22, standard library only): the game is this directory's
// game/ folder, plain static files a desktop browser loads offline (game/index.html and its ES
// modules, no library and no network request), and the program hands it in. It copies game/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the
// judge reads, with the vendored make.fun library. A starting point, not a winner: Block Dodger, a
// plain 2D canvas game where a paddle dodges falling blocks and catches coins, with a title screen,
// score, lives and levels, game over and restart, flat colours and no sound. Build your own game
// (any genre, any library you vendor under game/, or none), put your 3 or 4 PNG or JPEG screenshots
// in screenshots/ (the first by name is the cover) and run it.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// --- Midnight Vault pre-flight audit (authored for this entry) ----------------
// Walk a payload folder once and tally what the hand-in is about to copy, so a
// missing or hollow folder fails here with a readable reason instead of
// surfacing later as a confusing copy or dossier error.
function tallyPayload(root) {
  let files = 0;
  let bytes = 0;
  const stack = [root];
  while (stack.length > 0) {
    const current = stack.pop();
    for (const name of readdirSync(current)) {
      const target = join(current, name);
      const info = statSync(target);
      if (info.isDirectory()) {
        stack.push(target);
      } else if (info.isFile()) {
        files += 1;
        bytes += info.size;
      }
    }
  }
  return { files, bytes };
}

function demandPayload(label, root) {
  if (!existsSync(root)) {
    throw new Error(`Midnight Vault hand-in aborted: required ${label} folder is missing at ${root}`);
  }
  if (!statSync(root).isDirectory()) {
    throw new Error(`Midnight Vault hand-in aborted: ${label} path exists but is not a folder: ${root}`);
  }
  const tally = tallyPayload(root);
  if (tally.files === 0) {
    throw new Error(`Midnight Vault hand-in aborted: ${label} folder holds no files: ${root}`);
  }
  console.log(`[heist] ${label}: ${tally.files} file(s), ${tally.bytes} byte(s) ready to copy`);
  return tally;
}

// Re-read the dossier this run just wrote and confirm it parses as the schema
// the judge expects, then report a compact receipt for the operator.
function receiptForDossier(dossierPath) {
  const raw = readFileSync(dossierPath, 'utf8');
  const parsed = JSON.parse(raw);
  const imageCount = Array.isArray(parsed.images) ? parsed.images.length : 0;
  const textBytes = typeof parsed.text === 'string' ? Buffer.byteLength(parsed.text, 'utf8') : 0;
  if (parsed.schema !== 'makefun/dossier/v1') {
    throw new Error(`Midnight Vault hand-in aborted: dossier schema mismatch, got ${String(parsed.schema)}`);
  }
  console.log(`[heist] dossier verified: schema=${parsed.schema} images=${imageCount} text=${textBytes} byte(s) dossier=${Buffer.byteLength(raw, 'utf8')} byte(s)`);
  return { imageCount, textBytes, dossierBytes: Buffer.byteLength(raw, 'utf8') };
}

try {
  const gameTally = demandPayload('game', join(here, 'game'));
  const shotsRoot = join(here, 'screenshots');
  const shotsTally = existsSync(shotsRoot) ? demandPayload('screenshots', shotsRoot) : { files: 0, bytes: 0 };
  console.log(`[heist] payload total: ${gameTally.files + shotsTally.files} file(s), ${gameTally.bytes + shotsTally.bytes} byte(s) -> ${out}`);

  mkdirSync(out, { recursive: true });
  cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
  mkdirSync(join(out, 'screenshots'), { recursive: true });
  if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

  // The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
  // scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
  // files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
  // screenshots/ and dossier.json).
  writeFileSync(
    join(out, 'dossier.json'),
    buildDossier(out, {
      text_max_bytes: 163840,
      screenshots: { max: 4, max_bytes: 262144 },
      game_max_files: 993,
      game_max_bytes: 50331648,
      game_path_max_bytes: 1000,
    }),
  );

  receiptForDossier(join(out, 'dossier.json'));
  console.log('[heist] hand-in complete: game, screenshots and dossier are in the output folder only');
} catch (err) {
  const reason = err instanceof Error ? err.message : String(err);
  console.error(`[heist] hand-in failed: ${reason}`);
  process.exitCode = 1;
  throw err;
}
