import { supabase } from "@/lib/supabase";
import { defaultAccounts } from "@/lib/data/defaultAccounts";

// =====================================================
// TYPES
// =====================================================

export type AccountData = Record<string, any>;

export type AccountRecord = {
  id: string;
  companyId: string;
  code: string;
  name: string;
  nameEn?: string;
  type: string;
  accountType?: string;
  nature: string;
  parentId?: string | null;
  parentCode?: string | null;
  level?: number | null;
  isGroup?: boolean;
  allowPosting?: boolean;
  isActive?: boolean;
  isSystem?: boolean;
  systemKey?: string | null;
  status?: string;
  balance?: number;
  description?: string;
  entityType?: string | null;
  entityId?: string | null;
  extra?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
};

// =====================================================
// DATABASE COLUMNS
// =====================================================

const ACCOUNT_COLUMNS = [
  "id",
  "companyId",
  "code",
  "name",
  "type",
  "nature",
  "parentId",
  "isGroup",
  "isSystem",
  "status",
  "systemKey",
  "isActive",
  "extra",
  "createdAt",
  "updatedAt",
] as const;

const DIRECT_COLUMNS = new Set<string>(ACCOUNT_COLUMNS);

// =====================================================
// HELPERS
// =====================================================

function throwSupabaseError(error: any, context: string): never {
  console.error(context, error);

  throw new Error(
    error?.message || "حدث خطأ أثناء التعامل مع الحسابات",
  );
}

function normalizeAccount(account: any): AccountRecord {
  const extra =
    account.extra && typeof account.extra === "object"
      ? account.extra
      : {};

  return {
    ...extra,
    ...account,

    nameEn: extra.nameEn ?? account.nameEn,
    accountType: extra.accountType ?? account.type,
    parentCode: extra.parentCode ?? null,
    level: extra.level ?? null,
    allowPosting: extra.allowPosting ?? !account.isGroup,
    balance: extra.balance ?? 0,
    description: extra.description ?? undefined,
    entityType: extra.entityType ?? undefined,
    entityId: extra.entityId ?? undefined,

    extra,
  } as AccountRecord;
}

function isGroupAccount(account: AccountRecord): boolean {
  return account.isGroup === true;
}

function sortAccounts(accounts: AccountRecord[]): AccountRecord[] {
  return [...accounts].sort((a, b) =>
    String(a.code).localeCompare(
      String(b.code),
      undefined,
      { numeric: true },
    ),
  );
}

/**
 * يفصل الأعمدة الموجودة فعليًا في قاعدة البيانات
 * عن البيانات الإضافية التي تحفظ داخل extra.
 */
function prepareAccountData(data: AccountData) {
  const databaseData: Record<string, any> = {};

  const extraData: Record<string, any> = {
    ...(data.extra || {}),
  };

  Object.entries(data).forEach(([key, value]) => {
    if (key === "extra") return;

    if (DIRECT_COLUMNS.has(key)) {
      databaseData[key] = value;
    } else if (value !== undefined) {
      extraData[key] = value;
    }
  });

  if (Object.keys(extraData).length > 0) {
    databaseData.extra = extraData;
  }

  return databaseData;
}

// =====================================================
// GET ACCOUNTS
// =====================================================

export async function getAccounts(
  companyId: string,
): Promise<AccountRecord[]> {
  if (!companyId) {
    throw new Error("يجب تحديد الشركة");
  }

  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("companyId", String(companyId))
    .order("code", { ascending: true });

  if (error) {
    throwSupabaseError(error, "Get accounts error");
  }

  return sortAccounts((data ?? []).map(normalizeAccount));
}

// =====================================================
// GET ACCOUNT BY ID
// =====================================================

export async function getAccountById(
  id: string,
  companyId?: string,
): Promise<AccountRecord | null> {
  let query = supabase
    .from("accounts")
    .select("*")
    .eq("id", String(id));

  if (companyId) {
    query = query.eq("companyId", String(companyId));
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throwSupabaseError(error, "Get account by ID error");
  }

  return data ? normalizeAccount(data) : null;
}

// =====================================================
// GET ACCOUNT BY CODE
// =====================================================

export async function getAccountByCode(
  code: string,
  companyId: string,
): Promise<AccountRecord | null> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("companyId", String(companyId))
    .eq("code", String(code))
    .maybeSingle();

  if (error) {
    throwSupabaseError(error, "Get account by code error");
  }

  return data ? normalizeAccount(data) : null;
}

// =====================================================
// GET CUSTOMER MAIN ACCOUNT
// =====================================================

export async function getCustomerMainAccount(
  companyId: string,
): Promise<AccountRecord | null> {
  return getAccountByCode("1103", companyId);
}

// =====================================================
// GET SUPPLIER MAIN ACCOUNT
// =====================================================

