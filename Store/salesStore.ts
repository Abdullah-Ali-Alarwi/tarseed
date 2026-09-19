"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* =====================================================
   طريقة الدفع
===================================================== */

export type PaymentMethod =
  | "cash"
  | "bank"
  | "credit";

/* =====================================================
   حالة الفاتورة
===================================================== */

export type SaleStatus =
  | "paid"
  | "pending"
  | "cancelled";

/* =====================================================
   صنف داخل الفاتورة
===================================================== */

export interface SaleItem {
  id: number;

  /* معرف المنتج */
  productId?: string;

  /* كود المنتج */
  productCode?: string;

  /* اسم الصنف */
  item: string;

  /* الكمية */
  quantity: number;

  /* سعر الوحدة */
  price: number;

  /* الخصم */
  discount: number;

  /* إجمالي الصنف */
  total: number;
}

/* =====================================================
   فاتورة المبيعات
===================================================== */

export interface Sale {
  id: string;

  /* رقم الفاتورة */
  invoiceNumber: string;

  /* التاريخ */
  date: string;

  /* العميل */
  customerId?: string;
  customerName?: string;

  /* طريقة الدفع */
  paymentMethod: PaymentMethod;

  /* الحساب */
  accountCode?: string;
  accountName?: string;

  /* الأصناف */
  items: SaleItem[];

  /* الإجماليات */
  subtotal: number;
  discount: number;
  totalQuantity: number;
  total: number;

  /* حالة الفاتورة */
  status: SaleStatus;

  /* ملاحظات */
  notes?: string;

  /* تاريخ إنشاء الفاتورة */
  createdAt: string;
}

/* =====================================================
   بيانات إضافة فاتورة
===================================================== */

export interface AddSaleInput {
  date?: string;

  customerId?: string;
  customerName?: string;

  paymentMethod?: PaymentMethod;

  accountCode?: string;
  accountName?: string;

  items: SaleItem[];

  notes?: string;

  status?: SaleStatus;
}

/* =====================================================
   بيانات تعديل الفاتورة
===================================================== */

export interface UpdateSaleInput {
  date?: string;

  customerId?: string;
  customerName?: string;

  paymentMethod?: PaymentMethod;

  accountCode?: string;
  accountName?: string;

  items?: SaleItem[];

  notes?: string;

  status?: SaleStatus;
}

/* =====================================================
   Store
===================================================== */

interface SalesStore {
  sales: Sale[];

  /* إضافة فاتورة */
  addSale: (data: AddSaleInput) => Sale;

  /* تعديل فاتورة */
  updateSale: (
    id: string,
    data: UpdateSaleInput,
  ) => void;

  /* حذف فاتورة */
  deleteSale: (id: string) => void;

  /* جلب فاتورة بواسطة ID */
  getSaleById: (
    id: string,
  ) => Sale | undefined;

  /* جلب فاتورة بواسطة رقم الفاتورة */
  getSaleByInvoiceNumber: (
    invoiceNumber: string,
  ) => Sale | undefined;

  /* البحث في الفواتير */
  searchSales: (
    search: string,
  ) => Sale[];

  /* إنشاء رقم فاتورة جديد */
  generateInvoiceNumber: () => string;

  /* تفريغ جميع الفواتير */
  clearSales: () => void;
}

/* =====================================================
   حساب إجماليات الفاتورة
===================================================== */

function calculateTotals(
  items: SaleItem[],
) {
  const subtotal = items.reduce(
    (sum, item) =>
      sum +
      Number(item.quantity) *
        Number(item.price),
    0,
  );

  const discount = items.reduce(
    (sum, item) =>
      sum + Number(item.discount || 0),
    0,
  );

  const totalQuantity = items.reduce(
    (sum, item) =>
      sum + Number(item.quantity),
    0,
  );

  const total = Math.max(
    subtotal - discount,
    0,
  );

  return {
    subtotal,
    discount,
    totalQuantity,
    total,
  };
}

/* =====================================================
   الفواتير الافتراضية
===================================================== */

const defaultSales: Sale[] = [
  {
    id: "sale-1001",

    invoiceNumber: "INV-1001",

    date: "2026-09-01",

    customerId: "customer-001",

    customerName: "أحمد",

    paymentMethod: "cash",

    accountCode: "1002",

    accountName: "الصندوق",

    items: [
      {
        id: 1,

        productId: "product-1001",

        productCode: "1001",

        item: "عسل",

        quantity: 2,

        price: 5000,

        discount: 0,

        total: 10000,
      },
    ],

    subtotal: 10000,

    discount: 0,

    totalQuantity: 2,

    total: 10000,

    status: "paid",

    createdAt:
      "2026-09-01T10:00:00.000Z",
  },

  {
    id: "sale-1002",

    invoiceNumber: "INV-1002",

    date: "2026-09-02",

    customerId: "customer-002",

    customerName: "محمد",

    paymentMethod: "credit",

    accountCode: "1002",

    accountName: "حساب العميل",

    items: [
      {
        id: 1,

        productId: "product-1003",

        productCode: "1003",

        item: "زيت",

        quantity: 3,

        price: 4000,

        discount: 500,

        total: 11500,
      },
    ],

    subtotal: 12000,

    discount: 500,

    totalQuantity: 3,

    total: 11500,

    status: "pending",

    createdAt:
      "2026-09-02T11:00:00.000Z",
  },
];

/* =====================================================
   Zustand Store
===================================================== */

