import { supabase } from "@/lib/supabase";

/* =========================
   Types
========================= */

export interface WarehouseStock {
  id?: string;

  companyId: string;

  productId: string;
  productName?: string;
  productCode?: string;

  warehouseId: string;
  warehouseName?: string;

  quantity: number;

  averageCost?: number;
  unitCost?: number;
  inventoryValue?: number;

  createdAt?: string;
  createdBy?: string;
  createdById?: string;
  createdByUsername?: string;
  createdByRole?: string;
  createdByType?: string;

  updatedAt?: string;
  updatedBy?: string;
  updatedById?: string;
  updatedByName?: string;
  updatedByUsername?: string;
}

/* =========================
   Get All Warehouse Stocks
========================= */

export async function getWarehouseStocks(
  companyId?: string
): Promise<WarehouseStock[]> {
  let query = supabase
    .from("warehouseStocks")
    .select("*")
    .order("updatedAt", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []) as WarehouseStock[];
}

/* =========================
   Get Stock By ID
========================= */

export async function getWarehouseStockById(
  id: string
): Promise<WarehouseStock | null> {
  const { data, error } = await supabase
    .from("warehouseStocks")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;

  return data as WarehouseStock | null;
}

/* =========================
   Get Stocks By Product
========================= */

export async function getStocksByProduct(
  productId: string,
  companyId?: string
): Promise<WarehouseStock[]> {
  let query = supabase
    .from("warehouseStocks")
    .select("*")
    .eq("productId", productId)
    .order("updatedAt", { ascending: false });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []) as WarehouseStock[];
}

/* =========================
   Get Stocks By Warehouse
========================= */

export async function getStocksByWarehouse(
  warehouseId: string,
  companyId?: string
): Promise<WarehouseStock[]> {
  let query = supabase
    .from("warehouseStocks")
    .select("*")
    .eq("warehouseId", warehouseId)
    .order("productName", { ascending: true });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []) as WarehouseStock[];
}

/* =========================
   Get Stock By Product And Warehouse
========================= */

export async function getStockByProductAndWarehouse(
  productId: string,
  warehouseId: string,
  companyId: string
): Promise<WarehouseStock | null> {
  const { data, error } = await supabase
    .from("warehouseStocks")
    .select("*")
    .eq("productId", productId)
    .eq("warehouseId", warehouseId)
    .eq("companyId", companyId)
    .maybeSingle();

  if (error) throw error;

  return data as WarehouseStock | null;
}

/* =========================
   Get Low Stocks
========================= */

export async function getLowWarehouseStocks(
  companyId?: string,
  threshold: number = 10
): Promise<WarehouseStock[]> {
  let query = supabase
    .from("warehouseStocks")
    .select("*")
    .lte("quantity", threshold)
    .order("quantity", { ascending: true });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []) as WarehouseStock[];
}

/* =========================
   Search Warehouse Stocks
========================= */

export async function searchWarehouseStocks(
  search: string,
  companyId?: string
): Promise<WarehouseStock[]> {
  const searchValue = search.trim();

  let query = supabase
    .from("warehouseStocks")
    .select("*")
    .order("productName", { ascending: true });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  if (searchValue) {
    query = query.or(
      `productName.ilike.%${searchValue}%,productCode.ilike.%${searchValue}%,warehouseName.ilike.%${searchValue}%`
    );
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []) as WarehouseStock[];
}

/* =========================
   Create Warehouse Stock
========================= */

export async function createWarehouseStock(
  stock: WarehouseStock
): Promise<WarehouseStock> {
  const { data, error } = await supabase
    .from("warehouseStocks")
    .insert(stock)
    .select("*")
    .single();

  if (error) throw error;

  return data as WarehouseStock;
}

/* =========================
   Update Warehouse Stock
========================= */

export async function updateWarehouseStock(
  id: string,
  updates: Partial<WarehouseStock>
): Promise<WarehouseStock> {
  const { data, error } = await supabase
    .from("warehouseStocks")
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  return data as WarehouseStock;
}

/* =========================
   Delete Warehouse Stock
========================= */

export async function deleteWarehouseStock(
  id: string
): Promise<boolean> {
  const { error } = await supabase
    .from("warehouseStocks")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return true;
}