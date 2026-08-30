// Josh & Michal — wedding site interactivity. Plain vanilla JS, no build step.
(function () {
  "use strict";

  // ── Opening reveal ───────────────────────────────────────
  // Shown once per browser session (sessionStorage) — a repeat visit or a
  // page refresh mid-browsing shouldn't force guests through it again.
  var intro = document.getElementById("intro");
  if (intro) {
    var seenIntro = false;
    try {
      seenIntro = sessionStorage.getItem("introSeen") === "1";
    } catch (e) {
      // Storage blocked (private mode, etc.) — just show the intro every time.
    }

    if (seenIntro) {
      intro.classList.add("closed");
    } else {
      document.documentElement.style.overflow = "hidden";

      var introOpened = false;
      var openIntro = function () {
        if (introOpened) return;
        introOpened = true;
        try {
          sessionStorage.setItem("introSeen", "1");
        } catch (e) {
          // Ignore — worst case it shows again next time.
        }
        intro.classList.add("opening");
        document.documentElement.style.overflow = "";
        setTimeout(function () {
          intro.classList.add("closed");
        }, 1300);
      };

      intro.addEventListener("click", openIntro);
      setTimeout(openIntro, 2600);
    }
  }

  // ── Mobile nav ──────────────────────────────────────────
  var navToggle = document.querySelector(".nav-toggle");
  var navMobile = document.querySelector(".nav-mobile");
  if (navToggle && navMobile) {
    navToggle.addEventListener("click", function () {
      var isOpen = navMobile.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
    navMobile.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navMobile.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // ── Swipeable photo-strip carousel ───────────────────────
  // Powers the hero photo strip — a plain scroll-snap track with optional
  // dot indicators, prev/next arrows, and
  // optional autoplay (opts.autoplayMs) that loops back to the start,
  // pauses while the user is interacting, and pauses while the tab is
  // hidden so it doesn't churn in the background.
  function initTrackCarousel(opts) {
    var track = opts.track;
    if (!track) return;
    var slides = Array.prototype.slice.call(track.children);
    if (!slides.length) return;
    var dotsWrap = opts.dots;
    var prevBtn = opts.prev;
    var nextBtn = opts.next;

    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.setAttribute("aria-label", "Go to photo " + (i + 1));
        if (i === 0) dot.classList.add("active");
        dot.addEventListener("click", function () { scrollTo(i); });
        dotsWrap.appendChild(dot);
      });
    }

    function scrollTo(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      slides[i].scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }

    function currentIndex() {
      var center = track.scrollLeft + track.clientWidth / 2;
      var closest = 0;
      var closestDist = Infinity;
      slides.forEach(function (slide, i) {
        var dist = Math.abs(slide.offsetLeft + slide.offsetWidth / 2 - center);
        if (dist < closestDist) { closestDist = dist; closest = i; }
      });
      return closest;
    }

    if (prevBtn) prevBtn.addEventListener("click", function () { scrollTo(currentIndex() - 1); });
    if (nextBtn) nextBtn.addEventListener("click", function () { scrollTo(currentIndex() + 1); });

    if (dotsWrap) {
      var scrollTimer;
      track.addEventListener("scroll", function () {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function () {
          var i = currentIndex();
          Array.prototype.forEach.call(dotsWrap.children, function (dot, di) {
            dot.classList.toggle("active", di === i);
          });
        }, 100);
      });
    }

    if (opts.autoplayMs && slides.length > 1) {
      var autoplayTimer;
      var resumeTimer;

      function tick() {
        if (document.hidden) return;
        var next = currentIndex() + 1;
        scrollTo(next >= slides.length ? 0 : next);
      }
      function startAutoplay() {
        clearInterval(autoplayTimer);
        autoplayTimer = setInterval(tick, opts.autoplayMs);
      }
      function pauseThenResume() {
        clearInterval(autoplayTimer);
        clearTimeout(resumeTimer);
        resumeTimer = setTimeout(startAutoplay, opts.autoplayMs);
      }

      // Any sign of the user driving the carousel themselves pauses
      // autoplay for one interval, then it picks back up. Deliberately NOT
      // using mouseenter/mouseleave here: on touch devices a tap can fire a
      // synthetic mouseenter with no matching mouseleave, which would pause
      // autoplay forever with nothing left to resume it. pointerdown covers
      // touch and mouse alike without that trap.
      track.addEventListener("pointerdown", pauseThenResume);
      if (prevBtn) prevBtn.addEventListener("click", pauseThenResume);
      if (nextBtn) nextBtn.addEventListener("click", pauseThenResume);

      startAutoplay();
    }
  }

  initTrackCarousel({
    track: document.querySelector("[data-hero-track]"),
    dots: document.querySelector("[data-hero-dots]"),
    autoplayMs: 4000,
  });

  // ── Countdown ───────────────────────────────────────────
  var countdownEl = document.querySelector("[data-countdown]");
  if (countdownEl) {
    var targetISO = countdownEl.getAttribute("data-target");
    var target = new Date(targetISO).getTime();
    var daysEl = countdownEl.querySelector("[data-days]");
    var hoursEl = countdownEl.querySelector("[data-hours]");
    var minsEl = countdownEl.querySelector("[data-mins]");
    var secsEl = countdownEl.querySelector("[data-secs]");

    function pad(n) { return String(n).padStart(2, "0"); }

    function tick() {
      var diff = target - Date.now();
      if (diff <= 0) {
        countdownEl.style.display = "none";
        return;
      }
      daysEl.textContent = pad(Math.floor(diff / 86400000));
      hoursEl.textContent = pad(Math.floor((diff / 3600000) % 24));
      minsEl.textContent = pad(Math.floor((diff / 60000) % 60));
      secsEl.textContent = pad(Math.floor((diff / 1000) % 60));
    }

    tick();
    setInterval(tick, 1000);
  }

  // ── FAQ accordion ───────────────────────────────────────
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var question = item.querySelector(".faq-question");
    question.addEventListener("click", function () {
      var isOpen = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function (open) {
        if (open !== item) {
          open.classList.remove("open");
          open.querySelector(".faq-question").setAttribute("aria-expanded", "false");
        }
      });
      item.classList.toggle("open", !isOpen);
      question.setAttribute("aria-expanded", String(!isOpen));
    });
  });

  // ── Toggle chips (attending / welcome party / dietary) ──
  document.querySelectorAll("[data-chip-group]").forEach(function (group) {
    var mode = group.getAttribute("data-chip-group"); // "single" or "multi"
    group.querySelectorAll(".chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        if (mode === "single") {
          group.querySelectorAll(".chip").forEach(function (c) {
            c.setAttribute("aria-pressed", "false");
          });
          chip.setAttribute("aria-pressed", "true");
        } else {
          var pressed = chip.getAttribute("aria-pressed") === "true";
          chip.setAttribute("aria-pressed", String(!pressed));
        }
        group.dispatchEvent(new CustomEvent("chip-change"));
      });
    });
  });

  // ── Additional guests (named, only shown/relevant when attending) ──
  var attendingGroup = document.querySelector('[data-chip-group="attending"]');
  var guestCountWrap = document.querySelector("[data-guest-count-wrap]");
  if (attendingGroup && guestCountWrap) {
    var syncGuestCount = function () {
      var yes = attendingGroup.querySelector('[data-value="yes"]');
      guestCountWrap.hidden = !(yes && yes.getAttribute("aria-pressed") === "true");
    };
    attendingGroup.addEventListener("chip-change", syncGuestCount);
    syncGuestCount();
  }

  var MAX_ADDITIONAL_GUESTS = 9; // party of 10 total, including the RSVP'ing guest
  var guestList = document.querySelector("[data-guest-list]");
  var addGuestBtn = document.querySelector("[data-add-guest]");
  if (guestList && addGuestBtn) {
    var addGuestRow = function () {
      if (guestList.children.length >= MAX_ADDITIONAL_GUESTS) return;
      var row = document.createElement("div");
      row.className = "guest-row";

      var input = document.createElement("input");
      input.type = "text";
      input.className = "field";
      input.placeholder = "Guest name";
      input.setAttribute("data-guest-name", "");

      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "remove-guest-btn";
      removeBtn.setAttribute("aria-label", "Remove this guest");
      removeBtn.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      removeBtn.addEventListener("click", function () {
        row.remove();
        addGuestBtn.disabled = guestList.children.length >= MAX_ADDITIONAL_GUESTS;
      });

      row.appendChild(input);
      row.appendChild(removeBtn);
      guestList.appendChild(row);
      addGuestBtn.disabled = guestList.children.length >= MAX_ADDITIONAL_GUESTS;
      input.focus();
    };
    addGuestBtn.addEventListener("click", addGuestRow);
  }

  // ── RSVP form submission (Formspree, AJAX) ──────────────
  var form = document.getElementById("rsvp-form");
  if (form) {
    var errorEl = document.getElementById("rsvp-error");
    var successEl = document.getElementById("rsvp-success");
    var submitBtn = form.querySelector('button[type="submit"]');

    function chipValue(groupSelector) {
      var group = document.querySelector(groupSelector);
      if (!group) return null;
      var pressed = group.querySelector('.chip[aria-pressed="true"]');
      return pressed ? pressed.getAttribute("data-value") : null;
    }

    function multiChipValues(groupSelector) {
      var group = document.querySelector(groupSelector);
      if (!group) return [];
      return Array.prototype.map.call(
        group.querySelectorAll('.chip[aria-pressed="true"]'),
        function (c) { return c.getAttribute("data-value"); }
      );
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errorEl.textContent = "";

      var attending = chipValue('[data-chip-group="attending"]');
      if (!attending) {
        errorEl.textContent = "Please let us know if you'll be celebrating with us.";
        return;
      }

      var fullName = form.full_name.value.trim();
      var email = form.email.value.trim();
      if (!fullName || !email) {
        errorEl.textContent = "Name and email are required.";
        return;
      }

      var additionalGuests = [];
      if (attending === "yes" && guestList) {
        var guestInputs = guestList.querySelectorAll("[data-guest-name]");
        for (var gi = 0; gi < guestInputs.length; gi++) {
          var guestName = guestInputs[gi].value.trim();
          if (!guestName) {
            errorEl.textContent = "Please enter a name for each guest you've added, or remove that row.";
            guestInputs[gi].focus();
            return;
          }
          additionalGuests.push(guestName);
        }
      }

      var welcomeParty = chipValue('[data-chip-group="welcome_party"]');
      var dietaryTags = multiChipValues('[data-chip-group="dietary"]');
      var dietaryOther = form.dietary_other.value.trim();
      var dietary = dietaryTags.concat(dietaryOther ? [dietaryOther] : []).join(", ");

      var formData = new FormData();
      formData.append("full_name", fullName);
      formData.append("email", email);
      formData.append("phone", form.phone.value.trim());
      formData.append("attending", attending === "yes" ? "Joyfully accepts" : "Regretfully declines");
      formData.append("guest_count", attending === "yes" ? String(1 + additionalGuests.length) : "1");
      formData.append("additional_guests", additionalGuests.join(", ") || "None");
      formData.append(
        "welcome_party",
        welcomeParty === "yes" ? "Yes, count us in" : welcomeParty === "no" ? "Can't make it" : "Not specified"
      );
      formData.append("dietary_restrictions", dietary || "None specified");
      formData.append("address", [
        form.address_line1.value.trim(),
        form.address_line2.value.trim(),
        form.city.value.trim(),
        form.state.value.trim(),
        form.postal_code.value.trim(),
        form.country.value.trim(),
      ].filter(Boolean).join(", "));
      formData.append("song_request", form.song_request.value.trim());
      formData.append("message", form.message.value.trim());

      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";

      fetch(form.action, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      })
        .then(function (res) {
          if (res.ok) {
            form.hidden = true;
            successEl.hidden = false;
            successEl.scrollIntoView({ behavior: "smooth", block: "center" });
          } else {
            return res.json().then(function (data) {
              throw new Error(
                data && data.errors ? data.errors.map(function (e) { return e.message; }).join(", ") : "Something went wrong. Please try again."
              );
            });
          }
        })
        .catch(function (err) {
          errorEl.textContent = err.message || "Something went wrong. Please try again.";
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = "Send RSVP";
        });
    });
  }

  // ── WhatsApp share ──────────────────────────────────────
  var whatsappBtn = document.getElementById("whatsapp-share");
  if (whatsappBtn) {
    whatsappBtn.addEventListener("click", function () {
      var url = window.location.href;
      var text = "You're invited to Josh & Michal's wedding! RSVP here: " + url;
      if (navigator.share) {
        navigator.share({ title: "Our Wedding", text: text, url: url }).catch(function () {});
        return;
      }
      window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener,noreferrer");
    });
  }
})();
