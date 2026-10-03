# Fonts

The app's 22 font families are bundled here, so it makes no requests to Google and works offline. The files are the Latin and Latin Extended subsets of each family, downloaded from Google Fonts (40 `.woff2` files, about 805 KB). Identical files are stored once: variable fonts such as Inter use one file for every weight. `fonts.css` declares them with `unicode-range`, so a browser only downloads a subset when a card actually uses one of its characters.

To add a family, download its `.woff2` files, add `@font-face` rules to `fonts.css`, put its licence in `licenses/`, and add it to the list in `js/credits.js`.

| Family | Licence | Licence text |
|---|---|---|
| Amiri | SIL Open Font License 1.1 | [`licenses/amiri-OFL.txt`](licenses/amiri-OFL.txt) |
| Bebas Neue | SIL Open Font License 1.1 | [`licenses/bebasneue-OFL.txt`](licenses/bebasneue-OFL.txt) |
| Bitter | SIL Open Font License 1.1 | [`licenses/bitter-OFL.txt`](licenses/bitter-OFL.txt) |
| Bungee | SIL Open Font License 1.1 | [`licenses/bungee-OFL.txt`](licenses/bungee-OFL.txt) |
| Chewy | Apache License 2.0 | [`licenses/chewy-LICENSE.txt`](licenses/chewy-LICENSE.txt) |
| Cinzel | SIL Open Font License 1.1 | [`licenses/cinzel-OFL.txt`](licenses/cinzel-OFL.txt) |
| Cormorant Garamond | SIL Open Font License 1.1 | [`licenses/cormorantgaramond-OFL.txt`](licenses/cormorantgaramond-OFL.txt) |
| Creepster | SIL Open Font License 1.1 | [`licenses/creepster-OFL.txt`](licenses/creepster-OFL.txt) |
| Frank Ruhl Libre | SIL Open Font License 1.1 | [`licenses/frankruhllibre-OFL.txt`](licenses/frankruhllibre-OFL.txt) |
| Fredoka | SIL Open Font License 1.1 | [`licenses/fredoka-OFL.txt`](licenses/fredoka-OFL.txt) |
| Inter | SIL Open Font License 1.1 | [`licenses/inter-OFL.txt`](licenses/inter-OFL.txt) |
| Limelight | SIL Open Font License 1.1 | [`licenses/limelight-OFL.txt`](licenses/limelight-OFL.txt) |
| Mountains of Christmas | Apache License 2.0 | [`licenses/mountainsofchristmas-LICENSE.txt`](licenses/mountainsofchristmas-LICENSE.txt) |
| Nunito | SIL Open Font License 1.1 | [`licenses/nunito-OFL.txt`](licenses/nunito-OFL.txt) |
| Orbitron | SIL Open Font License 1.1 | [`licenses/orbitron-OFL.txt`](licenses/orbitron-OFL.txt) |
| Pacifico | SIL Open Font License 1.1 | [`licenses/pacifico-OFL.txt`](licenses/pacifico-OFL.txt) |
| Playfair Display | SIL Open Font License 1.1 | [`licenses/playfairdisplay-OFL.txt`](licenses/playfairdisplay-OFL.txt) |
| Press Start 2P | SIL Open Font License 1.1 | [`licenses/pressstart2p-OFL.txt`](licenses/pressstart2p-OFL.txt) |
| Quicksand | SIL Open Font License 1.1 | [`licenses/quicksand-OFL.txt`](licenses/quicksand-OFL.txt) |
| Space Mono | SIL Open Font License 1.1 | [`licenses/spacemono-OFL.txt`](licenses/spacemono-OFL.txt) |
| VT323 | SIL Open Font License 1.1 | [`licenses/vt323-OFL.txt`](licenses/vt323-OFL.txt) |
| Yatra One | SIL Open Font License 1.1 | [`licenses/yatraone-OFL.txt`](licenses/yatraone-OFL.txt) |
