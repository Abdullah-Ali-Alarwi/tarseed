import { supabase } from "@/lib/supabase";

// ========================================
// Sales Item Type
// ========================================

export interface SaleItem {
  id: string;
  productId: string;
  productName: string;

  quantity: number;

  price: number;
  unitPrice?: number;

  cost?: number;
  total: number;
  costTotal?: number;
}

// ========================================
// Sale Type
// ========================================

export interface Sale {
  id?: string;
  companyId: string;

  invoiceNumber: string;

  customerId: string | null;
  customerName: string;

  warehouseId: string;
  warehouseName?: string;

  date: string;
  createdAt?: string;

  items: SaleItem[];

  subtotal: number;
  total: number;
  totalAmount?: number;
  grandTotal?: number;

  totalCost?: number;
  profit?: number;

  paidAmount: number;
  remainingAmount: number;

  paymentMethod: string;

  paymentAccountId?: string;
  paymentAccountCode?: string;
  paymentAccountName?: string;

  status: string;
  notes?: string;

  journalId?: string;

  createdBy?: string;
  createdById?: string;
  createdByName?: string;
  createdByUsername?: string;
  createdByRole?: string;

  updatedBy?: string;
  updatedById?: string;
  updatedAt?: string;
}

// ========================================
// 1. Get All Sales
// ========================================

export async function getSales(companyId?: string) {
  let query = supabase
    .from("sales")
    .select("*");

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.order("date", {
    ascending: false,
  });

  if (error) throw error;

  return data as Sale[];
}

// ========================================
// 2. Get Sale By ID
// ========================================

export async function getSaleById(id: string) {
  const { data, error } = await supabase
    .from("sales")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as Sale;
}

// ========================================
// 3. Get Sale By Invoice Number
// ========================================

export async function getSaleByInvoiceNumber(
  invoiceNumber: string,
  companyId?: string
) {
  let query = supabase
    .from("sales")
    .select("*")
    .eq("invoiceNumber", invoiceNumber);

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.single();

  if (error) throw error;

  return data as Sale;
}

// ========================================
// 4. Get Sales By Customer
// ========================================

export async function getSalesByCustomer(
  customerId: string,
  companyId?: string
) {
  let query = supabase
    .from("sales")
    .select("*")
    .eq("customerId", customerId);

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.order("date", {
    ascending: false,
  });

  if (error) throw error;

  return data as Sale[];
}

// ========================================
// 5. Get Cash Sales
// ========================================

export async function getCashSales(companyId?: string) {
  let query = supabase
    .from("sales")
    .select("*")
    .is("customerId", null);

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.order("date", {
    ascending: false,
  });

  if (error) throw error;

  return data as Sale[];
}

// ========================================
// 6. Get Sales By Date Range
// ========================================

export async function getSalesByDateRange(
  startDate: string,
  endDate: string,
  companyId?: string
) {
  let query = supabase
    .from("sales")
    .select("*")
    .gte("date", startDate)
    .lte("date", endDate);

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.order("date", {
    ascending: false,
  });

  if (error) throw error;

  return data as Sale[];
}

// ========================================
// 7. Search Sales
// ========================================

export async function searchSales(
  search: string,
  companyId?: string
) {
  let query = supabase
    .from("sales")
    .select("*")
    .or(
      `invoiceNumber.ilike.%${search}%,customerName.ilike.%${search}%`
    );

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.order("date", {
    ascending: false,
  });

  if (error) throw error;

  return data as Sale[];
}

// ========================================
// 8. Create Sale
// ========================================

export async function createSale(sale: Sale) {
  const { data, error } = await supabase
    .from("sales")
    .insert(sale)
    .select()
    .single();

  if (error) throw error;

  return data as Sale;
}

// ========================================
// 9. Update Sale
// ========================================

export async function updateSale(
  id: string,
  updates: Partial<Sale>
) {
  const { data, error } = await supabase
    .from("sales")
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as Sale;
}

// ========================================
// 10. Delete Sale
// ========================================

export async function deleteSale(id: string) {
  const { error } = await supabase
    .from("sales")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return true;
}