// ════════════════════════════════════════════════════════════════════
// Types — shared across the app and Supabase row shape
// ════════════════════════════════════════════════════════════════════

export type EntryMedia = {
  kind: "image" | "video";
  src: string;
  caption?: string;
};

export type CompareItem = {
  label?: string;
  before: { src: string; note: string };
  after: { src: string; note: string };
};

export type Task = {
  title: string;
  type?: "feature" | "bugfix" | "task" | "milestone" | "learning";
  status: "done" | "progress" | "planned";
  priority?: "urgent" | "major" | "minor";
  complexity?: "simple" | "hard" | "complex";
  dateRange?: string;
  sortOrder?: number;
  compare?: CompareItem[];
};

export type Entry = {
  id: string;
  project: "VC+" | "VC+ CMS";
  date: string;
  title: string;
  tasks: Task[];
  tags?: string[];
  media?: EntryMedia[];
};
