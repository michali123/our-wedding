// Wedding guest list — keeps the RSVP form restricted to invited guests,
// and groups them into households/parties so that recognizing one person
// reveals their whole party. Generated from the family guest-list
// spreadsheet. Re-generate this list by hand whenever the spreadsheet
// changes — it's a static snapshot, not a live fetch.
(function () {
  // Each entry is one household/party as it appears on the spreadsheet —
  // the group of names that should all show up together once any one of
  // them is recognized.
  var HOUSEHOLDS = [
    ["Adi Shitrit"],
    ["Alexa Edelman"],
    ["Alon Dolev"],
    ["Amit Mamroud", "Mara Mamroud", "Jonah Mamroud", "Sophie Mamroud"],
    ["Anita Pursell", "Brandon Pursell", "Madelaina Pursell"],
    ["Anna Kleinstchen"],
    ["Avi Mamroud", "Becky Mamroud"],
    ["Barry Edelman", "Ruthie Edelman"],
    ["Benjy Winkler"],
    ["Brett Bacho", "Lotte Bacho"],
    ["Brian Murphy"],
    ["Chaya Mushka"],
    ["Chen Batach"],
    ["Chen Dolev"],
    ["Dalia Barness"],
    ["Dan Gerhardt", "Jessica Gerhardt", "JB Gerhardt", "Charlotte Gerhardt"],
    ["Daniela Hamer"],
    ["David Weissman", "Beth Weissman", "Nathan Weissman", "Evie Weissman"],
    ["Donna Fleischer"],
    ["Dorin Fatal"],
    ["Eitan Bohbot"],
    ["Elazzar Brandes"],
    ["Eli Malkin", "Cynthia Fernandez"],
    ["Elior Suissa"],
    ["Eliran Yihye"],
    ["Elise Buck"],
    ["Eliz Dolev"],
    ["Ester Moryosef"],
    ["Gal Zmora"],
    ["Ganit Ohana"],
    ["George Ziugzda", "Debbie Ziugzda"],
    ["Hadar Moryosef"],
    ["Haim Solomon"],
    ["Hannah Bohbot"],
    ["Harry"],
    ["Ido Ober"],
    ["Imri Shifman"],
    ["Jeffrey Mamroud"],
    ["Joe Chiapetta", "Allee Chiapetta"],
    ["Jordan Mamroud"],
    ["Josh Edelman"],
    ["Josh Mamroud", "Michal Mamroud"],
    ["Karlee Owsiak", "Miguel Pierra"],
    ["Kelly Escuine-Mamroud"],
    ["Kevin Maczuga", "Zoe Maczuga"],
    ["Laurianne Teboul"],
    ["Laury Hamilton"],
    ["Liron Fatal"],
    ["Luke Bacho"],
    ["Margaliet Themans-loss"],
    ["Matt Bourn"],
    ["Maureen Kiley"],
    ["Mike Purcel", "Cindy Purcel"],
    ["Mike Riccio", "Colleen Riccio"],
    ["Mohamad"],
    ["Mor Cohen"],
    ["Moran Moryosef"],
    ["Nadav Davidson"],
    ["Nick Ziugzda", "Gabby Ziugzda"],
    ["Niklas Vaittinen", "Isabella Vaittinen", "Luca Vaittinen"],
    ["Noah Luvyud"],
    ["Nofar Moryosef"],
    ["Olivia Bacho"],
    ["Ori Gottesmann"],
    ["Ortal"],
    ["Oshrit Moryosef"],
    ["Polanco"],
    ["Rachel Bohbot"],
    ["Rena Mamroud", "Adela Mamroud"],
    ["Renate Sprung", "Matthew Sprung"],
    ["Reut"],
    ["Richie Hernandez", "Kristen Hernandez"],
    ["Robert Schur", "Catherine Schur"],
    ["Robin Bohbot"],
    ["Robin Schneck"],
    ["Ron Gur"],
    ["Ron Sapir"],
    ["Rotem Ashury"],
    ["Roy Azulay"],
    ["Ruty Fatal"],
    ["Ryan Turovac", "Rachel Turovac", "Boman Turovac", "Chloe Turovac"],
    ["Sam Bohbot"],
    ["Samantha Maczuga"],
    ["Sapir"],
    ["Sharon Byfield"],
    ["Sherri Martin"],
    ["Shifra Schwartz"],
    ["Shimon Moryosef"],
    ["Shiran Moryosef"],
    ["Shoshi Moryosef"],
    ["Sima Mamroud"],
    ["Tal Dadon"],
    ["Teddy Schur"],
    ["Tristan Buck", "Madison Buck"],
    ["Tzvika Zisk"],
    ["Vald Gratsman"],
    ["Yael Shemesh", "Nir Shemesh"],
    ["Yehoshua Moryosef", "Eti Moryosef"],
    ["Yossi Dolev"],
    ["Yrin Yardeni"],
    ["Zack Greytsman", "Kelly Greytsman"],
  ];

  // First names that match regardless of whatever last name is typed —
  // either because no last name is on file for them, or (margaliet) the
  // last name on file is unusual/hard to spell and shouldn't block her.
  var FIRST_NAME_ONLY = ["harry", "margaliet", "mohamad", "ortal", "polanco", "reut", "sapir"];

  function normalize(s) {
    return (s || "")
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  var memberToHousehold = {};
  var tokenSetToHousehold = {};
  var firstNameToHousehold = {};
  var guestSet = {};

  HOUSEHOLDS.forEach(function (household) {
    household.forEach(function (fullName) {
      var norm = normalize(fullName);
      guestSet[norm] = true;
      memberToHousehold[norm] = household;
      var tokenSet = norm.split(" ").sort().join(" ");
      tokenSetToHousehold[tokenSet] = household;
    });
  });
  FIRST_NAME_ONLY.forEach(function (firstName) {
    // Find the household this first name actually belongs to (its own
    // solo entry, if any) so lookups return real party data instead of
    // a placeholder.
    var household = null;
    HOUSEHOLDS.forEach(function (h) {
      h.forEach(function (fullName) {
        if (normalize(fullName).split(" ")[0] === firstName) household = h;
      });
    });
    firstNameToHousehold[firstName] = household || [firstName];
  });

  // Returns true if the given full name matches an invited guest — exact
  // normalized match first, then a same-words-any-order fallback (so
  // "Mamroud Josh" still matches "Josh Mamroud"), then a first-name-only
  // fallback for guests whose last name isn't on file (so "Harry Cohen"
  // still matches the bare "Harry" entry).
  function isInvitedGuest(rawName) {
    var normalized = normalize(rawName);
    if (!normalized) return false;
    if (guestSet[normalized]) return true;
    var tokenSet = normalized.split(" ").sort().join(" ");
    if (tokenSetToHousehold[tokenSet]) return true;
    var firstName = normalized.split(" ")[0];
    return !!firstNameToHousehold[firstName];
  }

  // Returns the full household/party (array of display names) that the
  // given name belongs to, or null if the name isn't recognized. Same
  // matching order as isInvitedGuest.
  function getHousehold(rawName) {
    var normalized = normalize(rawName);
    if (!normalized) return null;
    if (memberToHousehold[normalized]) return memberToHousehold[normalized];
    var tokenSet = normalized.split(" ").sort().join(" ");
    if (tokenSetToHousehold[tokenSet]) return tokenSetToHousehold[tokenSet];
    var firstName = normalized.split(" ")[0];
    if (firstNameToHousehold[firstName]) return firstNameToHousehold[firstName];
    return null;
  }

  window.WeddingGuestList = {
    normalize: normalize,
    isInvitedGuest: isInvitedGuest,
    getHousehold: getHousehold,
  };
})();
