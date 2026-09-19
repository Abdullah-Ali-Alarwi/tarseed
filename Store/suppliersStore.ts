    "use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* =========================================================
   بيانات المورد
========================================================= */

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  balance?: number;

  // الحساب المحاسبي المرتبط بالمورد
  accountCode?: string;
  accountName?: string;

  notes?: string;
  isActive?: boolean;
}

/* =========================================================
   بيانات Store
========================================================= */

interface SuppliersStore {
  suppliers: Supplier[];

  addSupplier: (
    supplier: Supplier
  ) => void;

  updateSupplier: (
    id: string,
    data: Partial<Supplier>
  ) => void;

  deleteSupplier: (
    id: string
  ) => void;

  getSupplierById: (
    id: string
  ) => Supplier | undefined;

  getSupplierByAccountCode: (
    accountCode: string
  ) => Supplier | undefined;

  searchSuppliers: (
    query: string
  ) => Supplier[];

  updateSupplierBalance: (
    id: string,
    balance: number
  ) => void;

  clearSuppliers: () => void;
}

/* =========================================================
   البيانات الافتراضية
========================================================= */

const defaultSuppliers: Supplier[] = [
  {
    id: "supplier-001",
    name: "شركة مواد البناء",
    phone: "",
    address: "",
    balance: 85000,
    accountCode: "2001",
    accountName: "الموردون",
    isActive: true,
  },

  {
    id: "supplier-002",
    name: "مؤسسة النور للتجارة",
    phone: "",
    address: "",
    balance: 42500,
    accountCode: "2002",
    accountName: "مؤسسة النور للتجارة",
    isActive: true,
  },

  {
    id: "supplier-003",
    name: "شركة الحديد المتحدة",
    phone: "",
    address: "",
    balance: 120000,
    accountCode: "2003",
    accountName: "شركة الحديد المتحدة",
    isActive: true,
  },
];

/* =========================================================
   Zustand Store
========================================================= */

export const useSuppliersStore =
  create<SuppliersStore>()(
    persist(
      (set, get) => ({
        suppliers: defaultSuppliers,

        /* =================================================
           إضافة مورد
        ================================================= */

        addSupplier: (supplier) => {
          set((state) => ({
            suppliers: [
              ...state.suppliers,
              {
                ...supplier,
                balance:
                  Number(supplier.balance) || 0,
                isActive:
                  supplier.isActive !== false,
              },
            ],
          }));
        },

        /* =================================================
           تعديل مورد
        ================================================= */

        updateSupplier: (
          id,
          data
        ) => {
          set((state) => ({
            suppliers:
              state.suppliers.map(
                (supplier) =>
                  supplier.id === id
                    ? {
                        ...supplier,
                        ...data,
                      }
                    : supplier
              ),
          }));
        },

        /* =================================================
           حذف مورد
        ================================================= */

        deleteSupplier: (id) => {
          set((state) => ({
            suppliers:
              state.suppliers.filter(
                (supplier) =>
                  supplier.id !== id
              ),
          }));
        },

        /* =================================================
           الحصول على مورد بواسطة ID
        ================================================= */

        getSupplierById: (id) => {
          return get().suppliers.find(
            (supplier) =>
              supplier.id === id
          );
        },

        /* =================================================
           الحصول على المورد بواسطة الحساب
        ================================================= */

        getSupplierByAccountCode: (
          accountCode
        ) => {
          return get().suppliers.find(
            (supplier) =>
              supplier.accountCode ===
              accountCode
          );
        },

        /* =================================================
           البحث عن الموردين
        ================================================= */

        searchSuppliers: (query) => {
          const search =
            query.trim().toLowerCase();

          if (!search) {
            return get().suppliers;
          }

          return get().suppliers.filter(
            (supplier) => {
              return (
                supplier.name
                  .toLowerCase()
                  .includes(search) ||

                supplier.phone
                  ?.toLowerCase()
                  .includes(search) ||

                supplier.address
                  ?.toLowerCase()
                  .includes(search) ||

                supplier.accountCode
                  ?.toLowerCase()
                  .includes(search) ||

                supplier.accountName
                  ?.toLowerCase()
                  .includes(search)
              );
            }
          );
        },

        /* =================================================
           تعديل رصيد المورد
        ================================================= */

        updateSupplierBalance: (
          id,
          balance
        ) => {
          set((state) => ({
            suppliers:
              state.suppliers.map(
                (supplier) =>
                  supplier.id === id
                    ? {
                        ...supplier,
                        balance:
                          Number(balance) || 0,
                      }
                    : supplier
              ),
          }));
        },

        /* =================================================
           حذف جميع الموردين
        ================================================= */

        clearSuppliers: () => {
          set({
            suppliers: [],
          });
        },
      }),

      {
        name: "erp-suppliers-storage",
      }
    )
  );