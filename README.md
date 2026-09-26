# Counter Counter

A page of themed cards: timers, stopwatches, counters, Voice Tally counters, Sleeps countdowns, and a Card Stats card that counts the other cards. Cards resize, reorder and sort. The more cards you add, the smaller they get.

## Use

Open `index.html` in a browser, or serve the folder with GitHub Pages. There is no build step and nothing to install.

- **Add** (top bar): Timer, Stopwatch, Counter, Voice Tally, Sleeps, Card Stats, a timer preset, or a Sleeps countdown to Christmas, Halloween, New Year, Easter, Bonfire Night or a date of your own.
- **Reorder:** drag the dotted handle. With the keyboard, focus the handle, press Space, move it with the arrow keys, then press Space to drop it or Escape to cancel.
- **Resize:** drag the corner grip. Sizes snap to grid spans: S 1×1, M 2×1, L 2×2, XL 3×2, Tall 1×2, Wide 3×1. You can also pick a size from the card's ⋯ menu.
- **Sort:** Manual, Newest, Oldest, Least time remaining, Most time elapsed, Needs attention, Name, Type, Theme, Counter value. A sort is applied once. Turn on **Keep sorted** to re-sort every 5 seconds. Dragging a card switches back to Manual.
- **Filter:** All / Running / Paused / Ended, plus card type. The Card Stats card always stays visible.
- **Volume:** each card has its own volume and mute, multiplied by the master volume in the top bar. Browsers block sound until you interact with the page, so the first tap or keypress turns it on.
- **Shortcuts:** `N` opens the Add menu. With a card focused, Space starts or pauses it, and `+` / `-` step a counter.

Everything is saved in `localStorage`. After a reload, timers carry on from their real end time. A timer that ended while the page was closed shows "Missed by …". One that was still ringing keeps ringing.

## Card types

