import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { hasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const sampleId = searchParams.get("sampleId");

  if (sampleId) {
    if (!hasPermission(user.role, user.extraPermissions ?? [], "samples_list", "read")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const events = await db.workflowEvent.findMany({
      where: { sampleId },
      orderBy: { performedAt: "desc" },
      take: 200,
    });
    return NextResponse.json({ events });
  }

  if (!hasPermission(user.role, user.extraPermissions ?? [], "samples_reception_log", "read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const events = await db.workflowEvent.findMany({
    orderBy: { performedAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ events });
}