export async function getSupplierMainAccount(
  companyId: string,
): Promise<AccountRecord | null> {
  return getAccountByCode("2101", companyId);
}

// =====================================================
// GET CHILD ACCOUNTS
// =====================================================

export async function getChildAccounts(
  parentId: string,
  companyId: string,
): Promise<AccountRecord[]> {
  const { data, error } = await supabase
    .from("accounts")
    .select("*")
    .eq("companyId", String(companyId))
    .eq("parentId", String(parentId))
    .order("code", { ascending: true });

  if (error) {
    throwSupabaseError(error, "Get child accounts error");
  }

  return (data ?? []).map(normalizeAccount);
}

// =====================================================
// CHECK ACCOUNT CODE
// =====================================================

export async function isAccountCodeExists(
  code: string,
  companyId: string,
  excludeId?: string,
): Promise<boolean> {
  let query = supabase
    .from("accounts")
    .select("id")
    .eq("companyId", String(companyId))
    .eq("code", String(code));

  if (excludeId) {
    query = query.neq("id", String(excludeId));
  }

  const { data, error } = await query.limit(1);

  if (error) {
    throwSupabaseError(error, "Check account code error");
  }

  return (data?.length ?? 0) > 0;
}

// =====================================================
// CREATE ACCOUNT
// =====================================================

export async function createAccount(
  accountData: AccountData,
): Promise<AccountRecord> {
  const companyId = String(accountData.companyId || "");
  const code = String(accountData.code || "").trim();
  const name = String(accountData.name || "").trim();

  if (!companyId) {
    throw new Error("يجب تحديد الشركة");
  }

  if (!code) {
    throw new Error("كود الحساب مطلوب");
  }

  if (!name) {
    throw new Error("اسم الحساب مطلوب");
  }

  // التحقق من عدم تكرار الكود داخل الشركة
  const exists = await isAccountCodeExists(code, companyId);

  if (exists) {
    throw new Error(`كود الحساب ${code} مستخدم بالفعل`);
  }

  // التحقق من الحساب الأب
  if (accountData.parentId) {
    const parent = await getAccountById(
      String(accountData.parentId),
      companyId,
    );

    if (!parent) {
      throw new Error("الحساب الأب غير موجود");
    }

    if (!isGroupAccount(parent)) {
      throw new Error("لا يمكن إضافة حساب تحت حساب تفصيلي");
    }
  }

  const payload = prepareAccountData({
    ...accountData,

    id: accountData.id || crypto.randomUUID(),
    companyId,
    code,
    name,

    isGroup: accountData.isGroup ?? false,
    isSystem: accountData.isSystem ?? false,
    isActive: accountData.isActive ?? true,
    status: accountData.status ?? "active",

    extra: {
      ...(accountData.extra || {}),
      accountType: accountData.accountType ?? accountData.type,
      allowPosting:
        accountData.allowPosting ?? !accountData.isGroup,
      balance: accountData.balance ?? 0,
    },
  });

  const { data, error } = await supabase
    .from("accounts")
    .insert(payload)
    .select("*")
    .single();

  if (error) {
    throwSupabaseError(error, "Create account error");
  }

  return normalizeAccount(data);
}

// =====================================================
// UPDATE ACCOUNT
// =====================================================

