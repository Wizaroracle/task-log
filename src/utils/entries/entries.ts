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
  description?: string;
  type?: "feature" | "bugfix" | "task" | "milestone" | "learning" | "optimized" | "refactor";
  status: "done" | "progress" | "planned" | "deployment";
  priority?: "urgent" | "major" | "minor";
  complexity?: "simple" | "hard" | "complex";
  dateRange?: string;
  tags?: string[];
  sortOrder?: number;
  compare?: CompareItem[];
  media?: EntryMedia[];
  featureId?: string;
};

// Supabase table: features
// Run this SQL in your Supabase dashboard:
//   CREATE TABLE features (
//     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//     name text NOT NULL,
//     color text DEFAULT '#6366f1',
//     description text,
//     created_at timestamptz DEFAULT now()
//   );
//   ALTER TABLE features ENABLE ROW LEVEL SECURITY;
//   CREATE POLICY "Allow all" ON features FOR ALL USING (true);
export type Feature = {
  id: string;
  name: string;
  color: string;
  description?: string;
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

// Supabase table: raised_issues
// Run this SQL in your Supabase dashboard:
//   CREATE TABLE raised_issues (
//     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
//     project text NOT NULL,
//     title text NOT NULL,
//     description text,
//     type text DEFAULT 'bugfix',
//     priority text DEFAULT 'major',
//     status text DEFAULT 'open',
//     date_raised date NOT NULL DEFAULT CURRENT_DATE,
//     date_resolved date,
//     created_at timestamptz DEFAULT now()
//   );
//   ALTER TABLE raised_issues ENABLE ROW LEVEL SECURITY;
//   CREATE POLICY "Allow all" ON raised_issues FOR ALL USING (true);
export type RaisedIssue = {
  id: string;
  project: string;
  title: string;
  description?: string;
  type: "bugfix" | "feature" | "optimized" | "task" | "milestone" | "learning" | "refactor" | "other";
  priority: "urgent" | "major" | "minor";
  status: "open" | "in_progress" | "deployment" | "resolved";
  date_raised: string;
  date_started?: string;
  date_resolved?: string;
  media?: EntryMedia[];
  compare?: CompareItem[];
};
