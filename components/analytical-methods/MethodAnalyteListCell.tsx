import {
  formatTestMethodGroupLine,
  formatTestMethodsTooltip,
  groupTestMethodsByCategory,
} from "@/lib/catalog/test-method-label";
import type { MethodTestMethodSummary } from "@/types/analytical-methods";

type Props = {
  testMethods: MethodTestMethodSummary[];
};

export function MethodAnalyteListCell({ testMethods }: Props) {
  if (testMethods.length === 0) {
    return <span className="text-slate-400">—</span>;
  }

  const groups = groupTestMethodsByCategory(testMethods);
  const tooltip = formatTestMethodsTooltip(testMethods);

  return (
    <div
      className="max-w-[280px] cursor-help whitespace-normal text-sm leading-snug text-slate-700"
      title={tooltip}
    >
      {groups.map(({ categoryName, items }) => {
        const line = formatTestMethodGroupLine(categoryName, items);
        return (
          <div key={categoryName}>
            <span className="font-medium text-slate-800">{line.categoryName}</span>
            {line.count > 1 ? (
              <span className="text-slate-500"> ({line.count})</span>
            ) : null}
            <span>: </span>
            <span>{line.visibleNames.join(", ")}</span>
            {line.overflow > 0 ? (
              <span className="font-medium text-slate-500"> +{line.overflow}</span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
