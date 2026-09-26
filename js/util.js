// Shared helpers: icons, formatting, FLIP animation, popover, toasts.
window.VT = window.VT || {};
(function(VT){
  const svg = (inner, fill) => `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"${fill ? ' fill="currentColor"' : ''}>${inner}</svg>`;
  const st = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

  VT.icons = {
    play: svg('<path d="M8 5.5v13l11-6.5z"/>', true),
    pause: svg('<path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/>', true),
    stop: svg('<rect x="6.5" y="6.5" width="11" height="11" rx="2"/>', true),
    reset: svg(`<path ${st} d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path ${st} d="M4.5 4.5v4h4"/>`),
    plus: svg(`<path ${st} stroke-width="2.4" d="M12 5v14M5 12h14"/>`),
    minus: svg(`<path ${st} stroke-width="2.4" d="M5 12h14"/>`),
    lap: svg(`<path ${st} d="M6 21V4h11l-2 4 2 4H6"/>`),
    bell: svg(`<path ${st} d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 21h4"/>`),
    vol: svg(`<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path ${st} d="M16.5 9a4.5 4.5 0 0 1 0 6M19 6.5a8 8 0 0 1 0 11"/>`),
    volLow: svg(`<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path ${st} d="M16.5 9a4.5 4.5 0 0 1 0 6"/>`),
    mute: svg(`<path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path ${st} d="M16.5 9.5l5 5M21.5 9.5l-5 5"/>`),
    more: svg('<circle cx="5.5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="18.5" cy="12" r="1.8"/>', true),
    handle: svg('<circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/>', true),
    gear: svg(`<circle ${st} cx="12" cy="12" r="3"/><path ${st} d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1"/>`),
    copy: svg(`<rect ${st} x="8" y="8" width="12" height="12" rx="2"/><path ${st} d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>`),
    trash: svg(`<path ${st} d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13"/>`),
    full: svg(`<path ${st} d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>`),
    timer: svg(`<circle ${st} cx="12" cy="13.5" r="7.5"/><path ${st} d="M12 13.5V9.5M9.5 2.5h5"/>`),
    stopwatch: svg(`<circle ${st} cx="12" cy="13.5" r="7.5"/><path ${st} d="M12 13.5l3-3M12 2.5v3M18.5 6.5l1.5-1.5"/>`),
    counter: svg(`<rect ${st} x="3.5" y="5" width="17" height="14" rx="3"/><path ${st} d="M8 12h3M9.5 10.5v3M14 12h3"/>`),
    voice: svg(`<rect ${st} x="9" y="3" width="6" height="11" rx="3"/><path ${st} d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>`),
    stats: svg(`<path ${st} d="M4 20V10M10 20V4M16 20v-7M21 20H3"/>`),
    moon: svg(`<path ${st} d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/><path ${st} d="M16 3.5v3M14.5 5h3"/>`),
    info: svg(`<circle ${st} cx="12" cy="12" r="9"/><path ${st} d="M12 11v5M12 7.5v.5"/>`),
    close: svg(`<path ${st} d="M6 6l12 12M18 6L6 18"/>`)
  };

  const pad = n => String(n).padStart(2, '0');
  VT.fmt = {
    // Countdown display: rounds up so "00:01" shows until the very end.
    clock(ms, floor){
      const t = Math.max(0, floor ? Math.floor(ms / 1000) : Math.ceil(ms / 1000));
      const h = Math.floor(t / 3600), m = Math.floor(t % 3600 / 60), s = t % 60;
      return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
    },
    watch(ms){
      const cs = Math.floor(ms / 10) % 100;
      return { main: VT.fmt.clock(ms, true), cs: pad(cs) };
    },
    short(ms){
      const s = Math.round(ms / 1000);
      if(s < 60) return s + 's';
      const m = Math.round(s / 60);
      if(m < 60) return m + 'm';
      const h = Math.floor(m / 60);
      return m % 60 ? `${h}h ${m % 60}m` : `${h}h`;
    },
    human(ms){
      const s = Math.round(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), r = s % 60;
      return [h && h + ' hr', m && m + ' min', r && r + ' sec'].filter(Boolean).join(' ') || '0 sec';
    }
  };

  VT.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  VT.clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  VT.reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  // FLIP: record positions, mutate the DOM, then animate each child from its old spot.
  VT.flip = function(container, mutate){
    // Skip when motion is reduced, or when the tab is hidden and animations can't run.
    if(VT.reducedMotion() || document.hidden){ mutate(); return; }
    const first = new Map([...container.children].map(k => [k, k.getBoundingClientRect()]));
    mutate();
    for(const k of container.children){
      const f = first.get(k);
      if(!f || k.hidden) continue;
      const l = k.getBoundingClientRect();
      const dx = f.left - l.left, dy = f.top - l.top;
      if(Math.abs(dx) < 1 && Math.abs(dy) < 1) continue;
      k.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
        { duration: 240, easing: 'cubic-bezier(.2,.7,.2,1)' });
    }
  };

  // One shared popover, anchored to whichever button opened it.
  const pop = VT.pop = {
    el: null, anchor: null,
    init(){
      pop.el = document.getElementById('popover');
      document.addEventListener('pointerdown', e => {
        if(!pop.anchor) return;
        if(pop.el.contains(e.target) || pop.anchor.contains(e.target)) return;
        pop.close(false);
      }, true);
      document.addEventListener('keydown', e => { if(e.key === 'Escape' && pop.anchor) pop.close(true); });
      window.addEventListener('resize', () => pop.close(false));
    },
    toggle(anchor, html, bind){
      if(pop.anchor === anchor){ pop.close(true); return; }
      pop.open(anchor, html, bind);
    },
    open(anchor, html, bind){
      pop.close(false);
      pop.anchor = anchor;
      pop.el.innerHTML = html;
      pop.el.hidden = false;
      anchor.setAttribute('aria-expanded', 'true');
      const r = anchor.getBoundingClientRect();
      const pw = pop.el.offsetWidth, ph = pop.el.offsetHeight;
      const left = VT.clamp(r.right - pw, 8, innerWidth - pw - 8);
      let top = r.bottom + 6;
      if(top + ph > innerHeight - 8) top = Math.max(8, r.top - ph - 6);
      pop.el.style.left = left + 'px';
      pop.el.style.top = top + 'px';
      if(bind) bind(pop.el);
      const f = pop.el.querySelector('button, input, select');
      if(f) f.focus({ preventScroll: true });
    },
    close(returnFocus){
      if(!pop.anchor) return;
      const a = pop.anchor;
      pop.anchor = null;
      pop.el.hidden = true;
      pop.el.innerHTML = '';
      a.setAttribute('aria-expanded', 'false');
      if(returnFocus && a.isConnected) a.focus({ preventScroll: true });
    }
  };

  VT.toast = function(msg, opts = {}){
    const box = document.getElementById('toasts');
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span>${VT.esc(msg)}</span>`;
    if(opts.action){
      const b = document.createElement('button');
      b.className = 'btn small';
      b.textContent = opts.action;
      b.onclick = () => { opts.onAction(); t.remove(); };
      t.appendChild(b);
    }
    box.appendChild(t);
    while(box.children.length > 3) box.firstElementChild.remove();
    setTimeout(() => t.remove(), opts.timeout || 5000);
  };

  VT.say = function(msg){
    const live = document.getElementById('live');
    live.textContent = '';
    setTimeout(() => { live.textContent = msg; }, 30);
  };
})(window.VT);
