import { supabase } from "@/lib/supabase";

// ==============================
// Unit Interface
// ==============================

export interface Unit {
  id?: string;
  companyId: string;

  name: string;
  symbol: string;

  status?: string;
  isDefault?: boolean;

  userId?: string;
  userName?: string;
  username?: string;
  userRole?: string;

  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
}

// ==============================
// Get All Units
// ==============================

export async function getUnits(companyId?: string): Promise<Unit[]> {
  let query = supabase
    .from("units")
    .select("*")
    .order("name", { ascending: true });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching units:", error);
    throw error;
  }

  return (data || []) as Unit[];
}

// ==============================
// Get Unit By ID
// ==============================

export async function getUnitById(id: string): Promise<Unit | null> {
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching unit:", error);
    throw error;
  }

  return data as Unit | null;
}

// ==============================
// Get Units By Company
// ==============================

export async function getUnitsByCompany(
  companyId: string
): Promise<Unit[]> {
  return getUnits(companyId);
}

// ==============================
// Get Active Units
// ==============================

export async function getActiveUnits(
  companyId: string
): Promise<Unit[]> {
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .eq("companyId", companyId)
    .eq("status", "active")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching active units:", error);
    throw error;
  }

  return (data || []) as Unit[];
}

// ==============================
// Get Default Units
// ==============================

export async function getDefaultUnits(
  companyId: string
): Promise<Unit[]> {
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .eq("companyId", companyId)
    .eq("isDefault", true)
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching default units:", error);
    throw error;
  }

  return (data || []) as Unit[];
}

// ==============================
// Search Units
// ==============================

export async function searchUnits(
  search: string,
  companyId?: string
): Promise<Unit[]> {
  let query = supabase
    .from("units")
    .select("*")
    .or(`name.ilike.%${search}%,symbol.ilike.%${search}%`)
    .order("name", { ascending: true });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error searching units:", error);
    throw error;
  }

  return (data || []) as Unit[];
}

// ==============================
// Get Unit By Name
// ==============================

export async function getUnitByName(
  name: string,
  companyId: string
): Promise<Unit | null> {
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .eq("companyId", companyId)
    .eq("name", name)
    .maybeSingle();

  if (error) {
    console.error("Error fetching unit by name:", error);
    throw error;
  }

  return data as Unit | null;
}

// ==============================
// Create Unit
// ==============================

export async function createUnit(unit: Unit): Promise<Unit> {
  const { data, error } = await supabase
    .from("units")
    .insert([unit])
    .select()
    .single();

  if (error) {
    console.error("Error creating unit:", error);
    throw error;
  }

  return data as Unit;
}

// ==============================
// Update Unit
// ==============================

export async function updateUnit(
  id: string,
  updates: Partial<Unit>
): Promise<Unit> {
  const { data, error } = await supabase
    .from("units")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating unit:", error);
    throw error;
  }

  return data as Unit;
}

// ==============================
// Delete Unit
// ==============================

export async function deleteUnit(id: string): Promise<boolean> {
  const { error } = await supabase
    .from("units")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting unit:", error);
    throw error;
  }

  return true;
}