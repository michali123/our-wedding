// Josh & Michal — wedding site interactivity. Plain vanilla JS, no build step.
(function () {
  "use strict";

  // ── Always land on the intro at the top of the page ──────
  // Overrides the browser's scroll-position memory and any URL hash
  // (e.g. a shared #rsvp link) so every load/refresh starts at #top,
  // underneath the opening reveal.
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  window.scrollTo(0, 0);
  window.addEventListener("pageshow", function () {
    window.scrollTo(0, 0);
  });

  // ── Opening reveal ───────────────────────────────────────
  // Plays on every page load/refresh — no "seen it already" skip.
  var intro = document.getElementById("intro");
  if (intro) {
    document.documentElement.style.overflow = "hidden";

    var introOpened = false;
    var openIntro = function () {
      if (introOpened) return;
      introOpened = true;
      window.scrollTo(0, 0);
      intro.classList.add("opening");
      document.documentElement.style.overflow = "";
      setTimeout(function () {
        intro.classList.add("closed");
      }, 1300);
    };

    intro.addEventListener("click", openIntro);
    setTimeout(openIntro, 8200);
  }

  // ── Mobile nav ──────────────────────────────────────────
  var navToggle = document.querySelector(".nav-toggle");
  var navMobile = document.querySelector(".nav-mobile");
  var navToggleLabel = document.querySelector("[data-nav-toggle-label]");
  if (navToggle && navMobile) {
    var setNavToggleState = function (isOpen) {
      navToggle.setAttribute("aria-expanded", String(isOpen));
      if (navToggleLabel) {
        navToggleLabel.textContent = isOpen ? "Close" : "Menu";
      }
    };
    navToggle.addEventListener("click", function () {
      var isOpen = navMobile.classList.toggle("open");
      setNavToggleState(isOpen);
    });
    navMobile.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        navMobile.classList.remove("open");
        setNavToggleState(false);
      });
    });
  }

  // ── Add to calendar dropdowns ───────────────────────────
  var closeAllCalMenus = function (except) {
    document.querySelectorAll(".add-cal-menu").forEach(function (menu) {
      if (menu === except) return;
      menu.hidden = true;
      var toggle = menu.previousElementSibling;
      if (toggle) toggle.setAttribute("aria-expanded", "false");
    });
  };
  document.querySelectorAll(".add-cal-toggle").forEach(function (toggle) {
    var menu = toggle.nextElementSibling;
    if (!menu) return;
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var willOpen = menu.hidden;
      closeAllCalMenus(willOpen ? menu : null);
      menu.hidden = !willOpen;
      toggle.setAttribute("aria-expanded", String(willOpen));
    });
  });
  document.addEventListener("click", function () {
    closeAllCalMenus(null);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeAllCalMenus(null);
  });

  // The hero photo strip scrolls itself via a pure CSS animation (see
  // #hero-photos-track / @keyframes hero-scroll in styles.css) — no JS
  // needed to drive it.

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

  // ── Travel & Stay: smooth peek/expand of the hotel list ──
  var travelToggle = document.querySelector("[data-travel-toggle]");
  var travelPanel = document.querySelector("[data-travel-panel]");
  if (travelToggle && travelPanel) {
    var travelCollapsedHeight = window.getComputedStyle(travelPanel).maxHeight;
    var travelExpanded = false;

    travelToggle.addEventListener("click", function () {
      travelExpanded = !travelExpanded;
      travelToggle.setAttribute("aria-expanded", String(travelExpanded));
      travelToggle.textContent = travelExpanded
        ? "Show Fewer Travel & Stay Options"
        : "Show More Travel & Stay Options";
      travelPanel.classList.toggle("expanded", travelExpanded);

      if (travelExpanded) {
        travelPanel.style.maxHeight = travelPanel.scrollHeight + "px";
      } else {
        travelPanel.style.maxHeight = travelPanel.scrollHeight + "px";
        requestAnimationFrame(function () {
          travelPanel.style.maxHeight = travelCollapsedHeight;
        });
        travelToggle.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  // ── Toggle chips (attending / dietary) ──
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
  var attendingWrap = document.querySelector("[data-attending-wrap]");
  if (attendingGroup && (guestCountWrap || attendingWrap)) {
    var syncGuestCount = function () {
      var yes = attendingGroup.querySelector('[data-value="yes"]');
      var isAttending = !!(yes && yes.getAttribute("aria-pressed") === "true");
      if (guestCountWrap) guestCountWrap.hidden = !isAttending;
      if (attendingWrap) attendingWrap.hidden = !isAttending;
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
      syncPartyGuestLists();
    };
    addGuestBtn.addEventListener("click", addGuestRow);
  }

  // ── After Party / Late Brunch: per-guest checklist, kept in sync
  //    with the named guest list above ──
  var fullNameInput = document.getElementById("full_name");
  var afterPartyList = document.querySelector("[data-after-party-list]");
  var lateBrunchList = document.querySelector("[data-late-brunch-list]");
  var syncPartyGuestLists = function () {
    if (!afterPartyList && !lateBrunchList) return;

    var names = [];
    var primaryName = fullNameInput ? fullNameInput.value.trim() : "";
    names.push(primaryName || "You");
    if (guestList) {
      guestList.querySelectorAll("[data-guest-name]").forEach(function (input) {
        var name = input.value.trim();
        if (name) names.push(name);
      });
    }

    [afterPartyList, lateBrunchList].forEach(function (container) {
      if (!container) return;
      var previouslyChecked = {};
      container.querySelectorAll("input[type=checkbox]").forEach(function (cb) {
        previouslyChecked[cb.getAttribute("data-guest-name")] = cb.checked;
      });
      container.innerHTML = "";
      names.forEach(function (name) {
        var label = document.createElement("label");
        label.className = "party-guest-row";
        var cb = document.createElement("input");
        cb.type = "checkbox";
        cb.setAttribute("data-guest-name", name);
        cb.checked = Object.prototype.hasOwnProperty.call(previouslyChecked, name)
          ? previouslyChecked[name]
          : false;
        var span = document.createElement("span");
        span.textContent = name;
        label.appendChild(cb);
        label.appendChild(span);
        container.appendChild(label);
      });
    });
  };
  if (fullNameInput) fullNameInput.addEventListener("input", syncPartyGuestLists);
  if (guestList) {
    guestList.addEventListener("input", function (e) {
      if (e.target && e.target.hasAttribute("data-guest-name")) syncPartyGuestLists();
    });
    var partyObserver = new MutationObserver(syncPartyGuestLists);
    partyObserver.observe(guestList, { childList: true });
  }
  syncPartyGuestLists();

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

      var dietaryTags = multiChipValues('[data-chip-group="dietary"]');
      var dietaryOther = form.dietary_other.value.trim();
      var dietary = dietaryTags.concat(dietaryOther ? [dietaryOther] : []).join(", ");

      var checkedNames = function (container) {
        if (!container) return [];
        return Array.prototype.map.call(
          container.querySelectorAll("input[type=checkbox]:checked"),
          function (cb) { return cb.getAttribute("data-guest-name"); }
        );
      };
      var afterPartyGuests = checkedNames(afterPartyList);
      var lateBrunchGuests = checkedNames(lateBrunchList);

      var formData = new FormData();
      formData.append("full_name", fullName);
      formData.append("email", email);
      formData.append("phone", form.phone.value.trim());
      formData.append("attending", attending === "yes" ? "Joyfully accepts" : "Regretfully declines");
      formData.append("guest_count", attending === "yes" ? String(1 + additionalGuests.length) : "1");
      formData.append("additional_guests", additionalGuests.join(", ") || "None");
      formData.append("dietary_restrictions", dietary || "None specified");
      formData.append("after_party_guests", attending === "yes" ? (afterPartyGuests.join(", ") || "None") : "N/A");
      formData.append("late_brunch_guests", attending === "yes" ? (lateBrunchGuests.join(", ") || "None") : "N/A");
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

  // Clean, hash-free URL — so a shared/copied link always opens at the
  // top of the page (the opening reveal), not scrolled to whatever
  // section was in the address bar when the button was clicked.
  var getShareUrl = function () {
    return window.location.origin + window.location.pathname;
  };

  // ── WhatsApp share ──────────────────────────────────────
  var whatsappBtn = document.getElementById("whatsapp-share");
  if (whatsappBtn) {
    whatsappBtn.addEventListener("click", function () {
      var url = getShareUrl();
      var text = "You're invited to Josh & Michal's wedding! RSVP here: " + url;
      if (navigator.share) {
        navigator.share({ title: "Our Wedding", text: text, url: url }).catch(function () {});
        return;
      }
      window.open("https://wa.me/?text=" + encodeURIComponent(text), "_blank", "noopener,noreferrer");
    });
  }

  // ── Copy website link ────────────────────────────────────
  var copyLinkBtn = document.getElementById("copy-link");
  if (copyLinkBtn) {
    var copyLinkLabel = copyLinkBtn.querySelector("[data-copy-label]");
    var copyResetTimer = null;
    copyLinkBtn.addEventListener("click", function () {
      var url = getShareUrl();
      var showCopied = function () {
        if (copyLinkLabel) copyLinkLabel.textContent = "Link Copied!";
        clearTimeout(copyResetTimer);
        copyResetTimer = setTimeout(function () {
          if (copyLinkLabel) copyLinkLabel.textContent = "Copy Website Link";
        }, 2000);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(showCopied).catch(function () {
          window.prompt("Copy this link:", url);
        });
      } else {
        window.prompt("Copy this link:", url);
      }
    });
  }

  // ── Back to top ───────────────────────────────────────────
  var backToTop = document.getElementById("back-to-top");
  if (backToTop) {
    var updateBackToTop = function () {
      backToTop.classList.toggle("visible", window.scrollY > window.innerHeight);
    };
    window.addEventListener("scroll", updateBackToTop, { passive: true });
    updateBackToTop();
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }
})();
