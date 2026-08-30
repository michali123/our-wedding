// Josh & Michal — wedding site interactivity. Plain vanilla JS, no build step.
(function () {
  "use strict";

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

  // ── Guest count field only matters when attending ───────
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

      var welcomeParty = chipValue('[data-chip-group="welcome_party"]');
      var dietaryTags = multiChipValues('[data-chip-group="dietary"]');
      var dietaryOther = form.dietary_other.value.trim();
      var dietary = dietaryTags.concat(dietaryOther ? [dietaryOther] : []).join(", ");

      var formData = new FormData();
      formData.append("full_name", fullName);
      formData.append("email", email);
      formData.append("phone", form.phone.value.trim());
      formData.append("attending", attending === "yes" ? "Joyfully accepts" : "Regretfully declines");
      formData.append("guest_count", attending === "yes" ? form.guest_count.value : "1");
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