| Card | What it does |
|---|---|
| Timer | Countdown with quick presets, +1m, a warning at 10 s, an alarm that loops until dismissed, snooze, and optional overtime count-up and tick |
| Stopwatch | Start, pause, laps (the latest 3 on the card, all of them in Settings) |
| Counter | Plus and minus buttons (hold to repeat), step size, optional target with a progress bar, optional negative numbers |
| Voice Tally | A copy of [Voice Tally](https://github.com/Oddly-Dan/tally)'s counting logic: speaks every number from start to target. Only one Voice Tally card speaks at a time |
| Sleeps | Nights until Christmas, Christmas Eve, New Year, Valentine's Day, Easter (worked out for each year), Halloween, Bonfire Night, or any date, one-off or yearly. Counts calendar days, so Christmas Eve is 1 sleep. Celebrates on the day |
| Card Stats | Live counts of cards, running, paused, idle, ended and ringing, a breakdown by type, and all-time added, removed and completed totals. It can chime when everything running has ended |

## Sizes and limits

| Cards | Tier | Min card width | Row height |
|---|---|---|---|
| 1 | Hero | fills the page, up to 900 × 600 | |
| 2–4 | Large | 320px | 280px |
| 5–9 | Medium | 240px | 220px |
| 10–16 | Compact | 180px | 170px |
| 17+ | Mini | 160px | 136px |

Density can be set to Auto, Comfy (always Large) or Compact (always Mini). The limit is 24 cards by default, and you can raise it to 48. Container queries hide less important controls as a card gets smaller, in this order: the lap list, the preset chips, the inline volume slider (it moves to the ⋯ menu), the secondary buttons, and the text under the display.

## Themes

There are 16 everyday themes and 6 holiday themes, each with a light and a dark variant that follows the system setting.

| Theme | Look | Moves | Sounds |
|---|---|---|---|
| Modern | Neutral greys, indigo accent | Drifting blobs, spinning ring | Synth taps and chimes |
| Stylish | Black and gold, serif digits | Art-deco fan, gold shimmer | Glass clinks, music box |
| Banana | Sunny yellow, chunky type | Peel opens as time runs out | Boing, squish, monkey chatter |
| A Dog's Life | Warm tan | Dog sleeps, wakes and wags, barks; pawprints walk the progress | Bark, yip, squeaky toy |
| Retro Arcade | Game Boy green / arcade purple, pixel font, scanlines | Marching invader | Chiptune |
| Neon Synthwave | Magenta and cyan glow | Retro sun, scrolling grid | Saw synths, arpeggio, laser |
| Kitchen | Enamel mint and tomato | Egg-timer dial winds down, steam | Alarm-clock bell, microwave ding, pan |
| Zen | Rice paper and ink | Ensō brush circle, falling leaf | Wood block, singing bowl |
| Deep Ocean | Blue gradients | Rising bubbles, passing whale | Bubbles, sonar, whale song |
| Space | Starfield | Rocket climbs, then launches | Telemetry beeps, launch rumble |
| Campfire | Forest night | Fire burns down, embers | Crackle, owl, blackbird, twig snap |
| Terminal | Phosphor green, blinking cursor | Segmented progress | Key clacks, bell, klaxon |
| Stadium | Scoreboard LEDs on a pitch | Confetti | Referee whistle, air horn, crowd |
| Cat Nap | Lilac | Cat naps, then knocks the mug off | Purr, mew, meow, collar bell |
| Candy | Pastel stripes | Lollipop shrinks, sprinkles | Pops, fizz, party horn |
| Steampunk | Brass and leather | Gears turn, pressure gauge, steam | Steam hiss and whistle, ratchet |

| Holiday theme | Look | Moves | Sounds |
|---|---|---|---|
| Christmas | Red, green and gold | Fairy lights twinkle, snow falls, the present opens | Sleigh bells, ho ho ho, Jingle Bells |
| Halloween | Pumpkin orange on midnight purple | Jack-o'-lantern flickers, bats scatter | Creaking door, owl, witch's cackle, bone xylophone |
| Easter | Pastels | The egg cracks with progress, a chick pops out | Chick chirps, egg taps, boing |
| Valentine's Day | Pinks and reds | The heart fills with progress, hearts float up | Kiss, heartbeat, harp |
| New Year | Midnight and gold | Champagne bubbles, fireworks | Glasses clink, cork pop, fireworks, cheering |
| Bonfire Night | Smoky night sky | Sparkler trail, bonfire, rockets | Sparkler, firecracker, fireworks, whoosh |

A Sleeps card for a holiday picks up the matching theme when you add it from the Add menu, and when you change its event in Settings. Untick "Use the holiday's theme" to keep your own.

A theme is a `.theme-<id>` block of `--t-*` tokens in `css/themes.css`, plus an entry in `js/themes.js` with its sound set and SVG art. The art reacts to the card's `data-state` and `--p` (progress). All motion stops when the system's reduced-motion setting is on. More holiday themes are planned: see [ROADMAP.md](ROADMAP.md).

## Credits

Recorded sound effects are by Joseph Sardin, from [BigSoundBank.com](https://bigsoundbank.com/), released under [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/). They were trimmed and loudness-normalised for this app, and are listed with their sources in `js/credits.js` and `sounds/README.md`. All other sounds are synthesised with the Web Audio API. Fonts are from Google Fonts under the SIL Open Font License. The app shows all of this under **About & credits** in the top bar, in a footer link, and in each card's ⋯ menu for themes that use recorded sounds.

## Structure

```
index.html      page shell, top bar, dialog
css/app.css     layout, density tiers, card structure, container queries
css/themes.css  theme tokens and animations
js/util.js      icons, formatting, FLIP animation, popover, toasts
js/audio.js     AudioContext, synth recipes, clips, alarm loop with ducking
js/themes.js    theme registry: sounds and art
js/credits.js   sound, font and licence credits
js/types.js     card types
js/app.js       state, saving, grid, sort/filter, drag, resize, ticker
sounds/         CC0 clips (see sounds/README.md)
```

## Licence

[GPL-3.0](LICENSE)
