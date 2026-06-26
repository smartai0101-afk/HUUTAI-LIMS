import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { markNotificationRead } from "@/lib/notifications/mark-read";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(_request: Request, context: RouteContext) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await markNotificationRead(user, id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
