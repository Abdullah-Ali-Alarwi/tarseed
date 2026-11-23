"use client";

import { useCallback, useEffect, useState } from "react";

import {
  getAccounts,
  getAccountById,
  createAccount as createAccountApi,
  updateAccount as updateAccountApi,
  deleteAccount as deleteAccountApi,
} from "@/lib/api/accounts";

import { getProducts } from "@/lib/api/products";
import { getWarehouseStocks } from "@/lib/api/warehouseStocks";

import { Account, AccountFormData, AccountId } from "../types";

// =====================================
// الحسابات الرئيسية الافتراضية
// =====================================

const defaultAccounts = [
  {
    code: "1",
    name: "الأصول",
    nameEn: "Assets",
    type: "asset",
    parentId: null,
    nature: "debit",
    isGroup: true,
    allowPosting: false,
  },
  {
    code: "2",
    name: "الالتزامات",
    nameEn: "Liabilities",
    type: "liability",
    parentId: null,
    nature: "credit",
    isGroup: true,
    allowPosting: false,
  },
  {
    code: "3",
    name: "حقوق الملكية",
    nameEn: "Equity",
    type: "equity",
    parentId: null,
    nature: "credit",
    isGroup: true,
    allowPosting: false,
  },
  {
    code: "4",
    name: "الإيرادات",
    nameEn: "Revenue",
    type: "revenue",
    parentId: null,
    nature: "credit",
    isGroup: true,
    allowPosting: false,
  },
  {
    code: "5",
    name: "المصروفات",
    nameEn: "Expenses",
    type: "expense",
    parentId: null,
    nature: "debit",
    isGroup: true,
    allowPosting: false,
  },
] as const;

// =====================================
// Hook
// =====================================

