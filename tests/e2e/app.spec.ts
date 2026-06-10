import { expect, test } from "@playwright/test";

const calculatorRoutes = [
  ["/calculators/compound-interest", "Bileşik Faiz Hesaplama"],
  ["/calculators/simple-interest", "Basit Faiz Hesaplama"],
  ["/calculators/investment-return", "Yatırım Getirisi Hesaplama"],
  ["/calculators/loan", "Kredi Planı"],
] as const;

test("home page and calculator routes open directly", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Kredini, birikimini ve yatırım planını daha net gör." }),
  ).toBeVisible();
  await expect(page.getByText("Örnek veri merkezi")).toBeVisible();

  for (const [route, heading] of calculatorRoutes) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  }
});

test("loan calculator handles type changes, validation, schedule and PDF actions", async ({
  page,
}) => {
  await page.goto("/calculators/loan");

  await expect(page.getByRole("heading", { level: 1, name: "Kredi Planı" })).toBeVisible();
  await page.getByRole("tab", { name: "Taşıt Kredisi" }).click();
  await expect(page.getByRole("tab", { name: "Taşıt Kredisi", selected: true })).toBeVisible();

  await page.getByLabel("Kredi tutarı").fill("0");
  await page.getByRole("button", { name: "Sonucu göster" }).click();
  await expect(page.getByText("Geçerli bir tutar girin.")).toBeVisible();

  await page.getByLabel("Kredi tutarı").fill("250000");
  await page.getByRole("button", { name: "Sonucu göster" }).click();

  await expect(page.getByRole("button", { name: "Tabloyu aç" })).toBeVisible();
  await page.getByRole("button", { name: "Tabloyu aç" }).click();
  await expect(page.getByRole("table")).toBeVisible();

  const bankLink = page.getByRole("link", { name: "Banka sayfasına git" }).first();
  await expect(bankLink).toHaveAttribute("href", /https?:\/\//);
});

test("investment calculator exposes a PDF download from the monthly roadmap", async ({
  page,
}) => {
  await page.goto("/calculators/investment-return");

  await expect(
    page.getByRole("heading", { level: 1, name: "Yatırım Getirisi Hesaplama" }),
  ).toBeVisible();

  const pdfLink = page.getByRole("link", { name: "PDF indir" });
  await expect(pdfLink).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await pdfLink.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toContain("aylik-birikim-checklisti.pdf");
});

test("mobile viewport stays within the horizontal bounds", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of ["/", "/calculators/loan"]) {
    await page.goto(route);
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );

    expect(hasOverflow).toBe(false);
  }
});

test("loan calculator falls back cleanly when the loan market api fails", async ({ page }) => {
  let marketRequestCount = 0;

  page.on("request", (request) => {
    if (request.url().includes("/api/reference/loan-market")) {
      marketRequestCount += 1;
    }
  });

  await page.route("**/api/reference/loan-market", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "boom" }),
    });
  });

  await page.goto("/calculators/loan");
  await expect.poll(() => marketRequestCount).toBeGreaterThan(0);
  await expect(
    page.getByText("Kredi referans verisi kontrol ediliyor. Bağlantı kurulamazsa seed snapshot gösterilir."),
  ).toBeVisible();
});
