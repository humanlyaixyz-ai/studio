import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as db from '../../services/dbService';
import { ModelType, ProductCategory } from '../../types';
import type { Project } from '../../types';

/**
 * Shared, live source of truth for projects across the new UI (Dashboard, Projects,
 * workspace). Loads real rows from Supabase via services/dbService and exposes them
 * plus mutators that persist. Mount <ProjectsProvider> once above the routes.
 *
 * Notes on the mapping to the hi-fi card UI:
 *  - The DB Project has no "status"/"archived" column. We derive:
 *      setupDone = shots.length > 0  →  status "active", else "draft".
 *    "Archived" is a CLIENT-SIDE overlay (archivedIds) for now — it is NOT persisted
 *    until the schema gains a status column. Delete / Rename / Duplicate DO persist.
 */

export type ProjectStatus = 'active' | 'draft' | 'archived';

export interface ProjectVM {
  id: string;
  name: string;
  status: ProjectStatus;
  skus: number;
  services: number;
  edited: string;
  ageHours: number;
  setupDone: boolean;
  createdAt: number;
}

export function relativeTime(createdAt: number, now: number): string {
  const ms = Math.max(0, now - createdAt);
  const mins = Math.round(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} minute${mins === 1 ? '' : 's'} ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.round(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.round(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

export function toVM(
  p: Project,
  skuCount: number,
  archived: boolean,
  now: number,
): ProjectVM {
  const services = p.shots?.length ?? 0;
  const setupDone = services > 0;
  const createdAt = typeof p.createdAt === 'number' ? p.createdAt : Number(p.createdAt) || now;
  return {
    id: p.id,
    name: p.name || 'Untitled Project',
    status: archived ? 'archived' : setupDone ? 'active' : 'draft',
    skus: skuCount,
    services,
    edited: relativeTime(createdAt, now),
    ageHours: Math.max(0, now - createdAt) / 3_600_000,
    setupDone,
    createdAt,
  };
}

interface ProjectsCtx {
  projects: Project[];
  skuCounts: Record<string, number>;
  archivedIds: Set<string>;
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  reload: () => void;
  select: (id: string | null) => void;
  create: (project: Project) => Promise<Project>;
  remove: (id: string) => Promise<void>;
  rename: (id: string, name: string) => Promise<void>;
  duplicate: (id: string) => Promise<void>;
  setArchived: (id: string, on: boolean) => void;
}

const Ctx = createContext<ProjectsCtx | null>(null);

const SELECTED_KEY = 'ovarly.selectedProject';

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [skuCounts, setSkuCounts] = useState<Record<string, number>>({});
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(
    () => (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(SELECTED_KEY) : null),
  );
  const [reloadKey, setReloadKey] = useState(0);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    try {
      if (id) sessionStorage.setItem(SELECTED_KEY, id);
      else sessionStorage.removeItem(SELECTED_KEY);
    } catch { /* sessionStorage unavailable — selection stays in memory only */ }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([db.loadProjects(), db.loadSkuCounts()])
      .then(([rows, counts]) => {
        if (cancelled) return;
        setProjects(rows);
        setSkuCounts(counts);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Failed to load projects');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const create = useCallback(async (project: Project) => {
    setProjects((prev) => [project, ...prev]);
    select(project.id);
    try {
      await db.saveProject(project);
      if (project.assets && Object.keys(project.assets).length > 0) {
        db.uploadProjectAssets(project.id, project.assets).catch((e) => console.error('[projects] uploadAssets:', e));
      }
    } catch (e) {
      console.error('[projects] create:', e);
      reload();
    }
    return project;
  }, [select, reload]);

  const remove = useCallback(async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    try { await db.deleteProject(id); } catch (e) { console.error('[projects] delete:', e); reload(); }
  }, [reload]);

  const rename = useCallback(async (id: string, name: string) => {
    let updated: Project | undefined;
    setProjects((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      updated = { ...p, name };
      return updated;
    }));
    if (updated) {
      try { await db.saveProject(updated); } catch (e) { console.error('[projects] rename:', e); reload(); }
    }
  }, [reload]);

  const duplicate = useCallback(async (id: string) => {
    const src = projects.find((p) => p.id === id);
    if (!src) return;
    const now = Date.now();
    const copy: Project = {
      ...src,
      id: `${now}`,
      name: `${src.name} (copy)`,
      createdAt: now,
      category: src.category ?? ProductCategory.TOP,
      model: src.model ?? ModelType.ECOM_SHOOT,
    };
    setProjects((prev) => [copy, ...prev]);
    try { await db.saveProject(copy); } catch (e) { console.error('[projects] duplicate:', e); reload(); }
  }, [projects, reload]);

  const setArchived = useCallback((id: string, on: boolean) => {
    setArchivedIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(id); else next.delete(id);
      return next;
    });
  }, []);

  const value = useMemo<ProjectsCtx>(() => ({
    projects, skuCounts, archivedIds, loading, error, selectedId,
    reload, select, create, remove, rename, duplicate, setArchived,
  }), [projects, skuCounts, archivedIds, loading, error, selectedId, reload, select, create, remove, rename, duplicate, setArchived]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProjects(): ProjectsCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProjects must be used within <ProjectsProvider>');
  return ctx;
}
