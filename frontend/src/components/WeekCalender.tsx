import React from 'react';
import { Slot } from '../api/api';

type Props = {
  slots: Slot[];
  selected?: string;
  onSelect: (iso: string) => void;
  days?: number;           // default 7
  intervalMinutes?: number; // grid density; visual only
};

function toLocal(iso: string) { return new Date(iso); }
function ymd(d: Date) { return d.toISOString().slice(0, 10); }

function groupByDay(slots: Slot[]) {
  const map = new Map<string, Slot[]>();
  for (const s of slots) {
    const key = ymd(toLocal(s.start));
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(s);
  }
  for (const [k, arr] of map) arr.sort((a, b) => +toLocal(a.start) - +toLocal(b.start));
  return map;
}

export default function WeekCalendar({ slots, selected, onSelect, days = 7, intervalMinutes = 30 }: Props) {
  const start = new Date(); start.setHours(0,0,0,0);
  const dayKeys = Array.from({ length: days }, (_, i) => {
    const d = new Date(start); d.setDate(d.getDate() + i);
    return ymd(d);
  });
  const slotsByDay = groupByDay(slots);

  const startHour = 8, endHour = 18;
  const times: string[] = [];
  for (let h = startHour; h <= endHour; h++) times.push(`${String(h).padStart(2, '0')}:00`);

  return (
    <div className="vc-wrap">
      <div className="vc-head">
        <div className="vc-cell vc-timehead" />
        {dayKeys.map((k, i) => {
          const d = new Date(k);
          const label = d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
          return <div key={i} className="vc-cell vc-dayhead">{label}</div>;
        })}
      </div>

      <div className="vc-grid">
        <div className="vc-col vc-times">
          {times.map((t, i) => <div key={i} className="vc-time">{t}</div>)}
        </div>

        {dayKeys.map((k, colIdx) => {
          const daySlots = slotsByDay.get(k) ?? [];
          return (
            <div key={colIdx} className="vc-col vc-daycol" role="grid">
              {times.map((_, i) => <div key={i} className="vc-row" />)}
              {daySlots.map((s, i) => {
                const d = toLocal(s.start);
                const label = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                const isSel = selected === s.start;
                return (
                  <button
                    key={i}
                    className={`vc-slot ${isSel ? 'is-selected' : ''}`}
                    onClick={() => onSelect(s.start)}
                    aria-pressed={isSel}
                    title={label}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      <style>{`
        .vc-wrap { border:1px solid #e5e7eb; border-radius:12px; overflow:hidden; }
        .vc-head { display:grid; grid-template-columns: 100px repeat(${days}, 1fr); background:#f9fafb; border-bottom:1px solid #e5e7eb; }
        .vc-cell { padding:10px; font-weight:600; font-size:14px; }
        .vc-timehead { color:#6b7280; }
        .vc-dayhead { text-align:center; }
        .vc-grid { display:grid; grid-template-columns: 100px repeat(${days}, 1fr); }
        .vc-col { display:flex; flex-direction:column; }
        .vc-times .vc-time { height:40px; font-size:12px; color:#6b7280; padding:8px; border-bottom:1px dashed #f0f0f0; }
        .vc-daycol .vc-row { height:40px; border-bottom:1px dashed #f6f7f8; }
        .vc-slot {
          position:relative; margin:4px 8px; padding:6px 10px;
          border:1px solid hsl(var(--brand, 212 87% 45%)/.2);
          background: hsl(var(--brand, 212 87% 45%)/.1);
          border-radius:999px; font-size:12px; line-height:1; text-align:center;
          transition:transform .05s ease;
        }
        .vc-slot:hover { transform:translateY(-1px); }
        .vc-slot.is-selected { background:hsl(var(--brand, 212 87% 45%)); color:#fff; border-color:transparent; }
      `}</style>
    </div>
  );
}
