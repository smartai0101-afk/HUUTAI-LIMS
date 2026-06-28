import type { PermissionKey } from "@/lib/auth/nav-permissions";
import type { SortOrder } from "@/lib/list-query";

export type NotificationAction =
  | "Created"
  | "Updated"
  | "Deleted"
  | "StatusChanged"
  | "Approved"
  | "Rejected"
  | "Requested"
  | "Imported"
  | "StockIn"
  | "Completed"
  | "Linked"
  | "Unlinked"
  | "Used"
  | "Converted";

export type NotificationView = {
  id: string;
  actorUserId: string | null;
  actorName: string;
  action: string;
  actionLabel: string;
  moduleKey: string;
  moduleLabel: string;
  entityType: string;
  entityId: string;
  recordLabel: string;
  href: string;
  createdAt: string;
  read: boolean;
};

export type NotificationListParams = {
  limit?: number;
  offset?: number;
  filter?: "all" | "unread";
  module?: PermissionKey | "";
  from?: Date;
  to?: Date;
  sortBy?: "createdAt" | "actorName" | "moduleLabel" | "action" | "recordLabel";
  sortOrder?: SortOrder;
};

export type NotificationListResult = {
  items: NotificationView[];
  total: number;
};
