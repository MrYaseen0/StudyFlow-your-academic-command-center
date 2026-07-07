import type { Course, Task, GradeEntry } from "./types";

function daysFromNow(days: number, hours = 9): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, 0, 0, 0);
  return d.toISOString();
}

const SAMPLE_COURSES: Course[] = [
  {
    id: "c-bio",
    name: "Cell Biology",
    code: "BIO 201",
    instructor: "Dr. Rahman",
    color: "#C9748A",
    creditHours: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: "c-org",
    name: "Organic Chemistry",
    code: "CHEM 230",
    instructor: "Dr. Saleem",
    color: "#8FA894",
    creditHours: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: "c-phy",
    name: "Physics II",
    code: "PHY 112",
    instructor: "Dr. Khan",
    color: "#D9A566",
    creditHours: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: "c-eng",
    name: "Academic Writing",
    code: "ENG 105",
    instructor: "Ms. Ali",
    color: "#6B5D56",
    creditHours: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: "c-psyc",
    name: "Intro to Psychology",
    code: "PSY 101",
    instructor: "Dr. Iqbal",
    color: "#B8506A",
    creditHours: 3,
    createdAt: new Date().toISOString(),
  },
];

const SAMPLE_TASKS: Task[] = [
  {
    id: "t-1",
    title: "Lab report: Enzyme kinetics analysis",
    courseId: "c-bio",
    dueDate: daysFromNow(0, 23),
    priority: "high",
    status: "in_progress",
    estimatedHours: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: "t-2",
    title: "Quiz 3: Functional groups & nomenclature",
    courseId: "c-org",
    dueDate: daysFromNow(1, 10),
    priority: "high",
    status: "not_started",
    estimatedHours: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: "t-3",
    title: "Problem set: Gauss's law applications",
    courseId: "c-phy",
    dueDate: daysFromNow(2, 16),
    priority: "medium",
    status: "not_started",
    estimatedHours: 4,
    createdAt: new Date().toISOString(),
  },
  {
    id: "t-4",
    title: "Read Chapter 4: Memory & cognition",
    courseId: "c-psyc",
    dueDate: daysFromNow(4, 9),
    priority: "low",
    status: "not_started",
    estimatedHours: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: "t-5",
    title: "Essay draft: Literature review section",
    courseId: "c-eng",
    dueDate: daysFromNow(5, 23),
    priority: "medium",
    status: "not_started",
    estimatedHours: 5,
    createdAt: new Date().toISOString(),
  },
  {
    id: "t-6",
    title: "Midterm exam review: practice problems",
    courseId: "c-org",
    dueDate: daysFromNow(10, 14),
    priority: "high",
    status: "not_started",
    estimatedHours: 6,
    createdAt: new Date().toISOString(),
  },
  {
    id: "t-7",
    title: "Group project: research outline",
    courseId: "c-bio",
    dueDate: daysFromNow(14, 17),
    priority: "medium",
    status: "not_started",
    estimatedHours: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: "t-8",
    title: "Submit Problem set 4 (electric fields)",
    courseId: "c-phy",
    dueDate: daysFromNow(-1, 17),
    priority: "high",
    status: "done",
    estimatedHours: 3,
    createdAt: new Date().toISOString(),
  },
  {
    id: "t-9",
    title: "Discussion board: research methods",
    courseId: "c-psyc",
    dueDate: daysFromNow(6, 23),
    priority: "low",
    status: "in_progress",
    estimatedHours: 1,
    createdAt: new Date().toISOString(),
  },
];

const SAMPLE_GRADES: GradeEntry[] = [
  // Biology
  { id: "g-1", courseId: "c-bio", assessmentName: "Quiz 1", grade: 88, weight: 10 },
  { id: "g-2", courseId: "c-bio", assessmentName: "Midterm", grade: 82, weight: 25 },
  { id: "g-3", courseId: "c-bio", assessmentName: "Lab participation", grade: 95, weight: 10 },
  // Organic Chem
  { id: "g-4", courseId: "c-org", assessmentName: "Quiz 1", grade: 76, weight: 10 },
  { id: "g-5", courseId: "c-org", assessmentName: "Quiz 2", grade: 81, weight: 10 },
  { id: "g-6", courseId: "c-org", assessmentName: "Midterm", grade: 74, weight: 30 },
  // Physics
  { id: "g-7", courseId: "c-phy", assessmentName: "Problem set 1", grade: 91, weight: 8 },
  { id: "g-8", courseId: "c-phy", assessmentName: "Problem set 2", grade: 85, weight: 8 },
  { id: "g-9", courseId: "c-phy", assessmentName: "Problem set 3", grade: 79, weight: 8 },
  // English
  { id: "g-10", courseId: "c-eng", assessmentName: "Essay 1", grade: 89, weight: 25 },
  { id: "g-11", courseId: "c-eng", assessmentName: "Peer review", grade: 92, weight: 10 },
  // Psych
  { id: "g-12", courseId: "c-psyc", assessmentName: "Quiz 1", grade: 94, weight: 15 },
  { id: "g-13", courseId: "c-psyc", assessmentName: "Quiz 2", grade: 90, weight: 15 },
];

export function getSampleData(): {
  courses: Course[];
  tasks: Task[];
  grades: GradeEntry[];
} {
  return {
    courses: SAMPLE_COURSES.map((c) => ({ ...c })),
    tasks: SAMPLE_TASKS.map((t) => ({ ...t })),
    grades: SAMPLE_GRADES.map((g) => ({ ...g })),
  };
}