export function useAccounts(companyId: string) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inventoryValue, setInventoryValue] = useState(0);

  // =====================================
  // حساب قيمة المخزون
  // =====================================

  const calculateInventoryValue = useCallback(async () => {
    if (!companyId) {
      setInventoryValue(0);
      return 0;
    }

    const [products, stocks] = await Promise.all([
      getProducts(companyId),
      getWarehouseStocks(companyId),
    ]);

    const trackedProducts = products.filter(
      (product) =>
        String(product.companyId) === String(companyId) &&
        product.trackInventory !== false
    );

    const companyStocks = stocks.filter(
      (stock) =>
        String(stock.companyId) === String(companyId)
    );

    // تجميع الكميات حسب المنتج
    const quantities = new Map<string, number>();

    for (const stock of companyStocks) {
      const productId = String(stock.productId);

      quantities.set(
        productId,
        (quantities.get(productId) || 0) +
          Number(stock.quantity || 0)
      );
    }

    // حساب قيمة المخزون
    const total = trackedProducts.reduce((sum, product) => {
      const quantity =
        quantities.get(String(product.id)) || 0;

      const purchasePrice = Number(
        product.purchasePrice || 0
      );

      return sum + quantity * purchasePrice;
    }, 0);

    setInventoryValue(total);

    return total;
  }, [companyId]);

  // =====================================
  // جلب الحسابات
  // =====================================

  const fetchAccounts = useCallback(async () => {
    if (!companyId) {
      setAccounts([]);
      setInventoryValue(0);
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const [companyAccounts, currentInventoryValue] =
        await Promise.all([
          getAccounts(companyId),
          calculateInventoryValue(),
        ]);

      const updatedAccounts = companyAccounts.map(
        (account) => {
          if (String(account.code) === "1104") {
            return {
              ...account,
              balance: currentInventoryValue,
            };
          }

          return {
            ...account,
            balance: Number(account.balance || 0),
          };
        }
      );

      setAccounts(updatedAccounts as Account[]);

      return updatedAccounts as Account[];
    } catch (err) {
      console.error("Fetch accounts error:", err);

      setError("تعذر تحميل الحسابات أو بيانات المخزون");

      throw err;
    } finally {
      setLoading(false);
    }
  }, [companyId, calculateInventoryValue]);

  // =====================================
  // الحسابات الرئيسية غير المضافة
  // =====================================

  const getMissingDefaultAccounts = useCallback(
    (currentAccounts: Account[] = accounts) => {
      return defaultAccounts.filter(
        (defaultAccount) =>
          !currentAccounts.some(
            (account) =>
              String(account.code) === defaultAccount.code &&
              (account.parentId === null ||
                account.parentId === undefined ||
                account.parentId === "")
          )
      );
    },
    [accounts]
  );

  // =====================================
  // إضافة الحسابات الرئيسية الافتراضية
  // =====================================

  const addDefaultAccounts = async () => {
    if (!companyId) {
      throw new Error("لم يتم تحديد الشركة الحالية");
    }

    const currentAccounts = await getAccounts(companyId);

    const missingAccounts =
      getMissingDefaultAccounts(currentAccounts as Account[]);

    if (missingAccounts.length === 0) {
      throw new Error("الحسابات الرئيسية موجودة مسبقاً");
    }

    for (const account of missingAccounts) {
      await createAccountApi({
        ...account,
        companyId,
        isActive: true,
        balance: 0,
      });
    }

    await fetchAccounts();

    return missingAccounts.length;
  };

  // =====================================
  // إنشاء حساب جديد
  // =====================================

  const createAccount = async (data: AccountFormData) => {
    if (!companyId) {
      throw new Error("لم يتم تحديد الشركة الحالية");
    }

    const newAccount = await createAccountApi({
      ...data,
      companyId,
      isActive: true,
      balance: 0,
      createdAt: new Date().toISOString(),
    });

    await fetchAccounts();

    return newAccount;
  };

  // =====================================
  // التحقق من ملكية الحساب
  // =====================================

  const getCompanyAccount = async (id: AccountId) => {
    const account = await getAccountById(String(id));

    if (!account) {
      throw new Error("الحساب غير موجود");
    }

    if (
      String(account.companyId) !== String(companyId)
    ) {
      throw new Error("هذا الحساب لا يتبع الشركة الحالية");
    }

    return account;
  };

  // =====================================
  // تعديل حساب
  // =====================================

  const updateAccount = async (
    id: AccountId,
    data: AccountFormData
  ) => {
    if (!companyId) {
      throw new Error("لم يتم تحديد الشركة الحالية");
    }

    await getCompanyAccount(id);

    const updatedAccount = await updateAccountApi(
      String(id),
      {
        ...data,
        companyId,
      }
    );

    await fetchAccounts();

    return updatedAccount;
  };

  // =====================================
  // حذف حساب
  // =====================================

  const deleteAccount = async (id: AccountId) => {
    if (!companyId) {
      throw new Error("لم يتم تحديد الشركة الحالية");
    }

    const account = await getCompanyAccount(id);

    if (String(account.code) === "1104") {
      throw new Error(
        "لا يمكن حذف حساب المخزون المرتبط بنظام المستودعات"
      );
    }

    await deleteAccountApi(String(id));

    await fetchAccounts();
  };

  // =====================================
  // تفعيل وإيقاف الحساب
  // =====================================

  const toggleAccountStatus = async (id: AccountId) => {
    if (!companyId) {
      throw new Error("لم يتم تحديد الشركة الحالية");
    }

    const account = await getCompanyAccount(id);

    if (
      String(account.code) === "1104" &&
      account.isActive
    ) {
      throw new Error(
        "لا يمكن إيقاف حساب المخزون أثناء استخدام نظام المستودعات"
      );
    }

    const updatedAccount = await updateAccountApi(
      String(id),
      {
        isActive: !account.isActive,
      }
    );

    await fetchAccounts();

    return updatedAccount;
  };

  // =====================================
  // تحميل الحسابات عند تحديد الشركة
  // =====================================

  useEffect(() => {
    if (!companyId) {
      setAccounts([]);
      setInventoryValue(0);
      setLoading(false);
      return;
    }

    fetchAccounts().catch((err) => {
      console.error("Initial accounts loading error:", err);
    });
  }, [companyId, fetchAccounts]);

  // =====================================
  // القيم والدوال المتاحة للصفحات
  // =====================================

  return {
    accounts,
    loading,
    error,
    inventoryValue,

    fetchAccounts,
    calculateInventoryValue,

    createAccount,
    updateAccount,
    deleteAccount,
    toggleAccountStatus,

    defaultAccounts,
    getMissingDefaultAccounts,
    addDefaultAccounts,
  };
}