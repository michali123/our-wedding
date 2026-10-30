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

  // ── Party panel: one row per person, each with their own attending
  //    answer and (if attending) their own dietary/entrée choice. Rows
  //    come from two sources: "household" rows, auto-populated from the
  //    guest list whenever the name fields match a recognized household
  //    (rebuilt wholesale on every match, since the household is derived
  //    fresh from whatever name is currently typed), and "manual" rows,
  //    added one at a time via "+ Add a guest" for anyone not on the
  //    list — these persist independently of the household rows. ──
  var attendingOnlyFields = document.querySelector("[data-attending-only-fields]");
  var householdRowsEl = document.querySelector("[data-household-rows]");
  var manualRowsEl = document.querySelector("[data-manual-rows]");
  var addGuestBtn = document.querySelector("[data-add-guest]");
  var MAX_ADDITIONAL_GUESTS = 9;

  var DIETARY_OPTIONS = ["Vegetarian", "Vegan", "Kosher"];

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
  var partyRowCounter = 0;

  function isRowAttendingYes(row) {
    var chips = row.querySelector('[data-role="attending-chips"]');
    var yes = chips ? chips.querySelector('[data-value="yes"]') : null;
    return !!(yes && yes.getAttribute("aria-pressed") === "true");
  }

  function anyRowAttendingYes() {
    var isYes = false;
    document.querySelectorAll(".party-member").forEach(function (row) {
      if (isRowAttendingYes(row)) isYes = true;
    });
    return isYes;
  }

  function syncAttendingOnlyFields() {
    if (attendingOnlyFields) attendingOnlyFields.hidden = !anyRowAttendingYes();
  }

  function syncAddGuestBtn() {
    if (!manualRowsEl || !addGuestBtn) return;
    addGuestBtn.disabled = manualRowsEl.children.length >= MAX_ADDITIONAL_GUESTS;
  }

  // Renders (or hides) the entrée picker for one party-member row, based
  // on that row's own attending answer and dietary chips.
  function renderEntreeOptions(row) {
    var dietaryWrap = row.querySelector("[data-dietary-wrap]");
    var dietaryChips = row.querySelector('[data-role="dietary-chips"]');
    var picker = row.querySelector("[data-entree-picker]");
    var optionsEl = row.querySelector("[data-entree-options]");
    if (!dietaryWrap || !dietaryChips || !picker || !optionsEl) return;

    if (!isRowAttendingYes(row)) {
      dietaryWrap.hidden = true;
      picker.hidden = true;
      optionsEl.innerHTML = "";
      return;
    }
    dietaryWrap.hidden = false;

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

    if (!row.getAttribute("data-entree-group-name")) {
      row.setAttribute("data-entree-group-name", "entree-" + entreeGroupCounter++);
    }
    var groupName = row.getAttribute("data-entree-group-name");

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

  // Builds one party-member row. `editable` gives it a free-text name
  // input (manually-added guests); otherwise the name is a fixed label
  // (auto-populated household members). `removable` adds a remove
  // button (manually-added guests only — household members can't be
  // removed, since they come straight from the guest list).
  function buildPartyRow(name, opts) {
    opts = opts || {};
    var rowId = "party-row-" + partyRowCounter++;

    var row = document.createElement("div");
    row.className = "party-member";

    var header = document.createElement("div");
    header.className = "party-member-header";

    if (opts.editable) {
      var nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.className = "field";
      nameInput.placeholder = "Guest name";
      nameInput.setAttribute("data-member-name", "");
      if (name) nameInput.value = name;
      header.appendChild(nameInput);
    } else {
      var nameLabel = document.createElement("p");
      nameLabel.className = "party-member-name";
      nameLabel.setAttribute("data-member-name-display", "");
      nameLabel.textContent = name;
      header.appendChild(nameLabel);
    }

    if (opts.removable) {
      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "remove-guest-btn";
      removeBtn.setAttribute("aria-label", "Remove this guest");
      removeBtn.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
      removeBtn.addEventListener("click", function () {
        row.remove();
        syncAddGuestBtn();
        syncAttendingOnlyFields();
      });
      header.appendChild(removeBtn);
    }

    row.appendChild(header);

    var attendingLabel = document.createElement("p");
    attendingLabel.className = "field-label party-member-attending-label";
    attendingLabel.textContent = "Will they be celebrating with us?";
    row.appendChild(attendingLabel);

    var attendingChips = document.createElement("div");
    attendingChips.className = "chip-group";
    attendingChips.setAttribute("data-chip-group", rowId + "-attending");
    attendingChips.setAttribute("data-chip-mode", "single");
    attendingChips.setAttribute("data-role", "attending-chips");
    [
      { value: "yes", label: "Yes, joyfully accepts" },
      { value: "no", label: "No, regretfully declines" },
    ].forEach(function (opt) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.setAttribute("data-value", opt.value);
      chip.setAttribute("aria-pressed", "false");
      chip.textContent = opt.label;
      attendingChips.appendChild(chip);
    });
    row.appendChild(attendingChips);
    wireChipGroup(attendingChips);
    attendingChips.addEventListener("chip-change", function () {
      renderEntreeOptions(row);
      syncAttendingOnlyFields();
    });

    var dietaryWrap = document.createElement("div");
    dietaryWrap.setAttribute("data-dietary-wrap", "");
    dietaryWrap.hidden = true;

    var dietaryLabel = document.createElement("p");
    dietaryLabel.className = "field-label";
    dietaryLabel.style.marginTop = "0.9rem";
    dietaryLabel.textContent = "Food restrictions";
    dietaryWrap.appendChild(dietaryLabel);

    var dietaryChips = document.createElement("div");
    dietaryChips.className = "chip-group";
    dietaryChips.setAttribute("data-chip-group", rowId + "-dietary");
    dietaryChips.setAttribute("data-role", "dietary-chips");
    DIETARY_OPTIONS.forEach(function (value) {
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "chip";
      chip.setAttribute("data-value", value);
      chip.setAttribute("aria-pressed", "false");
      chip.textContent = value;
      dietaryChips.appendChild(chip);
    });
    dietaryWrap.appendChild(dietaryChips);
    wireChipGroup(dietaryChips);
    dietaryChips.addEventListener("chip-change", function () {
      renderEntreeOptions(row);
    });

    var otherInput = document.createElement("input");
    otherInput.className = "field";
    otherInput.style.marginTop = "0.75rem";
    otherInput.type = "text";
    otherInput.setAttribute("data-dietary-other", "");
    otherInput.placeholder = "Anything else we should know?";
    dietaryWrap.appendChild(otherInput);

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
    dietaryWrap.appendChild(entreePicker);

    row.appendChild(dietaryWrap);

    return row;
  }

  function renderHouseholdRows(members) {
    if (!householdRowsEl) return;
    householdRowsEl.innerHTML = "";
    members.forEach(function (name) {
      householdRowsEl.appendChild(buildPartyRow(name, { editable: false, removable: false }));
    });
    syncAttendingOnlyFields();
  }

  if (manualRowsEl && addGuestBtn) {
    addGuestBtn.addEventListener("click", function () {
      if (manualRowsEl.children.length >= MAX_ADDITIONAL_GUESTS) return;
      var row = buildPartyRow("", { editable: true, removable: true });
      manualRowsEl.appendChild(row);
      syncAddGuestBtn();
      var nameInput = row.querySelector("[data-member-name]");
      if (nameInput) nameInput.focus();
    });
  }

  var firstNameInput = document.getElementById("first_name");
  var lastNameInput = document.getElementById("last_name");
  var getPrimaryName = function () {
    var first = firstNameInput ? firstNameInput.value.trim() : "";
    var last = lastNameInput ? lastNameInput.value.trim() : "";
    return (first + " " + last).trim();
  };

  // ── Live guest-list check: as soon as the guest finishes typing
  //    their name (on blur), confirm whether it's on the guest list —
  //    the submit handler below still re-checks and blocks either way,
  //    this is just earlier feedback so a mismatch doesn't surprise them
  //    at the very end of the form. A plus-one won't be individually
  //    named on the list, so on a mismatch we also offer a fallback
  //    field for the name the invitation was actually addressed to.
  //    A match reveals that person's whole household below, each with
  //    their own attending/food answer. ──
  var guestMatchHint = document.getElementById("guest-match-hint");
  var partyNameFallback = document.getElementById("party-name-fallback");
  var partyNameInput = document.getElementById("party_name");
  var partyMatchHint = document.getElementById("party-match-hint");

  var checkGuestMatch = function () {
    var name = getPrimaryName();
    if (!firstNameInput.value.trim() || !lastNameInput.value.trim()) {
      if (guestMatchHint) {
        guestMatchHint.textContent = "";
        guestMatchHint.classList.remove("is-error");
      }
      if (partyNameFallback) partyNameFallback.hidden = true;
      renderHouseholdRows([]);
      return;
    }
    if (!window.WeddingGuestList) {
      renderHouseholdRows([name]);
      return;
    }
    if (window.WeddingGuestList.isInvitedGuest(name)) {
      if (guestMatchHint) {
        guestMatchHint.textContent = "You're on the guest list — welcome!";
        guestMatchHint.classList.remove("is-error");
      }
      if (partyNameFallback) partyNameFallback.hidden = true;
      var household = window.WeddingGuestList.getHousehold(name) || [name];
      renderHouseholdRows(household);
    } else {
      if (guestMatchHint) {
        guestMatchHint.textContent = "We couldn't find that name on our guest list. If you're joining as someone's plus-one, enter their name below — otherwise, double-check the spelling or reach out to Josh & Michal directly.";
        guestMatchHint.classList.add("is-error");
      }
      if (partyNameFallback) partyNameFallback.hidden = false;
      renderHouseholdRows([name]);
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

    // Reads every party-member row (household + manually-added) in
    // document order, returning its name, its attending answer
    // ("yes"/"no"/null if unanswered), and the row element itself (so
    // dietary/entrée can be read from it for "yes" rows and the
    // submit handler can focus it on a validation error).
    function collectPartyRows() {
      var rows = [];
      document.querySelectorAll("[data-household-rows] .party-member, [data-manual-rows] .party-member").forEach(function (row) {
        var nameEl = row.querySelector("[data-member-name]") || row.querySelector("[data-member-name-display]");
        var name = nameEl ? (nameEl.value !== undefined ? nameEl.value.trim() : nameEl.textContent.trim()) : "";
        var attendingChips = row.querySelector('[data-role="attending-chips"]');
        var pressedChip = attendingChips ? attendingChips.querySelector('.chip[aria-pressed="true"]') : null;
        rows.push({
          name: name,
          attending: pressedChip ? pressedChip.getAttribute("data-value") : null,
          row: row,
        });
      });
      return rows;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errorEl.textContent = "";

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

      var partyRows = collectPartyRows();
      if (!partyRows.length) {
        errorEl.textContent = "Please let us know if you'll be celebrating with us.";
        return;
      }
      for (var pi = 0; pi < partyRows.length; pi++) {
        if (!partyRows[pi].name) {
          errorEl.textContent = "Please enter a name for each guest you've added, or remove that row.";
          var nameInput = partyRows[pi].row.querySelector("[data-member-name]");
          if (nameInput) nameInput.focus();
          return;
        }
        if (!partyRows[pi].attending) {
          errorEl.textContent = "Please let us know if " + partyRows[pi].name + " will be celebrating with us.";
          partyRows[pi].row.scrollIntoView({ behavior: "smooth", block: "center" });
          return;
        }
      }

      var additionalGuests = partyRows
        .filter(function (r) { return r.row.closest("[data-manual-rows]"); })
        .map(function (r) { return r.name; });

      var collectDietaryEntry = function (row, name) {
        var tags = Array.prototype.map.call(
          row.querySelectorAll('[data-role="dietary-chips"] .chip[aria-pressed="true"]'),
          function (c) { return c.getAttribute("data-value"); }
        );
        var otherField = row.querySelector("[data-dietary-other]");
        var other = otherField ? otherField.value.trim() : "";
        var parts = tags.concat(other ? [other] : []);
        return parts.length ? name + ": " + parts.join(", ") : "";
      };
      var collectEntreeEntry = function (row, name) {
        var checked = row.querySelector("[data-entree-radio]:checked");
        return checked ? name + ": " + checked.value : "";
      };

      var attendingYesRows = partyRows.filter(function (r) { return r.attending === "yes"; });
      var attendingSummary = partyRows
        .map(function (r) { return r.name + ": " + (r.attending === "yes" ? "Yes" : "No"); })
        .join("; ");
      var dietary = attendingYesRows
        .map(function (r) { return collectDietaryEntry(r.row, r.name); })
        .filter(Boolean)
        .join("; ");
      var entreeSelections = attendingYesRows
        .map(function (r) { return collectEntreeEntry(r.row, r.name); })
        .filter(Boolean)
        .join("; ");

      var formData = new FormData();
      formData.append("access_key", "42ac7e80-b40c-4245-a4e9-9adc3b9233c7");
      formData.append("subject", "New RSVP from " + fullName);
      formData.append("first_name", firstName);
      formData.append("last_name", lastName);
      formData.append("full_name", fullName);
      formData.append("joining_as_plus_one_of", partyName || "N/A");
      formData.append("email", email);
      formData.append("phone", form.phone.value.trim());
      formData.append("attending", attendingYesRows.length ? "Yes, joyfully accepts" : "No, regretfully declines");
      formData.append("guest_count", String(attendingYesRows.length));
      formData.append("attending_summary", attendingSummary || "None");
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
