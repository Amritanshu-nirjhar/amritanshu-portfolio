// The intro's score, synthesized live with Web Audio. No audio files to load.
let ctx: AudioContext | null = null;
let out: GainNode;
let verb: ConvolverNode;
let noiseBuf: AudioBuffer;
let beat = 0;

// Must be called from a click: browsers block audio until the user interacts.
export function startSound() {
  ctx = new AudioContext();
  out = ctx.createGain();
  out.gain.value = 0.8;
  out.connect(ctx.createDynamicsCompressor()).connect(ctx.destination);

  // Fake hall reverb from decaying noise.
  const len = ctx.sampleRate * 3;
  const ir = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3;
  }
  verb = ctx.createConvolver();
  verb.buffer = ir;
  const wet = ctx.createGain();
  wet.gain.value = 0.35;
  verb.connect(wet).connect(out);

  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
}

export function stopSound() {
  if (!ctx) return;
  const c = ctx;
  ctx = null;
  clearInterval(beat);
  out.gain.setTargetAtTime(0, c.currentTime, 0.15);
  setTimeout(() => c.close(), 1000);
}

function env(g: GainNode, t: number, peak: number, attack: number, decay: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
}

function noise(c: AudioContext, dur: number) {
  const b = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource();
  s.buffer = b;
  return s;
}

function osc(c: AudioContext, type: OscillatorType, hz: number, dest: AudioNode, t: number, dur: number) {
  const o = c.createOscillator();
  o.type = type;
  o.frequency.value = hz;
  o.connect(dest);
  o.start(t);
  o.stop(t + dur);
  return o;
}

export const sfx: Record<string, (...a: number[]) => void> = {
  // Low pad under the whole intro; its filter slowly opens up.
  drone(dur: number) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const f = ctx.createBiquadFilter();
    f.frequency.setValueAtTime(150, t);
    f.frequency.exponentialRampToValueAtTime(1400, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.16, t + 2);
    g.gain.setValueAtTime(0.16, t + dur - 1.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    f.connect(g).connect(out);
    g.connect(verb);
    for (const hz of [55, 55.4, 82.4, 110.3]) osc(ctx, "sawtooth", hz, f, t, dur);
  },

  // Sub kick + air: lands on each word.
  hit(peak = 0.6) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const g = ctx.createGain();
    env(g, t, peak, 0.005, 0.6);
    g.connect(out);
    g.connect(verb);
    osc(ctx, "sine", 150, g, t, 0.7).frequency.exponentialRampToValueAtTime(38, t + 0.5);

    const n = noise(ctx, 0.2);
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 5000;
    const ng = ctx.createGain();
    env(ng, t, 0.15, 0.002, 0.12);
    n.connect(hp).connect(ng).connect(out);
    n.start(t);
  },

  // Tiny digital blip for the stack ticker.
  tick() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const g = ctx.createGain();
    env(g, t, 0.04, 0.002, 0.03);
    g.connect(out);
    osc(ctx, "square", 1800 + Math.random() * 600, g, t, 0.05);
  },

  // Filtered noise sweeping up into the big moment.
  riser(dur: number) {
    if (!ctx) return;
    const t = ctx.currentTime;
    const n = noise(ctx, dur);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 2;
    bp.frequency.setValueAtTime(300, t);
    bp.frequency.exponentialRampToValueAtTime(6000, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.3, t + dur);
    n.connect(bp).connect(g).connect(out);
    g.connect(verb);
    n.start(t);
  },

  // Big hit + A-minor chord that rings out under the name.
  impact() {
    if (!ctx) return;
    sfx.hit(1);
    const t = ctx.currentTime;
    const lp = ctx.createBiquadFilter();
    lp.frequency.setValueAtTime(3000, t);
    lp.frequency.exponentialRampToValueAtTime(400, t + 3);
    const g = ctx.createGain();
    env(g, t, 0.12, 0.02, 3);
    lp.connect(g).connect(out);
    g.connect(verb);
    for (const hz of [110, 220, 261.6, 329.6, 440]) osc(ctx, "sawtooth", hz, lp, t, 3.2);
  },

  // Downward noise sweep for the final wipe.
  whoosh() {
    if (!ctx) return;
    const t = ctx.currentTime;
    const n = noise(ctx, 1.2);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(4000, t);
    bp.frequency.exponentialRampToValueAtTime(150, t + 1);
    const g = ctx.createGain();
    env(g, t, 0.35, 0.15, 0.9);
    n.connect(bp).connect(g).connect(out);
    g.connect(verb);
    n.start(t);
  },
};

