import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Image as ImageIcon,
  Plus,
  Trash2,
  Video as VideoIcon,
  X,
} from "lucide-react";
import type {
  CompareItem,
  Entry,
  EntryMedia,
  Task,
} from "../utils/entries/entries";

export type InProgressItem = {
  entryId: string;
  entryTitle: string;
  entryDate: string;
  task: Task;
};
import { supabase } from "../utils/supabase";

// ── Draft types ───────────────────────────────────────────────────────

type CompareDraft = {
  label: string;
  before: { file: File | null; preview: string; note: string };
  after: { file: File | null; preview: string; note: string };
};

const TASK_TAGS = [
  "booking",
  "food",
  "collection",
  "prestige",
  "perks",
  "love",
] as const;

type TaskDraft = {
  title: string;
  type: NonNullable<Task["type"]>;
  status: Task["status"];
  priority: Task["priority"];
  complexity: Task["complexity"];
  dateRange: string;
  tags: string[];
  compare: CompareDraft[];
};

type MediaDraft = {
  kind: "image" | "video";
  file: File | null;
  preview: string;
  caption: string;
};

type EntryDraft = {
  project: Entry["project"];
  date: string;
  title: string;
  tasks: TaskDraft[];
  tags: string;
  media: MediaDraft[];
};

// ── Blanks ────────────────────────────────────────────────────────────

const BLANK_COMPARE = (): CompareDraft => ({
  label: "",
  before: { file: null, preview: "", note: "" },
  after: { file: null, preview: "", note: "" },
});

const BLANK_TASK = (): TaskDraft => ({
  title: "",
  type: "task",
  status: "done",
  priority: undefined,
  complexity: undefined,
  dateRange: "",
  tags: [],
  compare: [],
});

const BLANK_DRAFT = (): EntryDraft => ({
  project: "VC+",
  date: new Date().toISOString().slice(0, 10),
  title: "",
  tasks: [BLANK_TASK()],
  tags: "",
  media: [],
});

// ── Constants ─────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: NonNullable<Task["type"]>; label: string }[] = [
  { value: "task", label: "Task" },
  { value: "feature", label: "Feature" },
  { value: "bugfix", label: "Bug Fix" },
  { value: "milestone", label: "Milestone" },
  { value: "learning", label: "Learning" },
];

const INPUT_CLS =
  "w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-emerald-700/60 placeholder:text-slate-600 transition-colors";
const LABEL_CLS =
  "text-[10px] font-bold uppercase tracking-widest text-slate-500";
const SEL_CLS =
  "bg-slate-950 border border-slate-800 rounded-md px-2 py-1.5 text-xs text-slate-300 outline-none focus:border-emerald-700/60 transition-colors";

// ── Entry → Draft converter (for edit mode) ───────────────────────────

function entryToDraft(entry: Entry): EntryDraft {
  return {
    project: entry.project,
    date: entry.date,
    title: entry.title,
    tags: (entry.tags ?? []).join(", "),
    tasks: entry.tasks.map((t) => ({
      title: t.title,
      type: t.type ?? "task",
      status: t.status,
      priority: t.priority,
      complexity: t.complexity,
      dateRange: t.dateRange ?? "",
      tags: t.tags ?? [],
      compare: (t.compare ?? []).map((c) => ({
        label: c.label ?? "",
        before: { file: null, preview: c.before.src, note: c.before.note },
        after: { file: null, preview: c.after.src, note: c.after.note },
      })),
    })),
    media: (entry.media ?? []).map((m) => ({
      kind: m.kind,
      file: null,
      preview: m.src,
      caption: m.caption ?? "",
    })),
  };
}

// ── Image compression ─────────────────────────────────────────────────

function compressImage(
  file: File,
  maxPx = 1920,
  quality = 0.82,
): Promise<File> {
  if (!file.type.startsWith("image/")) return Promise.resolve(file);
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxPx / img.width, maxPx / img.height);
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file);
            return;
          }
          resolve(
            new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
              type: "image/jpeg",
            }),
          );
        },
        "image/jpeg",
        quality,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

// ── Upload helper ─────────────────────────────────────────────────────

