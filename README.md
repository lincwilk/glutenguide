# GlutenGuide

GlutenGuide is a static, mobile-first restaurant discovery website for Chicago. It uses HTML, CSS, vanilla JavaScript, Leaflet and OpenStreetMap; there is no build step or backend.

## Current app experience

- Hash-based single-page navigation with Explore, Map, Saved, Community and Profile.
- First-run splash, three onboarding cards, welcome, simulated sign-in/sign-up and optional dietary preferences.
- Restaurant data is maintained in `data.js`; shared labels, evidence terminology and recurring safety copy are in `strings.js`. Some screen-specific copy remains beside its renderer in `app.js`.
- Saved places, display name and optional preferences use sessionStorage where available. They are not synchronized to a server and normally reset when the tab closes. Password and email are not stored.
- Community experiences are kept in memory for the current page session only and never alter a venue's evidence classification.
- PWA manifest and SVG placeholder icon are included. A service worker is intentionally omitted to avoid serving stale restaurant information as though it were current.

## Evidence and food-safety limitations

Evidence categories describe the information available, not the safety of an individual meal. Public venue statements are not direct confirmation to GlutenGuide, document review, an on-site audit, or a certification. The app must explicitly state that GlutenGuide has not visited a restaurant unless an approved audit record exists. A dedicated facility is a separate characteristic.

Do not invent operating status, equipment-sharing details, confirmation dates, audits, ratings or certifications. Missing fields should remain “Not provided” or “Not yet confirmed”. Verify current information with each venue before making decisions, especially for celiac disease or serious allergies.

## Run locally

Open `index.html` in a modern browser. Some installability features require HTTPS or localhost; GitHub Pages provides HTTPS. Browser storage may be disabled, in which case the demo can fall back to in-memory state.

## Placeholder icon

`icons/app-icon.svg` is a replaceable vector placeholder. For a more consistent install experience, export square PNGs at 192×192 and 512×512 and update the manifest and Apple touch icon reference. Test installation on the actual devices you support.

## Next stage

When persistent accounts, moderation, and an approved audit workflow are required, introduce a backend (for example a database with row-level access control and authenticated reviewer roles). Never put private audit notes or secrets in this static repository.
