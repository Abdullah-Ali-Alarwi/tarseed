import { supabase } from "@/lib/supabase";
import { defaultAccounts } from "@/lib/data/defaultAccounts";

// ==========================================
// Types
// ==========================================

type AccountData = Record<string, any>;

// ==========================================
// Get Accounts
// ==========================================

export async function getAccounts(companyId?: string) {
  let query = supabase
    .from("accounts")
    .select("*")
    .order("code", { ascending: true });

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Get accounts error:", error);
    throw new Error(error.message);
  }

  return data ?? [];
}

// ==========================================
// Get Account By ID
// ==========================================

export async function getAccountById(
  id: string,
  companyId?: string,
) {
  let query = supabase
    .from("accounts")
    .select("*")
    .eq("id", id);

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.single();

  if (error) {
    console.error("Get account by ID error:", error);
    throw new Error(error.message);
  }

  return data;
}

// ==========================================
// Create Account
// ==========================================

export async function createAccount(accountData: AccountData) {
  if (!accountData.companyId) {
    throw new Error("يجب تحديد الشركة التابعة للحساب");
  }

  const { data, error } = await supabase
    .from("accounts")
    .insert([accountData])
    .select()
    .single();

  if (error) {
    console.error("Create account error:", error);
    throw new Error(error.message);
  }

  return data;
}

// ==========================================
// Update Account
// ==========================================

export async function updateAccount(
  id: string,
  updates: AccountData,
  companyId?: string,
) {
  let query = supabase
    .from("accounts")
    .update(updates)
    .eq("id", id);

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { data, error } = await query.select().single();

  if (error) {
    console.error("Update account error:", error);
    throw new Error(error.message);
  }

  return data;
}

// ==========================================
// Delete Account
// ==========================================

export async function deleteAccount(
  id: string,
  companyId?: string,
) {
  let query = supabase
    .from("accounts")
    .delete()
    .eq("id", id);

  if (companyId) {
    query = query.eq("companyId", companyId);
  }

  const { error } = await query;

  if (error) {
    console.error("Delete account error:", error);
    throw new Error(error.message);
  }

  return true;
}

// ==========================================
// Create Default Accounts
// ==========================================

export async function createDefaultAccounts(companyId: string) {
  if (!companyId) {
    throw new Error("يجب تحديد الشركة لإنشاء دليل الحسابات");
  }

  // التحقق من وجود حسابات سابقة للشركة
  const { data: existingAccounts, error: checkError } = await supabase
    .from("accounts")
    .select("id")
    .eq("companyId", companyId)
    .limit(1);

  if (checkError) {
    console.error("Check default accounts error:", checkError);
    throw new Error(checkError.message);
  }

  if (existingAccounts && existingAccounts.length > 0) {
    return existingAccounts;
  }

  // إنشاء معرفات جديدة للحسابات
  const accountIds = new Map<string, string>();

  defaultAccounts.forEach((account: AccountData) => {
    accountIds.set(String(account.code), crypto.randomUUID());
  });

  // تجهيز الحسابات وربط الحسابات الفرعية
  const accountsToInsert = defaultAccounts.map(
    (account: AccountData) => ({
      id: accountIds.get(String(account.code)),
      companyId,
      code: account.code,
      name: account.name,
      type: account.type,
      nature: account.nature,
      parentId: account.parentCode
        ? accountIds.get(String(account.parentCode)) ?? null
        : null,
      isGroup: account.isGroup ?? false,
      isSystem: account.isSystem ?? false,
      status: account.status ?? "active",
    }),
  );

  const { data, error } = await supabase
    .from("accounts")
    .insert(accountsToInsert)
    .select();

  if (error) {
    console.error("Create default accounts error:", error);
    throw new Error(error.message);
  }

  return data ?? [];
}