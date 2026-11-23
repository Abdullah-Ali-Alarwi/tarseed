import { supabase } from "@/lib/supabase";

// ========================================
// Purchase Item Type
// ========================================

export interface PurchaseItem {
  id: string;
  productId: string;
  productCode?: string;
  productName: string;
  name?: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
  warehouseId: string;
  warehouseName?: string;
  unit?: string;
}

// ========================================
// Purchase Type
// ========================================

export interface Purchase {
  id?: string;
  companyId: string;
  invoiceNumber: string;
  date: string;

  supplier: string;
  supplierId: string;

  accountCode?: string;
  accountName?: string;

  itemCount: number;
  totalQuantity: number;

  items: PurchaseItem[];

  subtotal: number;
  discount: number;
  tax: number;
  taxRate: number;
  total: number;

  paymentMethod: string;
  paymentMethodName?: string;
  paymentAccountId?: string;

  status: string;
  notes?: string;

  createdBy?: string;
  createdById?: string;
  createdByUsername?: string;
  createdByRole?: string;
  createdByType?: string;

  createdAt?: string;

  updatedBy?: string;
  updatedById?: string;
  updatedAt?: string;
}

// ========================================
// 1. Get All Purchases
// ========================================

export async function getPurchases(companyId?: string) {
  let query = supabase
    .from("purchases")
    .select("*");

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.order("date", {
    ascending: false,
  });

  if (error) throw error;

  return data as Purchase[];
}

// ========================================
// 2. Get Purchase By ID
// ========================================

export async function getPurchaseById(id: string) {
  const { data, error } = await supabase
    .from("purchases")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as Purchase;
}

// ========================================
// 3. Get Purchases By Supplier
// ========================================

export async function getPurchasesBySupplier(
  supplierId: string,
  companyId?: string
) {
  let query = supabase
    .from("purchases")
    .select("*")
    .eq("supplierId", supplierId);

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.order("date", {
    ascending: false,
  });

  if (error) throw error;

  return data as Purchase[];
}

// ========================================
// 4. Search Purchases
// ========================================

export async function searchPurchases(
  search: string,
  companyId?: string
) {
  let query = supabase
    .from("purchases")
    .select("*")
    .or(
      `invoiceNumber.ilike.%${search}%,supplier.ilike.%${search}%`
    );

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.order("date", {
    ascending: false,
  });

  if (error) throw error;

  return data as Purchase[];
}

// ========================================
// 5. Create Purchase
// ========================================

export async function createPurchase(purchase: Purchase) {
  const { data, error } = await supabase
    .from("purchases")
    .insert(purchase)
    .select()
    .single();

  if (error) throw error;

  return data as Purchase;
}

// ========================================
// 6. Update Purchase
// ========================================

export async function updatePurchase(
  id: string,
  updates: Partial<Purchase>
) {
  const { data, error } = await supabase
    .from("purchases")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as Purchase;
}

// ========================================
// 7. Delete Purchase
// ========================================

export async function deletePurchase(id: string) {
  const { error } = await supabase
    .from("purchases")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return true;
}