"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  FiArrowRight,
  FiSave,
  FiRefreshCw,
  FiPlus,
  FiBookOpen,
  FiFolder,
  FiDollarSign,
  FiLayers,
} from "react-icons/fi";

import {
  getAccounts,
  createAccount as createAccountApi,
  type AccountRecord,
} from "@/lib/api/accounts";

import { getUserByUsername, type User } from "@/lib/api/users";

// الأنواع المستخدمة في صفحة الإنشاء.
// ملف accounts.ts يصدّر AccountRecord ولا يصدّر Account/AccountType/AccountNature.
type Account = AccountRecord;
type AccountType = "asset" | "liability" | "equity" | "revenue" | "expense";
type AccountNature = "debit" | "credit";

// =====================================================
// Types
// =====================================================

interface CurrentUser {
  id: string;
  name: string;
  username: string;
  companyId: string;
  companyname?: string;
}

interface AccountCategory {
  value: AccountType;
  label: string;
  code: string;
  nature: AccountNature;
}

interface AccountForm {
  name: string;
  type: AccountType;
  parentId: string;
  isGroup: boolean;
  description: string;
}

interface DefaultAccount {
  code: string;
  name: string;
  type: AccountType;
  nature: AccountNature;
  parentCode?: string;
  level: number;
  isGroup: boolean;
}

// =====================================================
// Account Categories
// =====================================================

const accountCategories: AccountCategory[] = [
  {
    value: "asset",
    label: "الأصول",
    code: "1",
    nature: "debit",
  },
  {
    value: "liability",
    label: "الالتزامات",
    code: "2",
    nature: "credit",
  },
  {
    value: "equity",
    label: "حقوق الملكية",
    code: "3",
    nature: "credit",
  },
  {
    value: "revenue",
    label: "الإيرادات",
    code: "4",
    nature: "credit",
  },
  {
    value: "expense",
    label: "المصروفات",
    code: "6",
    nature: "debit",
  },
];

// =====================================================
// Default Accounts
// =====================================================

