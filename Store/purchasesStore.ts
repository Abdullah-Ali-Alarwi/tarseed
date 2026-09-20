
"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* =========================================================
   عناصر فاتورة الشراء
========================================================= */

export interface PurchaseItem {
  id: number;

  /**
   * معرف المنتج من productsStore
   */
  productId: string;

  /**
   * بيانات المنتج
   */
  productCode?: string;
  productName?: string;
  name?: string;

  /**
   * الكمية والسعر
   */
  quantity: number;
  price: number;

  /**
   * الخصم على الصنف
   */
  discount: number;

  /**
   * إجمالي الصنف بعد الخصم
   */
  total: number;
}

/* =========================================================
   فاتورة الشراء
========================================================= */

export interface Purchase {
  id: string;

  /**
   * رقم الفاتورة
   */
  invoiceNumber: string;

  /**
   * تاريخ الفاتورة
   */
  date: string;

  /**
   * المورد
   */
  supplier: string;
  supplierId: string;

  /**
   * حساب المورد
   */
  accountCode?: string;
  accountName?: string;

  /**
   * عدد الأصناف
   */
  itemCount: number;

  /**
   * تفاصيل الأصناف
   */
  items: PurchaseItem[];

  /**
   * الإجماليات
   */
  subtotal: number;
  discount: number;
  tax: number;
  taxRate?: number;
  total: number;

  /**
   * طريقة الدفع
   */
  paymentMethod: "cash" | "bank" | "credit";

  /**
   * اسم طريقة الدفع بالعربي
   */
  paymentMethodName?: string;

  /**
   * حالة الفاتورة
   */
  status: string;

  /**
   * ملاحظات
   */
  notes?: string;
}

/* =========================================================
   Store
========================================================= */

interface PurchasesStore {
  /**
   * جميع فواتير المشتريات
   */
  purchases: Purchase[];

  /**
   * إضافة فاتورة شراء
   */
  addPurchase: (purchase: Purchase) => void;

  /**
   * تعديل فاتورة
   */
  updatePurchase: (
    id: string,
    data: Partial<Purchase>
  ) => void;

  /**
   * حذف فاتورة
   */
  deletePurchase: (id: string) => void;

  /**
   * الحصول على فاتورة بالمعرف
   */
  getPurchaseById: (
    id: string
  ) => Purchase | undefined;

  /**
   * الحصول على فاتورة برقم الفاتورة
   */
  getPurchaseByInvoiceNumber: (
    invoiceNumber: string
  ) => Purchase | undefined;

  /**
   * البحث في المشتريات
   */
  searchPurchases: (
    query: string
  ) => Purchase[];

  /**
   * الحصول على مشتريات مورد معين
   */
  getPurchasesBySupplier: (
    supplierId: string
  ) => Purchase[];

  /**
   * حذف جميع المشتريات
   */
  clearPurchases: () => void;
}

/* =========================================================
   المشتريات الافتراضية
========================================================= */

const defaultPurchases: Purchase[] = [

];

/* =========================================================
   Zustand Store
========================================================= */

export const usePurchasesStore =
  create<PurchasesStore>()(
    persist(
      (set, get) => ({

        /* ===================================================
           البيانات
        =================================================== */

        purchases: defaultPurchases,

        /* ===================================================
           إضافة فاتورة شراء
           
           ملاحظة:
           يتم منع إضافة نفس رقم الفاتورة مرتين.
        =================================================== */

        addPurchase: (purchase) => {
          set((state) => {

            const exists =
              state.purchases.some(
                (item) =>
                  item.invoiceNumber ===
                  purchase.invoiceNumber
              );

            /**
             * إذا كان رقم الفاتورة موجودًا
             * لا نضيف الفاتورة مرة أخرى.
             */
            if (exists) {
              return state;
            }

            return {
              purchases: [
                ...state.purchases,
                purchase,
              ],
            };
          });
        },

        /* ===================================================
           تعديل فاتورة
        =================================================== */

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

        /* ===================================================
           حذف فاتورة
        =================================================== */

        deletePurchase: (id) => {
          set((state) => ({
            purchases:
              state.purchases.filter(
                (purchase) =>
                  purchase.id !== id
              ),
          }));
        },

        /* ===================================================
           الحصول على فاتورة بالمعرف
        =================================================== */

        getPurchaseById: (id) => {
          return get().purchases.find(
            (purchase) =>
              purchase.id === id
          );
        },

        /* ===================================================
           الحصول على فاتورة برقم الفاتورة
        =================================================== */

        getPurchaseByInvoiceNumber: (
          invoiceNumber
        ) => {
          return get().purchases.find(
            (purchase) =>
              purchase.invoiceNumber ===
              invoiceNumber
          );
        },

        /* ===================================================
           البحث في المشتريات
        =================================================== */

        searchPurchases: (query) => {
          const search =
            query
              .trim()
              .toLowerCase();

          /**
           * إذا لم يوجد بحث
           * نرجع جميع الفواتير.
           */
          if (!search) {
            return get().purchases;
          }

          return get().purchases.filter(
            (purchase) =>
              /**
               * رقم الفاتورة
               */
              purchase.invoiceNumber
                .toLowerCase()
                .includes(search) ||

              /**
               * اسم المورد
               */
              purchase.supplier
                .toLowerCase()
                .includes(search) ||

              /**
               * كود الحساب
               */
              purchase.accountCode
                ?.toLowerCase()
                .includes(search) ||

              /**
               * اسم الحساب
               */
              purchase.accountName
                ?.toLowerCase()
                .includes(search) ||

              /**
               * طريقة الدفع
               */
              purchase.paymentMethodName
                ?.toLowerCase()
                .includes(search)
          );
        },

        /* ===================================================
           مشتريات مورد معين
        =================================================== */

        getPurchasesBySupplier: (
          supplierId
        ) => {
          return get().purchases.filter(
            (purchase) =>
              purchase.supplierId ===
              supplierId
          );
        },

        /* ===================================================
           حذف جميع المشتريات
        =================================================== */

        clearPurchases: () => {
          set({
            purchases: [],
          });
        },
      }),

      /* =====================================================
         LocalStorage
      ===================================================== */

      {
        name: "erp-purchases-storage",
      }
    )
  );

