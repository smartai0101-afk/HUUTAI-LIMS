import {
  formatMethodLinkCode,
  formatMethodLinksTooltip,
} from "@/lib/catalog/test-method-method-label";
import type { TestMethodMethodLink } from "@/types/catalog";

type Props = {
  links: TestMethodMethodLink[];
  column: "code" | "unit" | "lod";
};

export function TestMethodMethodsListCell({ links, column }: Props) {
  if (links.length === 0) {
    return <span className="text-slate-400">—</span>;
  }

  const tooltip = formatMethodLinksTooltip(links);

  return (
    <div
      className="max-w-[200px] cursor-help whitespace-normal text-sm leading-snug text-slate-700"
      title={tooltip}
    >
      {links.map((link) => (
        <div key={link.methodId}>
          {column === "code"
            ? formatMethodLinkCode(link)
            : column === "unit"
              ? link.unit || "—"
              : link.lod || "—"}
        </div>
      ))}
    </div>
  );
}
