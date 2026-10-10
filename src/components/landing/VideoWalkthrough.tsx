import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Terminal,
  Brain,
  Layers,
  BarChart3,
  Sparkles,
  Volume2,
  VolumeX,
  Code2,
  Check,
  ChevronRight,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  CircleCheck,
  MousePointer,
  ArrowUpRight,
  RefreshCw,
  Flame,
  Award,
  BookOpen,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../utils/cn";
import { TraceIndex, BudgetMeter } from "../ui/StudyTrace";

export interface WalkthroughStep {
  id: string;
  route: string;
  title: string;
  subtitle: string;
  durationSeconds: number;
  badge: string;
  icon: React.ElementType;
}

const STEPS: WalkthroughStep[] = [
  {
    id: "dashboard",
    route: "dashboard",
    title: "Daily Planner",
    subtitle: "Dynamic sequence bounded to today’s available study budget",
    durationSeconds: 9,
    badge: "01 · Daily Plan",
    icon: Layers,
  },
  {
    id: "recall",
    route: "recall/33",
    title: "Active Recall",
    subtitle: "Explain invariants from memory before code or hints are opened",
    durationSeconds: 9,
    badge: "02 · Retrieval",
    icon: Brain,
  },
  {
    id: "timer",
    route: "timer/42",
    title: "Coding Arena",
    subtitle: "Timed independent implementation with outcome verification",
    durationSeconds: 9,
    badge: "03 · Practice",
    icon: Terminal,
  },
  {
    id: "analytics",
    route: "analytics",
    title: "Telemetry & Evidence",
    subtitle: "Dual-check telemetry, retention curves, and unassisted history",
    durationSeconds: 9,
    badge: "04 · Evidence",
    icon: BarChart3,
  },
];

interface QueuedTaskItem {
  id: string;
  index: string;
  title: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  minutes: number;
  kindTag: string;
  kindType: "recall" | "coding" | "variant";
  reason: string;
}

const QUEUED_TASKS_BY_BUDGET: Record<30 | 45 | 60, QueuedTaskItem[]> = {
  30: [
    {
      id: "146",
      index: "01",
      title: "146. LRU Cache",
      category: "Linked List / Design",
      difficulty: "Medium",
      minutes: 6,
      kindTag: "Recall warm-up · up next",
      kindType: "recall",
      reason:
        "Recall interval due. Retrieve double-linked list invariants and O(1) dictionary eviction before reviewing code.",
    },
    {
      id: "42",
      index: "02",
      title: "42. Trapping Rain Water",
      category: "Two Pointers",
      difficulty: "Hard",
      minutes: 24,
      kindTag: "Coding practice · main block",
      kindType: "coding",
      reason:
        "Delayed coding check (8 days since initial solve). Full unassisted implementation under timed block.",
    },
  ],
  45: [
    {
      id: "146",
      index: "01",
      title: "146. LRU Cache",
      category: "Linked List / Design",
      difficulty: "Medium",
      minutes: 6,
      kindTag: "Recall warm-up · up next",
      kindType: "recall",
      reason:
        "Recall interval due. Retrieve double-linked list invariants and O(1) dictionary eviction before reviewing code.",
    },
    {
      id: "42",
      index: "02",
      title: "42. Trapping Rain Water",
      category: "Two Pointers",
      difficulty: "Hard",
      minutes: 25,
      kindTag: "Coding practice · main block",
      kindType: "coding",
      reason:
        "Delayed coding check (9 days since initial pass). Two pointers with left_max and right_max boundaries.",
    },
    {
      id: "33",
      index: "03",
      title: "33. Search in Rotated Sorted Array",
      category: "Binary Search",
      difficulty: "Medium",
      minutes: 14,
      kindTag: "Unfamiliar check · topic hidden",
      kindType: "variant",
      reason:
        "Protected unfamiliar check. Test monotonic partition condition without category cues.",
    },
  ],
  60: [
    {
      id: "146",
      index: "01",
      title: "146. LRU Cache",
      category: "Linked List / Design",
      difficulty: "Medium",
      minutes: 6,
      kindTag: "Recall warm-up · up next",
      kindType: "recall",
      reason:
        "Recall interval due. Retrieve double-linked list invariants and O(1) dictionary eviction before reviewing code.",
    },
    {
      id: "42",
      index: "02",
      title: "42. Trapping Rain Water",
      category: "Two Pointers",
      difficulty: "Hard",
      minutes: 32,
      kindTag: "Coding practice · main block",
      kindType: "coding",
      reason:
        "Deep implementation block. Write clean solution and verify O(1) auxiliary space requirement.",
    },
    {
      id: "33",
      index: "03",
      title: "33. Search in Rotated Sorted Array",
      category: "Binary Search",
      difficulty: "Medium",
      minutes: 14,
      kindTag: "Unfamiliar check · topic hidden",
      kindType: "variant",
      reason:
        "Protected unfamiliar check. Test monotonic partition condition without category cues.",
    },
    {
      id: "417",
      index: "04",
      title: "417. Pacific Atlantic Water Flow",
      category: "Graphs / DFS",
      difficulty: "Medium",
      minutes: 8,
      kindTag: "Pattern foundation · syntax review",
      kindType: "coding",
      reason:
        "Review matrix boundary traversal invariants and reachability intersection.",
    },
  ],
};

const FOURTEEN_DAY_DATA = [
  { day: "Sep 26", dateNum: 26, mins: 25 },
  { day: "Sep 27", dateNum: 27, mins: 45 },
  { day: "Sep 28", dateNum: 28, mins: 0 },
  { day: "Sep 29", dateNum: 29, mins: 30 },
  { day: "Sep 30", dateNum: 30, mins: 45 },
  { day: "Oct 1", dateNum: 1, mins: 60 },
  { day: "Oct 2", dateNum: 2, mins: 20 },
  { day: "Oct 3", dateNum: 3, mins: 0 },
  { day: "Oct 4", dateNum: 4, mins: 35 },
  { day: "Oct 5", dateNum: 5, mins: 45 },
  { day: "Oct 6", dateNum: 6, mins: 20 },
  { day: "Oct 7", dateNum: 7, mins: 30 },
  { day: "Oct 8", dateNum: 8, mins: 45 },
  { day: "Oct 9", dateNum: 9, mins: 25 },
];

