"use client";

import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

interface CourseTagProps {
  courseId: string;
  size?: "sm" | "md";
  showCode?: boolean;
  className?: string;
}

export function CourseTag({ courseId, size = "sm", showCode = true, className }: CourseTagProps) {
  const course = useStore((s) => s.courses.find((c) => c.id === courseId));
  if (!course) {
    return (
      <span className={cn("inline-flex items-center rounded-pill bg-cream-elevated text-ink-muted px-2 py-0.5 text-xs", className)}>
        Unassigned
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill font-medium",
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        className,
      )}
      style={{
        backgroundColor: `${course.color}1a`,
        color: course.color,
      }}
    >
      <span
        className="inline-block rounded-full"
        style={{
          backgroundColor: course.color,
          width: size === "sm" ? 6 : 8,
          height: size === "sm" ? 6 : 8,
        }}
      />
      {showCode ? course.code : course.name}
    </span>
  );
}
