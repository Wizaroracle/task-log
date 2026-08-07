import { useEffect, useMemo, useState } from "react";
import type { ComponentType } from "react";
import {
  CheckCircle2,
  Bug,
  Folder,
  Image as ImageIcon,
  Video as VideoIcon,
  ArrowRight,
  X,
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
  Filter,
  ChevronUp,
  ChevronDown,
  GitCommitHorizontal,
  Crosshair,
  Rocket,
  Calendar,
} from "lucide-react";
import { PROFILE } from "./utils/profile-data";
import type { CompareItem, Entry, EntryMedia, Feature, RaisedIssue, Task } from "./utils/entries/entries";
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
    bg: "bg-emerald-400/12",
    ring: "ring-emerald-400/20",
  },
  bugfix: {
    label: "Bug Fix",
    icon: Bug,
    text: "text-orange-400",
    bg: "bg-orange-400/12",
    ring: "ring-orange-400/20",
  },
  task: {
    label: "Task",
    icon: CheckCircle2,
    text: "text-teal-300",
    bg: "bg-teal-300/10",
    ring: "ring-teal-300/20",
  },
  milestone: {
    label: "Milestone",
    icon: ArrowRight,
    text: "text-amber-400",
    bg: "bg-amber-400/10",
    ring: "ring-amber-400/20",
  },
  learning: {
    label: "Learning",
    icon: BookOpen,
    text: "text-indigo-400",
    bg: "bg-indigo-400/10",
    ring: "ring-indigo-400/20",
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
    text: "text-fuchsia-400",
    bg: "bg-fuchsia-400/10",
    ring: "ring-fuchsia-400/20",
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
  feature:   "#34d399", // emerald-400
  bugfix:    "#fb923c", // orange-400
  task:      "#5eead4", // teal-300
  milestone: "#fbbf24", // amber-400
  learning:  "#818cf8", // indigo-400
  optimized: "#22d3ee", // cyan-400
  refactor:  "#e879f9", // fuchsia-400
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

const FEATURE_PRESET_COLORS = [
  "#f97316", // orange  — Food Ordering
  "#6366f1", // indigo  — default
  "#10b981", // emerald
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#14b8a6", // teal
  "#f59e0b", // amber
];

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

// Shared types used by the dashboard and WeeklyReportModal
type CompletedTaskItem = Task & { entryId: string; entryProject: string; entryDate: string };
type CPRow = { kind: "task"; item: CompletedTaskItem } | { kind: "issue"; item: RaisedIssue };
type SavedReport = {
  id: string;
  title: string;
  date_label: string;
  items_snapshot: CPRow[];
  created_at: string;
};

// ════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════
export default function ProjectDashboard() {
  const [profileOpen, setProfileOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formSeedTask, setFormSeedTask] = useState<Task | null>(null);
  const [editingEntry, setEditingEntry] = useState<Entry | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddSaving, setQuickAddSaving] = useState(false);
  const [quickAddProject, setQuickAddProject] = useState<"VC+" | "VC+ CMS">("VC+");
  const [quickAdd, setQuickAdd] = useState({
    title: "",
    description: "",
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
  const [focusedKeys, setFocusedKeys] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("vc-focused-tasks");
      return stored ? new Set<string>(JSON.parse(stored)) : new Set<string>();
    } catch { return new Set<string>(); }
  });
  function isFocused(kind: string, key: string) { return focusedKeys.has(`${kind}:${key}`); }
  function toggleFocus(kind: string, key: string) {
    setFocusedKeys(prev => {
      const next = new Set(prev);
      const k = `${kind}:${key}`;
      if (next.has(k)) next.delete(k); else next.add(k);
      localStorage.setItem("vc-focused-tasks", JSON.stringify([...next]));
      return next;
    });
  }
  const [backlogTagFilter, setBacklogTagFilter] = useState("all");
  const [backlogFilterOpen, setBacklogFilterOpen] = useState(false);
  const [backlogPriorityFilter, setBacklogPriorityFilter] = useState("all");
  const [backlogComplexityFilter, setBacklogComplexityFilter] = useState("all");
  const [backlogTypeFilter, setBacklogTypeFilter] = useState("all");
  const [backlogPage, setBacklogPage] = useState(1);
  const [inProgressPage, setInProgressPage] = useState(1);
  const [completedPage, setCompletedPage] = useState(1);
  const [completedDateRange, setCompletedDateRange] = useState<"week" | "month" | "all" | "custom">("week");
  const [completedDateFrom, setCompletedDateFrom] = useState("");
  const [completedDateTo, setCompletedDateTo] = useState("");
  const [completedTypeFilter, setCompletedTypeFilter] = useState<"all" | "tasks" | "issues">("all");
  const [completedFeatureFilter, setCompletedFeatureFilter] = useState<string>("all");
  // "Done" action menu — tracks which task title has the popup open
  const [doneMenuTask, setDoneMenuTask] = useState<string | null>(null);
  const [dateOverrideModal, setDateOverrideModal] = useState<
    | { kind: "task"; taskTitle: string; label: string; startDate: string; endDate: string }
    | { kind: "issue"; issueId: string; label: string; startDate: string; endDate: string }
    | null
  >(null);
  // Issue resolve menu — tracks which issue id has the popup open
  const [resolveMenuIssue, setResolveMenuIssue] = useState<string | null>(null);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportItems, setReportItems] = useState<CPRow[]>([]);
  const [reportDateLabel, setReportDateLabel] = useState("");
  const [reportTitleOverride, setReportTitleOverride] = useState("");
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
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


  // Stats + heatmap collapse
  const [statsOpen, setStatsOpen] = useState(true);
  const [heatmapOpen, setHeatmapOpen] = useState(true);
  const [featureProgressOpen, setFeatureProgressOpen] = useState(false);

  // Features (epics)
  const [features, setFeatures] = useState<Feature[]>([]);
  const [_featuresLoading, setFeaturesLoading] = useState(false);
  const [featureTabFilter, setFeatureTabFilter] = useState<string>(
    () => localStorage.getItem("vc-feature-tab") ?? "all"
  );
  function setFeatureTabFilterPersist(id: string) {
    localStorage.setItem("vc-feature-tab", id);
    setFeatureTabFilter(id);
  }
  const [createFeatureOpen, setCreateFeatureOpen] = useState(false);
  const [createFeatureForm, setCreateFeatureForm] = useState({ name: "", color: FEATURE_PRESET_COLORS[0], description: "" });
  const [createFeatureSaving, setCreateFeatureSaving] = useState(false);
  const [quickAddFeatureId, setQuickAddFeatureId] = useState<string | null>(null);
  const [backlogEditFeatureId, setBacklogEditFeatureId] = useState<string | null>(null);
  const [confirmDeleteFeatureId, setConfirmDeleteFeatureId] = useState<string | null>(null);

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
  const [allTasksOpen, setAllTasksOpen] = useState(false);
  const [issues, setIssues] = useState<RaisedIssue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(false);
  const [issuesProjectFilter, setIssuesProjectFilter] = useState("all");
  const [reportDateFrom, setReportDateFrom] = useState(() => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().slice(0, 10); });
  const [reportDateTo, setReportDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  // Raised Issues — dashboard panel
  const [editingIssue, setEditingIssue] = useState<RaisedIssue | null>(null);
  const [issueFormOpen, setIssueFormOpen] = useState(false);
  const [issueForm, setIssueForm] = useState<Partial<RaisedIssue>>({});
  const [issueFormMedia, setIssueFormMedia] = useState<Array<{ file: File | null; preview: string; caption: string }>>([]);
  const [issueFormCompare, setIssueFormCompare] = useState<Array<{ label: string; before: { file: File | null; preview: string; note: string }; after: { file: File | null; preview: string; note: string } }>>([]);
  const [issueFormSaving, setIssueFormSaving] = useState(false);
  const [dashIssueStatusFilter, setDashIssueStatusFilter] = useState("open");
  const [dashIssuePage, setDashIssuePage] = useState(1);
  const [dashIssueProjectFilter, setDashIssueProjectFilter] = useState("all");

  // Raised Issue detail modal (media / compare)
  const [detailIssue, setDetailIssue] = useState<RaisedIssue | null>(null);

  // Backlog inline edit
  const [editingBacklogTask, setEditingBacklogTask] = useState<import("./components/AddEntryModal").InProgressItem | null>(null);
  const [backlogEditForm, setBacklogEditForm] = useState<{ title: string; description: string; priority: string; complexity: string; type: string; project: string }>({ title: "", description: "", priority: "", complexity: "", type: "", project: "" });
  const [backlogEditMedia, setBacklogEditMedia] = useState<Array<{ file: File | null; preview: string; caption: string }>>([]);
  const [backlogEditCompare, setBacklogEditCompare] = useState<Array<{ label: string; before: { file: File | null; preview: string; note: string }; after: { file: File | null; preview: string; note: string } }>>([]);
  const [backlogEditSaving, setBacklogEditSaving] = useState(false);
  const [editingDoneTask, setEditingDoneTask] = useState<CompletedTaskItem | null>(null);
  const [doneEditForm, setDoneEditForm] = useState<{ title: string; description: string; priority: string; complexity: string; type: string; project: string }>({ title: "", description: "", priority: "", complexity: "", type: "", project: "" });
  const [doneEditSaving, setDoneEditSaving] = useState(false);

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

  // ── Features (Epics) CRUD ───────────────────────────────────────
  async function loadFeatures() {
    setFeaturesLoading(true);
    const { data, error } = await supabase.from("features").select("*").order("created_at", { ascending: true });
    if (!error && data) setFeatures(data as Feature[]);
    setFeaturesLoading(false);
  }

  async function createFeature() {
    if (!createFeatureForm.name.trim()) return;
    setCreateFeatureSaving(true);
    const payload: Omit<Feature, "id"> = {
      name: createFeatureForm.name.trim(),
      color: createFeatureForm.color,
      ...(createFeatureForm.description.trim() ? { description: createFeatureForm.description.trim() } : {}),
    };
    const { data, error } = await supabase.from("features").insert(payload).select().single();
    if (!error && data) {
      setFeatures(prev => [...prev, data as Feature]);
      setFeatureTabFilterPersist((data as Feature).id);
      setCreateFeatureForm({ name: "", color: FEATURE_PRESET_COLORS[0], description: "" });
      setCreateFeatureOpen(false);
    }
    setCreateFeatureSaving(false);
  }

  async function deleteFeature(id: string) {
    const { error } = await supabase.from("features").delete().eq("id", id);
    if (!error) {
      setFeatures(prev => prev.filter(f => f.id !== id));
      if (featureTabFilter === id) setFeatureTabFilterPersist("all");
    }
  }

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
    setIssueFormSaving(true);
    try {
      const media: EntryMedia[] = await Promise.all(
        issueFormMedia
          .filter((m) => m.file !== null || m.preview !== "")
          .map(async (m) => ({
            kind: "image" as const,
            src: m.file ? await uploadFile(m.file) : m.preview,
            ...(m.caption.trim() ? { caption: m.caption.trim() } : {}),
          })),
      );
      const compare: CompareItem[] = await Promise.all(
        issueFormCompare.map(async (c) => ({
          ...(c.label.trim() ? { label: c.label.trim() } : {}),
          before: { src: c.before.file ? await uploadFile(c.before.file) : c.before.preview, note: c.before.note },
          after:  { src: c.after.file  ? await uploadFile(c.after.file)  : c.after.preview,  note: c.after.note  },
        })),
      );

      const resetForm = () => {
        setEditingIssue(null);
        setIssueFormOpen(false);
        setIssueForm({});
        setIssueFormMedia([]);
        setIssueFormCompare([]);
      };

      if (editingIssue) {
        const patch = {
          ...issueForm,
          ...(media.length > 0 ? { media } : {}),
          ...(compare.length > 0 ? { compare } : {}),
        };
        const { error } = await supabase.from("raised_issues").update(patch).eq("id", editingIssue.id);
        if (!error) {
          setIssues((prev) => prev.map((i) => i.id === editingIssue.id ? { ...i, ...patch } as RaisedIssue : i));
          resetForm();
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
          ...(media.length > 0 ? { media } : {}),
          ...(compare.length > 0 ? { compare } : {}),
        };
        const { data, error } = await supabase.from("raised_issues").insert(payload).select().single();
        if (!error && data) {
          setIssues((prev) => [data as RaisedIssue, ...prev]);
          resetForm();
        }
      }
    } finally {
      setIssueFormSaving(false);
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

  async function markIssueForDeployment(issue: RaisedIssue) {
    const patch: Partial<RaisedIssue> = { status: "deployment" };
    const { error } = await supabase.from("raised_issues").update(patch).eq("id", issue.id);
    if (!error) setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, ...patch } : i));
  }

  async function markIssueDeployed(issue: RaisedIssue) {
    const patch: Partial<RaisedIssue> = { status: "resolved", date_resolved: new Date().toISOString().slice(0, 10) };
    const { error } = await supabase.from("raised_issues").update(patch).eq("id", issue.id);
    if (!error) {
      setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, ...patch } : i));
      fireCompletionToast(undefined, true);
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
              ...(backlogEditForm.description.trim() ? { description: backlogEditForm.description.trim() } : { description: undefined }),
              type: (backlogEditForm.type || undefined) as Task["type"],
              priority: (backlogEditForm.priority || undefined) as Task["priority"],
              complexity: (backlogEditForm.complexity || undefined) as Task["complexity"],
              ...(compare.length > 0 ? { compare } : { compare: undefined }),
              ...(media.length > 0   ? { media }   : { media: undefined }),
              featureId: backlogEditFeatureId ?? undefined,
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
        setBacklogEditFeatureId(null);
      }
    } finally {
      setBacklogEditSaving(false);
    }
  }

  async function saveDoneTaskEdit() {
    if (!editingDoneTask || !doneEditForm.title.trim()) return;
    const entry = entries.find((e) => e.id === editingDoneTask.entryId);
    if (!entry) return;
    setDoneEditSaving(true);
    try {
      const updatedTasks = entry.tasks.map((t) =>
        t.title === editingDoneTask.title && t.status === "done"
          ? {
              ...t,
              title: doneEditForm.title.trim(),
              ...(doneEditForm.description.trim() ? { description: doneEditForm.description.trim() } : { description: undefined }),
              type: (doneEditForm.type || undefined) as Task["type"],
              priority: (doneEditForm.priority || undefined) as Task["priority"],
              complexity: (doneEditForm.complexity || undefined) as Task["complexity"],
            }
          : t,
      );
      const updates: Record<string, unknown> = { tasks: updatedTasks };
      if (doneEditForm.project && doneEditForm.project !== entry.project) {
        updates.project = doneEditForm.project;
      }
      const { error } = await supabase.from("entries").update(updates).eq("id", entry.id);
      if (!error) {
        setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, ...updates, tasks: updatedTasks } : e));
        setEditingDoneTask(null);
      }
    } finally {
      setDoneEditSaving(false);
    }
  }

  useEffect(() => {
    supabase
      .from("entries")
      .select("*")
      .order("date", { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setEntries(data as Entry[]);
      });
  }, []);

  useEffect(() => { loadIssues(); }, []);
  useEffect(() => { loadFeatures(); }, []);
  useEffect(() => {
    supabase.from("weekly_reports").select("*").order("created_at", { ascending: false })
      .then(({ data, error }) => { if (!error && data) setSavedReports(data as SavedReport[]); });
  }, []);


  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setZoomSrc(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setBacklogPage(1);
  }, [backlogTagFilter, backlogPriorityFilter, backlogComplexityFilter, backlogTypeFilter]);


  const inProgressItems = useMemo<InProgressItem[]>(() => {
    const plannedTitles = new Set<string>();
    entries.forEach((e) => {
      e.tasks.forEach((t) => {
        if (t.status === "planned") plannedTitles.add(t.title);
      });
    });

    const seen = new Map<string, InProgressItem>();
    const all: InProgressItem[] = [];
    entries.forEach((e) => {
      e.tasks.forEach((t) => {
        if (t.status === "progress" && !plannedTitles.has(t.title)) {
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

  const deploymentItems = useMemo<InProgressItem[]>(() => {
    const seen = new Map<string, InProgressItem>();
    entries.forEach((e) => {
      e.tasks.forEach((t) => {
        if (t.status === "deployment" && !seen.has(t.title)) {
          seen.set(t.title, { entryId: e.id, entryTitle: e.title, entryDate: e.date, entryProject: e.project, task: t });
        }
      });
    });
    return Array.from(seen.values());
  }, [entries]);

  const deploymentIssues = useMemo(() => issues.filter(i => i.status === "deployment"), [issues]);

  const completedItems = useMemo<CompletedTaskItem[]>(() => {
    const all = entries.flatMap((e) =>
      e.tasks
        .filter((t) => t.status === "done")
        .map((t) => ({ ...t, entryId: e.id, entryProject: e.project, entryDate: e.date })),
    ).sort((a, b) => b.entryDate.localeCompare(a.entryDate));
    const seen = new Map<string, CompletedTaskItem>();
    for (const t of all) {
      if (!seen.has(t.title)) seen.set(t.title, t);
    }
    return Array.from(seen.values());
  }, [entries]);

  const resolvedIssues = useMemo(
    () => [...issues.filter((i) => i.status === "resolved")].sort((a, b) =>
      (b.date_resolved ?? b.date_raised).localeCompare(a.date_resolved ?? a.date_raised),
    ),
    [issues],
  );

  const PRIORITY_ORDER: Record<string, number> = { urgent: 0, major: 1, minor: 2 };

  // Feature progress stats — counts across all entries per feature
  const featureStats = useMemo(() => {
    return features.map(f => {
      const allTasks = entries.flatMap(e => e.tasks).filter(t => t.featureId === f.id);
      const done    = allTasks.filter(t => t.status === "done").length;
      const inProg  = allTasks.filter(t => t.status === "progress").length;
      const planned = allTasks.filter(t => t.status === "planned").length;
      const total   = done + inProg + planned;
      const pct     = total > 0 ? Math.round((done / total) * 100) : 0;
      return { feature: f, done, inProg, planned, total, pct };
    });
  }, [features, entries]);

  const filteredPlannedItems = useMemo(() => {
    let base =
      backlogTagFilter === "all"
        ? plannedItems
        : plannedItems.filter((item) =>
            (item.task.tags ?? []).includes(backlogTagFilter),
          );
    if (featureTabFilter !== "all") {
      base = featureTabFilter === "general"
        ? base.filter(item => !item.task.featureId)
        : base.filter(item => item.task.featureId === featureTabFilter);
    }
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
  }, [plannedItems, backlogTagFilter, backlogPriorityFilter, backlogComplexityFilter, backlogTypeFilter, featureTabFilter]);

  const stats = useMemo(() => {
    const resolvedIssueCount = resolvedIssues.length;
    return {
      total: completedItems.length + resolvedIssueCount,
      features: completedItems.filter(t => t.type === "feature").length,
      bugs: completedItems.filter(t => t.type === "bugfix").length + resolvedIssueCount,
      optimized: completedItems.filter(t => t.type === "optimized").length,
      tasks: completedItems.filter(t => (t.type ?? "task") === "task").length,
      milestones: completedItems.filter(t => t.type === "milestone").length,
      refactors: completedItems.filter(t => t.type === "refactor").length,
      learnings: completedItems.filter(t => t.type === "learning").length,
    };
  }, [completedItems, resolvedIssues]);


  function formatDateShort(iso: string): string {
    const d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  function openDateOverrideModal(taskTitle: string) {
    const today = new Date().toISOString().slice(0, 10);
    const affected = entries
      .filter((e) => e.tasks.some((t) => t.title === taskTitle && t.status === "progress"))
      .sort((a, b) => a.date.localeCompare(b.date));
    setDateOverrideModal({
      kind: "task",
      taskTitle,
      label: taskTitle,
      startDate: affected[0]?.date ?? today,
      endDate: today,
    });
    setDoneMenuTask(null);
  }

  function openIssueDateOverrideModal(issue: RaisedIssue) {
    const today = new Date().toISOString().slice(0, 10);
    setDateOverrideModal({
      kind: "issue",
      issueId: issue.id,
      label: issue.title,
      startDate: issue.date_started ?? issue.date_raised,
      endDate: today,
    });
    setResolveMenuIssue(null);
  }

  async function resolveIssueWithDates(issueId: string, dates: { start: string; end: string }) {
    const patch: Partial<RaisedIssue> = { status: "resolved", date_started: dates.start, date_resolved: dates.end };
    const { error } = await supabase.from("raised_issues").update(patch).eq("id", issueId);
    if (!error) {
      setIssues((prev) => prev.map((i) => (i.id === issueId ? { ...i, ...patch } : i)));
      fireCompletionToast(undefined, true);
    }
  }

  async function markTaskDone(taskTitle: string, dateOverride?: { start: string; end: string }) {
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
    const startDate = dateOverride?.start ?? affected[0].date;
    const endDate = dateOverride?.end ?? today;
    const dateRange =
      startDate === endDate
        ? formatDateShort(startDate)
        : `${formatDateShort(startDate)} → ${formatDateShort(endDate)}`;
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

  async function markForDeployment(taskTitle: string) {
    setActionLoading(taskTitle);
    const affected = entries.filter(e => e.tasks.some(t => t.title === taskTitle && t.status === "progress"));
    try {
      for (const entry of affected) {
        const updatedTasks = entry.tasks.map(t =>
          t.title === taskTitle && t.status === "progress" ? { ...t, status: "deployment" as const } : t,
        );
        const { error } = await supabase.from("entries").update({ tasks: updatedTasks }).eq("id", entry.id);
        if (!error) setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, tasks: updatedTasks } : e));
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function revertDeploymentToProgress(taskTitle: string) {
    setActionLoading(taskTitle);
    const affected = entries.filter(e => e.tasks.some(t => t.title === taskTitle && t.status === "deployment"));
    try {
      for (const entry of affected) {
        const updatedTasks = entry.tasks.map(t =>
          t.title === taskTitle && t.status === "deployment" ? { ...t, status: "progress" as const } : t,
        );
        const { error } = await supabase.from("entries").update({ tasks: updatedTasks }).eq("id", entry.id);
        if (!error) setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, tasks: updatedTasks } : e));
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function revertIssueDeploymentToProgress(issue: RaisedIssue) {
    const patch: Partial<RaisedIssue> = { status: "in_progress" };
    const { error } = await supabase.from("raised_issues").update(patch).eq("id", issue.id);
    if (!error) setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, ...patch } : i));
  }

  async function markDeployed(taskTitle: string) {
    setActionLoading(taskTitle);
    const today = new Date().toISOString().slice(0, 10);
    const affected = entries.filter(e => e.tasks.some(t => t.title === taskTitle && t.status === "deployment"))
      .sort((a, b) => a.date.localeCompare(b.date));
    if (affected.length === 0) { setActionLoading(null); return; }
    const startDate = affected[0].date;
    const dateRange = startDate === today ? formatDateShort(today) : `${formatDateShort(startDate)} → ${formatDateShort(today)}`;
    const taskMeta = affected[0].tasks.find(t => t.title === taskTitle && t.status === "deployment");
    try {
      for (const entry of affected) {
        const updatedTasks = entry.tasks.map(t =>
          t.title === taskTitle && t.status === "deployment" ? { ...t, status: "done" as const, dateRange } : t,
        );
        const { error } = await supabase.from("entries").update({ tasks: updatedTasks }).eq("id", entry.id);
        if (!error) setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, tasks: updatedTasks } : e));
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
    const sourceEntry = entries.find((e) => e.id === item.entryId);
    if (!sourceEntry) { setActionLoading(null); return; }
    try {
      const updatedTasks = sourceEntry.tasks.map((t) =>
        t.title === item.task.title && t.status === "planned"
          ? { ...t, status: "progress" as const }
          : t,
      );
      const { error } = await supabase.from("entries").update({ tasks: updatedTasks }).eq("id", sourceEntry.id);
      if (!error) setEntries((prev) => prev.map((e) => e.id === sourceEntry.id ? { ...e, tasks: updatedTasks } : e));
    } finally {
      setActionLoading(null);
    }
  }

  async function reopenDoneTask(taskTitle: string) {
    setActionLoading(taskTitle);
    const affected = entries.filter((e) => e.tasks.some((t) => t.title === taskTitle && t.status === "done"));
    try {
      for (const entry of affected) {
        const updatedTasks = entry.tasks.map((t) =>
          t.title === taskTitle && t.status === "done" ? { ...t, status: "progress" as const, dateRange: undefined } : t,
        );
        const { error } = await supabase.from("entries").update({ tasks: updatedTasks }).eq("id", entry.id);
        if (!error) setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, tasks: updatedTasks } : e));
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function moveDoneToPlanned(taskTitle: string) {
    setActionLoading(taskTitle);
    const affected = entries.filter((e) => e.tasks.some((t) => t.title === taskTitle && t.status === "done"));
    try {
      for (const entry of affected) {
        const updatedTasks = entry.tasks.map((t) =>
          t.title === taskTitle && t.status === "done" ? { ...t, status: "planned" as const, dateRange: undefined } : t,
        );
        const { error } = await supabase.from("entries").update({ tasks: updatedTasks }).eq("id", entry.id);
        if (!error) setEntries((prev) => prev.map((e) => e.id === entry.id ? { ...e, tasks: updatedTasks } : e));
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
            ...(quickAdd.description.trim() ? { description: quickAdd.description.trim() } : {}),
            status: "planned",
            ...(quickAdd.type ? { type: quickAdd.type as Task["type"] } : {}),
            ...(quickAdd.priority ? { priority: quickAdd.priority as Task["priority"] } : {}),
            ...(quickAdd.complexity ? { complexity: quickAdd.complexity as Task["complexity"] } : {}),
            ...(quickAdd.tags.length > 0 ? { tags: quickAdd.tags } : {}),
            ...(compare.length > 0 ? { compare } : {}),
            ...(media.length > 0 ? { media } : {}),
            ...(quickAddFeatureId ? { featureId: quickAddFeatureId } : {}),
          },
        ],
      };
      const { error } = await supabase.from("entries").insert(newEntry);
      if (!error) {
        setEntries((prev) => [newEntry, ...prev]);
        setQuickAdd({ title: "", description: "", priority: "", complexity: "", type: "", tags: [] });
        setQuickAddMedia([]);
        setQuickAddCompare([]);
        setQuickAddFeatureId(null);
        setQuickAddOpen(false);
      }
    } finally {
      setQuickAddSaving(false);
    }
  }

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
            <button
              onClick={() => setAllTasksOpen(true)}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-700/40 bg-emerald-400/10 text-emerald-300 text-xs font-medium px-2.5 py-2 sm:px-4 sm:py-2.5 hover:bg-emerald-400/20 transition-colors animate-fade-in-up [animation-delay:15ms]"
              title="All completed tasks"
            >
              <CheckCircle2 size={14} />
              <span className="hidden sm:inline">All Tasks</span>
            </button>
            {(deploymentItems.length + deploymentIssues.length) > 0 && (
              <span className="flex items-center gap-1.5 text-xs text-amber-400/90 font-medium px-2.5 py-2 sm:px-3 sm:py-2.5 rounded-xl bg-amber-400/8 border border-amber-400/25 animate-fade-in-up [animation-delay:18ms]">
                <Rocket size={13} />
                <span className="hidden sm:inline">{deploymentItems.length + deploymentIssues.length} deploying</span>
                <span className="sm:hidden font-mono text-[11px]">{deploymentItems.length + deploymentIssues.length}</span>
              </span>
            )}
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
            <div className="flex items-center gap-2 mb-3 flex-wrap">
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
              {features.length > 0 && (
                <button
                  onClick={() => setFeatureProgressOpen(o => !o)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-bold tracking-[0.2em] uppercase transition-colors select-none ${featureProgressOpen ? "bg-slate-800 text-slate-300" : "text-slate-600 hover:text-slate-400"}`}
                >
                  {featureProgressOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  Features
                </button>
              )}
            </div>
          )}

          {/* Content — always visible in read-only; toggleable in wizard mode */}
          {(readOnly || statsOpen || heatmapOpen) && (
            <div className="flex flex-col xl:flex-row gap-4">
              {(readOnly || statsOpen) && (
                <div className="flex-1 min-w-0">
                  <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <StatCard label="Total Done"  value={stats.total}      accent="border-green-400/60"   accentBg="bg-green-400/8"    icon={CheckCircle2}      iconColor="text-green-400"   glowColor="rgba(74,222,128,0.45)"   delay={0}   />
                    <StatCard label="Features"    value={stats.features}   accent="border-emerald-400/60" accentBg="bg-emerald-400/8"  icon={ArrowUpNarrowWide} iconColor="text-emerald-400" glowColor="rgba(52,211,153,0.45)"   delay={40}  />
                    <StatCard label="Bug Fixes"   value={stats.bugs}       accent="border-orange-400/60"  accentBg="bg-orange-400/8"   icon={Bug}               iconColor="text-orange-400"  glowColor="rgba(251,146,60,0.45)"   delay={80}  />
                    <StatCard label="Optimized"   value={stats.optimized}  accent="border-cyan-400/60"    accentBg="bg-cyan-400/8"     icon={Zap}               iconColor="text-cyan-400"    glowColor="rgba(34,211,238,0.45)"   delay={120} />
                    <StatCard label="Tasks"       value={stats.tasks}      accent="border-teal-300/60"    accentBg="bg-teal-300/8"     icon={CheckCircle2}      iconColor="text-teal-300"    glowColor="rgba(94,234,212,0.45)"   delay={160} />
                    <StatCard label="Milestones"  value={stats.milestones} accent="border-amber-400/60"   accentBg="bg-amber-400/8"    icon={ArrowRight}        iconColor="text-amber-400"   glowColor="rgba(251,191,36,0.45)"   delay={200} />
                    <StatCard label="Refactored"  value={stats.refactors}  accent="border-fuchsia-400/60" accentBg="bg-fuchsia-400/8"  icon={RefreshCw}         iconColor="text-fuchsia-400" glowColor="rgba(232,121,249,0.45)"  delay={240} />
                    <StatCard label="Learnings"   value={stats.learnings}  accent="border-indigo-400/60"  accentBg="bg-indigo-400/8"   icon={BookOpen}          iconColor="text-indigo-400"  glowColor="rgba(129,140,248,0.45)"  delay={280} />
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

        {/* ── Feature Progress Panel ───────────────────────── */}
        {(featureProgressOpen || readOnly) && features.length > 0 && (
          <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={13} className="text-indigo-400" />
              <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400">New Feature Progress</span>
              <span className="text-[10px] text-slate-600">{features.length} feature{features.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex flex-col gap-3">
              {featureStats.map(({ feature, done, inProg, planned, total, pct }) => (
                <div key={feature.id} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: feature.color }} />
                      <span className="text-[11px] font-semibold text-slate-300 truncate">{feature.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-2 text-[9px] text-slate-500">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />{done} done</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />{inProg} in progress</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-slate-600" />{planned} planned</span>
                      </div>
                      <span className="text-[11px] font-bold w-8 text-right" style={{ color: feature.color }}>{pct}%</span>
                    </div>
                  </div>
                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500 flex">
                      {done > 0 && total > 0 && (
                        <div className="h-full bg-emerald-400 transition-all duration-500" style={{ width: `${(done / total) * 100}%` }} />
                      )}
                      {inProg > 0 && total > 0 && (
                        <div className="h-full bg-yellow-400/70 transition-all duration-500" style={{ width: `${(inProg / total) * 100}%` }} />
                      )}
                    </div>
                  </div>
                  {total === 0 && (
                    <span className="text-[9px] text-slate-600 italic">No tasks yet — add some from the Planning Phase</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Deployment Panel ──────────────────────────────── */}
        {(deploymentItems.length > 0 || deploymentIssues.length > 0) && (
          <div className="mb-6">
            <section className="rounded-2xl border border-amber-400/40 bg-slate-900/60 backdrop-blur-sm p-4" style={{ boxShadow: "0 0 32px rgba(251,191,36,0.10)" }}>
              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <Rocket size={13} className="text-amber-400 shrink-0" />
                <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-amber-400">For Deployment</span>
                <span className="text-[10px] text-amber-600">{deploymentItems.length + deploymentIssues.length} item{deploymentItems.length + deploymentIssues.length !== 1 ? "s" : ""}</span>
              </div>
              {/* Grid aligned with stats cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
                {deploymentItems.map((item) => {
                  const tm = TYPE_META[(item.task.type ?? "task") as keyof typeof TYPE_META] ?? TYPE_META.task;
                  const TIcon = tm.icon;
                  return (
                    <div key={`t-${item.task.title}`} className="flex flex-col gap-2 p-3 rounded-xl border border-amber-400/25 bg-amber-400/6 hover:border-amber-400/40 transition-colors">
                      {/* Badges */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[9px] text-amber-600/80 font-medium">{item.entryProject}</span>
                        <span className={`flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide ${tm.text} ${tm.bg}`}><TIcon size={8} />{tm.label}</span>
                        {item.task.priority && <span className={`text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide ${PRIORITY_META[item.task.priority].text} ${PRIORITY_META[item.task.priority].bg}`}>{PRIORITY_META[item.task.priority].label}</span>}
                        <span className="text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide text-sky-400 bg-sky-400/10">Task</span>
                      </div>
                      {/* Title */}
                      <p className="text-[12px] font-semibold text-amber-100 leading-snug flex-1">{item.task.title}</p>
                      {item.task.description && <p className="text-[10px] text-amber-700/60 truncate">{item.task.description}</p>}
                      {/* Actions */}
                      {!readOnly && (
                        <div className="flex gap-1.5 mt-auto pt-1">
                          <button onClick={() => markDeployed(item.task.title)} disabled={actionLoading === item.task.title}
                            className="flex-1 text-[10px] py-1.5 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-300 hover:bg-amber-400/30 transition-colors disabled:opacity-40 font-medium">
                            🚀 Deployed
                          </button>
                          <button onClick={() => revertDeploymentToProgress(item.task.title)} disabled={actionLoading === item.task.title}
                            className="text-[10px] px-2 py-1.5 rounded-lg border border-slate-700 text-slate-500 hover:text-yellow-400 hover:border-yellow-700/40 transition-colors disabled:opacity-40 whitespace-nowrap"
                            title="Move back to In Progress">
                            ↩ In Progress
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
                {deploymentIssues.map((issue) => {
                  const tm = ISSUE_TYPE_META[issue.type] ?? ISSUE_TYPE_META.other;
                  return (
                    <div key={`i-${issue.id}`} className="flex flex-col gap-2 p-3 rounded-xl border border-amber-400/25 bg-amber-400/6 hover:border-amber-400/40 transition-colors">
                      {/* Badges */}
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[9px] text-amber-600/80 font-medium">{issue.project}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide ${tm.text} ${tm.bg}`}>{tm.label}</span>
                        {PRIORITY_META[issue.priority] && <span className={`text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide ${PRIORITY_META[issue.priority].text} ${PRIORITY_META[issue.priority].bg}`}>{PRIORITY_META[issue.priority].label}</span>}
                        <span className="text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide text-violet-400 bg-violet-400/10">Issue</span>
                      </div>
                      {/* Title */}
                      <p className="text-[12px] font-semibold text-amber-100 leading-snug flex-1">{issue.title}</p>
                      {issue.description && <p className="text-[10px] text-amber-700/60 truncate">{issue.description}</p>}
                      {/* Actions */}
                      {!readOnly && (
                        <div className="flex gap-1.5 mt-auto pt-1">
                          <button onClick={() => markIssueDeployed(issue)}
                            className="flex-1 text-[10px] py-1.5 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-300 hover:bg-amber-400/30 transition-colors font-medium">
                            🚀 Deployed
                          </button>
                          <button onClick={() => revertIssueDeploymentToProgress(issue)}
                            className="text-[10px] px-2 py-1.5 rounded-lg border border-slate-700 text-slate-500 hover:text-yellow-400 hover:border-yellow-700/40 transition-colors whitespace-nowrap"
                            title="Move back to In Progress">
                            ↩ In Progress
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ── In Progress + Issues panels ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* In Progress */}
          {(() => {
            const IP_PER_PAGE = 5;
            const sortedIPItems = [...inProgressItems].sort((a, b) => {
              const af = isFocused("ip-task", a.task.title) ? 0 : 1;
              const bf = isFocused("ip-task", b.task.title) ? 0 : 1;
              return af - bf;
            });
            const ipTotalPages = Math.ceil(sortedIPItems.length / IP_PER_PAGE);
            const pagedIP = sortedIPItems.slice(
              (inProgressPage - 1) * IP_PER_PAGE,
              inProgressPage * IP_PER_PAGE,
            );
            const inProgressIssues = [...issues.filter(i => i.status === "in_progress")].sort((a, b) => {
              const af = isFocused("issue", a.id) ? 0 : 1;
              const bf = isFocused("issue", b.id) ? 0 : 1;
              return af - bf;
            });
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
                            const focusedIssue = isFocused("issue", issue.id);
                            return (
                              <div key={issue.id} className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${focusedIssue ? "border-cyan-500/40 bg-cyan-500/8" : "border-transparent hover:border-slate-800 hover:bg-slate-800/25"}`}>
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${focusedIssue ? "bg-cyan-400" : "bg-red-400/70"}`} />
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
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => toggleFocus("issue", issue.id)}
                                    className={`p-1 rounded transition-colors ${focusedIssue ? "text-cyan-400 bg-cyan-500/15" : "text-slate-600 hover:text-cyan-400/70"}`}
                                    title={focusedIssue ? "Remove focus" : "Focus this issue"}
                                  >
                                    <Crosshair size={11} />
                                  </button>
                                  {!readOnly && (
                                    <>
                                      <div className="relative">
                                        <div className="flex">
                                          <button onClick={() => toggleIssueStatus(issue)}
                                            className="text-[10px] px-2.5 py-1.5 rounded-l-lg bg-emerald-500/10 border border-emerald-500/25 border-r-0 text-emerald-400 hover:bg-emerald-500/20 transition-colors whitespace-nowrap">
                                            ✓ Resolve
                                          </button>
                                          <button onClick={() => setResolveMenuIssue(resolveMenuIssue === issue.id ? null : issue.id)}
                                            className="text-[10px] px-1.5 py-1.5 rounded-r-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                                            <ChevronDown size={10} />
                                          </button>
                                        </div>
                                        {resolveMenuIssue === issue.id && (
                                          <div className="absolute right-0 top-full mt-1 z-20 flex flex-col min-w-[160px] rounded-xl border border-amber-500/30 bg-slate-950/98 shadow-xl overflow-hidden">
                                            <button onClick={() => { toggleIssueStatus(issue); setResolveMenuIssue(null); }}
                                              className="flex items-center gap-2 px-3 py-2.5 text-[11px] text-emerald-400 hover:bg-emerald-400/10 transition-colors">
                                              <CheckCircle2 size={12} /> Mark Resolved
                                            </button>
                                            <button onClick={() => { markIssueForDeployment(issue); setResolveMenuIssue(null); }}
                                              className="flex items-center gap-2 px-3 py-2.5 text-[11px] text-amber-400 hover:bg-amber-400/10 transition-colors border-t border-slate-800">
                                              <Rocket size={12} /> For Deployment
                                            </button>
                                            <button onClick={() => openIssueDateOverrideModal(issue)}
                                              className="flex items-center gap-2 px-3 py-2.5 text-[11px] text-sky-400 hover:bg-sky-400/10 transition-colors border-t border-slate-800">
                                              <Calendar size={12} /> Edit Dates &amp; Mark Resolved
                                            </button>
                                          </div>
                                        )}
                                      </div>
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
                                    </>
                                  )}
                                </div>
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
                        const focusedIPTask = isFocused("ip-task", item.task.title);
                        return (
                          <div key={i} className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${focusedIPTask ? "border-cyan-500/40 bg-cyan-500/8" : "border-transparent hover:border-slate-800 hover:bg-slate-800/25"}`}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${focusedIPTask ? "bg-cyan-400" : "bg-yellow-400/80"}`} />
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
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => toggleFocus("ip-task", item.task.title)}
                                className={`p-1 rounded transition-colors ${focusedIPTask ? "text-cyan-400 bg-cyan-500/15" : "text-slate-600 hover:text-cyan-400/70"}`}
                                title={focusedIPTask ? "Remove focus" : "Focus this task"}
                              >
                                <Crosshair size={11} />
                              </button>
                              {!readOnly && (
                                <>
                                  {/* Done split-button */}
                                  <div className="relative">
                                    <div className="flex">
                                      <button
                                        onClick={() => markTaskDone(item.task.title)}
                                        disabled={actionLoading === item.task.title}
                                        className="text-[10px] px-2.5 py-1.5 rounded-l-lg bg-emerald-500/10 border border-emerald-500/25 border-r-0 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-40 whitespace-nowrap"
                                      >
                                        ✓ Done
                                      </button>
                                      <button
                                        onClick={() => setDoneMenuTask(doneMenuTask === item.task.title ? null : item.task.title)}
                                        disabled={actionLoading === item.task.title}
                                        className="text-[10px] px-1.5 py-1.5 rounded-r-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-40"
                                      >
                                        <ChevronDown size={10} />
                                      </button>
                                    </div>
                                    {doneMenuTask === item.task.title && (
                                      <div className="absolute right-0 top-full mt-1 z-20 flex flex-col min-w-[160px] rounded-xl border border-amber-500/30 bg-slate-950/98 shadow-xl shadow-black/50 overflow-hidden">
                                        <button
                                          onClick={() => { markTaskDone(item.task.title); setDoneMenuTask(null); }}
                                          className="flex items-center gap-2 px-3 py-2.5 text-[11px] text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                                        >
                                          <CheckCircle2 size={12} /> Mark as Done
                                        </button>
                                        <button
                                          onClick={() => { markForDeployment(item.task.title); setDoneMenuTask(null); }}
                                          className="flex items-center gap-2 px-3 py-2.5 text-[11px] text-amber-400 hover:bg-amber-400/10 transition-colors border-t border-slate-800"
                                        >
                                          <Rocket size={12} /> For Deployment
                                        </button>
                                        <button
                                          onClick={() => openDateOverrideModal(item.task.title)}
                                          className="flex items-center gap-2 px-3 py-2.5 text-[11px] text-sky-400 hover:bg-sky-400/10 transition-colors border-t border-slate-800"
                                        >
                                          <Calendar size={12} /> Edit Dates &amp; Mark Done
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => markTaskPlanned(item.task.title)}
                                    disabled={actionLoading === item.task.title}
                                    className="text-[10px] px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors disabled:opacity-40 whitespace-nowrap"
                                  >
                                    → Plan
                                  </button>
                                </>
                              )}
                            </div>
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
                const af = isFocused("issue", a.id) ? 0 : 1;
                const bf = isFocused("issue", b.id) ? 0 : 1;
                if (af !== bf) return af - bf;
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
                    {([["all","All"],["open","Open"],["in_progress","In Progress"],["deployment","Deploy"],["resolved","Resolved"]] as const).map(([s, label]) => (
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
                        <option value="milestone">Milestone</option>
                        <option value="learning">Learning</option>
                        <option value="refactor">Refactor</option>
                        <option value="other">Other</option>
                      </select>
                      <select value={issueForm.priority ?? "major"} onChange={e => setIssueForm(f => ({ ...f, priority: e.target.value as RaisedIssue["priority"] }))} className="rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-xs px-2 py-1.5 outline-none">
                        <option value="urgent">Urgent</option>
                        <option value="major">Major</option>
                        <option value="minor">Minor</option>
                      </select>
                      <input type="date" value={issueForm.date_raised ?? new Date().toISOString().slice(0,10)} onChange={e => setIssueForm(f => ({ ...f, date_raised: e.target.value }))} className="rounded-lg border border-slate-700 bg-slate-900 text-slate-300 text-xs px-2 py-1.5 outline-none" />
                    </div>
                    {/* Images */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Images</span>
                        <label className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-400 transition-colors cursor-pointer">
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setIssueFormMedia((d) => [...d, { file: f, preview: URL.createObjectURL(f), caption: "" }]); }} />
                          <Plus size={10} /> Add image
                        </label>
                      </div>
                      {issueFormMedia.length > 0 && (
                        <div className={`grid gap-1.5 ${issueFormMedia.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                          {issueFormMedia.map((m, mi) => (
                            <div key={mi} className="relative group rounded-lg overflow-hidden border border-slate-800">
                              <img src={m.preview} alt="" className="w-full h-20 object-cover" />
                              <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 px-1.5 py-0.5 flex items-center gap-1">
                                <input value={m.caption} onChange={(e) => setIssueFormMedia((d) => d.map((x, j) => j === mi ? { ...x, caption: e.target.value } : x))} placeholder="Caption…" className="flex-1 bg-transparent text-[11px] text-slate-300 outline-none placeholder:text-slate-600" />
                                <button onClick={() => setIssueFormMedia((d) => d.filter((_, j) => j !== mi))} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={10} /></button>
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
                        <button onClick={() => setIssueFormCompare((d) => [...d, { label: "", before: { file: null, preview: "", note: "" }, after: { file: null, preview: "", note: "" } }])} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-400 transition-colors">
                          <Plus size={10} /> Add comparison
                        </button>
                      </div>
                      {issueFormCompare.map((c, ci) => (
                        <div key={ci} className="rounded-xl border border-slate-800 bg-slate-950/40 p-2.5 flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <input value={c.label} onChange={(e) => setIssueFormCompare((d) => d.map((x, j) => j === ci ? { ...x, label: e.target.value } : x))} placeholder="Label (optional)" className="flex-1 rounded bg-transparent border-b border-slate-800 text-[11px] text-slate-300 outline-none py-0.5 placeholder:text-slate-700" />
                            <button onClick={() => setIssueFormCompare((d) => d.filter((_, j) => j !== ci))} className="text-slate-600 hover:text-red-400 transition-colors"><Trash2 size={11} /></button>
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
                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setIssueFormCompare((d) => d.map((x, j) => j === ci ? { ...x, [side]: { ...x[side], file: f, preview: URL.createObjectURL(f) } } : x)); }} />
                                        <ImageIcon size={13} className="text-slate-300" />
                                      </label>
                                    </div>
                                  ) : (
                                    <label className="flex flex-col items-center justify-center h-16 rounded-lg border border-dashed border-slate-700 text-slate-600 hover:border-red-700/50 hover:text-red-400 transition-colors cursor-pointer">
                                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (!f) return; setIssueFormCompare((d) => d.map((x, j) => j === ci ? { ...x, [side]: { ...x[side], file: f, preview: URL.createObjectURL(f) } } : x)); }} />
                                      <ImageIcon size={13} /><span className="text-[10px] mt-0.5">Upload</span>
                                    </label>
                                  )}
                                  <input value={slot.note} onChange={(e) => setIssueFormCompare((d) => d.map((x, j) => j === ci ? { ...x, [side]: { ...x[side], note: e.target.value } } : x))} placeholder="Note…" className="text-[11px] text-slate-400 bg-transparent border-b border-slate-800/60 outline-none py-0.5 placeholder:text-slate-700" />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveIssue} disabled={!issueForm.title?.trim() || !issueForm.project || issueFormSaving} className="flex-1 rounded-lg border border-red-700/40 bg-red-400/10 text-red-300 text-xs font-semibold py-2 hover:bg-red-400/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        {issueFormSaving ? "Saving…" : editingIssue ? "Save Changes" : "Raise Issue"}
                      </button>
                      <button onClick={() => { setIssueFormOpen(false); setEditingIssue(null); setIssueForm({}); setIssueFormMedia([]); setIssueFormCompare([]); }} className="px-3 rounded-lg border border-slate-700 text-slate-400 text-xs hover:bg-slate-800 transition-colors">Cancel</button>
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
                          onEdit={iss => { setEditingIssue(iss); setIssueForm(iss); setIssueFormMedia((iss.media ?? []).map(m => ({ file: null, preview: m.src, caption: m.caption ?? "" }))); setIssueFormCompare((iss.compare ?? []).map(c => ({ label: c.label ?? "", before: { file: null, preview: c.before.src, note: c.before.note }, after: { file: null, preview: c.after.src, note: c.after.note } }))); setIssueFormOpen(true); }}
                          onDelete={deleteIssue}
                          onStart={startIssue}
                          onToggle={toggleIssueStatus}
                          onDeploy={markIssueForDeployment}
                          focused={isFocused("issue", issue.id)}
                          onFocus={() => toggleFocus("issue", issue.id)}
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
            const sortedPlannedItems = [...filteredPlannedItems].sort((a, b) => {
              const af = isFocused("planned", a.task.title) ? 0 : 1;
              const bf = isFocused("planned", b.task.title) ? 0 : 1;
              return af - bf;
            });
            const blTotalPages = Math.ceil(sortedPlannedItems.length / BL_PER_PAGE);
            const pagedBL = sortedPlannedItems.slice(
              (backlogPage - 1) * BL_PER_PAGE,
              backlogPage * BL_PER_PAGE,
            );
            const hasBacklogFilters = backlogPriorityFilter !== "all" || backlogComplexityFilter !== "all" || backlogTypeFilter !== "all" || backlogTagFilter !== "all";
            const activeFeature = featureTabFilter !== "all" && featureTabFilter !== "general"
              ? features.find(f => f.id === featureTabFilter) ?? null
              : null;
            return (
              <section
                className={`flex flex-col gap-3 p-4 rounded-2xl border transition-all duration-300${!activeFeature ? " border-blue-400/20 bg-blue-400/5" : ""}`}
                style={activeFeature ? {
                  borderColor: activeFeature.color + "40",
                  backgroundColor: activeFeature.color + "0d",
                } : undefined}
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0 transition-colors duration-300"
                      style={{ backgroundColor: activeFeature ? activeFeature.color : "#60a5fa" }}
                    />
                    <span
                      className="text-[11px] font-bold tracking-[0.2em] uppercase transition-colors duration-300"
                      style={{ color: activeFeature ? activeFeature.color : "#60a5fa" }}
                    >
                      {activeFeature ? activeFeature.name : "Planning Phase"}
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
                          const activeFeature = featureTabFilter !== "all" && featureTabFilter !== "general"
                            ? features.find(f => f.id === featureTabFilter) ?? null
                            : null;
                          const featureTag = activeFeature
                            ? activeFeature.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
                            : "";
                          setQuickAdd({
                            title: "",
                            description: "",
                            type: activeFeature ? "feature" : "",
                            priority: activeFeature ? "minor" : "",
                            complexity: activeFeature ? "hard" : "",
                            tags: featureTag ? [featureTag] : [],
                          });
                          setQuickAddMedia([]);
                          setQuickAddCompare([]);
                          setQuickAddFeatureId(activeFeature ? activeFeature.id : null);
                          setQuickAddOpen(true);
                        }}
                        className="text-[11px] text-blue-400/70 hover:text-blue-400 transition-colors flex items-center gap-1"
                      >
                        + Add task
                      </button>
                    )}
                  </div>
                </div>

                {/* Feature tabs */}
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { id: "all", label: "All", color: null, deletable: false },
                    { id: "general", label: "General", color: null, deletable: false },
                    ...features.map(f => ({ id: f.id, label: f.name, color: f.color, deletable: true })),
                  ].map(tab => (
                    <div key={tab.id} className="group relative flex items-center">
                      <button
                        onClick={() => { setFeatureTabFilterPersist(tab.id); setBacklogPage(1); }}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors border ${
                          featureTabFilter === tab.id
                            ? "bg-blue-400/15 border-blue-400/40 text-blue-300"
                            : "border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"
                        } ${tab.deletable ? "pr-5" : ""}`}
                      >
                        {tab.color && (
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tab.color }} />
                        )}
                        {tab.label}
                        <span className="text-[9px] opacity-60">
                          {tab.id === "all"
                            ? plannedItems.length
                            : tab.id === "general"
                            ? plannedItems.filter(i => !i.task.featureId).length
                            : plannedItems.filter(i => i.task.featureId === tab.id).length}
                        </span>
                      </button>
                      {!readOnly && tab.deletable && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteFeatureId(tab.id); }}
                            className="absolute right-1 opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-red-400"
                            title="Delete feature"
                          >
                            <X size={9} />
                          </button>
                      )}
                    </div>
                  ))}
                  {!readOnly && (
                    <button
                      onClick={() => setCreateFeatureOpen(true)}
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] text-slate-600 hover:text-blue-400 hover:border-blue-400/30 border border-transparent transition-colors"
                    >
                      <Plus size={9} /> New feature
                    </button>
                  )}
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
                        const isFocusedPlanned = isFocused("planned", item.task.title);
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
                            className={`flex items-center gap-2.5 py-2.5 px-2 rounded-xl border transition-all ${
                              isFocusedPlanned
                                ? "border-cyan-500/35 bg-cyan-500/6 shadow-[0_0_0_1px_rgb(6_182_212_/_0.15)]"
                                : !readOnly && dragOverIdx === realIdx && dragIdx !== realIdx
                                ? "border-blue-400/50 bg-blue-400/8"
                                : "border-transparent hover:bg-slate-800/20"
                            } border-b border-b-slate-800/40 last:border-b-0`}
                          >
                            {!readOnly && (
                              <span className={`shrink-0 select-none text-sm leading-none ${readOnly ? "text-slate-800 cursor-default" : "text-slate-700 hover:text-slate-500 cursor-grab active:cursor-grabbing"}`}>⠿</span>
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
                                {/* Description */}
                                <textarea
                                  value={backlogEditForm.description}
                                  onChange={(e) => setBacklogEditForm((f) => ({ ...f, description: e.target.value }))}
                                  placeholder="Description (optional)"
                                  rows={2}
                                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-blue-700/60 resize-none placeholder:text-slate-600"
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
                                {/* Feature (Epic) */}
                                {features.length > 0 && (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 shrink-0">Feature</span>
                                    <button type="button" onClick={() => setBacklogEditFeatureId(null)}
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors border ${!backlogEditFeatureId ? "bg-slate-700/60 border-slate-600 text-slate-300" : "border-slate-800 text-slate-500 hover:border-slate-700"}`}>
                                      General
                                    </button>
                                    {features.map(f => (
                                      <button key={f.id} type="button" onClick={() => setBacklogEditFeatureId(f.id)}
                                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-colors border ${backlogEditFeatureId === f.id ? "text-white" : "border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"}`}
                                        style={backlogEditFeatureId === f.id ? { borderColor: f.color, backgroundColor: f.color + "22", color: f.color } : undefined}>
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                                        {f.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
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
                                  <button onClick={() => { setEditingBacklogTask(null); setBacklogEditMedia([]); setBacklogEditCompare([]); setBacklogEditFeatureId(null); }} className="text-[11px] px-2.5 py-1 rounded-lg border border-slate-700 text-slate-400 hover:bg-slate-800 transition-colors">
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              /* ── Normal display ── */
                              <>
                                <div className="flex-1 min-w-0">
                                  <span className="text-[9px] text-slate-600 font-medium tracking-wide">{item.entryProject}</span>
                                  <p className={`text-sm leading-snug ${isFocusedPlanned ? "text-slate-100 font-semibold" : "text-slate-300"}`}>{item.task.title}</p>
                                  {item.task.description && (
                                    <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{item.task.description}</p>
                                  )}
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
                                <div className="flex items-center gap-1 shrink-0">
                                  <button
                                    onClick={() => toggleFocus("planned", item.task.title)}
                                    className={`p-1 rounded transition-colors ${isFocusedPlanned ? "text-cyan-400 bg-cyan-500/15" : "text-slate-600 hover:text-cyan-400/70"}`}
                                    title={isFocusedPlanned ? "Remove focus" : "Focus this task"}
                                  >
                                    <Crosshair size={11} />
                                  </button>
                                  {!readOnly && (
                                    <>
                                      <button
                                        onClick={() => {
                                          setEditingBacklogTask(item);
                                          setBacklogEditForm({ title: item.task.title, description: item.task.description ?? "", priority: item.task.priority ?? "", complexity: item.task.complexity ?? "", type: item.task.type ?? "", project: item.entryProject });
                                          setBacklogEditMedia((item.task.media ?? []).map(m => ({ file: null, preview: m.src, caption: m.caption ?? "" })));
                                          setBacklogEditCompare((item.task.compare ?? []).map(c => ({ label: c.label ?? "", before: { file: null, preview: c.before.src, note: c.before.note }, after: { file: null, preview: c.after.src, note: c.after.note } })));
                                          setBacklogEditFeatureId(item.task.featureId ?? null);
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
                                    </>
                                  )}
                                </div>
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

        {/* ── Completed Panel ────────────────────────────────── */}
        {(() => {
          const CP_PER_PAGE = 7;

          // Date cutoff for the active range
          const today = new Date().toISOString().slice(0, 10);
          const weekAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 6); return d.toISOString().slice(0, 10); })();
          const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
          const cutoff = completedDateRange === "week" ? weekAgo
            : completedDateRange === "month" ? monthStart
            : completedDateRange === "custom" ? (completedDateFrom || "") : "";
          const ceiling = completedDateRange === "custom" ? (completedDateTo || today) : today;
          const RANGE_LABELS: Record<typeof completedDateRange, string> = { week: "This Week", month: "This Month", all: "All Time", custom: "Custom" };
          const dateLabel = completedDateRange === "week"
            ? `${formatDate(weekAgo)} – ${formatDate(today)}`
            : completedDateRange === "month"
            ? `${new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}`
            : completedDateRange === "custom" && (completedDateFrom || completedDateTo)
            ? `${completedDateFrom || "…"} – ${completedDateTo || today}`
            : "All Time";

          // Date filter
          let dateTasks = cutoff
            ? completedItems.filter(i => i.entryDate >= cutoff && i.entryDate <= ceiling)
            : completedItems;
          let dateIssues = cutoff
            ? resolvedIssues.filter(i => { const d = i.date_resolved ?? i.date_raised; return d >= cutoff && d <= ceiling; })
            : resolvedIssues;

          // Type filter (tasks vs issues)
          if (completedTypeFilter === "tasks") dateIssues = [];
          if (completedTypeFilter === "issues") dateTasks = [];

          // Feature filter — only applies to tasks; hide issues when a specific feature is selected
          const featureTasks = completedFeatureFilter === "all"
            ? dateTasks
            : completedFeatureFilter === "general"
            ? dateTasks.filter(i => !i.featureId)
            : dateTasks.filter(i => i.featureId === completedFeatureFilter);

          const visibleIssues = completedFeatureFilter === "all" ? dateIssues : [];

          const combined: CPRow[] = [
            ...featureTasks.map(i => ({ kind: "task" as const, item: i })),
            ...visibleIssues.map(i => ({ kind: "issue" as const, item: i })),
          ].sort((a, b) => {
            const da = a.kind === "task" ? a.item.entryDate : (a.item.date_resolved ?? a.item.date_raised);
            const db = b.kind === "task" ? b.item.entryDate : (b.item.date_resolved ?? b.item.date_raised);
            return db.localeCompare(da);
          });

          const totalPages = Math.ceil(combined.length / CP_PER_PAGE);
          const paged = combined.slice((completedPage - 1) * CP_PER_PAGE, completedPage * CP_PER_PAGE);

          return (
            <div className="mb-8">
              <section className="flex flex-col gap-3 p-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/5">
                {/* Header row */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    <span className="text-[11px] font-bold tracking-[0.2em] uppercase text-emerald-400">Completed</span>
                    <span className="text-[11px] text-slate-600">{combined.length}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Range tabs */}
                    <div className="flex rounded-lg border border-slate-800 overflow-hidden text-[10px]">
                      {(["week", "month", "all", "custom"] as const).map((r) => (
                        <button key={r} onClick={() => { setCompletedDateRange(r); setCompletedPage(1); }}
                          className={`px-2.5 py-1 font-medium transition-colors ${completedDateRange === r ? "bg-emerald-400/15 text-emerald-300" : "text-slate-500 hover:text-slate-300"}`}>
                          {RANGE_LABELS[r]}
                        </button>
                      ))}
                    </div>
                    {/* Custom date inputs */}
                    {completedDateRange === "custom" && (
                      <div className="flex items-center gap-1.5">
                        <input type="date" value={completedDateFrom} onChange={e => { setCompletedDateFrom(e.target.value); setCompletedPage(1); }}
                          className="text-[10px] px-2 py-1 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 outline-none" />
                        <span className="text-slate-600 text-[10px]">→</span>
                        <input type="date" value={completedDateTo} onChange={e => { setCompletedDateTo(e.target.value); setCompletedPage(1); }}
                          className="text-[10px] px-2 py-1 rounded-lg border border-slate-700 bg-slate-900 text-slate-300 outline-none" />
                      </div>
                    )}
                    {/* Generate report button */}
                    {!readOnly && (
                      <button
                        onClick={() => {
                          const ipRows: CPRow[] = [
                            ...inProgressItems.map(ip => ({
                              kind: "task" as const,
                              item: { ...ip.task, entryId: ip.entryId, entryProject: ip.entryProject, entryDate: ip.entryDate } as CompletedTaskItem,
                            })),
                            ...issues.filter(i => i.status === "in_progress").map(i => ({ kind: "issue" as const, item: i })),
                          ];
                          setReportItems([...ipRows, ...combined]);
                          setReportDateLabel(dateLabel);
                          setReportTitleOverride("");
                          setReportModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border border-emerald-700/40 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20 transition-colors font-medium whitespace-nowrap"
                      >
                        <BarChart2 size={11} /> Generate Report
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter chips row */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Type filter */}
                  {(["all", "tasks", "issues"] as const).map(f => (
                    <button key={f} onClick={() => { setCompletedTypeFilter(f); setCompletedPage(1); }}
                      className={`text-[10px] px-2.5 py-1 rounded-full border font-medium transition-colors ${completedTypeFilter === f ? "bg-emerald-400/15 border-emerald-400/40 text-emerald-300" : "border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"}`}>
                      {f === "all" ? "All" : f === "tasks" ? "Tasks" : "Raised Issues"}
                    </button>
                  ))}
                  {/* Feature filter — only when showing tasks */}
                  {completedTypeFilter !== "issues" && features.length > 0 && (
                    <>
                      <span className="text-slate-700 text-[10px] px-1">|</span>
                      <button onClick={() => { setCompletedFeatureFilter("all"); setCompletedPage(1); }}
                        className={`text-[10px] px-2.5 py-1 rounded-full border font-medium transition-colors ${completedFeatureFilter === "all" ? "bg-blue-400/15 border-blue-400/40 text-blue-300" : "border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"}`}>
                        All Features
                      </button>
                      <button onClick={() => { setCompletedFeatureFilter("general"); setCompletedPage(1); }}
                        className={`text-[10px] px-2.5 py-1 rounded-full border font-medium transition-colors ${completedFeatureFilter === "general" ? "bg-blue-400/15 border-blue-400/40 text-blue-300" : "border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"}`}>
                        General
                      </button>
                      {features.map(f => (
                        <button key={f.id} onClick={() => { setCompletedFeatureFilter(f.id); setCompletedPage(1); }}
                          className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full border font-medium transition-colors ${completedFeatureFilter === f.id ? "border-opacity-60 text-white" : "border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"}`}
                          style={completedFeatureFilter === f.id ? { borderColor: f.color, backgroundColor: f.color + "22", color: f.color } : undefined}>
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                          {f.name}
                        </button>
                      ))}
                    </>
                  )}
                </div>

                {combined.length === 0 ? (
                  <p className="text-xs text-slate-600 py-2">Nothing completed {completedDateRange === "week" ? "this week" : completedDateRange === "month" ? "this month" : "yet"} matching these filters.</p>
                ) : (
                  <>
                    <div className="flex flex-col gap-0.5">
                      {paged.map((row, i) => {
                        if (row.kind === "task") {
                          const item = row.item;
                          const typeKey = (item.type ?? "task") as keyof typeof TYPE_META;
                          const tm = TYPE_META[typeKey] ?? TYPE_META.task;
                          const TIcon = tm.icon;
                          const feat = features.find(f => f.id === item.featureId);
                          const isEditing = editingDoneTask?.title === item.title && editingDoneTask?.entryId === item.entryId;
                          if (isEditing) {
                            return (
                              <div key={`t-${i}`} className="flex flex-col gap-2 px-3 py-3 rounded-xl border border-emerald-800/40 bg-emerald-400/5">
                                <input autoFocus value={doneEditForm.title} onChange={e => setDoneEditForm(f => ({ ...f, title: e.target.value }))}
                                  onKeyDown={e => { if (e.key === "Enter") saveDoneTaskEdit(); if (e.key === "Escape") setEditingDoneTask(null); }}
                                  className="w-full bg-transparent text-[13px] text-slate-100 outline-none border-b border-slate-700 py-0.5 placeholder:text-slate-600"
                                  placeholder="Task title…" />
                                <input value={doneEditForm.description} onChange={e => setDoneEditForm(f => ({ ...f, description: e.target.value }))}
                                  className="w-full bg-transparent text-[11px] text-slate-400 outline-none border-b border-slate-800 py-0.5 placeholder:text-slate-700"
                                  placeholder="Description…" />
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9px] uppercase tracking-widest text-slate-600 font-bold">Project</span>
                                  {(["VC+", "VC+ CMS"] as const).map(p => (
                                    <button key={p} onClick={() => setDoneEditForm(f => ({ ...f, project: p }))}
                                      className={`text-[9px] px-2.5 py-px rounded-full border font-bold tracking-wide transition-colors ${doneEditForm.project === p ? "border-indigo-500/60 bg-indigo-500/15 text-indigo-300" : "border-slate-700 text-slate-600 hover:text-slate-300 hover:border-slate-600"}`}>
                                      {p}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {(["feature","bugfix","task","milestone","learning","optimized","refactor"] as Task["type"][]).map(t => (
                                    <button key={t} onClick={() => setDoneEditForm(f => ({ ...f, type: f.type === t ? "" : t! }))}
                                      className={`text-[9px] px-2 py-px rounded uppercase font-bold tracking-wide transition-colors ${doneEditForm.type === t ? (TYPE_META[t as keyof typeof TYPE_META]?.text ?? "text-slate-300") + " " + (TYPE_META[t as keyof typeof TYPE_META]?.bg ?? "bg-slate-700") : "text-slate-600 bg-slate-800/60 hover:text-slate-400"}`}>
                                      {t}
                                    </button>
                                  ))}
                                  <span className="text-slate-700 text-[10px]">|</span>
                                  {(["urgent","major","minor"] as Task["priority"][]).map(p => (
                                    <button key={p} onClick={() => setDoneEditForm(f => ({ ...f, priority: f.priority === p ? "" : p! }))}
                                      className={`text-[9px] px-2 py-px rounded uppercase font-bold tracking-wide transition-colors ${doneEditForm.priority === p ? (PRIORITY_META[p]?.text ?? "text-slate-300") + " " + (PRIORITY_META[p]?.bg ?? "bg-slate-700") : "text-slate-600 bg-slate-800/60 hover:text-slate-400"}`}>
                                      {p}
                                    </button>
                                  ))}
                                  <span className="text-slate-700 text-[10px]">|</span>
                                  {(["simple","hard","complex"] as Task["complexity"][]).map(c => (
                                    <button key={c} onClick={() => setDoneEditForm(f => ({ ...f, complexity: f.complexity === c ? "" : c! }))}
                                      className={`text-[9px] px-2 py-px rounded uppercase font-bold tracking-wide transition-colors ${doneEditForm.complexity === c ? (COMPLEXITY_META[c]?.text ?? "text-slate-300") + " " + (COMPLEXITY_META[c]?.bg ?? "bg-slate-700") : "text-slate-600 bg-slate-800/60 hover:text-slate-400"}`}>
                                      {c}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex items-center gap-1.5 justify-end">
                                  <button onClick={() => setEditingDoneTask(null)} className="text-[10px] px-2.5 py-1 rounded-lg border border-slate-700 text-slate-500 hover:text-slate-300 transition-colors">Cancel</button>
                                  <button onClick={saveDoneTaskEdit} disabled={doneEditSaving} className="text-[10px] px-3 py-1 rounded-lg border border-emerald-700/50 bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25 transition-colors disabled:opacity-40">
                                    {doneEditSaving ? "Saving…" : "Save"}
                                  </button>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div key={`t-${i}`} className="group flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:border-slate-800 hover:bg-slate-800/25 transition-all">
                              <CheckCircle2 size={13} className="text-emerald-400/60 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                  <span className="text-[9px] text-slate-600 font-medium">{item.entryProject}</span>
                                  <span className={`flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide ${tm.text} ${tm.bg}`}>
                                    <TIcon size={8} />{tm.label}
                                  </span>
                                  {item.priority && (
                                    <span className={`text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide ${PRIORITY_META[item.priority].text} ${PRIORITY_META[item.priority].bg}`}>
                                      {PRIORITY_META[item.priority].label}
                                    </span>
                                  )}
                                  {item.complexity && (
                                    <span className={`text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide ${COMPLEXITY_META[item.complexity].text} ${COMPLEXITY_META[item.complexity].bg}`}>
                                      {COMPLEXITY_META[item.complexity].label}
                                    </span>
                                  )}
                                  {feat && (
                                    <span className="text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide" style={{ color: feat.color, backgroundColor: feat.color + "22" }}>
                                      {feat.name}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[13px] font-medium text-slate-400 leading-snug line-through decoration-slate-600">{item.title}</p>
                                <p className="text-[10px] text-slate-600 mt-0.5">{item.dateRange ?? formatDate(item.entryDate)}</p>
                              </div>
                              {!readOnly && (
                                <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => { setEditingDoneTask(item); setDoneEditForm({ title: item.title, description: item.description ?? "", type: item.type ?? "", priority: item.priority ?? "", complexity: item.complexity ?? "", project: item.entryProject }); }} disabled={actionLoading === item.title}
                                    className="text-[10px] px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors disabled:opacity-40 whitespace-nowrap">
                                    ✎ Edit
                                  </button>
                                  <button onClick={() => reopenDoneTask(item.title)} disabled={actionLoading === item.title}
                                    className="text-[10px] px-2.5 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 hover:bg-yellow-500/20 transition-colors disabled:opacity-40 whitespace-nowrap">
                                    ↩ Reopen
                                  </button>
                                  <button onClick={() => moveDoneToPlanned(item.title)} disabled={actionLoading === item.title}
                                    className="text-[10px] px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors disabled:opacity-40 whitespace-nowrap">
                                    → Plan
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        }

                        const issue = row.item;
                        const tm = ISSUE_TYPE_META[issue.type] ?? ISSUE_TYPE_META.other;
                        const pm = PRIORITY_META[issue.priority];
                        return (
                          <div key={`iss-${issue.id}`} className="group flex items-center gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:border-slate-800 hover:bg-slate-800/25 transition-all">
                            <CheckCircle2 size={13} className="text-violet-400/60 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                <span className="text-[9px] text-slate-600 font-medium">{issue.project}</span>
                                <span className={`text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide ${tm.text} ${tm.bg}`}>{tm.label}</span>
                                {pm && <span className={`text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide ${pm.text} ${pm.bg}`}>{pm.label}</span>}
                                <span className="text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide text-violet-400 bg-violet-400/10">Issue</span>
                              </div>
                              <p className="text-[13px] font-medium text-slate-400 leading-snug line-through decoration-slate-600">{issue.title}</p>
                              <p className="text-[10px] text-slate-600 mt-0.5">resolved {issue.date_resolved ?? issue.date_raised}</p>
                            </div>
                            {!readOnly && (
                              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setDetailIssue(issue)}
                                  className="text-[10px] px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors whitespace-nowrap">
                                  ✎ Edit
                                </button>
                                <button
                                  onClick={async () => {
                                    const patch: Partial<RaisedIssue> = { status: "in_progress", date_resolved: undefined };
                                    const { error } = await supabase.from("raised_issues").update(patch).eq("id", issue.id);
                                    if (!error) setIssues((prev) => prev.map((i) => i.id === issue.id ? { ...i, ...patch } : i));
                                  }}
                                  className="text-[10px] px-2.5 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 hover:bg-yellow-500/20 transition-colors whitespace-nowrap">
                                  ↩ Reopen
                                </button>
                                <button
                                  onClick={async () => {
                                    const patch: Partial<RaisedIssue> = { status: "open", date_resolved: undefined, date_started: undefined };
                                    const { error } = await supabase.from("raised_issues").update(patch).eq("id", issue.id);
                                    if (!error) setIssues((prev) => prev.map((i) => i.id === issue.id ? { ...i, ...patch } : i));
                                  }}
                                  className="text-[10px] px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition-colors whitespace-nowrap">
                                  → Open
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between pt-2 border-t border-emerald-400/10">
                        <button onClick={() => setCompletedPage((p) => Math.max(1, p - 1))} disabled={completedPage === 1}
                          className="text-[10px] px-2 py-1 text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors">
                          ← Prev
                        </button>
                        <span className="text-[10px] text-slate-600">{completedPage} / {totalPages}</span>
                        <button onClick={() => setCompletedPage((p) => Math.min(totalPages, p + 1))} disabled={completedPage === totalPages}
                          className="text-[10px] px-2 py-1 text-slate-500 hover:text-slate-300 disabled:opacity-30 transition-colors">
                          Next →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>
          );
        })()}

        {/* ── Reports Panel ──────────────────────────────────── */}
        {savedReports.length > 0 && (
          <div className="mb-6 rounded-2xl border border-sky-900/40 bg-slate-950/60 overflow-hidden animate-fade-in-up [animation-delay:180ms]">
            <div className="flex items-center gap-2 px-5 py-3 border-b border-sky-900/30">
              <BarChart2 size={13} className="text-sky-400" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-sky-400">Weekly Reports</span>
              <span className="ml-1 text-[10px] text-slate-600">{savedReports.length}</span>
            </div>
            <div className="flex flex-col divide-y divide-slate-900">
              {savedReports.map((r) => {
                const ts = new Date(r.created_at);
                const timeStr = ts.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " " + ts.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
                const taskCount = r.items_snapshot.filter(x => x.kind === "task").length;
                const issueCount = r.items_snapshot.filter(x => x.kind === "issue").length;
                return (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-900/40 transition-colors group">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200 truncate">{r.title}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">
                        {r.date_label} &nbsp;·&nbsp; Generated {timeStr}
                        {(taskCount + issueCount) > 0 && <span className="ml-1.5 text-slate-700">— {taskCount}t / {issueCount}i</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => generatePDFReport(r.items_snapshot, {}, r.date_label, features, r.title)}
                        className="flex items-center gap-1 text-[10px] px-2.5 py-1.5 rounded-lg border border-sky-700/40 bg-sky-400/10 text-sky-300 hover:bg-sky-400/20 transition-colors font-medium"
                      >
                        <BarChart2 size={10} /> Re-download
                      </button>
                      <button
                        onClick={async () => {
                          await supabase.from("weekly_reports").delete().eq("id", r.id);
                          setSavedReports(prev => prev.filter(x => x.id !== r.id));
                        }}
                        className="p-1.5 rounded-lg text-slate-700 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}


        <p className="mt-12 text-center text-[11px] text-slate-500">
          I can do all things though
          <span className="text-emerald-400"> Christ</span> who stengthens me.
        </p>
      </div>

      {/* ── Edit dates & mark done ── */}
      {dateOverrideModal && (
        <div
          onClick={() => setDateOverrideModal(null)}
          className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-sky-800/40 bg-slate-900 shadow-2xl p-5 flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase text-sky-400">
                <Calendar size={13} /> Edit Dates &amp; Mark {dateOverrideModal.kind === "issue" ? "Resolved" : "Done"}
              </span>
              <button onClick={() => setDateOverrideModal(null)} className="text-slate-500 hover:text-slate-300 transition-colors">
                <X size={16} />
              </button>
            </div>
            <p className="text-[12px] text-slate-400 leading-snug">{dateOverrideModal.label}</p>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Start Date</span>
                <input
                  type="date"
                  value={dateOverrideModal.startDate}
                  onChange={(e) => setDateOverrideModal((m) => m && { ...m, startDate: e.target.value })}
                  className="rounded-lg border border-slate-700 bg-slate-950 text-slate-200 text-xs px-2.5 py-1.5 outline-none [color-scheme:dark] focus:border-sky-700/60"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">End Date</span>
                <input
                  type="date"
                  value={dateOverrideModal.endDate}
                  onChange={(e) => setDateOverrideModal((m) => m && { ...m, endDate: e.target.value })}
                  className="rounded-lg border border-slate-700 bg-slate-950 text-slate-200 text-xs px-2.5 py-1.5 outline-none [color-scheme:dark] focus:border-sky-700/60"
                />
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={() => setDateOverrideModal(null)}
                className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-700 text-slate-500 hover:text-slate-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const { startDate, endDate } = dateOverrideModal;
                  if (dateOverrideModal.kind === "issue") {
                    resolveIssueWithDates(dateOverrideModal.issueId, { start: startDate, end: endDate });
                  } else {
                    markTaskDone(dateOverrideModal.taskTitle, { start: startDate, end: endDate });
                  }
                  setDateOverrideModal(null);
                }}
                disabled={!dateOverrideModal.startDate || !dateOverrideModal.endDate || dateOverrideModal.startDate > dateOverrideModal.endDate}
                className="text-[11px] px-3 py-1.5 rounded-lg border border-emerald-700/50 bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ✓ Mark {dateOverrideModal.kind === "issue" ? "Resolved" : "Done"}
              </button>
            </div>
          </div>
        </div>
      )}

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

              <textarea
                value={quickAdd.description}
                onChange={(e) => setQuickAdd((d) => ({ ...d, description: e.target.value }))}
                placeholder="Description (optional)"
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 outline-none focus:border-blue-700/60 resize-none placeholder:text-slate-600 transition-colors"
              />

              {/* Project */}
              <div className="flex items-center gap-2 flex-wrap">
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

              {/* Feature (Epic) */}
              {features.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 shrink-0">Feature</span>
                  <button
                    type="button"
                    onClick={() => setQuickAddFeatureId(null)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors border ${
                      !quickAddFeatureId ? "bg-slate-700/60 border-slate-600 text-slate-300" : "border-slate-800 text-slate-500 hover:border-slate-700"
                    }`}
                  >
                    General
                  </button>
                  {features.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setQuickAddFeatureId(f.id)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors border ${
                        quickAddFeatureId === f.id ? "border-opacity-60 text-white" : "border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                      }`}
                      style={quickAddFeatureId === f.id ? { borderColor: f.color, backgroundColor: f.color + "22", color: f.color } : undefined}
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: f.color }} />
                      {f.name}
                    </button>
                  ))}
                </div>
              )}

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

      {/* ── Delete Feature Confirm Modal ─────────────────── */}
      {confirmDeleteFeatureId && (() => {
        const target = features.find(f => f.id === confirmDeleteFeatureId);
        if (!target) return null;
        return (
          <>
            <div
              onClick={() => setConfirmDeleteFeatureId(null)}
              className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
            />
            <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex flex-col items-center gap-4 px-6 py-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                  <Trash2 size={20} className="text-red-400" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-base font-bold text-slate-100">Delete Feature?</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    Are you sure you want to delete{" "}
                    <span className="font-semibold" style={{ color: target.color }}>{target.name}</span>?
                    {" "}Tasks assigned to it won't be deleted, but they'll lose their feature link.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 px-6 pb-6">
                <button
                  onClick={() => setConfirmDeleteFeatureId(null)}
                  className="flex-1 rounded-xl border border-slate-700 text-slate-300 text-sm font-semibold py-2.5 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => { deleteFeature(confirmDeleteFeatureId); setConfirmDeleteFeatureId(null); }}
                  className="flex-1 rounded-xl bg-red-500/15 border border-red-500/40 text-red-400 text-sm font-semibold py-2.5 hover:bg-red-500/25 transition-colors"
                >
                  Delete Feature
                </button>
              </div>
            </div>
          </>
        );
      })()}

      {/* ── Create Feature Modal ─────────────────────────── */}
      {createFeatureOpen && (
        <>
          <div
            onClick={() => setCreateFeatureOpen(false)}
            className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
          />
          <div className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
              <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-indigo-400">New Feature Epic</span>
              <button onClick={() => setCreateFeatureOpen(false)} className="text-slate-600 hover:text-slate-300 transition-colors">
                <X size={15} />
              </button>
            </div>
            <div className="flex flex-col gap-4 px-5 py-4">
              {/* Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Feature Name</label>
                <input
                  autoFocus
                  value={createFeatureForm.name}
                  onChange={(e) => setCreateFeatureForm(f => ({ ...f, name: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") createFeature(); if (e.key === "Escape") setCreateFeatureOpen(false); }}
                  placeholder="e.g. Food Ordering"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500/60 placeholder:text-slate-600 transition-colors"
                />
              </div>
              {/* Color */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Color</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {FEATURE_PRESET_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCreateFeatureForm(f => ({ ...f, color: c }))}
                      className="w-6 h-6 rounded-full border-2 transition-all"
                      style={{
                        backgroundColor: c,
                        borderColor: createFeatureForm.color === c ? "#fff" : "transparent",
                        boxShadow: createFeatureForm.color === c ? `0 0 0 1px ${c}` : "none",
                      }}
                    />
                  ))}
                  {/* Custom color input */}
                  <label className="w-6 h-6 rounded-full border border-dashed border-slate-600 flex items-center justify-center text-slate-500 hover:border-slate-400 transition-colors cursor-pointer overflow-hidden">
                    <input
                      type="color"
                      value={createFeatureForm.color}
                      onChange={(e) => setCreateFeatureForm(f => ({ ...f, color: e.target.value }))}
                      className="opacity-0 absolute w-0 h-0"
                    />
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: createFeatureForm.color }} />
                  </label>
                </div>
              </div>
              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Description <span className="text-slate-700 normal-case tracking-normal font-normal">(optional)</span></label>
                <textarea
                  value={createFeatureForm.description}
                  onChange={(e) => setCreateFeatureForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="What is this feature about?"
                  rows={2}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2 text-sm text-slate-200 outline-none focus:border-indigo-500/60 placeholder:text-slate-600 resize-none transition-colors"
                />
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-800 flex gap-2">
              <button
                onClick={() => setCreateFeatureOpen(false)}
                className="flex-1 rounded-xl border border-slate-700 text-slate-400 text-sm font-semibold py-2 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createFeature}
                disabled={!createFeatureForm.name.trim() || createFeatureSaving}
                className="flex-2 rounded-xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-sm font-semibold py-2 px-4 hover:bg-indigo-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 justify-center"
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: createFeatureForm.color }} />
                {createFeatureSaving ? "Creating…" : "Create Feature"}
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
      <AllTasksPanel
        open={allTasksOpen}
        onClose={() => setAllTasksOpen(false)}
        completedItems={completedItems}
        resolvedIssues={resolvedIssues}
        features={features}
        readOnly={readOnly}
        onReopenTask={reopenDoneTask}
        onOpenIssue={setDetailIssue}
        onGenerateReport={(rows, label) => {
          setReportItems(rows);
          setReportDateLabel(label);
          setReportTitleOverride(`All Tasks Report — ${label}`);
          setAllTasksOpen(false);
          setReportModalOpen(true);
        }}
      />
      <CompletionToast toasts={toasts} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
      <WeeklyReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        items={reportItems}
        features={features}
        dateLabel={reportDateLabel}
        titleOverride={reportTitleOverride}
        onSaved={(r) => setSavedReports(prev => [r, ...prev])}
      />
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
        svg.lucide    { filter: drop-shadow(0 0 5px color-mix(in srgb, currentColor 45%, transparent)); }
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
  glowColor,
  icon: Icon,
  delay = 0,
}: {
  label: string;
  value: number;
  accent: string;
  accentBg?: string;
  iconColor: string;
  glowColor?: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  delay?: number;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-800 ${accentBg} backdrop-blur-sm px-4 py-3 sm:px-5 sm:py-4 border-l-4 ${accent} animate-fade-in-up select-none transition-all duration-200 hover:brightness-110`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-1">
        <span style={glowColor ? { filter: `drop-shadow(0 0 5px ${glowColor})` } : undefined}>
          <Icon size={14} className={iconColor} />
        </span>
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
                      {task.description && (
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {task.description}
                        </p>
                      )}
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
  bugfix:    { label: "Bug Fix",   text: "text-orange-400",  bg: "bg-orange-400/12" },
  feature:   { label: "Feature",   text: "text-emerald-400", bg: "bg-emerald-400/12" },
  optimized: { label: "Optimized", text: "text-cyan-400",    bg: "bg-cyan-400/10" },
  task:      { label: "Task",      text: "text-teal-300",    bg: "bg-teal-300/10" },
  milestone: { label: "Milestone", text: "text-amber-400",   bg: "bg-amber-400/10" },
  learning:  { label: "Learning",  text: "text-indigo-400",  bg: "bg-indigo-400/10" },
  refactor:  { label: "Refactor",  text: "text-fuchsia-400", bg: "bg-fuchsia-400/10" },
  other:     { label: "Other",     text: "text-slate-400",   bg: "bg-slate-800" },
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

function IssueRow({ issue, readOnly, onEdit, onDelete, onStart, onToggle, onDeploy, focused, onFocus }: {
  issue: RaisedIssue;
  readOnly: boolean;
  onEdit: (i: RaisedIssue) => void;
  onDelete: (i: RaisedIssue) => void;
  onStart: (i: RaisedIssue) => void;
  onToggle: (i: RaisedIssue) => void;
  onDeploy?: (i: RaisedIssue) => void;
  focused?: boolean;
  onFocus?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const typeMeta = ISSUE_TYPE_META[issue.type] ?? ISSUE_TYPE_META.other;
  const priorityMeta = PRIORITY_META[issue.priority];
  const resolved = issue.status === "resolved";
  const inProgress = issue.status === "in_progress";
  const forDeployment = issue.status === "deployment";
  return (
    <div className={`rounded-xl border px-4 py-3 flex flex-col gap-2 transition-colors ${focused ? "border-cyan-500/40 bg-cyan-500/8" : resolved ? "border-slate-800/40 bg-slate-950/20 opacity-60" : forDeployment ? "border-amber-400/30 bg-amber-400/5" : inProgress ? "border-yellow-400/20 bg-yellow-400/5" : "border-slate-800 bg-slate-900/60"}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-snug ${resolved ? "line-through text-slate-500" : "text-slate-100"}`}>{issue.title}</p>
          {issue.description && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{issue.description}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={onFocus} className={`p-1 rounded transition-colors ${focused ? "text-cyan-400 bg-cyan-500/15" : "text-slate-600 hover:text-cyan-400/70"}`} title={focused ? "Remove focus" : "Focus this issue"}>
            <Crosshair size={12} />
          </button>
          {!readOnly && (
            <>
              {issue.status === "open" && (
                <button onClick={() => onStart(issue)} className="text-[10px] px-2 py-1 rounded-lg border border-yellow-700/40 text-yellow-400 hover:bg-yellow-400/10 transition-colors">
                  ▶ Start
                </button>
              )}
              {inProgress && (
                <div className="relative">
                  <div className="flex">
                    <button onClick={() => onToggle(issue)} className="text-[10px] px-2 py-1 rounded-l-lg border border-emerald-700/40 border-r-0 text-emerald-400 hover:bg-emerald-400/10 transition-colors whitespace-nowrap">
                      ✓ Resolve
                    </button>
                    <button onClick={() => setMenuOpen(o => !o)} className="text-[10px] px-1.5 py-1 rounded-r-lg border border-emerald-700/40 text-emerald-400 hover:bg-emerald-400/10 transition-colors">
                      <ChevronDown size={10} />
                    </button>
                  </div>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 z-20 flex flex-col min-w-[160px] rounded-xl border border-amber-500/30 bg-slate-950/98 shadow-xl overflow-hidden">
                      <button onClick={() => { onToggle(issue); setMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2.5 text-[11px] text-emerald-400 hover:bg-emerald-400/10 transition-colors">
                        <CheckCircle2 size={12} /> Mark Resolved
                      </button>
                      {onDeploy && (
                        <button onClick={() => { onDeploy(issue); setMenuOpen(false); }} className="flex items-center gap-2 px-3 py-2.5 text-[11px] text-amber-400 hover:bg-amber-400/10 transition-colors border-t border-slate-800">
                          <Rocket size={12} /> For Deployment
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
              {resolved && (
                <button onClick={() => onToggle(issue)} className="text-[10px] px-2 py-1 rounded-lg border border-slate-700 text-slate-500 hover:text-emerald-400 hover:border-emerald-700/40 transition-colors">
                  Reopen
                </button>
              )}
              <button onClick={() => onEdit(issue)} className="p-1 rounded text-slate-600 hover:text-emerald-400 hover:bg-emerald-400/10 transition-colors"><Pencil size={12} /></button>
              <button onClick={() => onDelete(issue)} className="p-1 rounded text-slate-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"><Trash2 size={12} /></button>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${typeMeta.text} ${typeMeta.bg}`}>{typeMeta.label}</span>
        {priorityMeta && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide ${priorityMeta.text} ${priorityMeta.bg}`}>{priorityMeta.label}</span>}
        {inProgress && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide text-yellow-400 bg-yellow-400/10">In Progress</span>}
        {forDeployment && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide text-amber-400 bg-amber-400/10">For Deployment</span>}
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

function taskDurationStr(dateRange: string | undefined, entryDate: string): string {
  if (!dateRange || !dateRange.includes("→")) return "Same day";
  const [fromStr, toStr] = dateRange.split("→").map(s => s.trim());
  const year = new Date(entryDate + "T00:00:00").getFullYear();
  const fromD = new Date(`${fromStr} ${year}`);
  const toD = new Date(`${toStr} ${year}`);
  if (isNaN(fromD.getTime()) || isNaN(toD.getTime())) return "Same day";
  const days = Math.round((toD.getTime() - fromD.getTime()) / 86400000);
  return days <= 0 ? "Same day" : `${days} day${days !== 1 ? "s" : ""}`;
}

// ════════════════════════════════════════════════════════════════════
// WEEKLY REPORT MODAL + PDF GENERATOR
// ════════════════════════════════════════════════════════════════════
type ReportMediaItem = { file: File | null; preview: string; caption: string };
type ReportCompareSlot = { file: File | null; preview: string; note: string };
type ReportCompareItem = { label: string; before: ReportCompareSlot; after: ReportCompareSlot };
type TaskEnhancement = {
  open: boolean;
  media: ReportMediaItem[];
  compare: ReportCompareItem[];
};

async function fileOrUrlToSrc(preview: string, file: File | null | undefined): Promise<string> {
  if (file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }
  return preview;
}

async function generatePDFReport(
  items: CPRow[],
  enhancements: Record<string, TaskEnhancement>,
  dateLabel: string,
  features: Feature[],
  reportTitle: string,
) {
  const TYPE_COLORS: Record<string, string> = {
    feature:"#10b981",bugfix:"#f97316",task:"#14b8a6",milestone:"#f59e0b",
    learning:"#6366f1",optimized:"#06b6d4",refactor:"#a855f7",other:"#64748b",
  };
  const PRIORITY_COLORS: Record<string, string> = { urgent:"#ef4444", major:"#f59e0b", minor:"#3b82f6" };
  const COMPLEXITY_COLORS: Record<string, string> = { simple:"#14b8a6", hard:"#f97316", complex:"#a855f7" };
  const badge = (text: string, color: string) =>
    `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;background:${color}22;color:${color};margin:1px 2px;text-transform:uppercase;letter-spacing:.05em;border:1px solid ${color}44">${text}</span>`;

  const daysBetween = (from: string, to: string) =>
    Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000));
  const today = new Date().toISOString().slice(0, 10);

  const sortedItems = [...items].sort((a, b) => {
    const da = a.kind === "task" ? a.item.entryDate : (a.item.date_resolved ?? a.item.date_raised);
    const db = b.kind === "task" ? b.item.entryDate : (b.item.date_resolved ?? b.item.date_raised);
    return db.localeCompare(da);
  });

  const taskItems = sortedItems.filter(r => r.kind === "task") as { kind: "task"; item: CompletedTaskItem }[];
  const issueItems = sortedItems.filter(r => r.kind === "issue") as { kind: "issue"; item: RaisedIssue }[];

  // Build per-item HTML sections
  const resolveSlot = async (slot: ReportCompareSlot) => ({
    src: await fileOrUrlToSrc(slot.preview, slot.file),
    note: slot.note,
  });

  const itemBlocks = await Promise.all(sortedItems.map(async (row) => {
    const key = row.kind === "task" ? row.item.title : row.item.id;
    const enh = enhancements[key];

    const mediaHtml = enh?.media.filter(m => m.preview).length
      ? `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:10px">${
          (await Promise.all(enh.media.filter(m => m.preview).map(async m =>
            `<div style="page-break-inside:avoid">
               <img src="${await fileOrUrlToSrc(m.preview, m.file)}" style="width:100%;border-radius:6px;border:1px solid #e5e7eb;object-fit:cover;max-height:200px" />
               ${m.caption ? `<p style="font-size:11px;color:#6b7280;margin-top:4px;text-align:center;font-style:italic">${m.caption}</p>` : ""}
             </div>`))).join("")
        }</div>` : "";

    const compareHtml = enh?.compare.filter(c => c.before.preview || c.after.preview).length
      ? (await Promise.all(enh.compare.filter(c => c.before.preview || c.after.preview).map(async c => {
          const b = await resolveSlot(c.before);
          const a = await resolveSlot(c.after);
          return `<div style="border:1px solid #e5e7eb;border-radius:6px;padding:10px;margin-top:8px;page-break-inside:avoid">
            ${c.label ? `<p style="font-size:12px;font-weight:600;color:#374151;margin-bottom:6px">${c.label}</p>` : ""}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div><p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:4px">Before</p>
                ${b.src ? `<img src="${b.src}" style="width:100%;border-radius:4px;border:1px solid #e5e7eb;object-fit:cover;max-height:160px" />` : ""}
                ${b.note ? `<p style="font-size:11px;color:#6b7280;margin-top:4px;font-style:italic">${b.note}</p>` : ""}</div>
              <div><p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9ca3af;margin-bottom:4px">After</p>
                ${a.src ? `<img src="${a.src}" style="width:100%;border-radius:4px;border:1px solid #e5e7eb;object-fit:cover;max-height:160px" />` : ""}
                ${a.note ? `<p style="font-size:11px;color:#6b7280;margin-top:4px;font-style:italic">${a.note}</p>` : ""}</div>
            </div></div>`;
        }))).join("") : "";

    if (row.kind === "task") {
      const item = row.item;
      const isIP = item.status === "progress";
      const feat = features.find(f => f.id === item.featureId);
      const durationStr = isIP
        ? `${daysBetween(item.entryDate, today)} day${daysBetween(item.entryDate, today) !== 1 ? "s" : ""} so far`
        : taskDurationStr(item.dateRange, item.entryDate);
      const typeColor = TYPE_COLORS[item.type ?? "task"] ?? "#64748b";
      const borderColor = isIP ? "#f59e0b" : "#e5e7eb";
      const bgColor = isIP ? "#fffbeb" : "transparent";
      return `<div style="border:1px solid ${borderColor};border-radius:8px;padding:14px;margin:8px 0;page-break-inside:avoid;background:${bgColor}">
        <div style="margin-bottom:6px">
          ${isIP ? badge("In Progress","#f59e0b") : ""}
          ${item.type ? badge(item.type.replace("bugfix","Bug Fix").replace("optimized","Optimized"), typeColor) : ""}
          ${item.priority ? badge(item.priority, PRIORITY_COLORS[item.priority]??"#64748b") : ""}
          ${item.complexity ? badge(item.complexity, COMPLEXITY_COLORS[item.complexity]??"#64748b") : ""}
          ${badge(item.entryProject,"#6366f1")}
          ${feat ? `<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;background:${feat.color}22;color:${feat.color};margin:1px 2px;border:1px solid ${feat.color}44">${feat.name}</span>` : ""}
        </div>
        <p style="font-size:15px;font-weight:600;color:#374151;margin:4px 0;${isIP ? "" : "text-decoration:line-through"}">${item.title}</p>
        ${item.description ? `<p style="font-size:12px;color:#6b7280;margin:4px 0;font-style:italic">${item.description}</p>` : ""}
        <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:11px;color:#9ca3af;margin-top:8px">
          ${item.dateRange ? `<span>📅 <strong style="color:#6b7280">${item.dateRange}</strong></span>` : `<span>📅 <strong style="color:#6b7280">${formatDate(item.entryDate)}</strong></span>`}
          <span>⏱ <strong style="color:#6b7280">${durationStr}</strong></span>
          ${(item.tags ?? []).length > 0 ? `<span>🏷 ${item.tags!.map(t => `#${t}`).join(", ")}</span>` : ""}
        </div>
        ${mediaHtml}${compareHtml}
      </div>`;
    } else {
      const issue = row.item;
      const isIP = issue.status === "in_progress";
      const days = issue.date_started && issue.date_resolved
        ? daysBetween(issue.date_started, issue.date_resolved) : null;
      const typeColor = TYPE_COLORS[issue.type] ?? "#64748b";
      const borderColor = isIP ? "#fde68a" : "#ddd6fe";
      const bgColor = isIP ? "#fffbeb" : "#faf5ff";
      return `<div style="border:1px solid ${borderColor};border-radius:8px;padding:14px;margin:8px 0;page-break-inside:avoid;background:${bgColor}">
        <div style="margin-bottom:6px">
          ${isIP ? badge("In Progress","#f59e0b") : badge("Raised Issue","#7c3aed")}
          ${badge(issue.type.replace("bugfix","Bug Fix").replace("optimized","Optimized").replace("refactor","Refactor").replace("milestone","Milestone").replace("learning","Learning"), typeColor)}
          ${badge(issue.priority, PRIORITY_COLORS[issue.priority]??"#64748b")}
          ${badge(issue.project,"#6366f1")}
        </div>
        <p style="font-size:15px;font-weight:600;color:#374151;margin:4px 0;${isIP ? "" : "text-decoration:line-through"}">${issue.title}</p>
        ${issue.description ? `<p style="font-size:12px;color:#6b7280;margin:4px 0;font-style:italic">${issue.description}</p>` : ""}
        <div style="display:flex;flex-wrap:wrap;gap:12px;font-size:11px;color:#9ca3af;margin-top:8px">
          ${issue.date_raised ? `<span>🚨 Raised: <strong style="color:#6b7280">${issue.date_raised}</strong></span>` : ""}
          ${issue.date_started ? `<span>▶ Started: <strong style="color:#6b7280">${issue.date_started}</strong></span>` : ""}
          ${issue.date_resolved ? `<span>✅ Resolved: <strong style="color:#6b7280">${issue.date_resolved}</strong></span>` : ""}
          ${days !== null ? `<span>⏱ <strong style="color:#6b7280">${days} day${days !== 1 ? "s" : ""}</strong> to resolve</span>` : ""}
        </div>
        ${mediaHtml}${compareHtml}
      </div>`;
    }
  }));

  const ipTaskBlocks = itemBlocks.filter((_, i) => sortedItems[i].kind === "task" && (sortedItems[i] as { kind:"task";item:CompletedTaskItem }).item.status === "progress");
  const doneTaskBlocks = itemBlocks.filter((_, i) => sortedItems[i].kind === "task" && (sortedItems[i] as { kind:"task";item:CompletedTaskItem }).item.status === "done");
  const ipIssueBlocks = itemBlocks.filter((_, i) => sortedItems[i].kind === "issue" && (sortedItems[i] as { kind:"issue";item:RaisedIssue }).item.status === "in_progress");
  const doneIssueBlocks = itemBlocks.filter((_, i) => sortedItems[i].kind === "issue" && (sortedItems[i] as { kind:"issue";item:RaisedIssue }).item.status === "resolved");

  const ipCount = ipTaskBlocks.length + ipIssueBlocks.length;
  const ipSection = ipCount > 0 ? `<h2>In Progress</h2>${[...ipTaskBlocks, ...ipIssueBlocks].join("")}` : "";
  const taskSection = doneTaskBlocks.length > 0 ? `<h2>Completed Tasks</h2>${doneTaskBlocks.join("")}` : "";
  const issueSection = doneIssueBlocks.length > 0 ? `<h2>Resolved Issues</h2>${doneIssueBlocks.join("")}` : "";

  // Build a natural-language summary paragraph
  const doneTasks = taskItems.filter(r => r.item.status === "done");
  const featCount   = doneTasks.filter(r => r.item.type === "feature").length;
  const bugCount    = doneTasks.filter(r => r.item.type === "bugfix").length + doneIssueBlocks.length;
  const optCount    = doneTasks.filter(r => r.item.type === "optimized").length;
  const refCount    = doneTasks.filter(r => r.item.type === "refactor").length;
  const learnCount  = doneTasks.filter(r => r.item.type === "learning").length;
  const milCount    = doneTasks.filter(r => r.item.type === "milestone").length;
  const plainCount  = doneTasks.filter(r => (r.item.type ?? "task") === "task").length;
  const projectSet  = Array.from(new Set([...taskItems.map(r => r.item.entryProject), ...issueItems.map(r => r.item.project)])).filter(Boolean);

  const b = (n: number) => `<strong style="color:#111827">${n}</strong>`;
  const summaryParts: string[] = [];
  if (featCount)  summaryParts.push(`${b(featCount)} feature${featCount !== 1 ? "s" : ""} built`);
  if (bugCount)   summaryParts.push(`${b(bugCount)} bug${bugCount !== 1 ? "s" : ""} fixed`);
  if (optCount)   summaryParts.push(`${b(optCount)} optimization${optCount !== 1 ? "s" : ""} applied`);
  if (refCount)   summaryParts.push(`${b(refCount)} refactor${refCount !== 1 ? "s" : ""} done`);
  if (milCount)   summaryParts.push(`${b(milCount)} milestone${milCount !== 1 ? "s" : ""} reached`);
  if (learnCount) summaryParts.push(`${b(learnCount)} learning${learnCount !== 1 ? "s" : ""} recorded`);
  if (plainCount) summaryParts.push(`${b(plainCount)} general task${plainCount !== 1 ? "s" : ""} completed`);

  const totalDone = doneTasks.length + doneIssueBlocks.length;
  const summaryIntro = totalDone === 0
    ? "No completed items in this period."
    : `During <strong style="color:#111827">${dateLabel}</strong>, <strong style="color:#111827">Nel</strong> completed a total of <strong style="color:#10b981;font-size:15px">${totalDone} item${totalDone !== 1 ? "s" : ""}</strong> across <strong style="color:#111827">${projectSet.join(" and ") || "all projects"}</strong>` +
      (summaryParts.length ? ` — including ${summaryParts.join(", ")}` : "") + ".";

  const ipSummary = ipCount > 0
    ? ` Additionally, <strong style="color:#f59e0b">${ipCount} item${ipCount !== 1 ? "s" : ""}</strong> remain${ipCount === 1 ? "s" : ""} in progress.`
    : "";

  const generatedAt = new Date().toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" }) + " " +
    new Date().toLocaleTimeString("en-US", { hour:"numeric", minute:"2-digit" });

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>${reportTitle}</title>
  <style>
    *{box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:820px;margin:0 auto;padding:32px 24px;color:#111827;line-height:1.5}
    h1{font-size:22px;color:#111827;border-bottom:3px solid #10b981;padding-bottom:10px;margin-bottom:4px}
    .sub{color:#6b7280;font-size:13px;margin-bottom:16px}
    .summary{display:flex;gap:0;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden;margin-bottom:16px}
    .s-item{flex:1;padding:14px 16px;text-align:center;border-right:1px solid #e5e7eb}
    .s-item:last-child{border-right:none}
    .s-val{font-size:26px;font-weight:700;color:#10b981}
    .s-lbl{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af;font-weight:700}
    .text-summary{background:#f0fdf4;border:1px solid #bbf7d0;border-left:4px solid #10b981;border-radius:8px;padding:16px 20px;font-size:14px;color:#374151;line-height:1.85;margin-bottom:20px}
    h2{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#374151;border-left:3px solid #10b981;padding-left:8px;margin:24px 0 8px}
    @media print{body{padding:16px}@page{margin:1.2cm}h2{border-left:2px solid #10b981}}
  </style></head><body>
  <h1>${reportTitle}</h1>
  <p class="sub">Victoria Court — Christian Jonel Cañanes &nbsp;·&nbsp; ${dateLabel} &nbsp;·&nbsp; Generated ${generatedAt}</p>
  <div class="summary">
    <div class="s-item"><div class="s-val">${totalDone}</div><div class="s-lbl">Completed</div></div>
    <div class="s-item"><div class="s-val" style="color:#10b981">${doneTasks.length}</div><div class="s-lbl">Tasks</div></div>
    <div class="s-item"><div class="s-val" style="color:#7c3aed">${doneIssueBlocks.length}</div><div class="s-lbl">Issues</div></div>
    <div class="s-item"><div class="s-val" style="color:#f97316">${bugCount}</div><div class="s-lbl">Bugs Fixed</div></div>
    <div class="s-item"><div class="s-val" style="color:#06b6d4">${featCount}</div><div class="s-lbl">Features</div></div>
    ${ipCount > 0 ? `<div class="s-item"><div class="s-val" style="color:#f59e0b">${ipCount}</div><div class="s-lbl">In Progress</div></div>` : ""}
  </div>
  <div class="text-summary">${summaryIntro}${ipSummary}</div>
  ${taskSection}${issueSection}${ipSection}
  ${items.length === 0 ? `<p style="color:#9ca3af;text-align:center;padding:48px">No items in this period.</p>` : ""}
  </body></html>`;

  const win = window.open("", "_blank", "width=960,height=750");
  if (!win) { alert("Pop-up blocked — please allow pop-ups for this site."); return; }
  win.document.write(html);
  win.document.close();
  const imgs = Array.from(win.document.images);
  if (imgs.length === 0) {
    setTimeout(() => { win.focus(); win.print(); }, 250);
  } else {
    let loaded = 0;
    const tryPrint = () => { if (++loaded === imgs.length) setTimeout(() => { win.focus(); win.print(); }, 250); };
    imgs.forEach(img => { if (img.complete) tryPrint(); else { img.onload = tryPrint; img.onerror = tryPrint; } });
  }
}

// ─── Per-item enhancement widget ─────────────────────────────────────────────
function ItemEnhancer({
  enh,
  onChange,
}: {
  enh: TaskEnhancement;
  onChange: (next: TaskEnhancement) => void;
}) {
  if (!enh.open) return null;
  return (
    <div className="mt-2 flex flex-col gap-2 pl-2 border-l-2 border-slate-800">
      {/* Media row */}
      <div className="flex items-center gap-2 flex-wrap">
        {enh.media.map((m, mi) => (
          <div key={mi} className="relative group w-16 h-16 rounded-lg overflow-hidden border border-slate-700 shrink-0">
            <img src={m.preview} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex flex-col justify-between p-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/70">
              <button onClick={() => onChange({ ...enh, media: enh.media.filter((_, j) => j !== mi) })}
                className="self-end text-red-400 leading-none"><Trash2 size={9} /></button>
              <input value={m.caption} onChange={e => onChange({ ...enh, media: enh.media.map((x, j) => j === mi ? { ...x, caption: e.target.value } : x) })}
                placeholder="caption" className="text-[9px] bg-transparent text-slate-300 outline-none w-full" />
            </div>
          </div>
        ))}
        <label className="flex flex-col items-center justify-center w-16 h-16 rounded-lg border border-dashed border-slate-700 text-slate-600 hover:border-emerald-700/50 hover:text-emerald-400 transition-colors cursor-pointer shrink-0">
          <input type="file" accept="image/*" className="hidden" onChange={e => {
            const f = e.target.files?.[0]; if (!f) return;
            onChange({ ...enh, media: [...enh.media, { file: f, preview: URL.createObjectURL(f), caption: "" }] });
            e.target.value = "";
          }} />
          <ImageIcon size={12} /><span className="text-[9px] mt-0.5">+ Media</span>
        </label>
        {/* compare toggle */}
        <button onClick={() => onChange({ ...enh, compare: [...enh.compare, { label: "", before: { file: null, preview: "", note: "" }, after: { file: null, preview: "", note: "" } }] })}
          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded border border-slate-700 text-slate-500 hover:text-emerald-400 hover:border-emerald-700/50 transition-colors whitespace-nowrap">
          <Plus size={9} /> Before/After
        </button>
      </div>
      {/* Compare blocks */}
      {enh.compare.map((c, ci) => (
        <div key={ci} className="rounded-lg border border-slate-800 bg-slate-950/40 p-2 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <input value={c.label} onChange={e => onChange({ ...enh, compare: enh.compare.map((x, j) => j === ci ? { ...x, label: e.target.value } : x) })}
              placeholder="Label…" className="flex-1 text-[10px] bg-transparent border-b border-slate-800 text-slate-300 outline-none py-px placeholder:text-slate-700" />
            <button onClick={() => onChange({ ...enh, compare: enh.compare.filter((_, j) => j !== ci) })} className="text-slate-700 hover:text-red-400 transition-colors"><Trash2 size={10} /></button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {(["before", "after"] as const).map(side => {
              const slot = c[side];
              return (
                <div key={side} className="flex flex-col gap-1">
                  <p className="text-[8px] uppercase tracking-widest text-slate-600 font-bold">{side}</p>
                  {slot.preview ? (
                    <div className="relative group rounded overflow-hidden border border-slate-800">
                      <img src={slot.preview} alt={side} className="w-full h-16 object-cover" />
                      <label className="absolute inset-0 flex items-center justify-center bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <input type="file" accept="image/*" className="hidden" onChange={e => {
                          const f = e.target.files?.[0]; if (!f) return;
                          onChange({ ...enh, compare: enh.compare.map((x, j) => j === ci ? { ...x, [side]: { ...x[side], file: f, preview: URL.createObjectURL(f) } } : x) });
                        }} />
                        <ImageIcon size={11} className="text-slate-300" />
                      </label>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-16 rounded border border-dashed border-slate-700 text-slate-600 hover:border-emerald-700/40 hover:text-emerald-400 transition-colors cursor-pointer">
                      <input type="file" accept="image/*" className="hidden" onChange={e => {
                        const f = e.target.files?.[0]; if (!f) return;
                        onChange({ ...enh, compare: enh.compare.map((x, j) => j === ci ? { ...x, [side]: { ...x[side], file: f, preview: URL.createObjectURL(f) } } : x) });
                      }} />
                      <ImageIcon size={11} /><span className="text-[9px] mt-0.5">Upload</span>
                    </label>
                  )}
                  <input value={slot.note} onChange={e => onChange({ ...enh, compare: enh.compare.map((x, j) => j === ci ? { ...x, [side]: { ...x[side], note: e.target.value } } : x) })}
                    placeholder="Note…" className="text-[10px] text-slate-500 bg-transparent border-b border-slate-800/60 outline-none py-px placeholder:text-slate-700" />
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function WeeklyReportModal({
  open, onClose, items, features, dateLabel, titleOverride, onSaved,
}: {
  open: boolean;
  onClose: () => void;
  items: CPRow[];
  features: Feature[];
  dateLabel: string;
  titleOverride?: string;
  onSaved: (r: SavedReport) => void;
}) {
  const defaultTitle = titleOverride || `Weekly Report — ${dateLabel}`;
  const [reportTitle, setReportTitle] = useState(defaultTitle);
  const [enhancements, setEnhancements] = useState<Record<string, TaskEnhancement>>({});
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!open) { setEnhancements({}); setReportTitle(defaultTitle); }
    if (open) setReportTitle(defaultTitle);
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultTitle]);

  if (!open) return null;

  const allTaskRows = items.filter(r => r.kind === "task") as { kind: "task"; item: CompletedTaskItem }[];
  const allIssueRows = items.filter(r => r.kind === "issue") as { kind: "issue"; item: RaisedIssue }[];
  const ipTaskItems = allTaskRows.filter(r => r.item.status === "progress");
  const taskItems = allTaskRows.filter(r => r.item.status === "done");
  const ipIssueItems = allIssueRows.filter(r => r.item.status === "in_progress");
  const issueItems = allIssueRows.filter(r => r.item.status === "resolved");

  const daysBetween = (from: string, to: string) =>
    Math.max(0, Math.round((new Date(to).getTime() - new Date(from).getTime()) / 86400000));
  const today = new Date().toISOString().slice(0, 10);

  const getEnh = (key: string): TaskEnhancement =>
    enhancements[key] ?? { open: false, media: [], compare: [] };
  const setEnh = (key: string, val: TaskEnhancement) =>
    setEnhancements(prev => ({ ...prev, [key]: val }));

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generatePDFReport(items, enhancements, dateLabel, features, reportTitle);
      // Save to Supabase
      const { data, error } = await supabase
        .from("weekly_reports")
        .insert({ title: reportTitle, date_label: dateLabel, items_snapshot: items })
        .select()
        .single();
      if (!error && data) onSaved(data as SavedReport);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm" />
      <div className="fixed inset-y-0 right-0 z-[55] w-full max-w-2xl bg-slate-950 border-l border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 shrink-0">
          <div className="flex-1 min-w-0">
            <input
              value={reportTitle}
              onChange={e => setReportTitle(e.target.value)}
              className="w-full bg-transparent text-sm font-bold text-emerald-300 outline-none placeholder:text-emerald-800 truncate"
              placeholder="Report title…"
            />
            <p className="text-[11px] text-slate-500 mt-0.5">{dateLabel} · {items.length} item{items.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg border border-emerald-700/50 bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25 transition-colors font-semibold disabled:opacity-50"
            >
              <BarChart2 size={13} />
              {generating ? "Generating…" : "Download PDF"}
            </button>
            <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6">
          {/* Summary stats */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Total", value: items.length, color: "text-emerald-400" },
              { label: "In Progress", value: ipTaskItems.length + ipIssueItems.length, color: "text-amber-400" },
              { label: "Done", value: taskItems.length + issueItems.length, color: "text-teal-400" },
              { label: "Bug Fixes", value: allTaskRows.filter(r => r.item.type === "bugfix").length + allIssueRows.length, color: "text-orange-400" },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center justify-center py-3 rounded-xl border border-slate-800 bg-slate-900/60">
                <span className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</span>
                <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold mt-0.5">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Completed Tasks */}
          {taskItems.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 size={11} className="text-emerald-500" /> Completed Tasks
              </p>
              {taskItems.map(({ item }, i) => {
                const feat = features.find(f => f.id === item.featureId);
                const durStr = taskDurationStr(item.dateRange, item.entryDate);
                const key = item.title;
                const enh = getEnh(key);
                const hasEnh = enh.media.length > 0 || enh.compare.length > 0;
                return (
                  <div key={i} className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-1 flex-wrap mb-1">
                          {item.type && <span className="text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide bg-slate-700 text-slate-300">{item.type}</span>}
                          {item.priority && <span className="text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide bg-slate-700 text-slate-300">{item.priority}</span>}
                          {item.complexity && <span className="text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide bg-slate-700 text-slate-300">{item.complexity}</span>}
                          {feat && <span className="text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide" style={{ color: feat.color, background: feat.color + "22" }}>{feat.name}</span>}
                        </div>
                        <p className="text-sm text-slate-200 leading-snug">{item.title}</p>
                        {item.description && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{item.description}</p>}
                        <div className="flex flex-wrap gap-3 mt-1 text-[10px] text-slate-600">
                          <span>📅 {item.dateRange ?? formatDate(item.entryDate)}</span>
                          <span>⏱ {durStr}</span>
                          {(item.tags ?? []).length > 0 && <span>🏷 {item.tags!.map(t => `#${t}`).join(" ")}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => setEnh(key, { ...enh, open: !enh.open })}
                        className={`shrink-0 p-1.5 rounded-lg border transition-colors text-[10px] ${enh.open || hasEnh ? "border-emerald-700/50 text-emerald-400 bg-emerald-400/10" : "border-slate-700 text-slate-600 hover:text-slate-300 hover:border-slate-600"}`}
                        title="Add media / compare"
                      >
                        <ImageIcon size={11} />
                      </button>
                    </div>
                    <ItemEnhancer enh={enh} onChange={val => setEnh(key, val)} />
                  </div>
                );
              })}
            </div>
          )}

          {/* Resolved Issues */}
          {issueItems.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <AlertCircle size={11} className="text-violet-400" /> Resolved Issues
              </p>
              {issueItems.map(({ item: issue }) => {
                const days = issue.date_started && issue.date_resolved
                  ? daysBetween(issue.date_started, issue.date_resolved) : null;
                const key = issue.id;
                const enh = getEnh(key);
                const hasEnh = enh.media.length > 0 || enh.compare.length > 0;
                return (
                  <div key={issue.id} className="rounded-xl border border-violet-900/30 bg-violet-400/5 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap gap-1 mb-1">
                          <span className="text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide text-violet-400 bg-violet-400/15">Issue</span>
                          <span className="text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide bg-slate-700 text-slate-300">{issue.type}</span>
                          <span className="text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide bg-slate-700 text-slate-300">{issue.priority}</span>
                        </div>
                        <p className="text-sm text-slate-200 leading-snug">{issue.title}</p>
                        <div className="flex flex-wrap gap-3 mt-1 text-[10px] text-slate-600">
                          {issue.date_raised && <span>🚨 {issue.date_raised}</span>}
                          {issue.date_started && <span>▶ {issue.date_started}</span>}
                          {issue.date_resolved && <span>✅ {issue.date_resolved}</span>}
                          {days !== null && <span>⏱ {days}d to resolve</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => setEnh(key, { ...enh, open: !enh.open })}
                        className={`shrink-0 p-1.5 rounded-lg border transition-colors ${enh.open || hasEnh ? "border-violet-700/50 text-violet-400 bg-violet-400/10" : "border-slate-700 text-slate-600 hover:text-slate-300 hover:border-slate-600"}`}
                        title="Add media / compare"
                      >
                        <ImageIcon size={11} />
                      </button>
                    </div>
                    <ItemEnhancer enh={enh} onChange={val => setEnh(key, val)} />
                  </div>
                );
              })}
            </div>
          )}

          {/* In Progress Tasks + Issues — shown last */}
          {(ipTaskItems.length > 0 || ipIssueItems.length > 0) && (
            <div className="flex flex-col gap-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> In Progress
              </p>
              {[...ipTaskItems, ...ipIssueItems].map((row, i) => {
                const key = row.kind === "task" ? row.item.title : row.item.id;
                const enh = getEnh(key);
                const hasEnh = enh.media.length > 0 || enh.compare.length > 0;
                if (row.kind === "task") {
                  const item = row.item;
                  const feat = features.find(f => f.id === item.featureId);
                  const sincedays = daysBetween(item.entryDate, today);
                  return (
                    <div key={i} className="rounded-xl border border-amber-800/40 bg-amber-400/5 px-4 py-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-1 flex-wrap mb-1">
                            <span className="text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide text-amber-400 bg-amber-400/15">In Progress</span>
                            {item.type && <span className="text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide bg-slate-700 text-slate-300">{item.type}</span>}
                            {item.priority && <span className="text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide bg-slate-700 text-slate-300">{item.priority}</span>}
                            {item.complexity && <span className="text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide bg-slate-700 text-slate-300">{item.complexity}</span>}
                            {feat && <span className="text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide" style={{ color: feat.color, background: feat.color + "22" }}>{feat.name}</span>}
                          </div>
                          <p className="text-sm text-slate-200 leading-snug">{item.title}</p>
                          {item.description && <p className="text-[11px] text-slate-500 mt-0.5 truncate">{item.description}</p>}
                          <div className="flex flex-wrap gap-3 mt-1 text-[10px] text-slate-600">
                            <span>📅 {formatDate(item.entryDate)}</span>
                            <span>⏱ {sincedays === 0 ? "Today" : `${sincedays}d`} in progress</span>
                          </div>
                        </div>
                        <button onClick={() => setEnh(key, { ...enh, open: !enh.open })}
                          className={`shrink-0 p-1.5 rounded-lg border transition-colors ${enh.open || hasEnh ? "border-amber-700/50 text-amber-400 bg-amber-400/10" : "border-slate-700 text-slate-600 hover:text-slate-300 hover:border-slate-600"}`}>
                          <ImageIcon size={11} />
                        </button>
                      </div>
                      <ItemEnhancer enh={enh} onChange={val => setEnh(key, val)} />
                    </div>
                  );
                } else {
                  const issue = row.item;
                  return (
                    <div key={i} className="rounded-xl border border-amber-800/40 bg-amber-400/5 px-4 py-3">
                      <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap gap-1 mb-1">
                            <span className="text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide text-amber-400 bg-amber-400/15">In Progress</span>
                            <span className="text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide bg-slate-700 text-slate-300">{issue.type}</span>
                            <span className="text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide bg-slate-700 text-slate-300">{issue.priority}</span>
                          </div>
                          <p className="text-sm text-slate-200 leading-snug">{issue.title}</p>
                          <div className="flex flex-wrap gap-3 mt-1 text-[10px] text-slate-600">
                            {issue.date_raised && <span>🚨 {issue.date_raised}</span>}
                            {issue.date_started && <span>▶ {issue.date_started}</span>}
                          </div>
                        </div>
                        <button onClick={() => setEnh(key, { ...enh, open: !enh.open })}
                          className={`shrink-0 p-1.5 rounded-lg border transition-colors ${enh.open || hasEnh ? "border-amber-700/50 text-amber-400 bg-amber-400/10" : "border-slate-700 text-slate-600 hover:text-slate-300 hover:border-slate-600"}`}>
                          <ImageIcon size={11} />
                        </button>
                      </div>
                      <ItemEnhancer enh={enh} onChange={val => setEnh(key, val)} />
                    </div>
                  );
                }
              })}
            </div>
          )}

          {items.length === 0 && (
            <p className="text-center text-slate-600 text-sm py-12">No completed items in this period.</p>
          )}
        </div>
      </div>
    </>
  );
}

// ════════════════════════════════════════════════════════════════════
// All Tasks Panel — full history of completed tasks + resolved issues
// ════════════════════════════════════════════════════════════════════
const ALL_TASKS_PER_PAGE = 20;

function AllTasksPanel({
  open, onClose, completedItems, resolvedIssues, features, readOnly, onReopenTask, onOpenIssue, onGenerateReport,
}: {
  open: boolean;
  onClose: () => void;
  completedItems: CompletedTaskItem[];
  resolvedIssues: RaisedIssue[];
  features: Feature[];
  readOnly: boolean;
  onReopenTask: (title: string) => void;
  onOpenIssue: (issue: RaisedIssue) => void;
  onGenerateReport: (rows: CPRow[], label: string) => void;
}) {
  const [search, setSearch] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | "tasks" | "issues">("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"all" | "week" | "month" | "year">("all");
  const [taskTypeFilter, setTaskTypeFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => { setPage(1); }, [search, kindFilter, projectFilter, dateRange, taskTypeFilter]);

  if (!open) return null;

  const today = new Date().toISOString().slice(0, 10);
  let cutoff: string | null = null;
  if (dateRange === "week") { const d = new Date(); d.setDate(d.getDate() - 6); cutoff = d.toISOString().slice(0, 10); }
  else if (dateRange === "month") { cutoff = today.slice(0, 7) + "-01"; }
  else if (dateRange === "year") { cutoff = today.slice(0, 4) + "-01-01"; }

  const allRows: CPRow[] = [
    ...completedItems.map(i => ({ kind: "task" as const, item: i })),
    ...resolvedIssues.map(i => ({ kind: "issue" as const, item: i })),
  ].sort((a, b) => {
    const da = a.kind === "task" ? a.item.entryDate : (a.item.date_resolved ?? a.item.date_raised);
    const db = b.kind === "task" ? b.item.entryDate : (b.item.date_resolved ?? b.item.date_raised);
    return db.localeCompare(da);
  });

  const allProjects = Array.from(new Set([
    ...completedItems.map(i => i.entryProject),
    ...resolvedIssues.map(i => i.project),
  ])).filter(Boolean).sort();

  const q = search.trim().toLowerCase();
  const filtered = allRows.filter(row => {
    if (kindFilter === "tasks" && row.kind !== "task") return false;
    if (kindFilter === "issues" && row.kind !== "issue") return false;
    if (projectFilter !== "all") {
      const proj = row.kind === "task" ? row.item.entryProject : row.item.project;
      if (proj !== projectFilter) return false;
    }
    if (cutoff) {
      const d = row.kind === "task" ? row.item.entryDate : (row.item.date_resolved ?? row.item.date_raised);
      if (d < cutoff) return false;
    }
    if (taskTypeFilter !== "all" && row.kind === "task") {
      if ((row.item.type ?? "task") !== taskTypeFilter) return false;
    }
    if (q) {
      const text = row.kind === "task"
        ? [row.item.title, row.item.description, row.item.entryProject, ...(row.item.tags ?? [])].join(" ").toLowerCase()
        : [row.item.title, row.item.description, row.item.project].join(" ").toLowerCase();
      if (!text.includes(q)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / ALL_TASKS_PER_PAGE);
  const paged = filtered.slice((page - 1) * ALL_TASKS_PER_PAGE, page * ALL_TASKS_PER_PAGE);

  const taskCount = allRows.filter(r => r.kind === "task").length;
  const issueCount = allRows.filter(r => r.kind === "issue").length;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm" />
      <div className="fixed inset-y-0 right-0 z-[55] w-full max-w-xl bg-slate-950 border-l border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 shrink-0">
          <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold tracking-widest uppercase text-emerald-300">All Completed</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">{taskCount} tasks · {issueCount} issues</p>
          </div>
          {!readOnly && (
            <button
              onClick={() => {
                const label = projectFilter !== "all" ? projectFilter : "All Projects";
                onGenerateReport(filtered, label);
              }}
              className="flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-lg border border-emerald-700/40 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/20 transition-colors font-medium whitespace-nowrap"
            >
              <BarChart2 size={11} /> Generate Report
            </button>
          )}
          <button onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors">
            <X size={15} />
          </button>
        </div>

        {/* Search + filters */}
        <div className="flex flex-col gap-2 px-5 py-3 border-b border-slate-800/60 shrink-0">
          <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5">
            <svg className="w-3.5 h-3.5 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search tasks, issues, tags…"
              className="flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
            />
            {search && <button onClick={() => setSearch("")} className="text-slate-600 hover:text-slate-300 transition-colors"><X size={12} /></button>}
          </div>
          {/* Kind */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {(["all", "tasks", "issues"] as const).map(f => (
              <button key={f} onClick={() => setKindFilter(f)}
                className={`shrink-0 text-[10px] px-2.5 py-1 rounded-full border font-medium transition-colors ${kindFilter === f ? "bg-emerald-400/15 border-emerald-400/40 text-emerald-300" : "border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700"}`}>
                {f === "all" ? `All (${allRows.length})` : f === "tasks" ? `Tasks (${taskCount})` : `Issues (${issueCount})`}
              </button>
            ))}
            {filtered.length !== allRows.length && (
              <span className="text-[10px] text-slate-600 ml-auto shrink-0">{filtered.length} shown</span>
            )}
          </div>
          {/* Project */}
          {allProjects.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
              {[["all", "All Projects"], ...allProjects.map(p => [p, p])].map(([v, label]) => (
                <button key={v} onClick={() => setProjectFilter(v)}
                  className={`shrink-0 text-[9px] px-2.5 py-1 rounded-full border font-bold tracking-wide uppercase transition-colors ${projectFilter === v ? "border-indigo-500/50 bg-indigo-400/10 text-indigo-300" : "border-slate-800 text-slate-600 hover:text-slate-300 hover:border-slate-700"}`}>
                  {label}
                </button>
              ))}
            </div>
          )}
          {/* Date range */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {([["all","All Time"], ["week","This Week"], ["month","This Month"], ["year","This Year"]] as const).map(([v, label]) => (
              <button key={v} onClick={() => setDateRange(v)}
                className={`shrink-0 text-[9px] px-2.5 py-1 rounded-full border font-bold tracking-wide uppercase transition-colors ${dateRange === v ? "border-sky-500/50 bg-sky-400/10 text-sky-300" : "border-slate-800 text-slate-600 hover:text-slate-300 hover:border-slate-700"}`}>
                {label}
              </button>
            ))}
          </div>
          {/* Task type */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {([["all","All Types"], ["feature","Feature"], ["bugfix","Bug Fix"], ["optimized","Optimized"], ["task","Task"], ["milestone","Milestone"], ["refactor","Refactor"], ["learning","Learning"]] as const).map(([v, label]) => (
              <button key={v} onClick={() => setTaskTypeFilter(v)}
                className={`shrink-0 text-[9px] px-2.5 py-1 rounded-full border font-bold tracking-wide uppercase transition-colors ${taskTypeFilter === v ? "border-violet-500/50 bg-violet-400/10 text-violet-300" : "border-slate-800 text-slate-600 hover:text-slate-300 hover:border-slate-700"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 py-3 flex flex-col gap-0.5">
          {paged.length === 0 ? (
            <p className="text-center text-slate-600 text-sm py-16">Nothing found.</p>
          ) : paged.map((row, i) => {
            if (row.kind === "task") {
              const item = row.item;
              const feat = features.find(f => f.id === item.featureId);
              const tm = TYPE_META[(item.type ?? "task") as keyof typeof TYPE_META] ?? TYPE_META.task;
              const TIcon = tm.icon;
              return (
                <div key={`t-${i}`} className="group flex items-start gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:border-slate-800 hover:bg-slate-800/25 transition-all">
                  <CheckCircle2 size={13} className="text-emerald-400/50 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <span className="text-[9px] text-slate-600 font-medium">{item.entryProject}</span>
                      <span className={`flex items-center gap-0.5 text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide ${tm.text} ${tm.bg}`}>
                        <TIcon size={8} />{tm.label}
                      </span>
                      {item.priority && <span className={`text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide ${PRIORITY_META[item.priority].text} ${PRIORITY_META[item.priority].bg}`}>{PRIORITY_META[item.priority].label}</span>}
                      {item.complexity && <span className={`text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide ${COMPLEXITY_META[item.complexity].text} ${COMPLEXITY_META[item.complexity].bg}`}>{COMPLEXITY_META[item.complexity].label}</span>}
                      {feat && <span className="text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide" style={{ color: feat.color, background: feat.color + "22" }}>{feat.name}</span>}
                    </div>
                    <p className="text-[13px] font-medium text-slate-400 leading-snug line-through decoration-slate-600/60">{item.title}</p>
                    {item.description && <p className="text-[10px] text-slate-600 mt-0.5 truncate">{item.description}</p>}
                    <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-slate-700">
                      <span>{item.dateRange ?? formatDate(item.entryDate)}</span>
                      <span>⏱ {taskDurationStr(item.dateRange, item.entryDate)}</span>
                      {(item.tags ?? []).length > 0 && <span>{item.tags!.map(t => `#${t}`).join(" ")}</span>}
                    </div>
                  </div>
                  {!readOnly && (
                    <button onClick={() => onReopenTask(item.title)}
                      className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 text-[10px] px-2 py-1 rounded-lg bg-yellow-500/10 border border-yellow-500/25 text-yellow-400 hover:bg-yellow-500/20 transition-all whitespace-nowrap">
                      ↩
                    </button>
                  )}
                </div>
              );
            }

            const issue = row.item;
            const tm = ISSUE_TYPE_META[issue.type] ?? ISSUE_TYPE_META.other;
            const pm = PRIORITY_META[issue.priority];
            return (
              <div key={`iss-${issue.id}`} className="group flex items-start gap-3 px-3 py-2.5 rounded-xl border border-transparent hover:border-slate-800 hover:bg-slate-800/25 transition-all">
                <CheckCircle2 size={13} className="text-violet-400/50 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <span className="text-[9px] text-slate-600 font-medium">{issue.project}</span>
                    <span className={`text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide ${tm.text} ${tm.bg}`}>{tm.label}</span>
                    {pm && <span className={`text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide ${pm.text} ${pm.bg}`}>{pm.label}</span>}
                    <span className="text-[8px] font-bold px-1.5 py-px rounded uppercase tracking-wide text-violet-400 bg-violet-400/10">Issue</span>
                  </div>
                  <p className="text-[13px] font-medium text-slate-400 leading-snug line-through decoration-slate-600/60">{issue.title}</p>
                  {issue.description && <p className="text-[10px] text-slate-600 mt-0.5 truncate">{issue.description}</p>}
                  <div className="flex flex-wrap gap-2 mt-1 text-[10px] text-slate-700">
                    {issue.date_raised && <span>Raised {issue.date_raised}</span>}
                    {issue.date_resolved && <span>· Resolved {issue.date_resolved}</span>}
                  </div>
                </div>
                <button onClick={() => onOpenIssue(issue)}
                  className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 text-[10px] px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-all whitespace-nowrap">
                  View
                </button>
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-800 shrink-0">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700 disabled:opacity-30 transition-colors">
              ← Prev
            </button>
            <span className="text-[11px] text-slate-600">{page} / {totalPages} · {filtered.length} items</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="text-[11px] px-3 py-1.5 rounded-lg border border-slate-800 text-slate-500 hover:text-slate-300 hover:border-slate-700 disabled:opacity-30 transition-colors">
              Next →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