const defaultAccounts: DefaultAccount[] = [
  // الأصول

  {
    code: "1",
    name: "الأصول",
    type: "asset",
    nature: "debit",
    level: 1,
    isGroup: true,
  },
  {
    code: "11",
    name: "الأصول المتداولة",
    type: "asset",
    nature: "debit",
    parentCode: "1",
    level: 2,
    isGroup: true,
  },
  {
    code: "111",
    name: "النقدية",
    type: "asset",
    nature: "debit",
    parentCode: "11",
    level: 3,
    isGroup: true,
  },
  {
    code: "1111",
    name: "الصندوق",
    type: "asset",
    nature: "debit",
    parentCode: "111",
    level: 4,
    isGroup: false,
  },
  {
    code: "1112",
    name: "البنك",
    type: "asset",
    nature: "debit",
    parentCode: "111",
    level: 4,
    isGroup: false,
  },
  {
    code: "112",
    name: "العملاء",
    type: "asset",
    nature: "debit",
    parentCode: "11",
    level: 3,
    isGroup: false,
  },
  {
    code: "113",
    name: "المخزون",
    type: "asset",
    nature: "debit",
    parentCode: "11",
    level: 3,
    isGroup: false,
  },
  {
    code: "114",
    name: "ضريبة القيمة المضافة المدخلة",
    type: "asset",
    nature: "debit",
    parentCode: "11",
    level: 3,
    isGroup: false,
  },
  {
    code: "12",
    name: "الأصول غير المتداولة",
    type: "asset",
    nature: "debit",
    parentCode: "1",
    level: 2,
    isGroup: true,
  },
  {
    code: "121",
    name: "الأثاث والتجهيزات",
    type: "asset",
    nature: "debit",
    parentCode: "12",
    level: 3,
    isGroup: false,
  },
  {
    code: "122",
    name: "الأجهزة والمعدات",
    type: "asset",
    nature: "debit",
    parentCode: "12",
    level: 3,
    isGroup: false,
  },

  // الالتزامات

  {
    code: "2",
    name: "الالتزامات",
    type: "liability",
    nature: "credit",
    level: 1,
    isGroup: true,
  },
  {
    code: "21",
    name: "الالتزامات المتداولة",
    type: "liability",
    nature: "credit",
    parentCode: "2",
    level: 2,
    isGroup: true,
  },
  {
    code: "211",
    name: "الموردون",
    type: "liability",
    nature: "credit",
    parentCode: "21",
    level: 3,
    isGroup: false,
  },
  {
    code: "212",
    name: "ضريبة القيمة المضافة المستحقة",
    type: "liability",
    nature: "credit",
    parentCode: "21",
    level: 3,
    isGroup: false,
  },
  {
    code: "213",
    name: "الرواتب المستحقة",
    type: "liability",
    nature: "credit",
    parentCode: "21",
    level: 3,
    isGroup: false,
  },
  {
    code: "22",
    name: "الالتزامات طويلة الأجل",
    type: "liability",
    nature: "credit",
    parentCode: "2",
    level: 2,
    isGroup: true,
  },
  {
    code: "221",
    name: "القروض طويلة الأجل",
    type: "liability",
    nature: "credit",
    parentCode: "22",
    level: 3,
    isGroup: false,
  },

  // حقوق الملكية

  {
    code: "3",
    name: "حقوق الملكية",
    type: "equity",
    nature: "credit",
    level: 1,
    isGroup: true,
  },
  {
    code: "31",
    name: "رأس المال",
    type: "equity",
    nature: "credit",
    parentCode: "3",
    level: 2,
    isGroup: true,
  },
  {
    code: "311",
    name: "رأس المال",
    type: "equity",
    nature: "credit",
    parentCode: "31",
    level: 3,
    isGroup: false,
  },
  {
    code: "312",
    name: "الأرباح المحتجزة",
    type: "equity",
    nature: "credit",
    parentCode: "31",
    level: 3,
    isGroup: false,
  },
  {
    code: "313",
    name: "المسحوبات الشخصية",
    type: "equity",
    nature: "debit",
    parentCode: "31",
    level: 3,
    isGroup: false,
  },

  // الإيرادات

  {
    code: "4",
    name: "الإيرادات",
    type: "revenue",
    nature: "credit",
    level: 1,
    isGroup: true,
  },
  {
    code: "41",
    name: "إيرادات النشاط",
    type: "revenue",
    nature: "credit",
    parentCode: "4",
    level: 2,
    isGroup: true,
  },
  {
    code: "411",
    name: "إيرادات مبيعات العسل",
    type: "revenue",
    nature: "credit",
    parentCode: "41",
    level: 3,
    isGroup: false,
  },
  {
    code: "412",
    name: "إيرادات مبيعات الزيوت",
    type: "revenue",
    nature: "credit",
    parentCode: "41",
    level: 3,
    isGroup: false,
  },
  {
    code: "413",
    name: "إيرادات العمرة",
    type: "revenue",
    nature: "credit",
    parentCode: "41",
    level: 3,
    isGroup: false,
  },
  {
    code: "414",
    name: "إيرادات أخرى",
    type: "revenue",
    nature: "credit",
    parentCode: "41",
    level: 3,
    isGroup: false,
  },

  // تكلفة المبيعات

  {
    code: "5",
    name: "تكلفة المبيعات",
    type: "expense",
    nature: "debit",
    level: 1,
    isGroup: true,
  },
  {
    code: "51",
    name: "تكلفة البضاعة والخدمات",
    type: "expense",
    nature: "debit",
    parentCode: "5",
    level: 2,
    isGroup: true,
  },
  {
    code: "511",
    name: "تكلفة مبيعات العسل والزيوت",
    type: "expense",
    nature: "debit",
    parentCode: "51",
    level: 3,
    isGroup: false,
  },
  {
    code: "512",
    name: "تكلفة خدمات العمرة",
    type: "expense",
    nature: "debit",
    parentCode: "51",
    level: 3,
    isGroup: false,
  },

  // المصروفات

  {
    code: "6",
    name: "المصروفات",
    type: "expense",
    nature: "debit",
    level: 1,
    isGroup: true,
  },
  {
    code: "61",
    name: "المصروفات التشغيلية والإدارية",
    type: "expense",
    nature: "debit",
    parentCode: "6",
    level: 2,
    isGroup: true,
  },
  {
    code: "611",
    name: "الرواتب والأجور",
    type: "expense",
    nature: "debit",
    parentCode: "61",
    level: 3,
    isGroup: false,
  },
  {
    code: "612",
    name: "الإيجار",
    type: "expense",
    nature: "debit",
    parentCode: "61",
    level: 3,
    isGroup: false,
  },
  {
    code: "613",
    name: "الكهرباء والمياه",
    type: "expense",
    nature: "debit",
    parentCode: "61",
    level: 3,
    isGroup: false,
  },
  {
    code: "614",
    name: "النقل والمواصلات",
    type: "expense",
    nature: "debit",
    parentCode: "61",
    level: 3,
    isGroup: false,
  },
  {
    code: "615",
    name: "التسويق والإعلان",
    type: "expense",
    nature: "debit",
    parentCode: "61",
    level: 3,
    isGroup: false,
  },
  {
    code: "616",
    name: "مصروفات إدارية وعمومية",
    type: "expense",
    nature: "debit",
    parentCode: "61",
    level: 3,
    isGroup: false,
  },
  {
    code: "617",
    name: "الصيانة",
    type: "expense",
    nature: "debit",
    parentCode: "61",
    level: 3,
    isGroup: false,
  },
];

