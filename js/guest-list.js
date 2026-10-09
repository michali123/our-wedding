// Wedding guest list — keeps the RSVP form restricted to invited guests.
// Generated from the family guest-list spreadsheet (names normalized to
// lowercase, letters/numbers/spaces only). Re-generate this list by hand
// whenever the spreadsheet changes — it's a static snapshot, not a live
// fetch, so there's nothing to keep in sync automatically.
(function () {
  var GUESTS = [
    "adela mamroud", "adi shitrit", "alexa edelman", "allee chiapetta", "alon dolev",
    "amit mamroud", "anita purcell", "anna kleinstchen", "avi mamroud", "barry edelman",
    "becky mamroud", "benjy winkler", "beth weissman", "boman turovac", "brandon purcell",
    "brett bacho", "brian murphy", "catherine schur", "charlotte gerhardt",
    "chaya mushka", "chen batach", "chen dolev", "chloe turovac", "cindy purcel",
    "colleen riccio", "cynthia fernandez", "dallia barness", "dan gerhardt",
    "daniela hamer", "david weissman", "debbie ziugzda", "donna", "dorin fatal",
    "eitan bohbot", "elazzar brandes", "eli malkin", "elior suissa", "eliran yihye",
    "elise buck", "eliz dolev", "ester moryosef", "eti moryosef", "evie weissman",
    "gabby ziugzda", "gal zmora", "ganit ohana", "george ziugzda", "hadar moryosef",
    "hannah bohbot", "harry", "ido ober", "imri shifman", "isabella vaittinen",
    "jb gerhardt", "jeffrey mamroud", "jessica gerhardt", "joe chiapetta",
    "jonah mamroud", "jordan mamroud", "josh edelman", "josh mamroud", "karlee owsiak",
    "kelly amits mom", "kelly greytsman", "kevin maczuga", "kristen hernandez",
    "laurianne teboul", "laury hamilton", "liron fatal", "lotte bacho", "luca vaittinen",
    "luke bacho", "madelana purcell", "madison buck", "mara mamroud", "matt bourn",
    "matthew sprung", "maureen kiley", "michal mamroud", "miguel pierra", "mike purcel",
    "mike riccio", "mohamad", "mor cohen", "moran moryosef", "nadav davidson",
    "nathan weissman", "nick ziugzda", "niklas vaittinen", "noah luvyud",
    "nofar moryosef", "olivia bacho", "ori gottesmann", "ortal", "osher ohana",
    "oshrit moryosef", "polanco", "rachel bohbot", "rachel turovac", "rena mamroud",
    "renate sprung", "reut", "richie hernandez", "robert schur", "robin bohbot",
    "robin schneck", "ron gur", "ron sapir", "rotem ashury", "roy azulay",
    "ruthie edelman", "ruty fatal", "ryan turovac", "sam bohbot", "samantha maczuga",
    "sapir", "sharon byfield", "sherri martin", "shifra schwartz", "shimon moryosef",
    "shiran moryosef", "shoshi moryosef", "sima mamroud", "sophie mamroud", "tal dadon",
    "teddy schur", "tristan buck", "tzvika zisk", "vald gratsman", "yael shemesh",
    "yehoshua moryosef", "yossi dolev", "yrin yardeni", "zack greytsman", "zoe maczuga"
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
