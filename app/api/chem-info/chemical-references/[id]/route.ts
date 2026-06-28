import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth/guards";
import { getChemicalReferenceById } from "@/lib/services/chem-info/chemical-references";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { id } = await context.params;
  const reference = await getChemicalReferenceById(id);
  if (!reference) {
    return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
  }

  return NextResponse.json({ reference });
}
