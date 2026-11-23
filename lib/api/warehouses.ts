import { supabase } from "@/lib/supabase";

// ========================================
// Warehouse Stock Type
// ========================================

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

// ========================================
// 1. Get All Warehouse Stocks
// ========================================

export async function getWarehouseStocks(companyId?: string) {
  let query = supabase
    .from("warehouseStocks")
    .select("*");

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.order("updatedAt", {
    ascending: false,
  });

  if (error) throw error;

  return data as WarehouseStock[];
}

// ========================================
// 2. Get Stock By ID
// ========================================

export async function getWarehouseStockById(id: string) {
  const { data, error } = await supabase
    .from("warehouseStocks")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as WarehouseStock;
}

// ========================================
// 3. Get Stock By Product
// ========================================

export async function getStocksByProduct(
  productId: string,
  companyId?: string
) {
  let query = supabase
    .from("warehouseStocks")
    .select("*")
    .eq("productId", productId);

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.order("updatedAt", {
    ascending: false,
  });

  if (error) throw error;

  return data as WarehouseStock[];
}

// ========================================
// 4. Get Stock By Warehouse
// ========================================

export async function getStocksByWarehouse(
  warehouseId: string,
  companyId?: string
) {
  let query = supabase
    .from("warehouseStocks")
    .select("*")
    .eq("warehouseId", warehouseId);

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.order("productName", {
    ascending: true,
  });

  if (error) throw error;

  return data as WarehouseStock[];
}

// ========================================
// 5. Get Stock By Product And Warehouse
// ========================================

export async function getStockByProductAndWarehouse(
  productId: string,
  warehouseId: string,
  companyId: string
) {
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

// ========================================
// 6. Get Products With Low Stock
// ========================================

export async function getLowWarehouseStocks(
  companyId: string,
  minimumQuantity: number
) {
  const { data, error } = await supabase
    .from("warehouseStocks")
    .select("*")
    .eq("companyId", companyId)
    .lte("quantity", minimumQuantity)
    .order("quantity", {
      ascending: true,
    });

  if (error) throw error;

  return data as WarehouseStock[];
}

// ========================================
// 7. Search Warehouse Stocks
// ========================================

export async function searchWarehouseStocks(
  search: string,
  companyId?: string
) {
  let query = supabase
    .from("warehouseStocks")
    .select("*")
    .or(
      `productName.ilike.%${search}%,productCode.ilike.%${search}%,warehouseName.ilike.%${search}%`
    );

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.order("updatedAt", {
    ascending: false,
  });

  if (error) throw error;

  return data as WarehouseStock[];
}

// ========================================
// 8. Create Warehouse Stock
// ========================================

export async function createWarehouseStock(
  stock: WarehouseStock
) {
  const { data, error } = await supabase
    .from("warehouseStocks")
    .insert(stock)
    .select()
    .single();

  if (error) throw error;

  return data as WarehouseStock;
}

// ========================================
// 9. Update Warehouse Stock
// ========================================

export async function updateWarehouseStock(
  id: string,
  updates: Partial<WarehouseStock>
) {
  const { data, error } = await supabase
    .from("warehouseStocks")
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as WarehouseStock;
}

// ========================================
// 10. Delete Warehouse Stock
// ========================================

export async function deleteWarehouseStock(id: string) {
  const { error } = await supabase
    .from("warehouseStocks")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return true;
}