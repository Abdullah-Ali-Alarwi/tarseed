import { supabase } from "@/lib/supabase";

/* =========================
   Types
========================= */

export type TransferStatus =
  | "pending"
  | "completed"
  | "cancelled"
  | string;

export interface Transfer {
  id?: string | number;

  companyId: string;

  transferNumber: string;

  fromWarehouseId: string;
  fromWarehouseName: string;

  toWarehouseId: string;
  toWarehouseName: string;

  productId: string;
  productName: string;
  productSKU?: string;

  quantity: number;
  unitName?: string;

  date: string;
  notes?: string;

  status: TransferStatus;

  createdAt?: string;
  updatedAt?: string;

  createdBy?: string;
  createdById?: string;
  createdByName?: string;
  createdByUsername?: string;
  createdByRole?: string;
}

/* =========================
   Get All Transfers
========================= */

export async function getTransfers(companyId?: string) {
  let query = supabase
    .from("transfers")
    .select("*")
    .order("date", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as Transfer[];
}

/* =========================
   Get Transfer By ID
========================= */

export async function getTransferById(id: string | number) {
  const { data, error } = await supabase
    .from("transfers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Transfer;
}

/* =========================
   Get Transfer By Number
========================= */

export async function getTransferByNumber(
  transferNumber: string,
  companyId?: string
) {
  let query = supabase
    .from("transfers")
    .select("*")
    .eq("transferNumber", transferNumber);

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data as Transfer | null;
}

/* =========================
   Get Transfers By Status
========================= */

export async function getTransfersByStatus(
  status: TransferStatus,
  companyId?: string
) {
  let query = supabase
    .from("transfers")
    .select("*")
    .eq("status", status)
    .order("date", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as Transfer[];
}

/* =========================
   Get Transfers By Product
========================= */

export async function getTransfersByProduct(
  productId: string,
  companyId?: string
) {
  let query = supabase
    .from("transfers")
    .select("*")
    .eq("productId", productId)
    .order("date", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as Transfer[];
}

/* =========================
   Get Transfers From Warehouse
========================= */

export async function getTransfersFromWarehouse(
  warehouseId: string,
  companyId?: string
) {
  let query = supabase
    .from("transfers")
    .select("*")
    .eq("fromWarehouseId", warehouseId)
    .order("date", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as Transfer[];
}

/* =========================
   Get Transfers To Warehouse
========================= */

export async function getTransfersToWarehouse(
  warehouseId: string,
  companyId?: string
) {
  let query = supabase
    .from("transfers")
    .select("*")
    .eq("toWarehouseId", warehouseId)
    .order("date", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as Transfer[];
}

/* =========================
   Get Transfers By Date Range
========================= */

export async function getTransfersByDateRange(
  startDate: string,
  endDate: string,
  companyId?: string
) {
  let query = supabase
    .from("transfers")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as Transfer[];
}

/* =========================
   Search Transfers
========================= */

export async function searchTransfers(
  search: string,
  companyId?: string
) {
  let query = supabase
    .from("transfers")
    .select("*")
    .or(
      `transferNumber.ilike.%${search}%,productName.ilike.%${search}%,productSKU.ilike.%${search}%,fromWarehouseName.ilike.%${search}%,toWarehouseName.ilike.%${search}%,notes.ilike.%${search}%`
    )
    .order("date", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as Transfer[];
}

/* =========================
   Create Transfer
========================= */

export async function createTransfer(transfer: Transfer) {
  const { data, error } = await supabase
    .from("transfers")
    .insert(transfer)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Transfer;
}

/* =========================
   Update Transfer
========================= */

export async function updateTransfer(
  id: string | number,
  updates: Partial<Transfer>
) {
  const { data, error } = await supabase
    .from("transfers")
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Transfer;
}

/* =========================
   Delete Transfer
========================= */

export async function deleteTransfer(id: string | number) {
  const { error } = await supabase
    .from("transfers")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

/* =========================
   Get Transfer Statistics
========================= */

export async function getTransferStatistics(companyId?: string) {
  let query = supabase
    .from("transfers")
    .select("status, quantity");

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const transfers = data || [];

  return {
    total: transfers.length,

    pending: transfers.filter(
      (item) => item.status === "pending"
    ).length,

    completed: transfers.filter(
      (item) => item.status === "completed"
    ).length,

    cancelled: transfers.filter(
      (item) => item.status === "cancelled"
    ).length,

    totalQuantity: transfers
      .filter((item) => item.status === "completed")
      .reduce(
        (total, item) => total + Number(item.quantity || 0),
        0
      ),
  };
}