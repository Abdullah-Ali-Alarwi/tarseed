import { supabase } from "@/lib/supabase";

// ========================================
// Customer Type
// ========================================

export interface Customer {
  id?: string;
  companyId: string;
  code: string;
  name: string;
  phone?: string;
  address?: string;
  balance: number;
  notes?: string;
  accountCode?: string;
  accountName?: string;
  isActive: boolean;
  status: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  createdById?: string;
}

// ========================================
// 1. Get All Customers
// ========================================

export async function getCustomers(companyId?: string) {
  let query = supabase
    .from("customers")
    .select("*");

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.order("createdAt", {
    ascending: false,
  });

  if (error) throw error;

  return data as Customer[];
}

// ========================================
// 2. Get Customer By ID
// ========================================

export async function getCustomerById(id: string) {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as Customer;
}

// ========================================
// 3. Create Customer
// ========================================

export async function createCustomer(customer: Customer) {
  const { data, error } = await supabase
    .from("customers")
    .insert(customer)
    .select()
    .single();

  if (error) throw error;

  return data as Customer;
}

// ========================================
// 4. Update Customer
// ========================================

export async function updateCustomer(
  id: string,
  updates: Partial<Customer>
) {
  const { data, error } = await supabase
    .from("customers")
    .update({
      ...updates,
      updatedAt: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as Customer;
}

// ========================================
// 5. Delete Customer
// ========================================

export async function deleteCustomer(id: string) {
  const { error } = await supabase
    .from("customers")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return true;
}