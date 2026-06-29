/** Gợi ý phòng ban theo tên chỉ tiêu (không auto-save). */
const PARAMETER_DEPARTMENT_HINTS: Record<string, string> = {
  "aflatoxin b1": "Phòng Độc tố nấm mốc",
  aflatoxin: "Phòng Độc tố nấm mốc",
  don: "Phòng Độc tố nấm mốc",
  zearalenone: "Phòng Độc tố nấm mốc",
  pb: "Phòng Kim loại nặng",
  cd: "Phòng Kim loại nặng",
  as: "Phòng Kim loại nặng",
  hg: "Phòng Kim loại nặng",
  "độ ẩm": "Phòng Hóa lý",
  "chỉ số acid": "Phòng Hóa lý",
  "chỉ số peroxide": "Phòng Hóa lý",
  "dung môi tồn dư": "Phòng Sắc ký",
  histamine: "Phòng Sắc ký",
  salmonella: "Phòng Vi sinh",
  "e.coli": "Phòng Vi sinh",
  "e. coli": "Phòng Vi sinh",
  protein: "Phòng Dinh dưỡng",
  "protein thô": "Phòng Dinh dưỡng",
  "xơ thô": "Phòng Dinh dưỡng",
  "béo thô": "Phòng Dinh dưỡng",
};

function normalizeParameter(value: string): string {
  return value.trim().toLowerCase();
}

export function suggestDepartmentForParameters(
  parameters: string[],
  departmentNames: string[],
): string | null {
  const counts = new Map<string, number>();
  for (const param of parameters) {
    const key = normalizeParameter(param);
    const dept = PARAMETER_DEPARTMENT_HINTS[key];
    if (dept && departmentNames.includes(dept)) {
      counts.set(dept, (counts.get(dept) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return null;
  let best: string | null = null;
  let bestCount = 0;
  for (const [dept, count] of counts) {
    if (count > bestCount) {
      best = dept;
      bestCount = count;
    }
  }
  return best;
}

export function suggestDepartmentForParameter(
  parameter: string,
  departmentNames: string[],
): string | null {
  const dept = PARAMETER_DEPARTMENT_HINTS[normalizeParameter(parameter)];
  if (dept && departmentNames.includes(dept)) return dept;
  return null;
}
