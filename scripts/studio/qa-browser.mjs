import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const origin = process.env.STUDIO_QA_URL ?? "http://localhost:3000";
const directory = "artifacts/studio-qa";
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const results = [];
try {
  for (const width of [360, 390, 768, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 960 },
      locale: "es-MX",
    });
    const page = await context.newPage();
    const response = await page.goto(`${origin}/studio?utm_source=studio-qa`, {
      waitUntil: "networkidle",
    });
    assert.equal(
      response?.status(),
      200,
      "Habilita Studio público en el entorno aislado de QA.",
    );
    assert.equal(await page.locator("h1").count(), 1);
    assert.match(
      await page.locator("h1").innerText(),
      /Crea anuncios para\s+tu negocio/,
    );
    assert.equal(
      new URL(await page.locator('link[rel="canonical"]').getAttribute("href"))
        .pathname,
      "/studio",
    );
    assert.equal(
      new URL(await page.locator('link[rel="canonical"]').getAttribute("href"))
        .search,
      "",
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      true,
      `Overflow at ${width}px`,
    );
    for (const value of await page
      .locator('script[type="application/ld+json"]')
      .allTextContents())
      JSON.parse(value);
    await page.screenshot({
      path: `${directory}/landing-${width}.png`,
      fullPage: true,
    });
    results.push({ page: "landing", width, status: "passed" });
    await context.close();
  }
  if (
    process.env.STUDIO_QA_STORAGE_STATE &&
    process.env.STUDIO_QA_TENANT_SLUG
  ) {
    const context = await browser.newContext({
      storageState: process.env.STUDIO_QA_STORAGE_STATE,
      viewport: { width: 390, height: 844 },
    });
    const page = await context.newPage(),
      base = `${origin}/dashboard/${encodeURIComponent(process.env.STUDIO_QA_TENANT_SLUG)}/studio`;
    for (const route of [
      "",
      "/disenos",
      "/publicaciones",
      "/tlacos",
      "/configuracion",
    ]) {
      await page.goto(base + route, { waitUntil: "networkidle" });
      assert.equal(
        new URL(page.url()).pathname.startsWith(new URL(base).pathname),
        true,
        "La sesión debe pertenecer al negocio piloto.",
      );
      assert.match(
        await page.locator('meta[name="robots"]').getAttribute("content"),
        /noindex/,
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
        true,
      );
      await page.screenshot({
        path: `${directory}/private-${route.slice(1) || "home"}.png`,
        fullPage: true,
      });
      results.push({ page: route || "home", width: 390, status: "passed" });
    }
    await context.close();
  } else
    results.push({
      page: "private",
      status: "pending",
      reason:
        "Configura sesión y negocio piloto de QA; no se usan cuentas ficticias.",
    });
  await writeFile(
    `${directory}/results.json`,
    JSON.stringify({ at: new Date().toISOString(), origin, results }, null, 2),
  );
} finally {
  await browser.close();
}
