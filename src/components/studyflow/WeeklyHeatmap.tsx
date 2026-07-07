"use client";

import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { isSameDay } from "@/lib/urgency";
import { useState } from "react";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function WeeklyHeatmap() {
  const tasks = useStore((s) => s.tasks);
  const setView = useStore((s) => s.setView);
  const [hovered, setHovered] = useState<number | null>(null);

  // Build next 7 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Compute load per day
  const dayData = days.map((d) => {
    const dayTasks = tasks.filter(
      (t) => t.status !== "done" && isSameDay(new Date(t.dueDate), d),
    );
    const hours = dayTasks.reduce((s, t) => s + t.estimatedHours, 0);
    return { date: d, tasks: dayTasks, hours, count: dayTasks.length };
  });

  const maxLoad = Math.max(1, ...dayData.map((d) => d.hours));

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5">
        {dayData.map((d, i) => {
          const intensity = d.hours / maxLoad;
          const isToday = i === 0;
          return (
            <motion.div
              key={i}
              onHoverStart={() => setHovered(i)}
              onHoverEnd={() => setHovered(null)}
              onClick={() => setView("planner")}
              whileHover={{ scale: 1.04 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="relative rounded-xl p-2 cursor-pointer overflow-hidden"
              style={{
                backgroundColor: d.count > 0 ? `rgba(232, 160, 172, ${0.12 + intensity * 0.55})` : "var(--color-cream-elevated)",
                border: isToday ? "1.5px solid var(--color-blush-deep)" : "1px solid var(--color-border-soft)",
                minHeight: 78,
              }}
            >
              <div className="flex flex-col items-center text-center">
                <span className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                  {i === 0 ? "Today" : DAY_LABELS[d.date.getDay()]}
                </span>
                <span className="text-base font-semibold nums text-ink-primary" style={{ fontFamily: "var(--font-serif)" }}>
                  {d.date.getDate()}
                </span>
                {d.count > 0 ? (
                  <span className="mt-1 text-[10px] font-semibold nums px-1.5 py-0.5 rounded-pill bg-white/70" style={{ color: "var(--color-blush-deep)" }}>
                    {d.count} · {d.hours}h
                  </span>
                ) : (
                  <span className="mt-1 text-[10px] text-ink-muted">—</span>
                )}
              </div>

              {/* tooltip */}
              {hovered === i && d.count > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute left-1/2 -translate-x-1/2 -top-2 -translate-y-full z-20 w-44 rounded-xl bg-white border border-border-soft shadow-warm-lg p-2 pointer-events-none"
                >
                  <p className="text-[11px] font-semibold text-ink-primary mb-1">
                    {d.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
                  </p>
                  <p className="text-[10px] text-ink-secondary mb-1">
                    {d.count} task{d.count > 1 ? "s" : ""} · {d.hours}h estimated
                  </p>
                  <ul className="space-y-0.5 max-h-20 overflow-y-auto scrollbar-warm">
                    {d.tasks.slice(0, 4).map((t) => (
                      <li key={t.id} className="text-[10px] text-ink-secondary truncate">• {t.title}</li>
                    ))}
                    {d.tasks.length > 4 && (
                      <li className="text-[10px] text-ink-muted">+{d.tasks.length - 4} more</li>
                    )}
                  </ul>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] text-ink-muted">
        <span>Workload density</span>
        <div className="flex items-center gap-1">
          <span>light</span>
          <div className="flex gap-0.5">
            {[0.12, 0.3, 0.5, 0.7].map((o) => (
              <span key={o} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(232, 160, 172, ${o})` }} />
            ))}
          </div>
          <span>heavy</span>
        </div>
      </div>
    </div>
  );
}