async function uploadFile(file: File): Promise<string> {
  const ready = await compressImage(file);
  const ext = ready.name.split(".").pop() ?? "bin";
  const path = `uploads/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("vc-media").upload(path, ready);
  if (error) throw new Error(error.message);
  return supabase.storage.from("vc-media").getPublicUrl(path).data.publicUrl;
}

// ── Main component ────────────────────────────────────────────────────

export function AddEntryModal({
  open,
  onClose,
  onSaved,
  initialEntry,
  inProgressItems = [],
  seedTask,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: (entry: Entry) => void;
  initialEntry?: Entry;
  inProgressItems?: InProgressItem[];
  seedTask?: Task;
}) {
  const isEdit = initialEntry != null;
  const [draft, setDraft] = useState<EntryDraft>(BLANK_DRAFT);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      if (isEdit) {
        setDraft(entryToDraft(initialEntry));
      } else {
        const carried: TaskDraft[] = inProgressItems.map((item) => ({
          title: item.task.title,
          type: item.task.type ?? "task",
          status: "progress" as Task["status"],
          priority: item.task.priority,
          complexity: item.task.complexity,
          dateRange: "",
          tags: item.task.tags ?? [],
          compare: [],
        }));
        const seed: TaskDraft[] = seedTask
          ? [
              {
                title: seedTask.title,
                type: seedTask.type ?? "task",
                status: "progress" as Task["status"],
                priority: seedTask.priority,
                complexity: seedTask.complexity,
                dateRange: "",
                tags: seedTask.tags ?? [],
                compare: [],
              },
            ]
          : [];
        const deduped = [
          ...seed,
          ...carried.filter((t) => !seed.some((s) => s.title === t.title)),
        ];
        setDraft({ ...BLANK_DRAFT(), tasks: [...deduped, BLANK_TASK()] });
      }
      setErr(null);
      setSaving(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function setField<K extends keyof EntryDraft>(k: K, v: EntryDraft[K]) {
    setDraft((d) => ({ ...d, [k]: v }));
  }

  // ── Task helpers ────────────────────────────────────────────────────

  function updateTask(i: number, patch: Partial<TaskDraft>) {
    setDraft((d) => {
      const tasks = [...d.tasks];
      tasks[i] = { ...tasks[i], ...patch };
      return { ...d, tasks };
    });
  }

  function addTask() {
    setDraft((d) => ({ ...d, tasks: [...d.tasks, BLANK_TASK()] }));
  }

  function removeTask(i: number) {
    setDraft((d) => ({ ...d, tasks: d.tasks.filter((_, j) => j !== i) }));
  }

  // ── Compare helpers ─────────────────────────────────────────────────

  function addCompare(ti: number) {
    updateTask(ti, { compare: [...draft.tasks[ti].compare, BLANK_COMPARE()] });
  }

  function removeCompare(ti: number, ci: number) {
    updateTask(ti, {
      compare: draft.tasks[ti].compare.filter((_, j) => j !== ci),
    });
  }

  function updateCompare(ti: number, ci: number, patch: Partial<CompareDraft>) {
    const compare = [...draft.tasks[ti].compare];
    compare[ci] = { ...compare[ci], ...patch };
    updateTask(ti, { compare });
  }

  function setCompareSide(
    ti: number,
    ci: number,
    side: "before" | "after",
    patch: Partial<CompareDraft["before"]>,
  ) {
    const cmp = draft.tasks[ti].compare[ci];
    updateCompare(ti, ci, { [side]: { ...cmp[side], ...patch } });
  }

  // ── Media helpers ───────────────────────────────────────────────────

  function addMedia(kind: "image" | "video") {
    setDraft((d) => ({
      ...d,
      media: [...d.media, { kind, file: null, preview: "", caption: "" }],
    }));
  }

  function removeMedia(i: number) {
    setDraft((d) => ({ ...d, media: d.media.filter((_, j) => j !== i) }));
  }

  function updateMedia(i: number, patch: Partial<MediaDraft>) {
    setDraft((d) => {
      const media = [...d.media];
      media[i] = { ...media[i], ...patch };
      return { ...d, media };
    });
  }

  // ── Submit ──────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validTasks = draft.tasks.filter((t) => t.title.trim());
    if (!draft.title.trim() || validTasks.length === 0) {
      setErr("Entry title and at least one task title are required.");
      return;
    }
    setSaving(true);
    setErr(null);
    try {
      const resolvedTasks: Task[] = await Promise.all(
        validTasks.map(async (t) => {
          const compare: CompareItem[] = await Promise.all(
            t.compare.map(async (c) => ({
              ...(c.label.trim() ? { label: c.label.trim() } : {}),
              before: {
                src: c.before.file
                  ? await uploadFile(c.before.file)
                  : c.before.preview,
                note: c.before.note,
              },
              after: {
                src: c.after.file
                  ? await uploadFile(c.after.file)
                  : c.after.preview,
                note: c.after.note,
              },
            })),
          );
          return {
            title: t.title.trim(),
            type: t.type,
            status: t.status,
            ...(t.priority ? { priority: t.priority } : {}),
            ...(t.complexity ? { complexity: t.complexity } : {}),
            ...(t.dateRange.trim() ? { dateRange: t.dateRange.trim() } : {}),
            ...(t.tags.length > 0 ? { tags: t.tags } : {}),
            ...(compare.length > 0 ? { compare } : {}),
          };
        }),
      );

      const resolvedMedia: EntryMedia[] = await Promise.all(
        draft.media
          .filter((m) => m.file !== null || m.preview !== "")
          .map(async (m) => ({
            kind: m.kind,
            src: m.file ? await uploadFile(m.file) : m.preview,
            ...(m.caption.trim() ? { caption: m.caption.trim() } : {}),
          })),
      );

      const entry: Entry = {
        id: initialEntry?.id ?? crypto.randomUUID(),
        project: draft.project,
        date: draft.date,
        title: draft.title.trim(),
        tasks: resolvedTasks,
        ...(draft.tags.trim()
          ? {
              tags: draft.tags
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            }
          : {}),
        ...(resolvedMedia.length > 0 ? { media: resolvedMedia } : {}),
      };

      if (isEdit) {
        const { error: dbErr } = await supabase
          .from("entries")
          .update(entry)
          .eq("id", entry.id);
        if (dbErr) throw new Error(dbErr.message);
      } else {
        const { error: dbErr } = await supabase.from("entries").insert(entry);
        if (dbErr) throw new Error(dbErr.message);
      }

      onSaved(entry);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to save.");
      setSaving(false);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-30 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed z-40 top-0 right-0 h-full w-full sm:w-[520px] bg-slate-900 border-l border-slate-800 shadow-2xl transition-transform duration-300 flex flex-col ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 shrink-0">
          <span className="text-[11px] font-bold tracking-[0.25em] uppercase text-emerald-400">
            {isEdit ? "Edit Entry" : "New Entry"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable form body */}
        <form
          id="entry-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-6"
        >
          {/* ── Basics ──────────────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className={LABEL_CLS}>Project</span>
                <select
                  value={draft.project}
                  onChange={(e) =>
                    setField("project", e.target.value as Entry["project"])
                  }
                  className={SEL_CLS + " py-2 w-full"}
                >
                  <option value="VC+">VC+</option>
                  <option value="VC+ CMS">VC+ CMS</option>
                </select>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className={LABEL_CLS}>Date</span>
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setField("date", e.target.value)}
                  className={INPUT_CLS + " [color-scheme:dark]"}
                />
              </label>
            </div>

            <label className="flex flex-col gap-1.5">
              <span className={LABEL_CLS}>Entry Title</span>
              <input
                value={draft.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="What did you work on today?"
                className={INPUT_CLS}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className={LABEL_CLS}>
                Tags{" "}
                <span className="normal-case tracking-normal font-normal text-slate-600">
                  comma-separated
                </span>
              </span>
              <input
                value={draft.tags}
                onChange={(e) => setField("tags", e.target.value)}
                placeholder="react, typescript, ui..."
                className={INPUT_CLS}
              />
            </label>
          </section>

          <Divider label="Tasks" />

          {/* ── Tasks ───────────────────────────────────────────── */}
          <section className="flex flex-col gap-3">
            {draft.tasks.map((task, ti) => (
              <TaskBlock
                key={ti}
                task={task}
                onUpdate={(p) => updateTask(ti, p)}
                onRemove={
                  draft.tasks.length > 1 ? () => removeTask(ti) : undefined
                }
                onAddCompare={() => addCompare(ti)}
                onRemoveCompare={(ci) => removeCompare(ti, ci)}
                onUpdateCompare={(ci, p) => updateCompare(ti, ci, p)}
                onCompareSideFile={(ci, side, f) =>
                  setCompareSide(ti, ci, side, {
                    file: f,
                    preview: URL.createObjectURL(f),
                  })
                }
              />
            ))}
            <button
              type="button"
              onClick={addTask}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-700 text-slate-500 hover:text-emerald-400 hover:border-emerald-700/50 text-xs py-2.5 transition-colors"
            >
              <Plus size={13} /> Add task
            </button>
          </section>

          <Divider label="Entry Media" />

          {/* ── Entry-level media ────────────────────────────────── */}
          <section className="flex flex-col gap-3">
            {draft.media.map((m, mi) => (
              <div
                key={mi}
                className="flex flex-col gap-2 p-3 rounded-xl border border-slate-800 bg-slate-950/40"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    {m.kind === "video" ? (
                      <VideoIcon size={12} />
                    ) : (
                      <ImageIcon size={12} />
                    )}
                    {m.kind === "video" ? "Video" : "Image"}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeMedia(mi)}
                    className="text-slate-600 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <FileDropZone
                  accept={m.kind === "video" ? "video/*" : "image/*"}
                  preview={m.preview}
                  kind={m.kind}
                  onChange={(f) => {
                    const preview = URL.createObjectURL(f);
                    updateMedia(mi, { file: f, preview });
                  }}
                />
                <input
                  value={m.caption}
                  onChange={(e) => updateMedia(mi, { caption: e.target.value })}
                  placeholder="Caption (optional)"
                  className={INPUT_CLS + " text-xs py-1.5"}
                />
              </div>
            ))}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => addMedia("image")}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-700 text-slate-500 hover:text-emerald-400 hover:border-emerald-700/50 text-xs py-2.5 transition-colors"
              >
                <ImageIcon size={13} /> Add image
              </button>
              <button
                type="button"
                onClick={() => addMedia("video")}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-700 text-slate-500 hover:text-emerald-400 hover:border-emerald-700/50 text-xs py-2.5 transition-colors"
              >
                <VideoIcon size={13} /> Add video
              </button>
            </div>
          </section>

          {err && (
            <p className="text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
              {err}
            </p>
          )}
        </form>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800 shrink-0">
          <button
            type="submit"
            form="entry-form"
            disabled={saving}
            className="w-full rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-sm font-semibold py-2.5 hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving
              ? isEdit
                ? "Updating…"
                : "Uploading & saving…"
              : isEdit
                ? "Update Entry"
                : "Save Entry"}
          </button>
        </div>
      </div>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────────

function Divider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-slate-800" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
        {label}
      </span>
      <div className="flex-1 h-px bg-slate-800" />
    </div>
  );
}

function TaskBlock({
  task,
  onUpdate,
  onRemove,
  onAddCompare,
  onRemoveCompare,
  onUpdateCompare,
  onCompareSideFile,
}: {
  task: TaskDraft;
  onUpdate: (p: Partial<TaskDraft>) => void;
  onRemove?: () => void;
  onAddCompare: () => void;
  onRemoveCompare: (ci: number) => void;
  onUpdateCompare: (ci: number, p: Partial<CompareDraft>) => void;
  onCompareSideFile: (ci: number, side: "before" | "after", f: File) => void;
}) {
  return (
    <div className="flex flex-col gap-3 p-3.5 rounded-xl border border-slate-800 bg-slate-950/40">
      <div className="flex items-start gap-2">
        <input
          value={task.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Task description"
          className="flex-1 bg-transparent text-sm text-slate-200 outline-none placeholder:text-slate-600"
        />
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-slate-600 hover:text-red-400 transition-colors shrink-0 mt-0.5"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <select
          value={task.type}
          onChange={(e) =>
            onUpdate({ type: e.target.value as TaskDraft["type"] })
          }
          className={SEL_CLS + " w-full"}
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <select
          value={task.status}
          onChange={(e) =>
            onUpdate({ status: e.target.value as Task["status"] })
          }
          className={SEL_CLS + " w-full"}
        >
          <option value="done">Done</option>
          <option value="progress">In Progress</option>
          <option value="planned">Planned</option>
        </select>
        <select
          value={task.priority ?? ""}
          onChange={(e) =>
            onUpdate({
              priority: (e.target.value as Task["priority"]) || undefined,
            })
          }
          className={SEL_CLS + " w-full"}
        >
          <option value="">Priority</option>
          <option value="urgent">🔴 Urgent</option>
          <option value="major">🟡 Major</option>
          <option value="minor">🔵 Minor</option>
        </select>
        <select
          value={task.complexity ?? ""}
          onChange={(e) =>
            onUpdate({
              complexity: (e.target.value as Task["complexity"]) || undefined,
            })
          }
          className={SEL_CLS + " w-full"}
        >
          <option value="">Complexity</option>
          <option value="simple">Simple</option>
          <option value="hard">Hard</option>
          <option value="complex">Complex</option>
        </select>
      </div>
      <input
        value={task.dateRange}
        onChange={(e) => onUpdate({ dateRange: e.target.value })}
        placeholder="Description (optional)"
        className={SEL_CLS + " w-full placeholder:text-slate-600"}
      />

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Tags
        </span>
        {TASK_TAGS.map((tag) => {
          const active = task.tags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() =>
                onUpdate({
                  tags: active
                    ? task.tags.filter((t) => t !== tag)
                    : [...task.tags, tag],
                })
              }
              className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-colors ${
                active
                  ? "border-emerald-500/50 bg-emerald-400/10 text-emerald-300"
                  : "border-slate-700 text-slate-500 hover:border-slate-600 hover:text-slate-400"
              }`}
            >
              #{tag}
            </button>
          );
        })}
      </div>

      {task.compare.map((cmp, ci) => (
        <CompareEditor
          key={ci}
          compare={cmp}
          onRemove={() => onRemoveCompare(ci)}
          onUpdate={(p) => onUpdateCompare(ci, p)}
          onSideFile={(side, f) => onCompareSideFile(ci, side, f)}
        />
      ))}

      <button
        type="button"
        onClick={onAddCompare}
        className="flex items-center gap-1.5 text-[11px] text-slate-600 hover:text-emerald-400 transition-colors w-fit"
      >
        <ArrowRight size={11} /> Add before/after compare
      </button>
    </div>
  );
}

