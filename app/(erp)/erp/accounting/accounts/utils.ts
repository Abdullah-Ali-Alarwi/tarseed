import type {
  Account,
  AccountId,
  AccountNature,
  AccountType,
} from "@/lib/api/accounts";

// ==============================
// تحديد طبيعة الحساب تلقائياً
// ==============================

export function getAccountNature(
  type: AccountType
): AccountNature {
  if (type === "asset" || type === "expense") {
    return "debit";
  }

  return "credit";
}

// ==============================
// مقارنة معرفات الحسابات
// ==============================

export function isSameAccountId(
  first: AccountId | null | undefined,
  second: AccountId | null | undefined
): boolean {
  return String(first ?? "") === String(second ?? "");
}

// ==============================
// حساب مستوى الحساب
// ==============================

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

// ==============================
// أسماء أنواع الحسابات
// ==============================

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

// ==============================
// طبيعة الحساب بالعربي
// ==============================

export function getNatureName(
  nature: AccountNature
): string {
  return nature === "debit" ? "مدين" : "دائن";
}

// ==============================
// ترتيب الحسابات في شجرة
// ==============================

export function buildAccountTree(
  accounts: Account[],
  parentId: AccountId | null = null,
  visited: Set<string> = new Set()
): Account[] {
  return accounts
    .filter((account) =>
      isSameAccountId(account.parentId, parentId)
    )
    .sort((a, b) =>
      a.code.localeCompare(b.code, "en", {
        numeric: true,
      })
    )
    .flatMap((account) => {
      const accountKey = String(account.id);

      // منع الدوران اللانهائي في حالة وجود علاقة دائرية
      if (visited.has(accountKey)) {
        return [];
      }

      const nextVisited = new Set(visited);
      nextVisited.add(accountKey);

      return [
        account,
        ...buildAccountTree(
          accounts,
          account.id,
          nextVisited
        ),
      ];
    });
}

// ==============================
// التحقق من وجود أبناء للحساب
// ==============================

export function hasChildren(
  accountId: AccountId,
  accounts: Account[]
): boolean {
  return accounts.some((account) =>
    isSameAccountId(account.parentId, accountId)
  );
}

// ==============================
// التحقق من إمكانية اختيار الحساب كأب
// ==============================

export function canBeParent(account: Account): boolean {
  return (
    account.isGroup === true &&
    account.isActive !== false &&
    account.allowPosting === false
  );
}

// ==============================
// تنسيق العملة
// ==============================

export function formatMoney(value: number): string {
  return new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}