// Theme registry. Colours, fonts and animation live in css/themes.css under .theme-<id>;
// this file supplies each theme's sound set and decorative SVG art.
//
// A sound is either a synth recipe name (see audio.js) or { clip, fallback } for a CC0
// clip in sounds/, with a synth recipe to use if the clip can't play.
// art(card) returns SVG markup (one or more <svg>s: bottom-right by default, svgTop() for the
// top-right corner, svgFull() for a full-width strip); ids inside must include card.id to stay unique.
// The card sets --p (progress, 0–1) and data-state, which the CSS uses to animate the art.
(function(VT){
  const clip = (name, fallback) => ({ clip: `sounds/${name}.mp3`, fallback });
  // Card ids go into SVG id/url() attributes; keep only safe characters.
  const uid = card => String(card.id).replace(/[^a-z0-9]/gi, '');
  const svg = (inner, fit = 'xMaxYMax meet', cls = '') => `<svg viewBox="0 0 200 200" preserveAspectRatio="${fit}"${cls ? ` class="${cls}"` : ''}>${inner}</svg>`;
  // Art can also sit in the top-right corner (behind the header) or run full width.
  const svgTop = inner => svg(inner, 'xMaxYMin meet', 'tr');
  const svgFull = (inner, fit = 'none') => svg(inner, fit, 'full');

  function fan(){
    let lines = '';
    for(let i = 0; i <= 8; i++){
      const a = (90 + i * 11.25) * Math.PI / 180;
      lines += `<line x1="200" y1="0" x2="${(200 + Math.cos(a) * 120).toFixed(1)}" y2="${(Math.sin(a) * 120).toFixed(1)}"/>`;
    }
    return lines;
  }

  function gear(r, teeth){
    const pts = [], step = Math.PI * 2 / teeth;
    for(let i = 0; i < teeth; i++){
      const a = i * step;
      for(const [da, rr] of [[0, r], [step * 0.2, r + 7], [step * 0.5, r + 7], [step * 0.7, r]])
        pts.push(`${(Math.cos(a + da) * rr).toFixed(1)},${(Math.sin(a + da) * rr).toFixed(1)}`);
    }
    return `M${pts.join('L')}Z`;
  }

  const paw = (x, y, i, rot) => `<g class="d-paw" style="--i:${i}" transform="translate(${x} ${y}) rotate(${rot})"><ellipse cy="4" rx="5.5" ry="4.5"/><circle cx="-5.5" cy="-3" r="2.2"/><circle cx="0" cy="-5.5" r="2.2"/><circle cx="5.5" cy="-3" r="2.2"/></g>`;

  const INVADER = ['..X.....X..', '...X...X...', '..XXXXXXX..', '.XX.XXX.XX.', 'XXXXXXXXXXX', 'X.XXXXXXX.X', 'X.X.....X.X', '...XX.XX...'];
  const invader = INVADER.map((row, y) => [...row].map((c, x) => c === 'X' ? `<rect x="${x * 5}" y="${y * 5}" width="5" height="5"/>` : '').join('')).join('');

  VT.themes = {
    modern: {
      name: 'Modern',
      sounds: {
        start: 'tap', pause: 'tapLow', tick: 'softClick', warn: 'twoTone', alarm: 'risingChime',
        lap: 'tap', step: 'tap', stepDown: 'tapLow', target: 'success', allDone: 'success'
      },
      art: card => svg(`
        <defs><radialGradient id="mBlob-${uid(card)}"><stop offset="0" stop-color="currentColor" stop-opacity=".22"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs>
        <circle class="m-blob a" cx="175" cy="25" r="80" fill="url(#mBlob-${uid(card)})"/>
        <circle class="m-blob b" cx="15" cy="195" r="90" fill="url(#mBlob-${uid(card)})"/>
        <circle class="m-ring" cx="175" cy="25" r="46" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 6"/>`, 'xMidYMid slice')
    },

    stylish: {
      name: 'Stylish',
      sounds: {
        start: 'glassClink', pause: 'glassLow', tick: 'watchTick', warn: 'crystal', alarm: 'musicBox',
        lap: 'glassClink', step: 'glassClink', stepDown: 'glassLow', target: 'goldSweep', allDone: 'goldSweep'
      },
      art: () => svg(`
        <g class="s-fan" fill="none" stroke="currentColor" stroke-width=".6">${fan()}
          <path d="M160 0a40 40 0 0 0 40 40M140 0a60 60 0 0 0 60 60M120 0a80 80 0 0 0 80 80"/></g>`, 'xMaxYMin meet')
    },

    banana: {
      name: 'Banana',
      sounds: {
        start: 'boing', pause: 'squish', tick: 'softClick', warn: 'slip', alarm: 'monkey',
        lap: 'boing', step: 'boing', stepDown: 'squish', target: 'slip', allDone: 'monkey'
      },
      // The peel opens as time runs out.
      art: () => svg(`
        <g class="b-bunch" transform="translate(128 96)">
          <path class="b-fruit" d="M30 12C8 32 8 64 30 92C52 64 52 32 30 12Z"/>
          <path class="b-peel l" d="M30 12C8 32 8 64 30 92Z"/>
          <path class="b-peel r" d="M30 12C52 32 52 64 30 92Z"/>
          <rect class="b-stem" x="26" y="0" width="8" height="14" rx="3"/>
        </g>
        <g class="b-spots"><circle cx="18" cy="182" r="4"/><circle cx="34" cy="192" r="2.5"/><circle cx="8" cy="164" r="2"/></g>`)
    },

    dog: {
      name: 'A Dog’s Life',
      sounds: {
        start: 'thump', pause: 'thumpLow', tick: 'softClick', warn: clip('dog-yip', 'squeak'), alarm: clip('dog-bark', 'thump'),
        lap: 'squeak', step: 'squeak', stepDown: 'thumpLow', target: clip('dog-yip', 'squeak'), allDone: clip('dog-bark', 'thump')
      },
      // Sleeps while idle, wakes and wags while running, barks at the alarm; pawprints walk the progress.
      art: () => svg(`
        <g class="d-paws">${paw(14, 188, 0, 60)}${paw(34, 174, 1, 50)}${paw(50, 186, 2, 60)}${paw(70, 172, 3, 50)}${paw(86, 184, 4, 60)}</g>
        <g class="d-dog" transform="translate(104 104)">
          <path class="d-tail" d="M78 58q20-6 14-30"/>
          <ellipse class="d-body" cx="50" cy="72" rx="38" ry="22"/>
          <g class="d-head">
            <circle class="d-face" cx="22" cy="44" r="22"/>
            <path class="d-ear l" d="M4 30q-12 22 4 34q4-16 3-34z"/>
            <path class="d-ear r" d="M40 30q12 22-4 34q-4-16-3-34z"/>
            <ellipse class="d-snout" cx="22" cy="55" rx="10" ry="7"/>
            <circle class="d-nose" cx="22" cy="51" r="3.2"/>
            <g class="d-closed"><path d="M12 41q3 3 6 0M26 41q3 3 6 0"/></g>
            <g class="d-open"><circle cx="15" cy="40" r="2.6"/><circle cx="29" cy="40" r="2.6"/></g>
          </g>
          <g class="d-zzz"><text x="44" y="14">z</text><text x="54" y="2">z</text></g>
        </g>`)
    },

    retro: {
      name: 'Retro Arcade',
      sounds: {
        start: 'coin', pause: 'blipLow', tick: 'blipTick', warn: 'powerUp', alarm: 'levelClear',
        lap: 'blip', step: 'blip', stepDown: 'blipLow', target: 'powerUp', allDone: 'levelClear'
      },
      art: () => svg(`<g class="r-inv" transform="translate(134 14)">${invader}</g>
        <g class="r-ground"><rect x="0" y="194" width="200" height="6"/></g>`, 'xMaxYMin meet')
    },

    neon: {
      name: 'Neon Synthwave',
      sounds: {
        start: 'synthPulse', pause: 'laser', tick: 'blipTick', warn: 'laser', alarm: 'arp',
        lap: 'laser', step: 'synthPulse', stepDown: 'laser', target: 'arp', allDone: 'arp'
      },
      art: card => svg(`
        <defs>
          <linearGradient id="nSun-${uid(card)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd319"/><stop offset=".6" stop-color="#ff5f8f"/><stop offset="1" stop-color="#ff2a6d"/></linearGradient>
          <clipPath id="nSky-${uid(card)}"><rect width="200" height="150"/></clipPath>
          <clipPath id="nFloor-${uid(card)}"><rect y="150" width="200" height="50"/></clipPath>
        </defs>
        <g class="n-sun" clip-path="url(#nSky-${uid(card)})">
          <circle cx="100" cy="150" r="48" fill="url(#nSun-${uid(card)})"/>
          <rect class="n-cut" x="40" y="126" width="120" height="3"/><rect class="n-cut" x="40" y="134" width="120" height="4"/><rect class="n-cut" x="40" y="143" width="120" height="5"/>
        </g>
        <g class="n-grid" clip-path="url(#nFloor-${uid(card)})">
          <line x1="0" y1="150" x2="200" y2="150"/>
          ${[-140, -80, -40, -12, 12, 40, 80, 140].map(x => `<line x1="100" y1="150" x2="${100 + x * 2}" y2="200"/>`).join('')}
          <g class="n-h">${[154, 162, 174, 190, 210].map(y => `<line x1="0" y1="${y}" x2="200" y2="${y}"/>`).join('')}</g>
        </g>`, 'xMidYMax slice')
    },

    kitchen: {
      name: 'Kitchen',
      sounds: {
        start: 'clockwork', pause: clip('pan-strike', 'woodLow'), tick: 'watchTick', warn: clip('microwave-ding', 'twoTone'), alarm: clip('alarm-clock', 'risingChime'),
        lap: clip('pan-strike', 'tap'), step: clip('pan-strike', 'tap'), stepDown: 'woodLow', target: clip('microwave-ding', 'success'), allDone: clip('microwave-ding', 'success')
      },
      // An egg-timer dial winds back to zero.
      art: () => svg(`
        <g class="k-steam"><path d="M138 70q-8-10 0-20t0-20"/><path d="M152 66q-8-10 0-20t0-20"/><path d="M166 70q-8-10 0-20t0-20"/></g>
        <g transform="translate(152 146)">
          <circle class="k-dial" r="44"/>
          ${Array.from({ length: 12 }, (_, i) => `<line class="k-tick" x1="0" y1="-38" x2="0" y2="${i % 3 ? -34 : -30}" transform="rotate(${i * 30})"/>`).join('')}
          <g class="k-knob"><path d="M0-40L7-24H-7Z"/><circle r="14"/></g>
        </g>`)
    },

    zen: {
      name: 'Zen',
      sounds: {
        start: 'woodBlock', pause: 'woodLow', warn: 'woodBlock', alarm: clip('singing-bowl', 'crystal'),
        lap: 'pebble', step: 'pebble', stepDown: 'pebble', target: clip('singing-bowl', 'crystal'), allDone: clip('singing-bowl', 'crystal')
      },
      // An ensō brush circle draws itself as time passes.
      art: () => svg(`
        <circle class="z-ghost" cx="150" cy="140" r="42"/>
        <circle class="z-enso" cx="150" cy="140" r="42" transform="rotate(-100 150 140)"/>
        <path class="z-leaf" d="M0 0q10-10 20 0q-10 10-20 0z"/>`)
    },

    ocean: {
      name: 'Deep Ocean',
      sounds: {
        start: clip('bubbles', 'drip'), pause: 'drip', tick: 'drip', warn: 'sonar', alarm: 'whaleCall',
        lap: 'drip', step: 'drip', stepDown: 'drip', target: clip('bubbles', 'sonar'), allDone: 'whaleCall'
      },
      art: () => svg(`
        <g class="o-rays"><path d="M40 0L20 200H50L60 0Z"/><path d="M110 0L110 200H135L125 0Z"/><path d="M170 0L190 200H200V0Z"/></g>
        <g class="o-bubbles">${[[150, 6, 0], [168, 4, 1], [182, 7, 2], [140, 3, 3], [176, 5, 4], [160, 3, 5]].map(([x, r, i]) => `<circle cx="${x}" cy="196" r="${r}" style="--i:${i}"/>`).join('')}</g>
        <path class="o-whale" d="M0 20C10 0 50 0 70 12C80 18 88 10 96 2C94 14 96 22 100 30C90 26 82 24 72 26C50 40 10 38 0 20Z"/>`, 'xMidYMid slice')
    },

    space: {
      name: 'Space',
      sounds: {
        start: clip('space-beep', 'telemetry'), pause: 'telemetryLow', tick: 'telemetry', warn: 'countdownBeeps', alarm: 'launch',
        lap: clip('space-beep', 'telemetry'), step: clip('space-beep', 'telemetry'), stepDown: 'telemetryLow', target: 'launch', allDone: 'launch'
      },
      // The rocket climbs with progress and launches at the alarm.
      art: () => svg(`
        <g class="sp-stars">${[[20, 30], [60, 12], [95, 44], [130, 18], [178, 36], [40, 80], [160, 90], [12, 140], [80, 120], [188, 150]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 ? 1 : 1.6}" style="--i:${i}"/>`).join('')}</g>
        <circle class="sp-planet" cx="30" cy="186" r="26"/><ellipse class="sp-ring" cx="30" cy="186" rx="42" ry="8"/>
        <g class="sp-rocket" transform="translate(160 120)">
          <path class="sp-flame" d="M4 44Q10 66 16 44Z"/>
          <path class="sp-fin" d="M0 30L-8 46H4ZM20 30L28 46H16Z"/>
          <path class="sp-body" d="M10 0C19 10 20 25 20 44H0C0 25 1 10 10 0Z"/>
          <circle class="sp-window" cx="10" cy="20" r="4.5"/>
        </g>`, 'xMidYMid slice')
    },

    campfire: {
      name: 'Campfire',
      sounds: {
        start: clip('fire-crackle', 'softClick'), pause: clip('twig-snap', 'softClick'), tick: 'softClick', warn: clip('owl', 'twoTone'), alarm: clip('blackbird', 'risingChime'),
        lap: clip('twig-snap', 'softClick'), step: clip('twig-snap', 'softClick'), stepDown: clip('twig-snap', 'softClick'), target: clip('blackbird', 'success'), allDone: clip('owl', 'success')
      },
      // The fire burns down as time runs out.
      art: () => svg(`
        <g class="f-trees"><path d="M14 200L34 130L54 200Z"/><path d="M40 200L62 110L84 200Z"/><path d="M0 200L10 160L20 200Z"/></g>
        <g transform="translate(156 186)">
          <g class="f-fire">
            <path class="f-flame o" d="M0 0C-22-20-10-44 0-72C10-44 22-20 0 0Z"/>
            <path class="f-flame i" d="M0 0C-12-12-6-28 0-44C6-28 12-12 0 0Z"/>
          </g>
          <rect class="f-log" x="-30" y="-4" width="60" height="9" rx="4" transform="rotate(12)"/>
          <rect class="f-log" x="-30" y="-4" width="60" height="9" rx="4" transform="rotate(-12)"/>
        </g>
        <g class="f-embers">${[[150, 0], [160, 1], [146, 2], [166, 3]].map(([x, i]) => `<circle cx="${x}" cy="120" r="1.6" style="--i:${i}"/>`).join('')}</g>`)
    },

    terminal: {
      name: 'Terminal',
      sounds: {
        start: 'keyClack', pause: 'keyClack', tick: 'keyClack', warn: 'termBell', alarm: 'klaxon',
        lap: 'keyClack', step: 'keyClack', stepDown: 'keyClack', target: 'termBell', allDone: 'klaxon'
      },
      art: () => svg(`<text class="t-prompt" x="8" y="192">~/counter $ watch</text>`, 'xMinYMax meet')
    },

    stadium: {
      name: 'Stadium',
      sounds: {
        start: clip('referee-whistle', 'blip'), pause: clip('referee-whistle', 'blip'), tick: 'softClick', warn: 'buzzer', alarm: clip('air-horn', 'buzzer'),
        lap: 'blip', step: 'blip', stepDown: 'blipLow', target: clip('crowd-cheer', 'success'), allDone: clip('crowd-cheer', 'success')
      },
      art: () => svg(`
        <g class="st-pitch"><rect x="6" y="6" width="188" height="188" rx="2"/><line x1="100" y1="6" x2="100" y2="194"/><circle cx="100" cy="100" r="30"/><circle cx="100" cy="100" r="2"/>
          <rect x="6" y="60" width="28" height="80"/><rect x="166" y="60" width="28" height="80"/></g>
        <g class="st-confetti">${Array.from({ length: 14 }, (_, i) => `<rect x="${8 + i * 13.5}" y="-10" width="5" height="9" rx="1" style="--i:${i}"/>`).join('')}</g>`, 'none')
    },

    cat: {
      name: 'Cat Nap',
      sounds: {
        start: clip('cat-purr', 'thumpLow'), pause: clip('cat-mew', 'squeak'), tick: 'softClick', warn: clip('cat-mew', 'squeak'), alarm: clip('cat-meow', 'squeak'),
        lap: 'bellJingle', step: 'bellJingle', stepDown: 'bellJingle', target: clip('cat-meow', 'bellJingle'), allDone: clip('cat-purr', 'bellJingle')
      },
      // Naps while running, then knocks the mug off the table.
      art: () => svg(`
        <g class="c-cat" transform="translate(92 124)">
          <path class="c-tail" d="M68 44C88 44 92 22 76 14"/>
          <ellipse class="c-body" cx="44" cy="44" rx="36" ry="24"/>
          <path class="c-ears" d="M-2 26L0 8L12 20ZM30 26L28 8L16 20Z"/>
          <circle class="c-head" cx="14" cy="32" r="18"/>
          <g class="c-closed"><path d="M5 32q3 3 6 0M17 32q3 3 6 0"/></g>
          <g class="c-open"><circle cx="8" cy="31" r="2.4"/><circle cx="20" cy="31" r="2.4"/></g>
        </g>
        <g class="c-zzz"><text x="80" y="118">z</text><text x="92" y="104">Z</text></g>
        <g class="c-mug" transform="translate(176 150)"><rect x="-10" y="-18" width="18" height="20" rx="3"/><path d="M8-13q7 0 7 6t-7 6"/></g>
        <rect class="c-table" x="100" y="152" width="100" height="4" rx="2"/>`)
    },

    candy: {
      name: 'Candy',
      sounds: {
        start: 'pop', pause: 'crunch', tick: 'softClick', warn: 'fizz', alarm: 'jingle',
        lap: 'pop', step: 'pop', stepDown: 'crunch', target: clip('party-horn', 'jingle'), allDone: clip('party-horn', 'jingle')
      },
      // The lollipop gets smaller as time runs out.
      art: () => svg(`
        <g class="cd-sprinkles">${Array.from({ length: 12 }, (_, i) => `<rect x="${10 + i * 15}" y="-10" width="3" height="10" rx="1.5" style="--i:${i}"/>`).join('')}</g>
        <g transform="translate(156 128)">
          <rect class="cd-stick" x="-3" y="10" width="6" height="70" rx="3"/>
          <g class="cd-pop">
            <circle class="cd-disc" r="32"/>
            <path class="cd-swirl" d="M0 0m-4 0a4 4 0 1 1 8 0a8 8 0 1 1-16 0a12 12 0 1 1 24 0a16 16 0 1 1-32 0a20 20 0 1 1 40 0a24 24 0 1 1-48 0"/>
          </g>
        </g>`)
    },

    steampunk: {
      name: 'Steampunk',
      sounds: {
        start: clip('steam-hiss', 'ratchet'), pause: 'ratchet', tick: 'gearTick', warn: clip('steam-hiss', 'ratchet'), alarm: clip('steam-whistle', 'klaxon'),
        lap: 'ratchet', step: 'gearTick', stepDown: 'ratchet', target: clip('steam-whistle', 'success'), allDone: clip('steam-whistle', 'success')
      },
      // Gears turn while running; the pressure gauge needle rises with progress.
      art: () => svg(`
        <g transform="translate(170 40)"><path class="sk-gear a" d="${gear(26, 12)}"/><circle class="sk-hub" r="8"/></g>
        <g transform="translate(128 72)"><path class="sk-gear b" d="${gear(16, 9)}"/><circle class="sk-hub" r="5"/></g>
        <g transform="translate(160 160)">
          <circle class="sk-gauge" r="30"/>
          ${Array.from({ length: 7 }, (_, i) => `<line class="sk-tick" x1="0" y1="-26" x2="0" y2="-21" transform="rotate(${-120 + i * 40})"/>`).join('')}
          <line class="sk-needle" x1="0" y1="0" x2="0" y2="-22"/><circle class="sk-hub" r="3"/>
        </g>
        <g class="sk-steam"><circle cx="118" cy="140" r="10"/><circle cx="104" cy="126" r="14"/><circle cx="90" cy="108" r="18"/></g>`)
    },

    // ---------- Holidays ----------
    christmas: {
      name: 'Christmas', group: 'holiday',
      sounds: {
        start: 'bellJingle', pause: 'tapLow', tick: 'softClick', warn: clip('ho-ho-ho', 'twinkle'), alarm: clip('sleigh-bells', 'jingleTune'),
        lap: 'bellJingle', step: 'bellJingle', stepDown: 'tapLow', target: clip('ho-ho-ho', 'jingleTune'), allDone: 'jingleTune'
      },
      // Fairy lights twinkle, snow falls while running, and the present opens at the alarm.
      art: () => svg(`
        <path class="x-wire" d="M0 10Q25 26 50 12T100 12T150 12T200 12"/>
        <g class="x-bulbs">${[[12, 16], [38, 18], [62, 14], [88, 16], [112, 15], [138, 17], [162, 14], [188, 15]].map(([x, y], i) => `<circle cx="${x}" cy="${y + 5}" r="4" style="--i:${i}"/>`).join('')}</g>
        <g class="x-snow">${Array.from({ length: 14 }, (_, i) => `<circle cx="${(i * 37) % 200}" cy="${-10 - (i * 23) % 60}" r="${1.5 + i % 3}" style="--i:${i}"/>`).join('')}</g>
        <g class="x-gift" transform="translate(150 150)">
          <rect class="x-box" x="-26" y="0" width="52" height="40" rx="3"/>
          <rect class="x-ribbon" x="-5" y="0" width="10" height="40"/>
          <g class="x-lid"><rect class="x-box" x="-30" y="-12" width="60" height="13" rx="3"/><rect class="x-ribbon" x="-5" y="-12" width="10" height="13"/>
            <path class="x-bow" d="M0-12C-14-26-22-12-2-12ZM0-12C14-26 22-12 2-12Z"/></g>
        </g>`, 'xMidYMid slice')
    },

    halloween: {
      name: 'Halloween', group: 'holiday',
      sounds: {
        start: clip('door-creak', 'boneLow'), pause: 'boneLow', tick: 'boneClick', warn: clip('owl', 'spookyOrgan'), alarm: clip('witch-cackle', 'spookyOrgan'),
        lap: 'boneClick', step: 'boneClick', stepDown: 'boneLow', target: 'spookyOrgan', allDone: clip('witch-cackle', 'spookyOrgan')
      },
      // The jack-o'-lantern flickers while running; bats scatter at the alarm.
      art: () => svg(`
        <circle class="h-moon" cx="160" cy="44" r="26"/>
        <g class="h-bats">${[[30, 60, 0], [70, 40, 1], [110, 70, 2]].map(([x, y, i]) => `<path style="--i:${i}" transform="translate(${x} ${y})" d="M0 0q6-8 10-2q2-4 4 0q2-4 4 0q4-6 10 2q-6-2-9 3q-2-3-5 0q-3-3-5 0q-3-5-9-3z"/>`).join('')}</g>
        <g class="h-pumpkin" transform="translate(150 160)">
          <ellipse class="h-lobe" cx="-18" cy="0" rx="18" ry="24"/><ellipse class="h-lobe" cx="18" cy="0" rx="18" ry="24"/><ellipse class="h-lobe mid" cx="0" cy="0" rx="20" ry="26"/>
          <path class="h-stem" d="M-3-24q0-10 8-14l3 3q-6 4-5 11z"/>
          <path class="h-face" d="M-17-8l7-9 7 9zM3-8l7-9 7 9zM-18 6q4 2 6 0l3 4 3-4 3 4 3-4 3 4 3-4q2 2 6 0q-6 12-18 12t-18-12z"/>
        </g>`)
    },

    easter: {
      name: 'Easter', group: 'holiday',
      sounds: {
        start: 'boing', pause: 'eggTap', tick: 'eggTap', warn: clip('chick-chirp', 'twinkle'), alarm: clip('chick-chirp', 'success'),
        lap: 'eggTap', step: 'eggTap', stepDown: 'eggTap', target: clip('chick-chirp', 'success'), allDone: 'success'
      },
      // The egg cracks as progress fills, then a chick pops out.
      art: () => svg(`
        <g class="e-grass"><path d="M90 200q4-18 8 0q4-22 8 0q4-16 8 0q4-20 8 0q4-18 8 0q4-24 8 0q4-16 8 0q4-20 8 0q4-18 8 0q4-22 8 0q4-18 8 0z"/></g>
        <g transform="translate(150 150)">
          <g class="e-chick"><circle class="e-chick-body" cx="0" cy="0" r="17"/><circle class="e-eye" cx="-6" cy="-4" r="2"/><circle class="e-eye" cx="6" cy="-4" r="2"/><path class="e-beak" d="M-4 2h8l-4 5z"/></g>
          <path class="e-bottom" d="M-30 0C-30 30-16 44 0 44S30 30 30 0L22-6 14 2 6-6-2 2-10-6-18 2-26-6Z"/>
          <g class="e-top"><path class="e-shell" d="M-30 0C-30-32-16-48 0-48S30-32 30 0L22-6 14 2 6-6-2 2-10-6-18 2-26-6Z"/>
            <path class="e-stripe" d="M-27-18q7 6 14 0t14 0t14 0t12 0"/></g>
          <path class="e-crack" d="M-26-6L-18 2-10-6-2 2 6-6 14 2 22-6 30 0"/>
        </g>`)
    },

    valentine: {
      name: 'Valentine’s Day', group: 'holiday',
      sounds: {
        start: 'twinkle', pause: 'heartBeat', tick: 'softClick', warn: 'heartBeat', alarm: 'loveHarp',
        lap: clip('kiss', 'twinkle'), step: clip('kiss', 'twinkle'), stepDown: 'heartBeat', target: clip('kiss', 'loveHarp'), allDone: 'loveHarp'
      },
      // The heart fills with progress; little hearts float up.
      art: card => {
        const heart = 'M0 14C-26-4-22-30 0-18C22-30 26-4 0 14Z';
        return svg(`
          <defs><clipPath id="vHeart-${uid(card)}"><path d="${heart}" transform="translate(150 140) scale(1.9)"/></clipPath></defs>
          <g class="v-floaters">${[[40, 0], [70, 1], [100, 2], [124, 3], [20, 4]].map(([x, i]) => `<path style="--i:${i}" transform="translate(${x} 200) scale(.35)" d="${heart}"/>`).join('')}</g>
          <path class="v-heart-bg" d="${heart}" transform="translate(150 140) scale(1.9)"/>
          <g clip-path="url(#vHeart-${uid(card)})"><rect class="v-fill" x="90" y="100" width="120" height="70"/></g>
          <path class="v-heart" d="${heart}" transform="translate(150 140) scale(1.9)"/>`);
      }
    },

    newyear: {
      name: 'New Year', group: 'holiday',
      sounds: {
        start: clip('glasses-clink', 'glassClink'), pause: 'glassLow', tick: 'watchTick', warn: 'countdownBeeps', alarm: clip('fireworks', 'launch'),
        lap: clip('glasses-clink', 'glassClink'), step: 'pop', stepDown: 'glassLow', target: clip('champagne-cork', 'pop'), allDone: clip('crowd-cheer', 'success')
      },
      // Bubbles rise in the glass while running; fireworks burst at the alarm.
      art: () => {
        const burst = (x, y, i, n = 12) => `<g class="ny-burst" style="--i:${i}" transform="translate(${x} ${y})">${Array.from({ length: n }, (_, k) => `<line x1="0" y1="6" x2="0" y2="22" transform="rotate(${k * 360 / n})"/>`).join('')}</g>`;
        return svg(`
          <g class="ny-stars">${[[20, 20], [60, 50], [110, 16], [180, 30], [140, 70], [30, 110]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="1.4" style="--i:${i}"/>`).join('')}</g>
          ${burst(50, 50, 0)}${burst(120, 36, 1, 14)}${burst(170, 80, 2, 10)}
          <g transform="translate(180 146) scale(.62)">
            <path class="ny-glass" d="M-16 0H16L4 30V56H14V60H-14V56H-4V30Z"/>
            <path class="ny-wine" d="M-13 6H13L3 26H-3Z"/>
            <g class="ny-bubbles">${[[-4, 0], [2, 1], [-1, 2], [5, 3]].map(([x, i]) => `<circle cx="${x}" cy="24" r="1.4" style="--i:${i}"/>`).join('')}</g>
          </g>`, 'xMidYMid slice');
      }
    },

    bonfire: {
      name: 'Bonfire Night', group: 'holiday',
      sounds: {
        start: clip('sparkler', 'fizz'), pause: clip('twig-snap', 'softClick'), tick: 'softClick', warn: 'whoosh', alarm: clip('fireworks', 'launch'),
        lap: 'whoosh', step: clip('firecracker', 'pop'), stepDown: clip('twig-snap', 'softClick'), target: clip('firecracker', 'pop'), allDone: clip('fireworks', 'launch')
      },
      // A sparkler writes a trail with progress; rockets go up at the alarm.
      art: () => svg(`
        <path class="bn-trail" d="M20 150C40 110 70 170 90 120S140 80 150 110"/>
        <g class="bn-rockets">${[[40, 0], [90, 1], [140, 2]].map(([x, i]) => `<g style="--i:${i}" transform="translate(${x} 200)"><line x1="0" y1="0" x2="0" y2="-14"/><circle cx="0" cy="-16" r="2.5"/></g>`).join('')}</g>
        <g transform="translate(176 196) scale(.7)">
          <g class="bn-fire">
            <path class="bn-flame o" d="M0 0C-24-20-12-48 0-78C12-48 24-20 0 0Z"/>
            <path class="bn-flame i" d="M0 0C-12-12-6-30 0-46C6-30 12-12 0 0Z"/>
          </g>
          <path class="bn-logs" d="M-34 4L30-12M34 4L-30-12M-20 6L0-18L20 6"/>
        </g>
        <g class="bn-sparks">${[[150, 0], [162, 1], [170, 2], [156, 3], [144, 4]].map(([x, i]) => `<circle cx="${x}" cy="120" r="1.5" style="--i:${i}"/>`).join('')}</g>`)
    },

    diwali: {
      name: 'Diwali', group: 'holiday',
      sounds: {
        start: clip('hand-bell', 'bellJingle'), pause: 'tapLow', tick: 'softClick', warn: 'twinkle', alarm: clip('firecrackers', 'pop'),
        lap: 'bellJingle', step: 'bellJingle', stepDown: 'tapLow', target: clip('hand-bell', 'eidChime'), allDone: clip('fireworks', 'launch')
      },
      // A row of diyas lights up with progress; the rangoli turns while running.
      art: () => {
        const petals = Array.from({ length: 8 }, (_, k) => `<ellipse cx="0" cy="-22" rx="9" ry="18" transform="rotate(${k * 45})"/>`).join('');
        const dots = Array.from({ length: 16 }, (_, k) => { const a = k * Math.PI / 8; return `<circle cx="${(Math.cos(a) * 46).toFixed(1)}" cy="${(Math.sin(a) * 46).toFixed(1)}" r="3.4"/>`; }).join('');
        return svgTop(`<g transform="translate(140 60)"><g class="dw-rangoli"><g class="dw-petals">${petals}</g><circle class="dw-core" r="10"/><g class="dw-dots">${dots}</g></g></g>`)
          + svg(`<g class="dw-diyas">${[[62, 186], [96, 170], [130, 162], [164, 170], [192, 186]].map(([x, y], i) => `<g class="dw-diya" style="--i:${i}" transform="translate(${x} ${y})">
            <path class="dw-flame" d="M0-6C-7-14-3-22 0-30C3-22 7-14 0-6Z"/>
            <path class="dw-lamp" d="M-17-4Q0 16 17-4Z"/></g>`).join('')}</g>`);
      }
    },

    hanukkah: {
      name: 'Hanukkah', group: 'holiday',
      sounds: {
        start: 'twinkle', pause: 'tapLow', tick: 'softClick', warn: 'dreidel', alarm: 'hanukkahChime',
        lap: 'dreidel', step: 'bellJingle', stepDown: 'tapLow', target: clip('hand-bell', 'hanukkahChime'), allDone: 'hanukkahChime'
      },
      // The menorah's candles light one by one with progress; a dreidel spins at the alarm.
      art: () => {
        const arms = [1, 2, 3, 4].map(k => `<path d="M140 150Q${140 - k * 13} 150 ${140 - k * 13} 118M140 150Q${140 + k * 13} 150 ${140 + k * 13} 118"/>`).join('');
        const xs = [-52, -39, -26, -13, 13, 26, 39, 52];
        const candles = xs.map((dx, i) => `<g class="hk-candle" style="--i:${i}" transform="translate(${140 + dx} 118)"><rect x="-2.5" y="-14" width="5" height="14"/><path class="hk-flame" d="M0-15C-3.5-20-1.2-24 0-29C1.2-24 3.5-20 0-15Z"/></g>`).join('');
        return svg(`<g class="hk-menorah"><g class="hk-arms">${arms}<path d="M140 118V184M116 188H164"/></g>${candles}
            <g class="hk-shamash" transform="translate(140 104)"><rect x="-3" y="-16" width="6" height="16"/><path class="hk-flame" d="M0-17C-3.5-22-1.2-26 0-31C1.2-26 3.5-22 0-17Z"/></g></g>`)
          + svgTop(`<g transform="translate(150 60)"><g class="hk-dreidel"><path d="M-20-28H20V8L0 32-20 8Z"/><rect x="-4" y="-44" width="8" height="16"/></g></g>`);
      }
    },

    lunar: {
      name: 'Lunar New Year', group: 'holiday',
      sounds: {
        start: clip('gong', 'gongSoft'), pause: 'woodLow', tick: 'woodBlock', warn: 'gongSoft', alarm: clip('firecrackers', 'pop'),
        lap: 'woodBlock', step: 'woodBlock', stepDown: 'woodLow', target: clip('gong', 'gongSoft'), allDone: clip('firecrackers', 'pop')
      },
      // Lanterns sway while running; plum blossom below; sparks at the alarm.
      art: () => {
        const lantern = (x, y, i, sc) => `<g transform="translate(${x} 0)"><g class="ln-lantern" style="--i:${i}">
          <line class="ln-string" x1="0" y1="0" x2="0" y2="${y - 19 * sc}"/>
          <g transform="translate(0 ${y}) scale(${sc})"><rect class="ln-cap" x="-11" y="-23" width="22" height="6" rx="2"/><ellipse class="ln-body" rx="24" ry="19"/>
            <path class="ln-rib" d="M0-19V19M-12-17Q-19 0-12 17M12-17Q19 0 12 17"/><rect class="ln-cap" x="-11" y="17" width="22" height="6" rx="2"/>
            <path class="ln-tassel" d="M0 23V40M-4 40H4"/></g></g></g>`;
        return svgTop(`${lantern(126, 46, 0, .9)}${lantern(174, 34, 1, .7)}
            <g class="ln-sparks">${Array.from({ length: 10 }, (_, k) => `<circle style="--i:${k}" cx="${100 + (k * 23) % 96}" cy="${70 + (k * 31) % 90}" r="3"/>`).join('')}</g>`)
          + svg(`<g class="ln-branch"><path d="M200 196Q160 190 140 170T96 150"/>${[[182, 186], [158, 180], [140, 166], [118, 156], [100, 150]].map(([x, y]) => `<circle class="ln-blossom" cx="${x}" cy="${y - 7}" r="6"/>`).join('')}</g>`);
      }
    },

    eid: {
      name: 'Eid', group: 'holiday',
      sounds: {
        start: 'twinkle', pause: 'tapLow', tick: 'softClick', warn: 'twinkle', alarm: 'eidChime',
        lap: 'bellJingle', step: 'bellJingle', stepDown: 'tapLow', target: clip('hand-bell', 'eidChime'), allDone: 'eidChime'
      },
      // Crescent moon and star up top; a lantern glows brighter with progress.
      art: card => {
        const fanous = (x, len, i, sc) => `<g transform="translate(${x} 0)"><g class="ed-lantern" style="--i:${i}">
          <line class="ed-chain" x1="0" y1="${200 - len - 60 * sc}" x2="0" y2="${200 - 60 * sc}"/>
          <g transform="translate(0 ${200 - 60 * sc}) scale(${sc})"><path class="ed-top" d="M-11 12L0 0 11 12Z"/><path class="ed-glass" d="M-17 12H17L13 48H-13Z"/>
            <path class="ed-frame" d="M-17 12H17L13 48H-13ZM0 12V48M-15 30H15"/><path class="ed-top" d="M-13 48H13L6 58H-6Z"/></g></g></g>`;
        return svgTop(`
            <defs><mask id="eMoon-${uid(card)}"><rect width="200" height="200" fill="#fff"/><circle cx="168" cy="46" r="36" fill="#000"/></mask></defs>
            <g class="ed-stars">${[[70, 30], [96, 70], [60, 100], [120, 16]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="2.4" style="--i:${i}"/>`).join('')}</g>
            <circle class="ed-moon" cx="150" cy="60" r="44" mask="url(#eMoon-${uid(card)})"/>
            <path class="ed-star" d="M178 104l3.6 7.5 8.1.9-6 5.6 1.7 8-7.4-4.1-7.4 4.1 1.7-8-6-5.6 8.1-.9Z"/>`)
          + svg(`${fanous(176, 26, 0, 1)}${fanous(134, 14, 1, .75)}`);
      }
    },

    summer: {
      name: 'Summer Holidays', group: 'holiday',
      sounds: {
        start: clip('beach-waves', 'drip'), pause: 'drip', tick: 'softClick', warn: clip('gulls', 'twinkle'), alarm: 'greensleeves',
        lap: 'pop', step: 'pop', stepDown: 'drip', target: clip('gulls', 'success'), allDone: 'greensleeves'
      },
      // The sun turns, waves roll while running, and the ice cream melts as time runs out.
      art: () => svgTop(`<g transform="translate(150 50)"><g class="sm-sun"><circle r="24"/>${Array.from({ length: 12 }, (_, k) => `<line x1="0" y1="-32" x2="0" y2="-44" transform="rotate(${k * 30})"/>`).join('')}</g></g>
          <path class="sm-gull" d="M0 0q9-9 18 0q9-9 18 0"/>`)
        + svgFull(`<g class="sm-waves"><path class="sm-wave a" d="M-40 186q20-8 40 0t40 0t40 0t40 0t40 0t40 0t40 0V200H-40Z"/>
            <path class="sm-wave b" d="M-60 192q20-6 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0V200H-60Z"/></g>`)
        + svg(`<g transform="translate(170 140)">
            <path class="sm-cone" d="M-16 0L0 46 16 0Z"/><path class="sm-waffle" d="M-12 5L5 35M-3 3L9 21M12 5L-5 35"/>
            <g class="sm-scoop"><circle cx="0" cy="-10" r="17"/><path class="sm-drip" d="M-10-2Q-10 10-6 13Q-2 10-4-2Z"/></g>
          </g>`)
    }
  };

  VT.themeOrder = Object.keys(VT.themes);

  // Holiday that each Sleeps preset pairs with.
  VT.holidayTheme = { christmas: 'christmas', christmasEve: 'christmas', halloween: 'halloween', easter: 'easter',
    valentines: 'valentine', newYear: 'newyear', bonfire: 'bonfire', diwali: 'diwali', hanukkah: 'hanukkah',
    lunarNewYear: 'lunar', eidFitr: 'eid', eidAdha: 'eid', midsummer: 'summer' };

  // <option>s for a theme <select>, grouped into everyday themes and holidays.
  VT.themeOptions = function(selected){
    const opt = id => `<option value="${id}"${id === selected ? ' selected' : ''}>${VT.esc(VT.themes[id].name)}</option>`;
    const everyday = VT.themeOrder.filter(id => !VT.themes[id].group), holiday = VT.themeOrder.filter(id => VT.themes[id].group === 'holiday');
    return `<optgroup label="Everyday">${everyday.map(opt).join('')}</optgroup><optgroup label="Holidays">${holiday.map(opt).join('')}</optgroup>`;
  };
})(window.VT);
