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
import { getWarehouseStocks } from "@/lib/api/warehouses";

import type {
  Account,
  AccountFormData,
  AccountId,
} from "../types";

// ==========================================
// Default Accounts
// ==========================================

const defaultAccounts: Partial<Account>[] = [
  {
    code: "1",
    name: "الأصول",
    nameEn: "Assets",
    type: "asset",
    nature: "debit",
    level: 1,
    isGroup: true,
    allowPosting: false,
    isSystem: true,
    isActive: true,
    balance: 0,
  },
  {
    code: "2",
    name: "الالتزامات",
    nameEn: "Liabilities",
    type: "liability",
    nature: "credit",
    level: 1,
    isGroup: true,
    allowPosting: false,
    isSystem: true,
    isActive: true,
    balance: 0,
  },
  {
    code: "3",
    name: "حقوق الملكية",
    nameEn: "Equity",
    type: "equity",
    nature: "credit",
    level: 1,
    isGroup: true,
    allowPosting: false,
    isSystem: true,
    isActive: true,
    balance: 0,
  },
  {
    code: "4",
    name: "الإيرادات",
    nameEn: "Revenue",
    type: "revenue",
    nature: "credit",
    level: 1,
    isGroup: true,
    allowPosting: false,
    isSystem: true,
    isActive: true,
    balance: 0,
  },
  {
    code: "5",
    name: "المصروفات",
    nameEn: "Expenses",
    type: "expense",
    nature: "debit",
    level: 1,
    isGroup: true,
    allowPosting: false,
    isSystem: true,
    isActive: true,
    balance: 0,
  },
];

// ==========================================
// Hook
// ==========================================

