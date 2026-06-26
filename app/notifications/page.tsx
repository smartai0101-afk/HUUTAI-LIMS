import { redirect } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { NotificationsClient } from "@/components/notifications/NotificationsClient";
import { getSessionUser } from "@/lib/auth/session";
import { listVisibleModulesForUser } from "@/lib/notifications/query";

export default async function NotificationsPage() {
  const user = await getSessionUser();
  if (!user) redirect("/login?from=/notifications");

  const modules = listVisibleModulesForUser(user);

  return (
    <AppShell>
      <NotificationsClient modules={modules} />
    </AppShell>
  );
}