export function VideoWalkthrough() {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [stepProgress, setStepProgress] = useState(0); // 0 to 100
  const [isMuted, setIsMuted] = useState(true);
  const [interactiveMode, setInteractiveMode] = useState(false);

  // Scene 1 Interactive states (Dashboard)
  const [selectedBudget, setSelectedBudget] = useState<30 | 45 | 60>(45);
  const [selectedQueueItem, setSelectedQueueItem] = useState(0);

  // Scene 2 Interactive states (Recall)
  const [isRecallFlipped, setIsRecallFlipped] = useState(false);
  const [recallRating, setRecallRating] = useState<string | null>(null);
  const [recallReferenceLang, setRecallReferenceLang] = useState<"python" | "cpp">("python");
  const [recallText, setRecallText] = useState(
    "1. Find mid = left + (right - left) // 2\n2. If nums[left] <= nums[mid], left half is monotonically sorted:\n   - if nums[left] <= target < nums[mid]: right = mid - 1\n   - else: left = mid + 1\n3. Else right half is sorted:\n   - if nums[mid] < target <= nums[right]: left = mid + 1\n   - else: right = mid - 1"
  );
  const [recallElapsed, setRecallElapsed] = useState(102); // 1:42
  const [isRecallPaused, setIsRecallPaused] = useState(false);

  // Scene 3 Interactive states (Timer / Coding block)
  const [selectedLang, setSelectedLang] = useState<"python" | "cpp" | "ts">("python");
  const [testRunStatus, setTestRunStatus] = useState<"idle" | "running" | "passed">("idle");
  const [sessionPhase, setSessionPhase] = useState<"coding" | "assessment">("coding");
  const [codingOutcome, setCodingOutcome] = useState<string | null>(null);

  // Scene 4 Interactive states (Telemetry)
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Simulated cursor state during auto-play
  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50, opacity: 0, clicking: false });

  const activeStep = STEPS[activeStepIndex];

  // Auto-play timer loop
  useEffect(() => {
    if (!isPlaying || interactiveMode) return;

    const intervalTime = 50; // update every 50ms
    const totalStepTime = activeStep.durationSeconds * 1000;
    const progressIncrement = (intervalTime / totalStepTime) * 100;

    const timer = setInterval(() => {
      setStepProgress((prev) => {
        if (prev >= 100) {
          // Advance to next step
          setActiveStepIndex((prevIndex) => (prevIndex + 1) % STEPS.length);
          return 0;
        }
        return prev + progressIncrement;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, activeStepIndex, activeStep.durationSeconds, interactiveMode]);

  // Reset scene-specific states when step changes in auto mode
  useEffect(() => {
    setStepProgress(0);
    if (!interactiveMode) {
      if (activeStepIndex === 0) {
        setSelectedQueueItem(0);
      } else if (activeStepIndex === 1) {
        setIsRecallFlipped(false);
        setRecallRating(null);
      } else if (activeStepIndex === 2) {
        setSessionPhase("coding");
        setTestRunStatus("idle");
        setCodingOutcome(null);
      }
    }
  }, [activeStepIndex, interactiveMode]);

  // Simulated cursor movements during auto-play
  useEffect(() => {
    if (!isPlaying || interactiveMode) {
      setCursorPos((c) => ({ ...c, opacity: 0 }));
      return;
    }

    let timeoutId: NodeJS.Timeout;

    if (activeStepIndex === 0) {
      // Scene 1: cursor highlights budget, then hovers over Next Action
      setCursorPos({ x: 78, y: 35, opacity: 1, clicking: false });
      timeoutId = setTimeout(() => {
        setCursorPos({ x: 78, y: 35, opacity: 1, clicking: true });
        setTimeout(() => {
          setCursorPos({ x: 42, y: 64, opacity: 1, clicking: false });
        }, 500);
      }, 2400);
    } else if (activeStepIndex === 1) {
      // Scene 2: cursor highlights recall prompt, then clicks reveal
      setCursorPos({ x: 55, y: 40, opacity: 1, clicking: false });
      timeoutId = setTimeout(() => {
        setCursorPos({ x: 80, y: 78, opacity: 1, clicking: true });
        setIsRecallFlipped(true);
        setTimeout(() => {
          setCursorPos({ x: 75, y: 88, opacity: 1, clicking: false });
        }, 600);
      }, 3500);
    } else if (activeStepIndex === 2) {
      // Scene 3: cursor writes code, clicks Run Test Suite, then I'm Done
      setCursorPos({ x: 40, y: 48, opacity: 1, clicking: false });
      timeoutId = setTimeout(() => {
        setCursorPos({ x: 84, y: 26, opacity: 1, clicking: true });
        setTestRunStatus("running");
        setTimeout(() => {
          setTestRunStatus("passed");
          setCursorPos({ x: 76, y: 76, opacity: 1, clicking: true });
          setTimeout(() => {
            setSessionPhase("assessment");
          }, 400);
        }, 1200);
      }, 2600);
    } else if (activeStepIndex === 3) {
      // Scene 4: cursor inspects telemetry curves and evidence cards
      setCursorPos({ x: 30, y: 45, opacity: 1, clicking: false });
      timeoutId = setTimeout(() => {
        setCursorPos({ x: 72, y: 45, opacity: 1, clicking: false });
      }, 3000);
    }

    return () => clearTimeout(timeoutId);
  }, [activeStepIndex, isPlaying, interactiveMode]);

  const handleStepSelect = (idx: number) => {
    setActiveStepIndex(idx);
    setStepProgress(0);
    setInteractiveMode(true);
  };

  const handleRunTests = () => {
    setInteractiveMode(true);
    setTestRunStatus("running");
    setTimeout(() => {
      setTestRunStatus("passed");
    }, 800);
  };

  const handleTimelineScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetSecond = clickRatio * totalTourSeconds;

    let accumulated = 0;
    for (let i = 0; i < STEPS.length; i++) {
      const stepDuration = STEPS[i].durationSeconds;
      if (targetSecond <= accumulated + stepDuration || i === STEPS.length - 1) {
        setActiveStepIndex(i);
        const withinStepSec = targetSecond - accumulated;
        setStepProgress(Math.max(0, Math.min(100, (withinStepSec / stepDuration) * 100)));
        break;
      }
      accumulated += stepDuration;
    }
    setInteractiveMode(true);
  };

  const currentTotalSeconds =
    STEPS.slice(0, activeStepIndex).reduce((acc, s) => acc + s.durationSeconds, 0) +
    Math.floor((stepProgress / 100) * activeStep.durationSeconds);
  const totalTourSeconds = STEPS.reduce((acc, s) => acc + s.durationSeconds, 0);

  const formatMinSec = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const currentTasks = QUEUED_TASKS_BY_BUDGET[selectedBudget];
  const primaryTask = currentTasks[selectedQueueItem] ?? currentTasks[0];
  const otherTasks = currentTasks.filter((_, idx) => idx !== selectedQueueItem);

  const recallMinutesBudget = Math.round(selectedBudget * 0.3);
  const codingMinutesBudget = selectedBudget - recallMinutesBudget;

  return (
    <div className="w-full relative my-12" id="walkthrough-theater">
      {/* Outer Workspace Window Frame */}
      <div className="relative rounded-card border border-line-strong bg-surface shadow-2xl backdrop-blur-xl overflow-hidden">
        {/* Top Window Bar & Hardware Bezel */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-line bg-muted-surface">
          {/* macOS window beads */}
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#e25c50]/90 border border-[#c94539]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#eab308]/90 border border-[#ca8a04]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]/90 border border-[#16a34a]" />
            <span className="ml-3 hidden sm:inline-block font-mono text-[11px] text-subtle">
              lc-tracker · workspace simulation
            </span>
          </div>

          {/* Central simulated address bar */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-md border border-line bg-canvas font-mono text-[11px] text-muted max-w-[280px] sm:max-w-[340px] truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-subtle">app.lctracker.dev/</span>
            <span className="text-foreground font-medium">{activeStep.route}</span>
          </div>

          {/* Top Right Live Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setInteractiveMode((prev) => !prev);
                if (!interactiveMode) setIsPlaying(false);
              }}
              className={cn(
                "hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md font-mono text-[11px] transition-colors border cursor-pointer",
                interactiveMode
                  ? "bg-accent text-on-accent border-accent font-medium shadow-xs"
                  : "text-muted hover:text-foreground bg-surface border-line"
              )}
              title={interactiveMode ? "Click to resume automated tour" : "Take manual control"}
            >
              <Sparkles size={12} />
              {interactiveMode ? "Sandbox Active" : "Interactive Mode"}
            </button>

            <button
              type="button"
              onClick={() => setIsMuted((m) => !m)}
              className="p-1.5 rounded-md text-subtle hover:text-foreground transition-colors cursor-pointer"
              aria-label={isMuted ? "Audio commentary is muted" : "Audio enabled"}
            >
              {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>
        </div>

        {/* Step Navigation Tabs Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-line bg-surface">
          {STEPS.map((step, idx) => {
            const isActive = idx === activeStepIndex;
            const Icon = step.icon;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => handleStepSelect(idx)}
                className={cn(
                  "relative flex flex-col items-start p-3 sm:p-4 text-left transition-all border-b md:border-b-0 md:border-r border-line last:border-r-0 cursor-pointer",
                  isActive
                    ? "bg-canvas/50 border-b-accent md:border-b-0"
                    : "hover:bg-muted-surface/40"
                )}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span
                    className={cn(
                      "font-mono text-[10px] tracking-wider uppercase",
                      isActive ? "text-accent font-semibold" : "text-subtle"
                    )}
                  >
                    {step.badge}
                  </span>
                  <Icon
                    size={14}
                    className={isActive ? "text-accent" : "text-subtle"}
                  />
                </div>
                <h4
                  className={cn(
                    "text-xs sm:text-sm font-semibold truncate w-full",
                    isActive ? "text-foreground" : "text-muted"
                  )}
                >
                  {step.title}
                </h4>
                <p className="hidden lg:block text-[11px] text-subtle line-clamp-1 mt-0.5">
                  {step.subtitle}
                </p>

                {/* Progress bar beneath active tab */}
                {isActive && !interactiveMode && (
                  <motion.div
                    className="absolute bottom-0 left-0 h-[2px] bg-accent"
                    style={{ width: `${stepProgress}%` }}
                    transition={{ ease: "linear" }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Main Walkthrough Screen Arena */}
        <div className="relative min-h-[460px] sm:min-h-[520px] p-4 sm:p-8 bg-canvas flex flex-col justify-between overflow-hidden">
          {/* Animated Simulated Cursor in Tour Mode */}
          <AnimatePresence>
            {cursorPos.opacity > 0 && !interactiveMode && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  left: `${cursorPos.x}%`,
                  top: `${cursorPos.y}%`,
                  scale: cursorPos.clicking ? 0.85 : 1,
                }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 0.6,
                  ease: [0.16, 1, 0.3, 1],
                  scale: { duration: 0.15 },
                }}
                className="absolute z-40 pointer-events-none -ml-2 -mt-2"
              >
                <div className="relative">
                  <MousePointer
                    size={20}
                    className="text-accent fill-accent filter drop-shadow-md"
                  />
                  {cursorPos.clicking && (
                    <motion.span
                      initial={{ scale: 0.5, opacity: 1 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute -top-1 -left-1 w-6 h-6 rounded-full border-2 border-accent"
                    />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Interactive Screen Content for Current Step */}
          <div className="relative z-10 w-full max-w-4xl mx-auto my-auto">
            <AnimatePresence mode="wait">
              {/* ========================================================================= */}
              {/* SCENE 1: TODAY'S STUDY PLAN & SEQUENCE (Dashboard) */}
              {/* ========================================================================= */}
              {activeStepIndex === 0 && (
                <motion.div
                  key="scene-dashboard"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-6"
                >
                  {/* PageHeader replication */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        Today’s study plan
                      </h3>
                      <p className="text-xs text-subtle mt-0.5">
                        Saturday, October 10 · Bounded practice session
                      </p>
                    </div>

                    {/* Interactive Budget Presets */}
                    <div className="flex items-center gap-1.5 p-1 rounded-md border border-line bg-surface self-start sm:self-auto">
                      {([30, 45, 60] as const).map((mins) => (
                        <button
                          key={mins}
                          type="button"
                          onClick={() => {
                            setInteractiveMode(true);
                            setSelectedBudget(mins);
                            setSelectedQueueItem(0);
                          }}
                          className={cn(
                            "px-2.5 py-1 rounded font-mono text-xs transition-all cursor-pointer",
                            selectedBudget === mins
                              ? "bg-accent text-on-accent font-semibold shadow-xs"
                              : "text-muted hover:text-foreground"
                          )}
                        >
                          {mins}m budget
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Two-column layout matching study-layout */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    {/* Left: Study Main Sequence */}
                    <div className="md:col-span-8 space-y-4">
                      <div className="plan-sequence-heading flex items-center justify-between pb-1">
                        <h4 className="register-label">Today’s sequence</h4>
                        <span className="font-mono text-[10px] text-subtle">
                          {selectedBudget} min planned
                        </span>
                      </div>

                      {/* Primary Next Action Card (.study-next) */}
                      <section className="study-next p-5 rounded-card border border-line-strong bg-surface relative space-y-3 shadow-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <TraceIndex active>{primaryTask.index}</TraceIndex>
                            <span className="flex items-center gap-2 text-xs text-accent font-medium">
                              <span className="status-node bg-accent" aria-hidden="true" />
                              {primaryTask.kindTag}
                            </span>
                          </div>
                          <span className="font-mono text-[10px] text-subtle">
                            {primaryTask.category} / {primaryTask.minutes} min
                          </span>
                        </div>

                        <div>
                          <h4 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                            {primaryTask.title}
                          </h4>
                          <p className="text-xs text-muted leading-relaxed mt-1">
                            {primaryTask.reason}
                          </p>
                        </div>

                        <div className="pt-2 flex items-center justify-between gap-4 border-t border-line">
                          <p className="font-mono text-[11px] text-subtle">
                            {primaryTask.category} / {primaryTask.difficulty} / {primaryTask.minutes} min
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setInteractiveMode(true);
                              if (primaryTask.kindType === "recall") {
                                setActiveStepIndex(1);
                              } else {
                                setActiveStepIndex(2);
                              }
                            }}
                            className="brand-button-primary inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-medium cursor-pointer shadow-xs hover:opacity-95 transition-all"
                          >
                            <span>
                              {primaryTask.kindType === "recall"
                                ? "Start recall check"
                                : "Start coding block"}
                            </span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </section>

                      {/* Interactive Subsequent Task Sequence List */}
                      <div className="space-y-2 pt-1">
                        {otherTasks.map((task) => {
                          const realIndex = currentTasks.findIndex((t) => t.id === task.id);
                          return (
                            <button
                              key={task.id}
                              type="button"
                              onClick={() => {
                                setInteractiveMode(true);
                                setSelectedQueueItem(realIndex);
                              }}
                              className="w-full flex items-center justify-between p-3 rounded-card border border-line bg-surface/70 hover:bg-surface hover:border-line-strong text-left text-xs transition-all cursor-pointer"
                            >
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-xs w-5 text-center text-subtle">
                                  {task.index}
                                </span>
                                <div>
                                  <span className="font-medium text-foreground block">
                                    {task.title}
                                  </span>
                                  <span className="text-[11px] text-subtle">
                                    {task.kindTag}
                                  </span>
                                </div>
                              </div>
                              <span className="font-mono text-[11px] text-subtle">
                                {task.category} / {task.difficulty} / {task.minutes} min
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Study Sidebar (Budget & Schedule) */}
                    <div className="md:col-span-4 p-5 rounded-card border border-line bg-surface space-y-4">
                      <div>
                        <p className="register-label">Time available today</p>
                        <p className="mt-2 mb-3">
                          <span className="register-value text-4xl sm:text-5xl font-bold leading-none text-foreground">
                            {selectedBudget}
                          </span>
                          <span className="text-xs text-muted ml-2">min left</span>
                        </p>
                        <BudgetMeter
                          spent={selectedBudget === 30 ? 10 : selectedBudget === 45 ? 15 : 20}
                          total={selectedBudget}
                        />
                        <div className="flex justify-between gap-2 font-mono text-[11px] text-subtle mt-2">
                          <span>
                            {selectedBudget === 30 ? "10" : selectedBudget === 45 ? "15" : "20"} min used
                          </span>
                          <span>{selectedBudget} min target</span>
                        </div>
                      </div>

                      {/* Proportional Allocation Breakdown Meter (F4) */}
                      <div className="pt-3 border-t border-line space-y-2.5">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="text-subtle font-medium">Budget Split</span>
                          <span className="text-foreground font-semibold">30% Recall · 70% Code</span>
                        </div>

                        {/* Proportional Segmented Meter Bar */}
                        <div
                          className="w-full h-2.5 rounded-full bg-muted-surface border border-line overflow-hidden flex"
                          role="img"
                          aria-label="Proportional budget breakdown"
                        >
                          <div
                            className="h-full bg-accent transition-all duration-300"
                            style={{ width: "30%" }}
                            title={`Recall warm-up: ${recallMinutesBudget} min`}
                          />
                          <div
                            className="h-full bg-foreground/35 transition-all duration-300"
                            style={{ width: "70%" }}
                            title={`Coding block: ${codingMinutesBudget} min`}
                          />
                        </div>

                        <div className="flex items-center justify-between font-mono text-[10px] text-subtle">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-accent inline-block" />
                            Recall: {recallMinutesBudget} min
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-foreground/35 inline-block" />
                            Coding: {codingMinutesBudget} min
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-line space-y-2">
                        <span className="register-label block">Schedule rule</span>
                        <p className="text-xs text-muted leading-relaxed">
                          Mon–Fri active · Weekend rest protected. Study debt is never accumulated.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ========================================================================= */}
              {/* SCENE 2: ACTIVE RECALL (RecallPage) */}
              {/* ========================================================================= */}
              {activeStepIndex === 1 && (
                <motion.div
                  key="scene-recall"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  {/* Recall Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-line">
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-accent font-semibold uppercase tracking-wider">
                          01 / Recall before looking
                        </span>
                        {/* Stage Progression Indicator (F5) */}
                        <div className="flex items-center gap-1 font-mono text-[9px] text-subtle">
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded border transition-colors",
                              !isRecallFlipped
                                ? "border-accent bg-accent/15 text-accent font-semibold"
                                : "border-line bg-surface text-subtle"
                            )}
                          >
                            01 Retrieve
                          </span>
                          <span>→</span>
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded border transition-colors",
                              isRecallFlipped && !recallRating
                                ? "border-accent bg-accent/15 text-accent font-semibold"
                                : "border-line bg-surface text-subtle"
                            )}
                          >
                            02 Compare
                          </span>
                          <span>→</span>
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded border transition-colors",
                              recallRating
                                ? "border-accent bg-accent/15 text-accent font-semibold"
                                : "border-line bg-surface text-subtle"
                            )}
                          >
                            03 Record
                          </span>
                        </div>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                        <span className="font-mono mr-2 text-foreground">33.</span>
                        Search in Rotated Sorted Array
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-subtle inline-flex gap-1.5 items-center">
                        <Clock size={14} className="text-accent" />
                        {formatMinSec(recallElapsed)} · aim for 3 min
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsRecallPaused((p) => !p)}
                        className="text-xs font-mono text-accent hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {isRecallPaused ? <Play size={12} /> : <Pause size={12} />}
                        {isRecallPaused ? "Resume" : "Pause"}
                      </button>
                    </div>
                  </div>

                  {/* Split writing layout matching recall-writing-layout */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                    {/* Left: Reasoning Prompts Guide */}
                    <aside className="md:col-span-4 p-4 rounded-card border border-line bg-surface space-y-3">
                      <p className="register-label">Check your reasoning</p>
                      <ol className="space-y-2 text-xs text-body leading-relaxed list-decimal list-inside">
                        <li>Which approach would you choose, and what clues lead you to it?</li>
                        <li>What invariant makes the partition monotonic?</li>
                        <li>What are the exact time and space costs?</li>
                        <li>Which edge case (e.g. 2 elements) breaks boundary logic?</li>
                      </ol>
                    </aside>

                    {/* Right: Notebook Writing Sheet */}
                    <div className="md:col-span-8 p-4 rounded-card border border-line bg-surface space-y-3">
                      <label htmlFor="recall-answer-sim" className="block text-xs font-medium text-body">
                        Your attempt · explanation or pseudocode
                      </label>
                      <textarea
                        id="recall-answer-sim"
                        rows={6}
                        value={recallText}
                        onChange={(e) => {
                          setInteractiveMode(true);
                          setRecallText(e.target.value);
                        }}
                        className="w-full font-mono text-xs text-foreground bg-canvas border border-line rounded-md p-3 leading-relaxed resize-none focus:outline-none focus:border-line-strong"
                        placeholder="Write what you remember without viewing the code..."
                      />

                      {!isRecallFlipped ? (
                        <div className="flex items-center justify-between pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setInteractiveMode(true);
                              setIsRecallFlipped(true);
                            }}
                            className="brand-button-primary inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-medium cursor-pointer shadow-xs"
                          >
                            <Brain size={13} />
                            <span>Compare with a reference</span>
                          </button>
                          <span className="text-[11px] text-subtle font-mono">
                            Original notes preserved
                          </span>
                        </div>
                      ) : (
                        /* Revealed Invariant Reference & Rating */
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="pt-3 border-t border-line space-y-3"
                        >
                          <div className="p-3.5 rounded-md bg-canvas border border-line text-xs space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] text-accent font-semibold block uppercase tracking-wider">
                                Verified Invariant
                              </span>
                              {/* Reference Language Toggle */}
                              <div className="flex items-center gap-1 font-mono text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => setRecallReferenceLang("python")}
                                  className={cn(
                                    "px-1.5 py-0.5 rounded cursor-pointer transition-colors",
                                    recallReferenceLang === "python"
                                      ? "bg-accent text-on-accent font-semibold"
                                      : "text-subtle hover:text-foreground"
                                  )}
                                >
                                  Python
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setRecallReferenceLang("cpp")}
                                  className={cn(
                                    "px-1.5 py-0.5 rounded cursor-pointer transition-colors",
                                    recallReferenceLang === "cpp"
                                      ? "bg-accent text-on-accent font-semibold"
                                      : "text-subtle hover:text-foreground"
                                  )}
                                >
                                  C++
                                </button>
                              </div>
                            </div>

                            <p className="text-foreground font-mono text-[11px] leading-relaxed">
                              nums[left] &lt;= nums[mid] guarantees the left half is sorted.
                              Test if nums[left] &lt;= target &lt; nums[mid] to discard right;
                              otherwise discard left.
                            </p>

                            {/* Reference Invariant Code Preview */}
                            <div className="rounded border border-line bg-surface/70 p-2 font-mono text-[10px] text-foreground overflow-x-auto leading-relaxed">
                              {recallReferenceLang === "python" ? (
                                <pre>
                                  <span className="text-subtle"># Monotonic partition invariant</span><br />
                                  <span className="text-palette-code-keyword font-bold">if</span> nums[left] &lt;= nums[mid]:<br />
                                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-palette-code-keyword font-bold">if</span> nums[left] &lt;= target &lt; nums[mid]: right = mid - 1<br />
                                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-palette-code-keyword font-bold">else</span>: left = mid + 1<br />
                                  <span className="text-palette-code-keyword font-bold">else</span>:<br />
                                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-palette-code-keyword font-bold">if</span> nums[mid] &lt; target &lt;= nums[right]: left = mid + 1<br />
                                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-palette-code-keyword font-bold">else</span>: right = mid - 1
                                </pre>
                              ) : (
                                <pre>
                                  <span className="text-subtle">// Monotonic partition invariant</span><br />
                                  <span className="text-palette-code-keyword font-bold">if</span> (nums[l] &lt;= nums[mid]) &#123;<br />
                                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-palette-code-keyword font-bold">if</span> (nums[l] &lt;= target &amp;&amp; target &lt; nums[mid]) r = mid - 1;<br />
                                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-palette-code-keyword font-bold">else</span> l = mid + 1;<br />
                                  &#125; <span className="text-palette-code-keyword font-bold">else</span> &#123;<br />
                                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-palette-code-keyword font-bold">if</span> (nums[mid] &lt; target &amp;&amp; target &lt;= nums[r]) l = mid + 1;<br />
                                  &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-palette-code-keyword font-bold">else</span> r = mid - 1;<br />
                                  &#125;
                                </pre>
                              )}
                            </div>
                            <div className="font-mono text-[10px] text-subtle">
                              Complexity: Time O(log n) · Space O(1) auxiliary
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                            <span className="text-xs text-subtle">
                              Rate what you remembered from memory:
                            </span>
                            <div className="flex gap-2">
                              {[
                                {
                                  key: "recalled",
                                  ariaLabel: "Recalled without reference",
                                  label: "Recalled without reference",
                                  tone: "bg-success/15 border-success text-success",
                                },
                                {
                                  key: "partial",
                                  ariaLabel: "Needed hints",
                                  label: "Needed hints",
                                  tone: "bg-warning/15 border-warning text-warning",
                                },
                                {
                                  key: "failed",
                                  ariaLabel: "Did not recall",
                                  label: "Did not recall",
                                  tone: "bg-danger/15 border-danger text-danger",
                                },
                              ].map((btn) => (
                                <button
                                  key={btn.key}
                                  type="button"
                                  aria-label={btn.ariaLabel}
                                  onClick={() => {
                                    setInteractiveMode(true);
                                    setRecallRating(btn.key);
                                    setTimeout(() => setActiveStepIndex(2), 1200);
                                  }}
                                  className={cn(
                                    "px-2.5 py-1.5 rounded-md border text-[11px] font-mono transition-all cursor-pointer text-left",
                                    recallRating === btn.key
                                      ? btn.tone
                                      : "border-line bg-surface text-muted hover:text-foreground"
                                  )}
                                >
                                  <span className="font-semibold block leading-tight">{btn.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>

                          {recallRating && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="text-xs text-success border-l-2 border-success bg-success/5 px-3 py-2 space-y-0.5 rounded-r"
                            >
                              <p className="font-medium">
                                Approach recorded. Your independent coding verification remains separate.
                              </p>
                              <p className="text-[11px] text-muted italic">
                                Recall success never counts as a coding pass.
                              </p>
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ========================================================================= */}
              {/* SCENE 3: INDEPENDENT CODING ARENA (Timer) */}
              {/* ========================================================================= */}
              {activeStepIndex === 2 && (
                <motion.div
                  key="scene-timer"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  {/* Problem Banner */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-line">
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                        <span className="font-mono mr-2 text-foreground">42.</span>
                        Trapping Rain Water
                      </h3>
                      <div className="flex items-center gap-2 font-mono text-[11px] text-subtle mt-0.5">
                        <span>Two Pointers</span>
                        <span className="text-line-strong">/</span>
                        <span className="text-danger font-semibold">Hard</span>
                        <span className="text-line-strong">/</span>
                        <span>25 min planned block</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 p-1 rounded-md border border-line bg-surface font-mono text-xs">
                        {(["python", "cpp", "ts"] as const).map((lang) => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => {
                              setInteractiveMode(true);
                              setSelectedLang(lang);
                            }}
                            className={cn(
                              "px-2 py-0.5 rounded text-[11px] uppercase transition-colors cursor-pointer",
                              selectedLang === lang
                                ? "bg-accent text-on-accent font-semibold"
                                : "text-muted hover:text-foreground"
                            )}
                          >
                            {lang}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Authentic timer console */}
                  <div className="timer-console p-5 rounded-card border border-line bg-surface space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-3">
                        <TraceIndex active>C</TraceIndex>
                        <span className="text-xs text-muted">
                          Session in progress · Draft saved locally
                        </span>
                      </span>
                      <span className="font-mono text-[10px] text-subtle">
                        LeetCode 42
                      </span>
                    </div>

                    {/* Timer Display & Ruler */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-y border-line">
                      <div>
                        <div className="timer-display font-mono text-4xl sm:text-5xl font-bold text-foreground">
                          <span>22</span>
                          <span className="timer-seconds text-accent">:45</span>
                        </div>
                        <p className="font-mono text-[10px] text-subtle mt-1">
                          22 min elapsed / 25 min planned block · 22:45 remaining
                        </p>
                      </div>

                      {/* Ruler ticks visualization */}
                      <div className="timer-ruler flex items-center gap-1.5 py-2">
                        {Array.from({ length: 9 }, (_, i) => {
                          const tickMin = i * 3;
                          const isUsed = tickMin <= 21;
                          return (
                            <div key={i} className="flex flex-col items-center gap-1">
                              <span
                                className={cn(
                                  "w-1 h-5 rounded-full transition-colors",
                                  isUsed ? "bg-accent" : "bg-line-strong"
                                )}
                              />
                              <span className="font-mono text-[9px] text-subtle">{tickMin}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Code Window with Syntax Coloring */}
                    <div className="rounded-md border border-line bg-canvas p-3 font-mono text-xs text-foreground overflow-x-auto leading-relaxed">
                      {selectedLang === "python" && (
                        <pre>
                          <span className="text-subtle">01 </span><span className="text-palette-code-keyword font-bold">class</span> Solution:<br />
                          <span className="text-subtle">02 </span>    <span className="text-palette-code-keyword font-bold">def</span> <span className="text-palette-code-function font-semibold">trap</span>(self, height: list[int]) -&gt; int:<br />
                          <span className="text-subtle">03 </span>        left, right = 0, len(height) - 1<br />
                          <span className="text-subtle">04 </span>        left_max, right_max = height[left], height[right]<br />
                          <span className="text-subtle">05 </span>        volume = 0<br />
                          <span className="text-subtle">06 </span>        <span className="text-palette-code-keyword font-bold">while</span> left &lt; right:<br />
                          <span className="text-subtle">07 </span>            <span className="text-palette-code-keyword font-bold">if</span> left_max &lt; right_max:<br />
                          <span className="text-subtle">08 </span>                left += 1<br />
                          <span className="text-subtle">09 </span>                left_max = max(left_max, height[left])<br />
                          <span className="text-subtle">10 </span>                volume += left_max - height[left]<br />
                          <span className="text-subtle">11 </span>            <span className="text-palette-code-keyword font-bold">else</span>:<br />
                          <span className="text-subtle">12 </span>                right -= 1<br />
                          <span className="text-subtle">13 </span>                right_max = max(right_max, height[right])<br />
                          <span className="text-subtle">14 </span>                volume += right_max - height[right]<br />
                          <span className="text-subtle">15 </span>        <span className="text-palette-code-keyword font-bold">return</span> volume
                        </pre>
                      )}
                      {selectedLang === "cpp" && (
                        <pre>
                          <span className="text-subtle">01 </span><span className="text-palette-code-keyword font-bold">int</span> <span className="text-palette-code-function font-semibold">trap</span>(vector&lt;<span className="text-palette-code-keyword font-bold">int</span>&gt;&amp; h) &#123;<br />
                          <span className="text-subtle">02 </span>    <span className="text-palette-code-keyword font-bold">int</span> l = 0, r = h.size() - 1, l_max = h[l], r_max = h[r], ans = 0;<br />
                          <span className="text-subtle">03 </span>    <span className="text-palette-code-keyword font-bold">while</span> (l &lt; r) &#123;<br />
                          <span className="text-subtle">04 </span>        <span className="text-palette-code-keyword font-bold">if</span> (l_max &lt; r_max) &#123; l_max = max(l_max, h[++l]); ans += l_max - h[l]; &#125;<br />
                          <span className="text-subtle">05 </span>        <span className="text-palette-code-keyword font-bold">else</span> &#123; r_max = max(r_max, h[--r]); ans += r_max - h[r]; &#125;<br />
                          <span className="text-subtle">06 </span>    &#125;<br />
                          <span className="text-subtle">07 </span>    <span className="text-palette-code-keyword font-bold">return</span> ans;<br />
                          <span className="text-subtle">08 </span>&#125;
                        </pre>
                      )}
                      {selectedLang === "ts" && (
                        <pre>
                          <span className="text-subtle">01 </span><span className="text-palette-code-keyword font-bold">function</span> <span className="text-palette-code-function font-semibold">trap</span>(height: number[]): number &#123;<br />
                          <span className="text-subtle">02 </span>  <span className="text-palette-code-keyword font-bold">let</span> left = 0, right = height.length - 1, leftMax = height[left], rightMax = height[right], res = 0;<br />
                          <span className="text-subtle">03 </span>  <span className="text-palette-code-keyword font-bold">while</span> (left &lt; right) &#123;<br />
                          <span className="text-subtle">04 </span>    <span className="text-palette-code-keyword font-bold">if</span> (leftMax &lt; rightMax) &#123; leftMax = Math.max(leftMax, height[++left]); res += leftMax - height[left]; &#125;<br />
                          <span className="text-subtle">05 </span>    <span className="text-palette-code-keyword font-bold">else</span> &#123; rightMax = Math.max(rightMax, height[--right]); res += rightMax - height[right]; &#125;<br />
                          <span className="text-subtle">06 </span>  &#125;<br />
                          <span className="text-subtle">07 </span>  <span className="text-palette-code-keyword font-bold">return</span> res;<br />
                          <span className="text-subtle">08 </span>&#125;
                        </pre>
                      )}
                    </div>

                    {/* Actions & Outcome Recording */}
                    {sessionPhase === "coding" ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleRunTests}
                            disabled={testRunStatus === "running"}
                            className="brand-button-secondary px-3 py-1.5 rounded-md text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                          >
                            {testRunStatus === "running" ? (
                              <>
                                <RefreshCw size={12} className="animate-spin" />
                                <span>Running 48 tests…</span>
                              </>
                            ) : testRunStatus === "passed" ? (
                              <>
                                <CheckCircle2 size={13} className="text-success" />
                                <span className="text-success font-medium">All 48 Tests Passed</span>
                              </>
                            ) : (
                              <>
                                <Play size={12} className="fill-current" />
                                <span>Run Test Suite</span>
                              </>
                            )}
                          </button>
                          {testRunStatus === "passed" && (
                            <span className="font-mono text-[10px] text-subtle hidden sm:inline-block">
                              48/48 Test Cases Passed · Runtime: 18ms · O(1) auxiliary space
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setInteractiveMode(true);
                            setSessionPhase("assessment");
                          }}
                          className="brand-button-primary inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-medium cursor-pointer shadow-xs"
                        >
                          <CircleCheck size={14} />
                          <span>I’m Done · Record Outcome</span>
                        </button>
                      </div>
                    ) : (
                      /* Outcome Assessment Modal (F6) */
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-md border border-line bg-surface space-y-3"
                      >
                        <p className="register-label">02 / Record the outcome</p>
                        <h4 className="text-sm font-semibold text-foreground">
                          How did Trapping Rain Water go?
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {[
                            {
                              id: "independent",
                              title: "Solved independently",
                              desc: "Tests passed, 0 hints; can explain invariant & costs.",
                              isPrimary: true,
                            },
                            {
                              id: "passed",
                              title: "Passed with help or gaps",
                              desc: "Passed tests · Used hints or followed editorial.",
                              isPrimary: false,
                            },
                            {
                              id: "unfinished",
                              title: "Not finished",
                              desc: "Time expired or paused; continue in another block.",
                              isPrimary: false,
                            },
                            {
                              id: "failed",
                              title: "Tests failed",
                              desc: "Solution failed edge cases or timed out; needs repair block.",
                              isPrimary: false,
                            },
                          ].map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setInteractiveMode(true);
                                setCodingOutcome(item.id);
                                setTimeout(() => setActiveStepIndex(3), 1000);
                              }}
                              className={cn(
                                "p-3 rounded-md border text-left text-xs transition-all cursor-pointer relative",
                                item.isPrimary
                                  ? codingOutcome === item.id
                                    ? "border-accent bg-accent/15 ring-1 ring-accent"
                                    : "border-accent/70 bg-accent/5 hover:border-accent"
                                  : codingOutcome === item.id
                                    ? "border-accent bg-accent/10"
                                    : "border-line bg-canvas hover:border-line-strong"
                              )}
                            >
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-semibold text-foreground block">
                                  {item.title}
                                </span>
                                {item.isPrimary && (
                                  <span className="font-mono text-[9px] bg-accent/20 text-accent px-1.5 py-0.2 rounded font-medium">
                                    Target
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-muted block leading-relaxed">
                                {item.desc}
                              </span>
                            </button>
                          ))}
                        </div>

                        {codingOutcome && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-xs text-success border-l-2 border-success bg-success/5 px-3 py-1.5"
                          >
                            Verified coding pass recorded. Retention check scheduled in 7+ days.
                          </motion.div>
                        )}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* ========================================================================= */}
              {/* SCENE 4: LEARNING EVIDENCE & RETENTION CURVES (Analytics) */}
              {/* ========================================================================= */}
              {activeStepIndex === 3 && (
                <motion.div
                  key="scene-analytics"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  {/* PageHeader replication */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                        Learning evidence
                      </h3>
                      <p className="text-xs text-subtle mt-0.5">
                        Track delayed implementation, recall, transfer to new problems, and sustainable study time.
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Streak Ribbon with Grace Indicator (F7) */}
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-accent/40 bg-accent/10 text-accent font-mono text-[11px] font-medium">
                        <Flame size={13} className="fill-accent" />
                        <span>12-day streak · Weekly rest &amp; grace day protected</span>
                      </span>

                      <span className="font-mono text-xs text-subtle">
                        Last 14 days · Verified Telemetry
                      </span>
                    </div>
                  </div>

                  {/* Two-column layout matching evidence-overview */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                    {/* Left: 14-day study chart (evidence-time) */}
                    <div className="md:col-span-6 p-4 sm:p-5 rounded-card border border-line bg-surface space-y-3">
                      <p className="register-label">Recorded / last 14 days</p>

                      <p className="evidence-time-value flex items-baseline gap-2">
                        <span className="register-value text-4xl sm:text-5xl font-bold text-foreground">
                          385
                        </span>
                        <span className="text-xs text-muted">min</span>
                      </p>

                      {/* 14-Day Bar Chart (F7) */}
                      <div className="study-chart flex gap-1.5 sm:gap-2 items-end h-28 pt-2">
                        {FOURTEEN_DAY_DATA.map((entry, idx) => {
                          const heightPct = entry.mins ? Math.round((entry.mins / 60) * 100) : 4;
                          const isHovered = hoveredBarIndex === idx;
                          return (
                            <div
                              key={idx}
                              onMouseEnter={() => setHoveredBarIndex(idx)}
                              onMouseLeave={() => setHoveredBarIndex(null)}
                              className="flex-1 h-full flex flex-col justify-end items-center gap-1 group relative cursor-pointer"
                            >
                              {/* Hover Tooltip displaying minutes and date */}
                              {isHovered && (
                                <div className="absolute -top-9 z-20 px-2 py-1 rounded bg-foreground text-canvas font-mono text-[10px] whitespace-nowrap shadow-md pointer-events-none">
                                  {entry.day}: {entry.mins > 0 ? `${entry.mins} min` : "Rest day"}
                                </div>
                              )}

                              <div
                                className={cn(
                                  "w-full rounded-xs transition-all",
                                  entry.mins > 0
                                    ? isHovered
                                      ? "bg-accent opacity-100 ring-1 ring-accent"
                                      : "bg-accent hover:opacity-90"
                                    : "bg-line"
                                )}
                                style={{ height: `${heightPct}%` }}
                              />
                              <span className="font-mono text-[9px] text-subtle">
                                {idx + 1}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Active readout when a bar is hovered */}
                      <div className="flex items-center justify-between font-mono text-[10px] text-subtle pt-1">
                        <span>
                          {hoveredBarIndex !== null
                            ? `${FOURTEEN_DAY_DATA[hoveredBarIndex].day}: ${
                                FOURTEEN_DAY_DATA[hoveredBarIndex].mins > 0
                                  ? `${FOURTEEN_DAY_DATA[hoveredBarIndex].mins} min recorded`
                                  : "Rest day (0 min)"
                              }`
                            : "Hover bars to inspect daily study minutes"}
                        </span>
                        <span>14 days tracked</span>
                      </div>

                      <p className="text-[11px] text-subtle leading-relaxed pt-2 border-t border-line">
                        <strong className="text-foreground">18 problems</strong> have independent passes
                        at least 7 days apart. Rest days respected without penalty.
                      </p>
                    </div>

                    {/* Right: Three evidence checks cards (R, C, V) (F7) */}
                    <div className="md:col-span-6 space-y-2.5">
                      {[
                        {
                          kind: "R",
                          title: "Recall checks",
                          rate: "88%",
                          detail: "22/25 recalled in the last 14 days without opening editorial code",
                          tag: "Unassisted retrieval",
                        },
                        {
                          kind: "C",
                          title: "Delayed coding",
                          rate: "81%",
                          detail: "17/21 independent passes after an unassisted gap of at least 7 days",
                          tag: "Retention gap >= 7 days",
                        },
                        {
                          kind: "V",
                          title: "Unseen variations",
                          rate: "76%",
                          detail: "13/17 independent passes with topic tags hidden to verify transfer",
                          tag: "Tag-blind transfer",
                        },
                      ].map((item) => (
                        <div
                          key={item.kind}
                          className="evidence-check flex items-start gap-3.5 p-3.5 rounded-card border border-line bg-surface hover:border-line-strong transition-colors"
                        >
                          <span className="w-7 h-7 rounded-md bg-muted-surface border border-line font-mono text-xs font-bold text-accent flex items-center justify-center shrink-0">
                            {item.kind}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <h5 className="register-label">{item.title}</h5>
                                <span className="font-mono text-[9px] text-subtle hidden sm:inline-block">
                                  ({item.tag})
                                </span>
                              </div>
                              <span className="register-value text-base font-bold text-foreground">
                                {item.rate}
                              </span>
                            </div>
                            <p className="text-[11px] text-subtle leading-relaxed mt-1">
                              {item.detail}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Player Timeline & Control Ribbon (F8) */}
          <div className="relative z-10 pt-4 mt-6 border-t border-line flex flex-col gap-3">
            {/* Interactive Timeline Scrubber Track */}
            <div
              className="w-full h-1.5 bg-muted-surface border border-line rounded-full overflow-hidden cursor-pointer relative group"
              onClick={handleTimelineScrub}
              title="Click anywhere to scrub walkthrough"
              role="slider"
              aria-label="Walkthrough timeline progress"
              aria-valuemin={0}
              aria-valuemax={totalTourSeconds}
              aria-valuenow={currentTotalSeconds}
            >
              <div
                className="h-full bg-accent transition-all duration-150 group-hover:bg-accent/80"
                style={{ width: `${(currentTotalSeconds / totalTourSeconds) * 100}%` }}
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              {/* Play/Pause & Scrub Controls */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setInteractiveMode(false);
                    setIsPlaying((p) => !p);
                  }}
                  className="w-8 h-8 rounded-full border border-line bg-surface hover:bg-muted-surface flex items-center justify-center text-foreground transition-all shadow-xs cursor-pointer"
                  aria-label={isPlaying ? "Pause walkthrough" : "Play walkthrough"}
                >
                  {isPlaying ? <Pause size={14} /> : <Play size={14} className="ml-0.5 fill-current" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveStepIndex(0);
                    setStepProgress(0);
                    setInteractiveMode(false);
                    setIsPlaying(true);
                  }}
                  className="w-8 h-8 rounded-full border border-line bg-surface hover:bg-muted-surface flex items-center justify-center text-subtle hover:text-foreground transition-all cursor-pointer"
                  aria-label="Restart tour"
                  title="Restart walkthrough tour"
                >
                  <RotateCcw size={13} />
                </button>

                <div className="font-mono text-xs text-muted flex items-center gap-1.5 ml-1">
                  <span className="text-foreground font-semibold">
                    {formatMinSec(currentTotalSeconds)}
                  </span>
                  <span className="text-subtle">/</span>
                  <span>{formatMinSec(totalTourSeconds)}</span>
                </div>
              </div>

              {/* Current Step Commentary Caption */}
              <div className="text-xs text-subtle font-mono truncate max-w-sm sm:max-w-md">
                <span className="text-accent font-semibold mr-1.5">●</span>
                {activeStepIndex === 0 && "Step 01: Budgeting daily study blocks without burn-out"}
                {activeStepIndex === 1 && "Step 02: Dual-check protocol: approach retrieval before code"}
                {activeStepIndex === 2 && "Step 03: Timed coding arena with strict unassisted accountability"}
                {activeStepIndex === 3 && "Step 04: Retention curves & delayed unassisted verification"}
              </div>

              {/* Direct Launch CTA */}
              <div className="flex items-center gap-2">
                <a
                  href="/login"
                  className="brand-button-primary px-3.5 py-1.5 rounded-md text-xs font-medium inline-flex items-center gap-1.5 shadow-xs"
                >
                  <span>Try In Workspace</span>
                  <ArrowRight size={13} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoWalkthrough;
