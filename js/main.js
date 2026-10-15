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
  // Plays on every page load/refresh — no "seen it already" skip. The
  // photo card is visible immediately; it holds for a few seconds, then
  // lifts away as a single piece to reveal the site — unless a tap (or
  // the Enter button) skips the hold early via liftAway() below.
  var intro = document.getElementById("intro");
  if (intro) {
    document.documentElement.style.overflow = "hidden";

    var introLifted = false;
    var liftTimer = null;

    var liftAway = function () {
      if (introLifted) return;
      introLifted = true;
      clearTimeout(liftTimer);
      intro.classList.add("lifting");
      document.documentElement.style.overflow = "";
      setTimeout(function () {
        intro.classList.add("closed");
      }, 1100);
    };

    intro.addEventListener("click", liftAway);
    liftTimer = setTimeout(liftAway, 4000);
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

  // ── Travel & Stay: expand to see all hotel options ──────
  var travelToggle = document.querySelector("[data-travel-toggle]");
  var travelPanel = document.querySelector("[data-travel-panel]");
  if (travelToggle && travelPanel) {
    travelToggle.addEventListener("click", function () {
      var willOpen = travelPanel.hidden;
      travelPanel.hidden = !willOpen;
      travelToggle.setAttribute("aria-expanded", String(willOpen));
      travelToggle.textContent = willOpen
        ? "Click Here to Show Fewer Travel & Stay Options"
        : "Click Here to Expand All Travel & Stay Options";
      if (!willOpen) {
        travelToggle.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  }

  // ── Toggle chips (attending / dietary) ──
  // data-chip-mode="single" makes the group radio-like (one pressed at a
  // time); groups without it (e.g. dietary) toggle independently.
  function wireChipGroup(group) {
    var single = group.getAttribute("data-chip-mode") === "single";
    group.querySelectorAll(".chip").forEach(function (chip) {
      chip.addEventListener("click", function () {
        if (single) {
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
  }
  document.querySelectorAll("[data-chip-group]").forEach(wireChipGroup);

  // ── Additional guests (named, only shown/relevant when attending) ──
  var attendingGroup = document.querySelector('[data-chip-group="attending"]');
  var guestCountWrap = document.querySelector("[data-guest-count-wrap]");
  if (attendingGroup && guestCountWrap) {
    var syncGuestCount = function () {
      var yes = attendingGroup.querySelector('[data-value="yes"]');
      var isAttending = !!(yes && yes.getAttribute("aria-pressed") === "true");
      guestCountWrap.hidden = !isAttending;
    };
    attendingGroup.addEventListener("chip-change", syncGuestCount);
    syncGuestCount();
  }

  // ── Entrée selection (per person, based on their dietary choice) ──
  // Vegetarian/Vegan guests don't pick from this list — the caterer
  // handles those automatically from the dietary chip alone. Everyone
  // else chooses between the two options for their track, or Kids Menu.
  var ENTREE_REGULAR = [
    { value: "Chicken Francese", desc: "Chicken Breasts sautéed in Butter, White Wine, Lemons and Capers" },
    { value: "Grilled Salmon", desc: "Brushed with a Citrus Glaze" },
    { value: "Kids Menu", desc: "" },
  ];
  var ENTREE_KOSHER = [
    { value: "Grilled Teriyaki Salmon", desc: "With Rice Medley, Stir Fried Vegetables" },
    { value: "Chicken Francaise", desc: "Baby Red Potatoes & Julienne Vegetables" },
    { value: "Kids Menu", desc: "" },
  ];
  var entreeGroupCounter = 0;

  function isAttendingYes() {
    if (!attendingGroup) return false;
    var yes = attendingGroup.querySelector('[data-value="yes"]');
    return !!(yes && yes.getAttribute("aria-pressed") === "true");
  }

  function renderEntreeOptions(block) {
    var dietaryChips = block.querySelector(".chip-group");
    var picker = block.querySelector("[data-entree-picker]");
    var optionsEl = block.querySelector("[data-entree-options]");
    if (!dietaryChips || !picker || !optionsEl) return;

    if (!isAttendingYes()) {
      picker.hidden = true;
      optionsEl.innerHTML = "";
      return;
    }

    var isVeg = !!dietaryChips.querySelector(
      '[data-value="Vegetarian"][aria-pressed="true"], [data-value="Vegan"][aria-pressed="true"]'
    );
    if (isVeg) {
      picker.hidden = true;
      optionsEl.innerHTML = "";
      return;
    }

    var isKosher = !!dietaryChips.querySelector('[data-value="Kosher"][aria-pressed="true"]');
    var options = isKosher ? ENTREE_KOSHER : ENTREE_REGULAR;

    if (!block.getAttribute("data-entree-group-name")) {
      block.setAttribute("data-entree-group-name", "entree-" + entreeGroupCounter++);
    }
    var groupName = block.getAttribute("data-entree-group-name");

    var previousChecked = optionsEl.querySelector("input:checked");
    var previousValue = previousChecked ? previousChecked.value : null;

    optionsEl.innerHTML = "";
    options.forEach(function (opt) {
      var label = document.createElement("label");
      label.className = "entree-option";

      var input = document.createElement("input");
      input.type = "radio";
      input.name = groupName;
      input.value = opt.value;
      input.setAttribute("data-entree-radio", "");
      if (opt.value === previousValue) input.checked = true;

      var text = document.createElement("span");
      text.className = "entree-option-text";
      var title = document.createElement("strong");
      title.textContent = opt.value;
      text.appendChild(title);
      if (opt.desc) {
        var descEl = document.createElement("span");
        descEl.className = "entree-option-desc";
        descEl.textContent = opt.desc;
        text.appendChild(descEl);
      }

      label.appendChild(input);
      label.appendChild(text);
      optionsEl.appendChild(label);
    });

    picker.hidden = false;
  }

  var primaryDietaryBlock = document.querySelector("[data-dietary-primary]");
  if (primaryDietaryBlock) {
    var primaryDietaryChips = primaryDietaryBlock.querySelector(".chip-group");
    if (primaryDietaryChips) {
      primaryDietaryChips.addEventListener("chip-change", function () {
        renderEntreeOptions(primaryDietaryBlock);
      });
    }
    renderEntreeOptions(primaryDietaryBlock);
  }

  // ── Per-guest dietary blocks (paired 1:1, in order, with guest rows) ──
  var DIETARY_OPTIONS = ["Vegetarian", "Vegan", "Kosher"];
  var dietaryGuestList = document.querySelector("[data-dietary-guest-list]");
  var dietaryGuestCounter = 0;

  function buildDietaryBlock() {
    var block = document.createElement("div");
    block.className = "dietary-block";

    var nameLabel = document.createElement("p");
    nameLabel.className = "dietary-guest-name";
    nameLabel.textContent = "Guest";
    block.appendChild(nameLabel);

    var chipGroup = document.createElement("div");
    chipGroup.className = "chip-group";
    chipGroup.setAttribute("data-chip-group", "dietary-guest-" + (dietaryGuestCounter++));
    DIETARY_OPTIONS.forEach(function (value) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.setAttribute("data-value", value);
      chip.setAttribute("aria-pressed", "false");
      chip.textContent = value;
      chipGroup.appendChild(chip);
    });
    block.appendChild(chipGroup);
    wireChipGroup(chipGroup);

    var otherInput = document.createElement("input");
    otherInput.className = "field";
    otherInput.style.marginTop = "0.75rem";
    otherInput.type = "text";
    otherInput.setAttribute("data-dietary-other", "");
    otherInput.placeholder = "Anything else we should know?";
    block.appendChild(otherInput);

    var entreePicker = document.createElement("div");
    entreePicker.className = "entree-picker";
    entreePicker.setAttribute("data-entree-picker", "");
    entreePicker.hidden = true;
    var entreeLabel = document.createElement("p");
    entreeLabel.className = "field-label";
    entreeLabel.style.marginTop = "0.9rem";
    entreeLabel.textContent = "Entrée selection";
    entreePicker.appendChild(entreeLabel);
    var entreeOptions = document.createElement("div");
    entreeOptions.className = "entree-options";
    entreeOptions.setAttribute("data-entree-options", "");
    entreePicker.appendChild(entreeOptions);
    block.appendChild(entreePicker);

    chipGroup.addEventListener("chip-change", function () {
      renderEntreeOptions(block);
    });
    renderEntreeOptions(block);

    return { block: block, nameLabel: nameLabel };
  }

  function syncDietaryGuestNames() {
    if (!guestList || !dietaryGuestList) return;
    var names = guestList.querySelectorAll("[data-guest-name]");
    var labels = dietaryGuestList.querySelectorAll(".dietary-guest-name");
    for (var i = 0; i < labels.length; i++) {
      var name = names[i] ? names[i].value.trim() : "";
      labels[i].textContent = name || "Guest " + (i + 1);
    }
  }

  // Entrée pickers only make sense once someone has said they're coming —
  // re-check all of them (primary + every guest) whenever that answer
  // changes, so flipping from "no" back to "yes" brings them back too.
  if (attendingGroup) {
    attendingGroup.addEventListener("chip-change", function () {
      if (primaryDietaryBlock) renderEntreeOptions(primaryDietaryBlock);
      if (dietaryGuestList) {
        dietaryGuestList.querySelectorAll(".dietary-block").forEach(renderEntreeOptions);
      }
    });
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

      var dietary = buildDietaryBlock();

      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "remove-guest-btn";
      removeBtn.setAttribute("aria-label", "Remove this guest");
      removeBtn.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      removeBtn.addEventListener("click", function () {
        row.remove();
        dietary.block.remove();
        addGuestBtn.disabled = guestList.children.length >= MAX_ADDITIONAL_GUESTS;
        syncDietaryGuestNames();
      });

      row.appendChild(input);
      row.appendChild(removeBtn);
      guestList.appendChild(row);
      if (dietaryGuestList) dietaryGuestList.appendChild(dietary.block);
      addGuestBtn.disabled = guestList.children.length >= MAX_ADDITIONAL_GUESTS;
      input.focus();
      syncDietaryGuestNames();
    };
    addGuestBtn.addEventListener("click", addGuestRow);
  }

  var firstNameInput = document.getElementById("first_name");
  var lastNameInput = document.getElementById("last_name");
  var getPrimaryName = function () {
    var first = firstNameInput ? firstNameInput.value.trim() : "";
    var last = lastNameInput ? lastNameInput.value.trim() : "";
    return (first + " " + last).trim();
  };
  if (guestList) {
    guestList.addEventListener("input", function (e) {
      if (e.target && e.target.hasAttribute("data-guest-name")) {
        syncDietaryGuestNames();
      }
    });
  }

  // ── Live guest-list check: as soon as the guest finishes typing
  //    their name (on blur), confirm whether it's on the guest list —
  //    the submit handler below still re-checks and blocks either way,
  //    this is just earlier feedback so a mismatch doesn't surprise them
  //    at the very end of the form. A plus-one won't be individually
  //    named on the list, so on a mismatch we also offer a fallback
  //    field for the name the invitation was actually addressed to. ──
  var guestMatchHint = document.getElementById("guest-match-hint");
  var partyNameFallback = document.getElementById("party-name-fallback");
  var partyNameInput = document.getElementById("party_name");
  var partyMatchHint = document.getElementById("party-match-hint");

  var checkGuestMatch = function () {
    if (!guestMatchHint || !window.WeddingGuestList) return;
    var name = getPrimaryName();
    if (!firstNameInput.value.trim() || !lastNameInput.value.trim()) {
      guestMatchHint.textContent = "";
      guestMatchHint.classList.remove("is-error");
      if (partyNameFallback) partyNameFallback.hidden = true;
      return;
    }
    if (window.WeddingGuestList.isInvitedGuest(name)) {
      guestMatchHint.textContent = "You're on the guest list — welcome!";
      guestMatchHint.classList.remove("is-error");
      if (partyNameFallback) partyNameFallback.hidden = true;
    } else {
      guestMatchHint.textContent = "We couldn't find that name on our guest list. If you're joining as someone's plus-one, enter their name below — otherwise, double-check the spelling or reach out to Josh & Michal directly.";
      guestMatchHint.classList.add("is-error");
      if (partyNameFallback) partyNameFallback.hidden = false;
    }
  };
  if (firstNameInput) firstNameInput.addEventListener("blur", checkGuestMatch);
  if (lastNameInput) lastNameInput.addEventListener("blur", checkGuestMatch);

  var checkPartyMatch = function () {
    if (!partyMatchHint || !window.WeddingGuestList) return;
    var partyName = partyNameInput.value.trim();
    if (!partyName) {
      partyMatchHint.textContent = "";
      partyMatchHint.classList.remove("is-error");
      return;
    }
    if (window.WeddingGuestList.isInvitedGuest(partyName)) {
      partyMatchHint.textContent = "Found it — you're all set to RSVP as their guest.";
      partyMatchHint.classList.remove("is-error");
    } else {
      partyMatchHint.textContent = "We couldn't find that name either. Please double-check the spelling, or reach out to Josh & Michal directly.";
      partyMatchHint.classList.add("is-error");
    }
  };
  if (partyNameInput) partyNameInput.addEventListener("blur", checkPartyMatch);

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

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errorEl.textContent = "";

      var attending = chipValue('[data-chip-group="attending"]');
      if (!attending) {
        errorEl.textContent = "Please let us know if you'll be celebrating with us.";
        return;
      }

      var firstName = form.first_name.value.trim();
      var lastName = form.last_name.value.trim();
      var fullName = (firstName + " " + lastName).trim();
      var email = form.email.value.trim();
      if (!firstName || !lastName || !email) {
        errorEl.textContent = "First name, last name, and email are required.";
        return;
      }

      var partyName = partyNameInput ? partyNameInput.value.trim() : "";
      if (window.WeddingGuestList && !window.WeddingGuestList.isInvitedGuest(fullName)) {
        if (!partyName || !window.WeddingGuestList.isInvitedGuest(partyName)) {
          errorEl.textContent = partyName
            ? "We couldn't find either name on our guest list. Please double-check the spelling, or reach out to Josh & Michal directly if you think this is a mistake."
            : "We couldn't find that name on our guest list. If you're joining as someone's plus-one, enter their name in the field above, or reach out to Josh & Michal directly if you think this is a mistake.";
          form.first_name.focus();
          return;
        }
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

      var collectDietaryEntry = function (name, container) {
        if (!container) return "";
        var tags = Array.prototype.map.call(
          container.querySelectorAll('.chip[aria-pressed="true"]'),
          function (c) { return c.getAttribute("data-value"); }
        );
        var otherField = container.querySelector("[data-dietary-other]");
        var other = otherField ? otherField.value.trim() : "";
        var parts = tags.concat(other ? [other] : []);
        return parts.length ? name + ": " + parts.join(", ") : "";
      };
      var dietaryEntries = [
        collectDietaryEntry(fullName || "You", document.querySelector("[data-dietary-primary]")),
      ];
      if (dietaryGuestList) {
        var dietaryBlocks = dietaryGuestList.querySelectorAll(".dietary-block");
        for (var di = 0; di < dietaryBlocks.length; di++) {
          var guestName = dietaryBlocks[di].querySelector(".dietary-guest-name").textContent;
          dietaryEntries.push(collectDietaryEntry(guestName, dietaryBlocks[di]));
        }
      }
      var dietary = dietaryEntries.filter(Boolean).join("; ");

      var collectEntreeEntry = function (name, container) {
        if (!container) return "";
        var checked = container.querySelector("[data-entree-radio]:checked");
        return checked ? name + ": " + checked.value : "";
      };
      var entreeEntries = [
        collectEntreeEntry(fullName || "You", document.querySelector("[data-dietary-primary]")),
      ];
      if (dietaryGuestList) {
        var entreeBlocks = dietaryGuestList.querySelectorAll(".dietary-block");
        for (var ei = 0; ei < entreeBlocks.length; ei++) {
          var entreeGuestName = entreeBlocks[ei].querySelector(".dietary-guest-name").textContent;
          entreeEntries.push(collectEntreeEntry(entreeGuestName, entreeBlocks[ei]));
        }
      }
      var entreeSelections = entreeEntries.filter(Boolean).join("; ");

      var formData = new FormData();
      formData.append("access_key", "42ac7e80-b40c-4245-a4e9-9adc3b9233c7");
      formData.append("subject", "New RSVP from " + fullName);
      formData.append("first_name", firstName);
      formData.append("last_name", lastName);
      formData.append("full_name", fullName);
      formData.append("joining_as_plus_one_of", partyName || "N/A");
      formData.append("email", email);
      formData.append("phone", form.phone.value.trim());
      formData.append("attending", attending === "yes" ? "Joyfully accepts" : "Regretfully declines");
      formData.append("guest_count", attending === "yes" ? String(1 + additionalGuests.length) : "1");
      formData.append("additional_guests", additionalGuests.join(", ") || "None");
      formData.append("dietary_restrictions", dietary || "None specified");
      formData.append("entree_selections", entreeSelections || "Not selected");
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
              throw new Error((data && data.message) || "Something went wrong. Please try again.");
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
