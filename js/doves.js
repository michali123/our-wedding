/* ============================================================
   doves.js — flying doves for the Josh & Michal wedding site.
   Drop-in, no dependencies. Add before </body>:
       <script src="js/doves.js" defer></script>

   Three moments:
     1. Intro flock  — doves cross the save-the-date card on load.
     2. Release      — a small flock lifts away when "Enter" is tapped.
     3. Ambient      — one dove drifts across the page every so often.

   Uses the same dove shape as the static birds already in index.html,
   and the same palette variables (--ivory, --ink-muted). Fully disabled
   under prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';

  var CFG = window.DOVES_CONFIG || {};
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;

  var DOVE_SVG =
    '<svg viewBox="0 0 100 45" class="dv-svg" aria-hidden="true">' +
      '<g class="dv-wing dv-wing-l"><path d="M50,27 C42,15 26,11 6,21 C18,25 34,29 48,33 C50,31 50,29 50,27 Z"></path></g>' +
      '<g class="dv-wing dv-wing-r"><path d="M50,27 C58,15 74,11 94,21 C82,25 66,29 52,33 C50,31 50,29 50,27 Z"></path></g>' +
      '<path d="M48,31 L41,40 L50,36 Z"></path>' +
      '<path d="M50,22 C54,22 56,26 54,30 C53,33 49,34 47,31 C46,27 47,23 50,22 Z"></path>' +
    '</svg>';

  var CSS = [
    '.dv-layer{position:fixed;inset:0;overflow:hidden;pointer-events:none;}',
    '.dv-layer-intro{position:absolute;z-index:3;}',
    '.dv-layer-page{z-index:30;}',
    '.dv{position:absolute;left:0;top:0;will-change:transform,opacity;}',
    '.dv-b{will-change:transform;}',
    '.dv-svg{display:block;width:100%;height:auto;overflow:visible;',
      'fill:var(--ivory,#f4f3f0);stroke:var(--ink-muted,#6b6259);stroke-width:1.4;',
      'stroke-linejoin:round;paint-order:stroke;',
      'filter:drop-shadow(0 1px 2px rgba(32,29,26,.22));}',
    '.dv-wing{transform-box:fill-box;transform-origin:100% 50%;',
      'animation:dv-flap var(--flap,.5s) ease-in-out infinite alternate;}',
    '.dv-wing-r{transform-origin:0% 50%;animation-name:dv-flap-r;}',
    '@keyframes dv-flap{from{transform:rotate(6deg)}to{transform:rotate(-30deg)}}',
    '@keyframes dv-flap-r{from{transform:rotate(-6deg)}to{transform:rotate(30deg)}}',
    '@keyframes dv-cross{',
      '0%{transform:translate3d(var(--x0),0,0);opacity:0}',
      '9%{opacity:var(--op,1)}',
      '86%{opacity:var(--op,1)}',
      '100%{transform:translate3d(var(--x1),var(--rise,-6vh),0);opacity:0}}',
    '@keyframes dv-bob{from{transform:translateY(6px) rotate(-5deg)}',
      'to{transform:translateY(-16px) rotate(5deg)}}',
    '@keyframes dv-lift{',
      '0%{transform:translate3d(0,0,0) scale(1);opacity:0}',
      '10%{opacity:var(--op,1)}',
      '70%{opacity:calc(var(--op,1) * .55)}',
      '100%{transform:translate3d(var(--dx),var(--dy),0) scale(var(--s1,.08));opacity:0}}'
  ].join('');

  var style = document.createElement('style');
  style.textContent = CSS;
  document.head.appendChild(style);

  function rand(a, b) { return a + Math.random() * (b - a); }

  /* One dove: outer element carries the crossing, inner the bob/flap. */
  function makeDove(opt) {
    var el = document.createElement('div');
    el.className = 'dv';
    el.setAttribute('aria-hidden', 'true');
    el.style.top = opt.top;
    el.style.width = opt.size + 'px';
    el.style.setProperty('--op', opt.opacity);
    el.style.setProperty('--flap', opt.flap.toFixed(2) + 's');

    var bob = document.createElement('div');
    bob.className = 'dv-b';
    bob.innerHTML = DOVE_SVG;
    bob.style.animation = 'dv-bob ' + opt.bob.toFixed(2) + 's ease-in-out infinite alternate';
    bob.style.animationDelay = (-rand(0, opt.bob)).toFixed(2) + 's';
    if (opt.dir < 0) bob.firstChild.style.transform = 'scaleX(-1)';
    el.appendChild(bob);
    return el;
  }

  /* A dove crossing the layer horizontally. */
  function cross(layer, o) {
    var dir = o.dir || 1;
    var size = o.size;
    var el = makeDove({
      top: o.top, size: size, dir: dir,
      opacity: o.opacity == null ? 1 : o.opacity,
      flap: o.flap || rand(0.34, 0.58) * (1 + Math.max(0, size - 40) / 90),
      bob: o.bob || rand(1.6, 2.8) * (1 + Math.max(0, size - 40) / 110)
    });
    el.style.setProperty('--x0', dir > 0 ? '-18vw' : '118vw');
    el.style.setProperty('--x1', dir > 0 ? '118vw' : '-18vw');
    el.style.setProperty('--rise', (o.rise == null ? rand(-9, -2) : o.rise) + 'vh');
    el.style.animation = 'dv-cross ' + o.dur.toFixed(2) + 's linear ' +
      (o.delay || 0).toFixed(2) + 's both';
    el.addEventListener('animationend', function (e) {
      if (e.animationName === 'dv-cross') el.remove();
    });
    layer.appendChild(el);
    return el;
  }

  function layerFor(parent, cls) {
    var l = document.createElement('div');
    l.className = 'dv-layer ' + cls;
    parent.appendChild(l);
    return l;
  }

  /* The save-the-date card stays clean — no doves until it lifts. */
  var intro = document.querySelector('.intro');
  var introLayer = null;

  /* ── 2. Release on Enter ──────────────────────────────────
     Doves scatter upward and outward as the card lifts away. */
  var pageLayer = layerFor(document.body, 'dv-layer-page');

  function release() {
    /* Vanishing point: high and slightly off-centre, the way a real flock
       recedes to a single spot on the horizon. */
    var VP_X = 52, VP_Y = 14;
    for (var i = 0; i < 26; i++) {
      var dir = i % 2 ? 1 : -1;
      /* Front of the flock is big, close and quick; the tail is smaller,
         further back and lags — so the group spreads out as it recedes. */
      var depth = i / 25;                       // 0 = lead bird, 1 = last
      var startX = 50 + rand(-30, 30);
      var startY = 74 + rand(-14, 14);
      var el = makeDove({
        top: startY + 'vh',
        size: rand(150, 195) - depth * rand(80, 125),
        dir: dir,
        opacity: rand(0.72, 1) - depth * 0.18,
        flap: rand(0.42, 0.78) + depth * 0.18,
        bob: rand(2.0, 3.4)
      });
      el.style.left = startX + 'vw';
      el.style.setProperty('--dx', ((VP_X - startX) + rand(-9, 9)).toFixed(1) + 'vw');
      el.style.setProperty('--dy', ((VP_Y - startY) + rand(-8, 8)).toFixed(1) + 'vh');
      el.style.setProperty('--s1', rand(0.04, 0.11).toFixed(3));
      el.style.animation = 'dv-lift ' +
        (rand(4.2, 6.0) + depth * rand(3.0, 6.5)).toFixed(2) +
        's cubic-bezier(.25,.5,.3,1) ' +
        (depth * rand(1.6, 3.4) + rand(0, 0.5)).toFixed(2) + 's both';
      (function (n) {
        n.addEventListener('animationend', function (e) {
          if (e.animationName === 'dv-lift') n.remove();
        });
      })(el);
      pageLayer.appendChild(el);
    }
  }

  var released = false;
  function onEnter() {
    if (released) return;
    released = true;
    release();
    if (introLayer) setTimeout(function () { introLayer.remove(); }, 1200);
    startAmbient(9000);
  }

  if (intro) {
    new MutationObserver(function () {
      if (intro.classList.contains('opening') || intro.classList.contains('closed')) onEnter();
    }).observe(intro, { attributes: true, attributeFilter: ['class'] });
  }

  /* ── 3. Ambient drift ─────────────────────────────────────
     A single small dove crosses now and then — quiet enough to
     read as atmosphere, never as decoration competing with copy. */
  var ambientTimer = null;
  function scheduleAmbient(ms) {
    clearTimeout(ambientTimer);
    ambientTimer = setTimeout(function () {
      if (!document.hidden) {
        var pair = Math.random() < 0.28;
        var dir = Math.random() < 0.5 ? 1 : -1;
        var top = rand(8, 62) + '%';
        cross(pageLayer, {
          top: top, size: rand(24, 42), dur: rand(20, 30),
          dir: dir, opacity: rand(0.36, 0.58)
        });
        if (pair) {
          cross(pageLayer, {
            top: (parseFloat(top) + rand(5, 11)) + '%', size: rand(18, 30),
            dur: rand(22, 32), delay: rand(1.2, 2.6), dir: dir, opacity: rand(0.28, 0.45)
          });
        }
      }
      scheduleAmbient(rand(15000, 30000));
    }, ms);
  }
  function startAmbient(ms) { if (CFG.ambient !== false) scheduleAmbient(ms); }

  if (!intro) startAmbient(1800);

  reduced.addEventListener('change', function (e) {
    if (e.matches) {
      clearTimeout(ambientTimer);
      pageLayer.innerHTML = '';
      if (introLayer) introLayer.innerHTML = '';
    }
  });
})();
