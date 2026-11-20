import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { Layout, Project } from "../types";
import { HEADINGS, type Resolved, type ResolvedCover } from "../lib/resolve";
import { joinNonEmpty } from "../lib/util";

const FONTS = {
  sans: '"Noto Sans TC","PingFang TC","Microsoft JhengHei","Heiti TC",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif',
  serif: '"Noto Serif TC","PMingLiU","Songti TC","Source Han Serif TC",Georgia,"Times New Roman",serif',
};

const MM = 3.7795;
const PAPER = {
  A4: { w: 210, h: 297 },
  Letter: { w: 215.9, h: 279.4 },
};

const docStyle = (layout: Layout): CSSProperties => ({
  fontSize: `${layout.fontSize}pt`,
  fontFamily: FONTS[layout.font],
  lineHeight: 1.45,
  color: "#0f172a",
  overflowWrap: "anywhere",
  wordBreak: "break-word",
});

/* ------------------------------ Print portal ------------------------------ */

/** Renders children directly under <body> so that print output is not clipped by app scroll containers. */
export function PrintPortal({ layout, children }: { layout: Layout; children: ReactNode }) {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    const div = document.createElement("div");
    div.id = "print-portal";
    document.body.appendChild(div);
    setEl(div);
    return () => {
      div.remove();
    };
  }, []);
  if (!el) return null;
  return createPortal(
    <>
      <style>{`@page { size: ${layout.paper}; margin: ${layout.margin}mm; }`}</style>
      {children}
    </>,
    el,
  );
}

/* ------------------------------ Paper preview ------------------------------ */