export function useAccounts(companyId?: string) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inventoryValue, setInventoryValue] = useState(0);

  // ==========================================
  // Calculate Inventory Value
  // ==========================================

  const calculateInventoryValue = useCallback(async () => {
    if (!companyId) {
      return 0;
    }

    try {
      const [products, warehouseStocks] = await Promise.all([
        getProducts(companyId),
        getWarehouseStocks(companyId),
      ]);

      const productsMap = new Map(
        products.map((product: any) => [
          String(product.id),
          Number(product.purchasePrice ?? 0),
        ])
      );

      const total = warehouseStocks.reduce(
        (sum: number, stock: any) => {
          const productPrice =
            productsMap.get(String(stock.productId)) ?? 0;

          const quantity = Number(
            stock.quantity ?? stock.currentQuantity ?? 0
          );

          return sum + quantity * productPrice;
        },
        0
      );

      setInventoryValue(total);

      return total;
    } catch (err) {
      console.error("Error calculating inventory value:", err);
      setInventoryValue(0);
      return 0;
    }
  }, [companyId]);

  // ==========================================
  // Fetch Accounts
  // ==========================================

  const fetchAccounts = useCallback(async () => {
    if (!companyId) {
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [accountsData] = await Promise.all([
        getAccounts(companyId),
        calculateInventoryValue(),
      ]);

      const updatedAccounts = accountsData.map((account: Account) => {
        if (account.code === "1104") {
          return {
            ...account,
            balance: inventoryValue,
          };
        }

        return account;
      });

      setAccounts(updatedAccounts);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      setError("حدث خطأ أثناء تحميل الحسابات");
    } finally {
      setLoading(false);
    }
  }, [companyId, calculateInventoryValue, inventoryValue]);

  // ==========================================
  // Get Missing Default Accounts
  // ==========================================

  const getMissingDefaultAccounts = useCallback(
    (currentAccounts: Account[] = accounts) => {
      return defaultAccounts.filter(
        (defaultAccount) =>
          !currentAccounts.some(
            (account) => account.code === defaultAccount.code
          )
      );
    },
    [accounts]
  );

  // ==========================================
  // Add Default Accounts
  // ==========================================

  const addDefaultAccounts = useCallback(async () => {
    if (!companyId) {
      throw new Error("لم يتم تحديد الشركة");
    }

    try {
      const missingAccounts = getMissingDefaultAccounts();

      if (missingAccounts.length === 0) {
        return;
      }

      for (const account of missingAccounts) {
        await createAccountApi({
          ...account,
          companyId,
          isActive: true,
          balance: 0,
          createdAt: new Date().toISOString(),
        } as any);
      }

      await fetchAccounts();
    } catch (err) {
      console.error("Error adding default accounts:", err);
      throw err;
    }
  }, [companyId, getMissingDefaultAccounts, fetchAccounts]);

  // ==========================================
  // Create Account
  // ==========================================

  const createAccount = useCallback(
    async (data: AccountFormData) => {
      if (!companyId) {
        throw new Error("لم يتم تحديد الشركة");
      }

      try {
        const newAccount = {
          ...data,
          companyId,
          isActive: true,
          balance: 0,
          createdAt: new Date().toISOString(),
        };

        const result = await createAccountApi(newAccount as any);

        await fetchAccounts();

        return result;
      } catch (err) {
        console.error("Error creating account:", err);
        throw err;
      }
    },
    [companyId, fetchAccounts]
  );

  // ==========================================
  // Get Company Account
  // ==========================================

  const getCompanyAccount = useCallback(
    async (id: AccountId) => {
      if (!companyId) {
        return null;
      }

      try {
        const account = await getAccountById(
          String(id),
          companyId
        );

        if (!account || account.companyId !== companyId) {
          return null;
        }

        return account;
      } catch (err) {
        console.error("Error getting account:", err);
        return null;
      }
    },
    [companyId]
  );

  // ==========================================
  // Update Account
  // ==========================================

  const updateAccount = useCallback(
    async (id: AccountId, data: AccountFormData) => {
      if (!companyId) {
        throw new Error("لم يتم تحديد الشركة");
      }

      try {
        const existingAccount = await getCompanyAccount(id);

        if (!existingAccount) {
          throw new Error("الحساب غير موجود أو لا يتبع هذه الشركة");
        }

        const result = await updateAccountApi(
          String(id),
          {
            ...data,
            companyId,
            updatedAt: new Date().toISOString(),
          } as any,
          companyId
        );

        await fetchAccounts();

        return result;
      } catch (err) {
        console.error("Error updating account:", err);
        throw err;
      }
    },
    [companyId, getCompanyAccount, fetchAccounts]
  );

  // ==========================================
  // Delete Account
  // ==========================================

  const deleteAccount = useCallback(
    async (id: AccountId) => {
      if (!companyId) {
        throw new Error("لم يتم تحديد الشركة");
      }

      try {
        const account = await getCompanyAccount(id);

        if (!account) {
          throw new Error("الحساب غير موجود أو لا يتبع هذه الشركة");
        }

        if (account.code === "1104") {
          throw new Error("لا يمكن حذف حساب المخزون");
        }

        if (account.isSystem) {
          throw new Error("لا يمكن حذف الحسابات الأساسية للنظام");
        }

        const result = await deleteAccountApi(
          String(id),
          companyId
        );

        await fetchAccounts();

        return result;
      } catch (err) {
        console.error("Error deleting account:", err);
        throw err;
      }
    },
    [companyId, getCompanyAccount, fetchAccounts]
  );

  // ==========================================
  // Toggle Account Status
  // ==========================================

  const toggleAccountStatus = useCallback(
    async (id: AccountId) => {
      if (!companyId) {
        throw new Error("لم يتم تحديد الشركة");
      }

      try {
        const account = await getCompanyAccount(id);

        if (!account) {
          throw new Error("الحساب غير موجود أو لا يتبع هذه الشركة");
        }

        const isActive =
          account.isActive !== false &&
          account.status !== "inactive";

        if (account.code === "1104" && isActive) {
          throw new Error("لا يمكن إيقاف حساب المخزون");
        }

        const result = await updateAccountApi(
          String(id),
          {
            isActive: !isActive,
            updatedAt: new Date().toISOString(),
          } as any,
          companyId
        );

        await fetchAccounts();

        return result;
      } catch (err) {
        console.error("Error toggling account status:", err);
        throw err;
      }
    },
    [companyId, getCompanyAccount, fetchAccounts]
  );

  // ==========================================
  // Load Accounts
  // ==========================================

  useEffect(() => {
    if (companyId) {
      fetchAccounts();
    }
  }, [companyId, fetchAccounts]);

  // ==========================================
  // Return
  // ==========================================

  return {
    accounts: companyId ? accounts : [],
    loading: companyId ? loading : false,
    error: companyId ? error : null,
    inventoryValue: companyId ? inventoryValue : 0,

    fetchAccounts,
    calculateInventoryValue,

    createAccount,
    getCompanyAccount,
    updateAccount,
    deleteAccount,
    toggleAccountStatus,

    defaultAccounts,
    getMissingDefaultAccounts,
    addDefaultAccounts,
  };
}