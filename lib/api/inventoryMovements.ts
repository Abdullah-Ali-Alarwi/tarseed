import { supabase } from "@/lib/supabase";

/* =========================
   Types
========================= */

export type InventoryMovementType =
  | "purchase_in"
  | "sale"
  | "transfer_in"
  | "transfer_out"
  | "in"
  | "out"
  | "adjustment_in"
  | "adjustment_out"
  | string;

export interface InventoryMovement {
  id?: string | number;

  companyId: string;

  productId: string;
  productName?: string;
  productCode?: string;
  productSKU?: string;

  warehouseId: string;
  warehouseName?: string;

  type: InventoryMovementType;
  movementType?: string;

  quantity: number;

  unitCost?: number;
  totalCost?: number;

  referenceType?: string;
  referenceId?: string | number;
  referenceNumber?: string;

  date: string;
  notes?: string;

  createdBy?: string;
  createdById?: string;
  createdByName?: string;
  createdByUsername?: string;
  createdByRole?: string;
  createdByType?: string;

  createdAt?: string;
}

/* =========================
   Get All Inventory Movements
========================= */

export async function getInventoryMovements(companyId?: string) {
  let query = supabase
    .from("inventoryMovements")
    .select("*")
    .order("date", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as InventoryMovement[];
}

/* =========================
   Get Movement By ID
========================= */

export async function getInventoryMovementById(
  id: string | number
) {
  const { data, error } = await supabase
    .from("inventoryMovements")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as InventoryMovement;
}

/* =========================
   Get Movements By Product
========================= */

export async function getInventoryMovementsByProduct(
  productId: string,
  companyId?: string
) {
  let query = supabase
    .from("inventoryMovements")
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

  return data as InventoryMovement[];
}

/* =========================
   Get Movements By Warehouse
========================= */

export async function getInventoryMovementsByWarehouse(
  warehouseId: string,
  companyId?: string
) {
  let query = supabase
    .from("inventoryMovements")
    .select("*")
    .eq("warehouseId", warehouseId)
    .order("date", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as InventoryMovement[];
}

/* =========================
   Get Movements By Type
========================= */

export async function getInventoryMovementsByType(
  type: InventoryMovementType,
  companyId?: string
) {
  let query = supabase
    .from("inventoryMovements")
    .select("*")
    .eq("type", type)
    .order("date", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as InventoryMovement[];
}

/* =========================
   Get Movements By Reference
========================= */

export async function getInventoryMovementsByReference(
  referenceType: string,
  referenceId: string | number,
  companyId?: string
) {
  let query = supabase
    .from("inventoryMovements")
    .select("*")
    .eq("referenceType", referenceType)
    .eq("referenceId", referenceId)
    .order("createdAt", { ascending: true });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as InventoryMovement[];
}

/* =========================
   Get Movements By Date Range
========================= */

export async function getInventoryMovementsByDateRange(
  startDate: string,
  endDate: string,
  companyId?: string
) {
  let query = supabase
    .from("inventoryMovements")
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

  return data as InventoryMovement[];
}

/* =========================
   Search Inventory Movements
========================= */

export async function searchInventoryMovements(
  search: string,
  companyId?: string
) {
  let query = supabase
    .from("inventoryMovements")
    .select("*")
    .or(
      `productName.ilike.%${search}%,productCode.ilike.%${search}%,productSKU.ilike.%${search}%,warehouseName.ilike.%${search}%,referenceNumber.ilike.%${search}%,notes.ilike.%${search}%`
    )
    .order("date", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data as InventoryMovement[];
}

/* =========================
   Create Inventory Movement
========================= */

export async function createInventoryMovement(
  movement: InventoryMovement
) {
  const { data, error } = await supabase
    .from("inventoryMovements")
    .insert(movement)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as InventoryMovement;
}

/* =========================
   Create Multiple Movements
========================= */

export async function createInventoryMovements(
  movements: InventoryMovement[]
) {
  const { data, error } = await supabase
    .from("inventoryMovements")
    .insert(movements)
    .select();

  if (error) {
    throw new Error(error.message);
  }

  return data as InventoryMovement[];
}

/* =========================
   Update Inventory Movement
========================= */

export async function updateInventoryMovement(
  id: string | number,
  updates: Partial<InventoryMovement>
) {
  const { data, error } = await supabase
    .from("inventoryMovements")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as InventoryMovement;
}

/* =========================
   Delete Inventory Movement
========================= */

export async function deleteInventoryMovement(
  id: string | number
) {
  const { error } = await supabase
    .from("inventoryMovements")
    .delete()
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  return true;
}

/* =========================
   Get Product Movement Summary
========================= */

export async function getProductMovementSummary(
  productId: string,
  companyId?: string
) {
  let query = supabase
    .from("inventoryMovements")
    .select("type, quantity, unitCost, totalCost")
    .eq("productId", productId);

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const movements = data || [];

  const totalIn = movements
    .filter((item) =>
      ["purchase_in", "transfer_in", "adjustment_in", "in"].includes(
        item.type
      )
    )
    .reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    );

  const totalOut = movements
    .filter((item) =>
      ["sale", "transfer_out", "adjustment_out", "out"].includes(
        item.type
      )
    )
    .reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    );

  const totalCost = movements.reduce(
    (total, item) => total + Number(item.totalCost || 0),
    0
  );

  return {
    totalMovements: movements.length,
    totalIn,
    totalOut,
    netMovement: totalIn - totalOut,
    totalCost,
  };
}