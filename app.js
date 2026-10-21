const restaurants = [
  {
    id: 1, name: "Wheat's End Cafe & Bakery", neighborhood: "Lakeview · 543 W Diversey Pkwy",
    address: "543 W Diversey Pkwy, Chicago, IL 60614",
    lat: 41.9321, lng: -87.6438, status: "reviewed", statusLabel: "Dedicated gluten-free menu reported",
    description: "Cafe and bakery known for a fully gluten-free menu.",
    cuisine: "Cafe · Bakery", icon: "🥐", rating: "Real venue",
    menu: "Public listings describe the cafe and bakery as fully gluten-free. Confirm current menu and operations directly with the venue.",
    practices: "This status is based on preliminary public information, not an independent audit by GlutenGuide. Verify current procedures, ingredients, and cross-contact controls before ordering.",
    questions: ["Is the kitchen and bakery still entirely gluten-free?", "Have any ingredients or suppliers changed?", "What procedures are followed for people with celiac disease?"],
    reviewDate: "GlutenGuide has not independently verified this information."
  },
  {
    id: 2, name: "CheSa's Bistro & Bar", neighborhood: "Avondale · 3235 W Addison St",
    address: "3235 W Addison St, Suite C, Chicago, IL 60618",
    lat: 41.9463, lng: -87.7094, status: "reviewed", statusLabel: "Gluten-free kitchen reported",
    description: "Cajun-Creole and Southern comfort food; public listings describe a gluten-free kitchen.",
    cuisine: "Cajun-Creole · Southern", icon: "🍲", rating: "Real venue",
    menu: "Public listings describe the restaurant as having a fully gluten-free kitchen. Confirm the current menu and status with the restaurant.",
    practices: "This is a preliminary summary of public information, not an independent audit or a guarantee of zero risk.",
    questions: ["Is the kitchen still entirely gluten-free?", "Are all sauces, seasonings, and supplier ingredients checked?", "What should a guest with celiac disease tell the staff?"],
    reviewDate: "GlutenGuide has not independently verified this information."
  },
  {
    id: 3, name: "Brightwok Kitchen", neighborhood: "The Loop · 21 E Adams St",
    address: "21 E Adams St, Chicago, IL 60603",
    lat: 41.8794, lng: -87.6274, status: "declared", statusLabel: "Gluten-free options reported",
    description: "Asian-inspired fast-casual food with publicly listed gluten-free options.",
    cuisine: "Asian-inspired · Bowls", icon: "🥗", rating: "Real venue",
    menu: "Public information indicates gluten-free options are available. Menu items and preparation practices may change; check directly before ordering.",
    practices: "Gluten-free options do not automatically mean a dedicated kitchen or no cross-contact. GlutenGuide has not independently reviewed the kitchen.",
    questions: ["Which menu items are suitable for someone with celiac disease?", "Are woks, fryers, utensils, or preparation surfaces shared?", "Can staff check sauces and ingredient labels?"],
    reviewDate: "GlutenGuide has not independently verified this information."
  },
  {
    id: 4, name: "BIBIBOP Asian Grill", neighborhood: "North Center area · 3304 N Western Ave",
    address: "3304 N Western Ave, Chicago, IL 60618",
    lat: 41.9414, lng: -87.6874, status: "reviewed", statusLabel: "Gluten-free menu reported",
    description: "Build-your-own bowls; public brand information describes a gluten-free menu.",
    cuisine: "Asian-inspired · Bowls", icon: "🍚", rating: "Real venue",
    menu: "Public information describes gluten-free offerings. Verify this specific location, current ingredients, sauces, and handling procedures.",
    practices: "Brand-level claims are not an independent verification of this location's current food preparation. Ask staff about celiac-specific procedures.",
    questions: ["Does this location follow the brand's current gluten-free procedures?", "How are utensils and serving areas managed?", "Are sauces and toppings checked for ingredient changes?"],
    reviewDate: "GlutenGuide has not independently verified this location."
  },
  {
    id: 5, name: "Andie's Restaurant", neighborhood: "Andersonville · 5253 N Clark St",
    address: "5253 N Clark St, Chicago, IL 60640",
    lat: 41.9762, lng: -87.6683, status: "declared", statusLabel: "Gluten-free options reported",
    description: "Mediterranean and Middle Eastern restaurant with menu items publicly marked gluten-free.",
    cuisine: "Mediterranean · Middle Eastern", icon: "🫒", rating: "Real venue",
    menu: "Public listings describe multiple gluten-free menu options. Confirm current menu and preparation with the restaurant.",
    practices: "A gluten-free menu label does not establish that cross-contact is prevented. GlutenGuide has not independently reviewed the restaurant's procedures.",
    questions: ["Which dishes can be prepared for someone with celiac disease?", "Are shared fryers, grills, or utensils used?", "Can staff confirm ingredients and cross-contact procedures?"],
    reviewDate: "GlutenGuide has not independently verified this information."
  }
];

