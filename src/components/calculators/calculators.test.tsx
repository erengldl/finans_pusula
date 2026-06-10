// @vitest-environment jsdom

import { act, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/components/DonutChart", () => ({
  DonutChart: () => <div data-testid="donut-chart" />,
}));

vi.mock("@/components/SimpleLineChart", () => ({
  SimpleLineChart: () => <div data-testid="line-chart" />,
}));

vi.mock("@/components/InvestmentForecastPanel", () => ({
  InvestmentForecastPanel: () => <div data-testid="investment-forecast-panel" />,
}));

vi.mock("@/components/InflationForecastPanel", () => ({
  InflationForecastPanel: () => <div data-testid="inflation-forecast-panel" />,
}));

vi.mock("@/components/LoanForecastPanel", () => ({
  LoanForecastPanel: () => <div data-testid="loan-forecast-panel" />,
}));

vi.mock("@/components/LoanBankOffersPanel", () => ({
  LoanBankOffersPanel: () => <div data-testid="loan-bank-offers-panel" />,
}));

vi.mock("@/components/MonthlyRoadmap", () => ({
  MonthlyRoadmap: () => <div data-testid="monthly-roadmap" />,
}));

import { GrowthCalculator } from "@/components/calculators/GrowthCalculator";
import { LoanCalculator } from "@/components/calculators/LoanCalculator";

type RenderedComponent = {
  container: HTMLDivElement;
  unmount: () => void;
};

type TestGlobal = typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT?: boolean;
};

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const loanMarketSnapshot = {
  generatedAt: "2026-06-10T12:00:00.000Z",
  liveIntegrationStatus: "Kredi referans verisi hazir.",
  referenceRates: [
    {
      loanType: "personal",
      label: "Ihtiyac kredisi",
      averageMonthlyRate: 3.29,
      typicalFees: 3500,
    },
    {
      loanType: "vehicle",
      label: "Tasit kredisi",
      averageMonthlyRate: 3.09,
      typicalFees: 2500,
    },
    {
      loanType: "mortgage",
      label: "Konut kredisi",
      averageMonthlyRate: 2.89,
      typicalFees: 4500,
    },
  ],
} as const;

