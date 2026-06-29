export type BondIssuanceKind = "new" | "reopen";

export type BondIssuanceEvent = {
  id: string;
  kind: BondIssuanceKind;
  title: string;
  tenorYears: number;
  sourceDescription: string;
  announcementDate: string;
  openBookDate: string;
  closingBookDate: string;
  settlementDate: string;
  maturityDate: string;
};

export type IssuanceAlertLevel = "info" | "warning" | "urgent" | "settlement";

export type IssuanceAlert = {
  level: IssuanceAlertLevel;
  title: string;
  message: string;
};

export const BNR_ISSUANCE_CALENDAR_SOURCE = {
  label: "BNR Treasury Bond Issuance Calendar for FY 2026/2027",
  fileName: "Treasury_Bond_Issuance_calendar_2026-2027_JYn1TWc.pdf",
  extractedAt: "2026-06-24",
};

export const BNR_TREASURY_BOND_ISSUANCE_CALENDAR: BondIssuanceEvent[] = [
  {
    id: "2026-07-7y-new",
    kind: "new",
    title: "New 7-year bond",
    tenorYears: 7,
    sourceDescription: "New 7-year bond",
    announcementDate: "2026-07-03",
    openBookDate: "2026-07-13",
    closingBookDate: "2026-07-15",
    settlementDate: "2026-07-17",
    maturityDate: "2033-07-08",
  },
  {
    id: "2026-08-10y-new",
    kind: "new",
    title: "New 10-year bond",
    tenorYears: 10,
    sourceDescription: "New 10 Year",
    announcementDate: "2026-08-03",
    openBookDate: "2026-08-10",
    closingBookDate: "2026-08-12",
    settlementDate: "2026-08-14",
    maturityDate: "2036-08-01",
  },
  {
    id: "2026-09-15y-new",
    kind: "new",
    title: "New 15-year bond",
    tenorYears: 15,
    sourceDescription: "New 15-year bond",
    announcementDate: "2026-09-01",
    openBookDate: "2026-09-14",
    closingBookDate: "2026-09-16",
    settlementDate: "2026-09-18",
    maturityDate: "2041-08-30",
  },
  {
    id: "2026-10-20y-new",
    kind: "new",
    title: "New 20-year bond",
    tenorYears: 20,
    sourceDescription: "New 20 Year Bond",
    announcementDate: "2026-10-01",
    openBookDate: "2026-10-19",
    closingBookDate: "2026-10-21",
    settlementDate: "2026-10-23",
    maturityDate: "2046-09-28",
  },
  {
    id: "2026-11-5y-new",
    kind: "new",
    title: "New 5-year bond",
    tenorYears: 5,
    sourceDescription: "New 5 Year Bond",
    announcementDate: "2026-11-02",
    openBookDate: "2026-11-09",
    closingBookDate: "2026-11-11",
    settlementDate: "2026-11-13",
    maturityDate: "2031-11-07",
  },
  {
    id: "2026-12-7y-reopen",
    kind: "reopen",
    title: "Reopen July 2026 7-year bond",
    tenorYears: 7,
    sourceDescription: "Reopen 7 Year Bond issued in July 2026",
    announcementDate: "2026-12-01",
    openBookDate: "2026-12-14",
    closingBookDate: "2026-12-16",
    settlementDate: "2026-12-18",
    maturityDate: "2033-07-08",
  },
  {
    id: "2027-01-10y-reopen",
    kind: "reopen",
    title: "Reopen August 2026 10-year bond",
    tenorYears: 10,
    sourceDescription: "Reopen 10 Year Bond issued in August 2026",
    announcementDate: "2027-01-05",
    openBookDate: "2027-01-11",
    closingBookDate: "2027-01-13",
    settlementDate: "2027-01-15",
    maturityDate: "2036-08-01",
  },
  {
    id: "2027-02-25y-new",
    kind: "new",
    title: "New 25-year bond",
    tenorYears: 25,
    sourceDescription: "New 25 Year Bond",
    announcementDate: "2027-02-02",
    openBookDate: "2027-02-08",
    closingBookDate: "2027-02-10",
    settlementDate: "2027-02-12",
    maturityDate: "2052-01-12",
  },
  {
    id: "2027-03-15y-reopen",
    kind: "reopen",
    title: "Reopen September 2026 15-year bond",
    tenorYears: 15,
    sourceDescription: "Reopen 15-year bond issued issued in Sept. 2026",
    announcementDate: "2027-03-01",
    openBookDate: "2027-03-15",
    closingBookDate: "2027-03-17",
    settlementDate: "2027-03-19",
    maturityDate: "2041-08-30",
  },
  {
    id: "2027-04-10y-new",
    kind: "new",
    title: "New 10-year bond",
    tenorYears: 10,
    sourceDescription: "New 10 Year Bond",
    announcementDate: "2027-04-01",
    openBookDate: "2027-04-19",
    closingBookDate: "2027-04-21",
    settlementDate: "2027-04-23",
    maturityDate: "2037-04-10",
  },
  {
    id: "2027-05-20y-reopen",
    kind: "reopen",
    title: "Reopen October 2026 20-year bond",
    tenorYears: 20,
    sourceDescription: "Reopen 20 Year Bond issued in October 2026",
    announcementDate: "2027-05-04",
    openBookDate: "2027-05-10",
    closingBookDate: "2027-05-12",
    settlementDate: "2027-05-14",
    maturityDate: "2046-09-28",
  },
  {
    id: "2027-06-7y-reopen",
    kind: "reopen",
    title: "Reopen July 2026 7-year bond",
    tenorYears: 7,
    sourceDescription: "Reopen 7 Year Bond issued in July 2026",
    announcementDate: "2027-06-01",
    openBookDate: "2027-06-14",
    closingBookDate: "2027-06-16",
    settlementDate: "2027-06-18",
    maturityDate: "2033-07-08",
  },
];

