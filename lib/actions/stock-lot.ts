"use server";

import { revalidatePath } from "next/cache";
import { logActivity } from "@/lib/audit";
import { deleteCoaFile } from "@/lib/coa-upload";
import { db } from "@/lib/db";
import { deleteStockLotInTransaction } from "@/lib/stock-lot";

const REVALIDATE_PATHS = [
  "/stock-in",
  "/containers",
  "/chemicals",
  "/standards",
  "/microbial-strains",
  "/prepared-chemicals",
  "/prepared-standards",
  "/prepared-strains",
  "/usage-logs",
  "/",
  "/reports",
];

function revalidateAll() {
  for (const path of REVALIDATE_PATHS) revalidatePath(path);
}

export async function deleteStockLot(formData: FormData) {
  const user = String(formData.get("user") ?? "System");
  const stockLotId = String(formData.get("stockLotId") ?? "").trim();

  if (!stockLotId) return { error: "Thiếu mã lot tồn kho" };

  try {
    const result = await db.$transaction(async (tx) => deleteStockLotInTransaction(tx, stockLotId));
    if (result.error) return { error: result.error };
    if (!result.ref) return { error: "Không thể xóa lot" };

    const { ref } = result;
    if (ref.coaPath) await deleteCoaFile(ref.coaPath);

    await logActivity({
      user,
      action: "Deleted",
      entityType: "StockLot",
      entityId: ref.id,
      object: `${ref.sourceCode} · Lot ${ref.lot}`,
      before: ref,
    });

    revalidateAll();
    return { success: true };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Không thể xóa lot" };
  }
}
