import type { Course, GradeEntry } from "./types";

// Standard 4.0 GPA scale with +/- granularity
export function percentageToGpa(pct: number): number {
  if (pct >= 93) return 4.0;
  if (pct >= 90) return 3.7;
  if (pct >= 87) return 3.3;
  if (pct >= 83) return 3.0;
  if (pct >= 80) return 2.7;
  if (pct >= 77) return 2.3;
  if (pct >= 73) return 2.0;
  if (pct >= 70) return 1.7;
  if (pct >= 67) return 1.3;
  if (pct >= 63) return 1.0;
  if (pct >= 60) return 0.7;
  return 0.0;
}

export function percentageToLetter(pct: number): string {
  if (pct >= 93) return "A";
  if (pct >= 90) return "A-";
  if (pct >= 87) return "B+";
  if (pct >= 83) return "B";
  if (pct >= 80) return "B-";
  if (pct >= 77) return "C+";
  if (pct >= 73) return "C";
  if (pct >= 70) return "C-";
  if (pct >= 67) return "D+";
  if (pct >= 63) return "D";
  if (pct >= 60) return "D-";
  return "F";
}

export interface CourseGradeResult {
  courseId: string;
  currentGrade: number | null; // weighted avg of entered (non-projected) grades
  enteredWeight: number; // total weight of entered assessments
  targetGrade: number; // what-if target (defaults to currentGrade or 0)
  projectedGrade: number; // blend of current + remaining-at-target
  projectedGpa: number;
  projectedLetter: string;
}

export function computeCourseGrade(
  courseId: string,
  grades: GradeEntry[],
  targetGrade?: number,
): CourseGradeResult {
  const courseGrades = grades.filter((g) => g.courseId === courseId);
  const entered = courseGrades.filter((g) => !g.isProjected);

  let currentGrade: number | null = null;
  let enteredWeight = 0;
  let weightedSum = 0;

  if (entered.length > 0) {
    entered.forEach((g) => {
      weightedSum += g.grade * g.weight;
      enteredWeight += g.weight;
    });
    if (enteredWeight > 0) {
      currentGrade = weightedSum / enteredWeight;
    }
  }

  // Target: explicit override > currentGrade > 0
  const tgt = targetGrade ?? currentGrade ?? 0;

  // Projected: blend entered (at actual) + remaining weight (at target)
  const remainingWeight = Math.max(0, 100 - enteredWeight);
  let projectedGrade: number;
  if (enteredWeight >= 100 || enteredWeight === 0) {
    projectedGrade = enteredWeight === 0 ? tgt : (currentGrade ?? tgt);
  } else {
    projectedGrade =
      ((currentGrade ?? 0) * enteredWeight + tgt * remainingWeight) / 100;
  }

  return {
    courseId,
    currentGrade,
    enteredWeight,
    targetGrade: tgt,
    projectedGrade,
    projectedGpa: percentageToGpa(projectedGrade),
    projectedLetter: percentageToLetter(projectedGrade),
  };
}

export function computeGpa(
  courses: Course[],
  grades: GradeEntry[],
  targets: Record<string, number>,
): {
  gpa: number;
  perCourse: CourseGradeResult[];
} {
  const perCourse = courses.map((c) =>
    computeCourseGrade(c.id, grades, targets[c.id]),
  );

  const totalCredits = courses.reduce((s, c) => s + c.creditHours, 0);
  if (totalCredits === 0) return { gpa: 0, perCourse };

  const weightedGpa = perCourse.reduce((s, r, i) => {
    return s + r.projectedGpa * courses[i].creditHours;
  }, 0);

  return { gpa: weightedGpa / totalCredits, perCourse };
}
