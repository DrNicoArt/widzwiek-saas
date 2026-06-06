"use client";
// Rozwiązuje projekt po id: realny job workera (edytowalny, trwały) albo materiał demo (read-only).
import { useCallback, useEffect, useState } from "react";
import type { CaptionDocument } from "./contract";
import { getProject as getDemoProject, getProjectDoc } from "./projects";
import { getJob } from "./api";

export type ProjectStatus = "queued" | "processing" | "done" | "review" | "error";

export interface ProjectView {
  loading: boolean;
  found: boolean;
  real: boolean; // realny job workera => edytowalny
  title: string;
  status: ProjectStatus;
  doc: CaptionDocument | null;
  createdAt?: string;
}

export function useProject(id: string) {
  const [v, setV] = useState<ProjectView>({
    loading: true, found: false, real: false, title: "", status: "processing", doc: null,
  });

  const load = useCallback(() => {
    const demo = getDemoProject(id);
    if (demo) {
      setV({ loading: false, found: true, real: false, title: demo.title, status: demo.status, doc: getProjectDoc(id) });
      return;
    }
    getJob(id)
      .then((j) => setV({
        loading: false, found: true, real: true,
        title: j.filename || "Materiał", status: (j.status as ProjectStatus) ?? "processing", doc: j.result ?? null,
        createdAt: j.created_at,
      }))
      .catch(() => setV({ loading: false, found: false, real: false, title: "", status: "error", doc: null }));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const setDoc = (d: CaptionDocument) => setV((s) => ({ ...s, doc: d }));
  return { ...v, refresh: load, setDoc };
}
