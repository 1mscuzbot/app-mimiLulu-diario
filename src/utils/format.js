import { DAY_NAMES_SHORT } from "./constants";

export function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dy = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dy}`;
}

export function todayStr() {
  return toDateStr(new Date());
}

export function yesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return toDateStr(d);
}

export function daysAgoStr(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return toDateStr(d);
}

export function formatDate(str) {
  const [y, m, d] = str.split("-");
  return `${d}/${m}`;
}

export function formatShortDate(str) {
  const [y, m, d] = str.split("-");
  const date = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
  return `${DAY_NAMES_SHORT[date.getDay()]}, ${d}/${m}`;
}

export function formatDateObj(d) {
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
}

export function getRecentDates(daysBack) {
  const dates = [];
  const today = new Date();
  for (let i = 0; i <= daysBack; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const str = toDateStr(d);
    const dayName =
      i === 0 ? "Hoje" : i === 1 ? "Ontem" : DAY_NAMES_SHORT[d.getDay()];
    dates.push({ str, label: `${dayName}, ${formatDate(str)}` });
  }
  return dates;
}

export function getWeekLabel() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 6);

  const s = `${monday.getDate()}/${monday.getMonth() + 1}`;
  const e = `${saturday.getDate()}/${saturday.getMonth() + 1}`;
  return `${s} — ${e}`;
}

export function getLastWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const lastSunday = new Date(now);
  lastSunday.setDate(now.getDate() - dayOfWeek - 7);
  lastSunday.setHours(0, 0, 0, 0);
  const lastSaturday = new Date(lastSunday);
  lastSaturday.setDate(lastSunday.getDate() + 6);
  return {
    start: toDateStr(lastSunday),
    end: toDateStr(lastSaturday),
    label: `${formatDateObj(lastSunday)} — ${formatDateObj(lastSaturday)}`,
  };
}

export function groupByDate(expenses) {
  const map = {};
  expenses.forEach((e) => {
    const key = e.date || "";
    if (!map[key]) map[key] = [];
    map[key].push(e);
  });
  return Object.entries(map)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({ date: formatShortDate(date), items }));
}

export function getBarColor(percent) {
  if (percent >= 100) return "#D32F2F";
  if (percent >= 80) return "#FFA000";
  return "#4CAF50";
}
