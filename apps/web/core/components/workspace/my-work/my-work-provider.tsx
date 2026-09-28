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
import { useTranslation } from "@plane/i18n";
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
  stateFilter: string;
  setStateFilter: (s: string) => void;
  hideDone: boolean;
  toggleHideDone: () => void;
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
  const { t } = useTranslation();
  const [items, setItems] = useState<TUserAssignedIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeDone, setIncludeDoneState] = useState(false);
  const [stateFilter, setStateFilterState] = useState<string>("all");
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
    const timer = window.setTimeout(() => {
      setPageState(1);
      setSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const refresh = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const data = await service.assignedIssuesAcrossWorkspaces({
        include_done: includeDone || stateFilter === "completed" || stateFilter === "cancelled",
        state_filter: stateFilter !== "all" ? stateFilter : undefined,
        page,
        page_size: pageSize,
        workspace_slug: workspaceSlug || undefined,
        project_id: projectId || undefined,
        priority: priority || undefined,
        q: search || undefined,
      });
      if (requestId !== requestIdRef.current) return;
      let rawResults = Array.isArray(data?.results) ? data.results : [];
      if (stateFilter === "hide_done") {
        rawResults = rawResults.filter(
          (i) => i.state?.group !== "completed" && i.state?.group !== "cancelled"
        );
      } else if (stateFilter && stateFilter !== "all") {
        rawResults = rawResults.filter((i) => i.state?.group === stateFilter);
      }
      setItems(rawResults);
      setTotal(data?.count || 0);
      setTotalPages(data?.total_pages || 1);
      setWorkspaces(data?.facets?.workspaces || []);
      setProjects(data?.facets?.projects || []);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setItems([]);
      setTotal(0);
      setTotalPages(1);
      setError(t("my_work_board.load_error"));
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  }, [includeDone, stateFilter, page, pageSize, workspaceSlug, projectId, priority, search, t]);

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
  const hideDone = stateFilter === "hide_done";
  const toggleHideDone = useCallback(() => {
    setPageState(1);
    setStateFilterState((prev) => (prev === "hide_done" ? "all" : "hide_done"));
  }, []);
  const setStateFilter = useCallback((s: string) => {
    setPageState(1);
    setStateFilterState(s);
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
    workspaceSlug ||
      projectId ||
      priority ||
      (stateFilter && stateFilter !== "all") ||
      search ||
      searchInput.trim() ||
      includeDone
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
    setStateFilterState("all");
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
      stateFilter,
      setStateFilter,
      hideDone,
      toggleHideDone,
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
      stateFilter,
      setStateFilter,
      hideDone,
      toggleHideDone,
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
