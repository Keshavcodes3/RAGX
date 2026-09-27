"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { ragxApi, type Project } from "./ragx-api";

interface ProjectContextValue {
  projects: Project[];
  projectId: string | null;
  setProjectId: (id: string) => void;
  authed: boolean;
  loading: boolean;
  refresh: () => void;
}

const ProjectContext = createContext<ProjectContextValue>({
  projects: [],
  projectId: null,
  setProjectId: () => {},
  authed: false,
  loading: true,
  refresh: () => {},
});

const STORAGE_KEY = "ragx:projectId";

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectIdState] = useState<string | null>(null);
  const [authed, setAuthed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        await ragxApi.me();
        const list = await ragxApi.projects();
        if (cancelled) return;
        setAuthed(true);
        setProjects(list);
        const stored =
          typeof window !== "undefined"
            ? window.localStorage.getItem(STORAGE_KEY)
            : null;
        const valid =
          stored && list.some((p) => p.id === stored) ? stored : null;
        setProjectIdState(valid ?? list[0]?.id ?? null);
      } catch {
        if (cancelled) return;
        setAuthed(false);
        setProjects([]);
        setProjectIdState(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const setProjectId = useCallback((id: string) => {
    setProjectIdState(id);
    try {
      window.localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Non-fatal: selection just won't persist.
    }
  }, []);

  const value = useMemo(
    () => ({ projects, projectId, setProjectId, authed, loading, refresh }),
    [projects, projectId, setProjectId, authed, loading, refresh],
  );

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  return useContext(ProjectContext);
}

export function ProjectSelect() {
  const { projects, projectId, setProjectId } = useProjects();

  if (projects.length === 0) return null;

  return (
    <label className="flex items-center gap-2 text-[13px] text-[#6E6E73]">
      Project
      <select
        value={projectId ?? ""}
        onChange={(e) => setProjectId(e.target.value)}
        className="rounded-md border border-[#E8E8ED] bg-white px-2.5 py-1.5 text-[13px] text-[#1D1D1F] outline-none focus:border-[#1D1D1F]"
      >
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
}