// =====================================================
// Helpers
// =====================================================

function getAccountType(account: Account): AccountType {
  return (account.type || account.accountType || "asset") as AccountType;
}

function sortAccounts(accounts: Account[]): Account[] {
  return [...accounts].sort((a, b) =>
    String(a.code ?? "").localeCompare(String(b.code ?? ""), undefined, {
      numeric: true,
    }),
  );
}

function isAccountActive(account: Account): boolean {
  return account.isActive !== false && account.status !== "inactive";
}

// =====================================================
// Generate Account Code
// =====================================================

function generateAccountCode(
  parent: Account | undefined,
  allAccounts: Account[],
  category: AccountCategory,
): string {
  if (!parent) {
    return category.code;
  }

  const parentId = String(parent.id || "");
  const parentCode = String(parent.code || "");

  const children = allAccounts.filter(
    (account) => String(account.parentId || "") === parentId,
  );

  const usedNumbers = new Set<number>();

  children.forEach((account) => {
    const code = String(account.code || "");

    if (!code.startsWith(parentCode)) return;

    const suffix = code.slice(parentCode.length);

    if (!suffix || !/^\d+$/.test(suffix)) return;

    const number = Number(suffix);

    if (Number.isInteger(number) && number > 0) {
      usedNumbers.add(number);
    }
  });

  let nextNumber = 1;

  while (usedNumbers.has(nextNumber)) {
    nextNumber++;
  }

  return `${parentCode}${nextNumber}`;
}

// =====================================================
// Get Current Username
// =====================================================

function getCurrentUsername(): string {
  const cookie = document.cookie
    .split(";")
    .find((item) => item.trim().startsWith("username="));

  let cookieUsername = "";

  try {
    cookieUsername = cookie
      ? decodeURIComponent(cookie.split("=").slice(1).join("="))
      : "";
  } catch {
    cookieUsername = "";
  }

  let storedUser: Partial<User> | null = null;

  try {
    storedUser = JSON.parse(localStorage.getItem("authUser") || "null");
  } catch {
    storedUser = null;
  }

  return cookieUsername || storedUser?.username || "";
}

// =====================================================
// Page
// =====================================================