function startOfUtcDay(date: Date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function daysBetweenDates(from: Date, toIsoDate: string) {
  return Math.ceil(
    (Date.parse(`${toIsoDate}T00:00:00.000Z`) - startOfUtcDay(from)) /
      86_400_000,
  );
}

export function formatCalendarDate(isoDate: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00.000Z`));
}

export function getIssuanceStatus(
  event: BondIssuanceEvent,
  today = new Date(),
) {
  const openIn = daysBetweenDates(today, event.openBookDate);
  const closeIn = daysBetweenDates(today, event.closingBookDate);
  const settleIn = daysBetweenDates(today, event.settlementDate);

  if (openIn > 0) return { label: `Opens in ${openIn}d`, tone: "upcoming" };
  if (closeIn >= 0) return { label: "Book open", tone: "open" };
  if (settleIn >= 0) return { label: "Settling", tone: "settling" };
  return { label: "Completed", tone: "completed" };
}

export function getIssuanceAlert(
  event: BondIssuanceEvent,
  today = new Date(),
): IssuanceAlert | null {
  const openIn = daysBetweenDates(today, event.openBookDate);
  const closeIn = daysBetweenDates(today, event.closingBookDate);
  const settleIn = daysBetweenDates(today, event.settlementDate);

  if (openIn === 0) {
    return {
      level: "urgent",
      title: "Book opens today",
      message:
        "This is the day to confirm the prospectus, coupon terms, available cash, and send the bid instruction to your broker.",
    };
  }

  if (openIn > 0 && openIn <= 3) {
    return {
      level: "warning",
      title: `Book opens in ${openIn} day${openIn === 1 ? "" : "s"}`,
      message:
        "Prepare cash, decide the bid amount, and keep the broker order details ready before the book opens.",
    };
  }

  if (openIn < 0 && closeIn > 0) {
    return {
      level: "info",
      title: "Book is open",
      message:
        "The auction window is open. Submit or confirm your bid before the closing book date.",
    };
  }

  if (closeIn === 0) {
    return {
      level: "urgent",
      title: "Book closes today",
      message:
        "This is the final day in the published window. Confirm your bid status with the broker before close.",
    };
  }

  if (closeIn < 0 && settleIn > 0) {
    return {
      level: "settlement",
      title: "Awaiting settlement",
      message:
        "The book is closed. Watch for allocation confirmation and settlement cash movement.",
    };
  }

  if (settleIn === 0) {
    return {
      level: "settlement",
      title: "Settlement today",
      message:
        "Check the final allocation, cash debit, and update your portfolio records after broker confirmation.",
    };
  }

  return null;
}

export function getNextIssuanceEvent(
  events = BNR_TREASURY_BOND_ISSUANCE_CALENDAR,
  today = new Date(),
) {
  const todayMs = startOfUtcDay(today);
  return events.find(
    (event) => Date.parse(`${event.closingBookDate}T00:00:00.000Z`) >= todayMs,
  );
}
