export function classificationStyles(classification: string): string {
  const map: Record<string, string> = {
    "alkali metal": "bg-rose-100 text-rose-900 ring-rose-200 hover:bg-rose-200",
    "alkaline earth metal": "bg-orange-100 text-orange-900 ring-orange-200 hover:bg-orange-200",
    "transition metal": "bg-sky-100 text-sky-900 ring-sky-200 hover:bg-sky-200",
    "post-transition metal": "bg-slate-200 text-slate-900 ring-slate-300 hover:bg-slate-300",
    metalloid: "bg-teal-100 text-teal-900 ring-teal-200 hover:bg-teal-200",
    nonmetal: "bg-emerald-100 text-emerald-900 ring-emerald-200 hover:bg-emerald-200",
    halogen: "bg-amber-100 text-amber-900 ring-amber-200 hover:bg-amber-200",
    "noble gas": "bg-violet-100 text-violet-900 ring-violet-200 hover:bg-violet-200",
    lanthanide: "bg-fuchsia-100 text-fuchsia-900 ring-fuchsia-200 hover:bg-fuchsia-200",
    actinide: "bg-pink-100 text-pink-900 ring-pink-200 hover:bg-pink-200",
  };
  return map[classification] ?? "bg-slate-100 text-slate-800 ring-slate-200 hover:bg-slate-200";
}

export function classificationLabelVi(classification: string): string {
  const map: Record<string, string> = {
    "alkali metal": "Kim loại kiềm",
    "alkaline earth metal": "Kim loại kiềm thổ",
    "transition metal": "Kim loại chuyển tiếp",
    "post-transition metal": "Kim loại hậu chuyển tiếp",
    metalloid: "Á kim",
    nonmetal: "Phi kim",
    halogen: "Halogen",
    "noble gas": "Khí hiếm",
    lanthanide: "Lantanoid",
    actinide: "Actinoid",
  };
  return map[classification] ?? classification;
}
