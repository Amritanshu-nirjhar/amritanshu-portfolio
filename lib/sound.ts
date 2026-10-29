// The intro's score, synthesized live with Web Audio. No audio files to load.
let ctx: AudioContext | null = null;
let out: GainNode;
let verb: ConvolverNode;

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
}

export function stopSound() {
  if (!ctx) return;
  const c = ctx;
  ctx = null;
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

export const sfx = {
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
  hit(peak = 0.9) {
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
