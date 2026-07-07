"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import {
  MessageCircle, X, Send, Sparkles, LayoutDashboard, BookOpen, Target,
  CalendarDays, ClipboardCheck, GraduationCap, Timer, FileText, Plus, Bot,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  from: "bot" | "user";
  text: string;
  // optional quick replies attached to a bot message
  replies?: { label: string; action: string }[];
}

// Intent engine — maps keywords to a response + navigation action.
// `action` is either a view name or a special command (quickcapture / help).
interface Intent {
  match: RegExp;
  text: string;
  action?: string; // view id or "quickcapture"
  replies?: { label: string; action: string }[];
}

const INTENTS: Intent[] = [
  {
    match: /\b(dashboard|home|today|what.?s due|due today|overdue|upcoming)\b/i,
    text: "Taking you to your dashboard — that's where today's tasks, this week's deadlines, and your workload heatmap live.",
    action: "dashboard",
    replies: [
      { label: "Add a task", action: "quickcapture" },
      { label: "See my goals", action: "goals" },
    ],
  },
  {
    match: /\b(course|class|subject|add course|new course)\b/i,
    text: "Let's open Courses — you can add a new course with its code, credit hours, and a color tag there.",
    action: "courses",
    replies: [
      { label: "Set a goal", action: "goals" },
      { label: "Go to dashboard", action: "dashboard" },
    ],
  },
  {
    match: /\b(goal|target|aim|set goal|new goal|learning goal)\b/i,
    text: "Goals is the place — set a learning goal, then assign your tasks to it. Each completed task fills the goal's progress bar.",
    action: "goals",
    replies: [
      { label: "Add a task to a goal", action: "quickcapture" },
      { label: "See dashboard", action: "dashboard" },
    ],
  },
  {
    match: /\b(planner|week|calendar|schedule|reschedule|move task|drag)\b/i,
    text: "Opening the Weekly Planner — drag any task card to another day to reschedule it. The time of day stays the same.",
    action: "planner",
  },
  {
    match: /\b(attendance|check ?in|present|absent|mark class|taking class)\b/i,
    text: "Here's Attendance — tap Present, Absent, Late, or Excused for each class today. Your attendance rate updates live per course.",
    action: "attendance",
  },
  {
    match: /\b(grade|gpa|score|marks|assessment|what.?if|projected)\b/i,
    text: "Grades & GPA is where you enter assessment scores and model what-if outcomes with the target sliders.",
    action: "grades",
  },
  {
    match: /\b(focus|timer|pomodoro|study session|concentrate|25 min)\b/i,
    text: "Opening the Focus timer — pick a task first, then hit start. Every completed session is logged against that task.",
    action: "timer",
  },
  {
    match: /\b(record|transcript|report|history|summary|all grades)\b/i,
    text: "Here's your Records — a consolidated transcript of grades, GPA, attendance, and focus hours across all courses.",
    action: "records",
  },
  {
    match: /\b(add task|new task|capture|quick add|create task|reminder)\b/i,
    text: "Opening Quick Capture — just type a title, pick a course, and hit Enter. Done in under 5 seconds.",
    action: "quickcapture",
  },
  {
    match: /\b(help|what can you do|who are you|commands|features)\b/i,
    text: "I'm Flow, your study buddy 🌸 I can take you to any feature instantly. Try asking about: dashboard, courses, goals, planner, attendance, grades, focus timer, records, or adding a task.",
    replies: [
      { label: "Dashboard", action: "dashboard" },
      { label: "My goals", action: "goals" },
      { label: "Add a task", action: "quickcapture" },
      { label: "Focus timer", action: "timer" },
    ],
  },
  {
    match: /\b(hi|hello|hey|salam|assalam|hola)\b/i,
    text: "Hey! I'm Flow 🌸 What do you want to do — check today's deadlines, add a task, work on a goal, or start a focus session?",
    replies: [
      { label: "Today's deadlines", action: "dashboard" },
      { label: "Add a task", action: "quickcapture" },
      { label: "My goals", action: "goals" },
    ],
  },
];

const FALLBACK_TEXT =
  "I'm not sure I caught that 🌸 I can take you to any feature — try: \"show my deadlines\", \"add a task\", \"set a goal\", \"attendance\", \"focus timer\", or \"my grades\".";

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function matchIntent(input: string): { text: string; action?: string; replies?: { label: string; action: string }[] } {
  for (const intent of INTENTS) {
    if (intent.match.test(input)) {
      return { text: intent.text, action: intent.action, replies: intent.replies };
    }
  }
  return { text: FALLBACK_TEXT, replies: [
    { label: "Dashboard", action: "dashboard" },
    { label: "Add a task", action: "quickcapture" },
    { label: "Help", action: "help" },
  ]};
}

