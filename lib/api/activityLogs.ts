import { supabase } from "@/lib/supabase";

// ==============================
// Activity Action Types
// ==============================

export type ActivityAction =
  | "view"
  | "create"
  | "update"
  | "delete"
  | "login"
  | "logout"
  | "print"
  | "export"
  | "approve"
  | "post"
  | string;

// ==============================
// Activity Log Interface
// ==============================

export interface ActivityLog {
  id?: string | number;

  companyId: string;

  userId: string;
  userName: string;
  username?: string;
  userRole?: string;

  action: ActivityAction;
  module: string;
  description: string;

  recordId?: string;
  recordName?: string;

  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;

  createdAt?: string;
}

// ==============================
// Get All Activity Logs
// ==============================

export async function getActivityLogs(
  companyId?: string
): Promise<ActivityLog[]> {
  let query = supabase
    .from("activityLogs")
    .select("*")
    .order("createdAt", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching activity logs:", error);
    throw error;
  }

  return (data || []) as ActivityLog[];
}

// ==============================
// Get Activity Log By ID
// ==============================

export async function getActivityLogById(
  id: string | number
): Promise<ActivityLog | null> {
  const { data, error } = await supabase
    .from("activityLogs")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching activity log:", error);
    throw error;
  }

  return data as ActivityLog | null;
}

// ==============================
// Get Activity Logs By User
// ==============================

export async function getActivityLogsByUser(
  userId: string,
  companyId?: string
): Promise<ActivityLog[]> {
  let query = supabase
    .from("activityLogs")
    .select("*")
    .eq("userId", userId)
    .order("createdAt", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching user activity logs:", error);
    throw error;
  }

  return (data || []) as ActivityLog[];
}

// ==============================
// Get Activity Logs By Module
// ==============================

export async function getActivityLogsByModule(
  module: string,
  companyId: string
): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("activityLogs")
    .select("*")
    .eq("companyId", companyId)
    .eq("module", module)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching module activity logs:", error);
    throw error;
  }

  return (data || []) as ActivityLog[];
}

// ==============================
// Get Activity Logs By Action
// ==============================

export async function getActivityLogsByAction(
  action: ActivityAction,
  companyId: string
): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("activityLogs")
    .select("*")
    .eq("companyId", companyId)
    .eq("action", action)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching activity logs by action:", error);
    throw error;
  }

  return (data || []) as ActivityLog[];
}

// ==============================
// Get Activity Logs By Record
// ==============================

export async function getActivityLogsByRecord(
  recordId: string,
  companyId: string
): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("activityLogs")
    .select("*")
    .eq("companyId", companyId)
    .eq("recordId", recordId)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching record activity logs:", error);
    throw error;
  }

  return (data || []) as ActivityLog[];
}

// ==============================
// Get Activity Logs By Date Range
// ==============================

export async function getActivityLogsByDateRange(
  startDate: string,
  endDate: string,
  companyId: string
): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("activityLogs")
    .select("*")
    .eq("companyId", companyId)
    .gte("createdAt", startDate)
    .lte("createdAt", endDate)
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error fetching activity logs by date:", error);
    throw error;
  }

  return (data || []) as ActivityLog[];
}

// ==============================
// Get Recent Activity Logs
// ==============================

export async function getRecentActivityLogs(
  companyId: string,
  limit: number = 10
): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("activityLogs")
    .select("*")
    .eq("companyId", companyId)
    .order("createdAt", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching recent activity logs:", error);
    throw error;
  }

  return (data || []) as ActivityLog[];
}

// ==============================
// Search Activity Logs
// ==============================

export async function searchActivityLogs(
  search: string,
  companyId: string
): Promise<ActivityLog[]> {
  const { data, error } = await supabase
    .from("activityLogs")
    .select("*")
    .eq("companyId", companyId)
    .or(
      `description.ilike.%${search}%,module.ilike.%${search}%,recordName.ilike.%${search}%,userName.ilike.%${search}%`
    )
    .order("createdAt", { ascending: false });

  if (error) {
    console.error("Error searching activity logs:", error);
    throw error;
  }

  return (data || []) as ActivityLog[];
}

// ==============================
// Create Activity Log
// ==============================

export async function createActivityLog(
  activity: Omit<ActivityLog, "id" | "createdAt"> & {
    createdAt?: string;
  }
): Promise<ActivityLog> {
  const newActivity = {
    ...activity,
    createdAt: activity.createdAt || new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("activityLogs")
    .insert([newActivity])
    .select()
    .single();

  if (error) {
    console.error("Error creating activity log:", error);
    throw error;
  }

  return data as ActivityLog;
}

// ==============================
// Get Activity Logs Count
// ==============================

export async function getActivityLogsCount(
  companyId: string
): Promise<number> {
  const { count, error } = await supabase
    .from("activityLogs")
    .select("*", { count: "exact", head: true })
    .eq("companyId", companyId);

  if (error) {
    console.error("Error counting activity logs:", error);
    throw error;
  }

  return count || 0;
}