function CompareEditor({
  compare,
  onRemove,
  onUpdate,
  onSideFile,
}: {
  compare: CompareDraft;
  onRemove: () => void;
  onUpdate: (p: Partial<CompareDraft>) => void;
  onSideFile: (side: "before" | "after", f: File) => void;
}) {
  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-slate-800 bg-slate-900/60 p-2.5">
      <div className="flex items-center gap-2">
        <input
          value={compare.label}
          onChange={(e) => onUpdate({ label: e.target.value })}
          placeholder="Compare label (optional, e.g. Login page)"
          className="flex-1 bg-transparent text-xs text-slate-400 outline-none placeholder:text-slate-600"
        />
        <button
          type="button"
          onClick={onRemove}
          className="text-slate-600 hover:text-red-400 transition-colors shrink-0"
        >
          <Trash2 size={12} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <CompareSide
          label="Before"
          color="text-orange-300"
          data={compare.before}
          onFile={(f) => onSideFile("before", f)}
          onNote={(note) => onUpdate({ before: { ...compare.before, note } })}
        />
        <CompareSide
          label="After"
          color="text-emerald-300"
          data={compare.after}
          onFile={(f) => onSideFile("after", f)}
          onNote={(note) => onUpdate({ after: { ...compare.after, note } })}
        />
      </div>
    </div>
  );
}

