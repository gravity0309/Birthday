# A Birthday Evening

A small React + Vite birthday-card experience with a vintage listening-room look.

## Run it

```sh
npm install
npm run dev
```

## Add photographs

Put your own images in `public/images/memories/`, then edit `src/data/memories.js`.
Each memory accepts an `image` path, an optional `caption`, and an optional `date`.
The first six entries appear as gifts; all entries appear in the photo gallery. The
final surprise uses the separate `finalSurprise` entry. Missing image files show a
paper-style placeholder.

## Add Spotify players

Edit `src/data/music.js` and paste a Spotify track, album, or playlist URL into a
selection's `url`. The listening room uses Spotify's official embed and never
autoplays. Without a URL, it provides a Spotify search link for that artist.
