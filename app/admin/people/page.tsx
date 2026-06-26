import { AdminPeopleClient } from "@/components/admin/AdminPeopleClient";
import { listPeople } from "@/lib/actions/admin-people";
import { getSessionUser } from "@/lib/auth/session";

export default async function AdminPeoplePage() {
  const [people, session] = await Promise.all([listPeople(), getSessionUser()]);
  const canManageLogin = session?.role === "Admin";

  return <AdminPeopleClient people={people} canManageLogin={canManageLogin} />;
}