export const useSalesStore =
  create<SalesStore>()(
    persist(
      (set, get) => ({
        /* =================================================
           البيانات
        ================================================= */

        sales: defaultSales,

        /* =================================================
           إنشاء رقم فاتورة جديد
        ================================================= */

        generateInvoiceNumber: () => {
          const sales = get().sales;

          let maxNumber = 1000;

          for (const sale of sales) {
            const match =
              sale.invoiceNumber.match(
                /^INV-(\d+)$/i,
              );

            if (!match) continue;

            const number = Number(match[1]);

            if (number > maxNumber) {
              maxNumber = number;
            }
          }

          return `INV-${maxNumber + 1}`;
        },

        /* =================================================
           إضافة فاتورة
        ================================================= */

        addSale: (data) => {
          const id =
            `sale-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 8)}`;

          const invoiceNumber =
            get().generateInvoiceNumber();

          const items = data.items.map(
            (item, index) => {
              const quantity =
                Number(item.quantity) || 0;

              const price =
                Number(item.price) || 0;

              const discount =
                Number(item.discount) || 0;

              const total = Math.max(
                quantity * price -
                  discount,
                0,
              );

              return {
                ...item,

                id:
                  item.id ??
                  Date.now() + index,

                quantity,

                price,

                discount,

                total,
              };
            },
          );

          const totals =
            calculateTotals(items);

          const sale: Sale = {
            id,

            invoiceNumber,

            date:
              data.date ??
              new Date()
                .toISOString()
                .split("T")[0],

            customerId:
              data.customerId,

            customerName:
              data.customerName,

            paymentMethod:
              data.paymentMethod ??
              "cash",

            accountCode:
              data.accountCode,

            accountName:
              data.accountName,

            items,

            subtotal:
              totals.subtotal,

            discount:
              totals.discount,

            totalQuantity:
              totals.totalQuantity,

            total:
              totals.total,

            status:
              data.status ??
              (
                data.paymentMethod ===
                "credit"
                  ? "pending"
                  : "paid"
              ),

            notes:
              data.notes,

            createdAt:
              new Date().toISOString(),
          };

          set((state) => ({
            sales: [
              ...state.sales,
              sale,
            ],
          }));

          return sale;
        },

        /* =================================================
           تعديل فاتورة
        ================================================= */

        updateSale: (
          id,
          data,
        ) => {
          set((state) => ({
            sales: state.sales.map(
              (sale) => {
                if (sale.id !== id) {
                  return sale;
                }

                const items =
                  data.items ??
                  sale.items;

                const normalizedItems =
                  items.map(
                    (item) => {
                      const quantity =
                        Number(
                          item.quantity,
                        ) || 0;

                      const price =
                        Number(
                          item.price,
                        ) || 0;

                      const discount =
                        Number(
                          item.discount,
                        ) || 0;

                      return {
                        ...item,

                        quantity,

                        price,

                        discount,

                        total: Math.max(
                          quantity *
                            price -
                            discount,
                          0,
                        ),
                      };
                    },
                  );

                const totals =
                  calculateTotals(
                    normalizedItems,
                  );

                return {
                  ...sale,

                  date:
                    data.date ??
                    sale.date,

                  customerId:
                    data.customerId ??
                    sale.customerId,

                  customerName:
                    data.customerName ??
                    sale.customerName,

                  paymentMethod:
                    data.paymentMethod ??
                    sale.paymentMethod,

                  accountCode:
                    data.accountCode ??
                    sale.accountCode,

                  accountName:
                    data.accountName ??
                    sale.accountName,

                  items:
                    normalizedItems,

                  subtotal:
                    totals.subtotal,

                  discount:
                    totals.discount,

                  totalQuantity:
                    totals.totalQuantity,

                  total:
                    totals.total,

                  status:
                    data.status ??
                    sale.status,

                  notes:
                    data.notes ??
                    sale.notes,
                };
              },
            ),
          }));
        },

        /* =================================================
           حذف فاتورة
        ================================================= */

        deleteSale: (id) => {
          set((state) => ({
            sales:
              state.sales.filter(
                (sale) =>
                  sale.id !== id,
              ),
          }));
        },

        /* =================================================
           جلب فاتورة بواسطة ID
        ================================================= */

        getSaleById: (id) => {
          return get().sales.find(
            (sale) =>
              sale.id === id,
          );
        },

        /* =================================================
           جلب فاتورة بواسطة رقم الفاتورة
        ================================================= */

        getSaleByInvoiceNumber: (
          invoiceNumber,
        ) => {
          return get().sales.find(
            (sale) =>
              sale.invoiceNumber ===
              invoiceNumber,
          );
        },

        /* =================================================
           البحث
        ================================================= */

        searchSales: (search) => {
          const value =
            search
              .trim()
              .toLowerCase();

          if (!value) {
            return get().sales;
          }

          return get().sales.filter(
            (sale) => {
              const invoiceNumber =
                sale.invoiceNumber
                  .toLowerCase();

              const customerName =
                (
                  sale.customerName ??
                  ""
                ).toLowerCase();

              const accountName =
                (
                  sale.accountName ??
                  ""
                ).toLowerCase();

              return (
                invoiceNumber.includes(
                  value,
                ) ||
                customerName.includes(
                  value,
                ) ||
                accountName.includes(
                  value,
                )
              );
            },
          );
        },

        /* =================================================
           حذف جميع الفواتير
        ================================================= */

        clearSales: () => {
          set({
            sales: [],
          });
        },
      }),

      /* ===================================================
         إعدادات LocalStorage
      =================================================== */

      {
        name: "erp-sales-storage",

        version: 1,
      },
    ),
  );