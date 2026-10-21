const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const source = fs.readFileSync("app.js", "utf8");
const match = source.match(/const restaurants = (\[[\s\S]*?\n\]);/);
assert.ok(match, "Restaurant data array must exist in app.js");

const restaurants = vm.runInNewContext(match[1]);
assert.ok(Array.isArray(restaurants), "Restaurant data must be an array");
assert.ok(restaurants.length > 0, "At least one venue must be listed");

const ids = restaurants.map((venue) => venue.id);
const names = restaurants.map((venue) => venue.name);
assert.equal(new Set(ids).size, ids.length, "Venue IDs must be unique");
assert.equal(new Set(names).size, names.length, "Venue names must be unique");

const allowedStatuses = new Set(["reviewed", "declared", "preliminary", "unknown"]);
for (const venue of restaurants) {
  assert.ok(allowedStatuses.has(venue.status), `Unexpected status for ${venue.name}`);
  assert.ok(venue.name && venue.address, `Name and address are required for ${venue.name}`);
  assert.equal(typeof venue.dedicatedGF, "boolean", `dedicatedGF must be explicit for ${venue.name}`);
  assert.ok(venue.evidenceType, `Evidence type is required for ${venue.name}`);
  assert.ok(venue.sourceLabel, `Source label is required for ${venue.name}`);
  assert.ok(Object.hasOwn(venue, "sourceUrl"), `sourceUrl field is required for ${venue.name}`);
  assert.ok(Object.hasOwn(venue, "sourceChecked"), `sourceChecked field is required for ${venue.name}`);

  if (venue.status === "declared") {
    assert.equal(venue.evidenceType, "direct_venue_confirmation",
      `${venue.name} cannot be restaurant-reported without direct confirmation`);
    assert.ok(venue.sourceChecked, `Direct confirmation needs a checked date for ${venue.name}`);
  }
  if (venue.status === "reviewed") {
    assert.ok(venue.reviewDate, `Reviewed status needs a review record for ${venue.name}`);
  }
  if (venue.dedicatedGF) {
    assert.ok(venue.sourceUrl, `Dedicated-facility claims need a source link for ${venue.name}`);
  }
  if (venue.sourceChecked) {
    assert.match(venue.sourceChecked, /^\d{4}-\d{2}-\d{2}$/,
      `Source check date must use YYYY-MM-DD for ${venue.name}`);
  }
}

assert.ok(restaurants.some((venue) => venue.name.startsWith("Defloured")),
  "Defloured must be included in the shared venue data");
console.log(`Validated ${restaurants.length} GlutenGuide venue records.`);
