const fs = require("node:fs");
const vm = require("node:vm");
const assert = require("node:assert/strict");

const source = fs.readFileSync("data.js", "utf8");
const context = { window: {} };
vm.runInNewContext(source, context);
const restaurants = context.window.restaurants;
assert.ok(Array.isArray(restaurants) && restaurants.length > 0, "Venue data must be a non-empty array");

const ids = restaurants.map((v) => v.id);
const names = restaurants.map((v) => v.name);
assert.equal(new Set(ids).size, ids.length, "Venue IDs must be unique");
assert.equal(new Set(names).size, names.length, "Venue names must be unique");
const statuses = new Set(["reviewed", "declared", "preliminary", "unknown"]);
for (const v of restaurants) {
  assert.ok(statuses.has(v.status), "Unexpected evidence status for " + v.name);
  assert.ok(v.name && v.address, "Name and address required for " + v.name);
  assert.equal(typeof v.dedicatedGF, "boolean", "dedicatedGF must be explicit for " + v.name);
  assert.ok(v.evidenceType && v.sourceLabel, "Evidence type and source label required for " + v.name);
  assert.ok(Object.hasOwn(v, "sourceUrl") && Object.hasOwn(v, "sourceChecked"), "Source fields required for " + v.name);
  assert.ok(v.facilityType, "Facility type must be explicit, even when unknown, for " + v.name);
  assert.equal(v.onSiteAudit, null, "No invented on-site audit may be assigned for " + v.name);
  if (v.status === "declared") {
    assert.equal(v.evidenceType, "direct_venue_confirmation", "Public websites cannot imply direct confirmation for " + v.name);
    assert.ok(v.sourceChecked, "Direct confirmation needs a date for " + v.name);
  }
  if (v.status === "reviewed") assert.ok(v.reviewDate, "Documented review needs a record for " + v.name);
  if (v.dedicatedGF) assert.ok(v.sourceUrl, "Dedicated facility claims need a source URL for " + v.name);
  if (v.sourceChecked) assert.match(v.sourceChecked, /^\d{4}-\d{2}-\d{2}$/, "Date format must be YYYY-MM-DD for " + v.name);
}
assert.ok(restaurants.some((v) => v.name.startsWith("Defloured")), "Defloured must remain in the shared dataset");
const app = fs.readFileSync("app.js", "utf8");
assert.match(app, /GlutenGuide has not visited this restaurant\./, "No-visit disclosure must be present");
assert.match(app, /sessionStorage/, "Demo session storage must be explicit");
assert.doesNotMatch(app, /password\s*:\s*|sessionStorage\.setItem\([^\n]*password/i, "Passwords must never be persisted");
console.log("Validated " + restaurants.length + " venue records and demo evidence safeguards.");