export async function updateAccount(
  id: string,
  updates: AccountData,
  companyId?: string,
): Promise<AccountRecord> {
  // قراءة الحساب الحالي للحفاظ على extra والحقول غير المرسلة
  let currentQuery = supabase
    .from("accounts")
    .select("*")
    .eq("id", String(id));

  if (companyId) {
    currentQuery = currentQuery.eq("companyId", String(companyId));
  }

  const { data: current, error: currentError } =
    await currentQuery.maybeSingle();

  if (currentError) {
    throwSupabaseError(
      currentError,
      "Get account before update error",
    );
  }

  if (!current) {
    throw new Error("الحساب غير موجود");
  }

  // منع تغيير الشركة
  if (
    updates.companyId !== undefined &&
    String(updates.companyId) !== String(current.companyId)
  ) {
    throw new Error("لا يمكن نقل الحساب إلى شركة أخرى");
  }

  // التحقق من الكود عند تغييره
  if (
    updates.code !== undefined &&
    String(updates.code) !== String(current.code)
  ) {
    const exists = await isAccountCodeExists(
      String(updates.code),
      String(current.companyId),
      String(id),
    );

    if (exists) {
      throw new Error(
        `كود الحساب ${updates.code} مستخدم بالفعل`,
      );
    }
  }

  // التحقق من الحساب الأب عند تغييره
  if (
    updates.parentId !== undefined &&
    updates.parentId !== null
  ) {
    if (String(updates.parentId) === String(id)) {
      throw new Error("لا يمكن جعل الحساب أبًا لنفسه");
    }

    const parent = await getAccountById(
      String(updates.parentId),
      String(current.companyId),
    );

    if (!parent) {
      throw new Error("الحساب الأب غير موجود");
    }

    if (!isGroupAccount(parent)) {
      throw new Error("لا يمكن إضافة حساب تحت حساب تفصيلي");
    }
  }

  // الحقول التي تحفظ داخل extra
  const extraKeys = [
    "accountType",
    "nameEn",
    "parentCode",
    "level",
    "allowPosting",
    "balance",
    "description",
    "entityType",
    "entityId",
  ];

  const extraUpdates: Record<string, any> = {
    ...(current.extra || {}),
    ...(updates.extra || {}),
  };

  extraKeys.forEach((key) => {
    if (updates[key] !== undefined) {
      extraUpdates[key] = updates[key];
    }
  });

  // الحقول الموجودة مباشرة في جدول accounts
  const directUpdates: Record<string, any> = {};

  Object.entries(updates).forEach(([key, value]) => {
    if (
      DIRECT_COLUMNS.has(key) &&
      key !== "id" &&
      key !== "companyId" &&
      key !== "createdAt" &&
      key !== "extra" &&
      value !== undefined
    ) {
      directUpdates[key] = value;
    }
  });

  if (updates.name !== undefined) {
    directUpdates.name = String(updates.name).trim();

    if (!directUpdates.name) {
      throw new Error("اسم الحساب مطلوب");
    }
  }

  if (updates.code !== undefined) {
    directUpdates.code = String(updates.code).trim();

    if (!directUpdates.code) {
      throw new Error("كود الحساب مطلوب");
    }
  }

  if (Object.keys(extraUpdates).length > 0) {
    directUpdates.extra = extraUpdates;
  }

  directUpdates.updatedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("accounts")
    .update(directUpdates)
    .eq("id", String(id))
    .eq("companyId", String(current.companyId))
    .select("*")
    .single();

  if (error) {
    throwSupabaseError(error, "Update account error");
  }

  return normalizeAccount(data);
}

// =====================================================
// DELETE ACCOUNT
// =====================================================

export async function deleteAccount(
  id: string,
  companyId?: string,
): Promise<boolean> {
  const account = await getAccountById(id, companyId);

  if (!account) {
    throw new Error("الحساب غير موجود");
  }

  if (account.isSystem) {
    throw new Error("لا يمكن حذف حساب نظام أساسي");
  }

  // التحقق من وجود حسابات فرعية
  const children = await getChildAccounts(
    id,
    account.companyId,
  );

  if (children.length > 0) {
    throw new Error(
      "لا يمكن حذف حساب يحتوي على حسابات فرعية",
    );
  }

  const { error } = await supabase
    .from("accounts")
    .delete()
    .eq("id", String(id))
    .eq("companyId", String(account.companyId));

  if (error) {
    throwSupabaseError(error, "Delete account error");
  }

  return true;
}

// =====================================================
// CREATE CUSTOMER ACCOUNT
// =====================================================

export async function createCustomerAccount(
  companyId: string,
  customerId: string,
  customerName: string,
  accountCode?: string,
): Promise<AccountRecord> {
  const parentAccount = await getCustomerMainAccount(companyId);

  if (!parentAccount) {
    throw new Error(
      "حساب العملاء الرئيسي 1103 غير موجود",
    );
  }

  const accounts = await getAccounts(companyId);

  const generatedCode =
    accountCode ||
    generateEntityAccountCode(
      accounts,
      parentAccount.code,
    );

  return createAccount({
    companyId,
    code: generatedCode,
    name: customerName.trim(),

    type: "asset",
    nature: "debit",

    parentId: parentAccount.id,

    isGroup: false,
    isSystem: false,
    isActive: true,
    status: "active",

    accountType: "asset",
    parentCode: parentAccount.code,
    level: Number(parentAccount.level ?? 3) + 1,
    allowPosting: true,
    balance: 0,

    entityType: "customer",
    entityId: customerId,
  });
}

// =====================================================
// CREATE SUPPLIER ACCOUNT
// =====================================================

export async function createSupplierAccount(
  companyId: string,
  supplierId: string,
  supplierName: string,
  accountCode?: string,
): Promise<AccountRecord> {
  const parentAccount = await getSupplierMainAccount(companyId);

  if (!parentAccount) {
    throw new Error(
      "حساب الموردين الرئيسي 2101 غير موجود",
    );
  }

  const accounts = await getAccounts(companyId);

  const generatedCode =
    accountCode ||
    generateEntityAccountCode(
      accounts,
      parentAccount.code,
    );

  return createAccount({
    companyId,
    code: generatedCode,
    name: supplierName.trim(),

    type: "liability",
    nature: "credit",

    parentId: parentAccount.id,

    isGroup: false,
    isSystem: false,
    isActive: true,
    status: "active",

    accountType: "liability",
    parentCode: parentAccount.code,
    level: Number(parentAccount.level ?? 3) + 1,
    allowPosting: true,
    balance: 0,

    entityType: "supplier",
    entityId: supplierId,
  });
}

