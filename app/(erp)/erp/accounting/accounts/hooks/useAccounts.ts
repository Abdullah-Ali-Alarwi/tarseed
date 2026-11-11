"use client";

import { useCallback, useEffect, useState } from "react";
import axios from "axios";

import { Account, AccountFormData, AccountId } from "../types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Product {
  id: string;
  companyId: string;
  name: string;
  purchasePrice: number;
  trackInventory?: boolean;
}

interface WarehouseStock {
  id: string;
  companyId: string;
  productId: string;
  quantity: number;
}

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

    const [productsResponse, stocksResponse] = await Promise.all([
      axios.get<Product[]>(`${API_URL}/products`, {
        params: { companyId },
      }),

      axios.get<WarehouseStock[]>(`${API_URL}/warehouseStocks`, {
        params: { companyId },
      }),
    ]);

    const products = productsResponse.data.filter(
      (product) =>
        String(product.companyId) === String(companyId) &&
        product.trackInventory !== false
    );

    const stocks = stocksResponse.data.filter(
      (stock) =>
        String(stock.companyId) === String(companyId)
    );

    const quantities = new Map<string, number>();

    for (const stock of stocks) {
      const productId = String(stock.productId);

      quantities.set(
        productId,
        (quantities.get(productId) || 0) +
          Number(stock.quantity || 0)
      );
    }

    const total = products.reduce((sum, product) => {
      const quantity = quantities.get(String(product.id)) || 0;
      const purchasePrice = Number(product.purchasePrice || 0);

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

      const [accountsResponse] = await Promise.all([
        axios.get<Account[]>(`${API_URL}/accounts`, {
          params: { companyId },
        }),
      ]);

      const companyAccounts = accountsResponse.data.filter(
        (account) =>
          String(account.companyId) === String(companyId)
      );

      const currentInventoryValue =
        await calculateInventoryValue();

      const updatedAccounts = companyAccounts.map((account) => {
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
      });

      setAccounts(updatedAccounts);

      return updatedAccounts;
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
              account.parentId === null
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

    const response = await axios.get<Account[]>(
      `${API_URL}/accounts`,
      { params: { companyId } }
    );

    const currentAccounts = response.data.filter(
      (account) =>
        String(account.companyId) === String(companyId)
    );

    const missingAccounts =
      getMissingDefaultAccounts(currentAccounts);

    if (missingAccounts.length === 0) {
      throw new Error("الحسابات الرئيسية موجودة مسبقاً");
    }

    for (const account of missingAccounts) {
      await axios.post(`${API_URL}/accounts`, {
        ...account,
        isActive: true,
        companyId,
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

    const response = await axios.post<Account>(
      `${API_URL}/accounts`,
      {
        ...data,
        companyId,
        isActive: true,
        balance: 0,
        createdAt: new Date().toISOString(),
      }
    );

    await fetchAccounts();

    return response.data;
  };

  // =====================================
  // التحقق من ملكية الحساب
  // =====================================

  const getCompanyAccount = async (id: AccountId) => {
    const response = await axios.get<Account>(
      `${API_URL}/accounts/${id}`
    );

    if (
      String(response.data.companyId) !== String(companyId)
    ) {
      throw new Error("هذا الحساب لا يتبع الشركة الحالية");
    }

    return response.data;
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

    const response = await axios.patch<Account>(
      `${API_URL}/accounts/${id}`,
      {
        ...data,
        companyId,
      }
    );

    await fetchAccounts();

    return response.data;
  };

  // =====================================
  // حذف حساب
  // =====================================

  const deleteAccount = async (id: AccountId) => {
    if (!companyId) {
      throw new Error("لم يتم تحديد الشركة الحالية");
    }

    const account = await getCompanyAccount(id);

    if (account.code === "1104") {
      throw new Error("لا يمكن حذف حساب المخزون المرتبط بنظام المستودعات");
    }

    await axios.delete(`${API_URL}/accounts/${id}`);

    await fetchAccounts();
  };

  // =====================================
  // تفعيل وإيقاف الحساب
  // =====================================

  const toggleAccountStatus = async (id: AccountId) => {
    const account = await getCompanyAccount(id);

    if (account.code === "1104" && account.isActive) {
      throw new Error("لا يمكن إيقاف حساب المخزون أثناء استخدام نظام المستودعات");
    }

    const response = await axios.patch<Account>(
      `${API_URL}/accounts/${id}`,
      {
        isActive: !account.isActive,
      }
    );

    await fetchAccounts();

    return response.data;
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

    fetchAccounts();
  }, [companyId, fetchAccounts]);

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