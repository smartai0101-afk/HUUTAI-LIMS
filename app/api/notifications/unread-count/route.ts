import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { getUnreadCountForUser } from "@/lib/notifications/query";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = await getUnreadCountForUser(user);
  return NextResponse.json({ count });
}
