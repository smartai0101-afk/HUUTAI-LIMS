import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import { markAllNotificationsRead } from "@/lib/notifications/mark-read";

export async function PATCH() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await markAllNotificationsRead(user);
  return NextResponse.json(result);
}
