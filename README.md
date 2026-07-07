<div align="center">

# 🌸 StudyFlow

### Your Academic Command Center

Track deadlines, manage courses, calculate GPA, and stay focused — all in one calm, designed space built for university students.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma)](https://prisma.io)

</div>

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **📊 Dashboard** | At-a-glance view of due tasks, weekly workload heatmap, GPA snapshot, and goal progress |
| **📚 Course Manager** | Add courses with custom colors, credit hours, and instructor info |
| **✅ Task Tracker** | Priority-based tasks with urgency escalation, drag-to-reschedule planner |
| **📈 GPA Calculator** | Enter assessments, compare current vs. projected grades, what-if target sliders |
| **🍅 Pomodoro Timer** | Focus timer with task linking, session history, and break reminders |
| **📋 Weekly Planner** | Drag-and-drop board to reschedule tasks across days |
| **🎯 Goals** | Set learning goals, assign tasks, track progress with animated bars |
| **🤖 Flow Bot** | Study buddy chatbot with quick-reply chips for fast navigation |
| **⚡ Quick Capture** | Press `C` anywhere to instantly create a task |

## 📸 Screenshots

<div align="center">
<img src="bg-dashboard.png" alt="StudyFlow Dashboard" width="100%" />
<br/>
<em>Dashboard — due tasks, weekly heatmap, and GPA snapshot</em>
</div>

<br/>

<div align="center">
<img src="bg-planner.png" alt="Weekly Planner" width="100%" />
<br/>
<em>Weekly Planner — drag tasks between days to reschedule</em>
</div>

<br/>

<div align="center">
<img src="bg-grades.png" alt="Grades & GPA" width="100%" />
<br/>
<em>Grades & GPA — current vs. projected with what-if sliders</em>
</div>

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **UI** | React 19, shadcn/ui, Tailwind CSS 4, Framer Motion |
| **State** | Zustand (client), Prisma + SQLite (server) |
| **Auth** | Custom JWT (bcrypt + jose), httpOnly cookies |
| **Charts** | Recharts |
| **Drag & Drop** | @dnd-kit |
| **Fonts** | Fraunces (headings), Inter (body), JetBrains Mono (timer) |

---

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js 18+
- Git

### Installation

```bash
# Clone the repo
git clone https://github.com/MrYaseen0/StudyFlow-your-academic-command-center.git
cd StudyFlow-your-academic-command-center

# Install dependencies
bun install

# Set up the database
bunx prisma db push
bunx prisma generate

# Start dev server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/           # REST API routes (auth, courses, tasks, grades, ...)
│   │   ├── (auth)/        # Login & register pages
│   │   └── page.tsx       # Main SPA entry
│   ├── components/
│   │   ├── ui/            # 48 shadcn/ui components
│   │   └── ...            # AppShell, Dashboard, TaskCard, Timer, ChatBot, etc.
│   └── lib/
│       ├── store.ts       # Zustand global state
│       └── utils.ts       # Helpers
├── prisma/
│   └── schema.prisma      # 7 models: User, Course, Task, Goal, Grade, Session, Attendance
├── public/                # Static assets & campus background
└── db/                    # SQLite database
```

---

## 🔐 Security

- Rate-limited auth endpoints (login: 10 req/15min, register: 5 req/hr)
- bcrypt password hashing + httpOnly JWT cookies
- Per-user data isolation on every query (IDOR-safe)
- Security headers: CSP, X-Frame-Options DENY, HSTS
- Input validation with Zod on all API routes

---

## 📄 License

MIT

---

<div align="center">

**StudyFlow** — track, prioritize, execute, review.

</div>
