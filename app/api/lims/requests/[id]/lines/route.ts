import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/auth/permissions";
import { getSessionUser } from "@/lib/auth/session";
import {
  listRequestSampleLines,
  upsertRequestSampleLines,
} from "@/lib/services/samples/request-sample-lines";
import type { RequestSampleLineInput } from "@/lib/services/samples/request-sample-lines";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role, user.permissions, "samples_requests", "read")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const lines = await listRequestSampleLines(id);
  return NextResponse.json({ lines });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!hasPermission(user.role, user.permissions, "samples_requests", "write")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as { lines?: RequestSampleLineInput[] };
  if (!body.lines?.length) {
    return NextResponse.json({ error: "lines required" }, { status: 400 });
  }

  try {
    await upsertRequestSampleLines(id, body.lines);
    const lines = await listRequestSampleLines(id);
    return NextResponse.json({ lines });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to save lines" },
      { status: 400 },
    );
  }
}
