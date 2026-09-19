"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* =========================================================
   صنف داخل فاتورة المشتريات
========================================================= */

export interface PurchaseItem {
  id: number;

  productId: string;
  productCode?: string;
  productName?: string;
  name?: string;

  quantity: number;
  price: number;
  discount: number;
  total: number;
}

/* =========================================================
   فاتورة المشتريات
========================================================= */

export interface Purchase {
  id: string;

  invoiceNumber: string;
  date: string;

  supplier: string;
  supplierId: string;

  accountCode?: string;
  accountName?: string;

  itemCount: number;
  items: PurchaseItem[];

  subtotal: number;
  discount: number;

  tax: number;
  taxRate?: number;

  total: number;

  paymentMethod:
    | "cash"
    | "bank"
    | "credit";

  paymentMethodName?: string;

  status: string;

  notes?: string;
}

/* =========================================================
   Store
========================================================= */

interface PurchasesStore {
  purchases: Purchase[];

  addPurchase: (
    purchase: Purchase
  ) => void;

  updatePurchase: (
    id: string,
    data: Partial<Purchase>
  ) => void;

  deletePurchase: (
    id: string
  ) => void;

  getPurchaseById: (
    id: string
  ) => Purchase | undefined;

  getPurchaseByInvoiceNumber: (
    invoiceNumber: string
  ) => Purchase | undefined;

  searchPurchases: (
    query: string
  ) => Purchase[];

  getPurchasesBySupplier: (
    supplierId: string
  ) => Purchase[];

  clearPurchases: () => void;
}

/* =========================================================
   بيانات تجريبية
========================================================= */

const defaultPurchases: Purchase[] = [
  {
    id: "purchase-001",

    invoiceNumber: "PUR-1001",

    date: "2026-09-01",

    supplier: "مؤسسة وادي العسل",

    supplierId: "supplier-001",

    accountCode: "2001",

    accountName: "مؤسسة وادي العسل",

    itemCount: 2,

    items: [
      {
        id: 1,
        productId: "product-1001",
        productCode: "1001",
        productName: "عسل",
        name: "عسل",
        quantity: 10,
        price: 12500,
        discount: 0,
        total: 125000,
      },
    ],

    subtotal: 125000,
    discount: 5000,

    tax: 0,
    taxRate: 0,

    total: 120000,

    paymentMethod: "cash",

    paymentMethodName: "نقدًا",

    status: "مدفوعة",

    notes: "",
  },

  {
    id: "purchase-002",

    invoiceNumber: "PUR-1002",

    date: "2026-09-02",

    supplier: "مناحل السدر اليمنية",

    supplierId: "supplier-002",

    accountCode: "2002",

    accountName: "مناحل السدر اليمنية",

    itemCount: 1,

    items: [
      {
        id: 1,
        productId: "product-1001",
        productCode: "1001",
        productName: "عسل",
        name: "عسل",
        quantity: 20,
        price: 10000,
        discount: 0,
        total: 200000,
      },
    ],

    subtotal: 200000,
    discount: 0,

    tax: 0,
    taxRate: 0,

    total: 200000,

    paymentMethod: "bank",

    paymentMethodName: "حوالة بنكية",

    status: "مدفوعة",

    notes: "",
  },

  {
    id: "purchase-003",

    invoiceNumber: "PUR-1003",

    date: "2026-09-03",

    supplier: "شركة الزيوت الطبيعية",

    supplierId: "supplier-003",

    accountCode: "2003",

    accountName: "شركة الزيوت الطبيعية",

    itemCount: 1,

    items: [
      {
        id: 1,
        productId: "product-1003",
        productCode: "1003",
        productName: "زيت",
        name: "زيت",
        quantity: 30,
        price: 6000,
        discount: 0,
        total: 180000,
      },
    ],

    subtotal: 180000,
    discount: 0,

    tax: 0,
    taxRate: 0,

    total: 180000,

    paymentMethod: "credit",

    paymentMethodName: "آجل",

    status: "آجلة",

    notes: "",
  },
];

/* =========================================================
   Zustand
========================================================= */

export const usePurchasesStore =
  create<PurchasesStore>()(
    persist(
      (set, get) => ({
        purchases: defaultPurchases,

        /* =================================================
           إضافة فاتورة
        ================================================= */

        addPurchase: (purchase) => {
          set((state) => ({
            purchases: [
              ...state.purchases,
              purchase,
            ],
          }));
        },

        /* =================================================
           تعديل فاتورة
        ================================================= */

        updatePurchase: (
          id,
          data
        ) => {
          set((state) => ({
            purchases:
              state.purchases.map(
                (purchase) =>
                  purchase.id === id
                    ? {
                        ...purchase,
                        ...data,
                      }
                    : purchase
              ),
          }));
        },

        /* =================================================
           حذف فاتورة
        ================================================= */

        deletePurchase: (id) => {
          set((state) => ({
            purchases:
              state.purchases.filter(
                (purchase) =>
                  purchase.id !== id
              ),
          }));
        },

        /* =================================================
           الحصول على فاتورة بواسطة ID
        ================================================= */

        getPurchaseById: (id) => {
          return get().purchases.find(
            (purchase) =>
              purchase.id === id
          );
        },

        /* =================================================
           الحصول على فاتورة بواسطة رقم الفاتورة
        ================================================= */

        getPurchaseByInvoiceNumber: (
          invoiceNumber
        ) => {
          return get().purchases.find(
            (purchase) =>
              purchase.invoiceNumber ===
              invoiceNumber
          );
        },

        /* =================================================
           البحث
        ================================================= */

        searchPurchases: (query) => {
          const search =
            query.trim().toLowerCase();

          if (!search) {
            return get().purchases;
          }

          return get().purchases.filter(
            (purchase) => {
              return (
                purchase.invoiceNumber
                  .toLowerCase()
                  .includes(search) ||

                purchase.supplier
                  .toLowerCase()
                  .includes(search) ||

                purchase.accountCode
                  ?.toLowerCase()
                  .includes(search) ||

                purchase.accountName
                  ?.toLowerCase()
                  .includes(search) ||

                purchase.paymentMethodName
                  ?.toLowerCase()
                  .includes(search)
              );
            }
          );
        },

        /* =================================================
           مشتريات مورد محدد
        ================================================= */

        getPurchasesBySupplier: (
          supplierId
        ) => {
          return get().purchases.filter(
            (purchase) =>
              purchase.supplierId ===
              supplierId
          );
        },

        /* =================================================
           حذف جميع المشتريات
        ================================================= */

        clearPurchases: () => {
          set({
            purchases: [],
          });
        },
      }),

      {
        name: "erp-purchases-storage",
      }
    )
  );