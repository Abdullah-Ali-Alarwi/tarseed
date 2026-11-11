import {
  Account,
  AccountId,
  AccountNature,
  AccountType,
} from "./types";

// تحديد طبيعة الحساب تلقائياً
export function getAccountNature(
  type: AccountType
): AccountNature {
  if (type === "asset" || type === "expense") {
    return "debit";
  }

  return "credit";
}

// مقارنة معرفات الحسابات
export function isSameAccountId(
  first: AccountId | null,
  second: AccountId | null
) {
  return String(first ?? "") === String(second ?? "");
}

// حساب مستوى الحساب
export function getAccountLevel(
  parentId: AccountId | null,
  accounts: Account[]
): number {
  if (parentId === null) return 1;

  const parent = accounts.find((account) =>
    isSameAccountId(account.id, parentId)
  );

  return parent ? parent.level + 1 : 1;
}

// أسماء أنواع الحسابات
export function getAccountTypeName(
  type: AccountType
): string {
  const types: Record<AccountType, string> = {
    asset: "الأصول",
    liability: "الالتزامات",
    equity: "حقوق الملكية",
    revenue: "الإيرادات",
    expense: "المصروفات",
  };

  return types[type];
}

// طبيعة الحساب بالعربي
export function getNatureName(
  nature: AccountNature
): string {
  return nature === "debit" ? "مدين" : "دائن";
}

// ترتيب الحسابات في شجرة
export function buildAccountTree(
  accounts: Account[],
  parentId: AccountId | null = null
): Account[] {
  return accounts
    .filter((account) =>
      isSameAccountId(account.parentId, parentId)
    )
    .sort((a, b) => a.code.localeCompare(b.code))
    .flatMap((account) => [
      account,
      ...buildAccountTree(accounts, account.id),
    ]);
}

// التحقق من وجود أبناء للحساب
export function hasChildren(
  accountId: AccountId,
  accounts: Account[]
): boolean {
  return accounts.some((account) =>
    isSameAccountId(account.parentId, accountId)
  );
}

// التحقق من إمكانية اختيار الحساب كأب
export function canBeParent(account: Account): boolean {
  return account.isGroup && account.isActive;
}

// تنسيق العملة
export function formatMoney(value: number): string {
  return new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}