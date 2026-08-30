# Josh & Michal — Our Wedding

A standalone, static wedding website. No framework, no build step, no backend
of its own — plain HTML/CSS/JS that you can host anywhere for free.

## What's here

- `index.html` — the whole site (opening reveal, hero photo carousel, event
  details, travel, gifts note, FAQ, RSVP)
- `css/styles.css` — all styling
- `js/main.js` — opening reveal, hero carousel, countdown timer, mobile nav,
  FAQ accordion, RSVP form submission
- `images/` — where your photos go (see `images/README.md` for exact
  filenames)

Every piece of content (names, date, venues, FAQ copy) is written directly
in `index.html` — just edit the text in place.

## 1. RSVP form (Formspree, free) — done

The RSVP form posts to [Formspree](https://formspree.io) (free for up to 50
submissions/month, no server or database required) — already wired up to
`https://formspree.io/f/xgaevdbe`. Submissions land in the email that form
was created with, and you can also view/export them from the Formspree
dashboard. Nothing further to do here unless you want to point it at a
different form.

## 2. Host it for free — GitHub Pages

1. In this repo on GitHub, go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Branch: `main`, folder: `/ (root)`. Save.
4. GitHub gives you a URL like `https://michali123.github.io/our-wedding/`
   within a minute or two — that's your live site.

(Want a custom domain instead, like `joshandmichal.com`? Buy one from any
registrar, then add it under the same Pages settings — GitHub gives you the
DNS records to set.)

## Editing content

Everything lives in `index.html`:

- **Names / date / countdown** — search for `Josh` / `Michal` and
  `January 17, 2027`, and update `data-target` on the `<div class="countdown">`
  (an ISO datetime) to match.
- **Event details** — the three cards inside `<section id="details">`.
- **Photos** — the hero photo strip at the top of the page (and the opening
  reveal) — see `images/README.md` for filenames.
- **FAQ** — the `<div class="faq-item">` blocks inside `<section id="faq">`.
- **Travel** — its own `<section>` block, currently placeholders ("to be
  announced") — fill in the real venue/hotel once you have it.
- **Gifts note** — `<section id="registry">`, the plain-text note about
  skipping a registry — edit the paragraph directly.

No build step — just edit and save. If you're using GitHub Pages, every push
to `main` updates the live site automatically within a minute or two.