let activeFilter = "all";
let searchTerm = "";
let selectedId = 1;
const sessionReviews = [];
const list = document.getElementById("restaurantList");
const resultCount = document.getElementById("resultCount");
const searchInput = document.getElementById("search");
const dialog = document.getElementById("restaurantDialog");
const dialogContent = document.getElementById("dialogContent");
const reviewSelect = document.getElementById("reviewRestaurant");
let map;
const markers = new Map();

function statusClass(status) {
  return status === "reviewed" ? "reviewed" : status === "declared" ? "declared" : "unknown";
}
function filteredRestaurants() {
  return restaurants.filter(place => {
    const filterMatch = activeFilter === "all" || place.status === activeFilter;
    const text = (place.name + " " + place.neighborhood + " " + place.cuisine + " " + place.address).toLowerCase();
    return filterMatch && text.includes(searchTerm.toLowerCase());
  });
}
function initMap() {
  const mapEl = document.getElementById("map");
  if (!window.L) {
    mapEl.innerHTML = '<p class="map-error">The map library could not load. Check your internet connection and refresh the page.</p>';
    return;
  }
  map = L.map("map").setView([41.91, -87.66], 11);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap contributors</a>'
  }).addTo(map);
  restaurants.forEach(place => {
    const marker = L.marker([place.lat, place.lng]).addTo(map);
    marker.bindPopup('<strong>' + escapeHtml(place.name) + '</strong><br>' + escapeHtml(place.address) + '<br><button type="button" class="popup-details" data-place-id="' + place.id + '">View details</button>');
    marker.on("popupopen", event => {
      const button = event.popup.getElement().querySelector("[data-place-id]");
      if (button) button.addEventListener("click", () => openRestaurant(place.id));
    });
    markers.set(place.id, marker);
  });
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}
function renderRestaurants() {
  const results = filteredRestaurants();
  resultCount.textContent = `${results.length} real ${results.length === 1 ? "venue" : "venues"}`;
  list.innerHTML = "";
  if (!results.length) list.innerHTML = '<div class="empty-state">No venues match. Try another search or filter.</div>';
  results.forEach(place => {
    const card = document.createElement("article");
    card.className = "restaurant-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Open profile for ${place.name}`);
    const art = document.createElement("div");
    art.className = `restaurant-art art-${place.id}`;
    art.textContent = place.icon;
    art.setAttribute("aria-hidden", "true");
    const main = document.createElement("div");
    main.className = "card-main";
    const titleRow = document.createElement("div");
    titleRow.className = "card-title-row";
    const title = document.createElement("h3");
    title.className = "card-title";
    title.textContent = place.name;
    titleRow.appendChild(title);
    const neighborhood = document.createElement("p");
    neighborhood.className = "card-location";
    neighborhood.textContent = place.neighborhood;
    const badge = document.createElement("span");
    badge.className = `status-badge ${statusClass(place.status)}`;
    badge.textContent = place.statusLabel;
    const desc = document.createElement("p");
    desc.className = "card-description";
    desc.textContent = place.description;
    const foot = document.createElement("div");
    foot.className = "card-foot";
    foot.textContent = "View venue details ↗";
    main.append(titleRow, neighborhood, badge, desc, foot);
    card.append(art, main);
    card.addEventListener("click", () => openRestaurant(place.id));
    card.addEventListener("keydown", event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openRestaurant(place.id);
      }
    });
    list.appendChild(card);
  });
  updateMapMarkers(results);
}
function updateMapMarkers(results) {
  const ids = new Set(results.map(place => place.id));
  markers.forEach((marker, id) => {
    if (!map) return;
    if (ids.has(id)) marker.addTo(map);
    else map.removeLayer(marker);
  });
}
function openRestaurant(id) {
  const place = restaurants.find(item => item.id === Number(id));
  if (!place) return;
  selectedId = place.id;
  if (map && markers.has(place.id)) {
    map.setView([place.lat, place.lng], Math.max(map.getZoom(), 14));
    markers.get(place.id).openPopup();
  }
  const heading = document.createElement("div");
  heading.className = "dialog-hero";
  const badge = document.createElement("span");
  badge.className = `status-badge ${statusClass(place.status)}`;
  badge.textContent = place.statusLabel;
  const h2 = document.createElement("h2");
  h2.textContent = place.name;
  const subtitle = document.createElement("p");
  subtitle.className = "dialog-subtitle";
  subtitle.textContent = `${place.address} · ${place.cuisine}`;
  heading.append(badge, h2, subtitle);
  dialogContent.replaceChildren(heading);
  const sections = [
    ["Menu information", place.menu],
    ["What is currently known", place.practices],
    ["Questions to ask the restaurant", place.questions.map(question => "• " + question).join("\n")],
    ["Verification status", place.reviewDate]
  ];
  sections.forEach(([title, content]) => {
    const section = document.createElement("section");
    section.className = "dialog-section";
    const h3 = document.createElement("h3");
    h3.textContent = title;
    const p = document.createElement("p");
    p.style.whiteSpace = "pre-line";
    p.textContent = content;
    section.append(h3, p);
    dialogContent.appendChild(section);
  });
  const directions = document.createElement("a");
  directions.className = "directions-link";
  directions.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(place.address);
  directions.target = "_blank";
  directions.rel = "noopener";
  directions.textContent = "Open directions ↗";
  dialogContent.appendChild(directions);
  const warning = document.createElement("div");
  warning.className = "dialog-warning";
  warning.textContent = "This is an early prototype using public information. GlutenGuide has not independently verified this restaurant's current practices. Never assume an option is safe for celiac disease based on this listing alone; contact the restaurant directly.";
  dialogContent.appendChild(warning);
  if (typeof dialog.showModal === "function") dialog.showModal();
  else alert("Restaurant details are available in the page. Please use a modern browser for the full demo.");
}
document.querySelectorAll(".filter").forEach(button => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    document.querySelectorAll(".filter").forEach(other => {
      const active = other === button;
      other.classList.toggle("active", active);
      other.setAttribute("aria-pressed", String(active));
    });
    renderRestaurants();
  });
});
document.getElementById("searchButton").addEventListener("click", () => {
  searchTerm = searchInput.value.trim();
  renderRestaurants();
});
searchInput.addEventListener("input", () => {
  searchTerm = searchInput.value.trim();
  renderRestaurants();
});
document.getElementById("dialogClose").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => {
  if (event.target === dialog) dialog.close();
});
document.getElementById("reviewForm").addEventListener("submit", event => {
  event.preventDefault();
  const place = restaurants.find(item => item.id === Number(reviewSelect.value));
  const type = document.getElementById("reviewType").selectedOptions[0].textContent;
  const note = document.getElementById("reviewText").value.trim();
  const message = document.getElementById("formMessage");
  if (!place || !note) return;
  const review = { restaurant: place.name, type, note, time: new Date().toLocaleString() };
  sessionReviews.unshift(review);
  const output = document.getElementById("reviewOutput");
  output.replaceChildren();
  sessionReviews.slice(0, 5).forEach(item => {
    const card = document.createElement("div");
    card.className = "review-note";
    const meta = document.createElement("small");
    meta.textContent = `${item.restaurant} · ${item.type} · ${item.time}`;
    const text = document.createElement("div");
    text.textContent = item.note;
    card.append(meta, text);
    output.appendChild(card);
  });
  message.textContent = "Demo review added in this browser session only.";
  document.getElementById("reviewText").value = "";
});
initMap();
renderRestaurants();

// Explain the labels automatically on a visitor's first visit, with a permanent button to reopen the guide.
const categoryHelpDialog = document.getElementById("categoryHelpDialog");
const openCategoryHelp = () => {
  if (categoryHelpDialog && typeof categoryHelpDialog.showModal === "function" && !categoryHelpDialog.open) {
    categoryHelpDialog.showModal();
  }
};
document.getElementById("categoryHelpOpen").addEventListener("click", openCategoryHelp);
document.getElementById("categoryHelpClose").addEventListener("click", () => categoryHelpDialog.close());
document.getElementById("categoryHelpDone").addEventListener("click", () => categoryHelpDialog.close());
categoryHelpDialog.addEventListener("click", event => {
  if (event.target === categoryHelpDialog) categoryHelpDialog.close();
});
try {
  if (!sessionStorage.getItem("glutenguide-category-guide-seen")) {
    window.setTimeout(() => {
      openCategoryHelp();
      sessionStorage.setItem("glutenguide-category-guide-seen", "1");
    }, 700);
  }
} catch (error) {
  // If storage is unavailable, the visitor can still open the guide using the button.
  window.setTimeout(openCategoryHelp, 700);
}
