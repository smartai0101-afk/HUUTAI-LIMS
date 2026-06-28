import { NextResponse } from "next/server";
import { requireSessionCanEdit } from "@/lib/auth/guards";
import { refreshReferenceFromPubChem } from "@/lib/services/chem-info/chemical-reference-sync";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireSessionCanEdit();
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 403 });
  }

  const { id } = await context.params;
  let force = false;
  try {
    const body = (await request.json()) as { force?: boolean };
    force = Boolean(body.force);
  } catch {
    /* optional body */
  }

  const result = await refreshReferenceFromPubChem(id, {
    performedBy: auth.user.name || auth.user.email,
    force,
  });

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
