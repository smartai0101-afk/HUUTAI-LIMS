import { AdminTasksClient } from "@/components/admin/AdminTasksClient";
import { listAssignableUsers, listTasks } from "@/lib/actions/tasks";

export default async function AdminTasksPage() {
  const [tasks, assignableUsers] = await Promise.all([listTasks(), listAssignableUsers()]);
  return <AdminTasksClient tasks={tasks} assignableUsers={assignableUsers} />;
}
