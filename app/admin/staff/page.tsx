import { AdminStaffClient } from "@/components/admin/AdminStaffClient";
import { listStaff } from "@/lib/actions/admin-staff";

export default async function AdminStaffPage() {
  const staff = await listStaff();
  return <AdminStaffClient staff={staff} />;
}