function renderComponent(component: ReactNode): RenderedComponent {
  const container = document.createElement("div");
  document.body.appendChild(container);

  const root = createRoot(container);

  act(() => {
    root.render(component);
  });

  return {
    container,
    unmount: () => {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

function getInputByLabel(container: ParentNode, labelText: string) {
  const label = Array.from(container.querySelectorAll("label")).find(
    (item) => item.textContent?.trim() === labelText,
  );

  if (!label) {
    throw new Error(`Label bulunamadi: ${labelText}`);
  }

  const input = container.querySelector<HTMLInputElement>(`#${label.htmlFor}`);

  if (!input) {
    throw new Error(`Input bulunamadi: ${labelText}`);
  }

  return input;
}

function getButton(container: ParentNode, text: string) {
  const button = Array.from(container.querySelectorAll("button")).find((item) =>
    item.textContent?.includes(text),
  );

  if (!button) {
    throw new Error(`Buton bulunamadi: ${text}`);
  }

  return button as HTMLButtonElement;
}

async function flushAsyncWork() {
  await act(async () => {
    await Promise.resolve();
  });
}

async function click(element: HTMLElement) {
  await act(async () => {
    element.click();
  });
}

async function fillInput(input: HTMLInputElement, value: string) {
  await act(async () => {
    const valueSetter = Object.getOwnPropertyDescriptor(
      HTMLInputElement.prototype,
      "value",
    )?.set;

    valueSetter?.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

describe("calculator empty-state behavior", () => {
  let originalFetch: typeof fetch;

  beforeEach(() => {
    vi.useFakeTimers();
    (globalThis as TestGlobal).IS_REACT_ACT_ENVIRONMENT = true;
    globalThis.ResizeObserver = ResizeObserverMock as typeof ResizeObserver;
    originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn(async () =>
      new Response(JSON.stringify(loanMarketSnapshot), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    ) as typeof fetch;
  });

  afterEach(() => {
    vi.useRealTimers();
    globalThis.fetch = originalFetch;
    globalThis.ResizeObserver = undefined as unknown as typeof ResizeObserver;
    document.body.innerHTML = "";
  });

  test("growth calculator starts empty, validates missing fields, then loads and clears", async () => {
    const view = renderComponent(<GrowthCalculator kind="compound" />);
    const initialAmountInput = getInputByLabel(view.container, "Başlangıç birikimi");
    const monthlyContributionInput = getInputByLabel(view.container, "Her ay eklenecek tutar");
    const annualRateInput = getInputByLabel(view.container, "Yıllık getiri oranı");
    const yearsInput = getInputByLabel(view.container, "Plan süresi");

    expect(initialAmountInput.value).toBe("");
    expect(monthlyContributionInput.value).toBe("");
    expect(annualRateInput.value).toBe("");
    expect(yearsInput.value).toBe("");
    expect(initialAmountInput.placeholder).toBe("25.000 TL");
    expect(monthlyContributionInput.placeholder).toBe("5.000 TL");
    expect(annualRateInput.placeholder).toBe("30");
    expect(yearsInput.placeholder).toBe("5");
    expect(view.container.textContent).toContain("Henüz hesaplama yapılmadı");
    expect(view.container.textContent).not.toContain("Plan sonu toplam");

    await click(getButton(view.container, "Hesapla"));

    expect(view.container.textContent).toContain("Geçerli bir tutar girin.");
    expect(view.container.textContent).toContain("Henüz hesaplama yapılmadı");
    expect(view.container.textContent).not.toContain("Hesaplanıyor...");

    await fillInput(initialAmountInput, "25000");
    await fillInput(monthlyContributionInput, "5000");
    await fillInput(annualRateInput, "30");
    await fillInput(yearsInput, "5");

    await click(getButton(view.container, "Hesapla"));
    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });

    const loadingButton = getButton(view.container, "Hesaplanıyor...");
    expect(loadingButton.disabled).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(299);
      await Promise.resolve();
    });

    expect(view.container.textContent).toContain("Plan sonu toplam");
    expect(view.container.textContent).not.toContain("Henüz hesaplama yapılmadı");

    await click(getButton(view.container, "Sıfırla"));
    await flushAsyncWork();

    expect(getInputByLabel(view.container, "Başlangıç birikimi").value).toBe("");
    expect(getInputByLabel(view.container, "Her ay eklenecek tutar").value).toBe("");
    expect(getInputByLabel(view.container, "Yıllık getiri oranı").value).toBe("");
    expect(getInputByLabel(view.container, "Plan süresi").value).toBe("");
    expect(view.container.textContent).toContain("Henüz hesaplama yapılmadı");

    view.unmount();
  });

  test("loan calculator keeps reference fields empty until explicitly applied, then loads and clears", async () => {
    const view = renderComponent(<LoanCalculator />);
    await flushAsyncWork();

    const principalInput = getInputByLabel(view.container, "Kredi tutarı");
    const monthsInput = getInputByLabel(view.container, "Vade");
    const monthlyRateInput = getInputByLabel(view.container, "Aylık faiz oranı");
    const extraFeesInput = getInputByLabel(view.container, "Masraf / sigorta");

    expect(monthlyRateInput.value).toBe("");
    expect(extraFeesInput.value).toBe("");
    expect(view.container.textContent).toContain("Henüz hesaplama yapılmadı");

    await click(getButton(view.container, "Taşıt Kredisi"));

    expect(monthlyRateInput.value).toBe("");
    expect(extraFeesInput.value).toBe("");

    await click(getButton(view.container, "Güncel oranı kullan"));

    expect(monthlyRateInput.value).not.toBe("");
    expect(extraFeesInput.value).not.toBe("");

    await fillInput(principalInput, "250000");
    await fillInput(monthsInput, "36");

    await click(getButton(view.container, "Hesapla"));
    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });

    const loadingButton = getButton(view.container, "Hesaplanıyor...");
    expect(loadingButton.disabled).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(299);
      await Promise.resolve();
    });

    expect(view.container.textContent).toContain("Nominal aylık taksit");
    expect(view.container.textContent).not.toContain("Henüz hesaplama yapılmadı");

    await click(getButton(view.container, "Sıfırla"));
    await flushAsyncWork();

    expect(getInputByLabel(view.container, "Kredi tutarı").value).toBe("");
    expect(getInputByLabel(view.container, "Vade").value).toBe("");
    expect(getInputByLabel(view.container, "Aylık faiz oranı").value).toBe("");
    expect(getInputByLabel(view.container, "Masraf / sigorta").value).toBe("");
    expect(view.container.textContent).toContain("Henüz hesaplama yapılmadı");

    view.unmount();
  });
});
