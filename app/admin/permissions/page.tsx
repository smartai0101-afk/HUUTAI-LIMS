import { AdminPermissionsClient } from "@/components/admin/AdminPermissionsClient";
import { listPermissionAssignments } from "@/lib/actions/admin-permissions";

export default async function AdminPermissionsPage() {
  const assignments = await listPermissionAssignments();
  return <AdminPermissionsClient assignments={assignments} />;
}
