// Theme registry. Colours, fonts and animation live in css/themes.css under .theme-<id>;
// this file supplies each theme's sound set and decorative SVG art.
//
// A sound is either a synth recipe name (see audio.js) or { clip, fallback } for a CC0
// clip in sounds/, with a synth recipe to use if the clip can't play.
// art(card) returns SVG markup; any ids inside it must include card.id to stay unique.
// The card sets --p (progress, 0–1) and data-state, which the CSS uses to animate the art.
(function(VT){
  const clip = (name, fallback) => ({ clip: `sounds/${name}.mp3`, fallback });
  const svg = (inner, fit = 'xMaxYMax meet') => `<svg viewBox="0 0 200 200" preserveAspectRatio="${fit}">${inner}</svg>`;

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
        <defs><radialGradient id="mBlob-${card.id}"><stop offset="0" stop-color="currentColor" stop-opacity=".22"/><stop offset="1" stop-color="currentColor" stop-opacity="0"/></radialGradient></defs>
        <circle class="m-blob a" cx="175" cy="25" r="80" fill="url(#mBlob-${card.id})"/>
        <circle class="m-blob b" cx="15" cy="195" r="90" fill="url(#mBlob-${card.id})"/>
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
          <linearGradient id="nSun-${card.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd319"/><stop offset=".6" stop-color="#ff5f8f"/><stop offset="1" stop-color="#ff2a6d"/></linearGradient>
          <clipPath id="nSky-${card.id}"><rect width="200" height="150"/></clipPath>
          <clipPath id="nFloor-${card.id}"><rect y="150" width="200" height="50"/></clipPath>
        </defs>
        <g class="n-sun" clip-path="url(#nSky-${card.id})">
          <circle cx="100" cy="150" r="48" fill="url(#nSun-${card.id})"/>
          <rect class="n-cut" x="40" y="126" width="120" height="3"/><rect class="n-cut" x="40" y="134" width="120" height="4"/><rect class="n-cut" x="40" y="143" width="120" height="5"/>
        </g>
        <g class="n-grid" clip-path="url(#nFloor-${card.id})">
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
    }
  };

  VT.themeOrder = Object.keys(VT.themes);
})(window.VT);
