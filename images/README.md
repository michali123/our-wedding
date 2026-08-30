# Adding your photos

The site is already wired up to look for photos by exact filename in this
folder. Until they're added, each spot shows a soft placeholder — nothing is
broken, there's just nothing to add yet.

Drop your files in here with these **exact names** (same folder as this
README) and they'll appear automatically — no code changes needed.

## Opening reveal (`save-the-date.jpg`) — already added

The photo that splits open like a letter when the site first loads. Already
in place — replace `save-the-date.jpg` with a different photo any time by
overwriting the file (keep the same filename). Portrait orientation works
best, same as the hero strip below.

## Hero photo strip (top of page, above your names)

5 photos, shown edge-to-edge, 2 visible at a time on mobile (swipe to see
more). **Portrait orientation works best** — the strip is tall and each
photo gets cropped to fill its column, so a vertical shot (like a
phone-camera portrait photo) will look best.

```
hero-1.jpg
hero-2.jpg
hero-3.jpg
hero-4.jpg
hero-5.jpg
```

## Tips

- **Format:** `.jpg` (as named above). If you'd rather use `.png` or `.webp`,
  just update the file extension in the matching `<img src="...">` tags in
  `index.html`.
- **File size:** keep each photo under ~500KB if you can (export at ~1600–2000px
  on the long edge) — keeps the site fast to load, especially on phones.
- **Fewer than 5 hero photos?** Delete the unused
  `<div class="hero-photo-slide">...</div>` blocks in `index.html` for the
  ones you're not using — the carousel adapts automatically to however many
  slides are in the markup.
- Once you commit and push the images, GitHub Pages picks them up
  automatically within a minute or two.

## Not currently used: `gallery-1.jpg`, `gallery-2.jpg`

These two are still in this folder from when there was a separate Photos
gallery section — that section was removed since the hero strip already
covers photos, so nothing in `index.html` references them anymore. Left in
place in case you want to swap one into the hero strip later; delete them
if you'd rather clean up.
