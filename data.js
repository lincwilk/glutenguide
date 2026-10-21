const restaurants = [
  {
    id: 1, name: "Wheat's End Cafe & Bakery", neighborhood: "Lakeview · 543 W Diversey Pkwy",
    address: "543 W Diversey Pkwy, Chicago, IL 60614",
    lat: 41.9321, lng: -87.6438, status: "preliminary", statusLabel: "Public venue statement · not independently reviewed", dedicatedGF: true,
    dedicatedDescription: "The venue publicly describes its facility as dedicated gluten-free.",
    sourceUrl: "https://wheatsendcafe.com/", sourceLabel: "Wheat’s End official website", sourceChecked: "2026-10-21", evidenceType: "public_venue_statement",
    description: "Cafe and bakery known for a fully gluten-free menu.",
    cuisine: "Cafe · Bakery", icon: "🥐", rating: "Real venue",
    menu: "Public listings describe the cafe and bakery as fully gluten-free. Confirm current menu and operations directly with the venue.",
    practices: "The venue publicly describes its facility as dedicated gluten-free. GlutenGuide has not audited this site. Verify current procedures, ingredients, and cross-contact controls before ordering.",
    questions: ["Is the kitchen and bakery still entirely gluten-free?", "Have any ingredients or suppliers changed?", "What procedures are followed for people with celiac disease?"],
    reviewDate: "GlutenGuide has not independently verified this information."
  },
  {
    id: 2, name: "CheSa's Bistro & Bar", neighborhood: "Avondale · 3235 W Addison St",
    address: "3235 W Addison St, Suite C, Chicago, IL 60618",
    lat: 41.9463, lng: -87.7094, status: "preliminary", statusLabel: "Public venue statement · not independently reviewed", dedicatedGF: true,
    sourceUrl: "https://chesasbistro.com/about", sourceLabel: "CheSa’s official website", sourceChecked: "2026-10-21", evidenceType: "public_venue_statement",
    description: "Cajun-Creole and Southern comfort food; public listings describe a gluten-free kitchen.",
    cuisine: "Cajun-Creole · Southern", icon: "🍲", rating: "Real venue",
    menu: "Public listings describe the restaurant as having a fully gluten-free kitchen. Confirm the current menu and status with the restaurant.",
    practices: "The venue publicly describes its kitchen as 100% gluten-free. GlutenGuide has not audited this site, and this is not a guarantee of zero risk.",
    questions: ["Is the kitchen still entirely gluten-free?", "Are all sauces, seasonings, and supplier ingredients checked?", "What should a guest with celiac disease tell the staff?"],
    reviewDate: "GlutenGuide has not independently verified this information."
  },
  {
    id: 3, name: "Brightwok Kitchen", neighborhood: "The Loop · 21 E Adams St",
    address: "21 E Adams St, Chicago, IL 60603",
    lat: 41.8794, lng: -87.6274, status: "preliminary", statusLabel: "Public information · not independently verified", dedicatedGF: false,
    sourceUrl: "", sourceLabel: "Official source link not yet recorded", sourceChecked: "", evidenceType: "public_listing",
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
    lat: 41.9414, lng: -87.6874, status: "preliminary", statusLabel: "Brand-level information · location not reviewed", dedicatedGF: false,
    sourceUrl: "", sourceLabel: "Brand-level source link not yet recorded", sourceChecked: "", evidenceType: "brand_level_public_info",
    description: "Build-your-own bowls; public brand information describes a gluten-free menu.",
    cuisine: "Asian-inspired · Bowls", icon: "🍚", rating: "Real venue",
    menu: "Public information describes gluten-free offerings. Verify this specific location, current ingredients, sauces, and handling procedures.",
    practices: "Brand-level gluten-free claims are not an independent verification of this location's current food preparation. GlutenGuide has not audited this site. Ask staff about celiac-specific procedures.",
    questions: ["Does this location follow the brand's current gluten-free procedures?", "How are utensils and serving areas managed?", "Are sauces and toppings checked for ingredient changes?"],
    reviewDate: "GlutenGuide has not independently verified this location."
  },
  {
    id: 5, name: "Andie's Restaurant", neighborhood: "Andersonville · 5253 N Clark St",
    address: "5253 N Clark St, Chicago, IL 60640",
    lat: 41.9762, lng: -87.6683, status: "preliminary", statusLabel: "Public information · not independently verified", dedicatedGF: false,
    sourceUrl: "", sourceLabel: "Official source link not yet recorded", sourceChecked: "", evidenceType: "public_listing",
    description: "Mediterranean and Middle Eastern restaurant with menu items publicly marked gluten-free.",
    cuisine: "Mediterranean · Middle Eastern", icon: "🫒", rating: "Real venue",
    menu: "Public listings describe multiple gluten-free menu options. Confirm current menu and preparation with the restaurant.",
    practices: "A gluten-free menu label does not establish that cross-contact is prevented. GlutenGuide has not independently reviewed the restaurant's procedures.",
    questions: ["Which dishes can be prepared for someone with celiac disease?", "Are shared fryers, grills, or utensils used?", "Can staff confirm ingredients and cross-contact procedures?"],
    reviewDate: "GlutenGuide has not independently verified this information."
  },
  {
    id: 6, name: "Defloured: A Gluten-Free Bakery", neighborhood: "Andersonville · 1477 W Balmoral Ave",
    address: "1477 W Balmoral Ave, Chicago, IL 60640",
    lat: 41.9794, lng: -87.6675, status: "preliminary", statusLabel: "Public venue statement · not independently reviewed", dedicatedGF: true,
    sourceUrl: "https://www.deflouredbakery.com/faqs", sourceLabel: "Defloured official FAQ", sourceChecked: "2026-10-21", evidenceType: "public_venue_statement",
    description: "Bakery whose official FAQ says its products are gluten-free and made in a dedicated gluten-free facility.",
    cuisine: "Bakery · Desserts", icon: "🧁", rating: "Venue statement",
    menu: "The bakery’s official FAQ says its products are gluten-free and made in a 100% dedicated gluten-free facility. The menu changes; confirm current products and other allergens directly.",
    practices: "The venue publicly describes its facility as dedicated gluten-free. GlutenGuide has not independently reviewed or audited the bakery. The venue also notes that nuts are used in the facility.",
    questions: ["Are all current products made in the dedicated gluten-free facility?", "What other allergens are handled in the bakery?", "Have ingredients, suppliers, or preparation practices changed recently?"],
    reviewDate: "Official FAQ consulted 2026-10-21; no independent GlutenGuide review recorded."
  }
];

/* Facility type is a separate dimension from evidence status and audit status.
   Only explicit dedicated-facility statements are represented as dedicated here. */
restaurants.forEach(function (place) {
  if (!place.facilityType) place.facilityType = place.dedicatedGF === true ? "dedicated_facility" : "unknown";
  if (!place.website) place.website = place.sourceUrl || "";
  if (!place.operatingStatus) place.operatingStatus = "Not yet confirmed";
  if (!place.sharedEquipment) place.sharedEquipment = "Not provided";
  if (!place.crossContactProcedures) place.crossContactProcedures = "Not provided";
  if (!place.lastConfirmedDate) place.lastConfirmedDate = "Not confirmed directly";
  if (!place.evidenceScope) place.evidenceScope = place.evidenceType === "public_venue_statement" ? "Public statement only; exact operational scope not independently confirmed." : "Not provided";
  if (!place.evidenceLimitations) place.evidenceLimitations = "This source does not establish current kitchen procedures or the safety of an individual meal.";
  place.onSiteAudit = null;
});
