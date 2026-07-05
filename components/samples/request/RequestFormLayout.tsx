"use client";

import type { ReactNode } from "react";

type Props = {
  toolbar: ReactNode;
  header: ReactNode;
  samples: ReactNode;
  detail: ReactNode;
  footer?: ReactNode;
  legacy?: ReactNode;
};

export function RequestFormLayout({ toolbar, header, samples, detail, footer, legacy }: Props) {
  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-3">
      <div className="sticky top-0 z-20 -mx-1 rounded-xl border border-slate-200/80 bg-slate-50/95 px-3 py-2.5 shadow-sm backdrop-blur-sm">
        {toolbar}
      </div>

      <section className="shrink-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        {header}
      </section>

      <div className="flex min-h-0 flex-1 flex-col gap-3 xl:flex-row xl:items-stretch">
        <section className="flex min-h-[220px] min-w-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm xl:h-[calc(100vh-22rem)] xl:flex-[45]">
          {samples}
        </section>
        <section className="flex min-h-[280px] min-w-0 flex-col rounded-xl border border-slate-200 bg-white shadow-sm xl:h-[calc(100vh-22rem)] xl:flex-[55]">
          {detail}
        </section>
      </div>

      {legacy ? (
        <section className="shrink-0 rounded-xl border border-slate-100 bg-slate-50 p-3">{legacy}</section>
      ) : null}

      {footer ? <div className="shrink-0">{footer}</div> : null}
    </div>
  );
}
