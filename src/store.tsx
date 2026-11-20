import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { AppData, Master, TabKey, Version } from "./types";
import { clearStorage, loadFromStorage, saveToStorage } from "./lib/storage";
import { analyzeJD, type Analysis } from "./lib/keywords";
import { resolveResume, resumeToText, countActive, type Resolved } from "./lib/resolve";
import { blankVersion, cloneVersion, emptyAppData, versionFromMaster } from "./lib/versions";
import { buildSampleData } from "./sampleData";

interface Store {
  data: AppData;
  master: Master;
  version: Version;
  resolved: Resolved;
  counts: ReturnType<typeof countActive>;
  analysis: Analysis;
  savedAt: number | null;
  pending: boolean;
  saveError: string | null;
  tab: TabKey;
  setTab: (t: TabKey) => void;
  /** mutate a deep clone of the whole data tree */
  mutate: (fn: (d: AppData) => void) => void;
  /** mutate the active version (touches updatedAt) */
  mutateVersion: (fn: (v: Version, master: Master) => void) => void;
  /** mutate master data */
  mutateMaster: (fn: (m: Master) => void) => void;
  setActive: (id: string) => void;
  addVersion: (mode: "master" | "blank", name?: string) => string;
  duplicateVersion: (id: string) => string | null;
  deleteVersion: (id: string) => void;
  replaceData: (d: AppData) => void;
  resetToBlank: () => void;
  loadSample: () => void;
  clearAll: () => void;
  flushSave: () => void;
}

const Ctx = createContext<Store | null>(null);

export function useStore(): Store {
  const c = useContext(Ctx);
  if (!c) throw new Error("StoreProvider missing");
  return c;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const initial = useRef<ReturnType<typeof loadFromStorage> | null>(null);
  if (!initial.current) initial.current = loadFromStorage();

  const [data, setData] = useState<AppData>(initial.current.data);
  const [savedAt, setSavedAt] = useState<number | null>(initial.current.savedAt);
  const [pending, setPending] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("versions");

  const skipNext = useRef(!initial.current.fresh); // loaded from storage → nothing to write yet
  const latest = useRef(data);
  const dirty = useRef(false);
  latest.current = data;

  const write = useCallback(() => {
    try {
      const ts = saveToStorage(latest.current);
      setSavedAt(ts);
      setSaveError(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "無法寫入瀏覽器儲存空間（可能已滿或被停用）");
    }
    dirty.current = false;
    setPending(false);
  }, []);

  useEffect(() => {
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    dirty.current = true;
    setPending(true);
    const t = setTimeout(write, 350);
    return () => clearTimeout(t);
  }, [data, write]);

  useEffect(() => {
    const flush = () => {
      if (dirty.current) write();
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
    };
  }, [write]);

  const mutate = useCallback((fn: (d: AppData) => void) => {
    setData((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
  }, []);

  const mutateVersion = useCallback(
    (fn: (v: Version, master: Master) => void) => {
      mutate((d) => {
        const v = d.versions.find((x) => x.id === d.activeId);
        if (!v) return;
        fn(v, d.master);
        v.updatedAt = Date.now();
      });
    },
    [mutate],
  );

  const mutateMaster = useCallback((fn: (m: Master) => void) => mutate((d) => fn(d.master)), [mutate]);

  const version = useMemo(() => data.versions.find((v) => v.id === data.activeId) ?? data.versions[0], [data]);
  const resolved = useMemo(() => resolveResume(data.master, version), [data.master, version]);
  const counts = useMemo(() => countActive(resolved), [resolved]);
  const resumeText = useMemo(() => resumeToText(resolved), [resolved]);
  const analysis = useMemo(() => analyzeJD(version.jd, data.master, resumeText), [version.jd, data.master, resumeText]);

  const setActive = useCallback((id: string) => mutate((d) => void (d.versions.some((v) => v.id === id) && (d.activeId = id))), [mutate]);

  const addVersion = useCallback(
    (mode: "master" | "blank", name?: string) => {
      let newId = "";
      mutate((d) => {
        const nm = name?.trim() || `新版本 ${d.versions.length + 1}`;
        const v = mode === "master" ? versionFromMaster(d.master, nm) : blankVersion(d.master, nm);
        d.versions.push(v);
        d.activeId = v.id;
        newId = v.id;
      });
      return newId;
    },
    [mutate],
  );

  const duplicateVersion = useCallback(
    (id: string) => {
      let newId: string | null = null;
      mutate((d) => {
        const src = d.versions.find((v) => v.id === id);
        if (!src) return;
        const copy = cloneVersion(src, `${src.name}（複本）`);
        const idx = d.versions.findIndex((v) => v.id === id);
        d.versions.splice(idx + 1, 0, copy);
        d.activeId = copy.id;
        newId = copy.id;
      });
      return newId;
    },
    [mutate],
  );

  const deleteVersion = useCallback(
    (id: string) =>
      mutate((d) => {
        if (d.versions.length <= 1) {
          // keep at least one version
          const fresh = versionFromMaster(d.master, "我的第一個版本");
          d.versions = [fresh];
          d.activeId = fresh.id;
          return;
        }
        const idx = d.versions.findIndex((v) => v.id === id);
        if (idx < 0) return;
        d.versions.splice(idx, 1);
        if (d.activeId === id) d.activeId = d.versions[Math.max(0, idx - 1)].id;
      }),
    [mutate],
  );

  const replaceData = useCallback((d: AppData) => setData(d), []);
  const resetToBlank = useCallback(() => setData(emptyAppData()), []);
  const loadSample = useCallback(() => setData(buildSampleData()), []);

  const clearAll = useCallback(() => {
    clearStorage();
    skipNext.current = true; // do not immediately re-write the blank workspace
    dirty.current = false;
    setData(emptyAppData());
    setSavedAt(null);
    setPending(false);
    setSaveError(null);
  }, []);

  const value: Store = {
    data,
    master: data.master,
    version,
    resolved,
    counts,
    analysis,
    savedAt,
    pending,
    saveError,
    tab,
    setTab,
    mutate,
    mutateVersion,
    mutateMaster,
    setActive,
    addVersion,
    duplicateVersion,
    deleteVersion,
    replaceData,
    resetToBlank,
    loadSample,
    clearAll,
    flushSave: write,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
