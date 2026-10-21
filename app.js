(function () {
  "use strict";
  var S = window.GG_STRINGS;
  var places = Array.isArray(window.restaurants) ? window.restaurants : [];
  var root = document.getElementById("screen-content");
  var title = document.getElementById("screenTitle");
  var headerBack = document.getElementById("headerBack");
  var headerAction = document.getElementById("headerAction");
  var bottomNav = document.getElementById("bottomNav");
  var railNav = document.getElementById("railNav");
  var toast = document.getElementById("toast");
  var state = { query: "", filter: "all", selectedPlace: null, map: null, markers: new Map(), session: null, preferences: [], saved: [], notes: [], onboarding: 0, mapSheetOpen: true, mapFailed: false };
  var storageAvailable = true;
  var storageKey = "gg-demo-session-v1";
  var navItems = [
    { id: "home", label: "Explore", icon: "⌕" },
    { id: "map", label: "Map", icon: "⌖" },
    { id: "saved", label: "Saved", icon: "♡" },
    { id: "community", label: "Community", icon: "☷" },
    { id: "profile", label: "Profile", icon: "○" }
  ];
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function readSession() {
    try {
      var raw = sessionStorage.getItem(storageKey);
      if (raw) {
        var parsed = JSON.parse(raw);
        state.session = parsed.session || null;
        state.preferences = Array.isArray(parsed.preferences) ? parsed.preferences : [];
        state.saved = Array.isArray(parsed.saved) ? parsed.saved : [];
        return;
      }
    } catch (e) { storageAvailable = false; }
    state.session = null;
  }
  function persist() {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify({ session: state.session, preferences: state.preferences, saved: state.saved }));
      storageAvailable = true;
    } catch (e) { storageAvailable = false; }
  }
  function route() {
    var hash = location.hash || "";
    if (!hash || hash === "#") return { name: "splash" };
    var path = hash.replace(/^#\/?/, "").split("/");
    if (path[0] === "place" && path[1]) return { name: "place", id: Number(path[1]) };
    var valid = ["splash", "onboarding", "welcome", "signup", "signin", "preferences", "home", "map", "saved", "community", "profile", "about"];
    return { name: valid.indexOf(path[0]) >= 0 ? path[0] : "home" };
  }
  function go(path, replace) {
    var hash = "#/" + path;
    if (location.hash === hash) render();
    else if (replace) location.replace(hash);
    else location.hash = hash;
  }
  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () { toast.classList.remove("show"); }, 2600);
  }
  function icon(label) { return '<span class="nav-icon" aria-hidden="true">' + label + '</span>'; }
  function drawNav(active) {
    var html = navItems.map(function (item) {
      return '<a class="nav-item ' + (active === item.id ? "active" : "") + '" href="#/' + item.id + '" ' + (active === item.id ? 'aria-current="page"' : "") + '>' + icon(item.icon) + '<span>' + item.label + '</span></a>';
    }).join("");
    bottomNav.innerHTML = html;
    railNav.innerHTML = html;
  }
  function statusIcon(status) {
    return status === "reviewed" ? "▤" : status === "declared" ? "↗" : status === "preliminary" ? "○" : "?";
  }
  function badge(place) {
    var key = place.status || "unknown";
    return '<span class="status-badge status-' + esc(key) + '">' + statusIcon(key) + ' ' + esc(place.statusLabel || S.evidence[key] || S.evidence.unknown) + '</span>';
  }
  function facility(place) {
    return S.facility[place.facilityType] || "Not provided";
  }
  function notVisited(place) {
    return '<p class="not-visited">ⓘ GlutenGuide has not visited this restaurant.</p>';
  }
  function card(place) {
    return '<article class="place-card" tabindex="0" role="link" data-open-place="' + place.id + '" aria-label="Open profile for ' + esc(place.name) + '">' +
      '<div class="place-card-top"><div><h2>' + esc(place.name) + '</h2><p class="muted">' + esc(place.neighborhood || "Neighborhood not provided") + '</p></div><button type="button" class="save-button" data-save="' + place.id + '" aria-label="Save ' + esc(place.name) + '" aria-pressed="' + state.saved.includes(place.id) + '">' + (state.saved.includes(place.id) ? "♥" : "♡") + '</button></div>' +
      '<p class="cuisine">' + esc(place.cuisine || "Cuisine not provided") + '</p>' + badge(place) +
      '<div class="facility-line"><span class="small-label">FACILITY</span><span>' + esc(facility(place)) + '</span></div>' +
      notVisited(place) +
      '<p class="card-date">Last checked: ' + esc(place.sourceChecked || "Not yet checked") + '</p></article>';
  }
  function filterPlaces(source) {
    return source.filter(function (p) {
      var query = state.query.trim().toLowerCase();
      var matches = !query || [p.name, p.address, p.neighborhood, p.cuisine].join(" ").toLowerCase().includes(query);
      var f = state.filter;
      var statusMatch = f === "all" || (f === "dedicated" ? p.facilityType === "dedicated_facility" : f === "audit" ? !!p.onSiteAudit && p.onSiteAudit.approvalStatus === "approved" : p.status === f);
      return matches && statusMatch;
    });
  }
  function filters() {
    var items = [
      ["all", "All places"], ["preliminary", "Public information"], ["declared", "Restaurant-reported"],
      ["reviewed", "Documented review"], ["unknown", "Limited information"], ["dedicated", "Dedicated facility"], ["audit", "On-site audit recorded"]
    ];
    return '<div class="filter-strip" aria-label="Filter places">' + items.map(function (x) {
      return '<button type="button" class="filter-chip ' + (state.filter === x[0] ? "selected" : "") + '" data-filter="' + x[0] + '" aria-pressed="' + (state.filter === x[0]) + '">' + x[1] + '</button>';
    }).join("") + '</div>';
  }
  function listMarkup(items) {
    if (!items.length) return '<div class="empty-state"><span class="empty-symbol">⌕</span><h2>No places match these filters</h2><p>Try another search or clear your filters.</p><button type="button" class="button secondary" data-reset-filters>Reset filters</button></div>';
    return '<div class="place-list">' + items.map(card).join("") + '</div>';
  }
  function renderHome() {
    var items = filterPlaces(places);
    var greeting = state.session && state.session.name ? "Hi, " + state.session.name.split(" ")[0] : "Find a place to eat";
    return '<section class="screen-intro"><p class="eyebrow">CHICAGO · RESTAURANT DISCOVERY</p><h2>' + esc(greeting) + '</h2><p>Find gluten-free information and see what is — and is not — documented.</p></section>' +
      '<label class="search-box"><span aria-hidden="true">⌕</span><span class="sr-only">Search by restaurant, address or neighborhood</span><input id="searchInput" type="search" value="' + esc(state.query) + '" placeholder="Restaurant, address or neighborhood" autocomplete="off"><button type="button" id="clearSearch" aria-label="Clear search">×</button></label>' +
      filters() + '<div class="section-row"><h2>Places to explore</h2><span class="muted">' + items.length + ' ' + (items.length === 1 ? "place" : "places") + '</span></div>' + listMarkup(items) +
      '<p class="disclaimer-inline">' + esc(S.disclaimer) + '</p>';
  }
  function renderMap() {
    var items = filterPlaces(places);
    return '<section class="map-screen"><div id="map" class="map-canvas" role="region" aria-label="Map of Chicago restaurant locations"></div><div class="map-sheet ' + (state.mapSheetOpen ? "sheet-open" : "sheet-collapsed") + '"><button type="button" class="sheet-handle" id="sheetToggle" aria-expanded="' + state.mapSheetOpen + '"><span></span><span class="sr-only">Toggle restaurant list</span></button><div class="section-row"><h2>Nearby listings</h2><span class="muted">' + items.length + ' places</span></div><label class="search-box compact"><span aria-hidden="true">⌕</span><span class="sr-only">Search map results</span><input id="mapSearch" type="search" value="' + esc(state.query) + '" placeholder="Search places"></label>' + filters() + (state.mapFailed ? '<div class="map-error"><strong>The interactive map could not load.</strong><p>You can still browse every listing below.</p></div>' : '') + listMarkup(items) + '</div></section>';
  }
  function renderPlace(id) {
    var p = places.find(function (x) { return x.id === id; });
    if (!p) return '<div class="empty-state"><h2>Place not found</h2><button class="button" data-go="home">Back to Explore</button></div>';
    var source = p.sourceUrl ? '<a class="button secondary" href="' + esc(p.sourceUrl) + '" target="_blank" rel="noopener noreferrer">Open source ↗</a>' : '<span class="muted">Source URL: Not provided</span>';
    var website = p.website ? '<a class="button secondary" href="' + esc(p.website) + '" target="_blank" rel="noopener noreferrer">Visit website ↗</a>' : '<span class="muted">Website: Not provided</span>';
    var questions = Array.isArray(p.questions) ? p.questions.slice() : [];
    if (state.preferences.includes("Celiac disease")) questions = questions.concat(["Can the kitchen prevent cross-contact for a celiac order?", "Are separate utensils, surfaces and fryer oil used?"]);
    if (!questions.length) questions = ["Which ingredients are used?", "Are fryers, utensils and preparation surfaces shared?", "What steps are taken to prevent cross-contact?"];
    var audit = p.onSiteAudit && p.onSiteAudit.approvalStatus === "approved" ? '<p>Audit record: ' + esc(p.onSiteAudit.auditDate || "Date not provided") + '</p>' : notVisited(p);
    return '<div class="profile-heading"><button type="button" class="back-link" data-back>← Back</button>' + badge(p) + '<h2>' + esc(p.name) + '</h2><p>' + esc(p.address || "Address not provided") + '</p><p class="muted">' + esc(p.neighborhood || "Neighborhood not provided") + ' · ' + esc(p.cuisine || "Cuisine not provided") + '</p></div>' +
      '<div class="profile-actions"><button type="button" class="button" data-save="' + p.id + '" aria-pressed="' + state.saved.includes(p.id) + '">' + (state.saved.includes(p.id) ? "♥ Saved" : "♡ Save place") + '</button><a class="button secondary" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(p.address || p.name + ", Chicago") + '" target="_blank" rel="noopener noreferrer">Get directions ↗</a>' + website + '</div>' +
      '<section class="info-card"><p class="eyebrow">FACILITY TYPE</p><h3>' + esc(facility(p)) + '</h3><p>' + esc(p.dedicatedDescription || "Further details about the facility type have not been provided.") + '</p><p><strong>Shared equipment:</strong> ' + esc(p.sharedEquipment || "Not provided") + '</p><p><strong>Cross-contact procedures:</strong> ' + esc(p.crossContactProcedures || "Not provided") + '</p></section>' +
      '<section class="info-card"><p class="eyebrow">EVIDENCE AVAILABLE</p><h3>What is currently known</h3><p>' + esc(p.menu || p.description || "Not provided") + '</p><p>' + esc(p.practices || "Not provided") + '</p><p><strong>Evidence scope:</strong> ' + esc(p.evidenceScope || "Not provided") + '</p><p><strong>What this does not establish:</strong> ' + esc(p.evidenceLimitations || S.disclaimer) + '</p><p><strong>Source last checked:</strong> ' + esc(p.sourceChecked || "Not yet checked") + '</p><p><strong>Direct confirmation date:</strong> ' + esc(p.lastConfirmedDate || "Not confirmed directly") + '</p><p><strong>Operating status:</strong> ' + esc(p.operatingStatus || "Not yet confirmed") + '</p>' + source + '</section>' +
      '<section class="info-card"><p class="eyebrow">ON-SITE AUDIT · SEPARATE FROM EVIDENCE CATEGORY</p><h3>Visit and audit status</h3>' + audit + '<p>No approved on-site audit record is available unless a dated record is explicitly shown here.</p></section>' +
      '<section class="info-card"><p class="eyebrow">BEFORE ORDERING</p><h3>Questions to ask the restaurant</h3><ul class="question-list">' + questions.map(function (q) { return "<li>" + esc(q) + "</li>"; }).join("") + '</ul><p class="muted">Suggestions only, not medical advice.</p></section><p class="disclaimer-inline">' + esc(S.disclaimer) + '</p>';
  }
  function renderSaved() {
    var saved = places.filter(function (p) { return state.saved.includes(p.id); });
    return '<section class="screen-intro"><p class="eyebrow">YOUR SESSION</p><h2>Saved places</h2><p>Saved items stay in this browser tab only.</p></section>' + listMarkup(saved);
  }
  function renderCommunity() {
    return '<section class="screen-intro"><p class="eyebrow">COMMUNITY · DEMO</p><h2>Share an experience</h2><p>Individual experiences are anecdotal and do not change a restaurant’s evidence category.</p></section>' +
      '<div class="notice">Demo: your note stays in this browser session and is not shared.</div><form id="experienceForm" class="form-card"><label for="visitDate">Visit date <span class="muted">(optional)</span></label><input id="visitDate" type="date"><label for="experiencePlace">Restaurant</label><select id="experiencePlace" required><option value="">Choose a place</option>' + places.map(function (p) { return '<option value="' + p.id + '">' + esc(p.name) + '</option>'; }).join("") + '</select><label for="ordered">What was ordered? <span class="muted">(optional)</span></label><input id="ordered" maxlength="120"><label for="mentioned">Did you mention your dietary restriction?</label><select id="mentioned"><option value="Not answered">Prefer not to say</option><option value="Yes">Yes</option><option value="No">No</option></select><label for="staffProcedure">Could staff explain preparation procedures?</label><select id="staffProcedure"><option value="Not answered">Not answered</option><option value="Yes">Yes</option><option value="Partly">Partly</option><option value="No">No</option></select><label for="experienceNote">Optional note (max 500 characters)</label><textarea id="experienceNote" maxlength="500" rows="4" placeholder="Describe the interaction, not medical conclusions."></textarea><p class="form-help">Symptoms after a meal do not prove gluten exposure. Please do not include medical details or private information.</p><button class="button" type="submit">Add session note</button><p id="experienceMessage" role="status"></p></form>' +
      '<div class="section-row"><h2>Session notes</h2><span class="muted">' + state.notes.length + '</span></div>' + (state.notes.length ? '<div class="place-list">' + state.notes.map(function (n) { return '<article class="info-card"><span class="status-badge status-unknown">Individual experience · not verified by GlutenGuide</span><h3>' + esc(n.place) + '</h3><p class="muted">' + esc(n.date || "Visit date not provided") + '</p><p><strong>Ordered:</strong> ' + esc(n.ordered || "Not provided") + '</p><p><strong>Restriction mentioned:</strong> ' + esc(n.mentioned) + '</p><p><strong>Staff explained procedures:</strong> ' + esc(n.staffProcedure) + '</p><p>' + esc(n.note || "No note added.") + '</p></article>'; }).join("") + '</div>' : '<div class="empty-state"><h2>No experiences added</h2><p>Notes you add here will appear only in this session.</p></div>');
  }
  function renderProfile() {
    return '<section class="screen-intro"><p class="eyebrow">YOUR PROFILE · DEMO</p><h2>' + esc(state.session && state.session.name ? state.session.name : "Guest") + '</h2><p>' + (state.session && state.session.mode === "account" ? "Demo profile" : "Continuing as guest") + '</p></section>' +
      '<section class="info-card"><h3>Dietary preferences</h3><p>' + esc(state.preferences.length ? state.preferences.join(", ") : "No preferences selected") + '</p><button type="button" class="button secondary" data-go="preferences">Edit preferences</button></section>' +
      '<div class="settings-list"><a href="#/about"><span>How we review evidence</span><span>→</span></a><a href="#/about"><span>About and safety</span><span>→</span></a><a href="#/about#demo"><span>Demo mode explained</span><span>→</span></a></div><div class="notice">' + esc(storageAvailable ? S.sessionNotice : "Browser storage is blocked. This demo may only remember your choices until you navigate away.") + '</div><button type="button" class="button secondary full-width" id="signOut">Sign out of demo</button>';
  }
  function renderAbout() {
    return '<section class="screen-intro"><p class="eyebrow">TRANSPARENCY</p><h2>About and safety</h2><p>GlutenGuide organizes available information; it is not a medical service or certification body.</p></section><section class="info-card"><h3>Evidence categories</h3><p><strong>Documented review:</strong> specified documents or procedures reviewed against stated criteria. Scope and limitations should be recorded.</p><p><strong>Restaurant-reported / confirmed:</strong> information directly provided or explicitly confirmed to GlutenGuide.</p><p><strong>Public information found · unverified:</strong> a public claim that has not been confirmed directly and may be outdated.</p><p><strong>Limited information:</strong> there is not enough reliable, current information. This means neither safe nor unsafe.</p></section><section class="info-card"><h3>On-site audit</h3><p>An on-site audit is a separate dimension. GlutenGuide has not visited a restaurant unless an approved audit record is explicitly shown.</p><h3>Dedicated facility</h3><p>A venue’s claim about a dedicated facility is a separate characteristic, not an audit or certification.</p></section><section class="info-card"><h3>Review approach</h3><p>Reviews should document ingredients and suppliers, equipment and cleaning, order handling and staff procedures, evidence examined, limitations, findings, follow-up actions and dates. No real audit is claimed here.</p></section><section class="info-card" id="demo"><h3>Demo mode explained</h3><p>No real account is created. Email and password fields are not stored or sent. Only display name, optional preferences and saved place IDs are kept in session storage when available. Session storage normally clears when this tab is closed. Browser storage can be blocked, in which case the app falls back to memory.</p><p>' + esc(S.disclaimer) + '</p></section><button class="button secondary" data-back>Back</button>';
  }
  function renderOnboarding() {
    var slides = [
      ["Find places and ask better questions.", "Explore Chicago listings, search by neighborhood and open each place’s profile."],
      ["Separate claims from evidence.", "See what restaurants say, what public sources state and what GlutenGuide has actually reviewed."],
      ["A label is never a guarantee.", "Confirm ingredients, shared equipment and cross-contact procedures directly with the restaurant."]
    ];
    var item = slides[state.onboarding] || slides[0];
    return '<section class="welcome-panel onboarding-panel"><div class="brand-mark large">G</div><p class="eyebrow">WELCOME TO GLUTENGUIDE</p><div class="onboarding-art" aria-hidden="true">' + (state.onboarding + 1) + '</div><h2>' + esc(item[0]) + '</h2><p>' + esc(item[1]) + '</p><div class="progress-dots" aria-label="Page ' + (state.onboarding + 1) + ' of 3">' + slides.map(function (_, i) { return '<span class="' + (i === state.onboarding ? "current" : "") + '"></span>'; }).join("") + '</div><div class="button-row"><button class="button secondary" id="skipOnboarding">Skip</button><button class="button" id="nextOnboarding">' + (state.onboarding === 2 ? "Continue" : "Next") + ' →</button></div></section>';
  }
  function renderWelcome() {
    return '<section class="welcome-panel"><div class="brand-mark large">G</div><p class="eyebrow">EAT OUT WITH MORE CLARITY</p><h2>Welcome to GlutenGuide</h2><p>Explore gluten-free dining information with clear evidence labels and useful questions.</p><div class="notice demo-notice">' + esc(S.demoNotice) + '</div><div class="auth-actions"><button class="button full-width" data-go="signup">Create account (demo)</button><button class="button secondary full-width" data-go="signin">Sign in (demo)</button><button class="button outline full-width" id="guestContinue">Continue as guest</button></div></section>';
  }
  function renderAuth(kind) {
    var signup = kind === "signup";
    return '<section class="auth-panel"><button class="back-link" data-go="welcome">← Back</button><p class="eyebrow">DEMO ONLY</p><h2>' + (signup ? "Create account (demo)" : "Sign in (demo)") + '</h2><p class="muted">' + (signup ? "Use any display name and a valid email format. This does not create an account." : "Any well-formed email and non-empty password are accepted in this demo.") + '</p><div class="notice">' + esc(S.demoNotice) + '</div><form id="authForm"><label for="displayName">Display name' + (signup ? "" : " (optional)") + '</label><input id="displayName" name="displayName" autocomplete="nickname" maxlength="60" ' + (signup ? "required" : "") + '><label for="authEmail">Email</label><input id="authEmail" type="email" name="email" autocomplete="email" required><label for="authPassword">Password</label><input id="authPassword" type="password" name="password" autocomplete="' + (signup ? "new-password" : "current-password") + '" required><p class="form-help">Password and email are not saved or sent. Do not use a real password.</p><button class="button full-width" type="submit">' + (signup ? "Continue to preferences" : "Sign in (demo)") + '</button><p id="authMessage" role="status"></p></form><p class="centered"><button class="text-button" data-go="' + (signup ? "signin" : "signup") + '">' + (signup ? "Already here? Sign in (demo)" : "New here? Create account (demo)") + '</button></p><button class="button outline full-width" id="authGuest">Continue as guest</button></section>';
  }
  function renderPreferences() {
    var options = ["Celiac disease", "Non-celiac gluten sensitivity", "Wheat allergy", "Avoiding gluten for another reason"];
    return '<section class="auth-panel"><p class="eyebrow">OPTIONAL · DEMO</p><h2>Dietary preferences</h2><p>These choices only help prioritize suggested questions. They are not medical advice. You can leave everything unselected.</p><form id="preferencesForm"><fieldset><legend>Choose any that apply</legend>' + options.map(function (o) { return '<label class="check-option"><input type="checkbox" name="preference" value="' + esc(o) + '" ' + (state.preferences.includes(o) ? "checked" : "") + '><span>' + esc(o) + '</span></label>'; }).join("") + '</fieldset><button type="submit" class="button full-width">Save preferences for this session</button><button type="button" class="button secondary full-width" id="skipPreferences">Skip for now</button></form><p class="form-help">' + esc(S.sessionNotice) + '</p></section>';
  }
  function renderSplash() {
    return '<section class="splash-panel"><div class="brand-mark large">G</div><h2>GlutenGuide</h2><p>' + esc(S.tagline) + '</p><button class="button secondary" id="skipSplash">Continue</button></section>';
  }
  function setHeader(name, back) {
    var names = { splash: "GlutenGuide", onboarding: "Welcome", welcome: "Welcome", signup: "Create account (demo)", signin: "Sign in (demo)", preferences: "Preferences", home: "Explore", map: "Map", saved: "Saved", community: "Community", profile: "Profile", about: "About and safety", place: "Place details" };
    title.textContent = names[name] || "GlutenGuide";
    var authScreen = ["splash", "onboarding", "welcome", "signup", "signin", "preferences"].includes(name);
    document.getElementById("appHeader").classList.toggle("hidden", authScreen);
    headerBack.classList.toggle("hidden", !back);
    headerAction.classList.toggle("hidden", name !== "home");
  }
  function render() {
    var r = route();
    var name = r.name;
    var navActive = ["home", "map", "saved", "community", "profile"].includes(name) ? name : "";
    drawNav(navActive);
    bottomNav.classList.toggle("hidden", ["splash", "onboarding", "welcome", "signup", "signin", "preferences"].includes(name));
    document.body.classList.toggle("auth-route", ["splash", "onboarding", "welcome", "signup", "signin", "preferences"].includes(name));
    setHeader(name, name === "place" || name === "about");
    var html = "";
    if (name === "splash") html = renderSplash();
    else if (name === "onboarding") html = renderOnboarding();
    else if (name === "welcome") html = renderWelcome();
    else if (name === "signup" || name === "signin") html = renderAuth(name);
    else if (name === "preferences") html = renderPreferences();
    else if (name === "home") html = renderHome();
    else if (name === "map") html = renderMap();
    else if (name === "place") html = renderPlace(r.id);
    else if (name === "saved") html = renderSaved();
    else if (name === "community") html = renderCommunity();
    else if (name === "profile") html = renderProfile();
    else if (name === "about") html = renderAbout();
    root.innerHTML = html;
    bind(name);
    if (name === "map") initMap();
    root.classList.remove("screen-enter");
    void root.offsetWidth;
    root.classList.add("screen-enter");
  }
  function bind(name) {
    root.querySelectorAll("[data-go]").forEach(function (el) { el.addEventListener("click", function () { go(el.getAttribute("data-go")); }); });
    root.querySelectorAll("[data-open-place]").forEach(function (el) {
      function open() { go("place/" + el.getAttribute("data-open-place")); }
      el.addEventListener("click", function (event) { if (event.target.closest("[data-save]")) return; open(); });
      el.addEventListener("keydown", function (event) { if (event.target === el && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); open(); } });
    });
    root.querySelectorAll("[data-save]").forEach(function (el) {
      el.addEventListener("click", function (event) {
        event.stopPropagation();
        var id = Number(el.getAttribute("data-save"));
        state.saved = state.saved.includes(id) ? state.saved.filter(function (x) { return x !== id; }) : state.saved.concat([id]);
        persist(); render();
        showToast(state.saved.includes(id) ? "Place saved for this session." : "Place removed from saved.");
      });
    });
    root.querySelectorAll("[data-filter]").forEach(function (el) { el.addEventListener("click", function () { state.filter = el.getAttribute("data-filter"); render(); }); });
    var search = document.getElementById("searchInput") || document.getElementById("mapSearch");
    if (search) search.addEventListener("input", function () { var pos = search.selectionStart; state.query = search.value; render(); var next = document.getElementById(search.id); if (next) { next.focus(); try { next.setSelectionRange(pos, pos); } catch (e) {} } });
    var clear = document.getElementById("clearSearch");
    if (clear) clear.addEventListener("click", function () { state.query = ""; render(); document.getElementById("searchInput").focus(); });
    var reset = root.querySelector("[data-reset-filters]");
    if (reset) reset.addEventListener("click", function () { state.filter = "all"; state.query = ""; render(); });
    root.querySelectorAll("[data-back]").forEach(function (el) { el.addEventListener("click", function () { if (history.length > 1) history.back(); else go("home", true); }); });
    var splash = document.getElementById("skipSplash");
    if (splash) splash.addEventListener("click", function () { go(localStorageSafe("gg-onboarded") ? "welcome" : "onboarding"); });
    var skip = document.getElementById("skipOnboarding");
    if (skip) skip.addEventListener("click", function () { localStorageSafe("gg-onboarded", "1"); go("welcome"); });
    var next = document.getElementById("nextOnboarding");
    if (next) next.addEventListener("click", function () { if (state.onboarding < 2) { state.onboarding += 1; render(); } else { localStorageSafe("gg-onboarded", "1"); go("welcome"); } });
    var guest = document.getElementById("guestContinue");
    if (guest) guest.addEventListener("click", function () { state.session = { name: "Guest", mode: "guest" }; persist(); go("preferences"); });
    var authGuest = document.getElementById("authGuest");
    if (authGuest) authGuest.addEventListener("click", function () { state.session = { name: "Guest", mode: "guest" }; persist(); go("preferences"); });
    var authForm = document.getElementById("authForm");
    if (authForm) authForm.addEventListener("submit", function (event) {
      event.preventDefault();
      var nameInput = document.getElementById("displayName");
      var emailInput = document.getElementById("authEmail");
      var passwordInput = document.getElementById("authPassword");
      var message = document.getElementById("authMessage");
      if (!emailInput.checkValidity() || !passwordInput.value) { message.textContent = "Enter a valid email format and a non-empty password."; return; }
      var displayName = nameInput.value.trim();
      if (name === "signup" && !displayName) { message.textContent = "Enter a display name."; return; }
      state.session = { name: displayName || "Guest", mode: "account" };
      persist();
      passwordInput.value = "";
      emailInput.value = "";
      if (nameInput) nameInput.value = "";
      showToast("Demo sign-in complete. No credentials were stored.");
      go("preferences");
    });
    var prefForm = document.getElementById("preferencesForm");
    if (prefForm) prefForm.addEventListener("submit", function (event) {
      event.preventDefault();
      state.preferences = Array.from(prefForm.querySelectorAll('input[name="preference"]:checked')).map(function (x) { return x.value; });
      persist(); go("home");
    });
    var skipPrefs = document.getElementById("skipPreferences");
    if (skipPrefs) skipPrefs.addEventListener("click", function () { state.preferences = []; persist(); go("home"); });
    var form = document.getElementById("experienceForm");
    if (form) form.addEventListener("submit", function (event) {
      event.preventDefault();
      var id = Number(document.getElementById("experiencePlace").value);
      var p = places.find(function (x) { return x.id === id; });
      if (!p) return;
      state.notes.unshift({
        place: p.name, date: document.getElementById("visitDate").value,
        ordered: document.getElementById("ordered").value.trim(),
        mentioned: document.getElementById("mentioned").value,
        staffProcedure: document.getElementById("staffProcedure").value,
        note: document.getElementById("experienceNote").value.trim()
      });
      var msg = document.getElementById("experienceMessage");
      msg.textContent = "Added to this browser session only; not sent or shared.";
      render();
    });
    var signOut = document.getElementById("signOut");
    if (signOut) signOut.addEventListener("click", function () {
      state.session = null; state.preferences = []; state.saved = []; state.notes = [];
      try { sessionStorage.removeItem(storageKey); } catch (e) {}
      go("welcome");
    });
    var toggle = document.getElementById("sheetToggle");
    if (toggle) toggle.addEventListener("click", function () { state.mapSheetOpen = !state.mapSheetOpen; var sheet = root.querySelector(".map-sheet"); sheet.classList.toggle("sheet-open", state.mapSheetOpen); sheet.classList.toggle("sheet-collapsed", !state.mapSheetOpen); toggle.setAttribute("aria-expanded", String(state.mapSheetOpen)); });
  }
  function localStorageSafe(key, value) {
    try {
      if (arguments.length > 1) { localStorage.setItem(key, value); return true; }
      return localStorage.getItem(key) === "1";
    } catch (e) { return false; }
  }
  function initMap() {
    var mapEl = document.getElementById("map");
    if (!mapEl) return;
    if (!window.L) {
      state.mapFailed = true;
      var fallback = document.createElement("div");
      fallback.className = "map-error";
      fallback.innerHTML = "<strong>The interactive map could not load.</strong><p>Browse the complete list below instead.</p>";
      mapEl.replaceWith(fallback);
      render();
      return;
    }
    state.mapFailed = false;
    if (state.map) { try { state.map.remove(); } catch (e) {} state.map = null; state.markers.clear(); }
    state.map = L.map("map", { scrollWheelZoom: false }).setView([41.91, -87.66], 11);
    var tiles = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>' }).addTo(state.map);
    tiles.on("tileerror", function () {
      if (mapEl.querySelector(".tile-error")) return;
      var note = document.createElement("div"); note.className = "map-error tile-error"; note.textContent = "Map tiles are unavailable on this connection. The complete list remains below."; mapEl.appendChild(note);
    });
    places.forEach(function (p) {
      if (typeof p.lat !== "number" || typeof p.lng !== "number") return;
      var marker = L.marker([p.lat, p.lng]).addTo(state.map);
      marker.bindPopup('<strong>' + esc(p.name) + '</strong><br><button type="button" data-map-place="' + p.id + '">View profile</button>');
      marker.on("popupopen", function (event) {
        var button = event.popup.getElement().querySelector("[data-map-place]");
        if (button) button.addEventListener("click", function () { go("place/" + p.id); });
      });
      state.markers.set(p.id, marker);
    });
    window.setTimeout(function () { if (state.map) state.map.invalidateSize(true); }, 180);
    window.setTimeout(function () {
      var mapSearch = document.getElementById("mapSearch");
      if (mapSearch) mapSearch.addEventListener("input", function () {
        var query = mapSearch.value.toLowerCase();
        state.query = mapSearch.value;
        state.markers.forEach(function (m, id) {
          var p = places.find(function (x) { return x.id === id; });
          if (p && [p.name, p.address, p.neighborhood, p.cuisine].join(" ").toLowerCase().includes(query)) m.addTo(state.map);
          else if (state.map) state.map.removeLayer(m);
        });
      });
    }, 0);
  }
  headerBack.addEventListener("click", function () { history.back(); });
  headerAction.addEventListener("click", function () { go("map"); });
  window.addEventListener("hashchange", render);
  window.addEventListener("resize", function () { if (state.map) window.setTimeout(function () { state.map.invalidateSize(true); }, 100); });
  readSession();
  if (!location.hash) {
    go("splash", true);
  } else {
    var current = route().name;
    if (current === "splash" && localStorageSafe("gg-onboarded")) go("welcome", true);
    else render();
  }
  window.setTimeout(function () {
    if (route().name === "splash") {
      if (localStorageSafe("gg-onboarded")) go("welcome", true);
      else go("onboarding", true);
    }
  }, 900);
})();