const TIME_ZONE = "Asia/Tokyo";

/** JST基準の今日の日付を YYYY-MM-DD 形式で返す */
export function todayJST(): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: TIME_ZONE }).format(new Date());
}

/** JST基準の現在時刻を HH:MM 形式で返す */
export function nowTimeJST(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}:${m}`;
}

export function addDaysToDateString(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/** 今日を含む週（月曜始まり〜日曜終わり）の範囲をJST基準で返す */
export function currentWeekRangeJST(): { start: string; end: string } {
  const today = todayJST();
  const [y, m, d] = today.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=日,...,6=土
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  const start = addDaysToDateString(today, diffToMonday);
  const end = addDaysToDateString(start, 6);
  return { start, end };
}

/** 今週を基準に offsetWeeks 週分ずらした週（月曜〜日曜）の範囲をJST基準で返す */
export function weekRangeJST(offsetWeeks: number): { start: string; end: string } {
  const { start } = currentWeekRangeJST();
  const shiftedStart = addDaysToDateString(start, offsetWeeks * 7);
  const end = addDaysToDateString(shiftedStart, 6);
  return { start: shiftedStart, end };
}

const WEEKDAY_KANJI = ["日", "月", "火", "水", "木", "金", "土"];

/** "YYYY-MM-DD" を「8月31日（月）」の形式に整形する */
export function formatJapaneseDate(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${m}月${d}日（${WEEKDAY_KANJI[dow]}）`;
}

/** 指定した年月（monthは0始まり）のカレンダーグリッドを週単位の配列で返す */
export function buildMonthGrid(year: number, month: number): (string | null)[][] {
  const startOffset = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const mm = String(month + 1).padStart(2, "0");
    const dd = String(d).padStart(2, "0");
    cells.push(`${year}-${mm}-${dd}`);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  return weeks;
}
