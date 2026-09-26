// App shell: state, persistence, grid layout, ticker, sorting/filtering, drag and resize.
(function(VT){
  const KEY = 'counter-counter-v1';
  const I = VT.icons, T = VT.types;
  const $ = s => document.querySelector(s);
  const grid = $('#grid');
  const els = new Map(); // card id -> element
  const BASE_TITLE = document.title;

  const DEFAULT_SETTINGS = { master: 0.8, muted: false, defaultTheme: 'modern', density: 'auto', sort: 'manual',
    keepSorted: false, filter: 'all', typeFilter: 'all', max: 24 };
  const SIZES = { '1x1': 'S', '2x1': 'M', '2x2': 'L', '3x2': 'XL', '1x2': 'Tall', '3x1': 'Wide' };
  const PRESETS = [
    { label: 'Tea', min: 4 }, { label: 'Eggs', min: 7 }, { label: 'Pasta', min: 10 }, { label: 'Pomodoro', min: 25 }
  ];

  // ---------- State ----------
  // Saved state is untrusted: another page on the same origin (e.g. other GitHub Pages
  // projects) can write to localStorage. load() rebuilds everything from known-good values,
  // keeping a saved field only when it has the same type as the card's default.
  const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  const ID_RE = /^c[a-z0-9]{4,32}$/;
  const STATUSES = ['idle', 'running', 'paused', 'alarming', 'finished'];
  const isNum = v => typeof v === 'number' && Number.isFinite(v);
  const numIn = (v, lo, hi, dflt) => isNum(v) ? VT.clamp(v, lo, hi) : dflt;
  const oneOf = (v, list, dflt) => list.includes(v) ? v : dflt;

  function cleanField(v, dflt){
    if(dflt === null) return v === null || isNum(v) || (typeof v === 'string' && /^[\d-]{1,20}$/.test(v)) ? v : null;
    if(Array.isArray(dflt)) return Array.isArray(v) ? v.filter(isNum).slice(0, 1000) : dflt;
    if(typeof dflt === 'number') return isNum(v) ? v : dflt;
    if(typeof dflt === 'boolean') return typeof v === 'boolean' ? v : dflt;
    if(typeof dflt === 'string') return typeof v === 'string' ? v.slice(0, 200) : dflt;
    return dflt;
  }

  function cleanCard(c){
    if(!c || typeof c !== 'object' || typeof c.type !== 'string' || !own(T, c.type) || typeof c.id !== 'string' || !ID_RE.test(c.id)) return null;
    const type = T[c.type], out = {
      id: c.id, type: c.type,
      title: typeof c.title === 'string' && c.title.trim() ? c.title.slice(0, 40) : type.label,
      theme: typeof c.theme === 'string' && own(VT.themes, c.theme) ? c.theme : 'modern',
      volume: numIn(c.volume, 0, 1, 0.8), muted: c.muted === true,
      span: { c: Math.round(numIn(c.span && c.span.c, 1, 3, 1)), r: Math.round(numIn(c.span && c.span.r, 1, 2, 1)) },
      createdAt: numIn(c.createdAt, 0, 8.64e15, Date.now())
    };
    for(const [k, dflt] of Object.entries(type.defaults())) out[k] = cleanField(c[k], dflt);
    out.status = oneOf(out.status, STATUSES, 'idle');
    if(out.type === 'voice') for(const k of ['start', 'target', 'step', 'current']) if(!/^-?\d{1,400}$/.test(out[k])) out[k] = type.defaults()[k];
    if(out.type === 'voice' && out.step === '0') out.step = '1';
    if(out.type === 'sleeps'){
      if(!own(T.sleeps.events, out.event)) out.event = 'christmas';
      if(!/^(\d{4}-\d{2}-\d{2})?$/.test(out.date)) out.date = '';
    }
    return out;
  }

  function load(){
    try{
      const s = JSON.parse(localStorage.getItem(KEY));
      if(!s || typeof s !== 'object' || !s.cards || typeof s.cards !== 'object') return null;
      const cards = {};
      for(const raw of Object.values(s.cards)){
        const c = cleanCard(raw);
        if(c && !own(cards, c.id)) cards[c.id] = c;
      }
      const order = (Array.isArray(s.order) ? s.order : []).filter((id, i, a) => typeof id === 'string' && own(cards, id) && a.indexOf(id) === i);
      for(const id of Object.keys(cards)) if(!order.includes(id)) order.push(id);

      const raw = s.settings && typeof s.settings === 'object' ? s.settings : {};
      const settings = {};
      for(const [k, dflt] of Object.entries(DEFAULT_SETTINGS)) settings[k] = cleanField(raw[k], dflt);
      const sorts = [...document.querySelectorAll('#sortSel option')].map(o => o.value);
      settings.master = numIn(settings.master, 0, 1, DEFAULT_SETTINGS.master);
      settings.defaultTheme = own(VT.themes, settings.defaultTheme) ? settings.defaultTheme : 'modern';
      settings.density = oneOf(settings.density, ['auto', 'comfy', 'compact'], 'auto');
      settings.sort = oneOf(settings.sort, sorts, 'manual');
      settings.filter = oneOf(settings.filter, ['all', 'running', 'paused', 'finished'], 'all');
      settings.typeFilter = settings.typeFilter === 'all' || (own(T, settings.typeFilter) && settings.typeFilter !== 'stats') ? settings.typeFilter : 'all';
      settings.max = oneOf(settings.max, [24, 48], 24);

      const h = s.history && typeof s.history === 'object' ? s.history : {};
      const history = { added: numIn(h.added, 0, 1e9, 0), removed: numIn(h.removed, 0, 1e9, 0), completed: numIn(h.completed, 0, 1e9, 0) };
      return { cards, order, settings, history };
    }catch(e){ return null; }
  }
  const S = VT.state = load() || { cards: {}, order: [], settings: { ...DEFAULT_SETTINGS }, history: { added: 0, removed: 0, completed: 0 } };

  let saveTimer = null;
  function flush(){
    clearTimeout(saveTimer); saveTimer = null;
    // Keys starting with _ are runtime-only.
    try{ localStorage.setItem(KEY, JSON.stringify(S, (k, v) => k[0] === '_' ? undefined : v)); }catch(e){}
  }
  VT.save = () => { if(!saveTimer) saveTimer = setTimeout(flush, 400); };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if(document.hidden) flush(); });

  // ---------- Counts (shared by the stats card and the ticker) ----------
  let countsCache = null;
  function counts(){
    if(countsCache) return countsCache;
    const n = { total: 0, running: 0, paused: 0, idle: 0, finished: 0, ringing: 0, byType: {} };
    for(const c of Object.values(S.cards)){
      if(c.type === 'stats') continue;
      n.total++;
      n.byType[c.type] = (n.byType[c.type] || 0) + 1;
      const st = T[c.type].status(c);
      if(st === 'alarming'){ n.finished++; n.ringing++; }
      else n[st]++;
    }
    return countsCache = n;
  }

  // ---------- App API used by card types ----------
  VT.app = {
    counts,
    changed(card){
      countsCache = null;
      const el = els.get(card.id);
      if(el){ el.dataset.state = T[card.type].status(card); T[card.type].update(card, el, Date.now(), true); }
      applyFilter();
      if(S.settings.keepSorted && S.settings.sort !== 'manual') applyOrder();
      VT.save();
    },
    openSettings
  };

  // ---------- Card elements ----------
  function volIcon(card){ return card.muted || card.volume === 0 ? I.mute : card.volume < 0.5 ? I.volLow : I.vol; }

  function buildCard(card){
    const el = document.createElement('article');
    el.className = 'card';
    el.dataset.id = card.id;
    el.dataset.type = card.type;
    el.tabIndex = 0;
    el.innerHTML = `
      <div class="art" aria-hidden="true"></div>
      <header class="card-head">
        <button class="icon-btn handle" aria-label="Move card" aria-describedby="dragHelp">${I.handle}</button>
        <span class="dot" aria-hidden="true"></span>
        <input class="card-title" maxlength="40" aria-label="Card name" spellcheck="false">
        <button class="icon-btn vol-btn" data-act="vol" aria-label="Volume" aria-haspopup="true" aria-expanded="false"></button>
        <button class="icon-btn menu-btn" data-act="menu" aria-label="Card options" aria-haspopup="true" aria-expanded="false">${I.more}</button>
      </header>
      <div class="card-body">${T[card.type].body(card)}</div>
      <footer class="card-foot">
        <button class="icon-btn mute-btn" data-act="mute" aria-label="Mute card"></button>
        <input type="range" class="vol-range" min="0" max="100" aria-label="Card volume">
      </footer>
      <div class="grip" aria-hidden="true"></div>`;
    els.set(card.id, el);
    syncChrome(card, el);
    return el;
  }

  function syncChrome(card, el){
    el.className = el.className.replace(/\btheme-\S+/g, '').trim() + ' theme-' + card.theme;
    el.querySelector('.art').innerHTML = VT.themes[card.theme].art(card);
    const title = el.querySelector('.card-title');
    if(document.activeElement !== title){ title.value = card.title; title.setAttribute('value', card.title); }
    el.setAttribute('aria-label', `${card.title}, ${T[card.type].label}`);
    el.querySelector('.handle').setAttribute('aria-label', `Move ${card.title}`);
    syncVolume(card, el);
    el.dataset.state = T[card.type].status(card);
    setSpan(card, el);
    T[card.type].update(card, el, Date.now(), true);
  }

  function syncVolume(card, el){
    el.querySelector('.vol-btn').innerHTML = volIcon(card);
    const mb = el.querySelector('.mute-btn');
    mb.innerHTML = volIcon(card);
    mb.setAttribute('aria-pressed', String(card.muted));
    el.querySelector('.vol-range').value = Math.round(card.volume * 100);
  }

  // ---------- Layout: density tiers and spans ----------
  function tierFor(n){
    const d = S.settings.density;
    if(n <= 1) return 'hero';
    if(d === 'comfy') return 'large';
    if(d === 'compact') return 'mini';
    return n <= 4 ? 'large' : n <= 9 ? 'medium' : n <= 16 ? 'compact' : 'mini';
  }
  function colCount(){ return getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length || 1; }
  function setSpan(card, el){
    const cols = grid.dataset.tier === 'hero' ? 1 : colCount();
    el.style.setProperty('--c', Math.min(card.span.c, cols));
    el.style.setProperty('--r', card.span.r);
  }
  function applyLayout(){
    const visible = [...els.values()].filter(e => !e.hidden).length;
    grid.dataset.tier = tierFor(visible);
    for(const [id, el] of els) setSpan(S.cards[id], el);
    const total = Object.keys(S.cards).length;
    $('#empty').hidden = total > 0;
    $('#noMatch').hidden = total === 0 || visible > 0;
  }
  new ResizeObserver(() => { for(const [id, el] of els) setSpan(S.cards[id], el); }).observe(grid);

  // ---------- Filtering ----------
  function matches(card){
    if(card.type === 'stats') return true; // the stats card always stays in view
    const f = S.settings.filter, tf = S.settings.typeFilter, st = T[card.type].status(card);
    if(tf !== 'all' && card.type !== tf) return false;
    if(f === 'running') return st === 'running';
    if(f === 'paused') return st === 'paused';
    if(f === 'finished') return st === 'finished' || st === 'alarming';
    return true;
  }
  function applyFilter(){
    let changed = false;
    for(const [id, el] of els){
      const hide = !matches(S.cards[id]);
      if(el.hidden !== hide){ el.hidden = hide; changed = true; }
    }
    if(changed) applyLayout();
  }

  // ---------- Sorting ----------
  const RANK = { alarming: 0, running: 1, paused: 2, idle: 3, finished: 4 };
  const key = (c, fn, fallback) => T[c.type][fn] ? T[c.type][fn](c, Date.now()) : fallback;
  const SORTS = {
    newest: (a, b) => b.createdAt - a.createdAt,
    oldest: (a, b) => a.createdAt - b.createdAt,
    remaining: (a, b) => key(a, 'remaining', Infinity) - key(b, 'remaining', Infinity),
    elapsed: (a, b) => key(b, 'elapsed', 0) - key(a, 'elapsed', 0),
    attention: (a, b) => RANK[T[a.type].status(a)] - RANK[T[b.type].status(b)],
    name: (a, b) => a.title.localeCompare(b.title, undefined, { numeric: true }),
    type: (a, b) => VT.typeOrder.indexOf(a.type) - VT.typeOrder.indexOf(b.type),
    theme: (a, b) => VT.themes[a.theme].name.localeCompare(VT.themes[b.theme].name),
    value: (a, b) => key(b, 'value', -Infinity) - key(a, 'value', -Infinity)
  };
  function sortedIds(){
    const cmp = SORTS[S.settings.sort];
    if(!cmp) return S.order.slice();
    const pos = new Map(S.order.map((id, i) => [id, i]));
    return S.order.map(id => S.cards[id]).sort((a, b) => {
      const sa = a.type === 'stats', sb = b.type === 'stats';
      if(sa !== sb) return sa ? -1 : 1; // stats cards lead every sort
      const r = cmp(a, b);
      return (r || 0) || pos.get(a.id) - pos.get(b.id);
    }).map(c => c.id);
  }
  function applyOrder(){
    if(drag) return;
    const ids = sortedIds();
    const current = [...grid.children].map(e => e.dataset.id);
    if(ids.join() === current.join()) return;
    VT.flip(grid, () => ids.forEach(id => grid.appendChild(els.get(id))));
  }
  function setSort(v){
    S.settings.sort = v;
    $('#sortSel').value = v;
    applyOrder();
    VT.save();
  }
  setInterval(() => { if(S.settings.keepSorted && S.settings.sort !== 'manual') applyOrder(); }, 5000);

  // ---------- Adding, removing, duplicating ----------
  function newId(){ return 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function nextTitle(type){
    const n = Object.values(S.cards).filter(c => c.type === type).length + 1;
    return `${T[type].label} ${n}`;
  }
  function insert(card, afterId){
    S.cards[card.id] = card;
    const i = afterId ? S.order.indexOf(afterId) + 1 : S.order.length;
    S.order.splice(i, 0, card.id);
    const el = buildCard(card);
    const after = afterId && els.get(afterId);
    VT.flip(grid, () => { if(after) after.after(el); else grid.appendChild(el); });
    countsCache = null;
    applyFilter();
    applyLayout();
    for(const [id, e] of els) setSpan(S.cards[id], e);
    applyOrder();
    return el;
  }
  function addCard(type, over = {}){
    const total = Object.keys(S.cards).length;
    if(total >= S.settings.max){
      VT.toast(`You've reached the ${S.settings.max}-card limit. Remove a card, or raise the limit in the menu.`);
      return;
    }
    const card = Object.assign({
      id: newId(), type, title: nextTitle(type), theme: S.settings.defaultTheme,
      volume: 0.8, muted: false, span: { c: 1, r: 1 }, createdAt: Date.now()
    }, T[type].defaults(), over);
    if(type === 'timer' && over.duration) Object.assign(card, { total: over.duration, remaining: over.duration });
    if(type === 'sleeps' && !over.title) card.title = T.sleeps.events[card.event].name;
    // A holiday countdown starts in its holiday theme.
    if(type === 'sleeps' && !over.theme && VT.holidayTheme[card.event]) card.theme = VT.holidayTheme[card.event];
    if(type !== 'stats') S.history.added++;
    const el = insert(card);
    if(total + 1 === 16 && S.settings.density === 'auto') VT.toast('That’s 16 cards. Compact density may help: it’s in the menu.');
    el.scrollIntoView({ block: 'nearest', behavior: VT.reducedMotion() ? 'auto' : 'smooth' });
    el.focus({ preventScroll: true });
    VT.say(`${card.title} added`);
    VT.save();
  }
  function removeCard(id){
    const card = S.cards[id], el = els.get(id);
    const index = S.order.indexOf(id);
    VT.audio.stopAlarm(id);
    if(card.type === 'voice') T.voice.stop(card);
    if(card.type !== 'stats') S.history.removed++;
    delete S.cards[id];
    S.order.splice(index, 1);
    els.delete(id);
    VT.flip(grid, () => el.remove());
    countsCache = null;
    applyLayout();
    VT.save();
    VT.toast(`Deleted “${card.title}”`, { action: 'Undo', timeout: 7000, onAction(){
      if(card.type !== 'stats') S.history.removed--;
      if(card.type === 'timer' && card.status === 'alarming'){ card.status = 'finished'; card.dismissedAt = Date.now(); }
      S.cards[id] = card;
      S.order.splice(Math.min(index, S.order.length), 0, id);
      const e = buildCard(card);
      grid.appendChild(e);
      countsCache = null;
      applyFilter(); applyLayout();
      S.settings.sort === 'manual' ? VT.flip(grid, () => S.order.forEach(i => grid.appendChild(els.get(i)))) : applyOrder();
      VT.save();
    } });
  }
  function duplicate(card){
    if(Object.keys(S.cards).length >= S.settings.max){ VT.toast(`You've reached the ${S.settings.max}-card limit.`); return; }
    const copy = JSON.parse(JSON.stringify(card, (k, v) => k[0] === '_' ? undefined : v));
    Object.assign(copy, { id: newId(), title: (card.title + ' copy').slice(0, 40), createdAt: Date.now() });
    if(T[copy.type].reset) T[copy.type].reset(copy);
    if(copy.type !== 'stats') S.history.added++;
    insert(copy, card.id);
    VT.save();
  }

  // ---------- Popovers: card menu and volume ----------
  function cardMenu(card, anchor){
    const size = `${card.span.c}x${card.span.r}`;
    const html = `
      <div class="pop-sec">
        <label class="field"><span>Theme</span><select data-p="theme">${VT.themeOptions(card.theme)}</select></label>
        <p class="theme-credit" ${VT.credits.themeHasClips(card.theme) ? '' : 'hidden'}>Uses CC0 sounds by Joseph Sardin · <button class="linkish" data-p="credits">Credits</button></p>
      </div>
      <div class="pop-sec vol-pop">
        <button class="icon-btn" data-p="mute" aria-label="Mute card" aria-pressed="${card.muted === true}">${volIcon(card)}</button>
        <input type="range" min="0" max="100" value="${Math.round(card.volume * 100)}" aria-label="Card volume" data-p="vol">
        <button class="btn small" data-p="test">Test</button>
      </div>
      <div class="pop-sec">
        <span class="field-label">Size</span>
        <div class="seg" role="group" aria-label="Card size">${Object.entries(SIZES).map(([k, n]) => `<button data-size="${k}" aria-pressed="${k === size}">${n}</button>`).join('')}</div>
      </div>
      <div class="pop-sec menu-list">
        <button data-p="settings">${I.gear}<span>Settings…</span></button>
        <button data-p="dup">${I.copy}<span>Duplicate</span></button>
        ${T[card.type].reset ? `<button data-p="reset">${I.reset}<span>Reset</span></button>` : ''}
        <button data-p="del" class="danger">${I.trash}<span>Delete</span></button>
      </div>`;
    VT.pop.toggle(anchor, html, pop => {
      bindVolume(card, pop);
      pop.querySelector('[data-p=theme]').onchange = e => {
        card.theme = e.target.value; syncChrome(card, els.get(card.id)); VT.save();
        pop.querySelector('.theme-credit').hidden = !VT.credits.themeHasClips(card.theme);
      };
      pop.querySelector('[data-p=credits]').onclick = () => { VT.pop.close(false); openCredits(); };
      pop.querySelectorAll('[data-size]').forEach(b => b.onclick = () => {
        const [c, r] = b.dataset.size.split('x').map(Number);
        card.span = { c, r };
        VT.flip(grid, () => setSpan(card, els.get(card.id)));
        pop.querySelectorAll('[data-size]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        VT.save();
      });
      pop.querySelector('[data-p=settings]').onclick = () => { VT.pop.close(false); openSettings(card); };
      pop.querySelector('[data-p=dup]').onclick = () => { VT.pop.close(false); duplicate(card); };
      const rs = pop.querySelector('[data-p=reset]');
      if(rs) rs.onclick = () => { VT.pop.close(true); T[card.type].reset(card); VT.app.changed(card); };
      pop.querySelector('[data-p=del]').onclick = () => { VT.pop.close(false); removeCard(card.id); };
    });
  }

  function volumeMenu(card, anchor){
    const html = `
      <div class="pop-sec vol-pop">
        <button class="icon-btn" data-p="mute" aria-label="Mute card" aria-pressed="${card.muted === true}">${volIcon(card)}</button>
        <input type="range" min="0" max="100" value="${Math.round(card.volume * 100)}" aria-label="Card volume" data-p="vol">
        <button class="btn small" data-p="test">Test</button>
      </div>`;
    VT.pop.toggle(anchor, html, pop => bindVolume(card, pop));
  }

  function bindVolume(card, pop){
    const mute = pop.querySelector('[data-p=mute]');
    pop.querySelector('[data-p=vol]').oninput = e => {
      card.volume = e.target.value / 100; card.muted = false;
      mute.innerHTML = volIcon(card); syncVolume(card, els.get(card.id)); VT.save();
    };
    mute.onclick = () => {
      card.muted = !card.muted;
      mute.innerHTML = volIcon(card); mute.setAttribute('aria-pressed', String(card.muted));
      syncVolume(card, els.get(card.id)); VT.save();
    };
    pop.querySelector('[data-p=test]').onclick = () => VT.audio.preview(card);
  }

  // ---------- Credits dialog ----------
  const creditsDlg = $('#creditsDlg');
  function openCredits(){
    $('#creditsBody').innerHTML = VT.credits.render();
    creditsDlg.showModal();
  }
  creditsDlg.addEventListener('click', e => {
    if(e.target === creditsDlg || e.target.closest('[data-close]')) creditsDlg.close();
    const p = e.target.closest('[data-preview]');
    if(p) VT.audio.previewClip(p.dataset.preview);
  });
  $('#creditsBtn').onclick = openCredits;
  document.querySelectorAll('[data-credits]').forEach(b => b.onclick = openCredits);

  // ---------- Settings dialog ----------
  const dlg = $('#settingsDlg'), form = $('#settingsForm');
  let dlgCard = null;
  function openSettings(card){
    dlgCard = card;
    $('#dlgTitle').textContent = `${T[card.type].label} settings`;
    $('#dlgFields').innerHTML = `
      <label class="field"><span>Name</span><input name="title" maxlength="40" value="${VT.esc(card.title)}" required></label>
      <label class="field"><span>Theme</span><select name="theme">${VT.themeOptions(card.theme)}</select></label>
      ${T[card.type].fields ? T[card.type].fields(card) : ''}`;
    dlg.showModal();
  }
  dlg.addEventListener('close', () => {
    const card = dlgCard;
    dlgCard = null;
    if(!card || dlg.returnValue !== 'save' || !S.cards[card.id]) return;
    const fd = new FormData(form);
    const prevTheme = card.theme;
    card.title = (fd.get('title') || '').trim() || card.title;
    card.theme = fd.get('theme');
    if(T[card.type].apply) T[card.type].apply(card, fd, { prevTheme });
    syncChrome(card, els.get(card.id));
    VT.app.changed(card);
    els.get(card.id).focus({ preventScroll: true });
  });
  $('#dlgCancel').onclick = () => dlg.close('cancel');

  // ---------- Card events (delegated) ----------
  grid.addEventListener('click', e => {
    const btn = e.target.closest('[data-act]');
    if(!btn) return;
    const el = btn.closest('.card'), card = S.cards[el.dataset.id];
    const act = btn.dataset.act;
    if(act === 'menu') return cardMenu(card, btn);
    if(act === 'vol') return volumeMenu(card, btn);
    if(act === 'mute'){ card.muted = !card.muted; syncVolume(card, el); VT.save(); return; }
    // Counter buttons with data-hold handle pointer presses themselves; clicks with detail 0 come from the keyboard.
    if(btn.hasAttribute('data-hold') && e.detail !== 0) return;
    T[card.type].act(card, act, btn);
  });

  grid.addEventListener('input', e => {
    if(!e.target.classList.contains('vol-range')) return;
    const el = e.target.closest('.card'), card = S.cards[el.dataset.id];
    card.volume = e.target.value / 100; card.muted = false;
    syncVolume(card, el); VT.save();
  });

  grid.addEventListener('change', e => {
    if(!e.target.classList.contains('card-title')) return;
    const el = e.target.closest('.card'), card = S.cards[el.dataset.id];
    card.title = e.target.value.trim() || card.title;
    e.target.value = card.title;
    syncChrome(card, el);
    if(S.settings.sort === 'name') applyOrder();
    VT.save();
  });
  grid.addEventListener('keydown', e => {
    if(e.target.classList.contains('card-title') && e.key === 'Enter') e.target.blur();
  });

  // Press-and-hold repeat for counter buttons.
  let hold = null;
  function stopHold(){ if(hold){ clearTimeout(hold.t); clearInterval(hold.i); hold = null; } }
  grid.addEventListener('pointerdown', e => {
    const b = e.target.closest('[data-hold]');
    if(!b || b.disabled || e.button !== 0) return;
    const card = S.cards[b.closest('.card').dataset.id];
    const fire = () => { if(!b.disabled) T[card.type].act(card, b.dataset.act, b); };
    fire();
    stopHold();
    hold = { t: setTimeout(() => { hold.i = setInterval(fire, 80); }, 450) };
  });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => grid.addEventListener(t, stopHold, true));

  // ---------- Drag to reorder (pointer) ----------
  let drag = null;
  grid.addEventListener('pointerdown', e => {
    if(e.button !== 0) return;
    const h = e.target.closest('.handle');
    if(h) return startDrag(e, h.closest('.card'));
    const g = e.target.closest('.grip');
    if(g) return startResize(e, g.closest('.card'));
  });

  function startDrag(e, el){
    e.preventDefault();
    VT.pop.close(false);
    if(S.settings.sort !== 'manual'){ S.order = [...grid.children].map(x => x.dataset.id); setSort('manual'); }
    const r = el.getBoundingClientRect();
    const ghost = el.cloneNode(true);
    ghost.classList.add('drag-ghost');
    ghost.removeAttribute('data-id');
    ghost.setAttribute('aria-hidden', 'true');
    Object.assign(ghost.style, { width: r.width + 'px', height: r.height + 'px', left: r.left + 'px', top: r.top + 'px' });
    document.body.appendChild(ghost);
    el.classList.add('drag-source');
    drag = { el, ghost, x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, last: null, raf: 0 };
    window.addEventListener('pointermove', onDragMove);
    window.addEventListener('pointerup', endDrag, { once: true });
    window.addEventListener('pointercancel', endDrag, { once: true });
    drag.raf = requestAnimationFrame(autoScroll);
  }
  function onDragMove(e){
    drag.x = e.clientX; drag.y = e.clientY;
    drag.ghost.style.transform = `translate(${drag.x - drag.x0}px, ${drag.y - drag.y0}px) rotate(1.5deg) scale(1.03)`;
    hitTest();
  }
  function hitTest(){
    const hit = document.elementFromPoint(drag.x, drag.y);
    const target = hit && hit.closest('.grid > .card');
    if(!target){ drag.last = null; return; }
    if(target === drag.el || target === drag.last) return;
    drag.last = target;
    const kids = [...grid.children];
    const before = kids.indexOf(drag.el) > kids.indexOf(target);
    VT.flip(grid, () => before ? target.before(drag.el) : target.after(drag.el));
  }
  function autoScroll(){
    if(!drag) return;
    const edge = 70, y = drag.y;
    const v = y < edge ? -(edge - y) / 4 : y > innerHeight - edge ? (y - innerHeight + edge) / 4 : 0;
    if(v){ scrollBy(0, v); hitTest(); }
    drag.raf = requestAnimationFrame(autoScroll);
  }
  function endDrag(){
    window.removeEventListener('pointermove', onDragMove);
    cancelAnimationFrame(drag.raf);
    const { el, ghost } = drag;
    drag = null;
    const r = el.getBoundingClientRect();
    if(VT.reducedMotion()) ghost.remove();
    else{
      ghost.style.transition = 'transform .18s ease, opacity .18s ease';
      ghost.style.transform = `translate(${r.left - parseFloat(ghost.style.left)}px, ${r.top - parseFloat(ghost.style.top)}px)`;
      ghost.style.opacity = '0.4';
      setTimeout(() => ghost.remove(), 190);
    }
    el.classList.remove('drag-source');
    S.order = [...grid.children].map(x => x.dataset.id);
    VT.save();
  }

  // ---------- Keyboard reordering on the handle ----------
  let kb = null;
  grid.addEventListener('keydown', e => {
    const h = e.target.closest('.handle');
    if(!h) return;
    const el = h.closest('.card');
    const title = S.cards[el.dataset.id].title;
    const visible = () => [...grid.children].filter(x => !x.hidden);
    if(e.key === ' ' || e.key === 'Enter'){
      e.preventDefault();
      if(!kb){
        if(S.settings.sort !== 'manual'){ S.order = [...grid.children].map(x => x.dataset.id); setSort('manual'); }
        kb = { el, order: [...grid.children] };
        el.classList.add('kb-grab');
        VT.say(`Picked up ${title}. Use the arrow keys to move it, Space to drop, Escape to cancel.`);
      } else {
        kb.el.classList.remove('kb-grab');
        kb = null;
        S.order = [...grid.children].map(x => x.dataset.id);
        VT.save();
        VT.say(`Dropped ${title}.`);
      }
      return;
    }
    if(!kb) return;
    if(e.key === 'Escape'){
      e.preventDefault();
      VT.flip(grid, () => kb.order.forEach(x => grid.appendChild(x)));
      kb.el.classList.remove('kb-grab');
      kb = null;
      h.focus();
      VT.say('Move cancelled.');
      return;
    }
    const dir = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
    if(!dir) return;
    e.preventDefault();
    const vis = visible(), i = vis.indexOf(el), j = i + dir;
    if(j < 0 || j >= vis.length) return;
    VT.flip(grid, () => dir < 0 ? vis[j].before(el) : vis[j].after(el));
    h.focus();
    VT.say(`Position ${j + 1} of ${vis.length}`);
  });

  // ---------- Snap-to-span resizing ----------
  function startResize(e, el){
    if(grid.dataset.tier === 'hero') return;
    e.preventDefault();
    const card = S.cards[el.dataset.id];
    const cs = getComputedStyle(grid);
    const cols = colCount(), gap = parseFloat(cs.columnGap) || 0;
    const colW = parseFloat(cs.gridTemplateColumns), rowH = parseFloat(cs.gridAutoRows);
    const r = el.getBoundingClientRect();
    const badge = document.createElement('div');
    badge.className = 'size-badge';
    el.appendChild(badge);
    el.classList.add('resizing');
    const label = () => { badge.textContent = `${SIZES[card.span.c + 'x' + card.span.r] || ''} ${Math.min(card.span.c, cols)}×${card.span.r}`; };
    label();
    const move = ev => {
      const c = VT.clamp(Math.round((r.width + ev.clientX - e.clientX + gap) / (colW + gap)), 1, Math.min(3, cols));
      const rr = VT.clamp(Math.round((r.height + ev.clientY - e.clientY + gap) / (rowH + gap)), 1, 2);
      if(c === Math.min(card.span.c, cols) && rr === card.span.r) return;
      card.span = { c, r: rr };
      VT.flip(grid, () => setSpan(card, el));
      label();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      el.classList.remove('resizing');
      badge.remove();
      VT.save();
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up, { once: true });
    window.addEventListener('pointercancel', up, { once: true });
  }

  // ---------- Ticker ----------
  let prevRunning = null, flashOn = false, lastFlash = 0;
  function frame(){
    const now = Date.now();
    countsCache = null;
    for(const card of Object.values(S.cards)) if(T[card.type].tick) T[card.type].tick(card, now);
    for(const [id, el] of els) if(!el.hidden) T[S.cards[id].type].update(S.cards[id], el, now, false);

    const n = counts();
    if(prevRunning !== null && prevRunning > 0 && n.running === 0 && n.finished > 0){
      const stats = Object.values(S.cards).find(c => c.type === 'stats' && c.allDone);
      if(stats) VT.audio.play(stats, 'allDone');
    }
    prevRunning = n.running;

    if(now - lastFlash > 1000){
      lastFlash = now;
      flashOn = n.ringing > 0 && !flashOn;
      const t = n.ringing ? (flashOn ? `⏰ ${n.ringing} ringing` : BASE_TITLE) : BASE_TITLE;
      if(document.title !== t) document.title = t;
    }
  }
  function loop(){ frame(); if(!document.hidden) requestAnimationFrame(loop); }
  let bgTimer = null;
  document.addEventListener('visibilitychange', () => {
    if(document.hidden){ bgTimer = setInterval(frame, 1000); }
    else { clearInterval(bgTimer); bgTimer = null; requestAnimationFrame(loop); }
  });

  // ---------- Top bar ----------
  function addMenu(anchor){
    const html = `
      <div class="pop-sec menu-list">
        ${VT.typeOrder.map(t => `<button data-add="${t}">${I[T[t].icon]}<span>${T[t].label}</span></button>`).join('')}
      </div>
      <div class="pop-sec">
        <span class="field-label">Timer presets</span>
        <div class="menu-list">${PRESETS.map((p, i) => `<button data-preset="${i}">${I.timer}<span>${p.label} <span class="muted">${p.min} min</span></span></button>`).join('')}</div>
      </div>
      <div class="pop-sec">
        <span class="field-label">Sleeps until…</span>
        <div class="seg seg-wide">${['christmas', 'halloween', 'newYear', 'easter', 'diwali', 'hanukkah', 'lunarNewYear', 'eidFitr', 'bonfire', 'custom'].map(k => `<button data-sleeps="${k}">${VT.esc(T.sleeps.events[k].short)}</button>`).join('')}</div>
      </div>`;
    VT.pop.toggle(anchor, html, pop => {
      pop.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { VT.pop.close(false); addCard(b.dataset.add); });
      pop.querySelectorAll('[data-sleeps]').forEach(b => b.onclick = () => {
        VT.pop.close(false);
        const ev = b.dataset.sleeps;
        addCard('sleeps', { event: ev, title: ev === 'custom' ? 'My day' : T.sleeps.events[ev].name });
        if(ev === 'custom'){ const c = S.cards[S.order[S.order.length - 1]]; if(c && c.type === 'sleeps') openSettings(c); }
      });
      pop.querySelectorAll('[data-preset]').forEach(b => b.onclick = () => {
        const p = PRESETS[+b.dataset.preset];
        VT.pop.close(false);
        addCard('timer', { title: p.label, duration: p.min * 60000 });
      });
    });
  }
  $('#addBtn').onclick = e => addMenu(e.currentTarget);
  document.querySelectorAll('[data-quick]').forEach(b => b.onclick = () => addCard(b.dataset.quick));

  const sortSel = $('#sortSel');
  sortSel.value = S.settings.sort;
  sortSel.onchange = () => setSort(sortSel.value);

  const keep = $('#keepSorted');
  keep.setAttribute('aria-pressed', String(S.settings.keepSorted));
  keep.onclick = () => {
    S.settings.keepSorted = !S.settings.keepSorted;
    keep.setAttribute('aria-pressed', String(S.settings.keepSorted));
    applyOrder(); VT.save();
  };

  document.querySelectorAll('[data-filter]').forEach(b => {
    b.setAttribute('aria-pressed', String(b.dataset.filter === S.settings.filter));
    b.onclick = () => {
      S.settings.filter = b.dataset.filter;
      document.querySelectorAll('[data-filter]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      applyFilter(); applyLayout(); VT.save();
    };
  });
  const typeSel = $('#typeFilter');
  typeSel.innerHTML = '<option value="all">All types</option>' + VT.typeOrder.filter(t => t !== 'stats').map(t => `<option value="${t}">${T[t].plural || T[t].label + 's'}</option>`).join('');
  typeSel.value = S.settings.typeFilter;
  typeSel.onchange = () => { S.settings.typeFilter = typeSel.value; applyFilter(); applyLayout(); VT.save(); };

  $('#pauseAll').onclick = () => {
    Object.values(S.cards).forEach(c => T[c.type].pause && T[c.type].pause(c));
    Object.values(S.cards).forEach(c => VT.app.changed(c));
  };
  $('#resumeAll').onclick = () => {
    let voiceDone = false;
    for(const c of Object.values(S.cards)){
      if(!T[c.type].resume || c.status !== 'paused') continue;
      if(c.type === 'voice'){ if(voiceDone) continue; voiceDone = true; }
      T[c.type].resume(c);
    }
    Object.values(S.cards).forEach(c => VT.app.changed(c));
  };

  const mVol = $('#masterVol'), mMute = $('#masterMute');
  function syncMaster(){
    mVol.value = Math.round(S.settings.master * 100);
    mMute.innerHTML = S.settings.muted || S.settings.master === 0 ? I.mute : I.vol;
    mMute.setAttribute('aria-pressed', String(S.settings.muted));
  }
  mVol.oninput = () => { S.settings.master = mVol.value / 100; S.settings.muted = false; syncMaster(); VT.save(); };
  mMute.onclick = () => { S.settings.muted = !S.settings.muted; syncMaster(); VT.save(); };
  syncMaster();

  const defTheme = $('#defaultTheme');
  defTheme.innerHTML = VT.themeOptions(S.settings.defaultTheme);
  defTheme.value = S.settings.defaultTheme;
  defTheme.onchange = () => { S.settings.defaultTheme = defTheme.value; VT.save(); };
  $('#applyTheme').onclick = () => {
    for(const c of Object.values(S.cards)){ c.theme = S.settings.defaultTheme; syncChrome(c, els.get(c.id)); }
    VT.save();
    VT.toast(`All cards now use ${VT.themes[S.settings.defaultTheme].name}.`);
  };

  const dens = $('#densitySel');
  dens.value = S.settings.density;
  dens.onchange = () => { S.settings.density = dens.value; VT.flip(grid, applyLayout); VT.save(); };

  const maxSel = $('#maxSel');
  maxSel.value = String(S.settings.max);
  maxSel.onchange = () => { S.settings.max = +maxSel.value; VT.save(); };

  const fsBtn = $('#fsBtn');
  if(!document.documentElement.requestFullscreen) fsBtn.hidden = true;
  fsBtn.onclick = () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {});

  const moreBtn = $('#moreBtn'), more = $('#barMore');
  moreBtn.onclick = () => {
    const open = more.classList.toggle('open');
    moreBtn.setAttribute('aria-expanded', String(open));
  };

  // ---------- Sound unlock ----------
  const gate = $('#soundGate');
  function unlock(){
    VT.audio.unlock().then(ok => { if(ok){ gate.hidden = true; document.removeEventListener('pointerdown', unlock, true); document.removeEventListener('keydown', unlock, true); } });
  }
  if(VT.audio.supported){
    gate.hidden = false;
    document.addEventListener('pointerdown', unlock, true);
    document.addEventListener('keydown', unlock, true);
  }
  gate.onclick = unlock;

  // ---------- Keyboard shortcuts ----------
  document.addEventListener('keydown', e => {
    if(e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || dlg.open || creditsDlg.open) return;
    const t = e.target;
    if(t.closest && t.closest('input, select, textarea, [contenteditable]')) return;
    if(e.key === 'n' || e.key === 'N'){ e.preventDefault(); addMenu($('#addBtn')); return; }
    if(!t.classList || !t.classList.contains('card')) return;
    const card = S.cards[t.dataset.id];
    if(e.key === ' '){
      e.preventDefault();
      if(card.type === 'counter') T.counter.act(card, 'inc');
      else if(card.type !== 'stats') T[card.type].act(card, 'toggle');
    } else if(card.type === 'counter' && (e.key === '+' || e.key === '=')){ T.counter.act(card, 'inc'); }
    else if(card.type === 'counter' && e.key === '-'){ T.counter.act(card, 'dec'); }
  });

  // ---------- Boot ----------
  VT.pop.init();
  const now = Date.now();
  for(const c of Object.values(S.cards)) if(T[c.type].hydrate) T[c.type].hydrate(c, now);
  for(const id of S.order) buildCard(S.cards[id]);
  for(const id of sortedIds()) grid.appendChild(els.get(id));
  applyFilter();
  applyLayout();
  for(const [id, el] of els) setSpan(S.cards[id], el);
  requestAnimationFrame(loop);
  VT.save();
})(window.VT);
