import { supabase } from "@/lib/supabase";

// ==============================
// Types
// ==============================

export type AccountId = string | number;

export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense";

export type AccountNature = "debit" | "credit";

export interface Account {
  id: AccountId;
  companyId: string;

  code: string;
  name: string;
  nameEn?: string;

  parentId: AccountId | null;
  parentCode?: string;

  type: AccountType;
  accountType?: AccountType;
  nature: AccountNature;

  level: number;

  isGroup: boolean;
  allowPosting: boolean;
  isActive: boolean;

  isSystem?: boolean;
  systemKey?: string;

  status?: string;
  balance?: number;

  description?: string;
  createdAt: string;
}

// ==============================
// Get All Accounts
// ==============================

export async function getAccounts(
  companyId?: string
): Promise<Account[]> {
  let query = supabase
    .from("accounts")
    .select("*")
    .order("code", { ascending: true });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as Account[];
}

// ==============================
// Get Account By ID
// ==============================

export async function getAccountById(
  id: AccountId
): Promise<Account | null> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Account | null;
}

// ==============================
// Get Account By Code
// ==============================

export async function getAccountByCode(
  code: string,
  companyId: string
): Promise<Account | null> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("code", code)
    .eq("companyId", companyId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Account | null;
}

// ==============================
// Get Accounts By Type
// ==============================

export async function getAccountsByType(
  type: AccountType,
  companyId?: string
): Promise<Account[]> {
  let query = supabase
    .from("accounts")
    .select("*")
    .eq("type", type)
    .order("code", { ascending: true });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as Account[];
}

// ==============================
// Get Child Accounts
// ==============================

export async function getChildAccounts(
  parentId: AccountId,
  companyId?: string
): Promise<Account[]> {
  let query = supabase
    .from("accounts")
    .select("*")
    .eq("parentId", parentId)
    .order("code", { ascending: true });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as Account[];
}

// ==============================
// Get Root Accounts
// ==============================

export async function getRootAccounts(
  companyId?: string
): Promise<Account[]> {
  let query = supabase
    .from("accounts")
    .select("*")
    .is("parentId", null)
    .order("code", { ascending: true });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as Account[];
}

// ==============================
// Get Group Accounts
// ==============================

export async function getGroupAccounts(
  companyId?: string
): Promise<Account[]> {
  let query = supabase
    .from("accounts")
    .select("*")
    .eq("isGroup", true)
    .order("code", { ascending: true });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as Account[];
}

// ==============================
// Get Posting Accounts
// ==============================

export async function getPostingAccounts(
  companyId?: string
): Promise<Account[]> {
  let query = supabase
    .from("accounts")
    .select("*")
    .eq("allowPosting", true)
    .eq("isActive", true)
    .order("code", { ascending: true });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as Account[];
}

// ==============================
// Get System Accounts
// ==============================

export async function getSystemAccounts(
  companyId?: string
): Promise<Account[]> {
  let query = supabase
    .from("accounts")
    .select("*")
    .eq("isSystem", true)
    .order("code", { ascending: true });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as Account[];
}

// ==============================
// Get Account By System Key
// ==============================

export async function getAccountBySystemKey(
  systemKey: string,
  companyId: string
): Promise<Account | null> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("systemKey", systemKey)
    .eq("companyId", companyId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as Account | null;
}

// ==============================
// Search Accounts
// ==============================

export async function searchAccounts(
  search: string,
  companyId?: string
): Promise<Account[]> {
  let query = supabase
    .from("accounts")
    .select("*")
    .or(`name.ilike.%${search}%,code.ilike.%${search}%`)
    .order("code", { ascending: true });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []) as Account[];
}

// ==============================
// Create Account
// ==============================

export async function createAccount(
  account: Omit<Account, "id"> & { id?: AccountId }
): Promise<Account> {
  const { data, error } = await supabase
    .from("accounts")
    .insert(account)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Account;
}

// ==============================
// Update Account
// ==============================

export async function updateAccount(
  id: AccountId,
  updates: Partial<Omit<Account, "id">>
): Promise<Account> {
  const { data, error } = await supabase
    .from("accounts")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as Account;
}

// ==============================
// Delete Account
// ==============================

export async function deleteAccount(
  id: AccountId
): Promise<void> {
  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", id);

  if (error) {
    throw error;
  }
}