// ---- The beat: 150 BPM chiptune/electro, A minor, scheduled ahead on the audio clock. ----

const BPM = 150;
const STEP = 60 / BPM / 4; // one 16th note = 0.1s
const STEPS = 200; // 20s
const CHORDS = [
  [440, 523.25, 659.25], // Am
  [349.23, 440, 523.25], // F
  [523.25, 659.25, 783.99], // C
  [392, 493.88, 587.33], // G
];
const ROOTS = [55, 43.65, 65.41, 49];
const ARP = [0, 1, 2, 3, 2, 1, 3, 4];

function drumNoise(c: AudioContext, t: number, type: BiquadFilterType, hz: number, peak: number, decay: number) {
  const n = c.createBufferSource();
  n.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = hz;
  const g = c.createGain();
  env(g, t, peak, 0.001, decay);
  n.connect(f).connect(g).connect(out);
  n.start(t);
  n.stop(t + decay + 0.05);
  return g;
}

function kick(c: AudioContext, t: number) {
  const g = c.createGain();
  env(g, t, 1, 0.002, 0.3);
  g.connect(out);
  osc(c, "sine", 170, g, t, 0.35).frequency.exponentialRampToValueAtTime(42, t + 0.12);
}

function note(c: AudioContext, t: number, type: OscillatorType, hz: number, peak: number, dur: number, cutoff: number) {
  const f = c.createBiquadFilter();
  f.frequency.value = cutoff;
  const g = c.createGain();
  env(g, t, peak, 0.004, dur);
  f.connect(g).connect(out);
  osc(c, type, hz, f, t, dur + 0.05);
  return g;
}

// One 16th-note step of the arrangement.
function step(c: AudioContext, s: number, t: number) {
  const bar = Math.floor(s / 16) % 4;
  const i = s % 16;
  const chord = CHORDS[bar];
  const tones = [...chord, chord[0] * 2, chord[1] * 2];
  const intro = s < 16; // first 1.6s: arp + hats build
  const roll = s >= 148 && s < 160; // snare roll into the break
  const breakdown = s >= 160 && s < 166; // silence before the drop on the name
  const outro = s >= 190;

  if (breakdown) return;

  // Chiptune arpeggio: square wave, 16ths, the "computer" voice.
  if (!outro) note(c, t, "square", tones[ARP[i % 8]], intro ? 0.035 : 0.05, 0.09, 4000).connect(verb);

  // Hats: 16ths, accent on the off-beat, open hat on every "and".
  if (!outro) drumNoise(c, t, "highpass", 8000, i % 4 === 2 ? 0.16 : 0.07, i % 4 === 2 ? 0.12 : 0.03);

  if (intro) {
    if (i % 4 === 0 && s >= 8) kick(c, t);
    return;
  }

  // Four-on-the-floor kick (the outro keeps it pounding under the name).
  if (i % 4 === 0) kick(c, t);
  if (outro) return;

  // Clap on 2 and 4, or a rising 16th roll before the break.
  if (roll) drumNoise(c, t, "bandpass", 1500 + (s - 148) * 150, 0.15 + (s - 148) * 0.03, 0.08);
  else if (i === 4 || i === 12) drumNoise(c, t, "bandpass", 1600, 0.45, 0.16).connect(verb);

  // Pumping bass: off-beat 8ths with octave jumps.
  if (i % 2 === 0 && i % 4 !== 0) note(c, t, "sawtooth", ROOTS[bar] * (i % 8 === 6 ? 2 : 1), 0.32, 0.16, 700);
  if (i === 0) note(c, t, "sine", ROOTS[bar], 0.4, 0.3, 200);
}

// Schedules the 20s track a little ahead of time so it stays tight even if the main thread hiccups.
function music() {
  if (!ctx) return;
  const c = ctx;
  let s = 0;
  let next = c.currentTime + 0.05;
  const pump = () => {
    if (ctx !== c || s >= STEPS) return clearInterval(beat);
    while (next < c.currentTime + 0.15 && s < STEPS) {
      step(c, s++, next);
      next += STEP;
    }
  };
  pump();
  beat = window.setInterval(pump, 25);
}

sfx.music = music;
