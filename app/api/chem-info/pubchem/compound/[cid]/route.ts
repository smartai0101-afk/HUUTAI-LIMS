import { NextResponse } from "next/server";
import { fetchPubChemCompound } from "@/lib/services/chem-info/pubchem";

export async function GET(
  _request: Request,
  context: { params: Promise<{ cid: string }> },
) {
  const { cid: cidRaw } = await context.params;
  const cid = Number(cidRaw);
  if (!Number.isFinite(cid) || cid <= 0) {
    return NextResponse.json({ error: "CID không hợp lệ" }, { status: 400 });
  }
  try {
    const compound = await fetchPubChemCompound(cid);
    if (!compound) return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
    return NextResponse.json({ compound });
  } catch {
    return NextResponse.json({ error: "Không thể tra cứu PubChem" }, { status: 502 });
  }
}
