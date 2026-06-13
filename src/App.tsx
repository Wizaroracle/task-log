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
  Lock,
  Wand2,
  AlertCircle,
  BarChart2,
  Save,
  TrendingUp,
  Sparkles,
  Filter,
  ChevronUp,
  ChevronDown,
  GitCommitHorizontal,
} from "lucide-react";
import { PROFILE } from "./utils/profile-data";
import type { CompareItem, Entry, EntryMedia, RaisedIssue, Task } from "./utils/entries/entries";
import { supabase } from "./utils/supabase";
import { uploadFile } from "./utils/upload";
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

const BIBLE_VERSES = [
  { text: "Whatever you do, work at it with all your heart, as working for the Lord, not for human masters.", ref: "Colossians 3:23" },
  { text: "I can do all this through him who gives me strength.", ref: "Philippians 4:13" },
  { text: "Commit to the LORD whatever you do, and he will establish your plans.", ref: "Proverbs 16:3" },
  { text: "Do not grow weary in doing good, for at the proper time we will reap a harvest if we do not give up.", ref: "Galatians 6:9" },
  { text: "Whatever your hand finds to do, do it with all your might.", ref: "Ecclesiastes 9:10" },
  { text: "Be strong and courageous. Do not be afraid; do not be discouraged, for the LORD your God will be with you wherever you go.", ref: "Joshua 1:9" },
  { text: "The plans of the diligent lead to profit as surely as haste leads to poverty.", ref: "Proverbs 21:5" },
  { text: "For we are God's handiwork, created in Christ Jesus to do good works, which God prepared in advance for us to do.", ref: "Ephesians 2:10" },
  { text: "Trust in the LORD with all your heart and lean not on your own understanding; in all your ways submit to him, and he will make your paths straight.", ref: "Proverbs 3:5-6" },
  { text: "For God gave us a spirit not of fear but of power and love and self-control.", ref: "2 Timothy 1:7" },
  { text: "Let all that you do be done in love.", ref: "1 Corinthians 16:14" },
  { text: "Blessed is the one who perseveres under trial because, having stood the test, that person will receive the crown of life.", ref: "James 1:12" },
  { text: "She is clothed with strength and dignity; she can laugh at the days to come.", ref: "Proverbs 31:25" },
  { text: "For nothing will be impossible with God.", ref: "Luke 1:37" },
  { text: "And whatever you do, in word or deed, do everything in the name of the Lord Jesus, giving thanks to God the Father through him.", ref: "Colossians 3:17" },
  { text: "The LORD will fulfill his purpose for me; your steadfast love, O LORD, endures forever.", ref: "Psalm 138:8" },
  { text: "Let your light shine before others, that they may see your good deeds and glorify your Father in heaven.", ref: "Matthew 5:16" },
  { text: "In all your ways acknowledge him, and he will make straight your paths.", ref: "Proverbs 3:6" },
  { text: "Take heart! I have overcome the world.", ref: "John 16:33" },
  { text: "No eye has seen, no ear has heard, no mind has conceived what God has prepared for those who love him.", ref: "1 Corinthians 2:9" },
  { text: "The LORD your God is with you, the Mighty Warrior who saves.", ref: "Zephaniah 3:17" },
  { text: "Ask and it will be given to you; seek and you will find; knock and the door will be opened to you.", ref: "Matthew 7:7" },
] as const;

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

