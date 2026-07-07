"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/lib/store";
import { COURSE_COLORS, type Course } from "@/lib/types";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Check } from "lucide-react";

interface CourseEditorProps {
  course?: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CourseEditor({ course, open, onOpenChange }: CourseEditorProps) {
  const addCourse = useStore((s) => s.addCourse);
  const updateCourse = useStore((s) => s.updateCourse);

  const [name, setName] = useState(() => course?.name ?? "");
  const [code, setCode] = useState(() => course?.code ?? "");
  const [instructor, setInstructor] = useState(() => course?.instructor ?? "");
  const [color, setColor] = useState(() => course?.color ?? COURSE_COLORS[Math.floor(Math.random() * COURSE_COLORS.length)]);
  const [creditHours, setCreditHours] = useState(() => course?.creditHours ?? 3);

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("Add a course name");
      return;
    }
    if (!code.trim()) {
      toast.error("Add a course code");
      return;
    }
    if (course) {
      updateCourse(course.id, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        instructor: instructor.trim(),
        color,
        creditHours,
      });
      toast.success("Course updated");
    } else {
      addCourse({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        instructor: instructor.trim(),
        color,
        creditHours,
      });
      toast.success("Course added");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-card border-border-soft bg-white">
        <DialogHeader>
          <DialogTitle style={{ fontFamily: "var(--font-serif)" }}>
            {course ? "Edit course" : "New course"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="c-name">Course name</Label>
              <Input
                id="c-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Organic Chemistry"
                autoFocus
                className="bg-cream-base border-border-soft"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-code">Code</Label>
              <Input
                id="c-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="CHEM 230"
                className="bg-cream-base border-border-soft uppercase nums"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-credits">Credit hours</Label>
              <Input
                id="c-credits"
                type="number"
                min={1}
                max={8}
                value={creditHours}
                onChange={(e) => setCreditHours(Number(e.target.value) || 1)}
                className="bg-cream-base border-border-soft nums"
              />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label htmlFor="c-instructor">Instructor <span className="text-ink-muted font-normal">(optional)</span></Label>
              <Input
                id="c-instructor"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                placeholder="e.g. Dr. Saleem"
                className="bg-cream-base border-border-soft"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color tag</Label>
            <div className="flex flex-wrap gap-2">
              {COURSE_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110",
                    color === c && "ring-2 ring-offset-2 ring-offset-white",
                  )}
                  style={{ backgroundColor: c, ...(color === c ? { boxShadow: `0 0 0 2px ${c}` } : {}) }}
                  aria-label={`Color ${c}`}
                >
                  {color === c && <Check size={14} color="#ffffff" strokeWidth={3} />}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-ink-secondary hover:bg-cream-elevated">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-blush-deep hover:bg-rose-urgent text-white">
            {course ? "Save changes" : "Add course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
