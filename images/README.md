# Adding your photos

The site is already wired up to look for photos by exact filename in this
folder. Until they're added, each spot shows a soft placeholder — nothing is
broken, there's just nothing to add yet.

Drop your files in here with these **exact names** (same folder as this
README) and they'll appear automatically — no code changes needed.

## Hero carousel (full-screen, top of page)

5 photos, auto-advancing every 5 seconds. Landscape orientation works best
(the image fills the screen and gets cropped to fit).

```
hero-1.jpg
hero-2.jpg
hero-3.jpg
hero-4.jpg
hero-5.jpg
```

## Photo gallery (swipeable carousel further down the page)

8 photos, portrait/4:5 orientation works best (they display as tall cards).

```
gallery-1.jpg
gallery-2.jpg
gallery-3.jpg
gallery-4.jpg
gallery-5.jpg
gallery-6.jpg
gallery-7.jpg
gallery-8.jpg
```

## Tips

- **Format:** `.jpg` (as named above). If you'd rather use `.png` or `.webp`,
  just update the file extension in the matching `<img src="...">` tags in
  `index.html`.
- **File size:** keep each photo under ~500KB if you can (export at ~1600–2000px
  on the long edge) — keeps the site fast to load, especially on phones.
- **Fewer than 5 hero photos or 8 gallery photos?** Delete the unused
  `<div class="hero-slide">...</div>` or `<div class="gallery-slide">...</div>`
  blocks in `index.html` for the ones you're not using — the carousels adapt
  automatically to however many slides are in the markup.
- Once you commit and push the images, GitHub Pages picks them up
  automatically within a minute or two.
