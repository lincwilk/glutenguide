const restaurants = [
  {
    id: 1, name: "Green Fork Kitchen", neighborhood: "West Loop · SAMPLE LOCATION",
    status: "reviewed", statusLabel: "Documentation reviewed · DEMO",
    description: "Illustrative example of how a venue profile could summarize documented procedures.",
    cuisine: "Seasonal bowls · Sample menu", icon: "🥬", rating: "Demo profile",
    menu: "Sample menu only: a grain bowl and roasted vegetables.",
    practices: "Fictional sample: separate preparation tools are reported in this example. No real restaurant has been checked.",
    questions: ["How do you prevent gluten cross-contact during preparation?", "Are fryers and cooking surfaces shared?", "Can staff confirm ingredients and sauces?"],
    reviewDate: "Not reviewed — fictional sample"
  },
  {
    id: 2, name: "Lakeview Table", neighborhood: "River North · SAMPLE LOCATION",
    status: "declared", statusLabel: "Restaurant-reported · DEMO",
    description: "Illustrative example of a restaurant that says it has gluten-free choices.",
    cuisine: "Modern American · Sample menu", icon: "🍽️", rating: "Demo profile",
    menu: "Sample menu only: grilled vegetables, chicken and salad.",
    practices: "Fictional sample: the venue states that it offers gluten-free choices, but its procedures have not been independently reviewed.",
    questions: ["Which dishes can be prepared without gluten-containing ingredients?", "What steps reduce cross-contact?", "Can you accommodate someone with celiac disease?"],
    reviewDate: "Not reviewed — fictional sample"
  },
  {
    id: 3, name: "Juniper & Grain", neighborhood: "The Loop · SAMPLE LOCATION",
    status: "unknown", statusLabel: "Limited information · DEMO",
    description: "Illustrative example where information is not sufficient to assess preparation practices.",
    cuisine: "Café · Sample menu", icon: "☕", rating: "Demo profile",
    menu: "No real menu information available.",
    practices: "Fictional sample: no useful information has been collected. Do not infer suitability from this listing.",
    questions: ["Do you offer gluten-free options?", "How are they prepared?", "Are ingredients and cross-contact controls documented?"],
    reviewDate: "No information collected"
  },
  {
    id: 4, name: "City Corner Café", neighborhood: "Near West Side · SAMPLE LOCATION",
    status: "declared", statusLabel: "Restaurant-reported · DEMO",
    description: "Illustrative example of how customer questions might be shown alongside restaurant statements.",
    cuisine: "Coffee & brunch · Sample menu", icon: "🥑", rating: "Demo profile",
    menu: "Sample menu only: eggs, fruit and coffee.",
    practices: "Fictional sample: the venue states it can discuss ingredients on request. This statement has not been verified.",
    questions: ["Are any ingredients or condiments shared?", "Can preparation surfaces be cleaned and tools changed?", "Who can confirm allergen information?"],
    reviewDate: "Not reviewed — fictional sample"
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

function statusClass(status) {
  return status === "reviewed" ? "reviewed" : status === "declared" ? "declared" : "unknown";
}

function filteredRestaurants() {
  return restaurants.filter(place => {
    const filterMatch = activeFilter === "all" || place.status === activeFilter;
    const text = (place.name + " " + place.neighborhood + " " + place.cuisine).toLowerCase();
    return filterMatch && text.includes(searchTerm.toLowerCase());
  });
}

function renderRestaurants() {
  const results = filteredRestaurants();
  resultCount.textContent = `${results.length} sample ${results.length === 1 ? "place" : "places"}`;
  list.innerHTML = "";
  if (!results.length) {
    list.innerHTML = '<div class="empty-state">No sample places match. Try another search or filter.</div>';
  }
  results.forEach((place, index) => {
    const card = document.createElement("article");
    card.className = "restaurant-card";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Open sample profile for ${place.name}`);
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
    foot.textContent = "View sample details ↗";
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
  updateMapPins(results);
}

function updateMapPins(results) {
  const availableIds = new Set(results.map(p => String(p.id)));
  document.querySelectorAll(".map-pin").forEach(pin => {
    pin.hidden = !availableIds.has(pin.dataset.id);
    pin.classList.toggle("selected", pin.dataset.id === String(selectedId));
  });
}

function openRestaurant(id) {
  const place = restaurants.find(item => item.id === Number(id));
  if (!place) return;
  selectedId = place.id;
  document.querySelectorAll(".map-pin").forEach(pin => pin.classList.toggle("selected", pin.dataset.id === String(id)));
  const heading = document.createElement("div");
  heading.className = "dialog-hero";
  const badge = document.createElement("span");
  badge.className = `status-badge ${statusClass(place.status)}`;
  badge.textContent = place.statusLabel;
  const h2 = document.createElement("h2");
  h2.textContent = place.name;
  const subtitle = document.createElement("p");
  subtitle.className = "dialog-subtitle";
  subtitle.textContent = `${place.neighborhood} · ${place.cuisine}`;
  heading.append(badge, h2, subtitle);
  dialogContent.replaceChildren(heading);
  const sections = [
    ["Menu information", place.menu],
    ["What this demo says", place.practices],
    ["Questions to ask the restaurant", place.questions.map(question => "• " + question).join("\n")],
    ["Review status", place.reviewDate]
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
  const warning = document.createElement("div");
  warning.className = "dialog-warning";
  warning.textContent = "Fictional demo data. This profile does not describe a real restaurant and must not be used to judge food safety. A reviewed document does not guarantee a meal is risk-free.";
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

document.querySelectorAll(".map-pin").forEach(pin => {
  pin.addEventListener("click", () => openRestaurant(pin.dataset.id));
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

renderRestaurants();
