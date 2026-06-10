import { expect, test, type Page } from "@playwright/test";

const calculatorRoutes = [
  ["/calculators/compound-interest", "Bileşik Faiz Hesaplama"],
  ["/calculators/simple-interest", "Basit Faiz Hesaplama"],
  ["/calculators/investment-return", "Yatırım Getirisi Hesaplama"],
  ["/calculators/loan", "Kredi Planı"],
] as const;

const growthFlows = [
  {
    route: "/calculators/compound-interest",
    heading: "Bileşik Faiz Hesaplama",
    initialLabel: "Başlangıç birikimi",
    monthlyLabel: "Her ay eklenecek tutar",
    rateLabel: "Yıllık getiri oranı",
    resultLabel: "Plan sonu toplam",
  },
  {
    route: "/calculators/simple-interest",
    heading: "Basit Faiz Hesaplama",
    initialLabel: "Başlangıç birikimi",
    monthlyLabel: "Her ay eklenecek tutar",
    rateLabel: "Yıllık basit faiz oranı",
    resultLabel: "Plan sonu toplam",
  },
  {
    route: "/calculators/investment-return",
    heading: "Yatırım Getirisi Hesaplama",
    initialLabel: "Başlangıç yatırımı",
    monthlyLabel: "Her ay yatırılacak tutar",
    rateLabel: "Yıllık getiri varsayımı",
    resultLabel: "Plan sonu tahmini toplam",
  },
] as const;

async function expectEmptyCalculationState(page: Page) {
  await expect(page.getByText("Henüz hesaplama yapılmadı")).toBeVisible();
  await expect(
    page.getByText("Değerlerini girip Hesapla butonuna bastığında sonuçların burada gösterilecek."),
  ).toBeVisible();
}

test("home page and calculator routes open directly", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Kredini, birikimini ve yatırım planını daha net gör.",
    }),
  ).toBeVisible();
  await expect(page.getByText("Örnek veri merkezi")).toBeVisible();

  for (const [route, heading] of calculatorRoutes) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1, name: heading })).toBeVisible();
  }
});

for (const flow of growthFlows) {
  test(`${flow.heading} route starts empty, calculates on submit, and clears cleanly`, async ({
    page,
  }) => {
    await page.goto(flow.route);

    await expect(page.getByRole("heading", { level: 1, name: flow.heading })).toBeVisible();
    await expectEmptyCalculationState(page);
    await expect(page.getByText(flow.resultLabel)).toHaveCount(0);
    await expect(page.getByRole("link", { name: "PDF indir" })).toHaveCount(0);

    await expect(page.getByLabel(flow.initialLabel)).toHaveValue("");
    await expect(page.getByLabel(flow.initialLabel)).toHaveAttribute("placeholder", "25.000 TL");
    await expect(page.getByLabel(flow.monthlyLabel)).toHaveValue("");
    await expect(page.getByLabel(flow.monthlyLabel)).toHaveAttribute("placeholder", "5.000 TL");
    await expect(page.getByLabel(flow.rateLabel)).toHaveValue("");
    await expect(page.getByLabel(flow.rateLabel)).toHaveAttribute("placeholder", "30");
    await expect(page.getByLabel("Plan süresi")).toHaveValue("");
    await expect(page.getByLabel("Plan süresi")).toHaveAttribute("placeholder", "5");

    await page.getByRole("button", { name: "Hesapla" }).click();
    await expect(page.getByText("Geçerli bir tutar girin.").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Hesapla" })).toBeEnabled();
    await expect(page.getByText("Hesaplanıyor...")).toHaveCount(0);

    await page.getByLabel(flow.initialLabel).fill("25000");
    await page.getByLabel(flow.monthlyLabel).fill("5000");
    await page.getByLabel(flow.rateLabel).fill("30");
    await page.getByLabel("Plan süresi").fill("5");

    await page.getByRole("button", { name: "Hesapla" }).click();
    await expect(page.getByRole("button", { name: "Hesaplanıyor..." })).toBeDisabled();
    await expect(page.getByText(flow.resultLabel)).toBeVisible();
    await expect(page.getByRole("link", { name: "PDF indir" })).toBeVisible();

    await page.getByRole("button", { name: "Sıfırla" }).click();

    await expect(page.getByLabel(flow.initialLabel)).toHaveValue("");
    await expect(page.getByLabel(flow.monthlyLabel)).toHaveValue("");
    await expect(page.getByLabel(flow.rateLabel)).toHaveValue("");
    await expect(page.getByLabel("Plan süresi")).toHaveValue("");
    await expectEmptyCalculationState(page);
    await expect(page.getByText(flow.resultLabel)).toHaveCount(0);
    await expect(page.getByRole("link", { name: "PDF indir" })).toHaveCount(0);
  });
}

test("target mode starts empty, calculates after submit, and clears cleanly", async ({ page }) => {
  await page.goto("/calculators/investment-return");

  await page.getByText("Hedefe ne zaman ulaşırım?", { exact: true }).click();

  await expectEmptyCalculationState(page);
  await expect(page.getByText("Hedefe kalan süre")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "PDF indir" })).toHaveCount(0);

  await expect(page.getByLabel("Ulaşmak istediğin tutar")).toHaveValue("");
  await expect(page.getByLabel("Ulaşmak istediğin tutar")).toHaveAttribute(
    "placeholder",
    "1.000.000 TL",
  );
  await expect(page.getByLabel("Bugünkü birikimin")).toHaveValue("");
  await expect(page.getByLabel("Bugünkü birikimin")).toHaveAttribute(
    "placeholder",
    "250.000 TL",
  );
  await expect(page.getByLabel("Her ay yatiracagin tutar")).toHaveValue("");
  await expect(page.getByLabel("Her ay yatiracagin tutar")).toHaveAttribute(
    "placeholder",
    "5.000 TL",
  );
  await expect(page.getByLabel("Yıllık getiri varsayımı")).toHaveValue("");

  await page.getByRole("button", { name: "Hesapla" }).click();
  await expect(page.getByText("Geçerli bir tutar girin.").first()).toBeVisible();
  await expect(page.getByText("Hesaplanıyor...")).toHaveCount(0);

  await page.getByLabel("Ulaşmak istediğin tutar").fill("1000000");
  await page.getByLabel("Bugünkü birikimin").fill("250000");
  await page.getByLabel("Her ay yatiracagin tutar").fill("5000");
  await page.getByLabel("Yıllık getiri varsayımı").fill("30");

  await page.getByRole("button", { name: "Hesapla" }).click();
  await expect(page.getByRole("button", { name: "Hesaplanıyor..." })).toBeDisabled();
  await expect(page.getByText("Hedefe kalan süre")).toBeVisible();
  await expect(page.getByRole("link", { name: "PDF indir" })).toBeVisible();

  await page.getByRole("button", { name: "Sıfırla" }).click();

  await expect(page.getByLabel("Ulaşmak istediğin tutar")).toHaveValue("");
  await expect(page.getByLabel("Bugünkü birikimin")).toHaveValue("");
  await expect(page.getByLabel("Her ay yatiracagin tutar")).toHaveValue("");
  await expect(page.getByLabel("Yıllık getiri varsayımı")).toHaveValue("");
  await expectEmptyCalculationState(page);
});

