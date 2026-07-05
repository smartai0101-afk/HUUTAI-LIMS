import type { TestMethodMethodLink } from "@/types/catalog";

export function formatMethodLinksTooltip(links: TestMethodMethodLink[]): string {
  return links
    .map((l) => {
      const star = l.isPrimary ? " ★" : "";
      const parts = [l.unit, l.lod ? `LOD ${l.lod}` : ""].filter(Boolean).join(", ");
      return `${l.methodCode}${star}${parts ? `: ${parts}` : ""}`;
    })
    .join("\n");
}

export function formatMethodLinkCode(l: TestMethodMethodLink): string {
  return l.isPrimary ? `${l.methodCode} ★` : l.methodCode;
}
