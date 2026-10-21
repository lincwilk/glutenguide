# GlutenGuide

GlutenGuide is a mobile-first restaurant discovery experience focused on clearer gluten-free dining information, starting with Chicago.

## What is included

- Restaurant search by name, cuisine, address, or neighborhood.
- Interactive map and a matching restaurant list.
- Filters for dedicated gluten-free facilities and information evidence status.
- Venue profiles with practical questions to ask before ordering.
- Public source links where a source has been recorded.
- A local feedback form for personal experiences and information updates.

## Evidence and venue information

The listing status describes the evidence available to GlutenGuide; it is not a food-safety rating or a guarantee that a meal is free from gluten or cross-contact.

- **Public information** means the listing is based on information available publicly. It is not the same as direct confirmation from a venue.
- **Restaurant confirmed** should be used only after a direct statement or confirmation is documented.
- **Evidence reviewed** should be used only when the evidence, scope, reviewer role, findings, and review date are recorded.
- **Limited information** means current, reliable information is missing or insufficient.
- **Dedicated gluten-free facility** describes a venue's stated setup, not an independent audit or certification.

A public statement is not an independent assessment. Users should confirm current ingredients, shared equipment, preparation surfaces, cleaning, and cross-contact procedures directly with the venue, especially when dining with celiac disease or serious allergies.

The current listings do not represent completed GlutenGuide on-site audits. No venue should receive a pass/fail result unless a real review has been completed and its evidence recorded. A payment or commercial relationship must never change an evidence status.

## Technical notes

This version is a static front-end site built with HTML, CSS, and JavaScript. It uses Leaflet and OpenStreetMap for the map and does not require a build step.

Open `index.html` in a modern browser to run it locally. Venue data is currently maintained in `app.js`. Feedback notes remain in memory for the current page session only; they are not sent to a server or shared with other users.

## Before a public launch

1. Record an official source and a checked date for each public claim.
2. Confirm venue details and location data.
3. Define evidence review criteria with qualified food-safety and celiac-disease expertise.
4. Add moderation, privacy, correction, and retention processes before accepting public submissions.
5. Add automated checks and test the map, search, filters, keyboard navigation, and mobile layouts in a browser.
6. Introduce a backend only when accounts, moderation, and persistent data are ready to be supported.

GlutenGuide is an information and discovery service, not a medical device, certification body, or guarantee that any individual meal is risk-free.
