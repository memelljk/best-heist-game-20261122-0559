// Tiny synthesized sound: no audio files, no network. A soft blip for the loot,
// a low sting when the alarm trips, a click for tools. Silent if WebAudio is unavailable.
export function createAudio() {
  let ctx = null;
  function ensure() {
    try {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch { return null; }
  }
  function tone(freq, seconds, type, gain) {
    const c = ensure(); if (!c) return;
    const osc = c.createOscillator(); const g = c.createGain();
    osc.type = type; osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, c.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + seconds);
    osc.connect(g); g.connect(c.destination);
    osc.start(); osc.stop(c.currentTime + seconds);
  }
  return {
    loot() { tone(880, 0.18, 'sine', 0.12); setTimeout(() => tone(1320, 0.22, 'sine', 0.1), 70); },
    tool() { tone(340, 0.09, 'square', 0.05); },
    caught() { tone(160, 0.5, 'sawtooth', 0.12); },
    escaped() { tone(660, 0.16, 'sine', 0.1); setTimeout(() => tone(990, 0.3, 'sine', 0.1), 110); },
  };
}
