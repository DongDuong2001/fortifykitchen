// `new Date().toISOString().split("T")[0]` computes the UTC calendar date,
// not the user's local one — for Vietnam (UTC+7) that's wrong for roughly
// the first 7 hours of every local day (it shows yesterday). This builds
// the date string from local Y/M/D getters instead.
function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Whether a date (string or Date) falls on today's local calendar day —
// backs the Orders tab's "Sắp tới" (upcoming) filter mode.
function isToday(date: string | Date): boolean {
  return getLocalDateString(new Date(date)) === getLocalDateString();
}

// Single shared grouping routine used everywhere a list of dated entries
// (orders, subscription-generated deliveries, or the two merged) needs to
// be bucketed by day / ISO week / month. Having exactly one implementation
// — computed client-side, in the browser's local timezone — is what keeps
// every list view (Orders, Orders from Subscriptions, Deliveries "Tất cả",
// Deliveries "Sắp tới") agreeing on where one day ends and the next
// begins, instead of some views grouping server-side and others
// client-side with slightly different date math.
function groupEntriesByDate<T>(
  entries: T[],
  getDate: (entry: T) => string | Date,
  groupBy: "day" | "week" | "month",
): { key: string; entries: T[] }[] {
  const map = new Map<string, T[]>();
  for (const entry of entries) {
    const d = new Date(getDate(entry));
    let key: string;
    if (groupBy === "day") {
      key = getLocalDateString(d);
    } else if (groupBy === "month") {
      key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    } else {
      // ISO-ish week key: year + week number (Mon-start)
      const dayNum = (d.getDay() + 6) % 7;
      const thursday = new Date(d);
      thursday.setDate(d.getDate() - dayNum + 3);
      const firstThursday = new Date(thursday.getFullYear(), 0, 4);
      const weekNum =
        1 + Math.round(((thursday.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getDay() + 6) % 7)) / 7);
      key = `${thursday.getFullYear()}-W${String(weekNum).padStart(2, "0")}`;
    }
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(entry);
  }
  return Array.from(map.entries())
    .map(([key, groupEntries]) => ({ key, entries: groupEntries }))
    .sort((a, b) => a.key.localeCompare(b.key)); // oldest first
}

// Formats a Deliveries "Sắp tới" group key (shaped differently depending on
// the selected granularity — "YYYY-MM-DD" for day, "YYYY-Www" for week,
// "YYYY-MM" for month) into a readable Vietnamese heading, so the upcoming
// view reads the same way the "Tất cả" tab's day headings do rather than
// showing the raw grouping key.
function formatGroupKeyLabel(key: string, groupBy: "day" | "week" | "month"): string {
  if (groupBy === "day") {
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  if (groupBy === "month") {
    const [y, m] = key.split("-").map(Number);
    return new Date(y, m - 1, 1).toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
  }
  // week key looks like "2026-W27"
  const [y, w] = key.split("-W");
  return `Tuần ${w} · ${y}`;
}

export { getLocalDateString, isToday, groupEntriesByDate, formatGroupKeyLabel };
