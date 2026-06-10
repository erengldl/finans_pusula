export function formatCurrency(value: number, maximumFractionDigits = 0) {
  if (!Number.isFinite(value)) {
    return "0 TL";
  }

  return `${new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits,
    minimumFractionDigits: maximumFractionDigits,
  }).format(value)} TL`;
}

export function formatCompactCurrency(value: number) {
  if (!Number.isFinite(value)) {
    return "0 TL";
  }

  return `${new Intl.NumberFormat("tr-TR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)} TL`;
}

export function formatPercent(value: number) {
  if (!Number.isFinite(value)) {
    return "%0";
  }

  return `%${new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 2,
  }).format(value)}`;
}

export function formatNumber(value: number, maximumFractionDigits = 0) {
  if (!Number.isFinite(value)) {
    return "0";
  }

  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits,
  }).format(value);
}

export function formatSignedCurrency(value: number, maximumFractionDigits = 0) {
  if (!Number.isFinite(value) || value === 0) {
    return formatCurrency(0, maximumFractionDigits);
  }

  const sign = value > 0 ? "+" : "-";

  return `${sign}${formatCurrency(Math.abs(value), maximumFractionDigits)}`;
}

export function formatDateLabel(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tarih bilinmiyor";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function formatDateTimeLabel(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Tarih bilinmiyor";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDurationFromMonths(months: number | null) {
  if (months === null) {
    return "100 yıl içinde ulaşılamıyor";
  }

  if (months <= 0) {
    return "0 ay";
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths} ay`;
  }

  if (remainingMonths === 0) {
    return `${years} yıl`;
  }

  return `${years} yıl ${remainingMonths} ay`;
}