function CompareSide({
  label,
  color,
  data,
  onFile,
  onNote,
}: {
  label: string;
  color: string;
  data: CompareDraft["before"];
  onFile: (f: File) => void;
  onNote: (note: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-col gap-1.5">
      <span
        className={`text-[9px] font-bold tracking-widest uppercase ${color}`}
      >
        {label}
      </span>
      {data.preview ? (
        <img
          src={data.preview}
          alt={label}
          className="w-full h-16 object-cover rounded border border-slate-800 cursor-pointer"
          onClick={() => fileRef.current?.click()}
        />
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex items-center justify-center w-full h-16 rounded border border-dashed border-slate-700 text-slate-600 hover:border-emerald-700/50 hover:text-emerald-400 transition-colors"
        >
          <ImageIcon size={14} />
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      <input
        value={data.note}
        onChange={(e) => onNote(e.target.value)}
        placeholder="Note..."
        className="bg-transparent text-[10px] text-slate-400 outline-none placeholder:text-slate-600 border-b border-slate-800 pb-0.5"
      />
    </div>
  );
}

function FileDropZone({
  accept,
  preview,
  kind,
  onChange,
}: {
  accept: string;
  preview: string;
  kind: "image" | "video";
  onChange: (f: File) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onChange(e.target.files[0])}
      />
      {preview ? (
        kind === "video" ? (
          <video
            src={preview}
            controls
            className="w-full h-32 object-cover rounded-lg border border-slate-800 bg-slate-950"
          />
        ) : (
          <img
            src={preview}
            alt=""
            className="w-full h-32 object-cover rounded-lg border border-slate-800 cursor-pointer"
            onClick={() => fileRef.current?.click()}
          />
        )
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 w-full h-24 rounded-lg border border-dashed border-slate-700 text-slate-600 hover:border-emerald-700/50 hover:text-emerald-400 transition-colors"
        >
          {kind === "video" ? <VideoIcon size={18} /> : <ImageIcon size={18} />}
          <span className="text-[11px]">Click to upload {kind}</span>
        </button>
      )}
    </>
  );
}
