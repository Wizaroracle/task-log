import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
  CheckCircle2,
  Bug,
  Search,
  Folder,
  Image as ImageIcon,
  Video as VideoIcon,
  ArrowRight,
  X,
  LayoutGrid,
  CalendarRange,
  Building2,
  FolderKanban,
  ArrowUpNarrowWide,
  BookOpen,
  Plus,
  Pencil,
  Trash2,
  Zap,
  Eye,
  RefreshCw,
} from "lucide-react";
import { PROFILE } from "./utils/profile-data";
import type { CompareItem, Entry, Task } from "./utils/entries/entries";
import { supabase } from "./utils/supabase";
import { AddEntryModal, type InProgressItem } from "./components/AddEntryModal";

// ════════════════════════════════════════════════════════════════════
// 2. TYPE / STATUS META
// ════════════════════════════════════════════════════════════════════
const TYPE_META = {
  feature: {
    label: "Feature",
    icon: ArrowUpNarrowWide,
    text: "text-emerald-400",
    bg: "bg-emerald-400/10",
    ring: "ring-emerald-400/20",
  },
  bugfix: {
    label: "Bug Fix",
    icon: Bug,
    text: "text-orange-400",
    bg: "bg-orange-400/10",
    ring: "ring-orange-400/20",
  },
  task: {
    label: "Task",
    icon: CheckCircle2,
    text: "text-teal-400",
    bg: "bg-teal-400/10",
    ring: "ring-teal-400/20",
  },
  milestone: {
    label: "Milestone",
    icon: ArrowRight,
    text: "text-yellow-400",
    bg: "bg-yellow-400/10",
    ring: "ring-yellow-400/20",
  },
  learning: {
    label: "Learning",
    icon: BookOpen,
    text: "text-violet-400",
    bg: "bg-violet-400/10",
    ring: "ring-violet-400/20",
  },
  optimized: {
    label: "Optimized",
    icon: Zap,
    text: "text-cyan-400",
    bg: "bg-cyan-400/10",
    ring: "ring-cyan-400/20",
  },
  refactor: {
    label: "Refactor",
    icon: RefreshCw,
    text: "text-purple-400",
    bg: "bg-purple-400/10",
    ring: "ring-purple-400/20",
  },
};

const PRIORITY_META = {
  urgent: {
    label: "Urgent",
    text: "text-red-400",
    bg: "bg-red-400/10",
    dot: "bg-red-400",
  },
  major: {
    label: "Major",
    text: "text-amber-400",
    bg: "bg-amber-400/10",
    dot: "bg-amber-400",
  },
  minor: {
    label: "Minor",
    text: "text-blue-400",
    bg: "bg-blue-400/10",
    dot: "bg-blue-400",
  },
};

const PRIORITY_RANK: Record<string, number> = { urgent: 0, major: 1, minor: 2 };

const TYPE_COLORS: Record<string, string> = {
  feature: "#34d399",
  bugfix: "#fb923c",
  task: "#2dd4bf",
  milestone: "#facc15",
  learning: "#a78bfa",
  optimized: "#22d3ee",
  refactor: "#c084fc",
};

const COMPLEXITY_META = {
  simple: { label: "Simple", text: "text-teal-400", bg: "bg-teal-400/10" },
  hard: { label: "Hard", text: "text-orange-400", bg: "bg-orange-400/10" },
  complex: {
    label: "Complex",
    text: "text-purple-400",
    bg: "bg-purple-400/10",
  },
};

const TASK_TAGS = [
  "booking",
  "food",
  "collection",
  "prestige",
  "perks",
  "love",
];

const TASK_TAG_STYLE: Record<
  string,
  { text: string; bg: string; border: string }
> = {
  booking: {
    text: "text-sky-400",
    bg: "bg-sky-400/10",
    border: "border-sky-400/30",
  },
  food: {
    text: "text-orange-400",
    bg: "bg-orange-400/10",
    border: "border-orange-400/30",
  },
};

const TASK_STATUS_DOT: Record<string, string> = {
  done: "bg-emerald-400",
  progress: "bg-yellow-400",
  planned: "bg-slate-600",
};

const STATUS_META = {
  done: { label: "Done", dot: "bg-emerald-400" },
  progress: { label: "In Progress", dot: "bg-yellow-400" },
  planned: { label: "Planned", dot: "bg-slate-500" },
};

const STATUS_BORDER: Record<string, string> = {
  done: "border-l-emerald-400/50",
  progress: "border-l-yellow-400/50",
  planned: "border-l-slate-700/60",
};

