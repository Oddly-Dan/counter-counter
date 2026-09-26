// Audio engine: one AudioContext, synthesised recipes, CC0 clips, alarm loop with ducking.
(function(VT){
  let ctx = null, master = null, noiseBuf = null;
  const A = VT.audio = {};

  function ensure(){
    if(ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if(!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.connect(ctx.destination);
    // iOS: play through the silent switch where Safari allows it.
    try{ if(navigator.audioSession) navigator.audioSession.type = 'playback'; }catch(e){}
    return ctx;
  }

  A.supported = !!(window.AudioContext || window.webkitAudioContext);
  A.ready = () => !!ctx && ctx.state === 'running';

  // Browsers only allow sound after a user gesture; call this from one.
  A.unlock = function(){
    const c = ensure();
    if(!c) return Promise.resolve(false);
    if(c.state === 'running') return Promise.resolve(true);
    return c.resume().then(() => c.state === 'running').catch(() => false);
  };

  A.level = function(card, duck = 1){
    const s = VT.state.settings;
    if(s.muted || card.muted) return 0;
    return s.master * card.volume * duck;
  };

  function tone(dest, t, { f, f2, d = 0.3, type = 'sine', g = 0.3, a = 0.005 }){
    const o = ctx.createOscillator(), v = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f, t);
    if(f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    v.gain.setValueAtTime(0.0001, t);
    v.gain.exponentialRampToValueAtTime(g, t + a);
    v.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(v).connect(dest);
    o.start(t);
    o.stop(t + d + 0.03);
  }

  function noise(dest, t, { d = 0.02, g = 0.3, freq = 3000, q = 1, type = 'bandpass' }){
    const src = noiseSource(), f = ctx.createBiquadFilter(), v = ctx.createGain();
    f.type = type; f.frequency.value = freq; f.Q.value = q;
    v.gain.setValueAtTime(g, t);
    v.gain.exponentialRampToValueAtTime(0.0001, t + d);
    src.connect(f).connect(v).connect(dest);
    src.start(t, Math.random() * 0.5);
    src.stop(t + d + 0.02);
  }

  // Named synth recipes that themes refer to. Each takes (destination, startTime).
  const R = A.recipes = {
    softClick: (o, t) => noise(o, t, { d: 0.03, g: 0.35, freq: 2400, q: 2 }),
    tap: (o, t) => tone(o, t, { f: 880, f2: 660, d: 0.09, g: 0.3 }),
    tapLow: (o, t) => tone(o, t, { f: 520, f2: 400, d: 0.1, g: 0.3 }),
    twoTone: (o, t) => { tone(o, t, { f: 988, d: 0.2, g: 0.28 }); tone(o, t + 0.22, { f: 740, d: 0.3, g: 0.28 }); },
    risingChime: (o, t) => [1047, 1319, 1568, 2093].forEach((f, i) => tone(o, t + i * 0.11, { f, d: 0.7, type: 'triangle', g: 0.24 })),
    success: (o, t) => [784, 988, 1175, 1568].forEach((f, i) => tone(o, t + i * 0.09, { f, d: 0.5, type: 'triangle', g: 0.2 })),
    watchTick: (o, t) => noise(o, t, { d: 0.012, g: 0.5, freq: 5000, q: 6 }),
    crystal: (o, t) => {
      tone(o, t, { f: 2093, d: 1.3, g: 0.18 });
      tone(o, t, { f: 3136, d: 0.8, g: 0.07 });
      tone(o, t + 0.16, { f: 2637, d: 1.2, g: 0.15 });
    },
    musicBox: (o, t) => {
      [784, 659, 1047, 784, 880, 698, 1175, 988].forEach((f, i) => {
        tone(o, t + i * 0.19, { f, d: 0.9, g: 0.2, a: 0.003 });
        tone(o, t + i * 0.19, { f: f * 2, d: 0.35, g: 0.05, a: 0.003 });
      });
    },
    glassClink: (o, t) => { tone(o, t, { f: 2637, d: 0.4, g: 0.18, a: 0.002 }); tone(o, t, { f: 3951, d: 0.25, g: 0.07, a: 0.002 }); },
    glassLow: (o, t) => { tone(o, t, { f: 1760, d: 0.4, g: 0.18, a: 0.002 }); tone(o, t, { f: 2637, d: 0.25, g: 0.06, a: 0.002 }); },
    goldSweep: (o, t) => [1319, 1568, 1976, 2637].forEach((f, i) => tone(o, t + i * 0.07, { f, d: 0.8, g: 0.12 })),

    // Banana
    boing: (o, t) => sweep(o, t, { pts: [[0, 150], [0.1, 520], [0.35, 210]], type: 'triangle', g: 0.3, d: 0.4 }),
    squish: (o, t) => { noise(o, t, { d: 0.12, g: 0.25, freq: 700, q: 0.8, type: 'lowpass' }); tone(o, t, { f: 220, f2: 90, d: 0.12, g: 0.2 }); },
    slip: (o, t) => sweep(o, t, { pts: [[0, 300], [0.35, 1500]], type: 'triangle', g: 0.25, d: 0.4 }),
    monkey: (o, t) => [0, 0.11, 0.22, 0.36, 0.47, 0.58, 0.72].forEach((dt, i) =>
      sweep(o, t + dt, { pts: [[0, 600 + i % 2 * 150], [0.04, 1250], [0.09, 700]], type: 'sawtooth', g: 0.12, d: 0.1, filter: 2200 })),

    // A Dog's Life
    thump: (o, t) => tone(o, t, { f: 120, f2: 50, d: 0.16, g: 0.55 }),
    thumpLow: (o, t) => tone(o, t, { f: 90, f2: 40, d: 0.18, g: 0.5 }),
    squeak: (o, t) => [0, 0.14].forEach(dt => sweep(o, t + dt, { pts: [[0, 1400], [0.05, 2300], [0.11, 1600]], g: 0.2, d: 0.12 })),

    // Retro Arcade
    blip: (o, t) => tone(o, t, { f: 880, d: 0.07, type: 'square', g: 0.1, a: 0.002 }),
    blipLow: (o, t) => tone(o, t, { f: 440, d: 0.08, type: 'square', g: 0.1, a: 0.002 }),
    blipTick: (o, t) => tone(o, t, { f: 1760, d: 0.02, type: 'square', g: 0.05, a: 0.001 }),
    coin: (o, t) => { tone(o, t, { f: 988, d: 0.08, type: 'square', g: 0.1, a: 0.002 }); tone(o, t + 0.08, { f: 1319, d: 0.3, type: 'square', g: 0.1, a: 0.002 }); },
    powerUp: (o, t) => [262, 330, 392, 523, 659, 784, 1047].forEach((f, i) => tone(o, t + i * 0.045, { f, d: 0.06, type: 'square', g: 0.09, a: 0.002 })),
    levelClear: (o, t) => [[523, 0.12], [659, 0.12], [784, 0.12], [1047, 0.24], [784, 0.12], [1047, 0.5]].reduce((at, [f, d]) => {
      tone(o, t + at, { f, d, type: 'square', g: 0.1, a: 0.002 }); return at + d; }, 0),

    // Neon Synthwave
    synthPulse: (o, t) => sweep(o, t, { pts: [[0, 220]], type: 'sawtooth', g: 0.14, d: 0.3, filter: 1400 }),
    arp: (o, t) => [440, 554, 659, 880, 659, 554, 440, 659, 880, 1109].forEach((f, i) =>
      sweep(o, t + i * 0.09, { pts: [[0, f]], type: 'sawtooth', g: 0.12, d: 0.12, filter: 2600 })),
    laser: (o, t) => tone(o, t, { f: 1800, f2: 180, d: 0.2, type: 'square', g: 0.08 }),

    // Kitchen
    clockwork: (o, t) => [0, 0.05, 0.1, 0.15, 0.2, 0.25].forEach(dt => noise(o, t + dt, { d: 0.012, g: 0.4, freq: 4200, q: 5 })),

    // Zen
    woodBlock: (o, t) => { tone(o, t, { f: 820, d: 0.09, g: 0.35, a: 0.001 }); tone(o, t, { f: 1640, d: 0.04, g: 0.1, a: 0.001 }); },
    woodLow: (o, t) => { tone(o, t, { f: 540, d: 0.1, g: 0.35, a: 0.001 }); tone(o, t, { f: 1080, d: 0.04, g: 0.1, a: 0.001 }); },
    pebble: (o, t) => { tone(o, t, { f: 1300, f2: 950, d: 0.05, g: 0.2, a: 0.001 }); tone(o, t + 0.07, { f: 1100, f2: 900, d: 0.04, g: 0.12, a: 0.001 }); },

    // Deep Ocean
    drip: (o, t) => sweep(o, t, { pts: [[0, 500], [0.07, 1500]], g: 0.25, d: 0.09 }),
    sonar: (o, t) => { tone(o, t, { f: 1150, d: 1.1, g: 0.22 }); tone(o, t + 0.4, { f: 1150, d: 0.8, g: 0.07 }); },
    whaleCall: (o, t) => {
      sweep(o, t, { pts: [[0, 170], [0.7, 430], [1.5, 260], [1.9, 200]], g: 0.3, d: 2, a: 0.3 });
      sweep(o, t, { pts: [[0, 340], [0.7, 860], [1.5, 520], [1.9, 400]], g: 0.06, d: 2, a: 0.3 });
    },

    // Space
    telemetry: (o, t) => tone(o, t, { f: 2400, d: 0.03, g: 0.1, a: 0.001 }),
    telemetryLow: (o, t) => tone(o, t, { f: 1600, d: 0.06, g: 0.12, a: 0.001 }),
    countdownBeeps: (o, t) => { [0, 0.3, 0.6].forEach(dt => tone(o, t + dt, { f: 1000, d: 0.1, g: 0.2, a: 0.002 })); tone(o, t + 0.9, { f: 1500, d: 0.35, g: 0.22, a: 0.002 }); },
    launch: (o, t) => {
      const src = noiseSource(), f = ctx.createBiquadFilter(), v = ctx.createGain();
      f.type = 'lowpass'; f.frequency.setValueAtTime(200, t); f.frequency.linearRampToValueAtTime(900, t + 1);
      v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(0.9, t + 0.9); v.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
      src.loop = true;
      src.connect(f).connect(v).connect(o); src.start(t); src.stop(t + 2.3);
      tone(o, t, { f: 55, f2: 40, d: 2, g: 0.3, a: 0.6 });
    },

    // Terminal
    keyClack: (o, t) => { noise(o, t, { d: 0.02, g: 0.5, freq: 2600, q: 1 }); tone(o, t, { f: 170, d: 0.025, g: 0.15, a: 0.001 }); },
    termBell: (o, t) => tone(o, t, { f: 880, d: 0.16, type: 'square', g: 0.08, a: 0.002 }),
    klaxon: (o, t) => [0, 0.25, 0.5, 0.75].forEach((dt, i) => sweep(o, t + dt, { pts: [[0, i % 2 ? 660 : 440]], type: 'square', g: 0.09, d: 0.22, filter: 1800 })),

    // Stadium
    buzzer: (o, t) => { sweep(o, t, { pts: [[0, 110]], type: 'sawtooth', g: 0.18, d: 0.5, filter: 1200 }); sweep(o, t, { pts: [[0, 113]], type: 'square', g: 0.08, d: 0.5, filter: 1200 }); },

    // Cat Nap
    bellJingle: (o, t) => [0, 0.05, 0.11, 0.18].forEach((dt, i) => tone(o, t + dt, { f: [3520, 4186, 3729, 4435][i], d: 0.12, g: 0.07, a: 0.001 })),

    // Candy
    pop: (o, t) => { tone(o, t, { f: 400, f2: 1300, d: 0.06, g: 0.3, a: 0.001 }); noise(o, t, { d: 0.02, g: 0.2, freq: 3000, q: 1 }); },
    fizz: (o, t) => noise(o, t, { d: 0.45, g: 0.18, freq: 6500, q: 0.5, type: 'highpass' }),
    jingle: (o, t) => [1319, 1568, 2093, 1568, 2637, 2093].forEach((f, i) => tone(o, t + i * 0.1, { f, d: 0.25, type: 'triangle', g: 0.18 })),
    crunch: (o, t) => [0, 0.03, 0.07].forEach(dt => noise(o, t + dt, { d: 0.05, g: 0.35, freq: 1300, q: 0.7 })),

    // Christmas: the Jingle Bells chorus opening (public domain, 1857)
    jingleTune: (o, t) => [[659, 0.18], [659, 0.18], [659, 0.36], [659, 0.18], [659, 0.18], [659, 0.36], [659, 0.18], [784, 0.18], [523, 0.27], [587, 0.09], [659, 0.5]]
      .reduce((at, [f, d]) => { tone(o, t + at, { f, d: d + 0.2, type: 'triangle', g: 0.2 }); tone(o, t + at, { f: f * 3, d: 0.12, g: 0.03 }); return at + d; }, 0),

    // Halloween
    spookyOrgan: (o, t) => [147, 175, 208, 294].forEach(f => sweep(o, t, { pts: [[0, f], [1.4, f * 0.97]], type: 'sawtooth', g: 0.07, d: 1.6, a: 0.35, filter: 900 })),
    boneClick: (o, t) => { tone(o, t, { f: 1250, d: 0.06, g: 0.25, a: 0.001 }); tone(o, t, { f: 3100, d: 0.03, g: 0.08, a: 0.001 }); },
    boneLow: (o, t) => { tone(o, t, { f: 830, d: 0.07, g: 0.25, a: 0.001 }); tone(o, t, { f: 2100, d: 0.03, g: 0.08, a: 0.001 }); },

    // Easter
    eggTap: (o, t) => { tone(o, t, { f: 1500, d: 0.04, g: 0.25, a: 0.001 }); noise(o, t, { d: 0.015, g: 0.2, freq: 3500, q: 2 }); },

    // Valentine's Day
    loveHarp: (o, t) => [523, 659, 784, 988, 1175, 1319, 1568].forEach((f, i) => tone(o, t + i * 0.08, { f, d: 1, type: 'triangle', g: 0.14, a: 0.003 })),
    heartBeat: (o, t) => { tone(o, t, { f: 75, f2: 45, d: 0.14, g: 0.6 }); tone(o, t + 0.22, { f: 65, f2: 40, d: 0.14, g: 0.45 }); },
    twinkle: (o, t) => { tone(o, t, { f: 1568, d: 0.45, g: 0.12 }); tone(o, t + 0.08, { f: 2093, d: 0.5, g: 0.1 }); },

    // Bonfire Night
    whoosh: (o, t) => {
      const src = noiseSource(), f = ctx.createBiquadFilter(), v = ctx.createGain();
      src.loop = true;
      f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(400, t); f.frequency.exponentialRampToValueAtTime(3500, t + 0.6);
      v.gain.setValueAtTime(0.0001, t); v.gain.exponentialRampToValueAtTime(0.5, t + 0.3); v.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
      src.connect(f).connect(v).connect(o); src.start(t); src.stop(t + 0.75);
    },

    // Steampunk
    gearTick: (o, t) => { noise(o, t, { d: 0.01, g: 0.45, freq: 3600, q: 4 }); tone(o, t, { f: 1200, d: 0.015, g: 0.08, a: 0.001 }); },
    ratchet: (o, t) => [0, 0.025, 0.05, 0.075, 0.1].forEach(dt => noise(o, t + dt, { d: 0.01, g: 0.4, freq: 3000, q: 4 }))
  };

  function noiseSource(){
    if(!noiseBuf){
      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for(let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    const src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    return src;
  }

  // A pitch glide through points [[time, freq], ...], with an optional low-pass filter.
  function sweep(dest, t, { pts, type = 'sine', g = 0.3, d = 0.3, a = 0.005, filter }){
    const o = ctx.createOscillator(), v = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(pts[0][1], t);
    for(const [dt, f] of pts.slice(1)) o.frequency.exponentialRampToValueAtTime(f, t + dt);
    v.gain.setValueAtTime(0.0001, t);
    v.gain.exponentialRampToValueAtTime(g, t + a);
    v.gain.exponentialRampToValueAtTime(0.0001, t + d);
    let node = o;
    if(filter){ const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filter; node = o.connect(f); }
    node.connect(v).connect(dest);
    o.start(t);
    o.stop(t + d + 0.03);
  }

  function synth(name, level){
    const c = ensure();
    if(!c || c.state !== 'running' || !R[name]) return;
    const g = c.createGain();
    g.gain.value = level;
    g.connect(master);
    R[name](g, c.currentTime + 0.01);
    setTimeout(() => g.disconnect(), 5000);
  }

  // CC0 clips play through <audio> so they also work when the page is opened from disk.
  const clipCache = new Map();
  function clip(url, level){
    let base = clipCache.get(url);
    if(!base){ base = new Audio(url); base.preload = 'auto'; clipCache.set(url, base); }
    const a = base.cloneNode();
    a.volume = VT.clamp(level, 0, 1);
    return a.play();
  }

  // Play a theme's sound for an event: 'start', 'pause', 'tick', 'warn', 'alarm', 'lap',
  // 'step', 'stepDown', 'target', 'allDone'.
  A.play = function(card, event, duck = 1){
    const theme = VT.themes[card.theme] || VT.themes.modern;
    const spec = theme.sounds[event];
    if(!spec) return;
    const level = A.level(card, duck);
    if(level <= 0) return;
    if(typeof spec === 'string'){ synth(spec, level); return; }
    if(!A.ready() && !spec.clip) return;
    clip(spec.clip, level).catch(() => synth(spec.fallback, level));
  };

  A.preview = card => A.unlock().then(() => A.play(card, 'alarm'));
  A.previewClip = name => A.unlock().then(() => {
    const s = VT.state.settings;
    if(!s.muted) clip(`sounds/${name}.mp3`, s.master).catch(() => {});
  });

  // Alarms loop until dismissed. Only the newest rings at full volume; older ones are ducked.
  const alarms = new Map();
  let alarmTimer = null;
  function ring(){
    let newest = null, at = -1;
    for(const [id, since] of alarms) if(since > at){ at = since; newest = id; }
    for(const id of [...alarms.keys()]){
      const card = VT.state.cards[id];
      if(!card){ alarms.delete(id); continue; }
      A.play(card, 'alarm', id === newest ? 1 : 0.25);
    }
    if(!alarms.size){ clearInterval(alarmTimer); alarmTimer = null; }
  }
  A.startAlarm = function(card){
    alarms.set(card.id, performance.now());
    ring();
    if(!alarmTimer) alarmTimer = setInterval(ring, 2400);
  };
  A.stopAlarm = function(id){
    alarms.delete(id);
    if(!alarms.size && alarmTimer){ clearInterval(alarmTimer); alarmTimer = null; }
  };
})(window.VT);
