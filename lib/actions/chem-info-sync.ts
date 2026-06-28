"use server";

import { revalidatePath } from "next/cache";
import { requireSessionCanEdit } from "@/lib/auth/guards";
import {
  refreshReferenceFromPubChem,
  upsertFromPubChem,
} from "@/lib/services/chem-info/chemical-reference-sync";

export async function syncFromPubChem(cid: number, query?: string) {
  const session = await requireSessionCanEdit();
  if ("error" in session) return { error: session.error };

  const result = await upsertFromPubChem(cid, {
    performedBy: session.user.name || session.user.email,
    query,
  });
  if (result.error) return { error: result.error };

  revalidatePath("/chem-info/chemicals");
  revalidatePath(`/chem-info/chemicals/${result.id}`);
  return { success: true, id: result.id, created: result.created };
}

export async function refreshFromPubChem(referenceId: string, force = false) {
  const session = await requireSessionCanEdit();
  if ("error" in session) return { error: session.error };

  const result = await refreshReferenceFromPubChem(referenceId, {
    performedBy: session.user.name || session.user.email,
    force,
  });
  if (result.error) return { error: result.error };

  revalidatePath("/chem-info/chemicals");
  revalidatePath(`/chem-info/chemicals/${referenceId}`);
  return { success: true };
}
