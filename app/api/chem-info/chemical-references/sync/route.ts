import { NextResponse } from "next/server";
import { requireSessionCanEdit } from "@/lib/auth/guards";
import { upsertFromPubChem } from "@/lib/services/chem-info/chemical-reference-sync";

export async function POST(request: Request) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  let body: { cid?: number; query?: string };
  try {
    body = (await request.json()) as { cid?: number; query?: string };
  } catch {
    return NextResponse.json({ error: "Body JSON không hợp lệ" }, { status: 400 });
  }

  const cid = Number(body.cid);
  if (!Number.isFinite(cid) || cid <= 0) {
    return NextResponse.json({ error: "CID không hợp lệ" }, { status: 400 });
  }

  const result = await upsertFromPubChem(cid, {
    performedBy: auth.user.name || auth.user.email,
    query: body.query?.trim(),
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({
    id: result.id,
    created: result.created,
  });
}
