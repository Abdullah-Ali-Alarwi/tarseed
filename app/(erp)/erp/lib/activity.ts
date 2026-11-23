
"use client";

import axios from "axios";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3001";

/* =========================================
   Types
========================================= */

export type ActivityAction =
  | "create"
  | "update"
  | "delete";

export type CurrentActor = {
  userId: string;
  userName: string;
  username: string;
  userRole: string;
  companyId: string;
};

type ActivityLogData = {
  action: ActivityAction;
  module: string;
  description: string;

  recordId?: string | number;
  recordName?: string;

  oldData?: Record<string, unknown> | null;
  newData?: Record<string, unknown> | null;
};

/* =========================================
   Get Current User
========================================= */

export function getCurrentActor(): CurrentActor | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const storedUser = localStorage.getItem("authUser");

    if (!storedUser) {
      return null;
    }

    const user = JSON.parse(storedUser);

    if (!user?.id) {
      return null;
    }

    return {
      userId: String(user.id),

      userName:
        user.name ||
        user.fullName ||
        user.username ||
        "مستخدم غير معروف",

      username: user.username || "",

      userRole: user.role || "",

      companyId: String(user.companyId || ""),
    };
  } catch (error) {
    console.error("Error reading current user:", error);
    return null;
  }
}

/* =========================================
   Create Actor Fields
========================================= */

export function getCreateActivity() {
  const actor = getCurrentActor();

  return {
    ...(actor || {}),

    createdBy: actor?.userId || "",
    createdByName: actor?.userName || "",

    createdAt: new Date().toISOString(),
  };
}

/* =========================================
   Update Actor Fields
========================================= */

export function getUpdateActivity() {
  const actor = getCurrentActor();

  return {
    updatedBy: actor?.userId || "",
    updatedByName: actor?.userName || "",

    updatedAt: new Date().toISOString(),
  };
}

/* =========================================
   Save Activity Log
========================================= */

export async function saveActivityLog(
  data: ActivityLogData
) {
  const actor = getCurrentActor();

  if (!actor) {
    console.error(
      "Cannot save activity: current user not found."
    );

    return null;
  }

  if (!actor.companyId) {
    console.error(
      "Cannot save activity: companyId not found."
    );

    return null;
  }

  const log = {
    companyId: actor.companyId,

    userId: actor.userId,
    userName: actor.userName,
    username: actor.username,
    userRole: actor.userRole,

    action: data.action,
    module: data.module,
    description: data.description,

    recordId:
      data.recordId !== undefined
        ? String(data.recordId)
        : "",

    recordName: data.recordName || "",

    oldData: data.oldData || null,
    newData: data.newData || null,

    createdAt: new Date().toISOString(),
  };

  try {
    const response = await axios.post(
      `${API_URL}/activityLogs`,
      log
    );

    return response.data;
  } catch (error) {
    console.error("Error saving activity log:", error);

    return null;
  }
}

/* =========================================
   Create Activity
========================================= */

export async function logCreate(
  module: string,
  description: string,
  recordId?: string | number,
  recordName?: string,
  newData?: Record<string, unknown>
) {
  return saveActivityLog({
    action: "create",
    module,
    description,
    recordId,
    recordName,
    newData,
  });
}

/* =========================================
   Update Activity
========================================= */

export async function logUpdate(
  module: string,
  description: string,
  recordId?: string | number,
  recordName?: string,
  oldData?: Record<string, unknown>,
  newData?: Record<string, unknown>
) {
  return saveActivityLog({
    action: "update",
    module,
    description,
    recordId,
    recordName,
    oldData,
    newData,
  });
}

/* =========================================
   Delete Activity
========================================= */

export async function logDelete(
  module: string,
  description: string,
  recordId?: string | number,
  recordName?: string,
  oldData?: Record<string, unknown>
) {
  return saveActivityLog({
    action: "delete",
    module,
    description,
    recordId,
    recordName,
    oldData,
  });
}
