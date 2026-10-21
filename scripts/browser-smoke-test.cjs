const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "..");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json" };

async function main() {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    const target = pathname === "/" ? path.join(root, "index.html") : path.resolve(root, "." + pathname);
    if (!target.startsWith(root + path.sep)) { res.writeHead(403).end("Forbidden"); return; }
    fs.readFile(target, (error, data) => {
      if (error) { res.writeHead(404).end("Not found"); return; }
      res.writeHead(200, { "Content-Type": types[path.extname(target)] || "application/octet-stream" });
      res.end(data);
    });
  });
  await new Promise(resolve => server.listen(4173, "127.0.0.1", resolve));
  const browser = await chromium.launch({ headless: true });
  const errors = [];
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    page.on("pageerror", e => errors.push(e.message));
    await page.goto("http://127.0.0.1:4173/#/splash", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("heading", { name: "Find places and ask better questions." }).waitFor();
    await page.getByRole("button", { name: "Skip" }).click();
    await page.getByRole("heading", { name: "Welcome to GlutenGuide" }).waitFor();
    if (!(await page.getByText(/no real account is created/i).count())) throw new Error("Welcome screen must disclose demo-only mode.");
    await page.getByRole("button", { name: "Continue as guest" }).click();
    await page.getByRole("heading", { name: "Dietary preferences" }).waitFor();
    await page.getByRole("button", { name: "Skip for now" }).click();
    await page.getByRole("heading", { name: "Hi, Guest" }).waitFor();
    const initialCards = await page.locator(".place-card").count();
    if (initialCards < 5) throw new Error("Expected the existing venue dataset to render; found " + initialCards);
    await page.locator("#searchInput").fill("Defloured");
    if (await page.locator(".place-card").count() !== 1) throw new Error("Search should return one Defloured result.");
    await page.locator("#clearSearch").click();
    await page.locator('[data-filter="dedicated"]').click();
    if (await page.locator(".place-card").count() !== 3) throw new Error("Dedicated facility filter should use the existing three public venue statements.");
    await page.locator('[data-filter="all"]').click();
    await page.locator(".place-card").first().locator("[data-save]").click();
    await page.locator('#bottomNav a[href="#/saved"]').click();
    if (await page.locator(".place-card").count() !== 1) throw new Error("Saved places should update for the current session.");
    await page.locator('#bottomNav a[href="#/home"]').click();
    await page.locator(".place-card").first().click();
    await page.getByText("GlutenGuide has not visited this restaurant.", { exact: true }).waitFor();
    await page.getByRole("heading", { name: "Questions to ask the restaurant" }).waitFor();
    await page.locator("[data-back]").click();
    await page.locator('#bottomNav a[href="#/community"]').click();
    await page.locator("#experiencePlace").selectOption({ index: 1 });
    await page.locator("#experienceNote").fill("<img src=x onerror=alert(1)> session test");
    await page.getByRole("button", { name: "Add session note" }).click();
    await page.getByText("Individual experience · not verified by GlutenGuide").waitFor();
    if (await page.locator("#sessionNotes img").count()) throw new Error("User note must be rendered as text, not HTML.");
    if (!(await page.locator("#sessionNotes").getByText(/<img src=x onerror=alert\(1\)>/).count())) throw new Error("User text should be displayed literally.");
    await page.locator('#bottomNav a[href="#/profile"]').click();
    await page.getByRole("button", { name: "Sign out of demo" }).click();
    await page.getByRole("heading", { name: "Welcome to GlutenGuide" }).waitFor();
    await page.getByRole("button", { name: "Sign in (demo)" }).click();
    await page.locator("#authEmail").fill("person@example.com");
    await page.locator("#authPassword").fill("never-store-this");
    await page.getByRole("button", { name: "Sign in (demo)" }).last().click();
    await page.getByRole("heading", { name: "Dietary preferences" }).waitFor();
    const storage = await page.evaluate(() => sessionStorage.getItem("gg-demo-session-v1"));
    if (storage && storage.includes("never-store-this")) throw new Error("Password must never be stored in sessionStorage.");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("http://127.0.0.1:4173/#/home", { waitUntil: "domcontentloaded" });
    await page.waitForSelector(".place-card");
    await page.waitForTimeout(150);
    const dims = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    if (dims.scrollWidth > dims.width + 1) throw new Error("Mobile layout overflows horizontally: " + JSON.stringify(dims));
    if (errors.length) throw new Error("Browser JavaScript errors: " + errors.join(" | "));
    await context.close();

    const blockedContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await blockedContext.route("https://unpkg.com/leaflet@1.9.4/**", route => route.abort());
    const blockedPage = await blockedContext.newPage();
    blockedPage.on("pageerror", e => errors.push(e.message));
    await blockedPage.goto("http://127.0.0.1:4173/#/map", { waitUntil: "domcontentloaded" });
    await blockedPage.waitForSelector(".map-error");
    if (!(await blockedPage.getByText(/complete list remains below|browse the complete list below/i).count())) throw new Error("Map failure must offer a clear list fallback.");
    if (await blockedPage.locator(".place-card").count() < 1) throw new Error("Map failure should preserve restaurant listings.");
    await blockedContext.close();
    if (errors.length) throw new Error("Browser JavaScript errors: " + errors.join(" | "));
    console.log("Browser smoke tests passed: onboarding, guest/auth demo, preferences, search, filters, saved places, profiles, community text safety, sign-out, mobile overflow, and blocked-map fallback.");
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