export function PaperPreview({
  layout,
  children,
  onPages,
}: {
  layout: Layout;
  children: ReactNode;
  onPages?: (n: number) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [hostW, setHostW] = useState(760);
  const [h, setH] = useState(0);
  const paper = PAPER[layout.paper];
  const paperW = paper.w * MM;
  const paperH = paper.h * MM;
  const m = layout.margin * MM;

  useLayoutEffect(() => {
    const host = hostRef.current;
    const inner = innerRef.current;
    if (!host || !inner) return;
    const ro = new ResizeObserver(() => {
      setHostW(host.clientWidth);
      setH(inner.offsetHeight);
    });
    ro.observe(host);
    ro.observe(inner);
    setHostW(host.clientWidth);
    setH(inner.offsetHeight);
    return () => ro.disconnect();
  }, []);

  const contentH = Math.max(0, h - 2 * m);
  const perPage = paperH - 2 * m;
  const pages = Math.max(1, Math.ceil(contentH / perPage - 0.03));

  useEffect(() => {
    onPages?.(pages);
  }, [pages, onPages]);

  const scale = Math.min(1, Math.max(0.3, (hostW - 4) / paperW));
  const totalH = Math.max(paperH, h);

  return (
    <div ref={hostRef} className="w-full">
      <div className="mx-auto" style={{ width: paperW * scale, height: totalH * scale }}>
        <div
          ref={innerRef}
          className="relative bg-white shadow-lg ring-1 ring-slate-200"
          style={{
            width: paperW,
            minHeight: paperH,
            padding: m,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
          {Array.from({ length: pages - 1 }, (_, i) => (
            <div
              key={i}
              className="pointer-events-none absolute left-0 right-0 border-t border-dashed border-rose-300"
              style={{ top: m + (i + 1) * perPage }}
            >
              <span className="absolute right-1 -top-4 rounded bg-rose-50 px-1 text-[10px] text-rose-400">約第 {i + 2} 頁開始</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Resume ------------------------------ */

export function ResumeDocument({ r }: { r: Resolved }) {
  const H = HEADINGS[r.layout.headings];
  const s = r.layout.sections;
  const two = r.layout.columns === 2;

  const Heading = ({ children }: { children: ReactNode }) => (
    <h2
      className="mb-[0.4em] mt-[1em] border-b border-slate-300 pb-[0.15em] font-bold uppercase tracking-wide text-slate-800"
      style={{ fontSize: "0.95em", breakAfter: "avoid" }}
    >
      {children}
    </h2>
  );

  const summary =
    s.summary && r.summary ? (
      <section key="summary">
        <Heading>{H.summary}</Heading>
        <p className="whitespace-pre-wrap">{r.summary}</p>
      </section>
    ) : null;

  const experience =
    s.experience && r.experiences.length ? (
      <section key="exp">
        <Heading>{H.experience}</Heading>
        <div className="space-y-[0.8em]">
          {r.experiences.map((e) => (
            <div key={e.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3" style={{ breakAfter: "avoid" }}>
                <div className="font-semibold">
                  {e.role || "（未填職位）"}
                  {e.company && <span className="font-normal text-slate-600"> · {e.company}</span>}
                </div>
                {e.period && <div className="shrink-0 text-[0.9em] text-slate-600">{e.period}</div>}
              </div>
              {e.location && <div className="text-[0.88em] text-slate-500">{e.location}</div>}
              {e.bullets.length > 0 && (
                <ul className="mt-[0.2em] list-disc space-y-[0.15em] pl-[1.2em]">
                  {e.bullets.map((b) => (
                    <li key={b.id} className="whitespace-pre-wrap" style={{ breakInside: "avoid" }}>
                      {b.text}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>
    ) : null;

  const projects =
    s.projects && r.projects.length ? (
      <section key="proj">
        <Heading>{H.projects}</Heading>
        <div className="space-y-[0.7em]">
          {r.projects.map((p) => (
            <div key={p.id} style={{ breakInside: "avoid" }}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                <div className="font-semibold">
                  {p.name || "（未命名項目）"}
                  {p.role && <span className="font-normal text-slate-600"> · {p.role}</span>}
                </div>
                {p.period && <div className="shrink-0 text-[0.9em] text-slate-600">{p.period}</div>}
              </div>
              {p.summary && <p className="whitespace-pre-wrap">{p.summary}</p>}
              {p.results && (
                <p className="whitespace-pre-wrap">
                  <span className="font-semibold">{H.results}：</span>
                  {p.results}
                </p>
              )}
              {(p.link || p.tags.length > 0) && (
                <div className="text-[0.88em] text-slate-500">
                  {joinNonEmpty([p.link, p.tags.join(" / ")], "  ·  ")}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    ) : null;

  const skills =
    s.skills && r.skills.length ? (
      <section key="skills">
        <Heading>{H.skills}</Heading>
        <div className="space-y-[0.25em]">
          {r.skills.map((g) => (
            <div key={g.id}>
              <span className="font-semibold">{g.category}：</span>
              {g.items.join("、")}
            </div>
          ))}
        </div>
      </section>
    ) : null;

  const education =
    s.education && r.education.length ? (
      <section key="edu">
        <Heading>{H.education}</Heading>
        <div className="space-y-[0.4em]">
          {r.education.map((e) => (
            <div key={e.id} style={{ breakInside: "avoid" }}>
              <div className="font-semibold">{e.degree || e.school}</div>
              <div className="text-slate-600">{e.degree ? e.school : ""}</div>
              {(e.period || e.note) && <div className="text-[0.88em] text-slate-500">{joinNonEmpty([e.period, e.note], " · ")}</div>}
            </div>
          ))}
        </div>
      </section>
    ) : null;

  return (
    <div style={docStyle(r.layout)}>
      <header className="border-b-2 border-slate-800 pb-[0.5em]">
        <h1 className="font-bold leading-tight" style={{ fontSize: "2em" }}>
          {r.name || <span className="text-slate-300">（未填姓名）</span>}
        </h1>
        {r.title && <div className="mt-[0.1em] text-[1.1em] font-medium text-slate-700">{r.title}</div>}
        {r.contacts.length > 0 && (
          <div className="mt-[0.4em] flex flex-wrap gap-x-[1em] gap-y-0 text-[0.9em] text-slate-600">
            {r.contacts.map((c) => (
              <span key={c.key}>{c.value}</span>
            ))}
          </div>
        )}
      </header>
      {two ? (
        <div className="grid gap-x-[1.5em]" style={{ gridTemplateColumns: "minmax(0,1fr) 31%" }}>
          <div className="min-w-0">
            {summary}
            {experience}
            {projects}
          </div>
          <div className="min-w-0">
            {skills}
            {education}
          </div>
        </div>
      ) : (
        <div>
          {summary}
          {experience}
          {projects}
          {skills}
          {education}
        </div>
      )}
      {!summary && !experience && !projects && !skills && !education && (
        <p className="mt-6 text-center text-slate-400">此版本尚未啟用任何區塊，請到「版本內容」勾選。</p>
      )}
    </div>
  );
}

/* ------------------------------ Cover letter ------------------------------ */

export function CoverDocument({ c, layout }: { c: ResolvedCover; layout: Layout }) {
  return (
    <div style={{ ...docStyle(layout), lineHeight: 1.7 }}>
      <header className="mb-[1.5em] border-b border-slate-300 pb-[0.6em]">
        <div className="font-bold" style={{ fontSize: "1.5em" }}>
          {c.name || <span className="text-slate-300">（未填姓名）</span>}
        </div>
        {c.title && <div className="text-slate-600">{c.title}</div>}
        {c.contacts.length > 0 && <div className="text-[0.9em] text-slate-500">{c.contacts.join("  ·  ")}</div>}
      </header>
      {c.date && <p className="mb-[1em] text-slate-600">{c.date}</p>}
      <p className="mb-[1em]">{c.greeting}</p>
      {c.paragraphs.map((p) => (
        <p key={p.id} className="mb-[1em] whitespace-pre-wrap" style={{ breakInside: "avoid" }}>
          {p.text}
        </p>
      ))}
      {c.paragraphs.length === 0 && <p className="mb-4 text-slate-400">（尚未選取任何段落）</p>}
      <p className="mt-[1.5em] whitespace-pre-wrap">
        {c.signoff}
        {"\n"}
        <span className="font-semibold">{c.name}</span>
      </p>
    </div>
  );
}

/* ------------------------------ Portfolio ------------------------------ */

export function PortfolioDocument({ owner, projects, tags, layout }: { owner: string; projects: Project[]; tags: string[]; layout: Layout }) {
  return (
    <div style={docStyle(layout)}>
      <header className="mb-[1em] border-b-2 border-slate-800 pb-[0.5em]">
        <h1 className="font-bold" style={{ fontSize: "1.7em" }}>
          {owner ? `${owner} · ` : ""}作品集摘要
        </h1>
        <div className="text-[0.9em] text-slate-500">
          共 {projects.length} 個項目{tags.length > 0 && `｜篩選：${tags.join("、")}`}
        </div>
      </header>
      <div className="space-y-[1em]">
        {projects.map((p) => (
          <div key={p.id} style={{ breakInside: "avoid" }} className="border-l-4 border-indigo-200 pl-[0.8em]">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3">
              <div className="font-semibold" style={{ fontSize: "1.1em" }}>
                {p.name || "（未命名項目）"}
              </div>
              <div className="text-[0.9em] text-slate-500">{joinNonEmpty([p.role, p.period], " · ")}</div>
            </div>
            {p.tags.length > 0 && (
              <div className="my-[0.2em] flex flex-wrap gap-1">
                {p.tags.map((t) => (
                  <span key={t} className="rounded bg-slate-100 px-1.5 text-[0.8em] text-slate-600">
                    {t}
                  </span>
                ))}
              </div>
            )}
            {p.summary && <p className="whitespace-pre-wrap">{p.summary}</p>}
            {p.results && (
              <p className="whitespace-pre-wrap">
                <span className="font-semibold">成果：</span>
                {p.results}
              </p>
            )}
            {(p.link || p.linkNote) && (
              <p className="text-[0.88em] text-slate-500">
                {p.link}
                {p.link && p.linkNote ? "（" : ""}
                {p.linkNote}
                {p.link && p.linkNote ? "）" : ""}
              </p>
            )}
          </div>
        ))}
        {projects.length === 0 && <p className="text-slate-400">沒有符合條件的項目。</p>}
      </div>
    </div>
  );
}
