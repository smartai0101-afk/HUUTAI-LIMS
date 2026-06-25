import { db } from "@/lib/db";

export type StaffView = {
  id: string;
  code: string;
  name: string;
  department: string;
};

export async function getActiveStaff(): Promise<StaffView[]> {
  const rows = await db.staff.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    department: row.department,
  }));
}