const WIZARD_PASSWORD = import.meta.env.VITE_PASSWORD;
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
  const [quickAddProject, setQuickAddProject] = useState<"VC+" | "VC+ CMS">("VC+");
  const [quickAdd, setQuickAdd] = useState({
    title: "",
    priority: "",
    complexity: "",
    type: "",
    tags: [] as string[],
  });
  const [quickAddMedia, setQuickAddMedia] = useState<Array<{ file: File | null; preview: string; caption: string }>>([]);
  const [quickAddCompare, setQuickAddCompare] = useState<Array<{
    label: string;
    before: { file: File | null; preview: string; note: string };
    after: { file: File | null; preview: string; note: string };
  }>>([]);
  const [backlogTagFilter, setBacklogTagFilter] = useState("all");
  const [backlogFilterOpen, setBacklogFilterOpen] = useState(false);
  const [backlogPriorityFilter, setBacklogPriorityFilter] = useState("all");
  const [backlogComplexityFilter, setBacklogComplexityFilter] = useState("all");
  const [backlogTypeFilter, setBacklogTypeFilter] = useState("all");
  const [backlogPage, setBacklogPage] = useState(1);
  const [inProgressPage, setInProgressPage] = useState(1);
  const [page, setPage] = useState(1);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [zoomSrc, setZoomSrc] = useState<string | null>(null);
  const [compareZoom, setCompareZoom] = useState<CompareItem | null>(null);
  const [viewingEntry, setViewingEntry] = useState<Entry | null>(null);
  const [readOnly, setReadOnly] = useState<boolean>(
    () => sessionStorage.getItem("vc-mode") !== "wizard",
  );
  const [wizardModalOpen, setWizardModalOpen] = useState(false);
  const [wizardInput, setWizardInput] = useState("");
  const [wizardError, setWizardError] = useState(false);

  // Completed panel
  const [completedOpen, setCompletedOpen] = useState(false);

  // Stats + heatmap collapse
  const [statsOpen, setStatsOpen] = useState(true);
  const [heatmapOpen, setHeatmapOpen] = useState(true);

  // Completion toasts — stacked array, newest first
  const [toasts, setToasts] = useState<Array<{ id: string; headline: string; sub: string; verse: string; ref: string }>>([]);

  function fireCompletionToast(task?: { type?: string; complexity?: string; priority?: string }, forIssue = false) {
    const { text, ref } = BIBLE_VERSES[Math.floor(Math.random() * BIBLE_VERSES.length)];
    let headline = "Nice work! ✅";
    let sub = "Another task checked off. Keep building!";
    if (forIssue) {
      headline = "Issue resolved! 🛡️";
      sub = "You tracked it down and fixed it. That's real dedication.";
    } else if (task?.type === "milestone") {
      headline = "Milestone reached! 🏆";
      sub = "This one marks real progress. Big deal!";
    } else if (task?.complexity === "complex") {
      headline = "You crushed a complex task! 🧠";
      sub = "That kind of deep work is what separates good engineers from great ones.";
    } else if (task?.complexity === "hard") {
      headline = "Hard task, done! 💪";
      sub = "Nothing stopped you. That's the mindset.";
    } else if (task?.priority === "urgent") {
      headline = "Clutch! ⚡";
      sub = "You handled that urgent task like a pro. Pressure? What pressure?";
    } else if (task?.type === "bugfix") {
      headline = "Bug squashed! 🐛";
      sub = "The codebase is cleaner and users are happier. Win-win.";
    } else if (task?.type === "feature") {
      headline = "Feature shipped! 🚀";
      sub = "Another piece of the product brought to life. Users will love it.";
    } else if (task?.type === "optimized") {
      headline = "Optimization complete! ⚡";
      sub = "Performance gains that real users will feel. Great work.";
    } else if (task?.type === "refactor") {
      headline = "Cleaner code! 🏗️";
      sub = "The next dev to touch this will thank you. Future-you included.";
    } else if (task?.type === "learning") {
      headline = "Knowledge gained! 📖";
      sub = "Every lesson compounds. You're investing in yourself.";
    }
    const id = crypto.randomUUID();
    setToasts(prev => [{ id, headline, sub, verse: text, ref }, ...prev]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 7000);
  }

  // Raised Issues — report modal
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [issues, setIssues] = useState<RaisedIssue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesProjectFilter, setIssuesProjectFilter] = useState("all");
  const [reportDateFrom, setReportDateFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10); });
  const [reportDateTo, setReportDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  // Raised Issues — dashboard panel
  const [editingIssue, setEditingIssue] = useState<RaisedIssue | null>(null);
  const [issueFormOpen, setIssueFormOpen] = useState(false);
  const [issueForm, setIssueForm] = useState<Partial<RaisedIssue>>({});
  const [dashIssueStatusFilter, setDashIssueStatusFilter] = useState("open");
  const [dashIssuePage, setDashIssuePage] = useState(1);
  const [dashIssueProjectFilter, setDashIssueProjectFilter] = useState("all");

  // Raised Issue detail modal (media / compare)
  const [detailIssue, setDetailIssue] = useState<RaisedIssue | null>(null);

  // Backlog inline edit
  const [editingBacklogTask, setEditingBacklogTask] = useState<import("./components/AddEntryModal").InProgressItem | null>(null);
  const [backlogEditForm, setBacklogEditForm] = useState<{ title: string; priority: string; complexity: string; type: string; project: string }>({ title: "", priority: "", complexity: "", type: "", project: "" });
  const [backlogEditMedia, setBacklogEditMedia] = useState<Array<{ file: File | null; preview: string; caption: string }>>([]);
  const [backlogEditCompare, setBacklogEditCompare] = useState<Array<{ label: string; before: { file: File | null; preview: string; note: string }; after: { file: File | null; preview: string; note: string } }>>([]);
  const [backlogEditSaving, setBacklogEditSaving] = useState(false);

  const requestWizardMode = () => {
    if (!readOnly) {
      // Already in wizard mode — lock immediately
      setReadOnly(true);
      sessionStorage.setItem("vc-mode", "readonly");
    } else {
      // Prompt for password
      setWizardInput("");
      setWizardError(false);
      setWizardModalOpen(true);
    }
  };

  const confirmWizardPassword = () => {
    if (wizardInput === WIZARD_PASSWORD) {
      setReadOnly(false);
      sessionStorage.setItem("vc-mode", "wizard");
      setWizardModalOpen(false);
      setWizardInput("");
      setWizardError(false);
    } else {
      setWizardError(true);
      setWizardInput("");
    }
  };

  // ── Raised Issues CRUD ──────────────────────────────────────────
  async function loadIssues() {
    setIssuesLoading(true);
    const { data, error } = await supabase
      .from("raised_issues")
      .select("*")
      .order("date_raised", { ascending: false });
    if (!error && data) setIssues(data as RaisedIssue[]);
    setIssuesLoading(false);
  }

  async function saveIssue() {
    if (!issueForm.title?.trim() || !issueForm.project) return;
    if (editingIssue) {
      const { error } = await supabase
        .from("raised_issues")
        .update({ ...issueForm })
        .eq("id", editingIssue.id);
      if (!error) {
        setIssues((prev) => prev.map((i) => i.id === editingIssue.id ? { ...i, ...issueForm } as RaisedIssue : i));
        setEditingIssue(null);
        setIssueFormOpen(false);
        setIssueForm({});
      }
    } else {
      const payload = {
        project: issueForm.project,
        title: issueForm.title,
        description: issueForm.description ?? "",
        type: issueForm.type ?? "bugfix",
        priority: issueForm.priority ?? "major",
        status: "open" as const,
        date_raised: issueForm.date_raised ?? new Date().toISOString().slice(0, 10),
      };
      const { data, error } = await supabase.from("raised_issues").insert(payload).select().single();
      if (!error && data) {
        setIssues((prev) => [data as RaisedIssue, ...prev]);
        setIssueFormOpen(false);
        setIssueForm({});
      }
    }
  }

  async function deleteIssue(issue: RaisedIssue) {
    const { error } = await supabase.from("raised_issues").delete().eq("id", issue.id);
    if (!error) setIssues((prev) => prev.filter((i) => i.id !== issue.id));
  }

  async function startIssue(issue: RaisedIssue) {
    const patch: Partial<RaisedIssue> = { status: "in_progress", date_started: new Date().toISOString().slice(0, 10) };
    const { error } = await supabase.from("raised_issues").update(patch).eq("id", issue.id);
    if (!error) setIssues((prev) => prev.map((i) => i.id === issue.id ? { ...i, ...patch } : i));
  }

  async function toggleIssueStatus(issue: RaisedIssue) {
    const newStatus = issue.status === "resolved" ? "open" : "resolved";
    const patch: Partial<RaisedIssue> = { status: newStatus };
    if (newStatus === "resolved") patch.date_resolved = new Date().toISOString().slice(0, 10);
    else { patch.date_resolved = undefined; patch.date_started = undefined; }
    const { error } = await supabase.from("raised_issues").update(patch).eq("id", issue.id);
    if (!error) {
      setIssues((prev) => prev.map((i) => i.id === issue.id ? { ...i, ...patch } : i));
      if (newStatus === "resolved") fireCompletionToast(undefined, true);
    }
  }

  // ── Backlog task inline edit ─────────────────────────────────────
  async function saveBacklogEdit() {
    if (!editingBacklogTask || !backlogEditForm.title.trim()) return;
    const entry = entries.find((e) => e.id === editingBacklogTask.entryId);
    if (!entry) return;
    setBacklogEditSaving(true);
    try {
      const media: import("./utils/entries/entries").EntryMedia[] = backlogEditMedia.length > 0
        ? await Promise.all(backlogEditMedia.map(async (m) => ({
            kind: "image" as const,
            src: m.file ? await uploadFile(m.file) : m.preview,
            caption: m.caption || undefined,
          })))
        : [];
      const compare: import("./utils/entries/entries").CompareItem[] = backlogEditCompare.length > 0
        ? await Promise.all(backlogEditCompare.map(async (c) => ({
            label: c.label || undefined,
            before: { src: c.before.file ? await uploadFile(c.before.file) : c.before.preview, note: c.before.note },
            after:  { src: c.after.file  ? await uploadFile(c.after.file)  : c.after.preview,  note: c.after.note  },
          })))
        : [];
      const updatedTasks = entry.tasks.map((t) =>
        t.title === editingBacklogTask.task.title && t.status === "planned"
          ? {
              ...t,
              title: backlogEditForm.title.trim(),
              type: (backlogEditForm.type || undefined) as Task["type"],
              priority: (backlogEditForm.priority || undefined) as Task["priority"],
              complexity: (backlogEditForm.complexity || undefined) as Task["complexity"],
              ...(compare.length > 0 ? { compare } : { compare: undefined }),
              ...(media.length > 0   ? { media }   : { media: undefined }),
            }
          : t,
      );
      const updates: Record<string, unknown> = { tasks: updatedTasks };
      if (backlogEditForm.project && backlogEditForm.project !== entry.project) {
        updates.project = backlogEditForm.project;
      }
      const { error } = await supabase.from("entries").update(updates).eq("id", entry.id);
      if (!error) {
        setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, ...updates, tasks: updatedTasks } : e));
        setEditingBacklogTask(null);
        setBacklogEditMedia([]);
        setBacklogEditCompare([]);
      }
    } finally {
      setBacklogEditSaving(false);
    }
  }

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

  useEffect(() => { loadIssues(); }, []);

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
  }, [backlogTagFilter, backlogPriorityFilter, backlogComplexityFilter, backlogTypeFilter]);

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
            entryProject: e.project,
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
            entryProject: e.project,
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

  const PRIORITY_ORDER: Record<string, number> = { urgent: 0, major: 1, minor: 2 };

  const filteredPlannedItems = useMemo(() => {
    let base =
      backlogTagFilter === "all"
        ? plannedItems
        : plannedItems.filter((item) =>
            (item.task.tags ?? []).includes(backlogTagFilter),
          );
    if (backlogPriorityFilter !== "all")
      base = base.filter((item) => item.task.priority === backlogPriorityFilter);
    if (backlogComplexityFilter !== "all")
      base = base.filter((item) => item.task.complexity === backlogComplexityFilter);
    if (backlogTypeFilter !== "all")
      base = base.filter((item) => (item.task.type ?? "task") === backlogTypeFilter);
    return [...base].sort(
      (a, b) =>
        (PRIORITY_ORDER[a.task.priority ?? ""] ?? 3) -
        (PRIORITY_ORDER[b.task.priority ?? ""] ?? 3),
    );
  }, [plannedItems, backlogTagFilter, backlogPriorityFilter, backlogComplexityFilter, backlogTypeFilter]);

  const stats = useMemo(() => {
    const base =
      project === "all"
        ? entries
        : entries.filter((e) => e.project === project);
    const allTasks = base.flatMap((e) => e.tasks);
    const resolvedIssueCount = issues.filter(
      (i) => i.status === "resolved" && (project === "all" || i.project === project)
    ).length;
    return {
      total: allTasks.length,
      features: allTasks.filter((t) => t.type === "feature").length,
      bugs: allTasks.filter((t) => t.type === "bugfix").length + resolvedIssueCount,
      optimized: allTasks.filter((t) => t.type === "optimized").length,
      tasks: allTasks.filter((t) => (t.type ?? "task") === "task").length,
      milestones: allTasks.filter((t) => t.type === "milestone").length,
      refactors: allTasks.filter((t) => t.type === "refactor").length,
      learnings: allTasks.filter((t) => t.type === "learning").length,
    };
  }, [entries, issues, project]);


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
    const taskMeta = affected[0]?.tasks.find(t => t.title === taskTitle && t.status === "progress");
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
      fireCompletionToast(taskMeta);
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
    if (!sourceEntry) { setActionLoading(null); return; }

    const taskAsProgress: Task = { ...item.task, status: "progress" };

    try {
      // Snapshot to accumulate all mutations, applied in one setEntries call at the end
      let snap = [...entries];
      const applyUpdate = (id: string, tasks: Task[], date?: string) => {
        snap = snap.map(e => e.id === id ? { ...e, tasks, ...(date ? { date } : {}) } : e);
      };
      const applyDelete = (id: string) => { snap = snap.filter(e => e.id !== id); };

      // Find today's consolidation entry (dated today, not the source)
      const todayEntry = entries.find(e => e.date === today && e.id !== item.entryId);

      if (sourceEntry.date === today) {
        // Source is already today — just flip status in place
        const updated = sourceEntry.tasks.map(t =>
          t.title === item.task.title && t.status === "planned" ? taskAsProgress : t
        );
        await supabase.from("entries").update({ tasks: updated }).eq("id", sourceEntry.id);
        applyUpdate(sourceEntry.id, updated);

      } else if (todayEntry) {
        // Consolidate: add task to today's existing entry (deduplicated)
        if (!todayEntry.tasks.some(t => t.title === item.task.title)) {
          const newTasks = [...todayEntry.tasks, taskAsProgress];
          await supabase.from("entries").update({ tasks: newTasks }).eq("id", todayEntry.id);
          applyUpdate(todayEntry.id, newTasks);
        }
        // Remove task from source entry; delete source if it becomes empty
        const remainingSource = sourceEntry.tasks.filter(
          t => !(t.title === item.task.title && t.status === "planned")
        );
        if (remainingSource.length === 0) {
          await supabase.from("entries").delete().eq("id", sourceEntry.id);
          applyDelete(sourceEntry.id);
        } else {
          await supabase.from("entries").update({ tasks: remainingSource }).eq("id", sourceEntry.id);
          applyUpdate(sourceEntry.id, remainingSource);
        }

      } else {
        // No today's entry — check how many tasks remain in source after removing this one
        const remainingSource = sourceEntry.tasks.filter(
          t => !(t.title === item.task.title && t.status === "planned")
        );
        if (remainingSource.length === 0) {
          // Source only had this task → repurpose it as today's entry
          await supabase.from("entries").update({ tasks: [taskAsProgress], date: today }).eq("id", sourceEntry.id);
          applyUpdate(sourceEntry.id, [taskAsProgress], today);
        } else {
          // Source has other tasks → trim source, create a fresh today entry
          await supabase.from("entries").update({ tasks: remainingSource }).eq("id", sourceEntry.id);
          applyUpdate(sourceEntry.id, remainingSource);
          const { data: inserted } = await supabase
            .from("entries")
            .insert({ project: sourceEntry.project, date: today, title: sourceEntry.title, tasks: [taskAsProgress] })
            .select()
            .single();
          if (inserted) snap = [...snap, inserted as Entry];
        }
      }

      // Remove any other "planned" duplicates of this task across remaining entries
      const skipIds = new Set([item.entryId, todayEntry?.id].filter(Boolean) as string[]);
      for (const e of entries.filter(en => !skipIds.has(en.id))) {
        const hasDuplicate = e.tasks.some(t => t.title === item.task.title && t.status === "planned");
        if (!hasDuplicate) continue;
        const cleaned = e.tasks.filter(t => !(t.title === item.task.title && t.status === "planned"));
        if (cleaned.length === 0) {
          await supabase.from("entries").delete().eq("id", e.id);
          applyDelete(e.id);
        } else {
          await supabase.from("entries").update({ tasks: cleaned }).eq("id", e.id);
          applyUpdate(e.id, cleaned);
        }
      }

      setEntries(snap);
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
    try {
      const today = new Date().toISOString().slice(0, 10);

      const media: import("./utils/entries/entries").EntryMedia[] = quickAddMedia.length > 0
        ? await Promise.all(quickAddMedia.map(async (m) => ({
            kind: "image" as const,
            src: m.file ? await uploadFile(m.file) : m.preview,
            caption: m.caption || undefined,
          })))
        : [];

      const compare: import("./utils/entries/entries").CompareItem[] = quickAddCompare.length > 0
        ? await Promise.all(quickAddCompare.map(async (c) => ({
            label: c.label || undefined,
            before: { src: c.before.file ? await uploadFile(c.before.file) : c.before.preview, note: c.before.note },
            after:  { src: c.after.file  ? await uploadFile(c.after.file)  : c.after.preview,  note: c.after.note },
          })))
        : [];

      const newEntry: Entry = {
        id: crypto.randomUUID(),
        project: quickAddProject,
        date: today,
        title: quickAdd.title.trim(),
        tasks: [
          {
            title: quickAdd.title.trim(),
            status: "planned",
            ...(quickAdd.type ? { type: quickAdd.type as Task["type"] } : {}),
            ...(quickAdd.priority ? { priority: quickAdd.priority as Task["priority"] } : {}),
            ...(quickAdd.complexity ? { complexity: quickAdd.complexity as Task["complexity"] } : {}),
            ...(quickAdd.tags.length > 0 ? { tags: quickAdd.tags } : {}),
            ...(compare.length > 0 ? { compare } : {}),
            ...(media.length > 0 ? { media } : {}),
          },
        ],
      };
      const { error } = await supabase.from("entries").insert(newEntry);
      if (!error) {
        setEntries((prev) => [newEntry, ...prev]);
        setQuickAdd({ title: "", priority: "", complexity: "", type: "", tags: [] });
        setQuickAddMedia([]);
        setQuickAddCompare([]);
        setQuickAddOpen(false);
      }
    } finally {
      setQuickAddSaving(false);
    }
  }

  const hasFilters =
    project !== "all" || type !== "all" || search.trim() || dateFrom || dateTo;

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 overflow-hidden">
      <BackgroundDecor />

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* ── Header ─────────────────────────────────────────── */}
        <header className="mb-4 sm:mb-5 flex items-center justify-between gap-4">
          <div>
            <div className="text-[11px] sm:text-xs font-bold tracking-[0.25em] uppercase text-emerald-400 mb-2 animate-fade-in">
              victoria court - Nel
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-4xl tracking-tight text-slate-50 animate-fade-in-up">
              WIZARD LOGS
            </h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5 sm:gap-2 shrink-0 max-w-[55%] sm:max-w-none">
            {(() => {
              const doneCount = entries.flatMap(e => e.tasks).filter(t => t.status === "done").length
                + issues.filter(i => i.status === "resolved").length;
              return (
                <button
                  onClick={() => setCompletedOpen(true)}
                  className="relative flex items-center gap-1.5 rounded-xl border border-emerald-700/40 bg-emerald-400/10 text-emerald-300 text-xs font-medium px-2.5 py-2 sm:px-4 sm:py-2.5 hover:bg-emerald-400/20 transition-colors animate-fade-in-up [animation-delay:10ms]"
                  title="Completed Work"
                >
                  <CheckCircle2 size={14} />
                  <span className="hidden sm:inline">Completed</span>
                  {doneCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-4.5 h-4.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold px-1 leading-none">
                      {doneCount}
                    </span>
                  )}
                </button>
              );
            })()}
            <button
              onClick={() => setIssuesOpen(true)}
              className="relative flex items-center gap-1.5 rounded-xl border border-red-700/40 bg-red-400/10 text-red-300 text-xs font-medium px-2.5 py-2 sm:px-4 sm:py-2.5 hover:bg-red-400/20 transition-colors animate-fade-in-up [animation-delay:20ms]"
              title="Issues Report"
            >
              <AlertCircle size={14} />
              <span className="hidden sm:inline">Issues</span>
              {issues.filter(i => i.status !== "resolved").length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-4.5 h-4.5 rounded-full bg-red-500 text-white text-[9px] font-bold px-1 leading-none">
                  {issues.filter(i => i.status !== "resolved").length}
                </span>
              )}
            </button>
            {(() => {
              const ipCount = inProgressItems.length + issues.filter(i => i.status === "in_progress").length;
              return ipCount > 0 ? (
                <span className="flex items-center gap-1.5 text-xs text-yellow-400/80 font-medium px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-yellow-400/8 border border-yellow-400/20 animate-fade-in-up [animation-delay:30ms]">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
                  <span className="hidden sm:inline">{ipCount} in progress</span>
                  <span className="sm:hidden font-mono text-[11px]">{ipCount}</span>
                </span>
              ) : null;
            })()}
            {!readOnly && (
              <button
                onClick={() => setFormOpen(true)}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-700/40 bg-emerald-400/10 text-emerald-300 text-xs font-medium px-2.5 py-2 sm:px-4 sm:py-2.5 hover:bg-emerald-400/20 transition-colors animate-fade-in-up [animation-delay:40ms]"
              >
                <Plus size={14} />
                <span className="hidden sm:inline">New Entry</span>
              </button>
            )}
            <ProfileButton
              open={profileOpen}
              onToggle={() => setProfileOpen((o) => !o)}
              readOnly={readOnly}
            />
          </div>
        </header>

        {/* ── Stats + Heatmap ───────────────────────────────── */}
        <div className="mb-6">
          {/* Toggle bar — only shown in wizard mode; read-only always sees both */}
          {!readOnly && (
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setStatsOpen(o => !o)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold tracking-[0.2em] uppercase transition-colors select-none ${statsOpen ? "bg-slate-800 text-slate-300" : "text-slate-600 hover:text-slate-400"}`}
              >
                {statsOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                Stats
              </button>
              <button
                onClick={() => setHeatmapOpen(o => !o)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold tracking-[0.2em] uppercase transition-colors select-none ${heatmapOpen ? "bg-slate-800 text-slate-300" : "text-slate-600 hover:text-slate-400"}`}
              >
                {heatmapOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                Activity
              </button>
            </div>
          )}

          {/* Content — always visible in read-only; toggleable in wizard mode */}
          {(readOnly || statsOpen || heatmapOpen) && (
            <div className="flex flex-col xl:flex-row gap-4">
              {(readOnly || statsOpen) && (
                <div className="flex-1 min-w-0">
                  <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <StatCard label="Total Tasks" value={stats.total}      accent="border-teal-400/60"    accentBg="bg-teal-400/8"     icon={CheckCircle2}      iconColor="text-teal-400"    delay={0}   />
                    <StatCard label="Features"    value={stats.features}   accent="border-emerald-300/60" accentBg="bg-emerald-400/8"  icon={ArrowUpNarrowWide} iconColor="text-emerald-400" delay={40}  />
                    <StatCard label="Bug Fixes"   value={stats.bugs}       accent="border-orange-400/60"  accentBg="bg-orange-400/8"   icon={Bug}               iconColor="text-orange-400"  delay={80}  />
                    <StatCard label="Optimized"   value={stats.optimized}  accent="border-cyan-400/60"    accentBg="bg-cyan-400/8"     icon={Zap}               iconColor="text-cyan-400"    delay={120} />
                    <StatCard label="Tasks"       value={stats.tasks}      accent="border-teal-300/60"    accentBg="bg-teal-400/8"     icon={CheckCircle2}      iconColor="text-teal-300"    delay={160} />
                    <StatCard label="Milestones"  value={stats.milestones} accent="border-yellow-400/60"  accentBg="bg-yellow-400/8"   icon={ArrowRight}        iconColor="text-yellow-400"  delay={200} />
                    <StatCard label="Refactored"  value={stats.refactors}  accent="border-purple-400/60"  accentBg="bg-purple-400/8"   icon={RefreshCw}         iconColor="text-purple-400"  delay={240} />
                    <StatCard label="Learnings"   value={stats.learnings}  accent="border-violet-400/60"  accentBg="bg-violet-400/8"   icon={BookOpen}          iconColor="text-violet-400"  delay={280} />
                  </section>
                </div>
              )}
              {(readOnly || heatmapOpen) && (
                <div className="xl:w-105 shrink-0 flex flex-col">
                  <GitHubHeatmap entries={entries} issues={issues} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── In Progress + Issues panels ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* In Progress */}
          {(() => {
            const IP_PER_PAGE = 5;
            const ipTotalPages = Math.ceil(
              inProgressItems.length / IP_PER_PAGE,
            );
            const pagedIP = inProgressItems.slice(
              (inProgressPage - 1) * IP_PER_PAGE,
              inProgressPage * IP_PER_PAGE,
            );
            const inProgressIssues = issues.filter(i => i.status === "in_progress");
            const totalInProgress = inProgressItems.length + inProgressIssues.length;
            return (
              <section className="flex flex-col gap-3 p-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse shrink-0" />
                  <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-yellow-400">
                    In Progress
                  </span>
                  <span className="text-[11px] text-slate-600">
                    {totalInProgress}
                  </span>
                </div>
                {totalInProgress === 0 ? (
                  <p className="text-xs text-slate-600 py-2">
                    No tasks in progress.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-col gap-0.5">

                      {/* ── Raised Issues ── */}
                      {inProgressIssues.length > 0 && (
                        <>
                          <div className="flex items-center gap-1.5 px-2 pt-1 pb-2">
                            <AlertCircle size={10} className="text-red-400/80" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-500">Raised Issues</span>
                            <span className="text-[9px] text-slate-700">{inProgressIssues.length}</span>
                          </div>
                          {inProgressIssues.map(issue => {
                            const tm = ISSUE_TYPE_META[issue.type] ?? ISSUE_TYPE_META.other;
                            const pm = PRIORITY_META[issue.priority];
                            return (
                              <div key={issue.id} className="group flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:border-slate-800 hover:bg-slate-800/25 transition-all">
                                {/* Left accent dot */}
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400/70 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[9px] text-slate-600 font-medium">{issue.project}</span>
                                    <span className={`text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide ${tm.text} ${tm.bg}`}>{tm.label}</span>
                                    {pm && <span className={`text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide ${pm.text} ${pm.bg}`}>{pm.label}</span>}
                                  </div>
                                  <button onClick={() => setDetailIssue(issue)} className="text-[13px] font-medium text-slate-200 leading-snug text-left hover:text-emerald-300 transition-colors">
                                    {issue.title}
                                  </button>
                                  {issue.date_started && <p className="text-[10px] text-slate-600 mt-0.5">started {issue.date_started}</p>}
                                </div>
                                {!readOnly && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => toggleIssueStatus(issue)} className="text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 transition-colors whitespace-nowrap">
                                      ✓ Resolve
                                    </button>
                                    <button
                                      onClick={async () => {
                                        const patch: Partial<RaisedIssue> = { status: "open", date_started: undefined };
                                        const { error } = await supabase.from("raised_issues").update(patch).eq("id", issue.id);
                                        if (!error) setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, ...patch } : i));
                                      }}
                                      className="text-[10px] px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors whitespace-nowrap"
                                    >
                                      ← Open
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </>
                      )}

                      {/* Section divider between raised issues and tasks */}
                      {inProgressIssues.length > 0 && pagedIP.length > 0 && (
                        <div className="flex items-center gap-2 px-2 pt-3 pb-2">
                          <div className="h-px flex-1 bg-slate-800/60" />
                          <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/70" />
                            <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-500">Tasks</span>
                            <span className="text-[9px] text-slate-700">{pagedIP.length}</span>
                          </div>
                          <div className="h-px flex-1 bg-slate-800/60" />
                        </div>
                      )}
                      {inProgressIssues.length === 0 && pagedIP.length > 0 && (
                        <div className="flex items-center gap-1.5 px-2 pt-1 pb-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/70" />
                          <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-slate-500">Tasks</span>
                          <span className="text-[9px] text-slate-700">{pagedIP.length}</span>
                        </div>
                      )}

                      {/* ── Regular tasks ── */}
                      {pagedIP.map((item, i) => {
                        const typeKey = (item.task.type ?? "task") as keyof typeof TYPE_META;
                        const tm = TYPE_META[typeKey] ?? TYPE_META.task;
                        const TIcon = tm.icon;
                        return (
                          <div key={i} className="group flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:border-slate-800 hover:bg-slate-800/25 transition-all">
                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400/80 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[9px] text-slate-600 font-medium">{item.entryProject}</span>
                                <span className={`flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide ${tm.text} ${tm.bg}`}>
                                  <TIcon size={8} />{tm.label}
                                </span>
                                {item.task.priority && (
                                  <span className={`text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide ${PRIORITY_META[item.task.priority].text} ${PRIORITY_META[item.task.priority].bg}`}>
                                    {PRIORITY_META[item.task.priority].label}
                                  </span>
                                )}
                                {item.task.complexity && (
                                  <span className={`text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide ${COMPLEXITY_META[item.task.complexity].text} ${COMPLEXITY_META[item.task.complexity].bg}`}>
                                    {COMPLEXITY_META[item.task.complexity].label}
                                  </span>
                                )}
                              </div>
                              <p className="text-[13px] font-medium text-slate-200 leading-snug">{item.task.title}</p>
                              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                {(item.task.tags ?? []).map((tag) => {
                                  const s = TASK_TAG_STYLE[tag];
                                  return (
                                    <span key={tag} className={`text-[9px] font-medium px-1.5 py-px rounded-full border ${s ? `${s.text} ${s.bg} ${s.border}` : "text-slate-500 bg-slate-800 border-slate-700"}`}>
                                      #{tag}
                                    </span>
                                  );
                                })}
                                <span className="text-[10px] text-slate-600">started {formatDate(item.entryDate)}</span>
                              </div>
                            </div>
                            {!readOnly && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => markTaskDone(item.task.title)}
                                  disabled={actionLoading === item.task.title}
                                  className="text-[10px] px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-40 whitespace-nowrap"
                                >
                                  ✓ Done
                                </button>
                                <button
                                  onClick={() => markTaskPlanned(item.task.title)}
                                  disabled={actionLoading === item.task.title}
                                  className="text-[10px] px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors disabled:opacity-40 whitespace-nowrap"
                                >
                                  → Plan
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {ipTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-2 border-t border-yellow-400/10">
                        <button
                          onClick={() =>
                            setInProgressPage((p) => Math.max(1, p - 1))
                          }
                          disabled={inProgressPage === 1}
                          className="text-[10px] px-2 py-1 text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors"
                        >
                          ← Prev
                        </button>
                        <span className="text-[10px] text-slate-600">
                          {inProgressPage} / {ipTotalPages}
                        </span>
                        <button
                          onClick={() =>
                            setInProgressPage((p) =>
                              Math.min(ipTotalPages, p + 1),
                            )
                          }
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

          {/* ── Raised Issues dashboard panel ── */}
          {(() => {
            const ISS_PER_PAGE = 7;
            const PRIORITY_RANK: Record<string, number> = { urgent: 0, major: 1, minor: 2 };
            const STATUS_ORDER: Record<string, number> = { open: 0, in_progress: 1, resolved: 2 };
            const sortedIssues = [...issues]
              .filter(i => dashIssueProjectFilter === "all" || i.project === dashIssueProjectFilter)
              .filter(i => dashIssueStatusFilter === "all" ? true : i.status === dashIssueStatusFilter)
              .sort((a, b) => {
                const sd = (STATUS_ORDER[a.status] ?? 3) - (STATUS_ORDER[b.status] ?? 3);
                if (sd !== 0) return sd;
                return (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3);
              });
            const issTotalPages = Math.ceil(sortedIssues.length / ISS_PER_PAGE);
            const pagedIss = sortedIssues.slice((dashIssuePage - 1) * ISS_PER_PAGE, dashIssuePage * ISS_PER_PAGE);
            const openCount = issues.filter(i => i.status === "open").length;
            const dashProjects = Array.from(new Set(entries.map(e => e.project)));
            return (
              <section className="rounded-2xl border border-red-900/30 bg-slate-900/60 backdrop-blur-sm overflow-hidden flex flex-col animate-fade-in-up [animation-delay:80ms]">
                {/* Panel header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-red-900/20 shrink-0">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={13} className="text-red-400" />
                    <span className="text-xs font-bold tracking-[0.2em] uppercase text-red-400">Raised Issues</span>
                    {openCount > 0 && (
                      <span className="flex items-center justify-center min-w-4.5 h-4.5 rounded-full bg-red-500/20 text-red-300 text-[9px] font-bold px-1.5 ring-1 ring-red-500/30">
                        {openCount}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!readOnly && (
                      <button
                        onClick={() => { setIssueFormOpen(true); setEditingIssue(null); setIssueForm({ project: dashProjects[0] ?? "", type: "bugfix", priority: "major", date_raised: new Date().toISOString().slice(0,10) }); }}
                        className="text-[11px] text-red-400/70 hover:text-red-400 transition-colors flex items-center gap-1"
                      >
                        + Raise issue
                      </button>
                    )}
                  </div>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800/40 flex-wrap">
                  <select value={dashIssueProjectFilter} onChange={e => { setDashIssueProjectFilter(e.target.value); setDashIssuePage(1); }} className="rounded-lg border border-slate-700 bg-slate-900 text-slate-400 text-[10px] px-2 py-1 outline-none">
                    <option value="all">All Projects</option>
                    {dashProjects.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <div className="flex rounded-lg border border-slate-800 overflow-hidden text-[10px]">
                    {([["all","All"],["open","Open"],["in_progress","In Progress"],["resolved","Resolved"]] as const).map(([s, label]) => (
                      <button key={s} onClick={() => { setDashIssueStatusFilter(s); setDashIssuePage(1); }} className={`px-2.5 py-1 font-medium transition-colors ${dashIssueStatusFilter === s ? "bg-slate-800 text-slate-200" : "text-slate-500 hover:text-slate-300"}`}>{label}</button>
                    ))}
                  </div>
                </div>

                {/* Add / Edit form */}
                {issueFormOpen && (
                  <div className="px-4 py-3 border-b border-red-900/20 bg-red-400/5 flex flex-col gap-2">
                    <input autoFocus placeholder="Issue title *" value={issueForm.title ?? ""} onChange={e => setIssueForm(f => ({ ...f, title: e.target.value }))} className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-red-500/40" />
                    <textarea placeholder="Description (optional)" value={issueForm.description ?? ""} onChange={e => setIssueForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-300 outline-none focus:border-red-500/40 resize-none" />
                    <div className="grid grid-cols-2 gap-2">
                      <select value={issueForm.project ?? ""} onChange={e => setIssueForm(f => ({ ...f, project: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-xs px-2 py-1.5 outline-none">
                        <option value="">Project *</option>
                        {dashProjects.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <select value={issueForm.type ?? "bugfix"} onChange={e => setIssueForm(f => ({ ...f, type: e.target.value as RaisedIssue["type"] }))} className="rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-xs px-2 py-1.5 outline-none">
                        <option value="bugfix">Bug Fix</option>
                        <option value="feature">Feature</option>
                        <option value="optimized">Optimized</option>
                        <option value="task">Task</option>
                        <option value="other">Other</option>
                      </select>
                      <select value={issueForm.priority ?? "major"} onChange={e => setIssueForm(f => ({ ...f, priority: e.target.value as RaisedIssue["priority"] }))} className="rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-xs px-2 py-1.5 outline-none">
                        <option value="urgent">Urgent</option>
                        <option value="major">Major</option>
                        <option value="minor">Minor</option>
                      </select>
                      <input type="date" value={issueForm.date_raised ?? new Date().toISOString().slice(0,10)} onChange={e => setIssueForm(f => ({ ...f, date_raised: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-xs px-2 py-1.5 outline-none" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveIssue} disabled={!issueForm.title?.trim() || !issueForm.project} className="flex-1 rounded-lg border border-red-700/40 bg-red-400/10 text-red-300 text-xs font-semibold py-2 hover:bg-red-400/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        {editingIssue ? "Save Changes" : "Raise Issue"}
                      </button>
                      <button onClick={() => { setIssueFormOpen(false); setEditingIssue(null); setIssueForm({}); }} className="px-3 rounded-lg border border-slate-700 text-slate-400 text-xs hover:bg-slate-800 transition-colors">Cancel</button>
                    </div>
                  </div>
                )}

                {/* List */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-0">
                  {issuesLoading ? (
                    <p className="text-xs text-slate-600 text-center py-6">Loading…</p>
                  ) : sortedIssues.length === 0 ? (
                    <p className="text-xs text-slate-600 text-center py-6">No issues found.</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {pagedIss.map(issue => (
                        <IssueRow key={issue.id} issue={issue} readOnly={readOnly}
                          onEdit={iss => { setEditingIssue(iss); setIssueForm(iss); setIssueFormOpen(true); }}
                          onDelete={deleteIssue}
                          onStart={startIssue}
                          onToggle={toggleIssueStatus}
                        />
                      ))}
                    </ul>
                  )}
                </div>

                {/* Pagination */}
                {issTotalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-2 border-t border-red-900/20">
                    <button onClick={() => setDashIssuePage(p => Math.max(1, p - 1))} disabled={dashIssuePage === 1} className="text-[10px] px-2 py-1 text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors">← Prev</button>
                    <span className="text-[10px] text-slate-600">{dashIssuePage} / {issTotalPages}</span>
                    <button onClick={() => setDashIssuePage(p => Math.min(issTotalPages, p + 1))} disabled={dashIssuePage === issTotalPages} className="text-[10px] px-2 py-1 text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors">Next →</button>
                  </div>
                )}
              </section>
            );
          })()}
        </div>

        {/* ── Backlog / Planning ─────────────────────────────── */}
        <div className="mb-8">
          {/* Planned / Backlog */}
          {(() => {
            const BL_PER_PAGE = 7;
            const blTotalPages = Math.ceil(
              filteredPlannedItems.length / BL_PER_PAGE,
            );
            const pagedBL = filteredPlannedItems.slice(
              (backlogPage - 1) * BL_PER_PAGE,
              backlogPage * BL_PER_PAGE,
            );
            const hasBacklogFilters = backlogPriorityFilter !== "all" || backlogComplexityFilter !== "all" || backlogTypeFilter !== "all" || backlogTagFilter !== "all";
            return (
              <section className="flex flex-col gap-3 p-4 rounded-2xl border border-blue-400/20 bg-blue-400/5">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-blue-400">
                      Planning Phase
                    </span>
                    <span className="text-[11px] text-slate-600">
                      {filteredPlannedItems.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setBacklogFilterOpen(o => !o)}
                      className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border transition-colors ${backlogFilterOpen || hasBacklogFilters ? "border-blue-400/40 bg-blue-400/10 text-blue-300" : "border-slate-800 text-slate-500 hover:text-slate-300"}`}
                      title="Filter planning tasks"
                    >
                      <Filter size={11} />
                      Filters
                      {hasBacklogFilters && <span className="w-1.5 h-1.5 rounded-full bg-blue-400 ml-0.5" />}
                    </button>
                    {!readOnly && (
                      <button
                        onClick={() => {
                          setQuickAdd({ title: "", priority: "", complexity: "", type: "", tags: [] });
                          setQuickAddMedia([]);
                          setQuickAddCompare([]);
                          setQuickAddOpen(true);
                        }}
                        className="text-[11px] text-blue-400/70 hover:text-blue-400 transition-colors flex items-center gap-1"
                      >
                        + Add task
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter panel */}
                {backlogFilterOpen && (
                  <div className="flex flex-col gap-2 p-3 rounded-xl border border-blue-400/15 bg-slate-900/60">
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={backlogPriorityFilter}
                        onChange={e => setBacklogPriorityFilter(e.target.value)}
                        className="rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-[11px] px-2 py-1 outline-none"
                      >
                        <option value="all">All Priorities</option>
                        <option value="urgent">Urgent</option>
                        <option value="major">Major</option>
                        <option value="minor">Minor</option>
                      </select>
                      <select
                        value={backlogComplexityFilter}
                        onChange={e => setBacklogComplexityFilter(e.target.value)}
                        className="rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-[11px] px-2 py-1 outline-none"
                      >
                        <option value="all">All Severity</option>
                        <option value="simple">Simple</option>
                        <option value="hard">Hard</option>
                        <option value="complex">Complex</option>
                      </select>
                      <select
                        value={backlogTypeFilter}
                        onChange={e => setBacklogTypeFilter(e.target.value)}
                        className="rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-[11px] px-2 py-1 outline-none"
                      >
                        <option value="all">All Types</option>
                        {Object.entries(TYPE_META).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                      {hasBacklogFilters && (
                        <button
                          onClick={() => { setBacklogPriorityFilter("all"); setBacklogComplexityFilter("all"); setBacklogTypeFilter("all"); setBacklogTagFilter("all"); }}
                          className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors"
                        >
                          <X size={10} /> Clear
                        </button>
                      )}
                    </div>
                    {/* Tag chips */}
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
                          {tag === "all" ? "All Tags" : `#${tag}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {filteredPlannedItems.length === 0 ? (
                  <p className="text-xs text-slate-600 py-2">
                    No planned tasks yet.
                  </p>
                ) : (
                  <>
                    <ul className="flex flex-col gap-1">
                      {pagedBL.map((item, pageLocalIdx) => {
                        const realIdx =
                          (backlogPage - 1) * BL_PER_PAGE + pageLocalIdx;
                        return (
                          <li
                            key={item.task.title}
                            draggable={!readOnly}
                            onDragStart={
                              !readOnly ? () => setDragIdx(realIdx) : undefined
                            }
                            onDragOver={
                              !readOnly
                                ? (e) => {
                                    e.preventDefault();
                                    setDragOverIdx(realIdx);
                                  }
                                : undefined
                            }
                            onDragLeave={
                              !readOnly ? () => setDragOverIdx(null) : undefined
                            }
                            onDrop={
                              !readOnly
                                ? () => handleBacklogDrop(realIdx)
                                : undefined
                            }
                            onDragEnd={
                              !readOnly
                                ? () => {
                                    setDragIdx(null);
                                    setDragOverIdx(null);
                                  }
                                : undefined
                            }
                            className={`flex items-start gap-2.5 py-2 px-1 rounded-lg border transition-colors ${
                              !readOnly &&
                              dragOverIdx === realIdx &&
                              dragIdx !== realIdx
                                ? "border-blue-400/50 bg-blue-400/8"
                                : "border-transparent"
                            } border-b border-b-blue-400/10 last:border-b-0`}
                          >
                            {!readOnly && (
                              <span className={`mt-1.5 shrink-0 select-none text-sm leading-none ${readOnly ? "text-slate-800 cursor-default" : "text-slate-700 hover:text-slate-500 cursor-grab active:cursor-grabbing"}`}>⠿</span>
                            )}
                            {editingBacklogTask?.task.title === item.task.title ? (
                              /* ── Inline edit form ── */
                              <div className="flex-1 flex flex-col gap-2">
                                {/* Title */}
                                <input
                                  autoFocus
                                  value={backlogEditForm.title}
                                  onChange={(e) => setBacklogEditForm((f) => ({ ...f, title: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === "Escape") setEditingBacklogTask(null); }}
                                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-1.5 text-sm text-slate-100 outline-none focus:border-emerald-500/60"
                                />
                                {/* Project */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 shrink-0">Project</span>
                                  {(["VC+", "VC+ CMS"] as const).map((p) => (
                                    <button key={p} type="button" onClick={() => setBacklogEditForm((f) => ({ ...f, project: p }))}
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${backlogEditForm.project === p ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40" : "bg-slate-800 text-slate-400 hover:bg-slate-700"}`}>
                                      {p}
                                    </button>
                                  ))}
                                </div>
                                {/* Type + Priority + Severity */}
                                <div className="grid grid-cols-3 gap-1.5">
                                  <select value={backlogEditForm.type} onChange={(e) => setBacklogEditForm((f) => ({ ...f, type: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-[11px] px-2 py-1 outline-none">
                                    <option value="">Type</option>
                                    {Object.entries(TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                  </select>
                                  <select value={backlogEditForm.priority} onChange={(e) => setBacklogEditForm((f) => ({ ...f, priority: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-[11px] px-2 py-1 outline-none">
                                    <option value="">Priority</option>
                                    <option value="urgent">Urgent</option>
                                    <option value="major">Major</option>
                                    <option value="minor">Minor</option>
                                  </select>
                                  <select value={backlogEditForm.complexity} onChange={(e) => setBacklogEditForm((f) => ({ ...f, complexity: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-[11px] px-2 py-1 outline-none">
                                    <option value="">Severity</option>
                                    <option value="simple">Simple</option>
                                    <option value="hard">Hard</option>
                                    <option value="complex">Complex</option>
                                  </select>
                                </div>
                                {/* Images */}
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Images</span>
                                    <label className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-400 transition-colors cursor-pointer">
                                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setBacklogEditMedia((d) => [...d, { file: f, preview: URL.createObjectURL(f), caption: "" }]); }} />
                                      <Plus size={10} /> Add image
                                    </label>
                                  </div>
                                  {backlogEditMedia.length > 0 && (
                                    <div className={`grid gap-1.5 ${backlogEditMedia.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                                      {backlogEditMedia.map((m, mi) => (
                                        <div key={mi} className="relative group rounded-lg overflow-hidden border border-slate-800">
                                          <img src={m.preview} alt="" className="w-full h-20 object-cover" />
                                          <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 px-1.5 py-0.5 flex items-center gap-1">
                                            <input value={m.caption} onChange={(e) => setBacklogEditMedia((d) => d.map((x, j) => j === mi ? { ...x, caption: e.target.value } : x))} placeholder="Caption…" className="flex-1 bg-transparent text-[11px] text-slate-300 outline-none placeholder:text-slate-600" />
                                            <button onClick={() => setBacklogEditMedia((d) => d.filter((_, j) => j !== mi))} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={10} /></button>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {/* Before / After */}
                                <div className="flex flex-col gap-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Before / After</span>
                                    <button onClick={() => setBacklogEditCompare((d) => [...d, { label: "", before: { file: null, preview: "", note: "" }, after: { file: null, preview: "", note: "" } }])} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-400 transition-colors">
                                      <Plus size={10} /> Add comparison
                                    </button>
                                  </div>
                                  {backlogEditCompare.map((c, ci) => (
                                    <div key={ci} className="rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 flex flex-col gap-2">
                                      <div className="flex items-center gap-2">
                                        <input value={c.label} onChange={(e) => setBacklogEditCompare((d) => d.map((x, j) => j === ci ? { ...x, label: e.target.value } : x))} placeholder="Label (optional)" className="flex-1 rounded bg-transparent border-b border-slate-800 text-[11px] text-slate-300 outline-none py-0.5 placeholder:text-slate-700" />
                                        <button onClick={() => setBacklogEditCompare((d) => d.filter((_, j) => j !== ci))} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        {(["before", "after"] as const).map((side) => {
                                          const slot = c[side];
                                          return (
                                            <div key={side} className="flex flex-col gap-1">
                                              <p className="text-[9px] uppercase tracking-widest text-slate-600 font-bold">{side}</p>
                                              {slot.preview ? (
                                                <div className="relative group rounded-lg overflow-hidden border border-slate-800">
                                                  <img src={slot.preview} alt={side} className="w-full h-16 object-cover" />
                                                  <label className="absolute inset-0 flex items-center justify-center bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setBacklogEditCompare((d) => d.map((x, j) => j === ci ? { ...x, [side]: { ...x[side], file: f, preview: URL.createObjectURL(f) } } : x)); }} />
                                                    <ImageIcon size={13} className="text-slate-300" />
                                                  </label>
                                                </div>
                                              ) : (
                                                <label className="flex flex-col items-center justify-center h-16 rounded-lg border border-dashed border-slate-700 text-slate-600 hover:border-blue-700/50 hover:text-blue-400 transition-colors cursor-pointer">
                                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setBacklogEditCompare((d) => d.map((x, j) => j === ci ? { ...x, [side]: { ...x[side], file: f, preview: URL.createObjectURL(f) } } : x)); }} />
                                                  <ImageIcon size={13} /><span className="text-[10px] mt-0.5">Upload</span>
                                                </label>
                                              )}
                                              <input value={slot.note} onChange={(e) => setBacklogEditCompare((d) => d.map((x, j) => j === ci ? { ...x, [side]: { ...x[side], note: e.target.value } } : x))} placeholder="Note…" className="text-[11px] text-slate-400 bg-transparent border-b border-slate-800/60 outline-none py-0.5 placeholder:text-slate-700" />
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                {/* Actions */}
                                <div className="flex gap-1.5">
                                  <button onClick={saveBacklogEdit} disabled={!backlogEditForm.title.trim() || backlogEditSaving} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-emerald-700/40 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20 transition-colors disabled:opacity-50">
                                    <Save size={10} /> {backlogEditSaving ? "Saving…" : "Save"}
                                  </button>
                                  <button onClick={() => { setEditingBacklogTask(null); setBacklogEditMedia([]); setBacklogEditCompare([]); }} className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors">
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* ── Normal display ── */
                              <>
                                <div className="flex-1 min-w-0">
                                  <span className="text-[9px] text-slate-600 font-medium tracking-wide">{item.entryProject}</span>
                                  <p className="text-sm text-slate-300 leading-snug">{item.task.title}</p>
                                  <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                    {item.task.type && (() => {
                                      const tm = TYPE_META[item.task.type];
                                      const TIcon = tm.icon;
                                      return <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide flex items-center gap-0.5 ${tm.text} ${tm.bg}`}><TIcon size={9} /> {tm.label}</span>;
                                    })()}
                                    {item.task.priority && (
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${PRIORITY_META[item.task.priority].text} ${PRIORITY_META[item.task.priority].bg}`}>
                                        {PRIORITY_META[item.task.priority].label}
                                      </span>
                                    )}
                                    {item.task.complexity && (
                                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${COMPLEXITY_META[item.task.complexity].text} ${COMPLEXITY_META[item.task.complexity].bg}`}>
                                        {COMPLEXITY_META[item.task.complexity].label}
                                      </span>
                                    )}
                                    {(item.task.tags ?? []).map((tag) => {
                                      const s = TASK_TAG_STYLE[tag];
                                      return (
                                        <span key={tag} className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full border ${s ? `${s.text} ${s.bg} ${s.border}` : "text-slate-400 bg-slate-800 border-slate-700"}`}>
                                          #{tag}
                                        </span>
                                      );
                                    })}
                                  </div>
                                  {/* Task media thumbnails */}
                                  {item.task.media && item.task.media.length > 0 && (
                                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                      {item.task.media.slice(0, 4).map((m, mi) => (
                                        <img
                                          key={mi}
                                          src={m.src}
                                          alt={m.caption ?? ""}
                                          onClick={() => setZoomSrc(m.src)}
                                          className="w-12 h-9 object-cover rounded border border-slate-700 cursor-zoom-in hover:border-blue-400/40 transition-colors"
                                        />
                                      ))}
                                      {item.task.media.length > 4 && (
                                        <span className="text-[9px] text-slate-500">+{item.task.media.length - 4}</span>
                                      )}
                                    </div>
                                  )}
                                  {/* Compare blocks */}
                                  {item.task.compare && item.task.compare.length > 0 && (
                                    <div className="mt-2 flex flex-col gap-2">
                                      {item.task.compare.map((pair, ci) => (
                                        <CompareBlock key={ci} pair={pair} onImageClick={setZoomSrc} onCompareZoom={setCompareZoom} />
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {!readOnly && (
                                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                    <button
                                      onClick={() => {
                                        setEditingBacklogTask(item);
                                        setBacklogEditForm({ title: item.task.title, priority: item.task.priority ?? "", complexity: item.task.complexity ?? "", type: item.task.type ?? "", project: item.entryProject });
                                        setBacklogEditMedia((item.task.media ?? []).map(m => ({ file: null, preview: m.src, caption: m.caption ?? "" })));
                                        setBacklogEditCompare((item.task.compare ?? []).map(c => ({ label: c.label ?? "", before: { file: null, preview: c.before.src, note: c.before.note }, after: { file: null, preview: c.after.src, note: c.after.note } })));
                                      }}
                                      className="p-1 rounded text-slate-600 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                                      title="Edit task"
                                    >
                                      <Pencil size={12} />
                                    </button>
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
                                )}
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                    {blTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-2 border-t border-blue-400/10">
                        <button
                          onClick={() =>
                            setBacklogPage((p) => Math.max(1, p - 1))
                          }
                          disabled={backlogPage === 1}
                          className="text-[10px] px-2 py-1 text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors"
                        >
                          ← Prev
                        </button>
                        <span className="text-[10px] text-slate-600">
                          {backlogPage} / {blTotalPages}
                        </span>
                        <button
                          onClick={() =>
                            setBacklogPage((p) => Math.min(blTotalPages, p + 1))
                          }
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

        {/* ── Entries grid — one card per day, raised issues merged ─── */}
        {(() => {
          // Raised issues by date (in_progress / resolved only)
          const visibleIssues = issues.filter(i => i.status !== "open");
          const issuesByDate = new Map<string, RaisedIssue[]>();
          for (const issue of visibleIssues) {
            const key = issue.date_started ?? issue.date_raised;
            if (!issuesByDate.has(key)) issuesByDate.set(key, []);
            issuesByDate.get(key)!.push(issue);
          }

          // Consolidate filtered entries: one card per date (merge tasks)
          const byDate = new Map<string, Entry[]>();
          for (const e of filtered) {
            if (!byDate.has(e.date)) byDate.set(e.date, []);
            byDate.get(e.date)!.push(e);
          }
          const consolidated: Entry[] = Array.from(byDate.entries())
            .sort(([a], [b]) => b.localeCompare(a))
            .map(([, dayEntries]) => {
              if (dayEntries.length === 1) return dayEntries[0];
              // Merge tasks; prefer "progress"/"done" over "planned" for same title
              const seen = new Map<string, Task>();
              for (const t of dayEntries.flatMap(e => e.tasks)) {
                const existing = seen.get(t.title);
                if (!existing || t.status === "progress" || (t.status === "done" && existing.status === "planned")) {
                  seen.set(t.title, t);
                }
              }
              const primary = dayEntries[0];
              return { ...primary, tasks: Array.from(seen.values()) };
            });

          // Orphan issues: date not present in any filtered entry
          const entryDates = new Set(consolidated.map(e => e.date));
          const orphanIssues = visibleIssues.filter(i => !entryDates.has(i.date_started ?? i.date_raised));

          const ITEMS_PER_PAGE = 9;
          const totalPages = Math.ceil(consolidated.length / ITEMS_PER_PAGE);
          const paged = consolidated.slice(
            (page - 1) * ITEMS_PER_PAGE,
            page * ITEMS_PER_PAGE,
          );

          // Group orphan issues by date — one card per day
          const orphanByDate = new Map<string, RaisedIssue[]>();
          for (const issue of orphanIssues) {
            const key = issue.date_started ?? issue.date_raised;
            if (!orphanByDate.has(key)) orphanByDate.set(key, []);
            orphanByDate.get(key)!.push(issue);
          }
          const orphanGroups = Array.from(orphanByDate.entries()).sort(([a], [b]) => b.localeCompare(a));

          const orphanGrid = orphanGroups.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-6">
              {orphanGroups.map(([date, groupIssues], i) => (
                <GroupedIssueCard
                  key={date}
                  date={date}
                  issues={groupIssues}
                  readOnly={readOnly}
                  delay={Math.min(i, 6) * 50}
                  onView={setDetailIssue}
                  onResolve={toggleIssueStatus}
                />
              ))}
            </div>
          ) : null;

          return loading ? (
            <div className="text-center py-16 px-5 rounded-2xl border border-dashed border-emerald-900/40 text-slate-500 text-sm animate-fade-in">
              Loading entries…
            </div>
          ) : consolidated.length === 0 ? (
            <>
              {orphanGrid}
              <div className="text-center py-16 px-5 rounded-2xl border border-dashed border-emerald-900/40 text-slate-500 text-sm animate-fade-in">
                No entries yet — hit{" "}
                <span className="text-emerald-400 font-medium">+ New Entry</span>{" "}
                to log your first task.
              </div>
            </>
          ) : (
            <>
              {orphanGrid}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                {paged.map((entry, i) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    activeType={type}
                    delay={Math.min(i, 6) * 50}
                    readOnly={readOnly}
                    onView={() => setViewingEntry(entry)}
                    onEdit={() => setEditingEntry(entry)}
                    onImageClick={setZoomSrc}
                    onCompareZoom={setCompareZoom}
                    raisedIssues={issuesByDate.get(entry.date) ?? []}
                    onViewIssue={setDetailIssue}
                    onResolveIssue={toggleIssueStatus}
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
          <button onClick={() => setZoomSrc(null)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
            <X size={22} />
          </button>
          <img src={zoomSrc} onClick={(e) => e.stopPropagation()} className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" alt="Zoomed" />
        </div>
      )}

      {/* ── Compare side-by-side lightbox ── */}
      {compareZoom && (
        <div
          onClick={() => setCompareZoom(null)}
          className="fixed inset-0 z-60 bg-black/95 backdrop-blur-sm flex items-center justify-center p-6"
        >
          <button onClick={() => setCompareZoom(null)} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
            <X size={22} />
          </button>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-5xl flex flex-col gap-4">
            {compareZoom.label && (
              <p className="text-center text-[11px] font-bold uppercase tracking-[0.25em] text-slate-400">{compareZoom.label}</p>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400 text-center">Before</span>
                <img src={compareZoom.before.src} alt="Before" className="w-full max-h-[70vh] object-contain rounded-xl border border-slate-700 shadow-2xl" />
                {compareZoom.before.note && <p className="text-[11px] text-slate-400 text-center leading-snug">{compareZoom.before.note}</p>}
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 text-center">After</span>
                <img src={compareZoom.after.src} alt="After" className="w-full max-h-[70vh] object-contain rounded-xl border border-slate-700 shadow-2xl" />
                {compareZoom.after.note && <p className="text-[11px] text-slate-400 text-center leading-snug">{compareZoom.after.note}</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {quickAddOpen && (
        <>
          <div
            onClick={() => { setQuickAddOpen(false); setQuickAddMedia([]); setQuickAddCompare([]); }}
            className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
          />
          <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
              <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-blue-400">
                Add to Plans
              </span>
              <button
                onClick={() => { setQuickAddOpen(false); setQuickAddMedia([]); setQuickAddCompare([]); }}
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              <input
                autoFocus
                value={quickAdd.title}
                onChange={(e) => setQuickAdd((d) => ({ ...d, title: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && handleQuickAddSave()}
                placeholder="Task title..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-blue-700/60 placeholder:text-slate-600 transition-colors"
              />

              {/* Project */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 shrink-0">Project</span>
                {(["VC+", "VC+ CMS"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setQuickAddProject(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      quickAddProject === p
                        ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-500/40"
                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>

              {/* Type + Priority + Severity */}
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={quickAdd.type}
                  onChange={(e) => setQuickAdd((d) => ({ ...d, type: e.target.value }))}
                  className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-blue-700/60 transition-colors"
                >
                  <option value="">Type</option>
                  {Object.entries(TYPE_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
                <select
                  value={quickAdd.priority}
                  onChange={(e) => setQuickAdd((d) => ({ ...d, priority: e.target.value }))}
                  className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-blue-700/60 transition-colors"
                >
                  <option value="">Priority</option>
                  <option value="urgent">🔴 Urgent</option>
                  <option value="major">🟡 Major</option>
                  <option value="minor">🔵 Minor</option>
                </select>
                <select
                  value={quickAdd.complexity}
                  onChange={(e) => setQuickAdd((d) => ({ ...d, complexity: e.target.value }))}
                  className="bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-blue-700/60 transition-colors"
                >
                  <option value="">Severity</option>
                  <option value="simple">Simple</option>
                  <option value="hard">Hard</option>
                  <option value="complex">Complex</option>
                </select>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tags</span>
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
                          tags: active ? d.tags.filter((t) => t !== tag) : [...d.tags, tag],
                        }))
                      }
                      className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-colors ${
                        active && s ? `${s.text} ${s.bg} ${s.border}` : active ? "border-blue-400/40 bg-blue-400/10 text-blue-300" : "border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400"
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>

              {/* Images */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Images</p>
                  <label className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-400 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        setQuickAddMedia((d) => [...d, { file: f, preview: URL.createObjectURL(f), caption: "" }]);
                      }}
                    />
                    <Plus size={11} /> Add image
                  </label>
                </div>
                {quickAddMedia.length > 0 && (
                  <div className={`grid gap-2 ${quickAddMedia.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                    {quickAddMedia.map((m, i) => (
                      <div key={i} className="relative group rounded-lg overflow-hidden border border-slate-800">
                        <img src={m.preview} alt="" className="w-full h-28 object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 px-2 py-1 flex items-center gap-1">
                          <input
                            value={m.caption}
                            onChange={(e) => setQuickAddMedia((d) => d.map((x, j) => j === i ? { ...x, caption: e.target.value } : x))}
                            placeholder="Caption…"
                            className="flex-1 bg-transparent text-[11px] text-slate-300 outline-none placeholder:text-slate-600"
                          />
                          <button
                            onClick={() => setQuickAddMedia((d) => d.filter((_, j) => j !== i))}
                            className="text-slate-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Before / After Compare */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Before / After</p>
                  <button
                    onClick={() => setQuickAddCompare((d) => [...d, { label: "", before: { file: null, preview: "", note: "" }, after: { file: null, preview: "", note: "" } }])}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-blue-400 transition-colors"
                  >
                    <Plus size={11} /> Add comparison
                  </button>
                </div>
                {quickAddCompare.map((c, i) => (
                  <div key={i} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={c.label}
                        onChange={(e) => setQuickAddCompare((d) => d.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                        placeholder="Label (optional)"
                        className="flex-1 rounded bg-transparent border-b border-slate-800 text-[11px] text-slate-300 outline-none py-0.5 placeholder:text-slate-700"
                      />
                      <button
                        onClick={() => setQuickAddCompare((d) => d.filter((_, j) => j !== i))}
                        className="text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(["before", "after"] as const).map((side) => {
                        const slot = c[side];
                        return (
                          <div key={side} className="flex flex-col gap-1">
                            <p className="text-[9px] uppercase tracking-widest text-slate-600 font-bold">{side}</p>
                            {slot.preview ? (
                              <div className="relative group rounded-lg overflow-hidden border border-slate-800">
                                <img src={slot.preview} alt={side} className="w-full h-20 object-cover" />
                                <label className="absolute inset-0 flex items-center justify-center bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                    const f = e.target.files?.[0]; if (!f) return;
                                    setQuickAddCompare((d) => d.map((x, j) => j === i ? { ...x, [side]: { ...x[side], file: f, preview: URL.createObjectURL(f) } } : x));
                                  }} />
                                  <ImageIcon size={14} className="text-slate-300" />
                                </label>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center h-20 rounded-lg border border-dashed border-slate-700 text-slate-600 hover:border-blue-700/50 hover:text-blue-400 transition-colors cursor-pointer">
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                                  const f = e.target.files?.[0]; if (!f) return;
                                  setQuickAddCompare((d) => d.map((x, j) => j === i ? { ...x, [side]: { ...x[side], file: f, preview: URL.createObjectURL(f) } } : x));
                                }} />
                                <ImageIcon size={14} /><span className="text-[10px] mt-1">Upload</span>
                              </label>
                            )}
                            <input
                              value={slot.note}
                              onChange={(e) => setQuickAddCompare((d) => d.map((x, j) => j === i ? { ...x, [side]: { ...x[side], note: e.target.value } } : x))}
                              placeholder="Note…"
                              className="text-[11px] text-slate-400 bg-transparent border-b border-slate-800/60 outline-none py-0.5 placeholder:text-slate-700"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-slate-800 shrink-0">
              <button
                onClick={handleQuickAddSave}
                disabled={!quickAdd.title.trim() || quickAddSaving}
                className="w-full rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-300 text-sm font-semibold py-2.5 hover:bg-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {quickAddSaving ? "Saving…" : "Add to Backlog"}
              </button>
            </div>
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
        onCompareZoom={setCompareZoom}
        readOnly={readOnly}
      />

      <ProfilePanel
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        entries={entries}
        readOnly={readOnly}
        onToggleMode={requestWizardMode}
      />
      <RaisedIssuesPanel
        open={issuesOpen}
        onClose={() => setIssuesOpen(false)}
        issues={issues}
        entries={entries}
        projectFilter={issuesProjectFilter}
        onProjectFilterChange={setIssuesProjectFilter}
        dateFrom={reportDateFrom}
        onDateFromChange={setReportDateFrom}
        dateTo={reportDateTo}
        onDateToChange={setReportDateTo}
      />
      <CompletedPanel
        open={completedOpen}
        onClose={() => setCompletedOpen(false)}
        entries={entries}
        issues={issues}
        onEditEntry={(entryId) => {
          setCompletedOpen(false);
          const entry = entries.find(e => e.id === entryId);
          if (entry) setEditingEntry(entry);
        }}
      />
      <CompletionToast toasts={toasts} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      {detailIssue && (
        <IssueDetailModal
          issue={detailIssue}
          readOnly={readOnly}
          onClose={() => setDetailIssue(null)}
          onSaved={(updated) => {
            setIssues(prev => prev.map(i => i.id === updated.id ? updated : i));
            setDetailIssue(updated);
          }}
        />
      )}
      <AddEntryModal
        open={formOpen || editingEntry !== null}
        initialEntry={editingEntry ?? undefined}
        inProgressItems={[
          ...inProgressItems,
          ...issues
            .filter(i => i.status === "in_progress")
            .map(i => ({
              entryId: `issue-${i.id}`,
              entryTitle: i.title,
              entryDate: i.date_started ?? i.date_raised,
              entryProject: i.project,
              task: {
                title: i.title,
                type: "bugfix" as const,
                status: "progress" as const,
                priority: i.priority,
              },
            })),
        ]}
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

      {/* Wizard Mode Password Modal */}
      {wizardModalOpen && (
        <>
          <div
            className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => {
              setWizardModalOpen(false);
              setWizardError(false);
              setWizardInput("");
            }}
          />
          <div className="fixed z-70 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-2xl border border-emerald-900/60 bg-slate-900 shadow-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-400/10 ring-1 ring-emerald-400/20">
                <Wand2 size={18} className="text-emerald-400" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Enter Wizard Password
                </p>
                <p className="text-xs text-slate-500">
                  Required to unlock full access
                </p>
              </div>
            </div>
            <input
              type="password"
              autoFocus
              value={wizardInput}
              onChange={(e) => {
                setWizardInput(e.target.value);
                setWizardError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmWizardPassword();
                if (e.key === "Escape") {
                  setWizardModalOpen(false);
                  setWizardInput("");
                  setWizardError(false);
                }
              }}
              placeholder="Password"
              className={`w-full rounded-xl border bg-slate-950/60 px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 outline-none transition-colors ${wizardError ? "border-red-500/60 focus:border-red-400" : "border-slate-700 focus:border-emerald-500/60"}`}
            />
            {wizardError && (
              <p className="text-xs text-red-400 -mt-2">
                Incorrect password. Try again.
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setWizardModalOpen(false);
                  setWizardInput("");
                  setWizardError(false);
                }}
                className="flex-1 rounded-xl border border-slate-700 text-slate-400 text-sm py-2.5 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmWizardPassword}
                disabled={!wizardInput.trim()}
                className="flex-1 rounded-xl border border-emerald-700/40 bg-emerald-400/10 text-emerald-300 text-sm font-semibold py-2.5 hover:bg-emerald-400/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Unlock
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spinCW  { from { transform: rotate(0deg)   } to { transform: rotate(360deg)  } }
        @keyframes spinCCW { from { transform: rotate(360deg) } to { transform: rotate(0deg)    } }
        @keyframes drainWidth { from { transform: scaleX(1); } to { transform: scaleX(0); } }
        @keyframes fireGlow {
          0%, 100% { box-shadow: 0 0 12px 2px rgba(251,146,60,0.3), 0 0 32px 4px rgba(251,191,36,0.12), inset 0 0 12px rgba(251,146,60,0.04); }
          50%       { box-shadow: 0 0 22px 5px rgba(251,146,60,0.5), 0 0 50px 8px rgba(251,191,36,0.18), inset 0 0 18px rgba(251,146,60,0.07); }
        }
        @keyframes orbPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 1;   transform: scale(1.15); }
        }
        @keyframes flicker {
          0%, 100% { transform: scale(1) rotate(-3deg); }
          25%  { transform: scale(1.15) rotate(3deg); }
          50%  { transform: scale(0.92) rotate(-5deg); }
          75%  { transform: scale(1.08) rotate(4deg); }
        }
        .animate-fade-in    { animation: fadeIn   0.6s ease-out both; }
        .animate-fade-in-up { animation: fadeInUp 0.6s ease-out both; }
        .ring-cw-120  { animation: spinCW  120s linear infinite; }
        .ring-ccw-80  { animation: spinCCW  80s linear infinite; }
        .ring-cw-60   { animation: spinCW   60s linear infinite; }
        .ring-ccw-200 { animation: spinCCW 200s linear infinite; }
        .ring-cw-180  { animation: spinCW  180s linear infinite; }
        .ring-ccw-140 { animation: spinCCW 140s linear infinite; }
        .ring-cw-300  { animation: spinCW  300s linear infinite; }
        .toast-fire   { animation: fadeInUp 0.4s cubic-bezier(0.16,1,0.3,1) both, fireGlow 2.8s ease-in-out infinite; }
        .fire-orb-pulse { animation: orbPulse 2s ease-in-out infinite; }
        .fire-emoji   { display: inline-block; animation: flicker 1s ease-in-out infinite; }
        .hm-cell      { fill: var(--hmc, #1a2332) !important; }
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
  readOnly,
}: {
  open: boolean;
  onToggle: () => void;
  readOnly: boolean;
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
      <span className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-400/15 text-emerald-300 font-serif text-sm sm:text-base ring-1 ring-emerald-400/30">
        {PROFILE.avatarInitials}
        {readOnly && (
          <span className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-slate-900 ring-1 ring-slate-700">
            <Lock size={8} className="text-amber-400" />
          </span>
        )}
      </span>
      <span className="hidden sm:flex flex-col items-start text-left">
        <span className="text-sm font-semibold text-slate-100 leading-tight">
          {PROFILE.name}
        </span>
        <span
          className={`text-[11px] leading-tight ${readOnly ? "text-amber-400/80" : "text-emerald-400/80"}`}
        >
          {readOnly ? "Read Only" : "Wizard Mode"}
        </span>
        <span className="text-[9px] text-slate-500 leading-tight mt-0.5">
          Click here to see detailed summary
        </span>
      </span>
    </button>
  );
}

function ProfilePanel({
  open,
  onClose,
  entries,
  readOnly,
  onToggleMode,
}: {
  open: boolean;
  onClose: () => void;
  entries: Entry[];
  readOnly: boolean;
  onToggleMode: () => void;
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
    return () => {
      document.body.style.overflow = "";
    };
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
          <div className="flex items-center gap-3">
            {/* Read-only / Wizard Mode toggle */}
            <button
              onClick={onToggleMode}
              className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
                readOnly
                  ? "border-amber-500/40 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20"
                  : "border-emerald-500/40 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20"
              }`}
              title={readOnly ? "Switch to Wizard Mode" : "Switch to Read Only"}
            >
              {readOnly ? (
                <>
                  <Lock size={11} />
                  <span>Read Only</span>
                  <span className="text-slate-500 font-normal">
                    · tap to unlock
                  </span>
                </>
              ) : (
                <>
                  <Wand2 size={11} />
                  <span>Wizard Mode</span>
                  <span className="text-slate-500 font-normal">
                    · tap to lock
                  </span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Guide hint — below wizard mode button */}
        <div className="px-5 py-2.5 border-b border-slate-800/60 bg-slate-950/30 shrink-0">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            <span className="text-slate-400">↓ Scroll</span> to view the full summary — overall task breakdown and per-project metrics.
          </p>
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
                        <span
                          className={`text-xl font-bold font-serif leading-none ${meta.text}`}
                        >
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

              {/* Description */}
              {(() => {
                const map: Record<string, [number, string]> = {
                  feature: [overallStats.typeCounts["feature"] ?? 0, "feature"],
                  bugfix: [overallStats.typeCounts["bugfix"] ?? 0, "bug fix"],
                  optimized: [
                    overallStats.typeCounts["optimized"] ?? 0,
                    "optimization",
                  ],
                  refactor: [
                    overallStats.typeCounts["refactor"] ?? 0,
                    "refactor",
                  ],
                  task: [overallStats.typeCounts["task"] ?? 0, "task"],
                  milestone: [
                    overallStats.typeCounts["milestone"] ?? 0,
                    "milestone",
                  ],
                  learning: [
                    overallStats.typeCounts["learning"] ?? 0,
                    "learning",
                  ],
                };
                const verbs: Record<string, string> = {
                  feature: "shipped",
                  bugfix: "resolved",
                  optimized: "optimized",
                  refactor: "refactored",
                  task: "completed",
                  milestone: "hit",
                  learning: "logged",
                };
                const parts = Object.entries(map)
                  .filter(([, [n]]) => n > 0)
                  .map(
                    ([k, [n, label]]) =>
                      `${verbs[k]} ${n} ${label}${n !== 1 ? "s" : ""}`,
                  );

                const sentence =
                  parts.length > 1
                    ? parts.slice(0, -1).join(", ") +
                      ", and " +
                      parts[parts.length - 1]
                    : (parts[0] ?? "");

                const sorted = Object.entries(overallStats.typeCounts).sort(
                  ([, a], [, b]) => b - a,
                );
                const topKey = sorted[0]?.[0] ?? "";
                const topMeta = TYPE_META[topKey as keyof typeof TYPE_META];
                const topPct = Math.round(
                  ((sorted[0]?.[1] ?? 0) / overallStats.total) * 100,
                );

                return (
                  <p className="text-xs text-slate-400 leading-relaxed pt-1">
                    Nel has {sentence} — with{" "}
                    {topMeta && (
                      <span className={topMeta.text}>{topMeta.label}</span>
                    )}{" "}
                    leading at{" "}
                    <span className="text-emerald-300 font-semibold">
                      {topPct}%
                    </span>{" "}
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
                      pm.total > 0 ? Math.round((count / pm.total) * 100) : 0;
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
                          <span
                            className={`text-xl font-bold font-serif leading-none ${meta.text}`}
                          >
                            {count}
                          </span>
                          <span className="text-xs text-slate-500">{pct}%</span>
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
// Activity heatmap — div-based (backgroundColor is CSS-override-proof)
// ════════════════════════════════════════════════════════════════════
function GitHubHeatmap({ entries, issues }: { entries: Entry[]; issues: RaisedIssue[] }) {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  function localIso(d: Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const e of entries) {
      const done = e.tasks.filter(t => t.status === "done").length;
      if (done > 0) c[e.date] = (c[e.date] ?? 0) + done;
    }
    for (const i of issues) {
      if (i.status === "resolved" && i.date_resolved) {
        c[i.date_resolved] = (c[i.date_resolved] ?? 0) + 1;
      }
    }
    return c;
  }, [entries, issues]);

  // Build a full-year grid starting from the Sunday on/before Jan 1
  const { cells, colCount, monthLabels } = useMemo(() => {
    const today = new Date();
    // Sunday on or before Jan 1
    const jan1 = new Date(year, 0, 1);
    const cursor = new Date(jan1);
    cursor.setDate(cursor.getDate() - cursor.getDay());
    // Saturday on or after Dec 31
    const dec31 = new Date(year, 11, 31);
    const gridEnd = new Date(dec31);
    gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

    const cs: { date: string; count: number; col: number; row: number; inYear: boolean; future: boolean }[] = [];
    const seen = new Set<string>();
    const moLabels: { col: number; label: string }[] = [];
    let col = 0;
    const c2 = new Date(cursor);
    while (c2 <= gridEnd) {
      const iso = localIso(c2);
      const row = c2.getDay();
      const inYear = c2.getFullYear() === year;
      cs.push({ date: iso, count: inYear ? (counts[iso] ?? 0) : 0, col, row, inYear, future: c2 > today });
      // month label at start of each month (row 0 of that week)
      if (row === 0) {
        const mo = iso.slice(0, 7);
        if (!seen.has(mo) && inYear) {
          seen.add(mo);
          moLabels.push({ col, label: new Date(year, c2.getMonth(), 1).toLocaleDateString("en-US", { month: "short" }) });
        }
      }
      if (row === 6) col++;
      c2.setDate(c2.getDate() + 1);
    }
    return { cells: cs, colCount: col + 1, monthLabels: moLabels };
  }, [counts, year]);

  const CELL = 11;
  const GAP  = 2;
  const STEP = CELL + GAP; // 13px per col/row

  function colorFor(n: number, inYear: boolean): string {
    if (!inYear) return "#0d1117"; // outside year — near-invisible
    if (n === 0) return "#1a2332";
    if (n === 1) return "#14532d";
    if (n <= 3)  return "#15803d";
    if (n <= 6)  return "#22c55e";
    return "#4ade80";
  }

  const totalDone = useMemo(() => cells.filter(c => c.inYear).reduce((s, c) => s + c.count, 0), [cells]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm p-4 flex flex-col gap-3 flex-1">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <GitCommitHorizontal size={13} className="text-emerald-400" />
          <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Activity</span>
          <span className="text-[10px] text-slate-600">{totalDone} task{totalDone !== 1 ? "s" : ""}</span>
        </div>
        {/* Year navigation */}
        <div className="flex items-center gap-1">
          <button onClick={() => setYear(y => y - 1)} className="p-1 rounded text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-colors">
            <ChevronDown size={12} style={{ transform: "rotate(90deg)" }} />
          </button>
          <span className="text-[11px] font-semibold text-slate-400 px-1 min-w-10 text-center">{year}</span>
          <button onClick={() => setYear(y => y + 1)} disabled={year >= currentYear} className="p-1 rounded text-slate-600 hover:text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-25 disabled:cursor-not-allowed">
            <ChevronDown size={12} style={{ transform: "rotate(-90deg)" }} />
          </button>
        </div>
      </div>

      {/* Grid area — grows to fill available height, grid centered vertically */}
      <div className="flex-1 flex items-center">
        <div className="w-full">
          <div style={{ display: "flex", gap: 4, alignItems: "flex-start" }}>
            {/* Day labels — stays fixed while grid scrolls */}
            <div style={{ flexShrink: 0, paddingTop: 14, display: "grid", gridTemplateRows: `repeat(7, ${CELL}px)`, gap: GAP }}>
              {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d, i) => (
                <div key={d} style={{ fontSize: 8, color: "#475569", lineHeight: `${CELL}px`, width: 22, textAlign: "right", visibility: i % 2 === 1 ? "visible" : "hidden" }}>
                  {d}
                </div>
              ))}
            </div>
            {/* Scrollable cell grid */}
            <div className="overflow-x-auto pb-1 flex-1 min-w-0">
              <div style={{ width: colCount * STEP, position: "relative" }}>
                {/* Month labels */}
                <div style={{ position: "relative", height: 14 }}>
                  {monthLabels.map(({ col, label }) => (
                    <span key={label} style={{ position: "absolute", left: col * STEP, fontSize: 9, color: "#64748b", whiteSpace: "nowrap", lineHeight: 1 }}>
                      {label}
                    </span>
                  ))}
                </div>
                {/* Cell grid: CSS grid flows column-by-column */}
                <div style={{
                  display: "grid",
                  gridTemplateRows: `repeat(7, ${CELL}px)`,
                  gridAutoFlow: "column",
                  gridAutoColumns: `${CELL}px`,
                  gap: GAP,
                }}>
                  {cells.map(({ date, count, inYear, future }) => (
                    <div
                      key={date}
                      title={inYear ? `${date}: ${count} task${count !== 1 ? "s" : ""} completed` : undefined}
                      style={{
                        backgroundColor: colorFor(count, inYear),
                        borderRadius: 2,
                        opacity: future ? 0.25 : 1,
                        cursor: count > 0 ? "pointer" : "default",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 justify-end">
        <span style={{ fontSize: 9, color: "#475569" }}>Less</span>
        {[0, 1, 2, 4, 7].map(n => (
          <span key={n} style={{ display: "inline-block", width: CELL, height: CELL, borderRadius: 2, backgroundColor: colorFor(n, true), flexShrink: 0 }} />
        ))}
        <span style={{ fontSize: 9, color: "#475569" }}>More</span>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Stat card — clickable, with active state
// ════════════════════════════════════════════════════════════════════
function StatCard({
  label,
  value,
  accent,
  accentBg = "bg-slate-900/60",
  iconColor,
  icon: Icon,
  delay = 0,
}: {
  label: string;
  value: number;
  accent: string;
  accentBg?: string;
  iconColor: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  delay?: number;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-800 ${accentBg} backdrop-blur-sm px-4 py-3 sm:px-5 sm:py-4 border-l-4 ${accent} animate-fade-in-up select-none transition-all duration-200 hover:brightness-110`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-1">
        <Icon size={14} className={iconColor} />
      </div>
      <div className={`font-serif text-2xl sm:text-3xl leading-none ${iconColor}`}>
        {value}
      </div>
      <div className="mt-1.5 text-[10px] sm:text-[11px] tracking-[0.12em] uppercase text-slate-400">
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
  onCompareZoom,
}: {
  pair: CompareItem;
  onImageClick?: (src: string) => void;
  onCompareZoom?: (pair: CompareItem) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-800 overflow-hidden">
      <div className="bg-slate-800/50 px-2 py-0.5 flex items-center justify-between gap-2">
        <span className="text-[8px] font-bold tracking-widest uppercase text-slate-500">
          {pair.label ? `${pair.label} · ` : ""}Before → After
        </span>
        {onCompareZoom && (
          <button onClick={() => onCompareZoom(pair)} title="View side by side" className="p-0.5 text-slate-600 hover:text-emerald-300 transition-colors">
            <Eye size={10} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-px bg-slate-800">
        <div className="bg-slate-900/80 p-1.5">
          <div className="text-[8px] tracking-widest uppercase font-semibold mb-0.5 text-orange-300/80">Before</div>
          <img src={pair.before.src} alt="Before" onClick={() => onImageClick?.(pair.before.src)} className="w-full h-11 object-cover rounded cursor-zoom-in hover:opacity-90 transition-opacity" />
          {pair.before.note && <p className="text-[9px] text-slate-500 mt-0.5 leading-tight truncate">{pair.before.note}</p>}
        </div>
        <div className="bg-slate-900/80 p-1.5">
          <div className="text-[8px] tracking-widest uppercase font-semibold mb-0.5 text-emerald-300/80">After</div>
          <img src={pair.after.src} alt="After" onClick={() => onImageClick?.(pair.after.src)} className="w-full h-11 object-cover rounded cursor-zoom-in hover:opacity-90 transition-opacity" />
          {pair.after.note && <p className="text-[9px] text-slate-500 mt-0.5 leading-tight truncate">{pair.after.note}</p>}
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
  readOnly = false,
  onView,
  onEdit,
  onImageClick,
  onCompareZoom,
  raisedIssues = [],
  onViewIssue,
  onResolveIssue,
}: {
  entry: Entry;
  activeType?: string;
  delay?: number;
  readOnly?: boolean;
  onView: () => void;
  onEdit: () => void;
  onDelete?: () => void;
  onImageClick: (src: string) => void;
  onCompareZoom?: (pair: CompareItem) => void;
  raisedIssues?: RaisedIssue[];
  onViewIssue?: (issue: RaisedIssue) => void;
  onResolveIssue?: (issue: RaisedIssue) => void;
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
              {!readOnly && (
                <>
                  <button
                    onClick={onEdit}
                    className="p-1 rounded text-slate-600 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                    title="Edit"
                  >
                    <Pencil size={12} />
                  </button>
                </>
              )}
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

      {/* Embedded raised issues for this date — shown at top before tasks */}
      {raisedIssues.length > 0 && (
        <div className="border-b border-red-900/20 px-4 sm:px-5 pt-3 pb-3 flex flex-col gap-2.5">
          <p className="text-[9px] font-bold uppercase tracking-widest text-red-400/60">Raised Issues</p>
          {raisedIssues.map(issue => {
            const resolved = issue.status === "resolved";
            const tm = ISSUE_TYPE_META[issue.type] ?? ISSUE_TYPE_META.other;
            const pm = PRIORITY_META[issue.priority];
            const hasMedia = (issue.media?.length ?? 0) + (issue.compare?.length ?? 0) > 0;
            return (
              <div key={issue.id} className={`flex items-start gap-2.5 pl-2.5 border-l-2 ${resolved ? "border-emerald-500/40" : "border-red-500/50"}`}>
                <div className="flex-1 min-w-0">
                  <button onClick={() => onViewIssue?.(issue)} className="text-xs text-slate-200 leading-snug text-left hover:text-emerald-300 transition-colors">
                    {issue.title}
                  </button>
                  {issue.description && (
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{issue.description}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-1 mt-1">
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide text-red-300 bg-red-400/10">Raised Issue</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${tm.text} ${tm.bg}`}>{tm.label}</span>
                    {pm && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${pm.text} ${pm.bg}`}>{pm.label}</span>}
                    {resolved
                      ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide text-emerald-400 bg-emerald-400/10">Resolved</span>
                      : <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide text-yellow-400 bg-yellow-400/10">In Progress</span>
                    }
                    {hasMedia && <span className="text-[9px] text-slate-500 flex items-center gap-0.5"><ImageIcon size={9} /> media</span>}
                  </div>
                </div>
                {!readOnly && (
                  <button
                    onClick={() => onResolveIssue?.(issue)}
                    className={`text-[10px] px-2 py-1 rounded-lg border transition-colors shrink-0 ${
                      resolved
                        ? "border-slate-700 text-slate-500 hover:text-yellow-400 hover:border-yellow-700/40"
                        : "border-emerald-700/40 text-emerald-300 hover:bg-emerald-400/10"
                    }`}
                  >
                    {resolved ? "Reopen" : "✓ Resolve"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

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
                      onCompareZoom={onCompareZoom}
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
            <span>
              +{hiddenCount} more task{hiddenCount > 1 ? "s" : ""} — click eye
              icon to view all
            </span>
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
  onCompareZoom,
  readOnly = false,
}: {
  entry: Entry | null;
  onClose: () => void;
  onEdit: () => void;
  onImageClick: (src: string) => void;
  onCompareZoom?: (pair: CompareItem) => void;
  readOnly?: boolean;
}) {
  useEffect(() => {
    document.body.style.overflow = entry ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
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
            <span
              className={`w-2 h-2 rounded-full ${STATUS_META[derived]?.dot ?? "bg-slate-600"}`}
            />
            <span className="flex items-center gap-1 tracking-widest uppercase">
              <Folder size={11} /> {entry.project}
            </span>
            <span className="text-slate-700">·</span>
            <span className="font-mono text-slate-500">
              {formatDate(entry.date)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!readOnly && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-emerald-800/60 text-emerald-400 hover:bg-emerald-400/10 transition-colors"
              >
                <Pencil size={12} /> Edit
              </button>
            )}
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
                    <span
                      className={`mt-2 w-2 h-2 rounded-full shrink-0 ${dot}`}
                    />
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
                          onCompareZoom={onCompareZoom}
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

// ════════════════════════════════════════════════════════════════════
// RAISED ISSUES PANEL
// ════════════════════════════════════════════════════════════════════
const ISSUE_TYPE_META: Record<string, { label: string; text: string; bg: string }> = {
  bugfix:    { label: "Bug Fix",   text: "text-orange-400", bg: "bg-orange-400/10" },
  feature:   { label: "Feature",   text: "text-emerald-400", bg: "bg-emerald-400/10" },
  optimized: { label: "Optimized", text: "text-cyan-400",   bg: "bg-cyan-400/10" },
  task:      { label: "Task",      text: "text-teal-400",   bg: "bg-teal-400/10" },
  other:     { label: "Other",     text: "text-slate-400",  bg: "bg-slate-800" },
};

function RaisedIssuesPanel({
  open, onClose, issues, entries,
  projectFilter, onProjectFilterChange,
  dateFrom, onDateFromChange, dateTo, onDateToChange,
}: {
  open: boolean; onClose: () => void;
  issues: RaisedIssue[]; entries: Entry[];
  projectFilter: string; onProjectFilterChange: (v: string) => void;
  dateFrom: string; onDateFromChange: (v: string) => void;
  dateTo: string; onDateToChange: (v: string) => void;
}) {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const projects = useMemo(() => Array.from(new Set(entries.map((e) => e.project))), [entries]);

  const reportData = useMemo(() => {
    const scoped = (projectFilter === "all" ? issues : issues.filter(i => i.project === projectFilter));
    const raised = scoped.filter(i => i.date_raised >= dateFrom && i.date_raised <= dateTo);
    const resolved = scoped.filter(i => i.status === "resolved" && i.date_resolved && i.date_resolved >= dateFrom && i.date_resolved <= dateTo);
    const inProg = scoped.filter(i => i.status === "in_progress");
    const open = scoped.filter(i => i.status === "open");
    const byType: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    for (const i of raised) {
      byType[i.type] = (byType[i.type] ?? 0) + 1;
      byPriority[i.priority] = (byPriority[i.priority] ?? 0) + 1;
    }
    return { total: raised.length, resolved: resolved.length, inProgress: inProg.length, open: open.length, byType, byPriority };
  }, [issues, dateFrom, dateTo, projectFilter]);

  const summaryComment = useMemo(() => {
    const { total, resolved, inProgress, open, byType } = reportData;
    if (total === 0) return null;

    const rate = total > 0 ? resolved / total : 0;
    const topTypeEntry = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
    const topTypeLabel = topTypeEntry ? ISSUE_TYPE_META[topTypeEntry[0]]?.label ?? topTypeEntry[0] : null;
    const typeNote = topTypeLabel && total > 1 ? `, mostly ${topTypeLabel.toLowerCase()} issues` : "";

    const remaining = open + inProgress;
    const inProgNote = inProgress > 0 ? ` ${inProgress} ${inProgress === 1 ? "is" : "are"} actively being worked on.` : "";

    if (rate === 1) {
      return `Every one of the ${total} raised issue${total > 1 ? "s" : ""}${typeNote} was resolved. That's a perfect close-out — great discipline from the team.`;
    }
    if (rate >= 0.75) {
      return `${resolved} of ${total} issues resolved${typeNote} — an excellent rate. ${remaining} still open${inProgNote} Keep it up.`;
    }
    if (rate >= 0.5) {
      return `More than half resolved — ${resolved} of ${total}${typeNote}.${inProgNote} The remaining ${remaining} are tracked and on the radar.`;
    }
    if (rate >= 0.25) {
      return `${resolved} of ${total} issues closed so far${typeNote}.${inProgNote} Good progress — the team has visibility and ${remaining > 1 ? "those" : "that"} ${remaining} remaining ${remaining === 1 ? "issue is" : "issues are"} within reach.`;
    }
    if (resolved > 0) {
      return `${resolved} issue${resolved > 1 ? "s" : ""} resolved out of ${total} raised${typeNote}. Every fix is a step forward —${inProgNote ? "" : " keep the momentum going."} ${inProgNote}`;
    }
    return `${total} issue${total > 1 ? "s" : ""} raised${typeNote} with resolution work ahead.${inProgNote ? "" : " The team has full visibility — that's the first step."} ${inProgNote}`;
  }, [reportData]);

  return (
    <>
      <div onClick={onClose} className={`fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm transition-opacity ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} />
      <div className={`fixed z-40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-2xl max-h-[88vh] flex flex-col rounded-2xl border border-red-900/40 bg-slate-900/95 backdrop-blur-md shadow-2xl shadow-black/40 transition-all duration-300 ${open ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <BarChart2 size={14} className="text-red-400" />
            <span className="text-xs font-bold tracking-[0.25em] uppercase text-red-400">Issues Report</span>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors"><X size={16} /></button>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-800/60 shrink-0 flex-wrap">
          <select value={projectFilter} onChange={(e) => onProjectFilterChange(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-[11px] px-2.5 py-1.5 outline-none">
            <option value="all">All Projects</option>
            {projects.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <div className="flex items-center gap-1.5 ml-auto">
            <input type="date" value={dateFrom} onChange={e => onDateFromChange(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-[11px] px-2.5 py-1.5 outline-none" />
            <span className="text-slate-600 text-xs">→</span>
            <input type="date" value={dateTo} onChange={e => onDateToChange(e.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-[11px] px-2.5 py-1.5 outline-none" />
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
          <p className="text-xs text-slate-500">{dateFrom} → {dateTo} · {projectFilter === "all" ? "All Projects" : projectFilter}</p>

          {/* Status summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3 flex flex-col gap-1">
              <span className="text-2xl font-serif text-slate-50">{reportData.total}</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500">Raised</span>
            </div>
            <div className="rounded-xl border border-red-400/20 bg-red-400/5 px-4 py-3 flex flex-col gap-1">
              <span className="text-2xl font-serif text-red-300">{reportData.open}</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500">Open</span>
            </div>
            <div className="rounded-xl border border-yellow-400/20 bg-yellow-400/5 px-4 py-3 flex flex-col gap-1">
              <span className="text-2xl font-serif text-yellow-300">{reportData.inProgress}</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500">In Progress</span>
            </div>
            <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 px-4 py-3 flex flex-col gap-1">
              <span className="text-2xl font-serif text-emerald-300">{reportData.resolved}</span>
              <span className="text-[10px] uppercase tracking-widest text-slate-500">Resolved</span>
            </div>
          </div>

          {summaryComment && (
            <div className="rounded-xl border border-slate-700/60 bg-slate-800/40 px-4 py-3">
              <p className="text-xs text-slate-300 leading-relaxed">{summaryComment}</p>
            </div>
          )}

          {reportData.total > 0 ? (
            <>
              {/* By type */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 flex flex-col gap-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">By Type</p>
                {Object.entries(ISSUE_TYPE_META).map(([key, meta]) => {
                  const count = reportData.byType[key] ?? 0;
                  if (count === 0) return null;
                  const pct = Math.round((count / reportData.total) * 100);
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className={`text-[11px] font-semibold w-20 shrink-0 ${meta.text}`}>{meta.label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full ${meta.bg.replace("/10", "")}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>

              {/* By priority */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 flex flex-col gap-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">By Priority</p>
                {(["urgent", "major", "minor"] as const).map((p) => {
                  const count = reportData.byPriority[p] ?? 0;
                  if (count === 0) return null;
                  const meta = PRIORITY_META[p];
                  const pct = Math.round((count / reportData.total) * 100);
                  return (
                    <div key={p} className="flex items-center gap-3">
                      <span className={`text-[11px] font-semibold w-20 shrink-0 ${meta.text}`}>{meta.label}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className={`h-full rounded-full ${meta.bg.replace("/10","")}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-slate-400 w-8 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className="text-xs text-slate-600 text-center py-6">No issues raised in this date range.</p>
          )}
        </div>
      </div>
    </>
  );
}

// ── Draft types local to IssueDetailModal ────────────────────────────
type IssueMediaDraft = { file: File | null; preview: string; caption: string };
type IssueCompareDraft = {
  label: string;
  before: { file: File | null; preview: string; note: string };
  after:  { file: File | null; preview: string; note: string };
};

function IssueDetailModal({
  issue, readOnly, onClose, onSaved,
}: {
  issue: RaisedIssue;
  readOnly: boolean;
  onClose: () => void;
  onSaved: (updated: RaisedIssue) => void;
}) {
  const [mediaDrafts, setMediaDrafts] = useState<IssueMediaDraft[]>(() =>
    (issue.media ?? []).map(m => ({ file: null, preview: m.src, caption: m.caption ?? "" }))
  );
  const [compareDrafts, setCompareDrafts] = useState<IssueCompareDraft[]>(() =>
    (issue.compare ?? []).map(c => ({
      label: c.label ?? "",
      before: { file: null, preview: c.before.src, note: c.before.note },
      after:  { file: null, preview: c.after.src,  note: c.after.note  },
    }))
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function addMedia(file: File) {
    const preview = URL.createObjectURL(file);
    setMediaDrafts(d => [...d, { file, preview, caption: "" }]);
  }

  function addCompare() {
    setCompareDrafts(d => [...d, {
      label: "",
      before: { file: null, preview: "", note: "" },
      after:  { file: null, preview: "", note: "" },
    }]);
  }

  async function handleSave() {
    setSaving(true); setErr(null);
    try {
      const media: EntryMedia[] = await Promise.all(
        mediaDrafts.map(async (m) => ({
          kind: "image" as const,
          src: m.file ? await uploadFile(m.file) : m.preview,
          caption: m.caption || undefined,
        }))
      );
      const compare: CompareItem[] = await Promise.all(
        compareDrafts.map(async (c) => ({
          label: c.label || undefined,
          before: { src: c.before.file ? await uploadFile(c.before.file) : c.before.preview, note: c.before.note },
          after:  { src: c.after.file  ? await uploadFile(c.after.file)  : c.after.preview,  note: c.after.note  },
        }))
      );
      const patch = { media, compare };
      const { error } = await supabase.from("raised_issues").update(patch).eq("id", issue.id);
      if (error) { setErr(error.message); return; }
      onSaved({ ...issue, ...patch });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  }

  const typeMeta = ISSUE_TYPE_META[issue.type] ?? ISSUE_TYPE_META.other;
  const priorityMeta = PRIORITY_META[issue.priority];

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm" />
      <div className="fixed z-60 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-700 bg-slate-900/98 shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${typeMeta.text} ${typeMeta.bg}`}>{typeMeta.label}</span>
              {priorityMeta && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${priorityMeta.text} ${priorityMeta.bg}`}>{priorityMeta.label}</span>}
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide text-red-300 bg-red-400/10">Raised Issue</span>
            </div>
            <p className="text-sm font-semibold text-slate-100 leading-snug">{issue.title}</p>
            {issue.description && <p className="text-xs text-slate-500 mt-0.5">{issue.description}</p>}
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 mt-0.5"><X size={16} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">

          {/* Images section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Images</p>
              {!readOnly && (
                <label className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer">
                  <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && addMedia(e.target.files[0])} />
                  <Plus size={11} /> Add image
                </label>
              )}
            </div>
            {mediaDrafts.length === 0 ? (
              <p className="text-xs text-slate-700 py-2">No images yet.</p>
            ) : (
              <div className={`grid gap-2 ${mediaDrafts.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {mediaDrafts.map((m, i) => (
                  <div key={i} className="relative group rounded-lg overflow-hidden border border-slate-800">
                    <img src={m.preview} alt="" className="w-full h-36 object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 px-2 py-1 flex items-center gap-1">
                      <input
                        value={m.caption}
                        onChange={e => setMediaDrafts(d => d.map((x, j) => j === i ? { ...x, caption: e.target.value } : x))}
                        placeholder="Caption…"
                        className="flex-1 bg-transparent text-[11px] text-slate-300 outline-none placeholder:text-slate-600"
                        readOnly={readOnly}
                      />
                      {!readOnly && (
                        <button onClick={() => setMediaDrafts(d => d.filter((_, j) => j !== i))} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Before / After section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Before / After</p>
              {!readOnly && (
                <button onClick={addCompare} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-emerald-400 transition-colors">
                  <Plus size={11} /> Add comparison
                </button>
              )}
            </div>
            {compareDrafts.length === 0 ? (
              <p className="text-xs text-slate-700 py-2">No comparisons yet.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {compareDrafts.map((c, i) => (
                  <div key={i} className="rounded-xl border border-slate-800 bg-slate-950/40 p-3 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={c.label}
                        onChange={e => setCompareDrafts(d => d.map((x, j) => j === i ? { ...x, label: e.target.value } : x))}
                        placeholder="Label (optional)"
                        className="flex-1 rounded bg-transparent border-b border-slate-800 text-[11px] text-slate-300 outline-none py-0.5 placeholder:text-slate-700"
                        readOnly={readOnly}
                      />
                      {!readOnly && (
                        <button onClick={() => setCompareDrafts(d => d.filter((_, j) => j !== i))} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(["before", "after"] as const).map(side => {
                        const slot = c[side];
                        return (
                          <div key={side} className="flex flex-col gap-1">
                            <p className="text-[9px] uppercase tracking-widest text-slate-600 font-bold">{side}</p>
                            {slot.preview ? (
                              <div className="relative group rounded-lg overflow-hidden border border-slate-800">
                                <img src={slot.preview} alt={side} className="w-full h-24 object-cover" />
                                {!readOnly && (
                                  <label className="absolute inset-0 flex items-center justify-center bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                    <input type="file" accept="image/*" className="hidden" onChange={e => {
                                      const f = e.target.files?.[0]; if (!f) return;
                                      const preview = URL.createObjectURL(f);
                                      setCompareDrafts(d => d.map((x, j) => j === i ? { ...x, [side]: { ...x[side], file: f, preview } } : x));
                                    }} />
                                    <ImageIcon size={16} className="text-slate-300" />
                                  </label>
                                )}
                              </div>
                            ) : !readOnly ? (
                              <label className="flex flex-col items-center justify-center h-24 rounded-lg border border-dashed border-slate-700 text-slate-600 hover:border-emerald-700/50 hover:text-emerald-400 transition-colors cursor-pointer">
                                <input type="file" accept="image/*" className="hidden" onChange={e => {
                                  const f = e.target.files?.[0]; if (!f) return;
                                  const preview = URL.createObjectURL(f);
                                  setCompareDrafts(d => d.map((x, j) => j === i ? { ...x, [side]: { ...x[side], file: f, preview } } : x));
                                }} />
                                <ImageIcon size={16} /><span className="text-[10px] mt-1">Upload</span>
                              </label>
                            ) : (
                              <div className="h-24 rounded-lg border border-dashed border-slate-800 flex items-center justify-center text-xs text-slate-700">No image</div>
                            )}
                            <input
                              value={slot.note}
                              onChange={e => setCompareDrafts(d => d.map((x, j) => j === i ? { ...x, [side]: { ...x[side], note: e.target.value } } : x))}
                              placeholder="Note…"
                              className="text-[11px] text-slate-400 bg-transparent border-b border-slate-800/60 outline-none py-0.5 placeholder:text-slate-700"
                              readOnly={readOnly}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {err && <p className="text-xs text-red-400">{err}</p>}
        </div>

        {/* Footer */}
        {!readOnly && (
          <div className="px-5 py-3 border-t border-slate-800 shrink-0">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-xl border border-emerald-700/40 bg-emerald-400/10 text-emerald-300 text-sm font-semibold py-2.5 hover:bg-emerald-400/20 transition-colors disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function IssueRow({ issue, readOnly, onEdit, onDelete, onStart, onToggle }: {
  issue: RaisedIssue;
  readOnly: boolean;
  onEdit: (i: RaisedIssue) => void;
  onDelete: (i: RaisedIssue) => void;
  onStart: (i: RaisedIssue) => void;
  onToggle: (i: RaisedIssue) => void;
}) {
  const typeMeta = ISSUE_TYPE_META[issue.type] ?? ISSUE_TYPE_META.other;
  const priorityMeta = PRIORITY_META[issue.priority];
  const resolved = issue.status === "resolved";
  const inProgress = issue.status === "in_progress";
  return (
    <div className={`rounded-xl border px-4 py-3 flex flex-col gap-2 transition-colors ${resolved ? "border-slate-800/40 bg-slate-950/20 opacity-60" : inProgress ? "border-yellow-400/20 bg-yellow-400/5" : "border-slate-800 bg-slate-900/60"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug ${resolved ? "line-through text-slate-500" : "text-slate-100"}`}>{issue.title}</p>
          {issue.description && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{issue.description}</p>}
        </div>
        {!readOnly && (
          <div className="flex items-center gap-1 shrink-0">
            {issue.status === "open" && (
              <button onClick={() => onStart(issue)} className="text-[10px] px-2 py-1 rounded-lg border border-yellow-700/40 text-yellow-400 hover:bg-yellow-400/10 transition-colors">
                ▶ Start
              </button>
            )}
            {!inProgress && (
              <button onClick={() => onToggle(issue)} title={resolved ? "Reopen" : "Mark resolved"} className={`text-[10px] px-2 py-1 rounded-lg border transition-colors ${resolved ? "border-slate-700 text-slate-500 hover:text-emerald-400 hover:border-emerald-700/40" : "border-emerald-700/40 text-emerald-400 hover:bg-emerald-400/10"}`}>
                {resolved ? "Reopen" : "✓ Resolve"}
              </button>
            )}
            <button onClick={() => onEdit(issue)} className="p-1 rounded text-slate-600 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"><Pencil size={12} /></button>
            <button onClick={() => onDelete(issue)} className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"><Trash2 size={12} /></button>
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${typeMeta.text} ${typeMeta.bg}`}>{typeMeta.label}</span>
        {priorityMeta && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${priorityMeta.text} ${priorityMeta.bg}`}>{priorityMeta.label}</span>}
        {inProgress && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide text-yellow-400 bg-yellow-400/10">In Progress</span>}
        <span className="text-[9px] text-slate-600 font-mono ml-auto">{issue.date_raised}</span>
        {inProgress && issue.date_started && <span className="text-[9px] text-yellow-600 font-mono">started {issue.date_started}</span>}
        {resolved && issue.date_resolved && <span className="text-[9px] text-emerald-600 font-mono">resolved {issue.date_resolved}</span>}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// Grouped Issue Card — raised issues for the same date, one card
// ════════════════════════════════════════════════════════════════════
function GroupedIssueCard({
  date, issues, readOnly, delay, onView, onResolve,
}: {
  date: string;
  issues: RaisedIssue[];
  readOnly: boolean;
  delay?: number;
  onView: (issue: RaisedIssue) => void;
  onResolve: (issue: RaisedIssue) => void;
}) {
  const allResolved = issues.every(i => i.status === "resolved");
  const borderAccent = allResolved ? "border-l-emerald-500/60" : "border-l-red-500/60";
  return (
    <article
      className={`flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm overflow-hidden animate-fade-in-up border-l-4 ${borderAccent}`}
      style={{ animationDelay: `${delay ?? 0}ms` }}
    >
      <div className="px-4 pt-4 sm:px-5 sm:pt-5 pb-3 border-b border-slate-800/60 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10px] tracking-widest uppercase text-slate-400">
          <Folder size={12} /> {issues[0].project}
        </span>
        <span className="text-[10px] font-mono text-slate-500">{date}</span>
      </div>
      <div className="px-4 sm:px-5 pt-3 pb-3 flex flex-col gap-3">
        <p className="text-[9px] font-bold uppercase tracking-widest text-red-400/60">Raised Issues</p>
        {issues.map(issue => {
          const resolved = issue.status === "resolved";
          const tm = ISSUE_TYPE_META[issue.type] ?? ISSUE_TYPE_META.other;
          const pm = PRIORITY_META[issue.priority];
          const hasMedia = (issue.media?.length ?? 0) + (issue.compare?.length ?? 0) > 0;
          return (
            <div key={issue.id} className={`flex items-start gap-2.5 pl-2.5 border-l-2 ${resolved ? "border-emerald-500/40" : "border-red-500/50"}`}>
              <div className="flex-1 min-w-0">
                <button onClick={() => onView(issue)} className="text-xs text-slate-200 leading-snug text-left hover:text-emerald-300 transition-colors">
                  {issue.title}
                </button>
                {issue.description && (
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{issue.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide text-red-300 bg-red-400/10">Raised Issue</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${tm.text} ${tm.bg}`}>{tm.label}</span>
                  {pm && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${pm.text} ${pm.bg}`}>{pm.label}</span>}
                  {resolved
                    ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide text-emerald-400 bg-emerald-400/10">Resolved</span>
                    : <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide text-yellow-400 bg-yellow-400/10">In Progress</span>
                  }
                  {hasMedia && <span className="text-[9px] text-slate-500 flex items-center gap-0.5"><ImageIcon size={9} /> media</span>}
                </div>
              </div>
              {!readOnly && (
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => onView(issue)} className="text-[10px] px-2 py-1 rounded-lg border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors">
                    + Media
                  </button>
                  <button
                    onClick={() => onResolve(issue)}
                    className={`text-[10px] px-2 py-1 rounded-lg border transition-colors ${
                      resolved
                        ? "border-slate-700 text-slate-500 hover:text-yellow-400 hover:border-yellow-700/40"
                        : "border-emerald-700/40 text-emerald-300 hover:bg-emerald-400/10"
                    }`}
                  >
                    {resolved ? "Reopen" : "✓ Resolve"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
}

// ════════════════════════════════════════════════════════════════════
// COMPLETED PANEL
// ════════════════════════════════════════════════════════════════════
type DoneTask = Task & { date: string; project: string; entryTitle: string; entryId: string };

function CompletedPanel({
  open, onClose, entries, issues, onEditEntry,
}: {
  open: boolean;
  onClose: () => void;
  entries: Entry[];
  issues: RaisedIssue[];
  onEditEntry?: (entryId: string) => void;
}) {
  const [dateRange, setDateRange] = useState<"week" | "month" | "all" | "custom">("week");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [projectFilter, setProjectFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const projects = useMemo(() => Array.from(new Set(entries.map(e => e.project))), [entries]);

  const { from, to } = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    if (dateRange === "week") {
      const d = new Date(now); d.setDate(d.getDate() - 6);
      return { from: d.toISOString().slice(0, 10), to: today };
    }
    if (dateRange === "month") {
      return { from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10), to: today };
    }
    if (dateRange === "custom") return { from: customFrom, to: customTo };
    return { from: "", to: "" };
  }, [dateRange, customFrom, customTo]);

  const allDoneTasks = useMemo<DoneTask[]>(() =>
    entries.flatMap(e =>
      e.tasks.filter(t => t.status === "done").map(t => ({ ...t, date: e.date, project: e.project, entryTitle: e.title, entryId: e.id }))
    ).sort((a, b) => b.date.localeCompare(a.date)),
  [entries]);

  const resolvedIssues = useMemo(() => [...issues.filter(i => i.status === "resolved")].sort((a, b) => (b.date_resolved ?? b.date_raised).localeCompare(a.date_resolved ?? a.date_raised)), [issues]);

  const filteredDone = useMemo(() => allDoneTasks.filter(t => {
    if (projectFilter !== "all" && t.project !== projectFilter) return false;
    if (typeFilter !== "all" && typeFilter !== "issues" && (t.type ?? "task") !== typeFilter) return false;
    if (typeFilter === "issues") return false;
    if (from && t.date < from) return false;
    if (to && t.date > to) return false;
    return true;
  }), [allDoneTasks, projectFilter, typeFilter, from, to]);

  const filteredResolved = useMemo(() => resolvedIssues.filter(i => {
    if (projectFilter !== "all" && i.project !== projectFilter) return false;
    if (typeFilter !== "all" && typeFilter !== "issues" && i.type !== typeFilter) return false;
    const d = i.date_resolved ?? i.date_raised;
    if (from && d < from) return false;
    if (to && d > to) return false;
    return true;
  }), [resolvedIssues, projectFilter, typeFilter, from, to]);

  const motivation = useMemo(() => {
    const total = filteredDone.length + filteredResolved.length;
    const bugs = filteredDone.filter(t => t.type === "bugfix").length + filteredResolved.length;
    const features = filteredDone.filter(t => t.type === "feature").length;
    const optimized = filteredDone.filter(t => t.type === "optimized").length;
    const period = dateRange === "week" ? "this week" : dateRange === "month" ? "this month" : "in total";

    if (total === 0) return { emoji: "💭", headline: "Nothing here yet...", sub: "No completed work in this range. Time to ship something great!", color: "from-slate-800/60 to-slate-900/60 border-slate-700/40" };
    if (bugs > 20) return { emoji: "🔥", headline: "Absolute bug terminator!", sub: `You crushed ${bugs} bugs ${period}. The codebase has never been cleaner.`, color: "from-orange-900/40 to-red-900/30 border-orange-700/30" };
    if (features > 15) return { emoji: "🚀", headline: "Feature factory mode!", sub: `${features} features shipped ${period}. Users are going to love every single one.`, color: "from-emerald-900/40 to-teal-900/30 border-emerald-700/30" };
    if (total > 30) return { emoji: "⚡", headline: "Absolutely legendary!", sub: `${total} tasks completed ${period}. You're operating on another level.`, color: "from-yellow-900/30 to-amber-900/20 border-yellow-700/30" };
    if (optimized > 8) return { emoji: "🎯", headline: "Performance wizard!", sub: `${optimized} optimizations ${period}. The app is running like a dream.`, color: "from-cyan-900/40 to-blue-900/30 border-cyan-700/30" };
    if (filteredResolved.length > 8) return { emoji: "🛡️", headline: "Issue slayer!", sub: `${filteredResolved.length} raised issues resolved ${period}. Rock-solid reliability.`, color: "from-violet-900/40 to-purple-900/30 border-violet-700/30" };
    if (total > 20) return { emoji: "💪", headline: "Crushing it!", sub: `${total} tasks done ${period}. That's serious momentum — keep it going.`, color: "from-emerald-900/30 to-teal-900/20 border-emerald-700/30" };
    if (features > 5) return { emoji: "✨", headline: "Shipping great things!", sub: `${features} features out the door ${period}. Quality work, every time.`, color: "from-emerald-900/30 to-slate-900/20 border-emerald-700/30" };
    if (bugs > 5) return { emoji: "🐛", headline: "Bug hunter on the loose!", sub: `${bugs} bugs squashed ${period}. Each fix makes the product better.`, color: "from-orange-900/30 to-slate-900/20 border-orange-700/30" };
    if (total > 10) return { emoji: "📈", headline: "On a great roll!", sub: `${total} tasks wrapped up ${period}. Steady progress wins the race.`, color: "from-blue-900/30 to-slate-900/20 border-blue-700/30" };
    if (total > 5) return { emoji: "✅", headline: "Solid progress!", sub: `${total} tasks done ${period}. Every task shipped is a step forward.`, color: "from-teal-900/30 to-slate-900/20 border-teal-700/30" };
    return { emoji: "🌱", headline: "Getting things done!", sub: `${total} task${total > 1 ? "s" : ""} completed ${period}. Great start — keep building!`, color: "from-slate-800/60 to-slate-900/40 border-slate-700/40" };
  }, [filteredDone, filteredResolved, dateRange]);

  const TYPE_FILTERS = [
    { key: "all", label: "All" },
    { key: "feature", label: "Features" },
    { key: "bugfix", label: "Bug Fixes" },
    { key: "task", label: "Tasks" },
    { key: "optimized", label: "Optimized" },
    { key: "refactor", label: "Refactors" },
    { key: "milestone", label: "Milestones" },
    { key: "issues", label: "Raised Issues" },
  ];

  const RANGE_BTNS = [
    { key: "week", label: "This Week" },
    { key: "month", label: "This Month" },
    { key: "all", label: "All Time" },
    { key: "custom", label: "Custom" },
  ] as const;

  if (!open) return null;

  const totalFiltered = filteredDone.length + filteredResolved.length;
  const bugCount = filteredDone.filter(t => t.type === "bugfix").length + filteredResolved.length;
  const featureCount = filteredDone.filter(t => t.type === "feature").length;
  const showTasks = typeFilter !== "issues";
  const showIssues = typeFilter === "all" || typeFilter === "issues";

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm" />
      <div className="fixed inset-0 z-55 flex flex-col bg-slate-950 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <div>
              <h2 className="text-sm font-bold tracking-widest uppercase text-emerald-300">Completed Work</h2>
              <p className="text-[11px] text-slate-500 mt-0.5">{totalFiltered} item{totalFiltered !== 1 ? "s" : ""} in this view</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 flex flex-col gap-6">
          {/* Motivational card */}
          <div className={`rounded-2xl border bg-gradient-to-br ${motivation.color} px-5 py-4 flex items-start gap-4`}>
            <span className="text-3xl mt-0.5 shrink-0">{motivation.emoji}</span>
            <div>
              <p className="text-base font-bold text-slate-100 leading-snug">{motivation.headline}</p>
              <p className="text-sm text-slate-400 mt-1 leading-relaxed">{motivation.sub}</p>
            </div>
            <Sparkles size={16} className="ml-auto shrink-0 text-slate-600 mt-1" />
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Total Done", value: totalFiltered, color: "text-emerald-400", bg: "border-emerald-700/30 bg-emerald-400/5" },
              { label: "Resolved Issues", value: filteredResolved.length, color: "text-violet-400", bg: "border-violet-700/30 bg-violet-400/5" },
              { label: "Bug Fixes", value: bugCount, color: "text-orange-400", bg: "border-orange-700/30 bg-orange-400/5" },
              { label: "Features", value: featureCount, color: "text-teal-400", bg: "border-teal-700/30 bg-teal-400/5" },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border ${s.bg} px-4 py-3 flex flex-col gap-1`}>
                <span className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</span>
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col gap-3">
            {/* Quick range chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={12} className="text-slate-600 shrink-0" />
              {RANGE_BTNS.map(r => (
                <button
                  key={r.key}
                  onClick={() => setDateRange(r.key)}
                  className={`text-[11px] px-3 py-1.5 rounded-lg border font-medium transition-colors ${dateRange === r.key ? "bg-emerald-400/15 border-emerald-700/40 text-emerald-300" : "border-slate-700 text-slate-500 hover:text-slate-300 hover:border-slate-600"}`}
                >
                  {r.label}
                </button>
              ))}
              {dateRange === "custom" && (
                <div className="flex items-center gap-2 ml-1">
                  <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)}
                    className="text-[11px] bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-700" />
                  <span className="text-slate-600 text-xs">→</span>
                  <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)}
                    className="text-[11px] bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-700" />
                </div>
              )}
            </div>
            {/* Project + Type filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <select value={projectFilter} onChange={e => setProjectFilter(e.target.value)}
                className="text-[11px] bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-emerald-700">
                <option value="all">All Projects</option>
                {projects.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <div className="flex items-center gap-1.5 flex-wrap">
                {TYPE_FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setTypeFilter(f.key)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${typeFilter === f.key ? "bg-slate-700 border-slate-500 text-slate-100" : "border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"}`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Completed Tasks */}
          {showTasks && filteredDone.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 size={11} className="text-emerald-500" /> Completed Tasks
                <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold">{filteredDone.length}</span>
              </p>
              <div className="flex flex-col gap-1.5">
                {filteredDone.map((task, i) => {
                  const typeKey = (task.type ?? "task") as keyof typeof TYPE_META;
                  const meta = TYPE_META[typeKey] ?? TYPE_META.task;
                  const Icon = meta.icon;
                  const pm = task.priority ? PRIORITY_META[task.priority] : null;
                  return (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-colors group">
                      <span className={`mt-0.5 shrink-0 ${meta.text}`}><Icon size={13} /></span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 leading-snug">{task.title}</p>
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-mono text-slate-600">{task.date}</span>
                          <span className="text-slate-700">·</span>
                          <span className="text-[10px] text-slate-500">{task.project}</span>
                          {pm && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${pm.text} ${pm.bg}`}>{pm.label}</span>}
                          {task.complexity && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${COMPLEXITY_META[task.complexity].text} ${COMPLEXITY_META[task.complexity].bg}`}>{COMPLEXITY_META[task.complexity].label}</span>}
                          {task.tags?.map(tag => <span key={tag} className="text-[9px] text-slate-500 border border-slate-800 rounded-md px-1.5 py-0.5">#{tag}</span>)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${meta.text} ${meta.bg}`}>{meta.label}</span>
                        {onEditEntry && (
                          <button
                            onClick={() => onEditEntry(task.entryId)}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-600 hover:text-emerald-400 hover:bg-emerald-400/10 transition-all"
                            title="Edit entry"
                          >
                            <Pencil size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Resolved Raised Issues */}
          {showIssues && filteredResolved.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <AlertCircle size={11} className="text-violet-400" /> Resolved Issues
                <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full bg-violet-500/15 text-violet-400 font-bold">{filteredResolved.length}</span>
              </p>
              <div className="flex flex-col gap-1.5">
                {filteredResolved.map(issue => {
                  const tm = ISSUE_TYPE_META[issue.type] ?? ISSUE_TYPE_META.other;
                  const pm = PRIORITY_META[issue.priority];
                  const days = issue.date_started && issue.date_resolved
                    ? Math.max(0, Math.round((new Date(issue.date_resolved).getTime() - new Date(issue.date_started).getTime()) / 86400000))
                    : null;
                  return (
                    <div key={issue.id} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-slate-900/60 border border-emerald-900/20 hover:border-emerald-800/40 transition-colors">
                      <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-200 leading-snug">{issue.title}</p>
                        {issue.description && <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{issue.description}</p>}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1">
                          <span className="text-[10px] font-mono text-slate-600">{issue.date_resolved ?? issue.date_raised}</span>
                          <span className="text-slate-700">·</span>
                          <span className="text-[10px] text-slate-500">{issue.project}</span>
                          {days !== null && <span className="text-[10px] text-slate-600">resolved in {days}d</span>}
                          {pm && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${pm.text} ${pm.bg}`}>{pm.label}</span>}
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide shrink-0 ${tm.text} ${tm.bg}`}>{tm.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state */}
          {totalFiltered === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <TrendingUp size={32} className="text-slate-700" />
              <p className="text-slate-400 font-medium">Nothing completed in this range</p>
              <p className="text-slate-600 text-sm">Try a wider date range or different filters</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
// Completion Toast — stacked top-right, magical orb + fire effect
// ════════════════════════════════════════════════════════════════════
function CompletionToast({
  toasts,
  onClose,
}: {
  toasts: Array<{ id: string; headline: string; sub: string; verse: string; ref: string }>;
  onClose: (id: string) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-5 right-5 z-200 flex flex-col gap-3 pointer-events-none" style={{ width: 300 }}>
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto relative toast-fire rounded-2xl border border-orange-500/35 bg-slate-950/98 shadow-2xl shadow-black/70 overflow-hidden backdrop-blur-md">
          {/* Magical ambient rings behind content */}
          <svg
            className="absolute pointer-events-none"
            style={{ top: -28, left: -28, width: 120, height: 120, zIndex: 0, opacity: 0.9 }}
            viewBox="0 0 120 120"
          >
            <circle cx="60" cy="60" r="44" fill="none" stroke="rgba(251,146,60,0.18)" strokeWidth="0.8" strokeDasharray="5 7"
              style={{ transformOrigin: "60px 60px", animation: "spinCW 9s linear infinite" }} />
            <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(251,191,36,0.1)" strokeWidth="0.5" strokeDasharray="2 9"
              style={{ transformOrigin: "60px 60px", animation: "spinCCW 14s linear infinite" }} />
          </svg>
          {/* Dim radial glow behind orb */}
          <div className="absolute top-2 left-2 w-16 h-16 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(251,146,60,0.12) 0%, transparent 70%)", zIndex: 0 }} />

          {/* Header */}
          <div className="relative z-10 px-4 pt-3.5 pb-2.5 flex items-start gap-3">
            {/* Fire orb with micro ring */}
            <div className="relative shrink-0 mt-0.5" style={{ width: 36, height: 36 }}>
              {/* Glow backdrop */}
              <div className="absolute inset-0 rounded-full fire-orb-pulse" style={{ background: "radial-gradient(circle, rgba(251,146,60,0.35) 0%, transparent 70%)" }} />
              {/* Circle face */}
              <div className="absolute inset-0 rounded-full border border-orange-500/40 bg-orange-500/10 flex items-center justify-center">
                <span className="fire-emoji text-base leading-none">🔥</span>
              </div>
              {/* Spinning ring around icon */}
              <svg className="absolute pointer-events-none" style={{ top: -7, left: -7, width: 50, height: 50, overflow: "visible" }} viewBox="0 0 50 50">
                <circle cx="25" cy="25" r="22" fill="none" stroke="rgba(251,146,60,0.5)" strokeWidth="1" strokeDasharray="4 5"
                  style={{ transformOrigin: "25px 25px", animation: "spinCW 2.5s linear infinite" }} />
                <circle cx="25" cy="25" r="17" fill="none" stroke="rgba(251,191,36,0.3)" strokeWidth="0.6" strokeDasharray="2 6"
                  style={{ transformOrigin: "25px 25px", animation: "spinCCW 4s linear infinite" }} />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-slate-50 leading-snug tracking-tight">{toast.headline}</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{toast.sub}</p>
            </div>
            <button onClick={() => onClose(toast.id)} className="shrink-0 -mt-0.5 -mr-1 p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-slate-800/60 transition-colors">
              <X size={12} />
            </button>
          </div>

          {/* Verse block */}
          <div className="relative z-10 mx-3 mb-3 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
            <p className="text-[10px] text-slate-400 italic leading-relaxed">"{toast.verse}"</p>
            <p className="text-[9px] text-emerald-400/80 mt-1 font-semibold tracking-wide">— {toast.ref}</p>
          </div>

          {/* Drain bar */}
          <div className="relative z-10 h-px overflow-hidden bg-slate-800/40">
            <div className="h-full w-full bg-linear-to-r from-transparent via-orange-500/80 to-amber-400/60 origin-left" style={{ animation: "drainWidth 7s linear forwards" }} />
          </div>
        </div>
      ))}
    </div>
  );
}
