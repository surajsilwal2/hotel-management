/**
 * Bikram Sambat (BS) ↔ Gregorian (AD) Date Converter
 * 
 * Nepal uses the Bikram Sambat calendar for:
 * - IRD/VAT tax filings (fiscal year: Shrawan to Ashadh)
 * - Government documents
 * - Staff salary records
 * - Internal accounting
 * 
 * Gregorian year is approximately BS year - 56 or 57 depending on month.
 */

// BS month names
export const BS_MONTHS = [
  "Baisakh", "Jestha", "Ashadh", "Shrawan",
  "Bhadra", "Ashwin", "Kartik", "Mangsir",
  "Poush", "Magh", "Falgun", "Chaitra",
];

export const BS_MONTHS_NP = [
  "बैशाख", "जेठ", "असार", "श्रावण",
  "भाद्र", "आश्विन", "कार्तिक", "मंसिर",
  "पुष", "माघ", "फाल्गुन", "चैत्र",
];

// Days in each BS month per year (1970–2090 BS)
// Source: Government of Nepal calendar data
const BS_MONTH_DAYS: Record<number, number[]> = {
  2070: [31,32,31,32,31,30,30,30,29,29,30,30],
  2071: [31,31,32,31,31,31,30,29,30,29,30,30],
  2072: [31,32,31,32,31,30,30,30,29,30,30,30],
  2073: [31,31,31,32,31,30,30,30,29,29,30,30],
  2074: [31,32,31,31,31,30,30,30,29,30,29,31],
  2075: [31,32,31,32,30,31,30,29,30,29,30,30],
  2076: [31,31,32,31,31,30,30,30,29,29,30,30],
  2077: [31,32,31,32,31,30,30,29,30,29,30,30],
  2078: [31,31,32,31,31,31,30,29,30,29,30,30],
  2079: [31,31,32,31,31,31,30,29,30,29,30,30],
  2080: [31,32,31,32,30,31,30,29,30,29,30,30],
  2081: [31,31,32,31,31,30,30,30,29,29,30,30],
  2082: [31,32,31,32,31,30,30,29,30,29,30,30],
  2083: [31,31,32,31,31,31,30,29,30,29,30,30],
  2084: [31,32,31,31,31,30,30,30,29,29,30,30],
  2085: [31,32,31,32,31,30,30,29,30,29,30,30],
  2086: [31,31,32,31,31,30,30,30,29,29,30,30],
  2087: [31,32,31,32,31,30,30,29,30,29,30,30],
};

// BS epoch: 1 Baisakh 1970 BS = 13 April 1913 AD
const BS_EPOCH_YEAR  = 1970;
const AD_EPOCH_YEAR  = 1913;
const AD_EPOCH_MONTH = 4; // April (1-indexed)
const AD_EPOCH_DAY   = 13;

export interface BSDate {
  year: number;
  month: number; // 1-indexed
  day: number;
}

/**
 * Convert Gregorian (AD) date to Bikram Sambat (BS)
 */
export function adToBS(date: Date): BSDate {
  const adYear  = date.getFullYear();
  const adMonth = date.getMonth() + 1;
  const adDay   = date.getDate();

  // Total AD days from epoch
  let totalDays = 0;
  for (let y = AD_EPOCH_YEAR; y < adYear; y++) {
    totalDays += isLeapYear(y) ? 366 : 365;
  }
  const adMonthDays = [0,31,28,31,30,31,30,31,31,30,31,30,31];
  if (isLeapYear(adYear)) adMonthDays[2] = 29;
  for (let m = 1; m < adMonth; m++) totalDays += adMonthDays[m];
  totalDays += adDay - AD_EPOCH_DAY;

  // Walk through BS calendar
  let bsYear  = BS_EPOCH_YEAR;
  let bsMonth = 1;
  let bsDay   = 1;

  while (totalDays > 0) {
    const days = getDaysInBSMonth(bsYear, bsMonth);
    if (totalDays < days) {
      bsDay += totalDays;
      totalDays = 0;
    } else {
      totalDays -= days;
      bsMonth++;
      if (bsMonth > 12) { bsMonth = 1; bsYear++; }
    }
  }

  return { year: bsYear, month: bsMonth, day: bsDay };
}

/**
 * Format a BSDate as a readable string
 * e.g. "15 Baisakh 2082" or "15 बैशाख 2082"
 */
export function formatBS(bsDate: BSDate, lang: "en" | "np" = "en"): string {
  const months = lang === "np" ? BS_MONTHS_NP : BS_MONTHS;
  return `${bsDate.day} ${months[bsDate.month - 1]} ${bsDate.year}`;
}

/**
 * Format a BSDate as short: "2082/01/15"
 */
export function formatBSShort(bsDate: BSDate): string {
  return `${bsDate.year}/${String(bsDate.month).padStart(2,"0")}/${String(bsDate.day).padStart(2,"0")}`;
}

/**
 * Get Nepal fiscal year string for a given AD date
 * Nepal fiscal year runs Shrawan (mid-July) to Ashadh (mid-July)
 * e.g. "FY 2081/82"
 */
export function getNepalisFiscalYear(date: Date): string {
  const bs = adToBS(date);
  // Fiscal year starts Shrawan (month 4)
  if (bs.month >= 4) {
    return `FY ${bs.year}/${String(bs.year + 1).slice(-2)}`;
  } else {
    return `FY ${bs.year - 1}/${String(bs.year).slice(-2)}`;
  }
}

/**
 * Convert AD Date to a display string showing both AD and BS
 * e.g. "March 15, 2026 (1 Chaitra 2082 BS)"
 */
export function formatDualDate(date: Date): string {
  const adStr = date.toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });
  const bs    = adToBS(date);
  const bsStr = formatBS(bs);
  return `${adStr}  (${bsStr} BS)`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function getDaysInBSMonth(year: number, month: number): number {
  if (BS_MONTH_DAYS[year]) return BS_MONTH_DAYS[year][month - 1];
  // Fallback average for years outside table
  return [31,32,31,32,31,30,30,30,29,29,30,30][month - 1];
}
