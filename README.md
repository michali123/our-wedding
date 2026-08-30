# Josh & Michal — Our Wedding

A standalone, static wedding website. No framework, no build step, no backend
of its own — plain HTML/CSS/JS that you can host anywhere for free.

## What's here

- `index.html` — the whole site (hero, our story, event details, travel,
  registry, FAQ, RSVP)
- `css/styles.css` — all styling
- `js/main.js` — countdown timer, mobile nav, FAQ accordion, RSVP form
  submission

Every piece of content (names, date, venues, story, FAQ copy) is written
directly in `index.html` — just edit the text in place.

## 1. Set up the RSVP form (Formspree, free)

The RSVP form needs somewhere to send submissions. This site uses
[Formspree](https://formspree.io) — free for up to 50 submissions/month,
no server or database required.

1. Sign up free at [formspree.io](https://formspree.io) and create a new form.
2. Copy your form's endpoint — it looks like `https://formspree.io/f/abcdwxyz`.
3. Open `index.html`, find the `<form id="rsvp-form" ...>` tag near the
   bottom, and replace `YOUR_FORM_ID` in its `action` attribute with your
   real form ID.
4. Submissions will land in the email you signed up with, and you can also
   view/export them from the Formspree dashboard.

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
- **Our Story** — the three blocks inside `<section id="story">`.
- **FAQ** — the `<div class="faq-item">` blocks inside `<section id="faq">`.
- **Travel, Registry** — their own `<section>` blocks, currently
  placeholders ("to be announced") — fill in real venues/links once you have
  them.

No build step — just edit and save. If you're using GitHub Pages, every push
to `main` updates the live site automatically within a minute or two.
