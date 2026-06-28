import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";
import type { PermissionKey } from "@/lib/auth/nav-permissions";
import { listNotificationsForUser } from "@/lib/notifications/query";

function parseDate(value: string | null): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

export async function GET(request: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 20);
  const offset = Number(searchParams.get("offset") ?? 0);
  const filter = searchParams.get("filter") === "unread" ? "unread" : "all";
  const module = (searchParams.get("module") ?? "") as PermissionKey | "";
  const from = parseDate(searchParams.get("from"));
  const to = parseDate(searchParams.get("to"));
  const sortByParam = searchParams.get("sortBy");
  const sortOrderParam = searchParams.get("sortOrder");
  const sortBy =
    sortByParam === "actorName" ||
    sortByParam === "moduleLabel" ||
    sortByParam === "action" ||
    sortByParam === "recordLabel" ||
    sortByParam === "createdAt"
      ? sortByParam
      : undefined;
  const sortOrder = sortOrderParam === "asc" || sortOrderParam === "desc" ? sortOrderParam : undefined;

  const result = await listNotificationsForUser(user, {
    limit,
    offset,
    filter,
    module,
    from,
    to,
    sortBy,
    sortOrder,
  });

  return NextResponse.json(result);
}
