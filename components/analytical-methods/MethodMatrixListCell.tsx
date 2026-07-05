import {
  formatMatrixGroupLine,
  formatMatricesTooltip,
  groupMatricesByGroup,
} from "@/lib/catalog/matrix-label";
import type { MethodMatrixSummary } from "@/types/analytical-methods";

type Props = {
  matrices: MethodMatrixSummary[];
};

export function MethodMatrixListCell({ matrices }: Props) {
  if (matrices.length === 0) {
    return <span className="text-slate-400">—</span>;
  }

  const groups = groupMatricesByGroup(matrices);
  const tooltip = formatMatricesTooltip(matrices);

  return (
    <div
      className="max-w-[280px] cursor-help whitespace-normal text-sm leading-snug text-slate-700"
      title={tooltip}
    >
      {groups.map(({ groupName, items }) => {
        const line = formatMatrixGroupLine(groupName, items);
        return (
          <div key={groupName}>
            <span className="font-medium text-slate-800">{line.groupName}</span>
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
