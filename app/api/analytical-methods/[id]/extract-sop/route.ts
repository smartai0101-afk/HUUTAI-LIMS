import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { getCurrentMethodVersionId } from "@/lib/services/analytical-methods/methods";
import { extractSopStub } from "@/lib/services/analytical-methods/method-extraction";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAuth();
    if ("error" in auth) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }
    const { id: methodId } = await params;
    const body = await _request.json().catch(() => ({}));
    const documentId = String(body.documentId ?? "");

    const versionId = await getCurrentMethodVersionId(methodId);
    if (!versionId) {
      return NextResponse.json({ error: "Không tìm thấy phiên bản" }, { status: 404 });
    }

    const result = await extractSopStub({
      methodVersionId: versionId,
      documentId,
      requestedBy: auth.user.name || auth.user.email,
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
