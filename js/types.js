// Card types. Each type provides:
//   label, icon, defaults()        – name, add-menu icon, initial state
//   body(card)                     – inner HTML for the card body
//   status(card)                   – 'idle' | 'running' | 'paused' | 'alarming' | 'finished'
//   update(card, el, now, force)   – paint the card; called every frame while visible
//   act(card, action, btn)         – handle a [data-act] button inside the body
// and optionally tick(), remaining(), elapsed(), value(), pause(), resume(), reset(),
// hydrate() (fix up state after a reload), fields() / apply() (settings dialog).
(function(VT){
  const I = VT.icons, F = VT.fmt;
  const T = VT.types = {};
  const app = () => VT.app;

  function setText(node, text){ if(node.textContent !== text) node.textContent = text; }
  function setChars(el, n){ const v = String(n); if(el.style.getPropertyValue('--chars') !== v) el.style.setProperty('--chars', v); }
  function setProgress(el, p){ el.style.setProperty('--p', VT.clamp(p, 0, 1).toFixed(4)); }
  function btnHTML(icon, label){ return `${I[icon]}<span class="lbl">${label}</span>`; }
  function field(label, input, cls = ''){ return `<label class="field ${cls}"><span>${label}</span>${input}</label>`; }
  function check(name, label, on){ return `<label class="check"><input type="checkbox" name="${name}"${on ? ' checked' : ''}> ${label}</label>`; }

  // ---------- Timer ----------
  T.timer = {
    label: 'Timer', icon: 'timer',
    defaults: () => ({ duration: 300000, total: 300000, remaining: 300000, status: 'idle', endAt: null,
      finishedAt: null, dismissedAt: null, missed: 0, warned: false, overtime: true, tick: false, firstStartedAt: null }),
    body: () => `
      <button class="display" data-act="edit" aria-label="Change duration"></button>
      <div class="sub"></div>
      <div class="progress" aria-hidden="true"><i></i></div>
      <div class="controls">
        <button class="cbtn primary" data-act="toggle"></button>
        <button class="cbtn secondary" data-act="reset" aria-label="Reset">${I.reset}</button>
        <button class="cbtn secondary" data-act="plus1" aria-label="Add one minute">+1m</button>
      </div>
      <div class="presets" role="group" aria-label="Quick durations">
        ${[1, 5, 10, 25].map(m => `<button class="chip" data-act="preset" data-min="${m}">${m}m</button>`).join('')}
      </div>`,
    status: c => c.status,
    left(c, now){ return c.status === 'running' ? c.endAt - now : (c.status === 'idle' || c.status === 'paused') ? c.remaining : 0; },
    remaining(c, now){ return this.left(c, now); },
    elapsed(c, now){
      if(c.status === 'idle') return 0;
      let e = c.total - Math.max(0, this.left(c, now));
      if(c.status === 'alarming') e += now - c.finishedAt;
      if(c.status === 'finished' && c.dismissedAt) e += c.dismissedAt - c.finishedAt;
      return e;
    },
    reset(c){
      VT.audio.stopAlarm(c.id);
      Object.assign(c, { status: 'idle', total: c.duration, remaining: c.duration, endAt: null, finishedAt: null,
        dismissedAt: null, missed: 0, warned: false, firstStartedAt: null });
    },
    hydrate(c, now){
      if(c.status === 'running' && c.endAt <= now){
        Object.assign(c, { status: 'finished', finishedAt: c.endAt, dismissedAt: now, missed: now - c.endAt, remaining: 0 });
        VT.state.history.completed++;
      }
      // Still ringing when the page closed: keep ringing (sound starts once audio is unlocked).
      if(c.status === 'alarming') VT.audio.startAlarm(c);
    },
    tick(c, now){
      if(c.status !== 'running') return;
      const rem = c.endAt - now;
      if(c.tick){
        const s = Math.ceil(rem / 1000);
        if(c._sec !== undefined && s !== c._sec && rem > 0) VT.audio.play(c, 'tick');
        c._sec = s;
      }
      if(!c.warned && c.total >= 30000 && rem <= 10000 && rem > 0){
        c.warned = true;
        VT.audio.play(c, 'warn');
        VT.save();
      }
      if(rem <= 0){
        Object.assign(c, { status: 'alarming', finishedAt: c.endAt, remaining: 0, endAt: null });
        VT.state.history.completed++;
        VT.audio.startAlarm(c);
        app().changed(c);
        VT.say(`${c.title} finished`);
      }
    },
    pause(c){ if(c.status === 'running') this.act(c, 'toggle'); },
    resume(c){ if(c.status === 'paused') this.act(c, 'toggle'); },
    act(c, act, btn){
      const now = Date.now();
      switch(act){
        case 'toggle':
          if(c.status === 'running'){
            c.remaining = c.endAt - now; c.endAt = null; c.status = 'paused';
            VT.audio.play(c, 'pause');
          } else if(c.status === 'alarming'){
            VT.audio.stopAlarm(c.id);
            c.status = 'finished'; c.dismissedAt = now;
          } else {
            if(c.status === 'finished') this.reset(c);
            c.endAt = now + c.remaining; c.status = 'running';
            if(!c.firstStartedAt) c.firstStartedAt = now;
            VT.audio.play(c, 'start');
          }
          break;
        case 'reset': this.reset(c); break;
        case 'plus1':
          if(c.status === 'running'){ c.endAt += 60000; c.total += 60000; if(c.endAt - now > 10000) c.warned = false; }
          else if(c.status === 'alarming' || c.status === 'finished'){
            // Snooze: run one more minute.
            VT.audio.stopAlarm(c.id);
            Object.assign(c, { status: 'running', total: 60000, remaining: 60000, endAt: now + 60000,
              finishedAt: null, dismissedAt: null, missed: 0, warned: false });
          } else if(c.status === 'paused'){ c.remaining += 60000; c.total += 60000; }
          else { c.duration += 60000; c.total = c.remaining = c.duration; }
          break;
        case 'preset':
          c.duration = +btn.dataset.min * 60000;
          this.reset(c);
          break;
        case 'edit': app().openSettings(c); return;
      }
      app().changed(c);
    },
    update(c, el, now, force){
      const st = c.status;
      if(el._st !== st || force){
        el._st = st;
        const p = el.querySelector('[data-act=toggle]');
        if(st === 'running') p.innerHTML = btnHTML('pause', 'Pause');
        else if(st === 'alarming') p.innerHTML = btnHTML('stop', 'Dismiss');
        else p.innerHTML = btnHTML('play', st === 'paused' ? 'Resume' : 'Start');
        const plus = el.querySelector('[data-act=plus1]');
        const snooze = st === 'alarming' || st === 'finished';
        plus.textContent = snooze ? 'Snooze' : '+1m';
        plus.setAttribute('aria-label', snooze ? 'Snooze for one minute' : 'Add one minute');
      }
      const disp = el.querySelector('.display'), sub = el.querySelector('.sub');
      let text, prog, subText;
      if(st === 'alarming' || st === 'finished'){
        const over = (st === 'alarming' ? now : (c.dismissedAt || c.finishedAt)) - c.finishedAt;
        text = c.overtime && !c.missed && over >= 1000 ? '+' + F.clock(over, true) : '00:00';
        prog = 1;
        subText = st === 'alarming' ? 'Time’s up' : c.missed ? `Missed by ${F.short(c.missed)}` : 'Done';
      } else {
        const rem = this.left(c, now);
        text = F.clock(rem);
        prog = 1 - rem / c.total;
        subText = st === 'idle' ? F.human(c.duration) : `of ${F.clock(c.total)}`;
        el.classList.toggle('warn', st === 'running' && c.total >= 30000 && rem <= 10000);
      }
      setText(disp, text);
      setChars(disp, text.length);
      setText(sub, subText);
      setProgress(el, prog);
    },
    fields(c){
      const s = Math.round(c.duration / 1000);
      return `<div class="field-row">
          ${field('Hours', `<input type="number" name="h" min="0" max="99" value="${Math.floor(s / 3600)}" inputmode="numeric">`)}
          ${field('Minutes', `<input type="number" name="m" min="0" max="59" value="${Math.floor(s % 3600 / 60)}" inputmode="numeric">`)}
          ${field('Seconds', `<input type="number" name="s" min="0" max="59" value="${s % 60}" inputmode="numeric">`)}
        </div>
        ${check('overtime', 'Count overtime after zero', c.overtime)}
        ${check('tick', 'Tick every second', c.tick)}`;
    },
    apply(c, fd){
      const d = ((+fd.get('h') || 0) * 3600 + (+fd.get('m') || 0) * 60 + (+fd.get('s') || 0)) * 1000;
      c.overtime = fd.has('overtime');
      c.tick = fd.has('tick');
      if(d >= 1000 && d !== c.duration){ c.duration = d; this.reset(c); }
    }
  };

  // ---------- Stopwatch ----------
  T.stopwatch = {
    label: 'Stopwatch', icon: 'stopwatch',
    defaults: () => ({ status: 'idle', startedAt: null, acc: 0, laps: [], firstStartedAt: null }),
    body: () => `
      <div class="display"><span class="main"></span><small class="cs"></small></div>
      <div class="sub"></div>
      <ol class="laps" aria-label="Recent laps"></ol>
      <div class="controls">
        <button class="cbtn primary" data-act="toggle"></button>
        <button class="cbtn secondary" data-act="lapreset"></button>
      </div>`,
    status: c => c.status,
    time(c, now){ return c.acc + (c.status === 'running' ? now - c.startedAt : 0); },
    elapsed(c, now){ return this.time(c, now); },
    reset(c){ Object.assign(c, { status: 'idle', startedAt: null, acc: 0, laps: [], firstStartedAt: null }); },
    pause(c){ if(c.status === 'running') this.act(c, 'toggle'); },
    resume(c){ if(c.status === 'paused') this.act(c, 'toggle'); },
    act(c, act){
      const now = Date.now();
      if(act === 'toggle'){
        if(c.status === 'running'){ c.acc += now - c.startedAt; c.startedAt = null; c.status = 'paused'; VT.audio.play(c, 'pause'); }
        else { c.startedAt = now; c.status = 'running'; if(!c.firstStartedAt) c.firstStartedAt = now; VT.audio.play(c, 'start'); }
      } else if(act === 'lapreset'){
        if(c.status === 'running'){ c.laps.push(this.time(c, now)); VT.audio.play(c, 'lap'); }
        else this.reset(c);
      }
      app().changed(c);
    },
    update(c, el, now, force){
      const st = c.status;
      if(el._st !== st || force){
        el._st = st;
        el.querySelector('[data-act=toggle]').innerHTML = st === 'running' ? btnHTML('pause', 'Pause') : btnHTML('play', st === 'paused' ? 'Resume' : 'Start');
        const s = el.querySelector('[data-act=lapreset]');
        s.innerHTML = st === 'running' ? btnHTML('lap', 'Lap') : btnHTML('reset', 'Reset');
        s.disabled = st === 'idle';
      }
      const t = F.watch(this.time(c, now));
      const disp = el.querySelector('.display');
      setText(disp.firstElementChild, t.main);
      setText(disp.lastElementChild, '.' + t.cs);
      setChars(disp, t.main.length + 1.5);
      setText(el.querySelector('.sub'), c.laps.length ? `${c.laps.length} lap${c.laps.length > 1 ? 's' : ''}` : st === 'idle' ? 'Ready' : ' ');
      if(el._laps !== c.laps.length || force){
        el._laps = c.laps.length;
        el.querySelector('.laps').innerHTML = c.laps.map((v, i) => ({ v, i, d: v - (c.laps[i - 1] || 0) })).slice(-3).reverse()
          .map(l => `<li><span>Lap ${l.i + 1}</span><span>${F.watch(l.d).main}.${F.watch(l.d).cs}</span></li>`).join('');
      }
    },
    fields(c){
      const rows = c.laps.map((v, i) => { const d = F.watch(v - (c.laps[i - 1] || 0)), tt = F.watch(v); return `<li><span>Lap ${i + 1}</span><span>${d.main}.${d.cs}</span><span class="muted">${tt.main}.${tt.cs}</span></li>`; }).join('');
      return c.laps.length
        ? `<p class="field-label">Laps</p><ol class="lap-table">${rows}</ol>${check('clearLaps', 'Clear laps', false)}`
        : '<p class="muted">No laps yet. Press Lap while the stopwatch is running.</p>';
    },
    apply(c, fd){ if(fd.has('clearLaps')) c.laps = []; }
  };

  // ---------- Counter ----------
  T.counter = {
    label: 'Counter', icon: 'counter',
    defaults: () => ({ value: 0, start: 0, step: 1, target: null, allowNegative: false, status: 'idle' }),
    body: () => `
      <div class="counter-row">
        <button class="cbtn round" data-act="dec" data-hold aria-label="Decrease">${I.minus}</button>
        <div class="display" aria-live="polite"></div>
        <button class="cbtn round primary" data-act="inc" data-hold aria-label="Increase">${I.plus}</button>
      </div>
      <div class="sub"></div>
      <div class="progress" aria-hidden="true"><i></i></div>
      <div class="controls">
        <button class="cbtn secondary" data-act="reset">${btnHTML('reset', 'Reset')}</button>
      </div>`,
    status: c => c.status,
    value: c => c.value,
    reached(c){
      if(c.target === null) return false;
      return c.target >= c.start ? c.value >= c.target : c.value <= c.target;
    },
    reset(c){ c.value = c.start; c.status = 'idle'; },
    act(c, act){
      if(act === 'reset'){ this.reset(c); app().changed(c); return; }
      const dir = act === 'inc' ? 1 : -1;
      let v = c.value + dir * c.step;
      if(!c.allowNegative && v < 0) v = 0;
      if(v === c.value) return;
      c.value = v;
      const was = c.status;
      c.status = this.reached(c) ? 'finished' : 'idle';
      if(c.status === 'finished' && was !== 'finished'){
        VT.state.history.completed++;
        VT.audio.play(c, 'target');
        VT.say(`${c.title} reached ${c.target}`);
      } else VT.audio.play(c, dir > 0 ? 'step' : 'stepDown');
      if(was !== c.status) app().changed(c); else VT.save();
    },
    update(c, el, now, force){
      const disp = el.querySelector('.display');
      const text = String(c.value);
      setText(disp, text);
      setChars(disp, Math.max(2, text.length));
      setText(el.querySelector('.sub'), c.target !== null ? (c.status === 'finished' ? `Target ${c.target} reached` : `Target ${c.target}`) : `Step ${c.step}`);
      el.classList.toggle('no-progress', c.target === null);
      if(c.target !== null && c.target !== c.start) setProgress(el, (c.value - c.start) / (c.target - c.start));
      el.querySelector('[data-act=dec]').disabled = !c.allowNegative && c.value <= 0;
    },
    fields(c){
      return `<div class="field-row">
          ${field('Start at', `<input type="number" name="start" value="${c.start}" step="any">`)}
          ${field('Step', `<input type="number" name="step" value="${c.step}" min="1" step="any">`)}
          ${field('Target', `<input type="number" name="target" value="${c.target ?? ''}" placeholder="None" step="any">`)}
        </div>
        ${check('allowNegative', 'Allow negative numbers', c.allowNegative)}`;
    },
    apply(c, fd){
      const start = Number(fd.get('start')) || 0;
      if(c.value === c.start) c.value = start;
      c.start = start;
      c.step = Math.abs(Number(fd.get('step'))) || 1;
      const t = fd.get('target');
      c.target = t === '' || t === null ? null : Number(t);
      c.allowNegative = fd.has('allowNegative');
      c.status = this.reached(c) ? 'finished' : 'idle';
    }
  };

  // ---------- Voice Tally (a copy of the standalone Voice Tally app's counting logic) ----------
  // speechSynthesis is one queue per page, so only one Voice Tally card speaks at a time.
  const speech = 'speechSynthesis' in window;
  const rt = {}; // per-card runtime: { gen, timer }
  const run = id => rt[id] || (rt[id] = { gen: 0, timer: null, utter: null });

  function parseBig(str){
    str = String(str ?? '').trim().replace(/[,\s_]/g, '');
    if(!/^-?\d+$/.test(str)) return null;
    try{ return BigInt(str); }catch(e){ return null; }
  }
  function groupDigits(s){
    const neg = s.startsWith('-'), d = neg ? s.slice(1) : s;
    let out = '';
    for(let i = 0; i < d.length; i++){ if(i > 0 && (d.length - i) % 3 === 0) out += ' '; out += d[i]; }
    return (neg ? '-' : '') + out;
  }

  T.voice = {
    label: 'Voice Tally', icon: 'voice',
    defaults: () => ({ start: '0', target: '100', step: '1', pace: 150, voiceURI: '', rate: 1, pitch: 1,
      current: '0', status: 'idle', acc: 0, runStartedAt: null }),
    body: () => `
      <div class="display odo"></div>
      <div class="sub"></div>
      <div class="progress" aria-hidden="true"><i></i></div>
      <div class="controls">
        <button class="cbtn primary" data-act="toggle"></button>
        <button class="cbtn secondary" data-act="reset" aria-label="Reset">${I.reset}</button>
      </div>`,
    status: c => c.status,
    value: c => Number(c.current),
    elapsed(c, now){ return c.acc + (c.status === 'running' ? now - c.runStartedAt : 0); },
    hydrate(c){ if(c.status === 'running'){ c.status = 'paused'; c.runStartedAt = null; } },
    stop(c){
      const r = run(c.id);
      r.gen++;
      clearTimeout(r.timer);
      r.utter = null;
      if(speech) speechSynthesis.cancel();
      if(c.status === 'running'){ c.acc += Date.now() - c.runStartedAt; c.runStartedAt = null; }
    },
    reset(c){ this.stop(c); c.status = 'idle'; c.current = c.start; c.acc = 0; },
    pause(c){ if(c.status === 'running'){ this.stop(c); c.status = 'paused'; app().changed(c); } },
    resume(c){ if(c.status === 'paused') this.act(c, 'toggle'); },
    begin(c){
      // Pause any other Voice Tally card that's speaking.
      for(const o of Object.values(VT.state.cards)) if(o.type === 'voice' && o.id !== c.id && o.status === 'running') this.pause(o);
      c.status = 'running';
      c.runStartedAt = Date.now();
      this.speak(c);
    },
    speak(c){
      const r = run(c.id);
      if(c.status !== 'running') return;
      const gen = r.gen;
      const u = new SpeechSynthesisUtterance(c.current);
      u.rate = c.rate; u.pitch = c.pitch;
      u.volume = VT.clamp(VT.audio.level(c), 0, 1);
      const v = speechSynthesis.getVoices().find(v => v.voiceURI === c.voiceURI);
      if(v) u.voice = v;
      const advance = () => {
        if(gen !== r.gen || c.status !== 'running') return;
        const cur = BigInt(c.current), tgt = BigInt(c.target), mag = BigInt(c.step);
        const step = tgt >= BigInt(c.start) ? mag : -mag;
        if(step > 0n ? cur >= tgt : cur <= tgt){
          this.stop(c);
          c.status = 'finished';
          VT.state.history.completed++;
          VT.audio.play(c, 'target');
          app().changed(c);
          return;
        }
        r.timer = setTimeout(() => {
          if(gen !== r.gen || c.status !== 'running') return;
          let next = cur + step;
          if(step > 0n && next > tgt) next = tgt;
          if(step < 0n && next < tgt) next = tgt;
          c.current = next.toString();
          VT.save();
          this.speak(c);
        }, c.pace);
      };
      u.onend = advance;
      u.onerror = advance;
      r.utter = u; // keep a reference; Chrome can garbage-collect it and never fire onend
      speechSynthesis.speak(u);
    },
    act(c, act){
      if(act === 'reset'){ this.reset(c); app().changed(c); return; }
      if(!speech){ VT.toast('This browser can’t speak numbers (no speech synthesis).'); return; }
      if(c.status === 'running'){ this.stop(c); c.status = 'paused'; }
      else if(c.status === 'paused') this.begin(c);
      else { this.stop(c); c.current = c.start; c.acc = 0; this.begin(c); }
      app().changed(c);
    },
    update(c, el, now, force){
      const st = c.status;
      if(el._st !== st || force){
        el._st = st;
        el.querySelector('[data-act=toggle]').innerHTML = st === 'running' ? btnHTML('pause', 'Pause')
          : btnHTML('play', st === 'paused' ? 'Resume' : st === 'finished' ? 'Again' : 'Start');
      }
      const disp = el.querySelector('.display');
      const text = groupDigits(c.current);
      if(disp.textContent !== text){
        disp.textContent = text;
        if(st === 'running' && !VT.reducedMotion()) disp.animate([{ transform: 'translateY(-12%)', opacity: 0.4 }, { transform: 'none', opacity: 1 }], { duration: 160, easing: 'ease-out' });
      }
      setChars(disp, Math.max(3, text.length));
      setText(el.querySelector('.sub'), st === 'finished' ? `Reached ${c.target}` : `${c.start} → ${c.target}, step ${c.step}`);
      const s = BigInt(c.start), t = BigInt(c.target), cur = BigInt(c.current);
      setProgress(el, t === s ? 1 : Number((cur - s) * 10000n / (t - s)) / 10000);
    },
    fields(c){
      const voices = speech ? speechSynthesis.getVoices() : [];
      const opts = ['<option value="">Browser default</option>']
        .concat(voices.map(v => `<option value="${VT.esc(v.voiceURI)}"${v.voiceURI === c.voiceURI ? ' selected' : ''}>${VT.esc(v.name)} (${VT.esc(v.lang)})</option>`)).join('');
      return `<div class="field-row">
          ${field('Start at', `<input type="text" name="start" value="${VT.esc(c.start)}" inputmode="numeric" required>`)}
          ${field('Count to', `<input type="text" name="target" value="${VT.esc(c.target)}" inputmode="numeric" required>`)}
          ${field('Step by', `<input type="text" name="step" value="${VT.esc(c.step)}" inputmode="numeric" required>`)}
          ${field('Pace (ms)', `<input type="number" name="pace" value="${c.pace}" min="0" inputmode="numeric">`)}
        </div>
        ${field('Voice', `<select name="voiceURI">${opts}</select>`)}
        <div class="field-row">
          ${field('Speed', `<input type="range" name="rate" min="0.5" max="2" step="0.05" value="${c.rate}">`)}
          ${field('Pitch', `<input type="range" name="pitch" min="0" max="2" step="0.05" value="${c.pitch}">`)}
        </div>
        ${speech ? '' : '<p class="muted">This browser doesn’t support speech synthesis.</p>'}`;
    },
    apply(c, fd){
      const s = parseBig(fd.get('start')), t = parseBig(fd.get('target')), st = parseBig(fd.get('step'));
      if(s === null || t === null || st === null || st === 0n){ VT.toast('Check the start, target and step: whole numbers only, and step can’t be 0.'); return; }
      const changed = s.toString() !== c.start || t.toString() !== c.target || (st < 0n ? -st : st).toString() !== c.step;
      c.start = s.toString(); c.target = t.toString(); c.step = (st < 0n ? -st : st).toString();
      c.pace = Math.max(0, parseInt(fd.get('pace'), 10) || 0);
      c.voiceURI = fd.get('voiceURI') || '';
      c.rate = +fd.get('rate'); c.pitch = +fd.get('pitch');
      if(changed) this.reset(c);
    }
  };

  // ---------- Sleeps: nights until a date ----------
  // Counts calendar days, so Christmas Eve is "1 sleep" whatever the time.
  function easter(y){
    const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
    const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
    const n = h + l - 7 * m + 114;
    return [Math.floor(n / 31), n % 31 + 1];
  }
  const EVENTS = {
    christmas: { name: 'Christmas', md: [12, 25] },
    christmasEve: { name: 'Christmas Eve', md: [12, 24] },
    newYear: { name: 'New Year’s Day', md: [1, 1] },
    valentines: { name: 'Valentine’s Day', md: [2, 14] },
    easter: { name: 'Easter Sunday', md: easter },
    halloween: { name: 'Halloween', md: [10, 31] },
    bonfire: { name: 'Bonfire Night', md: [11, 5] },
    custom: { name: 'My day' }
  };
  const dayNum = (y, m, d) => Date.UTC(y, m - 1, d) / 864e5;
  const todayNum = now => { const t = new Date(now); return dayNum(t.getFullYear(), t.getMonth() + 1, t.getDate()); };

  T.sleeps = {
    label: 'Sleeps', plural: 'Sleeps', one: 'sleeps countdown', many: 'sleeps countdowns', icon: 'moon', events: EVENTS,
    defaults: () => ({ event: 'christmas', date: '', yearly: true, status: 'idle', celebrated: null }),
    // The next occurrence as [year, month, day], or null if a one-off date is unset.
    next(c, now){
      const ev = EVENTS[c.event] || EVENTS.christmas;
      const y = new Date(now).getFullYear(), today = todayNum(now);
      let md = ev.md;
      if(c.event === 'custom'){
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(c.date || '');
        if(!m) return null;
        if(!c.yearly) return [+m[1], +m[2], +m[3]];
        md = [+m[2], +m[3]];
      }
      const at = yy => typeof md === 'function' ? md(yy) : md;
      let [mm, dd] = at(y);
      if(dayNum(y, mm, dd) >= today) return [y, mm, dd];
      [mm, dd] = at(y + 1);
      return [y + 1, mm, dd];
    },
    sleeps(c, now){ const n = this.next(c, now); return n ? dayNum(...n) - todayNum(now) : null; },
    body: () => `
      <button class="display" data-act="edit" aria-label="Choose the day"></button>
      <div class="sub"><span class="s-what"></span><span class="s-when"></span></div>`,
    status(c){ return c.status; },
    remaining(c, now){ const n = this.next(c, now); return n ? new Date(n[0], n[1] - 1, n[2]).getTime() - now : Infinity; },
    value(c){ return -(this.sleeps(c, Date.now()) ?? Infinity); },
    tick(c, now){
      const s = this.sleeps(c, now);
      const st = s === null ? 'idle' : s <= 0 ? 'finished' : 'idle';
      if(st !== c.status){
        c.status = st;
        const key = (this.next(c, now) || []).join('-');
        if(st === 'finished' && c.celebrated !== key && s === 0){
          c.celebrated = key;
          VT.state.history.completed++;
          VT.audio.play(c, 'target');
          VT.say(`It’s ${this.name(c)}!`);
        }
        app().changed(c);
      }
    },
    name(c){ return c.event === 'custom' ? (c.title || EVENTS.custom.name) : EVENTS[c.event].name; },
    act(c, act){ if(act === 'edit') app().openSettings(c); },
    update(c, el, now){
      const s = this.sleeps(c, now), n = this.next(c, now);
      const disp = el.querySelector('.display');
      const text = s === null ? '?' : s === 0 ? 'Today!' : s < 0 ? 'Done' : String(s);
      setText(disp, text);
      setChars(disp, Math.max(2.4, text.length));
      const what = s === null ? 'Pick a date' : s === 0 ? `It’s ${this.name(c)}!` : s < 0 ? `${this.name(c)} has passed`
        : `${s === 1 ? 'sleep' : 'sleeps'} until ${this.name(c)}`;
      setText(el.querySelector('.s-what'), what);
      setText(el.querySelector('.s-when'), n && s > 0 ? ' · ' + new Date(n[0], n[1] - 1, n[2]).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' }) : '');
      el.classList.add('no-progress');
    },
    fields(c){
      const opts = Object.entries(EVENTS).map(([k, v]) => `<option value="${k}"${k === c.event ? ' selected' : ''}>${k === 'custom' ? 'Another date…' : VT.esc(v.name)}</option>`).join('');
      return `${field('Counting down to', `<select name="event">${opts}</select>`)}
        <div class="field-row sleeps-custom">
          ${field('Date', `<input type="date" name="date" value="${VT.esc(c.date || '')}">`)}
        </div>
        ${check('yearly', 'Repeat every year (birthdays, anniversaries)', c.yearly)}
        ${check('matchTheme', 'Use the holiday\u2019s theme (Christmas, Halloween, Easter\u2026)', c.matchTheme !== false)}
        <p class="muted small">For “Another date”, the card’s name is used as the day’s name.</p>`;
    },
    apply(c, fd, ctx = {}){
      const was = this.name(c), ev = fd.get('event');
      c.event = EVENTS[ev] ? ev : 'christmas';
      c.date = fd.get('date') || '';
      c.yearly = fd.has('yearly');
      // Keep the title in step with the event unless the user renamed it.
      if(c.event !== 'custom' && (c.title === was || Object.values(EVENTS).some(e => e.name === c.title))) c.title = EVENTS[c.event].name;
      // Pair with the holiday theme, unless the theme was changed in this same dialog.
      c.matchTheme = fd.has('matchTheme');
      if(c.matchTheme && VT.holidayTheme[c.event] && c.theme === ctx.prevTheme) c.theme = VT.holidayTheme[c.event];
      c.status = 'idle';
      c.celebrated = null;
    }
  };

  // ---------- Card Stats: a counter of the other cards ----------
  const TILES = [
    ['total', 'Cards'], ['running', 'Running'], ['paused', 'Paused'],
    ['idle', 'Idle'], ['finished', 'Ended'], ['ringing', 'Ringing']
  ];
  T.stats = {
    label: 'Card Stats', icon: 'stats',
    defaults: () => ({ status: 'idle', allDone: true }),
    body: () => `
      <div class="stats">${TILES.map(([k, l]) => `<div class="stat" data-k="${k}"><b>0</b><span>${l}</span></div>`).join('')}</div>
      <div class="sub stats-types"></div>
      <div class="sub stats-history"></div>`,
    status: () => 'idle',
    act(){},
    update(c, el){
      const n = app().counts();
      for(const [k] of TILES){
        const b = el.querySelector(`[data-k=${k}] b`);
        setText(b, String(n[k]));
        b.parentElement.classList.toggle('hot', k === 'ringing' && n.ringing > 0);
      }
      const types = Object.entries(n.byType).filter(([, v]) => v).map(([t, v]) => `${v} ${v > 1 ? (T[t].many || T[t].label.toLowerCase() + 's') : (T[t].one || T[t].label.toLowerCase())}`);
      setText(el.querySelector('.stats-types'), types.join(' · ') || 'No cards yet');
      const h = VT.state.history;
      setText(el.querySelector('.stats-history'), `All time: ${h.added} added · ${h.removed} removed · ${h.completed} completed`);
    },
    fields(c){ return `${check('allDone', 'Chime when everything running has ended', c.allDone)}${check('resetHistory', 'Reset the all-time totals', false)}`; },
    apply(c, fd){
      c.allDone = fd.has('allDone');
      if(fd.has('resetHistory')) VT.state.history = { added: 0, removed: 0, completed: 0 };
    }
  };

  VT.typeOrder = ['timer', 'stopwatch', 'counter', 'voice', 'sleeps', 'stats'];
})(window.VT);
