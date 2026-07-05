import { NextResponse } from "next/server";
import type { SampleTestStatus } from "@prisma/client";
import { hasPermission } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";
import { listSampleTestsForAssignment } from "@/lib/services/samples/sample-test-assignment";

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role, user.permissions, "samples_assign", "read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const url = new URL(request.url);
  const requestId = url.searchParams.get("requestId");
  const status = url.searchParams.get("status") as SampleTestStatus | null;
  const sampleId = url.searchParams.get("sampleId") ?? undefined;
  const testMethodId = url.searchParams.get("testMethodId") ?? undefined;

  let items = await listSampleTestsForAssignment({
    sampleId,
    testMethodId,
    status: status ?? undefined,
  });

  if (requestId) {
    const { db } = await import("@/lib/db");
    const sampleIds = (
      await db.sample.findMany({
        where: { requestId },
        select: { id: true },
      })
    ).map((s) => s.id);
    items = items.filter((i) => sampleIds.includes(i.sampleId));
  }

  return NextResponse.json({ sampleTests: items });
}
