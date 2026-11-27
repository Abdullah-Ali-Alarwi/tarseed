import { supabase } from "@/lib/supabase";

// ========================================
// Supplier Type
// ========================================

export interface Supplier {
  id?: string;
  companyId: string;

  name: string;
  phone?: string;
  address?: string;

  // حساب المورد في شجرة الحسابات
  accountId?: string;
  accountCode?: string;
  accountName?: string;

  // الحساب الأب (2101 الموردون)
  parentAccountId?: string;
  parentAccountCode?: string;

  balance: number;

  notes?: string;

  status: string;
  isActive: boolean;

  createdBy?: string;
  createdById?: string;

  createdAt?: string;
  updatedAt?: string;
}

// ========================================
// 1. Get All Suppliers
// ========================================

export async function getSuppliers(companyId: string) {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("companyId", companyId)
    .order("createdAt", { ascending: false });

  if (error) throw error;

  return (data ?? []) as Supplier[];
}

// ========================================
// 2. Get Supplier By ID
// ========================================

export async function getSupplierById(
  id: string,
  companyId: string
) {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .eq("companyId", companyId)
    .maybeSingle();

  if (error) throw error;

  return data as Supplier | null;
}

// ========================================
// 3. Get Supplier By Name
// ========================================

export async function getSupplierByName(
  name: string,
  companyId: string
) {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("name", name)
    .eq("companyId", companyId)
    .maybeSingle();

  if (error) throw error;

  return data as Supplier | null;
}

// ========================================
// 4. Search Suppliers
// ========================================

export async function searchSuppliers(
  search: string,
  companyId: string
) {
  const term = search.trim();

  let query = supabase
    .from("suppliers")
    .select("*")
    .eq("companyId", companyId);

  if (term) {
    query = query.or(
      `name.ilike.%${term}%,phone.ilike.%${term}%,accountCode.ilike.%${term}%`
    );
  }

  const { data, error } = await query.order("createdAt", {
    ascending: false,
  });

  if (error) throw error;

  return (data ?? []) as Supplier[];
}

// ========================================
// 5. Get Active Suppliers
// ========================================

export async function getActiveSuppliers(companyId: string) {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("companyId", companyId)
    .eq("isActive", true)
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) throw error;

  return (data ?? []) as Supplier[];
}

// ========================================
// 6. Create Supplier
// ========================================

export async function createSupplier(supplier: Supplier) {
  if (!supplier.companyId) {
    throw new Error("Company ID is required");
  }

  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      ...supplier,
      balance: supplier.balance ?? 0,
      status: supplier.status ?? "active",
      isActive: supplier.isActive ?? true,
    })
    .select()
    .single();

  if (error) throw error;

  return data as Supplier;
}

// ========================================
// 7. Update Supplier
// ========================================

export async function updateSupplier(
  id: string,
  companyId: string,
  updates: Partial<Supplier>
) {
  const {
    id: _id,
    companyId: _companyId,
    createdAt: _createdAt,
    ...safeUpdates
  } = updates;

  const { data, error } = await supabase
    .from("suppliers")
    .update({
      ...safeUpdates,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("companyId", companyId)
    .select()
    .single();

  if (error) throw error;

  return data as Supplier;
}

// ========================================
// 8. Delete Supplier
// ========================================

export async function deleteSupplier(
  id: string,
  companyId: string
) {
  const { data, error } = await supabase
    .from("suppliers")
    .delete()
    .eq("id", id)
    .eq("companyId", companyId)
    .select("id")
    .single();

  if (error) throw error;

  return true;
}