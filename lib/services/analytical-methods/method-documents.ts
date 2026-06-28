import { db } from "@/lib/db";
import { mapMethodDocument } from "@/lib/mappers/analytical-methods";
import type { MethodDocumentView } from "@/types/analytical-methods";

export async function listMethodDocuments(methodVersionId: string): Promise<MethodDocumentView[]> {
  const rows = await db.methodDocument.findMany({
    where: { methodVersionId },
    orderBy: [{ isPrimary: "desc" }, { uploadedAt: "desc" }],
  });
  return rows.map(mapMethodDocument);
}

export async function createMethodDocument(data: {
  methodVersionId: string;
  filePath: string;
  fileName: string;
  fileType: string;
  fileSizeBytes: number;
  uploadedBy: string;
  isPrimary?: boolean;
}) {
  if (data.isPrimary) {
    await db.methodDocument.updateMany({
      where: { methodVersionId: data.methodVersionId },
      data: { isPrimary: false },
    });
  }
  return db.methodDocument.create({
    data: {
      methodVersionId: data.methodVersionId,
      filePath: data.filePath,
      fileName: data.fileName,
      fileType: data.fileType,
      fileSizeBytes: data.fileSizeBytes,
      uploadedBy: data.uploadedBy,
      isPrimary: data.isPrimary ?? false,
    },
  });
}

export async function setPrimaryMethodDocument(documentId: string, methodVersionId: string) {
  await db.$transaction([
    db.methodDocument.updateMany({
      where: { methodVersionId },
      data: { isPrimary: false },
    }),
    db.methodDocument.update({
      where: { id: documentId },
      data: { isPrimary: true },
    }),
  ]);
}

export async function deleteMethodDocument(documentId: string) {
  return db.methodDocument.delete({ where: { id: documentId } });
}

export async function getMethodDocument(documentId: string) {
  return db.methodDocument.findUnique({ where: { id: documentId } });
}
