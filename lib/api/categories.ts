import { supabase } from "@/lib/supabase";

// ========================================
// Category Type
// ========================================

export interface Category {
  id?: string;
  companyId: string;
  name: string;
  code?: string;
  description?: string;
  status: string;

  userId?: string;
  userName?: string;
  username?: string;
  userRole?: string;

  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
}

// ========================================
// 1. Get All Categories
// ========================================

export async function getCategories(companyId?: string) {
  let query = supabase
    .from("categories")
    .select("*");

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data as Category[];
}

// ========================================
// 2. Get Category By ID
// ========================================

export async function getCategoryById(id: string) {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as Category;
}

// ========================================
// 3. Create Category
// ========================================

export async function createCategory(category: Category) {
  const { data, error } = await supabase
    .from("categories")
    .insert(category)
    .select()
    .single();

  if (error) throw error;

  return data as Category;
}

// ========================================
// 4. Update Category
// ========================================

export async function updateCategory(
  id: string,
  updates: Partial<Category>
) {
  const { data, error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as Category;
}

// ========================================
// 5. Delete Category
// ========================================

export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return true;
}