function deriveEntryStatus(tasks: Task[]): "done" | "progress" | "planned" {
  if (tasks.length === 0) return "planned";
  if (tasks.every((t) => t.status === "done")) return "done";
  if (tasks.some((t) => t.status !== "planned")) return "progress";
  return "planned";
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════
export default function ProjectDashboard() {
  const [project, setProject] = useState("all");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formSeedTask, setFormSeedTask] = useState<Task | null>(null);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const [quickAdd, setQuickAdd] = useState({
    title: "",
    priority: "",
    complexity: "",
    tags: [] as string[],
  });
  const [backlogTagFilter, setBacklogTagFilter] = useState("all");
  const [backlogPage, setBacklogPage] = useState(1);
  const [inProgressPage, setInProgressPage] = useState(1);
  const [page, setPage] = useState(1);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [viewingEntry, setViewingEntry] = useState<Entry | null>(null);

  useEffect(() => {
    supabase
      .from("entries")
      .select("*")
      .order("date", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setEntries(data as Entry[]);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoomSrc(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [project, type, status, search, dateFrom, dateTo]);

  useEffect(() => {
    setBacklogPage(1);
  }, [backlogTagFilter]);

  const projects = useMemo(
    () => Array.from(new Set(entries.map((e) => e.project))),
    [entries],
  );

  const filtered = useMemo(() => {
    return entries
      .filter((e) => {
        if (e.tasks.length > 0 && e.tasks.every((t) => t.status === "planned"))
          return false;
        if (project !== "all" && e.project !== project) return false;
        if (type !== "all" && !e.tasks.some((t) => t.type === type))
          return false;
        if (status !== "all" && deriveEntryStatus(e.tasks) !== status)
          return false;
        if (dateFrom && e.date < dateFrom) return false;
        if (dateTo && e.date > dateTo) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const hay = (
            e.title +
            " " +
            e.tasks.map((t) => t.title).join(" ") +
            " " +
            (e.tags || []).join(" ")
          ).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [entries, project, type, status, search, dateFrom, dateTo]);

  const inProgressItems = useMemo<InProgressItem[]>(() => {
    const seen = new Map<string, InProgressItem>();
    const all: InProgressItem[] = [];
    entries.forEach((e) => {
      e.tasks.forEach((t) => {
        if (t.status === "progress") {
          all.push({
            entryId: e.id,
            entryTitle: e.title,
            entryDate: e.date,
            task: t,
          });
        }
      });
    });
    all.sort((a, b) => {
      const pa = PRIORITY_RANK[a.task.priority ?? ""] ?? 3;
      const pb = PRIORITY_RANK[b.task.priority ?? ""] ?? 3;
      if (pa !== pb) return pa - pb;
      return a.entryDate.localeCompare(b.entryDate);
    });
    for (const item of all) {
      if (!seen.has(item.task.title)) seen.set(item.task.title, item);
    }
    return Array.from(seen.values());
  }, [entries]);

  const plannedItems = useMemo<InProgressItem[]>(() => {
    const seen = new Map<string, InProgressItem>();
    const all: InProgressItem[] = [];
    entries.forEach((e) => {
      e.tasks.forEach((t) => {
        if (t.status === "planned") {
          all.push({
            entryId: e.id,
            entryTitle: e.title,
            entryDate: e.date,
            task: t,
          });
        }
      });
    });
    all.sort((a, b) => {
      const ao = a.task.sortOrder ?? Infinity;
      const bo = b.task.sortOrder ?? Infinity;
      if (ao !== bo) return ao - bo;
      return a.entryDate.localeCompare(b.entryDate);
    });
    for (const item of all) {
      if (!seen.has(item.task.title)) seen.set(item.task.title, item);
    }
    return Array.from(seen.values());
  }, [entries]);

  const filteredPlannedItems = useMemo(
    () =>
      backlogTagFilter === "all"
        ? plannedItems
        : plannedItems.filter((item) =>
            (item.task.tags ?? []).includes(backlogTagFilter),
          ),
    [plannedItems, backlogTagFilter],
  );

  const stats = useMemo(() => {
    const base =
      project === "all"
        ? entries
        : entries.filter((e) => e.project === project);
    const allTasks = base.flatMap((e) => e.tasks);
    return {
      total: allTasks.length,
      optimized: allTasks.filter((t) => t.type === "optimized").length,
      features: allTasks.filter((t) => t.type === "feature").length,
      bugs: allTasks.filter((t) => t.type === "bugfix").length,
    };
  }, [entries, project]);

  async function handleDelete(entry: Entry) {
    if (!window.confirm(`Delete "${entry.title}"?`)) return;
    const { error } = await supabase
      .from("entries")
      .delete()
      .eq("id", entry.id);
    if (!error) setEntries((prev) => prev.filter((e) => e.id !== entry.id));
  }

  function clearTypeStatus() {
    setType("all");
    setStatus("all");
  }

  function formatDateShort(iso: string): string {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  async function markTaskDone(taskTitle: string) {
    setActionLoading(taskTitle);
    const today = new Date().toISOString().slice(0, 10);
    const affected = entries
      .filter((e) =>
        e.tasks.some((t) => t.title === taskTitle && t.status === "progress"),
      )
      .sort((a, b) => a.date.localeCompare(b.date));
    if (affected.length === 0) {
      setActionLoading(null);
      return;
    }
    const startDate = affected[0].date;
    const dateRange =
      startDate === today
        ? formatDateShort(today)
        : `${formatDateShort(startDate)} → ${formatDateShort(today)}`;
    try {
      for (const entry of affected) {
        const updatedTasks = entry.tasks.map((t) =>
          t.title === taskTitle && t.status === "progress"
            ? { ...t, status: "done" as const, dateRange }
            : t,
        );
        const { error } = await supabase
          .from("entries")
          .update({ tasks: updatedTasks })
          .eq("id", entry.id);
        if (!error)
          setEntries((prev) =>
            prev.map((e) =>
              e.id === entry.id ? { ...e, tasks: updatedTasks } : e,
            ),
          );
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function markTaskPlanned(taskTitle: string) {
    setActionLoading(taskTitle);
    const affected = entries.filter((e) =>
      e.tasks.some((t) => t.title === taskTitle && t.status === "progress"),
    );
    try {
      for (const entry of affected) {
        const updatedTasks = entry.tasks.map((t) =>
          t.title === taskTitle && t.status === "progress"
            ? { ...t, status: "planned" as const }
            : t,
        );
        const { error } = await supabase
          .from("entries")
          .update({ tasks: updatedTasks })
          .eq("id", entry.id);
        if (!error)
          setEntries((prev) =>
            prev.map((e) =>
              e.id === entry.id ? { ...e, tasks: updatedTasks } : e,
            ),
          );
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function startPlannedTask(item: InProgressItem) {
    setActionLoading(item.task.title);
    const today = new Date().toISOString().slice(0, 10);
    const sourceEntry = entries.find((e) => e.id === item.entryId);
    const todayEntry = entries.find(
      (e) =>
        e.date === today &&
        e.id !== item.entryId &&
        e.tasks.some((t) => t.status !== "planned"),
    );
    try {
      if (sourceEntry) {
        const updatedTasks = sourceEntry.tasks.map((t) =>
          t.title === item.task.title && t.status === "planned"
            ? { ...t, status: "progress" as const }
            : t,
        );
        const { error } = await supabase
          .from("entries")
          .update({ tasks: updatedTasks })
          .eq("id", sourceEntry.id);
        if (!error)
          setEntries((prev) =>
            prev.map((e) =>
              e.id === sourceEntry.id ? { ...e, tasks: updatedTasks } : e,
            ),
          );
      }
      if (
        todayEntry &&
        !todayEntry.tasks.some((t) => t.title === item.task.title)
      ) {
        const updatedTasks = [
          ...todayEntry.tasks,
          { ...item.task, status: "progress" as const },
        ];
        const { error } = await supabase
          .from("entries")
          .update({ tasks: updatedTasks })
          .eq("id", todayEntry.id);
        if (!error)
          setEntries((prev) =>
            prev.map((e) =>
              e.id === todayEntry.id ? { ...e, tasks: updatedTasks } : e,
            ),
          );
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function deleteBacklogTask(item: InProgressItem) {
    const sourceEntry = entries.find((e) => e.id === item.entryId);
    if (!sourceEntry) return;
    const remaining = sourceEntry.tasks.filter(
      (t) => !(t.title === item.task.title && t.status === "planned"),
    );
    if (remaining.length === 0) {
      const { error } = await supabase
        .from("entries")
        .delete()
        .eq("id", sourceEntry.id);
      if (!error)
        setEntries((prev) => prev.filter((e) => e.id !== sourceEntry.id));
    } else {
      const { error } = await supabase
        .from("entries")
        .update({ tasks: remaining })
        .eq("id", sourceEntry.id);
      if (!error)
        setEntries((prev) =>
          prev.map((e) =>
            e.id === sourceEntry.id ? { ...e, tasks: remaining } : e,
          ),
        );
    }
  }

  async function handleBacklogDrop(targetIdx: number) {
    if (dragIdx === null || dragIdx === targetIdx) {
      setDragIdx(null);
      setDragOverIdx(null);
      return;
    }
    const reordered = [...plannedItems];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(targetIdx, 0, moved);

    const updates: { entryId: string; updatedTasks: Task[] }[] = [];
    for (let i = 0; i < reordered.length; i++) {
      const item = reordered[i];
      const sourceEntry = entries.find((e) => e.id === item.entryId);
      if (sourceEntry) {
        const updatedTasks = sourceEntry.tasks.map((t) =>
          t.title === item.task.title ? { ...t, sortOrder: i } : t,
        );
        updates.push({ entryId: sourceEntry.id, updatedTasks });
      }
    }

    await Promise.all(
      updates.map(({ entryId, updatedTasks }) =>
        supabase
          .from("entries")
          .update({ tasks: updatedTasks })
          .eq("id", entryId),
      ),
    );
    setEntries((prev) => {
      let next = [...prev];
      for (const { entryId, updatedTasks } of updates) {
        next = next.map((e) =>
          e.id === entryId ? { ...e, tasks: updatedTasks } : e,
        );
      }
      return next;
    });
    setDragIdx(null);
    setDragOverIdx(null);
  }

  async function handleQuickAddSave() {
    if (!quickAdd.title.trim()) return;
    setQuickAddSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    const newEntry: Entry = {
      id: crypto.randomUUID(),
      project: "VC+",
      date: today,
      title: quickAdd.title.trim(),
      tasks: [
        {
          title: quickAdd.title.trim(),
          status: "planned",
          ...(quickAdd.priority
            ? { priority: quickAdd.priority as Task["priority"] }
            : {}),
          ...(quickAdd.complexity
            ? { complexity: quickAdd.complexity as Task["complexity"] }
            : {}),
          ...(quickAdd.tags.length > 0 ? { tags: quickAdd.tags } : {}),
        },
      ],
    };
    const { error } = await supabase.from("entries").insert(newEntry);
    if (!error) {
      setEntries((prev) => [newEntry, ...prev]);
      setQuickAdd({ title: "", priority: "", complexity: "", tags: [] });
      setQuickAddOpen(false);
    }
    setQuickAddSaving(false);
  }

  const hasFilters =
    project !== "all" ||
    type !== "all" ||
    search.trim() ||
    dateFrom ||
    dateTo;

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 overflow-hidden">
      <BackgroundDecor />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="mb-8 sm:mb-10 flex items-start justify-between gap-4">
          <div>
            <div className="text-[11px] sm:text-xs font-bold tracking-[0.25em] uppercase text-emerald-400 mb-2 animate-fade-in">
              Build Logs - wizaroracle
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl tracking-tight text-slate-50 animate-fade-in-up">
              VC Task Logs
            </h1>
            <p className="mt-3 max-w-xl text-sm sm:text-base text-slate-400 animate-fade-in-up [animation-delay:80ms]">
              Every completed task, shipped feature, and fixed bug, across all
              the projects, filterable in one place.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setFormOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-700/40 bg-emerald-400/10 text-emerald-300 text-xs font-medium px-3 py-2 sm:px-4 sm:py-2.5 hover:bg-emerald-400/20 transition-colors animate-fade-in-up [animation-delay:40ms]"
            >
              <Plus size={14} /> New Entry
            </button>
            <ProfileButton
              open={profileOpen}
              onToggle={() => setProfileOpen((o) => !o)}
            />
          </div>
        </header>

        {/* ── Stats (clickable) ──────────────────────────────── */}
        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          <StatCard
            label="Total Tasks"
            value={stats.total}
            accent="border-teal-400/60"
            delay={0}
            active={type === "all" && status === "all"}
            onClick={clearTypeStatus}
          />
          <StatCard
            label="Optimized"
            value={stats.optimized}
            accent="border-cyan-400/60"
            delay={60}
            active={type === "optimized"}
            onClick={() => {
              setType(type === "optimized" ? "all" : "optimized");
              setStatus("all");
            }}
          />
          <StatCard
            label="Features"
            value={stats.features}
            accent="border-emerald-300/60"
            delay={120}
            active={type === "feature"}
            onClick={() => {
              setType(type === "feature" ? "all" : "feature");
              setStatus("all");
            }}
          />
          <StatCard
            label="Bugs Fixed"
            value={stats.bugs}
            accent="border-orange-400/60"
            delay={180}
            active={type === "bugfix"}
            onClick={() => {
              setType(type === "bugfix" ? "all" : "bugfix");
              setStatus("all");
            }}
          />
        </section>

        {/* ── In Progress + Planned panels ───────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
          {/* In Progress */}
          {(() => {
            const IP_PER_PAGE = 5;
            const ipTotalPages = Math.ceil(inProgressItems.length / IP_PER_PAGE);
            const pagedIP = inProgressItems.slice(
              (inProgressPage - 1) * IP_PER_PAGE,
              inProgressPage * IP_PER_PAGE,
            );
            return (
              <section className="flex flex-col gap-3 p-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
                  <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-yellow-400">
                    In Progress
                  </span>
                  <span className="text-[11px] text-slate-600">
                    {inProgressItems.length}
                  </span>
                </div>
                {inProgressItems.length === 0 ? (
                  <p className="text-xs text-slate-600 py-2">No tasks in progress.</p>
                ) : (
                  <>
                    <ul className="flex flex-col gap-2">
                      {pagedIP.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 py-2 border-b border-yellow-400/10 last:border-0"
                        >
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-slate-200 leading-snug">
                              {item.task.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-1 mt-1">
                              {item.task.priority && (
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${PRIORITY_META[item.task.priority].text} ${PRIORITY_META[item.task.priority].bg}`}
                                >
                                  {PRIORITY_META[item.task.priority].label}
                                </span>
                              )}
                              {item.task.complexity && (
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${COMPLEXITY_META[item.task.complexity].text} ${COMPLEXITY_META[item.task.complexity].bg}`}
                                >
                                  {COMPLEXITY_META[item.task.complexity].label}
                                </span>
                              )}
                              {(item.task.tags ?? []).map((tag) => {
                                const s = TASK_TAG_STYLE[tag];
                                return (
                                  <span
                                    key={tag}
                                    className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${s ? `${s.text} ${s.bg} ${s.border}` : "text-slate-400 bg-slate-800 border-slate-700"}`}
                                  >
                                    #{tag}
                                  </span>
                                );
                              })}
                              <span className="text-[10px] text-slate-600">
                                started {formatDate(item.entryDate)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => markTaskDone(item.task.title)}
                              disabled={actionLoading === item.task.title}
                              className="text-[11px] px-2 py-1 rounded-lg border border-emerald-400/30 text-emerald-300 hover:bg-emerald-400/10 transition-colors disabled:opacity-40 whitespace-nowrap"
                            >
                              ✓ Done
                            </button>
                            <button
                              onClick={() => markTaskPlanned(item.task.title)}
                              disabled={actionLoading === item.task.title}
                              className="text-[11px] px-2 py-1 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors disabled:opacity-40 whitespace-nowrap"
                            >
                              → Backlog
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                    {ipTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-2 border-t border-yellow-400/10">
                        <button
                          onClick={() => setInProgressPage((p) => Math.max(1, p - 1))}
                          disabled={inProgressPage === 1}
                          className="text-[10px] px-2 py-1 text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors"
                        >
                          ← Prev
                        </button>
                        <span className="text-[10px] text-slate-600">
                          {inProgressPage} / {ipTotalPages}
                        </span>
                        <button
                          onClick={() => setInProgressPage((p) => Math.min(ipTotalPages, p + 1))}
                          disabled={inProgressPage === ipTotalPages}
                          className="text-[10px] px-2 py-1 text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors"
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            );
          })()}

          {/* Planned / Backlog */}
          {(() => {
            const BL_PER_PAGE = 7;
            const blTotalPages = Math.ceil(filteredPlannedItems.length / BL_PER_PAGE);
            const pagedBL = filteredPlannedItems.slice(
              (backlogPage - 1) * BL_PER_PAGE,
              backlogPage * BL_PER_PAGE,
            );
            return (
              <section className="flex flex-col gap-3 p-4 rounded-2xl border border-blue-400/20 bg-blue-400/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-blue-400">
                      Backlog
                    </span>
                    <span className="text-[11px] text-slate-600">
                      {filteredPlannedItems.length}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setQuickAdd({ title: "", priority: "", complexity: "", tags: [] });
                      setQuickAddOpen(true);
                    }}
                    className="text-[11px] text-blue-400/70 hover:text-blue-400 transition-colors flex items-center gap-1"
                  >
                    + Add planned task
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {["all", ...TASK_TAGS].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setBacklogTagFilter(tag)}
                      className={`text-[10px] px-2 py-0.5 rounded-full border transition-colors ${
                        backlogTagFilter === tag
                          ? "border-blue-400/40 bg-blue-400/10 text-blue-300"
                          : "border-slate-800 text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      {tag === "all" ? "All" : `#${tag}`}
                    </button>
                  ))}
                </div>
                {filteredPlannedItems.length === 0 ? (
                  <p className="text-xs text-slate-600 py-2">No planned tasks yet.</p>
                ) : (
                  <>
                    <ul className="flex flex-col gap-1">
                      {pagedBL.map((item, pageLocalIdx) => {
                        const realIdx = (backlogPage - 1) * BL_PER_PAGE + pageLocalIdx;
                        return (
                          <li
                            key={item.task.title}
                            draggable
                            onDragStart={() => setDragIdx(realIdx)}
                            onDragOver={(e) => { e.preventDefault(); setDragOverIdx(realIdx); }}
                            onDragLeave={() => setDragOverIdx(null)}
                            onDrop={() => handleBacklogDrop(realIdx)}
                            onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                            className={`flex items-center gap-2.5 py-2 px-1 rounded-lg border transition-colors ${
                              dragOverIdx === realIdx && dragIdx !== realIdx
                                ? "border-blue-400/50 bg-blue-400/8"
                                : "border-transparent"
                            } border-b border-b-blue-400/10 last:border-b-0`}
                          >
                            <span className="text-slate-700 hover:text-slate-500 cursor-grab active:cursor-grabbing shrink-0 select-none text-sm leading-none">
                              ⠿
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-300 leading-snug">
                                {item.task.title}
                              </p>
                              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                {item.task.priority && (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${PRIORITY_META[item.task.priority].text} ${PRIORITY_META[item.task.priority].bg}`}
                                  >
                                    {PRIORITY_META[item.task.priority].label}
                                  </span>
                                )}
                                {item.task.complexity && (
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${COMPLEXITY_META[item.task.complexity].text} ${COMPLEXITY_META[item.task.complexity].bg}`}
                                  >
                                    {COMPLEXITY_META[item.task.complexity].label}
                                  </span>
                                )}
                                {(item.task.tags ?? []).map((tag) => {
                                  const s = TASK_TAG_STYLE[tag];
                                  return (
                                    <span
                                      key={tag}
                                      className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${s ? `${s.text} ${s.bg} ${s.border}` : "text-slate-400 bg-slate-800 border-slate-700"}`}
                                    >
                                      #{tag}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => startPlannedTask(item)}
                                disabled={actionLoading === item.task.title}
                                className="text-[11px] px-2 py-1 rounded-lg border border-blue-400/30 text-blue-300 hover:bg-blue-400/10 transition-colors whitespace-nowrap disabled:opacity-40"
                              >
                                ▶ Start
                              </button>
                              <button
                                onClick={() => deleteBacklogTask(item)}
                                className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                                title="Remove from backlog"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    {blTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-2 border-t border-blue-400/10">
                        <button
                          onClick={() => setBacklogPage((p) => Math.max(1, p - 1))}
                          disabled={backlogPage === 1}
                          className="text-[10px] px-2 py-1 text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors"
                        >
                          ← Prev
                        </button>
                        <span className="text-[10px] text-slate-600">
                          {backlogPage} / {blTotalPages}
                        </span>
                        <button
                          onClick={() => setBacklogPage((p) => Math.min(blTotalPages, p + 1))}
                          disabled={backlogPage === blTotalPages}
                          className="text-[10px] px-2 py-1 text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors"
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            );
          })()}
        </div>

        {/* ── Filters ────────────────────────────────────────── */}
        <section className="flex flex-wrap items-center gap-2 sm:gap-3 mb-8 p-3 sm:p-4 rounded-2xl border border-emerald-900/40 bg-slate-900/60 backdrop-blur-sm animate-fade-in-up [animation-delay:140ms]">
          <div className="flex items-center gap-2 flex-1 min-w-[180px] basis-full sm:basis-auto">
            <Search size={16} className="text-emerald-400 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, tasks, tags..."
              className="w-full bg-transparent border-none outline-none text-sm text-slate-100 placeholder:text-slate-500"
            />
          </div>

          <FilterSelect
            icon={Folder}
            value={project}
            onChange={setProject}
            options={[
              { value: "all", label: "All Projects" },
              ...projects.map((p) => ({ value: p, label: p })),
            ]}
          />

          <FilterSelect
            icon={LayoutGrid}
            value={type}
            onChange={(v) => {
              setType(v);
              setStatus("all");
            }}
            options={[
              { value: "all", label: "All Types" },
              ...Object.entries(TYPE_META).map(([k, v]) => ({
                value: k,
                label: v.label,
              })),
            ]}
          />

          <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <CalendarRange size={14} className="text-emerald-400 shrink-0" />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent border-none outline-none text-xs sm:text-sm text-slate-200 [color-scheme:dark]"
            />
            <span className="text-slate-600 text-xs">→</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent border-none outline-none text-xs sm:text-sm text-slate-200 [color-scheme:dark]"
            />
          </div>

          {hasFilters && (
            <button
              onClick={() => {
                setProject("all");
                setType("all");
                setStatus("all");
                setSearch("");
                setDateFrom("");
                setDateTo("");
              }}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-emerald-900/60 text-emerald-300 hover:bg-emerald-400/10 transition-colors"
            >
              <X size={14} /> Clear
            </button>
          )}
        </section>

        {/* ── Entries grid ───────────────────────────────────── */}
        {(() => {
          const ITEMS_PER_PAGE = 9;
          const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
          const paged = filtered.slice(
            (page - 1) * ITEMS_PER_PAGE,
            page * ITEMS_PER_PAGE,
          );
          return loading ? (
            <div className="text-center py-16 px-5 rounded-2xl border border-dashed border-emerald-900/40 text-slate-500 text-sm animate-fade-in">
              Loading entries…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 px-5 rounded-2xl border border-dashed border-emerald-900/40 text-slate-500 text-sm animate-fade-in">
              No entries yet — hit{" "}
              <span className="text-emerald-400 font-medium">+ New Entry</span>{" "}
              to log your first task.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {paged.map((entry, i) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    activeType={type}
                    delay={Math.min(i, 6) * 50}
                    onView={() => setViewingEntry(entry)}
                    onEdit={() => setEditingEntry(entry)}
                    onDelete={() => handleDelete(entry)}
                    onImageClick={setZoomSrc}
                  />
                ))}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 text-xs hover:border-slate-600 hover:text-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    ← Prev
                  </button>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-7 h-7 rounded-md text-xs transition-colors ${
                            p === page
                              ? "bg-emerald-400/15 text-emerald-300 border border-emerald-700/40"
                              : "text-slate-500 hover:text-slate-300 border border-transparent hover:border-slate-700"
                          }`}
                        >
                          {p}
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400 text-xs hover:border-slate-600 hover:text-slate-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          );
        })()}

        <p className="mt-12 text-center text-[11px] text-slate-500">
          I can do all things though
          <span className="text-emerald-400"> Christ</span> who stengthens me.
        </p>
      </div>

      {zoomSrc && (
        <div
          onClick={() => setZoomSrc(null)}
          className="fixed inset-0 z-60 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <button
            onClick={() => setZoomSrc(null)}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          >
            <X size={22} />
          </button>
          <img
            src={zoomSrc}
            onClick={(e) => e.stopPropagation()}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            alt="Zoomed"
          />
        </div>
      )}

      {quickAddOpen && (
        <>
          <div
            onClick={() => setQuickAddOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
          />
          <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-blue-400">
                Add to Backlog
              </span>
              <button
                onClick={() => setQuickAddOpen(false)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <input
              autoFocus
              value={quickAdd.title}
              onChange={(e) =>
                setQuickAdd((d) => ({ ...d, title: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && handleQuickAddSave()}
              placeholder="Task title..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-700/60 placeholder:text-slate-600 transition-colors"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={quickAdd.priority}
                onChange={(e) =>
                  setQuickAdd((d) => ({ ...d, priority: e.target.value }))
                }
                className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-blue-700/60 transition-colors"
              >
                <option value="">Priority</option>
                <option value="urgent">🔴 Urgent</option>
                <option value="major">🟡 Major</option>
                <option value="minor">🔵 Minor</option>
              </select>
              <select
                value={quickAdd.complexity}
                onChange={(e) =>
                  setQuickAdd((d) => ({ ...d, complexity: e.target.value }))
                }
                className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-blue-700/60 transition-colors"
              >
                <option value="">Complexity</option>
                <option value="simple">Simple</option>
                <option value="hard">Hard</option>
                <option value="complex">Complex</option>
              </select>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Tags
              </span>
              {TASK_TAGS.map((tag) => {
                const active = quickAdd.tags.includes(tag);
                const s = TASK_TAG_STYLE[tag];
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() =>
                      setQuickAdd((d) => ({
                        ...d,
                        tags: active
                          ? d.tags.filter((t) => t !== tag)
                          : [...d.tags, tag],
                      }))
                    }
                    className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-colors ${
                      active && s
                        ? `${s.text} ${s.bg} ${s.border}`
                        : active
                          ? "border-blue-400/40 bg-blue-400/10 text-blue-300"
                          : "border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400"
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
            <button
              onClick={handleQuickAddSave}
              disabled={!quickAdd.title.trim() || quickAddSaving}
              className="w-full rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 text-sm font-semibold py-2.5 hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {quickAddSaving ? "Saving…" : "Add to Backlog"}
            </button>
          </div>
        </>
      )}

      <ViewEntryModal
        entry={viewingEntry}
        onClose={() => setViewingEntry(null)}
        onEdit={() => {
          setEditingEntry(viewingEntry);
          setViewingEntry(null);
        }}
        onImageClick={setZoomSrc}
      />

      <ProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} entries={entries} />
      <AddEntryModal
        open={formOpen || editingEntry !== null}
        initialEntry={editingEntry ?? undefined}
        inProgressItems={inProgressItems}
        seedTask={formSeedTask ?? undefined}
        onClose={() => {
          setFormOpen(false);
          setEditingEntry(null);
          setFormSeedTask(null);
        }}
        onSaved={(entry) =>
          setEntries((prev) => {
            const idx = prev.findIndex((e) => e.id === entry.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = entry;
              return next;
            }
            return [entry, ...prev];
          })
        }
      />

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spinCW  { from { transform: rotate(0deg)   } to { transform: rotate(360deg)  } }
        @keyframes spinCCW { from { transform: rotate(360deg) } to { transform: rotate(0deg)    } }
        .animate-fade-in    { animation: fadeIn   0.6s ease-out both; }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out both; }
        .ring-cw-120  { animation: spinCW  120s linear infinite; }
        .ring-ccw-80  { animation: spinCCW  80s linear infinite; }
        .ring-cw-60   { animation: spinCW   60s linear infinite; }
        .ring-ccw-200 { animation: spinCCW 200s linear infinite; }
        .ring-cw-180  { animation: spinCW  180s linear infinite; }
        .ring-ccw-140 { animation: spinCCW 140s linear infinite; }
        .ring-cw-300  { animation: spinCW  300s linear infinite; }
      `}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Background — matrix grid + layered animated magic circles
// ════════════════════════════════════════════════════════════════════
function BackgroundDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Matrix grid */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.04]"
        aria-hidden="true"
      >
        <defs>
          <pattern
            id="matrixGrid"
            width="36"
            height="36"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 36 0 L 0 0 0 36"
              fill="none"
              stroke="#34d399"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#matrixGrid)" />
      </svg>

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#020617_72%)]" />

      {/* ── Circle A — top right, emerald ───────────────────── */}
      <div
        className="absolute -top-52 -right-52 w-160 h-160"
        style={{ opacity: 0.38 }}
      >
        <svg
          className="absolute inset-0 w-full h-full ring-cw-120"
          viewBox="0 0 400 400"
          aria-hidden="true"
        >
          <circle
            cx="200"
            cy="200"
            r="188"
            stroke="#34d399"
            strokeWidth="1"
            fill="none"
          />
          {Array.from({ length: 36 }, (_, i) => {
            const a = (i / 36) * Math.PI * 2;
            const major = i % 3 === 0;
            return (
              <line
                key={i}
                x1={200 + Math.cos(a) * (major ? 177 : 182)}
                y1={200 + Math.sin(a) * (major ? 177 : 182)}
                x2={200 + Math.cos(a) * 191}
                y2={200 + Math.sin(a) * 191}
                stroke="#34d399"
                strokeWidth={major ? "1.5" : "0.75"}
              />
            );
          })}
        </svg>
        <svg
          className="absolute inset-0 w-full h-full ring-ccw-80"
          viewBox="0 0 400 400"
          aria-hidden="true"
        >
          <circle
            cx="200"
            cy="200"
            r="163"
            stroke="#34d399"
            strokeWidth="0.75"
            fill="none"
            strokeDasharray="5 8"
          />
          <circle
            cx="200"
            cy="200"
            r="149"
            stroke="#34d399"
            strokeWidth="0.5"
            fill="none"
            strokeDasharray="1 6"
          />
        </svg>
        <svg
          className="absolute inset-0 w-full h-full ring-cw-60"
          viewBox="0 0 400 400"
          aria-hidden="true"
        >
          <circle
            cx="200"
            cy="200"
            r="113"
            stroke="#34d399"
            strokeWidth="0.75"
            fill="none"
            strokeDasharray="3 5"
          />
        </svg>
        <svg
          className="absolute inset-0 w-full h-full ring-ccw-200"
          viewBox="0 0 400 400"
          aria-hidden="true"
        >
          <polygon
            points={Array.from({ length: 5 }, (_, i) => {
              const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
              return `${200 + Math.cos(a) * 93},${200 + Math.sin(a) * 93}`;
            }).join(" ")}
            fill="none"
            stroke="#34d399"
            strokeWidth="0.75"
          />
        </svg>
      </div>
      <div
        className="absolute -top-36 -right-36 w-96 h-96 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(52,211,153,0.08) 0%, transparent 70%)",
        }}
      />

      {/* ── Circle B — bottom left, teal ────────────────────── */}
      <div
        className="absolute -bottom-48 -left-48 w-140 h-140"
        style={{ opacity: 0.3 }}
      >
        <svg
          className="absolute inset-0 w-full h-full ring-ccw-140"
          viewBox="0 0 400 400"
          aria-hidden="true"
        >
          <circle
            cx="200"
            cy="200"
            r="188"
            stroke="#2dd4bf"
            strokeWidth="1"
            fill="none"
          />
          {Array.from({ length: 24 }, (_, i) => {
            const a = (i / 24) * Math.PI * 2;
            const major = i % 4 === 0;
            return (
              <line
                key={i}
                x1={200 + Math.cos(a) * (major ? 176 : 181)}
                y1={200 + Math.sin(a) * (major ? 176 : 181)}
                x2={200 + Math.cos(a) * 191}
                y2={200 + Math.sin(a) * 191}
                stroke="#2dd4bf"
                strokeWidth={major ? "1.5" : "0.75"}
              />
            );
          })}
        </svg>
        <svg
          className="absolute inset-0 w-full h-full ring-cw-180"
          viewBox="0 0 400 400"
          aria-hidden="true"
        >
          <circle
            cx="200"
            cy="200"
            r="156"
            stroke="#2dd4bf"
            strokeWidth="0.75"
            fill="none"
            strokeDasharray="6 6"
          />
          <circle
            cx="200"
            cy="200"
            r="136"
            stroke="#2dd4bf"
            strokeWidth="0.5"
            fill="none"
            strokeDasharray="2 8"
          />
        </svg>
        <svg
          className="absolute inset-0 w-full h-full ring-ccw-80"
          viewBox="0 0 400 400"
          aria-hidden="true"
        >
          <polygon
            points="200,100 295,200 200,300 105,200"
            fill="none"
            stroke="#2dd4bf"
            strokeWidth="0.75"
          />
        </svg>
        <svg
          className="absolute inset-0 w-full h-full ring-cw-300"
          viewBox="0 0 400 400"
          aria-hidden="true"
        >
          <circle
            cx="200"
            cy="200"
            r="106"
            stroke="#2dd4bf"
            strokeWidth="0.5"
            fill="none"
            strokeDasharray="4 4"
          />
          <polygon
            points={Array.from({ length: 6 }, (_, i) => {
              const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
              return `${200 + Math.cos(a) * 76},${200 + Math.sin(a) * 76}`;
            }).join(" ")}
            fill="none"
            stroke="#2dd4bf"
            strokeWidth="0.5"
          />
        </svg>
      </div>
      <div
        className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(45,212,191,0.07) 0%, transparent 70%)",
        }}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Profile button + panel
// ════════════════════════════════════════════════════════════════════
function ProfileButton({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={`shrink-0 flex items-center gap-2.5 sm:gap-3 rounded-2xl border px-3 py-2 sm:px-4 sm:py-2.5 backdrop-blur-sm transition-colors animate-fade-in-up [animation-delay:40ms] ${
        open
          ? "border-emerald-500/50 bg-emerald-400/10"
          : "border-slate-800 bg-slate-900/60 hover:border-emerald-700/50"
      }`}
    >
      <span className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-400/15 text-emerald-300 font-serif text-sm sm:text-base ring-1 ring-emerald-400/30">
        {PROFILE.avatarInitials}
      </span>
      <span className="hidden sm:flex flex-col items-start text-left">
        <span className="text-sm font-semibold text-slate-100 leading-tight">
          {PROFILE.name}
        </span>
        <span className="text-[11px] text-slate-400 leading-tight">
          {PROFILE.role}
        </span>
      </span>
    </button>
  );
}

function ProfilePanel({
  open,
  onClose,
  entries,
}: {
  open: boolean;
  onClose: () => void;
  entries: Entry[];
}) {
  const projects = useMemo(
    () => Array.from(new Set(entries.map((e) => e.project))),
    [entries],
  );

  const projectMetrics = useMemo(
    () =>
      projects.map((proj) => {
        const tasks = entries
          .filter((e) => e.project === proj)
          .flatMap((e) => e.tasks);
        const total = tasks.length;
        const done = tasks.filter((t) => t.status === "done").length;
        const typeCounts = Object.fromEntries(
          Object.keys(TYPE_META).map((k) => [
            k,
            tasks.filter((t) => (t.type ?? "task") === k).length,
          ]),
        );
        return { project: proj, total, done, typeCounts };
      }),
    [entries, projects],
  );

  const overallStats = useMemo(() => {
    const allTasks = entries.flatMap((e) => e.tasks);
    const total = allTasks.length;
    const typeCounts = Object.fromEntries(
      Object.keys(TYPE_META).map((k) => [
        k,
        allTasks.filter((t) => (t.type ?? "task") === k).length,
      ]),
    );
    return { total, typeCounts };
  }, [entries]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <div
        className={`fixed z-40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-2xl max-h-[88vh] flex flex-col rounded-2xl border border-emerald-900/50 bg-slate-900/95 backdrop-blur-md shadow-2xl shadow-black/40 transition-all duration-300 ${
          open
            ? "opacity-100 scale-100"
            : "opacity-0 scale-95 pointer-events-none"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <span className="text-xs font-bold tracking-[0.25em] uppercase text-emerald-400">
            Developer Profile
          </span>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 flex flex-col gap-5">
          {/* Identity */}
          <div className="flex items-center gap-4">
            <span className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-400/15 text-emerald-300 font-serif text-2xl sm:text-3xl ring-1 ring-emerald-400/30 shrink-0">
              {PROFILE.avatarInitials}
            </span>
            <div>
              <div className="font-serif text-2xl sm:text-3xl text-slate-50 leading-tight">
                {PROFILE.name}
              </div>
              <div className="text-sm sm:text-base text-slate-400 mt-0.5">
                {PROFILE.role}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <Building2 size={13} className="text-emerald-400" />
                <span className="text-sm text-slate-500">
                  {PROFILE.department}
                </span>
              </div>
            </div>
          </div>

          {/* Overall type breakdown */}
          {overallStats.total > 0 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold tracking-[0.25em] uppercase text-slate-500">
                  Overall Breakdown
                </span>
                <span className="text-xs text-slate-600">
                  {overallStats.total} total tasks
                </span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {(
                  Object.entries(TYPE_META) as [
                    string,
                    (typeof TYPE_META)[keyof typeof TYPE_META],
                  ][]
                ).map(([key, meta]) => {
                  const count = overallStats.typeCounts[key] ?? 0;
                  if (count === 0) return null;
                  const pct = Math.round((count / overallStats.total) * 100);
                  const Icon = meta.icon;
                  return (
                    <div
                      key={key}
                      className={`rounded-lg ${meta.bg} ring-1 ${meta.ring} px-2.5 py-2 flex flex-col gap-0.5`}
                    >
                      <div className={`flex items-center gap-1 ${meta.text}`}>
                        <Icon size={11} />
                        <span className="text-[10px] font-bold uppercase tracking-wide leading-none">
                          {meta.label}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className={`text-xl font-bold font-serif leading-none ${meta.text}`}>
                          {count}
                        </span>
                        <span className="text-xs text-slate-500">{pct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {/* Stacked progress bar */}
              <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
                {(
                  Object.entries(TYPE_META) as [
                    string,
                    (typeof TYPE_META)[keyof typeof TYPE_META],
                  ][]
                ).map(([key, meta]) => {
                  const count = overallStats.typeCounts[key] ?? 0;
                  if (count === 0) return null;
                  const pct = (count / overallStats.total) * 100;
                  return (
                    <div
                      key={key}
                      style={{ width: `${pct}%`, backgroundColor: TYPE_COLORS[key] }}
                      className="h-full"
                      title={`${meta.label}: ${count} (${Math.round(pct)}%)`}
                    />
                  );
                })}
              </div>

              {/* Description */}
              {(() => {
                const map: Record<string, [number, string]> = {
                  feature:   [overallStats.typeCounts["feature"]   ?? 0, "feature"],
                  bugfix:    [overallStats.typeCounts["bugfix"]    ?? 0, "bug fix"],
                  optimized: [overallStats.typeCounts["optimized"] ?? 0, "optimization"],
                  refactor:  [overallStats.typeCounts["refactor"]  ?? 0, "refactor"],
                  task:      [overallStats.typeCounts["task"]      ?? 0, "task"],
                  milestone: [overallStats.typeCounts["milestone"] ?? 0, "milestone"],
                  learning:  [overallStats.typeCounts["learning"]  ?? 0, "learning"],
                };
                const verbs: Record<string, string> = {
                  feature: "shipped", bugfix: "resolved", optimized: "optimized",
                  refactor: "refactored", task: "completed", milestone: "hit", learning: "logged",
                };
                const parts = Object.entries(map)
                  .filter(([, [n]]) => n > 0)
                  .map(([k, [n, label]]) => `${verbs[k]} ${n} ${label}${n !== 1 ? "s" : ""}`);

                const sentence =
                  parts.length > 1
                    ? parts.slice(0, -1).join(", ") + ", and " + parts[parts.length - 1]
                    : parts[0] ?? "";

                const sorted = Object.entries(overallStats.typeCounts).sort(([, a], [, b]) => b - a);
                const topKey = sorted[0]?.[0] ?? "";
                const topMeta = TYPE_META[topKey as keyof typeof TYPE_META];
                const topPct = Math.round(((sorted[0]?.[1] ?? 0) / overallStats.total) * 100);

                return (
                  <p className="text-xs text-slate-400 leading-relaxed pt-1">
                    Nel has {sentence} — with{" "}
                    {topMeta && (
                      <span className={topMeta.text}>{topMeta.label}</span>
                    )}{" "}
                    leading at{" "}
                    <span className="text-emerald-300 font-semibold">{topPct}%</span>{" "}
                    of all work logged across all projects.
                  </p>
                );
              })()}
            </div>
          )}

          {/* Metrics by project */}
          <div className="flex flex-col gap-3">
            <div className="text-xs font-bold tracking-[0.25em] uppercase text-slate-500">
              Metrics by Project
            </div>
            {projectMetrics.map((pm) => (
              <div
                key={pm.project}
                className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 flex flex-col gap-3"
              >
                {/* Project header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FolderKanban size={14} className="text-emerald-400" />
                    <span className="text-base font-semibold text-slate-200">
                      {pm.project}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 shrink-0 text-right">
                    {pm.total} tasks · {pm.done} done
                    {pm.total > 0 && (
                      <span className="text-emerald-400/70 ml-1">
                        ({Math.round((pm.done / pm.total) * 100)}%)
                      </span>
                    )}
                  </div>
                </div>

                {/* Type breakdown grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {(
                    Object.entries(TYPE_META) as [
                      string,
                      (typeof TYPE_META)[keyof typeof TYPE_META],
                    ][]
                  ).map(([key, meta]) => {
                    const count = pm.typeCounts[key] ?? 0;
                    if (count === 0) return null;
                    const pct =
                      pm.total > 0
                        ? Math.round((count / pm.total) * 100)
                        : 0;
                    const Icon = meta.icon;
                    return (
                      <div
                        key={key}
                        className={`rounded-lg ${meta.bg} ring-1 ${meta.ring} px-2.5 py-2 flex flex-col gap-0.5`}
                      >
                        <div
                          className={`flex items-center gap-1 ${meta.text}`}
                        >
                          <Icon size={11} />
                          <span className="text-[10px] font-bold uppercase tracking-wide leading-none">
                            {meta.label}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span
                            className={`text-xl font-bold font-serif leading-none ${meta.text}`}
                          >
                            {count}
                          </span>
                          <span className="text-xs text-slate-500">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Stacked progress bar */}
                {pm.total > 0 && (
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden flex">
                    {(
                      Object.entries(TYPE_META) as [
                        string,
                        (typeof TYPE_META)[keyof typeof TYPE_META],
                      ][]
                    ).map(([key, meta]) => {
                      const count = pm.typeCounts[key] ?? 0;
                      if (count === 0) return null;
                      const pct = (count / pm.total) * 100;
                      return (
                        <div
                          key={key}
                          style={{
                            width: `${pct}%`,
                            backgroundColor: TYPE_COLORS[key],
                          }}
                          className="h-full"
                          title={`${meta.label}: ${count} (${Math.round(pct)}%)`}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Projects handled */}
          <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-slate-800/60">
            <FolderKanban size={14} className="text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Projects
            </span>
            {PROFILE.projectsHandled.map((p) => (
              <span
                key={p}
                className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
// Stat card — clickable, with active state
// ════════════════════════════════════════════════════════════════════
function StatCard({
  label,
  value,
  accent,
  delay = 0,
  active = false,
  onClick,
}: {
  label: string;
  value: number;
  accent: string;
  delay?: number;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border bg-slate-900/60 backdrop-blur-sm px-4 py-3 sm:px-5 sm:py-4 border-l-4 ${accent} animate-fade-in-up select-none transition-all duration-200 ${
        onClick ? "cursor-pointer" : ""
      } ${
        active
          ? "border-slate-600 bg-slate-800/70 ring-1 ring-emerald-500/20"
          : "border-slate-800 hover:border-slate-600 hover:bg-slate-800/40"
      }`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="font-serif text-2xl sm:text-3xl leading-none text-slate-50">
        {value}
      </div>
      <div
        className={`mt-1.5 text-[10px] sm:text-[11px] tracking-[0.12em] uppercase transition-colors ${
          active ? "text-emerald-400" : "text-slate-400"
        }`}
      >
        {label}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Filter select
// ════════════════════════════════════════════════════════════════════
function FilterSelect({
  icon: Icon,
  value,
  onChange,
  options,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2 bg-slate-950/60 border border-slate-800 rounded-lg px-2.5 py-1.5">
      <Icon size={14} className="text-emerald-400 shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-none outline-none text-xs sm:text-sm text-slate-200 cursor-pointer pr-1"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-slate-900">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Compare block — a single before/after pair
// ════════════════════════════════════════════════════════════════════
function CompareBlock({
  pair,
  onImageClick,
}: {
  pair: CompareItem;
  onImageClick?: (src: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-800 overflow-hidden">
      <div className="bg-slate-800/60 text-[9px] font-bold tracking-widest uppercase text-slate-400 px-2.5 py-1">
        {pair.label ? `${pair.label} — ` : ""}Before → After
      </div>
      <div className="grid grid-cols-2">
        <div className="p-2 border-r border-slate-800">
          <div className="text-[9px] tracking-widest uppercase text-orange-300 mb-1">
            Before
          </div>
          <img
            src={pair.before.src}
            alt="Before"
            onClick={() => onImageClick?.(pair.before.src)}
            className="w-full h-16 object-cover rounded border border-slate-800 cursor-zoom-in"
          />
          <p className="text-[10px] text-slate-400 mt-1 leading-snug">
            {pair.before.note}
          </p>
        </div>
        <div className="p-2">
          <div className="text-[9px] tracking-widest uppercase text-emerald-300 mb-1">
            After
          </div>
          <img
            src={pair.after.src}
            alt="After"
            onClick={() => onImageClick?.(pair.after.src)}
            className="w-full h-16 object-cover rounded border border-slate-800 cursor-zoom-in"
          />
          <p className="text-[10px] text-slate-400 mt-1 leading-snug">
            {pair.after.note}
          </p>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Entry card — task-list style
// ════════════════════════════════════════════════════════════════════
function EntryCard({
  entry,
  activeType = "all",
  delay = 0,
  onView,
  onEdit,
  onDelete,
  onImageClick,
}: {
  entry: Entry;
  activeType?: string;
  delay?: number;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onImageClick: (src: string) => void;
}) {
  const visibleTasks =
    activeType === "all"
      ? entry.tasks
      : entry.tasks.filter((t) => (t.type ?? "task") === activeType);
  const displayedTasks = visibleTasks.slice(0, 3);
  const hiddenCount = visibleTasks.length - displayedTasks.length;
  const derived = deriveEntryStatus(entry.tasks);
  const borderAccent = STATUS_BORDER[derived] ?? "border-l-slate-700/60";

  return (
    <article
      className={`group flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden transition-colors hover:border-emerald-800/60 animate-fade-in-up border-l-4 ${borderAccent}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Card header */}
      <div className="px-4 pt-4 sm:px-5 sm:pt-5 pb-3 border-b border-slate-800/60">
        <div className="flex items-center justify-between mb-1.5">
          <span className="flex items-center gap-1.5 text-[10px] sm:text-[11px] tracking-widest uppercase text-slate-400">
            <Folder size={12} /> {entry.project}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={onView}
                className="p-1 rounded text-slate-600 hover:text-blue-400 hover:bg-blue-400/10 transition-colors"
                title="View"
              >
                <Eye size={12} />
              </button>
              <button
                onClick={onEdit}
                className="p-1 rounded text-slate-600 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                title="Edit"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={onDelete}
                className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                title="Delete"
              >
                <Trash2 size={12} />
              </button>
            </div>
            <span className="text-[10px] sm:text-[11px] font-mono text-slate-500">
              {formatDate(entry.date)}
            </span>
          </div>
        </div>
        <h3 className="font-serif text-base sm:text-lg text-slate-50 leading-snug">
          {entry.title}
        </h3>
      </div>

      {/* Task list */}
      <ul className="px-4 sm:px-5 py-3 flex flex-col gap-3">
        {displayedTasks.map((task, i) => {
          const typeKey = (task.type ?? "task") as keyof typeof TYPE_META;
          const meta = TYPE_META[typeKey] ?? TYPE_META.task;
          const Icon = meta.icon;
          const dot = TASK_STATUS_DOT[task.status] ?? "bg-slate-600";

          return (
            <li key={i} className="flex flex-col gap-2 ">
              {/* Task row */}
              <div className="flex items-start gap-1.5 ">
                <span
                  className={`mt-1.25 w-1.5 h-1.5 rounded-full shrink-0 ${dot}`}
                />
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <span className="text-xs sm:text-sm text-slate-300 leading-snug">
                    {task.title}
                  </span>
                  {(task.priority ||
                    task.complexity ||
                    task.dateRange ||
                    (task.tags && task.tags.length > 0)) && (
                    <div className="flex flex-wrap items-center gap-1">
                      {task.priority && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${PRIORITY_META[task.priority].text} ${PRIORITY_META[task.priority].bg}`}
                        >
                          {PRIORITY_META[task.priority].label}
                        </span>
                      )}
                      {task.complexity && (
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${COMPLEXITY_META[task.complexity].text} ${COMPLEXITY_META[task.complexity].bg}`}
                        >
                          {COMPLEXITY_META[task.complexity].label}
                        </span>
                      )}
                      {task.dateRange && (
                        <span className="text-[10px] text-slate-500 font-mono">
                          {task.dateRange}
                        </span>
                      )}
                      {task.tags?.map((tag) => {
                        const s = TASK_TAG_STYLE[tag];
                        return (
                          <span
                            key={tag}
                            className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${s ? `${s.text} ${s.bg} ${s.border}` : "text-slate-400 bg-slate-800 border-slate-700"}`}
                          >
                            #{tag}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <span className={`mt-0.5 shrink-0 ${meta.text}`}>
                  <Icon size={12} />
                </span>
              </div>

              {/* Compare pairs under this task */}
              {task.compare && task.compare.length > 0 && (
                <div className="ml-5 flex flex-col gap-2">
                  {task.compare.map((pair, j) => (
                    <CompareBlock
                      key={j}
                      pair={pair}
                      onImageClick={onImageClick}
                    />
                  ))}
                </div>
              )}
            </li>
          );
        })}
        {hiddenCount > 0 && (
          <li className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-800/50 mt-1">
            <Eye size={11} />
            <span>+{hiddenCount} more task{hiddenCount > 1 ? "s" : ""} — click eye icon to view all</span>
          </li>
        )}
      </ul>

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="px-4 sm:px-5 pb-3 flex flex-wrap gap-1.5">
          {entry.tags.map((t) => (
            <span
              key={t}
              className="text-[10px] text-slate-500 border border-slate-800 rounded-md px-1.5 py-0.5"
            >
              #{t}
            </span>
          ))}
        </div>
      )}

      {/* Card-level media */}
      {entry.media && entry.media.length > 0 && (
        <div
          className={`px-4 sm:px-5 pb-4 grid gap-2 ${
            entry.media.length > 1 ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          {entry.media.map((m, i) => (
            <figure key={i} className="m-0">
              {m.kind === "video" ? (
                <video
                  controls
                  className="w-full h-28 sm:h-32 object-cover rounded-lg border border-slate-800 bg-slate-950"
                >
                  <source src={m.src} />
                </video>
              ) : (
                <img
                  src={m.src}
                  alt={m.caption || entry.title}
                  onClick={() => onImageClick(m.src)}
                  className="w-full h-28 sm:h-32 object-cover rounded-lg border border-slate-800 cursor-zoom-in"
                />
              )}
              {m.caption && (
                <figcaption className="flex items-center gap-1 text-[10px] text-slate-500 mt-1">
                  {m.kind === "video" ? (
                    <VideoIcon size={10} />
                  ) : (
                    <ImageIcon size={10} />
                  )}
                  {m.caption}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}
    </article>
  );
}

// ════════════════════════════════════════════════════════════════════
// View Entry Modal — focused single-entry overlay
// ════════════════════════════════════════════════════════════════════
function ViewEntryModal({
  entry,
  onClose,
  onEdit,
  onImageClick,
}: {
  entry: Entry | null;
  onClose: () => void;
  onEdit: () => void;
  onImageClick: (src: string) => void;
}) {
  useEffect(() => {
    document.body.style.overflow = entry ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [entry]);

  if (!entry) return null;
  const derived = deriveEntryStatus(entry.tasks);
  const borderAccent = STATUS_BORDER[derived] ?? "border-l-slate-700/60";

  return (
    <>
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm"
      />
      <div className="fixed z-55 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[88vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <span className={`w-2 h-2 rounded-full ${STATUS_META[derived]?.dot ?? "bg-slate-600"}`} />
            <span className="flex items-center gap-1 tracking-widest uppercase">
              <Folder size={11} /> {entry.project}
            </span>
            <span className="text-slate-700">·</span>
            <span className="font-mono text-slate-500">{formatDate(entry.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-emerald-800/60 text-emerald-400 hover:bg-emerald-400/10 transition-colors"
            >
              <Pencil size={12} /> Edit
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className={`flex-1 overflow-y-auto border-l-4 ${borderAccent}`}>
          {/* Title */}
          <div className="px-6 pt-6 pb-4">
            <h2 className="font-serif text-2xl sm:text-3xl text-slate-50 leading-snug">
              {entry.title}
            </h2>
          </div>

          {/* Tasks */}
          <ul className="px-6 pb-5 flex flex-col gap-5">
            {entry.tasks.map((task, i) => {
              const typeKey = (task.type ?? "task") as keyof typeof TYPE_META;
              const meta = TYPE_META[typeKey] ?? TYPE_META.task;
              const Icon = meta.icon;
              const dot = TASK_STATUS_DOT[task.status] ?? "bg-slate-600";
              return (
                <li key={i} className="flex flex-col gap-2">
                  <div className="flex items-start gap-3">
                    <span className={`mt-2 w-2 h-2 rounded-full shrink-0 ${dot}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base text-slate-200 leading-snug">
                        {task.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide flex items-center gap-1 ${meta.text} ${meta.bg}`}
                        >
                          <Icon size={10} /> {meta.label}
                        </span>
                        {task.priority && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${PRIORITY_META[task.priority].text} ${PRIORITY_META[task.priority].bg}`}
                          >
                            {PRIORITY_META[task.priority].label}
                          </span>
                        )}
                        {task.complexity && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide ${COMPLEXITY_META[task.complexity].text} ${COMPLEXITY_META[task.complexity].bg}`}
                          >
                            {COMPLEXITY_META[task.complexity].label}
                          </span>
                        )}
                        {task.dateRange && (
                          <span className="text-[11px] text-slate-500 font-mono">
                            {task.dateRange}
                          </span>
                        )}
                        {task.tags?.map((tag) => {
                          const s = TASK_TAG_STYLE[tag];
                          return (
                            <span
                              key={tag}
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${s ? `${s.text} ${s.bg} ${s.border}` : "text-slate-400 bg-slate-800 border-slate-700"}`}
                            >
                              #{tag}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  {task.compare && task.compare.length > 0 && (
                    <div className="ml-5 flex flex-col gap-2">
                      {task.compare.map((pair, j) => (
                        <CompareBlock
                          key={j}
                          pair={pair}
                          onImageClick={onImageClick}
                        />
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {/* Entry tags */}
          {entry.tags && entry.tags.length > 0 && (
            <div className="px-6 pb-4 flex flex-wrap gap-1.5">
              {entry.tags.map((t) => (
                <span
                  key={t}
                  className="text-[11px] text-slate-500 border border-slate-800 rounded-md px-2 py-0.5"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Media */}
          {entry.media && entry.media.length > 0 && (
            <div
              className={`px-6 pb-6 grid gap-3 ${entry.media.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}
            >
              {entry.media.map((m, i) => (
                <figure key={i} className="m-0">
                  {m.kind === "video" ? (
                    <video
                      controls
                      className="w-full rounded-lg border border-slate-800 bg-slate-950"
                    >
                      <source src={m.src} />
                    </video>
                  ) : (
                    <img
                      src={m.src}
                      alt={m.caption || entry.title}
                      onClick={() => onImageClick(m.src)}
                      className="w-full rounded-lg border border-slate-800 cursor-zoom-in"
                    />
                  )}
                  {m.caption && (
                    <figcaption className="flex items-center gap-1 text-[11px] text-slate-500 mt-1.5">
                      {m.kind === "video" ? (
                        <VideoIcon size={11} />
                      ) : (
                        <ImageIcon size={11} />
                      )}
                      {m.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
