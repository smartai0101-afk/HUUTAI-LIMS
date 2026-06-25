import { AdminUsersClient } from "@/components/admin/AdminUsersClient";
import { listUsers } from "@/lib/actions/admin-users";

export default async function AdminUsersPage() {
  const users = await listUsers();
  return <AdminUsersClient users={users} />;
}
