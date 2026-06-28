import type { DilutionProcedure } from "@/lib/chem-info/calculators/dilution";

type Props = {
  procedure: DilutionProcedure;
};

export function DilutionProcedureSteps({ procedure }: Props) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200">
      <p className="mb-2 text-xs font-medium text-slate-600">Hướng dẫn thao tác</p>
      <ol className="list-decimal space-y-1 pl-4 text-sm text-slate-800">
        {procedure.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {procedure.note ? (
        <p className="mt-2 text-xs text-slate-500">{procedure.note}</p>
      ) : null}
    </div>
  );
}