export function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      from: "bot",
      text: "Hi! I'm Flow 🌸 your study buddy. Tell me what you want to do and I'll take you straight there.",
      replies: [
        { label: "Today's deadlines", action: "dashboard" },
        { label: "Add a task", action: "quickcapture" },
        { label: "My goals", action: "goals" },
        { label: "Focus timer", action: "timer" },
      ],
    },
  ]);

  const setView = useStore((s) => s.setView);
  const setQuickCapture = useStore((s) => s.setQuickCapture);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, typing]);

  const runAction = (action: string) => {
    if (action === "quickcapture") {
      setQuickCapture(true);
      setOpen(false);
    } else if (action === "help") {
      // re-send the help intent
      send("help");
    } else {
      // it's a view id
      setView(action as never);
      setOpen(false);
    }
  };

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const userMsg: Message = { id: uid(), from: "user", text: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    // simulate a tiny thinking delay for a natural feel
    setTimeout(() => {
      const result = matchIntent(trimmed);
      const botMsg: Message = {
        id: uid(),
        from: "bot",
        text: result.text,
        replies: result.replies,
      };
      setMessages((m) => [...m, botMsg]);
      setTyping(false);
      // auto-navigate if the intent has a direct action
      if (result.action) {
        setTimeout(() => runAction(result.action!), 700);
      }
    }, 450);
  };

  return (
    <>
      {/* Floating button — bottom-left so it doesn't clash with Quick Capture (bottom-right) */}
      <div className="fixed bottom-20 md:bottom-6 left-4 sm:left-6 z-40">
        <AnimatePresence mode="wait">
          {!open && (
            <motion.button
              key="bot-fab"
              onClick={() => setOpen(true)}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: "spring", stiffness: 400, damping: 22 }}
              className="w-14 h-14 rounded-full flex items-center justify-center text-white shadow-fab relative"
              style={{ background: "linear-gradient(135deg, #E8A0AC, #C9748A)" }}
              aria-label="Open chat assistant"
            >
              {/* cute pulsing ring */}
              <motion.span
                className="absolute inset-0 rounded-full"
                style={{ border: "2px solid #E8A0AC" }}
                animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
              />
              <Bot size={24} strokeWidth={1.8} />
              {/* little sparkle badge */}
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-white flex items-center justify-center" style={{ boxShadow: "var(--shadow-warm)" }}>
                <Sparkles size={9} className="text-blush-deep" />
              </span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="bot-panel"
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 30 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="fixed bottom-20 md:bottom-6 left-4 sm:left-6 z-40 w-[min(380px,calc(100vw-2rem))] rounded-card bg-white border border-border-soft shadow-warm-lg overflow-hidden flex flex-col"
            style={{ maxHeight: "min(560px, calc(100vh - 120px))" }}
          >
            {/* Header */}
            <div
              className="px-4 py-3 flex items-center justify-between text-white"
              style={{ background: "linear-gradient(135deg, #E8A0AC, #C9748A)" }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Bot size={18} strokeWidth={1.8} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-serif)" }}>Flow</p>
                  <p className="text-[10px] text-white/80 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success-sage inline-block" /> online · your study buddy
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1 text-white/80 hover:bg-white/15 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <X size={16} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-warm p-3 space-y-3" style={{ backgroundColor: "var(--color-cream-base)" }}>
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} onReply={runAction} />
              ))}
              {typing && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-end gap-1.5"
                >
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #E8A0AC, #C9748A)" }}>
                    <Bot size={12} className="text-white" />
                  </div>
                  <div className="rounded-2xl rounded-bl-sm bg-white border border-border-soft px-3 py-2.5 flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-ink-muted"
                        animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                        transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border-soft bg-white">
              <form
                onSubmit={(e) => { e.preventDefault(); send(input); }}
                className="flex items-center gap-2"
              >
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Flow to take you somewhere…"
                  className="flex-1 h-9 rounded-pill bg-cream-base border border-border-soft px-3.5 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-blush-primary/40"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 disabled:opacity-40 flex-shrink-0"
                  style={{ backgroundColor: "var(--color-blush-deep)" }}
                  aria-label="Send"
                >
                  <Send size={15} />
                </button>
              </form>
              <p className="text-[10px] text-ink-muted text-center mt-1.5">
                Flow knows every feature — try “show my deadlines” or “set a goal”
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MessageBubble({ message, onReply }: { message: Message; onReply: (action: string) => void }) {
  const isBot = message.from === "bot";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn("flex items-end gap-1.5", !isBot && "flex-row-reverse")}
    >
      {isBot && (
        <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "linear-gradient(135deg, #E8A0AC, #C9748A)" }}>
          <Bot size={12} className="text-white" />
        </div>
      )}
      <div className={cn("max-w-[78%]", !isBot && "flex flex-col items-end")}>
        <div
          className={cn(
            "px-3 py-2 text-sm leading-relaxed",
            isBot ? "rounded-2xl rounded-bl-sm bg-white border border-border-soft text-ink-primary" : "rounded-2xl rounded-br-sm text-white",
          )}
          style={!isBot ? { background: "var(--color-blush-deep)" } : undefined}
        >
          {message.text}
        </div>
        {isBot && message.replies && message.replies.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {message.replies.map((r) => (
              <button
                key={r.action + r.label}
                onClick={() => onReply(r.action)}
                className="inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-medium border border-border-soft bg-white text-blush-deep hover:bg-blush-soft/40 transition-colors"
              >
                <ReplyIcon action={r.action} />
                {r.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ReplyIcon({ action }: { action: string }) {
  const cls = "w-3 h-3";
  switch (action) {
    case "dashboard": return <LayoutDashboard size={11} className={cls} />;
    case "courses": return <BookOpen size={11} className={cls} />;
    case "goals": return <Target size={11} className={cls} />;
    case "planner": return <CalendarDays size={11} className={cls} />;
    case "attendance": return <ClipboardCheck size={11} className={cls} />;
    case "grades": return <GraduationCap size={11} className={cls} />;
    case "timer": return <Timer size={11} className={cls} />;
    case "records": return <FileText size={11} className={cls} />;
    case "quickcapture": return <Plus size={11} className={cls} />;
    default: return <Sparkles size={11} className={cls} />;
  }
}
