// To-do 8.11: a calendar file (.ics) made on the phone from her plan's open steps. Nothing is sent anywhere; the
// family saves it and their calendar app reads it. "This week" steps get a reminder in 7 days, "this month" in 30,
// and a plan review in 90 days (our suggestion, not an official step).
import type { PlanStep } from "./steps";

const pad = (n: number) => String(n).padStart(2, "0");
const day = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
// RFC 5545 text: escape backslashes, semicolons, commas and newlines; fold lines longer than 75 octets.
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
const fold = (line: string) => line.match(/.{1,74}/g)!.join("\r\n ");

export interface Reminder { date: Date; title: string; detail: string }

export function reminders(steps: PlanStep[], done: string[], today: Date): Reminder[] {
  const open = steps.filter((st) => !done.includes(st.id) && (st.timing === "week" || st.timing === "month"));
  return [
    ...open.map((st) => ({
      date: addDays(today, st.timing === "week" ? 7 : 30),
      title: `Care plan: ${st.label}`,
      detail: st.unlocks ? `${st.text} ${st.unlocks}` : st.text,
    })),
    { date: addDays(today, 90), title: "Care plan: review it", detail: "Check if her needs have changed, and update the plan." },
  ];
}

export function remindersIcs(list: Reminder[], link: string, now: Date): string {
  const stamp = `${day(now)}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
  const events = list.flatMap((r, i) => [
    "BEGIN:VEVENT",
    `UID:${day(now)}-${i}-${r.title.replace(/\W+/g, "-").toLowerCase()}@care-navigator`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${day(r.date)}`,
    `DTEND;VALUE=DATE:${day(addDays(r.date, 1))}`,
    fold(`SUMMARY:${esc(r.title)}`),
    fold(`DESCRIPTION:${esc(`${r.detail}\n\nHer plan: ${link}`)}`),
    "END:VEVENT",
  ]);
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Care Navigator//EN", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR", ""].join("\r\n");
}