export default function CreateAccountPage() {
  const router = useRouter();

  const [user, setUser] = useState<CurrentUser | null>(null);

  const [accounts, setAccounts] = useState<Account[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addingDefaults, setAddingDefaults] = useState(false);

  const [form, setForm] = useState<AccountForm>({
    name: "",
    type: "asset",
    parentId: "",
    isGroup: false,
    description: "",
  });

  // ===================================================
  // Selected Category
  // ===================================================

  const selectedCategory = useMemo(() => {
    return (
      accountCategories.find((category) => category.value === form.type) ||
      accountCategories[0]
    );
  }, [form.type]);

  // ===================================================
  // Fetch Current User
  // ===================================================

  const getCurrentUser = useCallback(async (): Promise<CurrentUser | null> => {
    const username = getCurrentUsername();

    if (!username) {
      throw new Error("لم يتم العثور على المستخدم الحالي");
    }

    const currentUser = await getUserByUsername(username);

    if (!currentUser) {
      throw new Error("المستخدم غير موجود");
    }

    if (currentUser.type === "platform" || !currentUser.companyId) {
      throw new Error("هذا الحساب غير مرتبط بمؤسسة");
    }

    if (
      currentUser.isActive === false ||
      (currentUser.status && currentUser.status !== "active")
    ) {
      throw new Error("حساب المستخدم غير نشط");
    }

    return {
      id: String(currentUser.id || ""),
      name: currentUser.name,
      username: currentUser.username,
      companyId: String(currentUser.companyId),
      companyname: currentUser.companyname,
    };
  }, []);

  // ===================================================
  // Fetch Accounts
  // ===================================================

  const fetchAccounts = useCallback(
    async (
      companyId: string,
      isCurrent: () => boolean = () => true,
    ): Promise<Account[]> => {
      const result = await getAccounts(companyId);

      const companyAccounts = result.filter(
        (account: Account) => String(account.companyId) === String(companyId),
      );

      const sorted = sortAccounts(companyAccounts);

      if (isCurrent()) {
        setAccounts(sorted);
      }

      return sorted;
    },
    [],
  );

  // ===================================================
  // Load Data
  // ===================================================

  const loadData = useCallback(
    async (isCurrent: () => boolean = () => true) => {
      try {
        const currentUser = await getCurrentUser();

        if (!isCurrent()) return;

        setUser(currentUser);

        await fetchAccounts(currentUser.companyId, isCurrent);
      } catch (error) {
        console.error("Load data error:", error);

        if (isCurrent()) {
          setUser(null);

          toast.error(
            error instanceof Error
              ? error.message
              : "تعذر تحميل بيانات المؤسسة",
          );
        }
      } finally {
        if (isCurrent()) {
          setLoading(false);
        }
      }
    },
    [getCurrentUser, fetchAccounts],
  );

  useEffect(() => {
    let ignore = false;

    loadData(() => !ignore);

    return () => {
      ignore = true;
    };
  }, [loadData]);

  // ===================================================
  // Selected Type Accounts
  // ===================================================

  const selectedTypeAccounts = useMemo(() => {
    return sortAccounts(
      accounts.filter((account) => getAccountType(account) === form.type),
    );
  }, [accounts, form.type]);

  // ===================================================
  // Parent Accounts
  // ===================================================

  const parentAccounts = useMemo(() => {
    return selectedTypeAccounts.filter(
      (account) => account.isGroup && isAccountActive(account) && account.id,
    );
  }, [selectedTypeAccounts]);

  // ===================================================
  // Selected Parent
  // ===================================================

  const selectedParent = useMemo(() => {
    return accounts.find(
      (account) => String(account.id || "") === form.parentId,
    );
  }, [accounts, form.parentId]);

  // ===================================================
  // Suggested Code
  // ===================================================

  const suggestedCode = useMemo(() => {
    return generateAccountCode(selectedParent, accounts, selectedCategory);
  }, [selectedParent, accounts, selectedCategory]);

  // ===================================================
  // Selected Nature
  // ===================================================

  const selectedNature = (selectedParent?.nature ||
    selectedCategory.nature) as AccountNature;

  // ===================================================
  // Handle Change
  // ===================================================

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setForm((previous) => {
      if (name === "type") {
        return {
          ...previous,
          type: value as AccountType,
          parentId: "",
        };
      }

      return {
        ...previous,
        [name]: value,
      };
    });
  };

  // ===================================================
  // Add Default Accounts
  // ===================================================

  const addDefaultAccounts = async () => {
    if (!user?.companyId || addingDefaults) {
      toast.error("لم يتم تحديد المؤسسة");
      return;
    }

    try {
      setAddingDefaults(true);

      // جلب أحدث الحسابات من Supabase

      const existingAccounts = await getAccounts(user.companyId);

      const companyAccounts = existingAccounts.filter(
        (account: Account) =>
          String(account.companyId) === String(user.companyId),
      );

      // تحديد أرقام الحسابات الموجودة

      const existingCodes = new Set(
        companyAccounts.map((account: Account) => String(account.code)),
      );

      // تحديد الحسابات الناقصة فقط

      const missingAccounts = defaultAccounts.filter(
        (account) => !existingCodes.has(account.code),
      );

      if (missingAccounts.length === 0) {
        setAccounts(sortAccounts(companyAccounts));

        toast.info("جميع الحسابات الافتراضية موجودة بالفعل");

        return;
      }

      // خريطة أرقام الحسابات ومعرفاتها

      const accountIds = new Map<string, string>();

      // الاحتفاظ بمعرفات الحسابات الموجودة

      companyAccounts.forEach((account: Account) => {
        if (account.id && account.code) {
          accountIds.set(String(account.code), String(account.id));
        }
      });

      // ترتيب الحسابات حسب المستوى

      const sortedMissing = [...missingAccounts].sort((a, b) => {
        if (a.level !== b.level) {
          return a.level - b.level;
        }

        return a.code.localeCompare(b.code, undefined, { numeric: true });
      });

      let created = 0;

      // إنشاء الحسابات واحداً تلو الآخر

      for (const account of sortedMissing) {
        const parentId = account.parentCode
          ? accountIds.get(account.parentCode)
          : null;

        if (account.parentCode && !parentId) {
          throw new Error(`تعذر تحديد الحساب الأب للحساب ${account.code}`);
        }

        // لا ننشئ معرفاً يدوياً.
        // Supabase يعيد معرف الحساب بعد الحفظ.

        const accountData = {
          companyId: user.companyId,
          code: account.code,
          name: account.name,
          type: account.type,
          nature: account.nature,
          parentId: parentId || null,
          isGroup: account.isGroup,
          isSystem: true,
          isActive: true,
          status: "active",
          accountType: account.type,
          parentCode: account.parentCode || null,
          level: account.level,
          allowPosting: !account.isGroup,
          balance: 0,
        };

        const createdAccount = await createAccountApi(accountData);

        if (!createdAccount?.id) {
          throw new Error(`لم يتم إرجاع معرف الحساب ${account.code} بعد الحفظ`);
        }

        // استخدام المعرف الحقيقي للحساب الأبناء

        accountIds.set(account.code, String(createdAccount.id));

        created++;
      }

      await fetchAccounts(user.companyId);

      toast.success(`تمت إضافة ${created} حساباً بنجاح`);
    } catch (error) {
      console.error("Add default accounts error:", error);

      // تحديث البيانات حتى لو فشلت عملية جزئية

      try {
        await fetchAccounts(user.companyId);
      } catch (fetchError) {
        console.error("Refresh accounts error:", fetchError);
      }

      toast.error(
        error instanceof Error
          ? `تعذر إكمال الإضافة: ${error.message}`
          : "حدث خطأ أثناء إضافة الحسابات. تحقق من الحسابات المحفوظة قبل إعادة المحاولة.",
      );
    } finally {
      setAddingDefaults(false);
    }
  };

  // ===================================================
  // Create Account
  // ===================================================

  const createAccount = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user?.companyId) {
      toast.error("المؤسسة غير محددة");
      return;
    }

    if (saving) return;

    const name = form.name.trim();

    if (!name) {
      toast.error("يرجى إدخال اسم الحساب");
      return;
    }

    // التحقق من الحساب الأب

    if (form.parentId && !selectedParent) {
      toast.error("الحساب الأب المحدد غير موجود");
      return;
    }

    if (selectedParent && !isAccountActive(selectedParent)) {
      toast.error("لا يمكن الإضافة تحت حساب غير نشط");
      return;
    }

    if (selectedParent && !selectedParent.isGroup) {
      toast.error("لا يمكن إضافة حساب فرعي تحت حساب تفصيلي");

      return;
    }

    if (selectedParent && getAccountType(selectedParent) !== form.type) {
      toast.error("يجب أن يكون الحساب الأب من التصنيف نفسه");

      return;
    }

    // التحقق من وجود الحساب الرئيسي

    if (!selectedParent) {
      const rootExists = accounts.some(
        (account) =>
          String(account.code) === selectedCategory.code &&
          getAccountType(account) === form.type,
      );

      if (rootExists) {
        toast.error(
          "هذا التصنيف موجود بالفعل. اختر حساباً أباً لإضافة الحساب تحته.",
        );

        return;
      }
    }

    // التحقق من تكرار رقم الحساب

    const codeExists = accounts.some(
      (account) => String(account.code) === String(suggestedCode),
    );

    if (codeExists) {
      toast.error(
        "رقم الحساب المقترح موجود بالفعل. حدّث البيانات وحاول مرة أخرى.",
      );

      return;
    }

    try {
      setSaving(true);

      const accountData = {
        companyId: user.companyId,
        code: suggestedCode,
        name,
        type: form.type,
        nature: selectedNature,
        parentId: selectedParent?.id || null,
        isGroup: form.isGroup,
        isSystem: false,
        isActive: true,
        status: "active",
        accountType: form.type,
        parentCode: selectedParent?.code || null,
        level: Number(selectedParent?.level ?? 0) + 1,
        allowPosting: !form.isGroup,
        balance: 0,
        description: form.description.trim() || undefined,
      };

      const createdAccount = await createAccountApi(accountData);

      if (!createdAccount?.id) {
        throw new Error("لم يتم إرجاع معرف الحساب بعد الحفظ");
      }

      toast.success(`تم إنشاء الحساب ${suggestedCode} بنجاح`);

      setForm((previous) => ({
        ...previous,
        name: "",
        description: "",
      }));

      await fetchAccounts(user.companyId);
    } catch (error) {
      console.error("Create account error:", error);

      toast.error(
        error instanceof Error ? error.message : "حدث خطأ أثناء إنشاء الحساب",
      );
    } finally {
      setSaving(false);
    }
  };

  // ===================================================
  // Render Account Tree
  // ===================================================

  const renderAccountTree = (
    parentId: string,
    depth = 0,
    visited: Set<string> = new Set(),
  ): ReactNode => {
    const children = sortAccounts(
      accounts.filter(
        (account) => String(account.parentId || "") === parentId && account.id,
      ),
    );

    return children.map((account) => {
      const accountId = String(account.id);

      // منع الدوران في العلاقات الهرمية

      if (visited.has(accountId)) {
        return null;
      }

      const nextVisited = new Set(visited);

      nextVisited.add(accountId);

      return (
        <div key={accountId}>
          <div
            className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 text-sm"
            style={{
              paddingRight: `${16 + depth * 24}px`,
            }}
          >
            {account.isGroup ? (
              <FiFolder className="shrink-0 text-amber-500" />
            ) : (
              <FiDollarSign className="shrink-0 text-green-600" />
            )}

            <span className="min-w-14 font-bold text-blue-700" dir="ltr">
              {account.code}
            </span>

            <span className="flex-1 font-medium text-gray-700">
              {account.name}
            </span>

            <span className="hidden text-xs text-gray-400 sm:block">
              {account.nature === "debit" ? "مدين" : "دائن"}
            </span>

            <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] text-gray-500">
              {account.isGroup ? "تجميعي" : "تفصيلي"}
            </span>
          </div>

          {account.isGroup &&
            renderAccountTree(accountId, depth + 1, nextVisited)}
        </div>
      );
    });
  };

  // ===================================================
  // Loading
  // ===================================================

  if (loading) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#F4F6FA]"
      >
        <div className="flex items-center gap-3 text-[#0E1F33]">
          <FiRefreshCw className="animate-spin text-xl" />
          جاري تحميل الحسابات...
        </div>
      </main>
    );
  }

  // ===================================================
  // User Not Found
  // ===================================================

  if (!user) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-[#F4F6FA]"
      >
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <h2 className="font-bold text-red-600">تعذر تحديد المؤسسة الحالية</h2>

          <button
            onClick={() => router.push("/erp/dashboard")}
            className="mt-5 rounded-xl bg-[#0E1F33] px-6 py-3 text-sm font-bold text-white"
          >
            العودة للرئيسية
          </button>
        </div>
      </main>
    );
  }

  // ===================================================
  // UI
  // ===================================================

  return (
    <main dir="rtl" className="min-h-screen bg-[#F4F6FA] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}

        <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-4 flex items-center gap-2 text-sm text-gray-500 hover:text-[#0E1F33]"
            >
              <FiArrowRight />
              العودة
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0E1F33] text-2xl text-white">
                <FiBookOpen />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-[#0E1F33]">
                  دليل الحسابات
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  إنشاء وإدارة الحسابات المحاسبية
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs text-gray-400">المؤسسة الحالية</p>

            <p className="mt-1 font-bold text-[#0E1F33]">
              {user.companyname || "المؤسسة"}
            </p>
          </div>
        </div>

        {/* Default Accounts */}

        <div className="mb-7 rounded-3xl border border-blue-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
            <div>
              <h2 className="flex items-center gap-2 font-bold text-[#0E1F33]">
                <FiLayers className="text-blue-600" />
                دليل الحسابات الافتراضي
              </h2>

              <p className="mt-2 text-sm leading-7 text-gray-500">
                إضافة الهيكل المحاسبي الأساسي تلقائياً، مع ترقيم الحسابات وتحديد
                طبيعتها وربط الحسابات الفرعية بالحسابات الرئيسية.
              </p>
            </div>

            <button
              onClick={addDefaultAccounts}
              disabled={addingDefaults}
              className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {addingDefaults ? (
                <FiRefreshCw className="animate-spin" />
              ) : (
                <FiPlus />
              )}

              {addingDefaults ? "جاري الإضافة..." : "إضافة الحسابات الافتراضية"}
            </button>
          </div>
        </div>

        {/* Statistics */}

        <div className="mb-7 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">إجمالي الحسابات</p>

            <p className="mt-3 text-2xl font-bold text-[#0E1F33]">
              {accounts.length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">الحسابات التجميعية</p>

            <p className="mt-3 text-2xl font-bold text-[#0E1F33]">
              {accounts.filter((account) => account.isGroup).length}
            </p>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">الحسابات التفصيلية</p>

            <p className="mt-3 text-2xl font-bold text-[#0E1F33]">
              {accounts.filter((account) => !account.isGroup).length}
            </p>
          </div>
        </div>

        {/* Create Form */}

        <div className="mb-7 overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="font-bold text-[#0E1F33]">إضافة حساب جديد</h2>

            <p className="mt-1 text-sm text-gray-500">
              اختر التصنيف والحساب الأب وسيولد النظام رقم الحساب تلقائياً.
            </p>
          </div>

          <form onSubmit={createAccount} className="space-y-6 p-6 sm:p-8">
            {/* Category */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                التصنيف الرئيسي
              </label>

              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500"
              >
                {accountCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.code} - {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Parent */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                الحساب الأب
              </label>

              <select
                name="parentId"
                value={form.parentId}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500"
              >
                <option value="">
                  {accounts.some(
                    (account) =>
                      account.code === selectedCategory.code &&
                      getAccountType(account) === form.type,
                  )
                    ? "اختر الحساب الأب"
                    : "إنشاء الحساب الرئيسي للتصنيف"}
                </option>

                {parentAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.code} - {account.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Suggested Code */}

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-xs text-blue-600">
                رقم الحساب الذي سيولده النظام
              </p>

              <p
                className="mt-2 text-3xl font-bold tracking-wider text-[#0E1F33]"
                dir="ltr"
              >
                {suggestedCode}
              </p>

              <div className="mt-3 flex flex-wrap gap-3 text-xs">
                <span className="rounded-lg bg-white px-3 py-2 text-gray-600">
                  الطبيعة:{" "}
                  <strong>
                    {selectedNature === "debit" ? "مدين" : "دائن"}
                  </strong>
                </span>

                <span className="rounded-lg bg-white px-3 py-2 text-gray-600">
                  التصنيف: <strong>{selectedCategory.label}</strong>
                </span>
              </div>
            </div>

            {/* Name */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                اسم الحساب
              </label>

              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="مثال: الصندوق الرئيسي"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Group */}

            <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 p-4">
              <input
                type="checkbox"
                checked={form.isGroup}
                onChange={(e) =>
                  setForm((previous) => ({
                    ...previous,
                    isGroup: e.target.checked,
                  }))
                }
                className="h-4 w-4 accent-blue-600"
              />

              <div>
                <p className="text-sm font-semibold text-gray-700">
                  حساب تجميعي
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  يمكن إضافة حسابات فرعية تحته، ولا يستخدم في القيود اليومية.
                </p>
              </div>
            </label>

            {/* Nature */}

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-sm font-semibold text-gray-700">
                طبيعة الحساب
              </p>

              <p className="mt-2 text-sm text-gray-600">
                {selectedNature === "debit" ? "مدين (Debit)" : "دائن (Credit)"}
              </p>

              <p className="mt-1 text-xs text-gray-400">
                يرث الحساب الفرعي طبيعة الحساب الأب، أو يستخدم طبيعة التصنيف عند
                إنشاء حساب رئيسي.
              </p>
            </div>

            {/* Description */}

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                وصف الحساب (اختياري)
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={3}
                placeholder="وصف الحساب..."
                className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none focus:border-blue-500"
              />
              <p className="mt-1 text-xs text-gray-400">
                لم تتم إضافة الوصف إلى طلب الحفظ؛ لأن وجود عمود description في
                جدول Supabase لم يتم تأكيده بعد.
              </p>
            </div>

            {/* Submit */}

            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl border border-gray-200 px-6 py-3.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                إلغاء
              </button>

              <button
                type="submit"
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0E1F33] px-6 py-3.5 font-bold text-white hover:bg-blue-900 disabled:opacity-50"
              >
                {saving ? <FiRefreshCw className="animate-spin" /> : <FiSave />}

                {saving ? "جاري الحفظ..." : "حفظ الحساب"}
              </button>
            </div>
          </form>
        </div>

        {/* Accounts Tree */}

        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="font-bold text-[#0E1F33]">شجرة الحسابات</h2>

            <p className="mt-1 text-sm text-gray-500">
              الحسابات المسجلة في المؤسسة مرتبة حسب التسلسل الهرمي.
            </p>
          </div>

          {accounts.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-400">
              لا توجد حسابات حتى الآن. يمكنك إضافة دليل الحسابات الافتراضي.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {accountCategories.map((category) => {
                const roots = sortAccounts(
                  accounts.filter(
                    (account) =>
                      getAccountType(account) === category.value &&
                      !account.parentId,
                  ),
                );

                if (roots.length === 0) return null;

                return (
                  <div key={category.value}>
                    <div className="bg-gray-50 px-5 py-3 font-bold text-[#0E1F33]">
                      {category.code} - {category.label}
                      <span className="mr-2 text-xs font-normal text-gray-400">
                        {category.nature === "debit" ? "مدين" : "دائن"}
                      </span>
                    </div>

                    {roots.map((root) => (
                      <div key={root.id}>
                        <div className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 text-sm">
                          {root.isGroup ? (
                            <FiFolder className="text-amber-500" />
                          ) : (
                            <FiDollarSign className="text-green-600" />
                          )}

                          <span className="font-bold text-blue-700" dir="ltr">
                            {root.code}
                          </span>

                          <span className="flex-1 font-semibold text-gray-700">
                            {root.name}
                          </span>

                          <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] text-gray-500">
                            {root.isGroup ? "تجميعي" : "تفصيلي"}
                          </span>
                        </div>

                        {root.id &&
                          root.isGroup &&
                          renderAccountTree(
                            String(root.id),
                            1,
                            new Set([String(root.id)]),
                          )}
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Orphan Accounts */}

              {accounts.some((account) => {
                if (!account.parentId) return false;

                return !accounts.some(
                  (parent) => String(parent.id) === String(account.parentId),
                );
              }) && (
                <div>
                  <div className="bg-amber-50 px-5 py-3 font-bold text-amber-800">
                    حسابات تحتاج إلى مراجعة
                  </div>

                  {sortAccounts(
                    accounts.filter((account) => {
                      if (!account.parentId) return false;

                      return !accounts.some(
                        (parent) =>
                          String(parent.id) === String(account.parentId),
                      );
                    }),
                  ).map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center gap-3 border-b border-gray-100 px-4 py-3 text-sm"
                    >
                      <FiDollarSign className="text-amber-500" />

                      <span className="font-bold text-blue-700" dir="ltr">
                        {account.code}
                      </span>

                      <span className="flex-1 text-gray-700">
                        {account.name}
                      </span>

                      <span className="text-xs text-amber-600">
                        الحساب الأب غير موجود
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}

        <p className="mt-6 text-center text-xs text-gray-400">
          WEZZAN ERP — Accounting Management
        </p>
      </div>
    </main>
  );
}
