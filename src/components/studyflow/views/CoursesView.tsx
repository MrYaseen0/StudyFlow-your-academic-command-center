"use client";

import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Clock, ListChecks } from "lucide-react";
import { useStore } from "@/lib/store";
import { COURSE_COLORS } from "@/lib/types";
import type { Course } from "@/lib/types";
import { useState } from "react";
import { CourseEditor } from "../CourseEditor";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function CoursesView() {
  const courses = useStore((s) => s.courses);
  const tasks = useStore((s) => s.tasks);
  const sessions = useStore((s) => s.sessions);
  const deleteCourse = useStore((s) => s.deleteCourse);

  const [editing, setEditing] = useState<Course | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Course | null>(null);

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif)", letterSpacing: "-0.02em" }}>
            Courses
          </h2>
          <p className="text-sm text-ink-secondary mt-1">
            {courses.length === 0
              ? "Add your courses to start tracking work."
              : `${courses.length} ${courses.length === 1 ? "course" : "courses"} this semester.`}
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-semibold text-white transition-colors"
          style={{ backgroundColor: "var(--color-blush-deep)" }}
        >
          <Plus size={15} /> Add course
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-card border border-dashed border-border-soft p-12 text-center bg-white/40">
          <div className="w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center" style={{ backgroundColor: "var(--color-cream-elevated)" }}>
            <Plus size={22} className="text-ink-muted" />
          </div>
          <p className="text-sm font-medium text-ink-secondary" style={{ fontFamily: "var(--font-serif)" }}>
            No courses yet
          </p>
          <p className="text-xs text-ink-muted mt-1 mb-4">Start by adding the courses you're taking this semester.</p>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1.5 rounded-pill px-4 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: "var(--color-blush-deep)" }}
          >
            <Plus size={15} /> Add your first course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c, i) => {
            const courseTasks = tasks.filter((t) => t.courseId === c.id);
            const activeTasks = courseTasks.filter((t) => t.status !== "done");
            const courseSessions = sessions.filter((s) => s.courseId === c.id && s.mode === "focus");
            const focusMin = courseSessions.reduce((s, x) => s + x.duration, 0);
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="rounded-card bg-white border border-border-soft shadow-warm p-5 group relative"
              >
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-card" style={{ backgroundColor: c.color }} />
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-xs font-semibold nums text-ink-muted">{c.code}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => setEditing(c)}
                      className="rounded-md p-1.5 text-ink-muted hover:bg-cream-elevated hover:text-ink-secondary transition-colors"
                      aria-label="Edit course"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setDeleting(c)}
                      className="rounded-md p-1.5 text-ink-muted hover:bg-rose-urgent/10 transition-colors"
                      style={{ color: undefined }}
                      aria-label="Delete course"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-semibold leading-snug mb-1" style={{ fontFamily: "var(--font-serif)" }}>
                  {c.name}
                </h3>
                <p className="text-xs text-ink-muted mb-4">{c.instructor || "No instructor"}</p>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border-soft">
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-ink-muted">Credits</p>
                    <p className="text-sm font-semibold nums mt-0.5" style={{ fontFamily: "var(--font-serif)" }}>{c.creditHours}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-ink-muted">Active</p>
                    <p className="text-sm font-semibold nums mt-0.5 inline-flex items-center gap-1" style={{ fontFamily: "var(--font-serif)" }}>
                      <ListChecks size={11} className="text-blush-deep" />{activeTasks.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-ink-muted">Focus</p>
                    <p className="text-sm font-semibold nums mt-0.5 inline-flex items-center gap-1" style={{ fontFamily: "var(--font-serif)" }}>
                      <Clock size={11} className="text-success-sage" />{Math.round(focusMin / 6) / 10}h
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {(creating || editing) && (
        <CourseEditor
          course={editing}
          open={!!creating || !!editing}
          onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="rounded-card border-border-soft">
          <AlertDialogHeader>
            <AlertDialogTitle style={{ fontFamily: "var(--font-serif)" }}>Delete this course?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{deleting?.name}</strong> and all {tasks.filter((t) => t.courseId === deleting?.id).length} associated tasks and grades. This can't be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-md">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-md bg-rose-urgent text-white hover:bg-rose-urgent/90"
              onClick={() => { if (deleting) { deleteCourse(deleting.id); toast.success("Course deleted"); setDeleting(null); } }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
