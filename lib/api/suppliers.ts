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

  accountCode?: string;
  accountName?: string;

  balance: number;

  notes?: string;

  status: string;
  isActive: boolean;

  createdAt?: string;
  updatedAt?: string;
}

// ========================================
// 1. Get All Suppliers
// ========================================

export async function getSuppliers(companyId?: string) {
  let query = supabase
    .from("suppliers")
    .select("*");

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.order("createdAt", {
    ascending: false,
  });

  if (error) throw error;

  return data as Supplier[];
}

// ========================================
// 2. Get Supplier By ID
// ========================================

export async function getSupplierById(id: string) {
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as Supplier;
}

// ========================================
// 3. Get Supplier By Name
// ========================================

export async function getSupplierByName(
  name: string,
  companyId?: string
) {
  let query = supabase
    .from("suppliers")
    .select("*")
    .eq("name", name);

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) throw error;

  return data as Supplier | null;
}

// ========================================
// 4. Search Suppliers
// ========================================

export async function searchSuppliers(
  search: string,
  companyId?: string
) {
  let query = supabase
    .from("suppliers")
    .select("*")
    .or(
      `name.ilike.%${search}%,phone.ilike.%${search}%,accountCode.ilike.%${search}%`
    );

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.order("createdAt", {
    ascending: false,
  });

  if (error) throw error;

  return data as Supplier[];
}

// ========================================
// 5. Get Active Suppliers
// ========================================

export async function getActiveSuppliers(companyId?: string) {
  let query = supabase
    .from("suppliers")
    .select("*")
    .eq("isActive", true)
    .eq("status", "active");

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.order("name", {
    ascending: true,
  });

  if (error) throw error;

  return data as Supplier[];
}

// ========================================
// 6. Create Supplier
// ========================================

export async function createSupplier(supplier: Supplier) {
  const { data, error } = await supabase
    .from("suppliers")
    .insert(supplier)
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
  updates: Partial<Supplier>
) {
  const { data, error } = await supabase
    .from("suppliers")
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as Supplier;
}

// ========================================
// 8. Delete Supplier
// ========================================

export async function deleteSupplier(id: string) {
  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return true;
}