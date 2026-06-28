"use server";

import { revalidatePath } from "next/cache";
import { requireSessionCanEdit } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { deleteSdsFile, saveSdsFile } from "@/lib/sds-upload";
import { refreshReferenceFromPubChem } from "@/lib/services/chem-info/chemical-reference-sync";

function str(fd: FormData, key: string) {
  return String(fd.get(key) ?? "").trim();
}

export async function uploadSdsDocument(formData: FormData) {
  await requireSessionCanEdit();
  const referenceId = str(formData, "referenceId");
  const title = str(formData, "title") || "SDS";
  const supplier = str(formData, "supplier");
  const externalUrl = str(formData, "externalUrl");
  const file = formData.get("file");

  if (!referenceId) return { error: "Thiếu referenceId" };
  const ref = await db.chemicalReference.findUnique({ where: { id: referenceId } });
  if (!ref) return { error: "Không tìm thấy hóa chất" };

  let filePath: string | null = null;
  if (file instanceof File && file.size > 0) {
    const saved = await saveSdsFile(file);
    if (saved.error) return { error: saved.error };
    filePath = saved.path ?? null;
  }

  if (!filePath && !externalUrl) return { error: "Cần file PDF hoặc URL ngoài" };

  await db.sdsDocument.create({
    data: {
      chemicalReferenceId: referenceId,
      title,
      supplier,
      externalUrl: externalUrl || null,
      filePath,
      isPrimary: false,
    },
  });

  revalidatePath(`/chem-info/chemicals/${referenceId}`);
  revalidatePath("/chem-info/chemicals");
  return { success: true };
}

export async function deleteSdsDocument(id: string) {
  await requireSessionCanEdit();
  const doc = await db.sdsDocument.findUnique({ where: { id } });
  if (!doc) return { error: "Không tìm thấy SDS" };
  if (doc.filePath) await deleteSdsFile(doc.filePath);
  await db.sdsDocument.delete({ where: { id } });
  revalidatePath(`/chem-info/chemicals/${doc.chemicalReferenceId}`);
  return { success: true };
}

export async function enrichFromPubChem(referenceId: string) {
  const session = await requireSessionCanEdit();
  if ("error" in session) return { error: session.error };
  const result = await refreshReferenceFromPubChem(referenceId, {
    performedBy: session.user.name || session.user.email,
    force: false,
  });
  if (result.error) return { error: result.error };
  revalidatePath(`/chem-info/chemicals/${referenceId}`);
  return { success: true };
}
