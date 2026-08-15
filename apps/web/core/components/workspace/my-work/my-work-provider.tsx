/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { EIssueLayoutTypes } from "@plane/types";
import { IssueService } from "@/services/issue/issue.service";
import { ProjectStateService } from "@/services/project/project-state.service";
import { UserService, type TUserAssignedIssue } from "@/services/user.service";

const service = new UserService();
export const myWorkIssueService = new IssueService();
export const myWorkStateService = new ProjectStateService();

export type TMyWorkLayout = "list" | "board" | "calendar" | "timeline";

type TWorkspaceFacet = { slug: string; name: string };
type TProjectFacet = { id: string; identifier: string; name: string; workspace_slug: string };

type TMyWorkContext = {
  items: TUserAssignedIssue[];
  setItems: React.Dispatch<React.SetStateAction<TUserAssignedIssue[]>>;
  loading: boolean;
  error: string | null;
  total: number;
  totalPages: number;
  page: number;
  setPage: (page: number | ((prev: number) => number)) => void;
  pageSize: number;
  layout: TMyWorkLayout;
  setLayout: (layout: TMyWorkLayout) => void;
  layoutAsIssueType: EIssueLayoutTypes;
  includeDone: boolean;
  setIncludeDone: (v: boolean) => void;
  workspaceSlug: string;
  setWorkspaceSlug: (slug: string) => void;
  projectId: string;
  setProjectId: (id: string) => void;
  priority: string;
  setPriority: (p: string) => void;
  searchInput: string;
  setSearchInput: (q: string) => void;
  clearSearch: () => void;
  workspaces: TWorkspaceFacet[];
  projects: TProjectFacet[];
  filteredProjects: TProjectFacet[];
  hasActiveFilters: boolean;
  clearFilters: () => void;
  refresh: () => Promise<void>;
};

const MyWorkContext = createContext<TMyWorkContext | null>(null);

export function layoutToIssueType(layout: TMyWorkLayout): EIssueLayoutTypes {
  switch (layout) {
    case "board":
      return EIssueLayoutTypes.KANBAN;
    case "calendar":
      return EIssueLayoutTypes.CALENDAR;
    case "timeline":
      return EIssueLayoutTypes.GANTT;
    case "list":
    default:
      return EIssueLayoutTypes.LIST;
  }
}

export function issueTypeToLayout(type: EIssueLayoutTypes): TMyWorkLayout | null {
  switch (type) {
    case EIssueLayoutTypes.LIST:
      return "list";
    case EIssueLayoutTypes.KANBAN:
      return "board";
    case EIssueLayoutTypes.CALENDAR:
      return "calendar";
    case EIssueLayoutTypes.GANTT:
      return "timeline";
    default:
      return null;
  }
}

export function MyWorkProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<TUserAssignedIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeDone, setIncludeDoneState] = useState(false);
  const [layout, setLayoutState] = useState<TMyWorkLayout>("list");
  const [page, setPageState] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [workspaceSlug, setWorkspaceSlugState] = useState("");
  const [projectId, setProjectIdState] = useState("");
  const [priority, setPriorityState] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [workspaces, setWorkspaces] = useState<TWorkspaceFacet[]>([]);
  const [projects, setProjects] = useState<TProjectFacet[]>([]);
  const requestIdRef = useRef(0);

  const pageSize = layout === "list" ? 25 : 200;

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPageState(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await service.assignedIssuesAcrossWorkspaces({
        include_done: includeDone,
        page,
        page_size: pageSize,
        workspace_slug: workspaceSlug || undefined,
        project_id: projectId || undefined,
        priority: priority || undefined,
        q: search || undefined,
      });
      if (requestId !== requestIdRef.current) return;
      setItems(Array.isArray(data?.results) ? data.results : []);
      setTotal(data?.count || 0);
      setTotalPages(data?.total_pages || 1);
      setWorkspaces(data?.facets?.workspaces || []);
      setProjects(data?.facets?.projects || []);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setError("بارگذاری کارهای من انجام نشد.");
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [includeDone, page, pageSize, workspaceSlug, projectId, priority, search]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const setPage = useCallback((next: number | ((prev: number) => number)) => {
    setPageState((prev) => (typeof next === "function" ? next(prev) : next));
  }, []);
  const setLayout = useCallback((next: TMyWorkLayout) => {
    setPageState(1);
    setLayoutState(next);
  }, []);
  const setIncludeDone = useCallback((v: boolean) => {
    setPageState(1);
    setIncludeDoneState(v);
  }, []);
  const setWorkspaceSlug = useCallback((slug: string) => {
    setPageState(1);
    setWorkspaceSlugState(slug);
    setProjectIdState("");
  }, []);
  const setProjectId = useCallback((id: string) => {
    setPageState(1);
    setProjectIdState(id);
  }, []);
  const setPriority = useCallback((p: string) => {
    setPageState(1);
    setPriorityState(p);
  }, []);

  const filteredProjects = useMemo(
    () => (workspaceSlug ? projects.filter((p) => p.workspace_slug === workspaceSlug) : projects),
    [projects, workspaceSlug]
  );

  const hasActiveFilters = Boolean(
    workspaceSlug || projectId || priority || search || searchInput.trim() || includeDone
  );

  const clearSearch = useCallback(() => {
    setPageState(1);
    setSearchInput("");
    setSearch("");
  }, []);

  const clearFilters = useCallback(() => {
    setPageState(1);
    setWorkspaceSlugState("");
    setProjectIdState("");
    setPriorityState("");
    setSearchInput("");
    setSearch("");
    setIncludeDoneState(false);
  }, []);

  const value = useMemo<TMyWorkContext>(
    () => ({
      items,
      setItems,
      loading,
      error,
      total,
      totalPages,
      page,
      setPage,
      pageSize,
      layout,
      setLayout,
      layoutAsIssueType: layoutToIssueType(layout),
      includeDone,
      setIncludeDone,
      workspaceSlug,
      setWorkspaceSlug,
      projectId,
      setProjectId,
      priority,
      setPriority,
      searchInput,
      setSearchInput,
      clearSearch,
      workspaces,
      projects,
      filteredProjects,
      hasActiveFilters,
      clearFilters,
      refresh,
    }),
    [
      items,
      loading,
      error,
      total,
      totalPages,
      page,
      setPage,
      pageSize,
      layout,
      setLayout,
      includeDone,
      setIncludeDone,
      workspaceSlug,
      setWorkspaceSlug,
      projectId,
      setProjectId,
      priority,
      setPriority,
      searchInput,
      clearSearch,
      workspaces,
      projects,
      filteredProjects,
      hasActiveFilters,
      clearFilters,
      refresh,
    ]
  );

  return <MyWorkContext.Provider value={value}>{children}</MyWorkContext.Provider>;
}

export function useMyWork() {
  const ctx = useContext(MyWorkContext);
  if (!ctx) throw new Error("useMyWork must be used within MyWorkProvider");
  return ctx;
}
