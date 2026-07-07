"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Check } from "lucide-react";
import { useStore } from "@/lib/store";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}

function CapturePanel({ onClose }: { onClose: () => void }) {
  const courses = useStore((s) => s.courses);
  const addTask = useStore((s) => s.addTask);

  const [title, setTitle] = useState("");
  const [courseId, setCourseId] = useState(() => courses[0]?.id ?? "");
  const [dueDate, setDueDate] = useState(() =>
    toLocalInput(new Date(Date.now() + 2 * 86400000).toISOString()),
  );
  const titleRef = useRef<HTMLInputElement>(null);

  // focus is a DOM side-effect (external system), not state — allowed
  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 180);
    return () => clearTimeout(t);
  }, []);

  const submit = () => {
    if (!title.trim()) {
      toast.error("Add a title");
      titleRef.current?.focus();
      return;
    }
    if (!courseId) {
      toast.error("Add a course first");
      return;
    }
    addTask({
      title: title.trim(),
      courseId,
      dueDate: dueDate
        ? new Date(dueDate).toISOString()
        : new Date(Date.now() + 2 * 86400000).toISOString(),
      priority: "medium",
    });
    toast.success("Captured");
    onClose();
  };

  return (
    <motion.div
      key="panel"
      initial={{ opacity: 0, scale: 0.6, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.6, y: 20 }}
      transition={{ type: "spring", stiffness: 380, damping: 26 }}
      className="w-[min(360px,calc(100vw-2rem))] rounded-card bg-white border border-border-soft shadow-warm-lg overflow-hidden"
    >
      <div
        className="px-4 py-3 border-b border-border-soft flex items-center justify-between"
        style={{ backgroundColor: "var(--color-cream-elevated)" }}
      >
        <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-serif)" }}>
          Quick capture
        </p>
        <button
          onClick={onClose}
          className="rounded-md p-1 text-ink-muted hover:bg-cream-base hover:text-ink-secondary transition-colors"
          aria-label="Close quick capture"
        >
          <X size={16} />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <input
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
            if (e.key === "Escape") onClose();
          }}
          placeholder="What's due?"
          className="w-full bg-transparent text-[15px] text-ink-primary placeholder:text-ink-muted focus:outline-none"
          style={{ fontFamily: "var(--font-serif)" }}
        />
        <div className="grid grid-cols-2 gap-2">
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="h-9 rounded-md border border-border-soft bg-cream-base px-2.5 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-blush-primary/40"
          >
            {courses.length === 0 && <option value="">No courses</option>}
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="h-9 rounded-md border border-border-soft bg-cream-base px-2.5 text-xs text-ink-primary focus:outline-none focus:ring-2 focus:ring-blush-primary/40 nums"
          />
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-ink-muted">
            <kbd className="px-1 py-0.5 rounded bg-cream-elevated border border-border-soft font-mono">Enter</kbd> to save
          </span>
          <button
            onClick={submit}
            className="inline-flex items-center gap-1.5 rounded-pill px-3.5 py-1.5 text-xs font-semibold text-white transition-colors"
            style={{ backgroundColor: "var(--color-blush-deep)" }}
          >
            <Check size={13} /> Save
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function QuickCaptureButton() {
  const open = useStore((s) => s.quickCaptureOpen);
  const setOpen = useStore((s) => s.setQuickCapture);

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end gap-3">
      <AnimatePresence mode="wait">
        {open ? (
          <CapturePanel key="panel" onClose={() => setOpen(false)} />
        ) : (
          <motion.button
            key="fab"
            onClick={() => setOpen(true)}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.6 }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
            className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-fab"
            style={{ background: "linear-gradient(135deg, #E8A0AC, #C9748A)" }}
            aria-label="Quick capture (press C)"
          >
            <motion.span
              animate={{ rotate: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
            >
              <Plus size={24} strokeWidth={2} />
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}