// =====================================================
// GENERATE ENTITY ACCOUNT CODE
// =====================================================

function generateEntityAccountCode(
  accounts: AccountRecord[],
  parentCode: string,
): string {
  const children = accounts.filter(
    (account) =>
      String(account.parentCode || "") ===
      String(parentCode),
  );

  let max = 0;

  children.forEach((account) => {
    const code = String(account.code);
    const suffix = code.substring(parentCode.length);

    if (/^\d+$/.test(suffix)) {
      const number = Number(suffix);

      if (number > max) {
        max = number;
      }
    }
  });

  return `${parentCode}${String(max + 1).padStart(3, "0")}`;
}

// =====================================================
// CREATE DEFAULT ACCOUNTS
// =====================================================

export async function createDefaultAccounts(
  companyId: string,
): Promise<AccountRecord[]> {
  if (!companyId) {
    throw new Error(
      "يجب تحديد الشركة لإنشاء دليل الحسابات",
    );
  }

  // جلب الحسابات الموجودة بالفعل
  const existingAccounts = await getAccounts(companyId);

  // الاحتفاظ بمعرفات الحسابات الموجودة
  const accountIds = new Map<string, string>();

  existingAccounts.forEach((account) => {
    accountIds.set(
      String(account.code),
      String(account.id),
    );
  });

  // تحديد الحسابات الناقصة فقط
  const missingAccounts = defaultAccounts.filter(
    (account) =>
      !accountIds.has(String(account.code)),
  );

  // التحقق من الحسابات الأب
  for (const account of missingAccounts) {
    if (
      account.parentCode &&
      !accountIds.has(String(account.parentCode)) &&
      !defaultAccounts.some(
        (item) =>
          String(item.code) ===
          String(account.parentCode),
      )
    ) {
      throw new Error(
        `الحساب الأب ${account.parentCode} غير موجود للحساب ${account.code}`,
      );
    }
  }

  // إنشاء معرفات للحسابات الناقصة
  missingAccounts.forEach((account) => {
    accountIds.set(
      String(account.code),
      crypto.randomUUID(),
    );
  });

  // خريطة الحسابات الافتراضية
  const accountMap = new Map(
    defaultAccounts.map((account) => [
      String(account.code),
      account,
    ]),
  );

  const levels = new Map<string, number>();

  // حساب مستوى كل حساب والتحقق من عدم وجود دورة
  function getLevel(
    code: string,
    visited = new Set<string>(),
  ): number {
    if (levels.has(code)) {
      return levels.get(code)!;
    }

    if (visited.has(code)) {
      throw new Error(
        `يوجد ارتباط دائري في الحساب ${code}`,
      );
    }

    visited.add(code);

    const account = accountMap.get(code);

    if (!account) {
      throw new Error(
        `الحساب ${code} غير موجود في دليل الحسابات الافتراضي`,
      );
    }

    if (!account.parentCode) {
      levels.set(code, 1);
      return 1;
    }

    const parentCode = String(account.parentCode);

    const level = getLevel(parentCode, visited) + 1;

    levels.set(code, level);

    return level;
  }

  // تجهيز الحسابات الناقصة للإدخال
  const accountsToInsert = missingAccounts.map(
    (account) => {
      const code = String(account.code);

      const parentId = account.parentCode
        ? accountIds.get(String(account.parentCode))
        : null;

      if (account.parentCode && !parentId) {
        throw new Error(
          `تعذر تحديد الحساب الأب ${account.parentCode} للحساب ${code}`,
        );
      }

      const level = getLevel(code);

      return {
        id: accountIds.get(code)!,
        companyId: String(companyId),

        code,
        name: account.name,

        type: account.type,
        nature: account.nature,

        parentId,

        isGroup: account.isGroup,
        isSystem: true,
        isActive: true,
        status: "active",

        extra: {
          accountType: account.type,
          parentCode: account.parentCode
            ? String(account.parentCode)
            : null,
          level,
          allowPosting: !account.isGroup,
          balance: 0,
        },
      };
    },
  );

  // إدخال الحسابات الناقصة فقط
  if (accountsToInsert.length > 0) {
    const { error } = await supabase
      .from("accounts")
      .insert(accountsToInsert);

    if (error) {
      throwSupabaseError(
        error,
        "Create default accounts error",
      );
    }
  }

  // إعادة قراءة دليل الحسابات كاملًا
  return getAccounts(companyId);
}