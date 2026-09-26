// Credits: sound clips, fonts and licence, shown in the About & credits dialog.
// "Used by" is worked out from the theme registry, so it stays accurate as themes change.
(function(VT){
  const BSB = 'https://bigsoundbank.com/';
  const sound = (file, title, page) => ({ file, title, url: BSB + page + '.html' });

  VT.credits = {
    sounds: [
      sound('dog-bark', 'Barking dog #3', 'barking-dog-3-s2955'),
      sound('dog-yip', 'Barking of a Spitz', 'barking-of-a-spitz-s0682'),
      sound('cat-meow', 'Meow Cat #2', 'meow-cat-2-s1890'),
      sound('cat-mew', 'Little Meow of a Cat #1', 'little-meow-of-a-cat-s0494'),
      sound('cat-purr', 'Cat Purr', 'cat-purr-s0436'),
      sound('referee-whistle', 'Plastic Whistle #1', 'plastic-whistle-s1017'),
      sound('crowd-cheer', 'Shouts and Applauses of Teens #1', 'shouts-and-applauses-of-teens-1-s0236'),
      sound('air-horn', 'Pneumatic horn, double #1', 'pneumatic-horn-double-1-s1830'),
      sound('alarm-clock', 'Mechanical alarm clock, short ring', 'mechanical-alarm-clock-short-ring-s1373'),
      sound('microwave-ding', 'Microwave Bell', 'microwave-bell-s1631'),
      sound('pan-strike', 'Aluminum pan bottom 26cm', 'fond-poele-en-aluminium-26cm-sample-s0382'),
      sound('singing-bowl', 'Tibetan bowl struck #3', 'tibetan-bowl-struck-3-s2554'),
      sound('fire-crackle', 'Fireplace #5', 'fireplace-5-s2857'),
      sound('owl', 'Tawny Owl #3', 'tawny-owl-3-s3459'),
      sound('blackbird', 'Common Blackbird #30', 'common-blackbird-30-s3503'),
      sound('twig-snap', 'Broken twigs #2', 'broken-twigs-2-s1300'),
      sound('bubbles', 'Water bubbles', 'water-bubbles-s0150'),
      sound('steam-whistle', 'Whistling train #1', 'whistling-train-1-s0225'),
      sound('steam-hiss', 'Hiss of steam train #7', 'hiss-of-steam-train-7-s3019'),
      sound('party-horn', 'Party horn #2', 'party-horn-2-s1554'),
      sound('space-beep', 'Aerospace communication beep #1', 'aerospace-beep-1-s2380'),
      sound('sleigh-bells', 'Bells of Santa Claus #1', 'bells-of-santa-claus-s0585'),
      sound('ho-ho-ho', 'Santa Claus, Oh Oh Oh #1', 'santa-claus-oh-oh-oh-1-s2074'),
      sound('door-creak', 'Creaking Door #1', 'creaking-door-s0302'),
      sound('witch-cackle', 'Strident Laughter', 'strident-laughter-s0489'),
      sound('chick-chirp', 'Chick that chirp', 'chick-that-chirp-s0672'),
      sound('kiss', 'Kiss #1', 'kiss-1-s2196'),
      sound('fireworks', 'Fireworks far Away', 'fireworks-far-away-s1050'),
      sound('firecracker', 'Firecracker with wick #4', 'firecracker-with-wick-4-s1140'),
      sound('sparkler', 'Sparkling Candle #1', 'sparkling-candle-1-s1278'),
      sound('champagne-cork', 'Champagne cork #2', 'champagne-cork-2-s0648'),
      sound('glasses-clink', 'Cheers, Champagne Flute #1', 'cheers-champagne-flute-1-s1335')
    ],
    fonts: ['Inter', 'Playfair Display', 'Space Mono', 'Fredoka', 'Press Start 2P', 'Orbitron', 'Nunito',
      'Cormorant Garamond', 'Quicksand', 'Bitter', 'VT323', 'Bebas Neue', 'Cinzel',
      'Mountains of Christmas', 'Creepster', 'Chewy', 'Pacifico', 'Limelight', 'Bungee']
  };

  // Which themes use a clip, e.g. { 'dog-bark': ['A Dog’s Life'] }.
  VT.credits.usedBy = function(){
    const map = {};
    for(const id of VT.themeOrder){
      for(const spec of Object.values(VT.themes[id].sounds)){
        if(!spec || !spec.clip) continue;
        const file = spec.clip.replace(/^sounds\/|\.mp3$/g, '');
        (map[file] = map[file] || new Set()).add(VT.themes[id].name);
      }
    }
    return map;
  };

  VT.credits.themeHasClips = id => Object.values(VT.themes[id].sounds).some(s => s && s.clip);

  VT.credits.render = function(){
    const used = VT.credits.usedBy(), esc = VT.esc;
    const rows = VT.credits.sounds.map(s => `
      <tr>
        <td><button class="linkish" data-preview="${esc(s.file)}" aria-label="Play ${esc(s.title)}">▶</button></td>
        <td><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.title)}</a></td>
        <td class="muted">${[...(used[s.file] || [])].map(esc).join(', ') || '—'}</td>
      </tr>`).join('');
    return `
      <p>Counter Counter is free software under the <a href="https://www.gnu.org/licenses/gpl-3.0.html" target="_blank" rel="noopener">GNU GPL v3.0</a>.
        Source: <a href="https://github.com/Oddly-Dan/counter-counter" target="_blank" rel="noopener">github.com/Oddly-Dan/counter-counter</a>.
        The Voice Tally card is based on <a href="https://github.com/Oddly-Dan/tally" target="_blank" rel="noopener">Voice Tally</a>.</p>
      <h3>Sound effects</h3>
      <p>Recorded by <a href="https://josephsardin.fr/" target="_blank" rel="noopener">Joseph Sardin</a> for
        <a href="${BSB}" target="_blank" rel="noopener">BigSoundBank.com</a> and released under
        <a href="https://creativecommons.org/publicdomain/zero/1.0/" target="_blank" rel="noopener">CC0 1.0</a> (public domain).
        We trimmed them and evened out their loudness. All other sounds are synthesised in your browser.</p>
      <div class="table-wrap"><table class="credits">
        <thead><tr><th><span class="sr-only">Play</span></th><th>Sound</th><th>Used by</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <h3>Fonts</h3>
      <p>${VT.credits.fonts.map(esc).join(', ')}, from <a href="https://fonts.google.com/" target="_blank" rel="noopener">Google Fonts</a>
        under the <a href="https://openfontlicense.org/" target="_blank" rel="noopener">SIL Open Font License</a>.</p>`;
  };
})(window.VT);