test("loan calculator keeps reference inputs empty until explicit apply, then calculates and clears", async ({
  page,
}) => {
  await page.goto("/calculators/loan");

  await expect(page.getByRole("heading", { level: 1, name: "Kredi Planı" })).toBeVisible();
  await expectEmptyCalculationState(page);
  await expect(page.getByText("Nominal aylık taksit")).toHaveCount(0);

  await expect(page.getByLabel("Kredi tutarı")).toHaveValue("");
  await expect(page.getByLabel("Kredi tutarı")).toHaveAttribute("placeholder", "250.000 TL");
  await expect(page.getByLabel("Vade")).toHaveValue("");
  await expect(page.getByLabel("Vade")).toHaveAttribute("placeholder", "36");
  await expect(page.getByLabel("Aylık faiz oranı")).toHaveValue("");
  await expect(page.getByLabel("Aylık faiz oranı")).toHaveAttribute("placeholder", "3,29");
  await expect(page.getByLabel("Masraf / sigorta")).toHaveValue("");
  await expect(page.getByLabel("Masraf / sigorta")).toHaveAttribute("placeholder", "3.500 TL");

  await page.getByRole("tab", { name: "Taşıt Kredisi" }).click();
  await expect(page.getByRole("tab", { name: "Taşıt Kredisi", selected: true })).toBeVisible();
  await expect(page.getByLabel("Aylık faiz oranı")).toHaveValue("");
  await expect(page.getByLabel("Masraf / sigorta")).toHaveValue("");

  await page.getByRole("button", { name: "Hesapla" }).click();
  await expect(page.getByText("Geçerli bir tutar girin.").first()).toBeVisible();
  await expect(page.getByText("Hesaplanıyor...")).toHaveCount(0);

  await page.getByRole("button", { name: "Güncel oranı kullan" }).click();
  await expect(page.getByLabel("Aylık faiz oranı")).not.toHaveValue("");
  await expect(page.getByLabel("Masraf / sigorta")).not.toHaveValue("");

  await page.getByLabel("Kredi tutarı").fill("250000");
  await page.getByLabel("Vade").fill("36");

  await page.getByRole("button", { name: "Hesapla" }).click();
  await expect(page.getByRole("button", { name: "Hesaplanıyor..." })).toBeDisabled();
  await expect(page.getByText("Nominal aylık taksit")).toBeVisible();

  await page.getByRole("button", { name: "Tabloyu aç" }).click();
  await expect(page.getByRole("table")).toBeVisible();

  const bankLink = page.getByRole("link", { name: "Banka sayfasına git" }).first();
  await expect(bankLink).toHaveAttribute("href", /https?:\/\//);

  await page.getByRole("button", { name: "Sıfırla" }).click();

  await expect(page.getByLabel("Kredi tutarı")).toHaveValue("");
  await expect(page.getByLabel("Vade")).toHaveValue("");
  await expect(page.getByLabel("Aylık faiz oranı")).toHaveValue("");
  await expect(page.getByLabel("Masraf / sigorta")).toHaveValue("");
  await expectEmptyCalculationState(page);
  await expect(page.getByText("Nominal aylık taksit")).toHaveCount(0);
});

test("mobile viewport stays within the horizontal bounds", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of ["/", "/calculators/loan", "/calculators/investment-return"]) {
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
    page.getByText("Güncel kredi verisi yüklenemedi."),
  ).toBeVisible();
  await expect(page.getByLabel("Aylık faiz oranı")).toHaveValue("");
  await expectEmptyCalculationState(page);
});
