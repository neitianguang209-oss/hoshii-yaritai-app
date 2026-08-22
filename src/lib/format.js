// 週の区切りは日曜始まり。今週の範囲 [開始, 終了) を返す。
export function currentWeekRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  start.setDate(start.getDate() - start.getDay()); // 直近の日曜 0:00
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end };
}

export function isWithinCurrentWeek(isoString, now = new Date()) {
  if (!isoString) return false;
  const { start, end } = currentWeekRange(now);
  const t = new Date(isoString);
  return t >= start && t < end;
}

export function formatBudget(amount) {
  if (amount === null || amount === undefined) return "";
  return `¥${Number(amount).toLocaleString("ja-JP")}`;
}
