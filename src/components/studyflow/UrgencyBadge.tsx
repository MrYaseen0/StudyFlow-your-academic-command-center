"use client";

import { cn } from "@/lib/utils";
import { URGENCY_META, getUrgency } from "@/lib/urgency";
import type { Status } from "@/lib/types";

interface UrgencyBadgeProps {
  dueDate: string;
  status: Status;
  now?: Date;
  showLabel?: boolean;
  className?: string;
}

export function UrgencyBadge({ dueDate, status, now, showLabel = true, className }: UrgencyBadgeProps) {
  const level = getUrgency(dueDate, status, now);
  const meta = URGENCY_META[level];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill px-2 py-0.5 text-[11px] font-medium",
        className,
      )}
      style={{ backgroundColor: meta.bg, color: meta.text }}
    >
      <span
        className="inline-block rounded-full"
        style={{ backgroundColor: meta.dot, width: 6, height: 6 }}
      />
      {showLabel && meta.label}
    </span>
  );
}
