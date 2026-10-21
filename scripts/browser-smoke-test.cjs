const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "..");
const types = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8" };

async function main() {
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    const file = path.resolve(root, "." + pathname);
    if (!file.startsWith(root + path.sep) && file !== path.join(root, "index.html")) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    let target = file;
    if (pathname === "/") target = path.join(root, "index.html");
    fs.readFile(target, (error, data) => {
      if (error) {
        res.writeHead(404).end("Not found");
        return;
      }
      res.writeHead(200, { "Content-Type": types[path.extname(target)] || "application/octet-stream" });
      res.end(data);
    });
  });
  await new Promise(resolve => server.listen(4173, "127.0.0.1", resolve));
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  const failedRequests = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("requestfailed", request => failedRequests.push(request.url() + " — " + request.failure()?.errorText));
  try {
    await page.goto("http://127.0.0.1:4173/", { waitUntil: "domcontentloaded" });
    try {
      await page.waitForFunction(() => document.querySelectorAll("#restaurantList .restaurant-card").length === 6, null, { timeout: 10000 });
    } catch (error) {
      throw new Error("Initial venue cards did not render. pageErrors=" + JSON.stringify(errors) + "; failedRequests=" + JSON.stringify(failedRequests) + "; body=" + (await page.locator("body").innerText()).slice(0, 1200));
    }
    if (!(await page.locator("#map.leaflet-container").count())) {
      await page.waitForSelector("#map.leaflet-container", { timeout: 15000 });
    }
    if (await page.locator("#reviewRestaurant option").count() !== 7) throw new Error("Feedback form should contain all six venues plus its placeholder.");
    await page.locator("#search").fill("Defloured");
    if (await page.locator("#restaurantList .restaurant-card").count() !== 1) throw new Error("Search should return the Defloured listing.");
    await page.locator("#search").fill("");
    await page.locator('[data-filter="dedicated"]').click();
    if (await page.locator("#restaurantList .restaurant-card").count() !== 3) throw new Error("Dedicated-gluten-free filter should return three sourced venues.");
    await page.locator('[data-filter="all"]').click();
    await page.locator("#restaurantList .restaurant-card").first().click();
    if (!(await page.locator("#restaurantDialog[open]").count())) throw new Error("Selecting a venue should open its profile.");
    if (!(await page.getByText("Open source ↗").count())) throw new Error("Venue profile should display its source link when available.");
    await page.locator("#dialogClose").click();
    await page.locator("#categoryHelpOpen").click();
    if (!(await page.locator("#categoryHelpDialog[open]").count())) throw new Error("Category guide should open only when requested.");
    await page.locator("#categoryHelpDone").click();
    await page.locator("#reviewRestaurant").selectOption("6");
    await page.locator("#reviewText").fill("Automated browser test note");
    await page.locator("#reviewForm button[type=submit]").click();
    if (!(await page.getByText(/not been sent or published/).count())) throw new Error("Feedback must clearly state that it is not sent or published.");
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(350);
    const dimensions = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth }));
    if (dimensions.scrollWidth > dimensions.width + 1) throw new Error(`Mobile layout overflows horizontally: ${JSON.stringify(dimensions)}`);
    if (errors.length) throw new Error("Browser JavaScript errors: " + errors.join(" | "));
    console.log("Browser smoke tests passed: map, search, dedicated filter, profiles/source links, category guide, feedback, and mobile overflow.");
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
