// Wedding guest list — keeps the RSVP form restricted to invited guests.
// Generated from the family guest-list spreadsheet (names normalized to
// lowercase, letters/numbers/spaces only). Re-generate this list by hand
// whenever the spreadsheet changes — it's a static snapshot, not a live
// fetch, so there's nothing to keep in sync automatically.
(function () {
  var GUESTS = [
    "adela mamroud", "alexa edelman", "allee chiapetta", "alon dolev", "amit mamroud",
    "anita purcell", "anna kleinstchen", "avi mamroud", "barry edelman", "becky mamroud",
    "beth weissman", "boman turovac", "brandon purcell", "brett bacho", "brian murphy",
    "catherine schur", "charlotte gerhardt", "chen batach", "chen dolev", "chloe turovac",
    "cindy purcel", "colleen riccio", "cynthia fernandez", "dallia barness", "dan gerhardt",
    "david weissman", "debbie ziugzda", "dorin fatal", "eitan", "eitan bohbot", "elazzar",
    "eli malkin", "elise buck", "eliz dolev", "ester moryosef", "eti moryosef", "evie weissman",
    "gabby ziugzda", "ganit ohana", "george ziugzda", "hadar moryosef", "hannah bohbot", "harry",
    "isabella vaittinen", "jb gerhardt", "jeffrey mamroud", "jessica gerhardt", "joe chiapetta",
    "jonah mamroud", "jordan mamroud", "josh edelman", "josh mamroud", "karlee owsiak",
    "kelly amits mom", "kelly greytsman", "kevin maczuga", "kristen hernandez", "laurianne teboul",
    "laury hamilton", "liron fatal", "lotte bacho", "luca vaittinen", "luke bacho",
    "madelana purcell", "madison buck", "mara mamroud", "matt bourn", "matthew sprung",
    "maureen kiley", "michal mamroud", "miguel pierra", "mike purcel", "mike riccio",
    "moran moryosef", "nathan weissman", "nick ziugzda", "nico", "niklas vaittinen", "noah luvyud",
    "nofar moryosef", "olivia bacho", "ortal", "osher ohana", "oshrit moryosef", "polanco",
    "rachel bohbot", "rachel turovac", "rena mamroud", "renate sprung", "richie hernandez",
    "robert schur", "robin bohbot", "robin schneck", "ron", "rotem", "roy", "ruthie edelman",
    "ruty fatal", "ryan turovac", "sam bohbot", "samantha maczuga", "sapir", "sasha", "sasha gur",
    "sharon byfield", "sherri martin", "shifra schwartz", "shimon moryosef", "shiran moryosef",
    "shoshi moryosef", "sima mamroud", "sophie mamroud", "teddy schur", "tristan buck",
    "tzvika zisk", "vald gratsman", "yael shemesh", "yehoshua moryosef", "yossi dolev",
    "zack greytsman", "zoe maczuga"
  ];

  function normalize(s) {
    return (s || "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  var guestSet = {};
  var tokenSetByName = {};
  GUESTS.forEach(function (name) {
    guestSet[name] = true;
    tokenSetByName[name] = name.split(" ").sort().join(" ");
  });
  var tokenSets = {};
  Object.keys(tokenSetByName).forEach(function (name) {
    tokenSets[tokenSetByName[name]] = true;
  });

  // Returns true if the given full name matches an invited guest — exact
  // normalized match first, then a same-words-any-order fallback (so
  // "Mamroud Josh" still matches "Josh Mamroud").
  function isInvitedGuest(rawName) {
    var normalized = normalize(rawName);
    if (!normalized) return false;
    if (guestSet[normalized]) return true;
    var tokenSet = normalized.split(" ").sort().join(" ");
    return !!tokenSets[tokenSet];
  }

  window.WeddingGuestList = {
    normalize: normalize,
    isInvitedGuest: isInvitedGuest,
  };
})();
