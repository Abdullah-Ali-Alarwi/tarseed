import { supabase } from "@/lib/supabase";

// ========================================
// Product Type
// ========================================

export interface Product {
  id?: string;
  companyId: string;
  itemId?: string;

  name: string;
  sku: string;
  barcode?: string;

  categoryId: string;
  categoryName?: string;

  unitId: string;
  unitName?: string;

  warehouseId?: string;

  purchasePrice?: number;
  sellingPrice?: number;

  currentStock?: number;
  minStock?: number;

  trackInventory?: boolean;

  description?: string;
  status: string;

  createdAt?: string;
}

// ========================================
// 1. Get All Products
// ========================================

export async function getProducts(companyId?: string) {
  let query = supabase
    .from("products")
    .select("*");

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.order("createdAt", {
    ascending: false,
  });

  if (error) throw error;

  return data as Product[];
}

// ========================================
// 2. Get Product By ID
// ========================================

export async function getProductById(id: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as Product;
}

// ========================================
// 3. Get Products By Category
// ========================================

export async function getProductsByCategory(
  categoryId: string,
  companyId?: string
) {
  let query = supabase
    .from("products")
    .select("*")
    .eq("categoryId", categoryId);

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data as Product[];
}

// ========================================
// 4. Search Products
// ========================================

export async function searchProducts(
  search: string,
  companyId?: string
) {
  let query = supabase
    .from("products")
    .select("*")
    .or(`name.ilike.%${search}%,sku.ilike.%${search}%,barcode.ilike.%${search}%`);

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data as Product[];
}

// ========================================
// 5. Create Product
// ========================================

export async function createProduct(product: Product) {
  const { data, error } = await supabase
    .from("products")
    .insert(product)
    .select()
    .single();

  if (error) throw error;

  return data as Product;
}

// ========================================
// 6. Update Product
// ========================================

export async function updateProduct(
  id: string,
  updates: Partial<Product>
) {
  const { data, error } = await supabase
    .from("products")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return data as Product;
}

// ========================================
// 7. Delete Product
// ========================================

export async function deleteProduct(id: string) {
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) throw error;

  return true;
}