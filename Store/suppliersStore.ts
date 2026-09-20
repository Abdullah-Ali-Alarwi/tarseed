import { create } from "zustand";
import { persist } from "zustand/middleware";

// ======================================================
// Supplier
// ======================================================

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  balance?: number;
  accountCode?: string;
  accountName?: string;
  notes?: string;
  isActive?: boolean;
}

// ======================================================
// Helpers
// ======================================================

const generateSupplierId = () => {
  return `supplier-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}`;
};

const generateAccountCode = (suppliers: Supplier[]) => {
  const usedCodes = suppliers
    .map((supplier) => Number(supplier.accountCode))
    .filter((code) => Number.isFinite(code));

  let code = 1001;

  while (usedCodes.includes(code)) {
    code++;
  }

  return String(code);
};

// ======================================================
// Store Types
// ======================================================

interface SuppliersState {
  suppliers: Supplier[];

  addSupplier: (
    supplier: Omit<Supplier, "id">,
  ) => Supplier;

  updateSupplier: (
    id: string,
    data: Partial<Omit<Supplier, "id">>,
  ) => void;

  deleteSupplier: (id: string) => void;

  getSupplierById: (
    id: string,
  ) => Supplier | undefined;

  getSupplierByAccountCode: (
    accountCode: string,
  ) => Supplier | undefined;

  searchSuppliers: (
    query: string,
  ) => Supplier[];

  updateSupplierBalance: (
    id: string,
    balance: number,
  ) => void;

  clearSuppliers: () => void;
}

// ======================================================
// Zustand Store
// ======================================================

export const useSuppliersStore = create<SuppliersState>()(
  persist(
    (set, get) => ({
      // --------------------------------------------------
      // البيانات
      // --------------------------------------------------

      suppliers: [],

      // --------------------------------------------------
      // إضافة مورد
      // --------------------------------------------------

      addSupplier: (supplierData) => {
        const currentSuppliers = get().suppliers;

        const name = supplierData.name.trim();

        if (!name) {
          throw new Error("اسم المورد مطلوب");
        }

        // منع تكرار اسم المورد
        const exists = currentSuppliers.some(
          (supplier) =>
            supplier.name.trim().toLowerCase() ===
            name.toLowerCase(),
        );

        if (exists) {
          throw new Error("هذا المورد موجود بالفعل");
        }

        const supplier: Supplier = {
          id: generateSupplierId(),

          name,

          phone:
            supplierData.phone?.trim() || undefined,

          address:
            supplierData.address?.trim() || undefined,

          balance:
            Number.isFinite(supplierData.balance)
              ? supplierData.balance
              : 0,

          accountCode:
            supplierData.accountCode ||
            generateAccountCode(currentSuppliers),

          accountName:
            supplierData.accountName || name,

          notes:
            supplierData.notes?.trim() || undefined,

          isActive:
            supplierData.isActive ?? true,
        };

        set({
          suppliers: [
            ...currentSuppliers,
            supplier,
          ],
        });

        return supplier;
      },

      // --------------------------------------------------
      // تعديل المورد
      // --------------------------------------------------

      updateSupplier: (id, data) => {
        set((state) => ({
          suppliers: state.suppliers.map(
            (supplier) =>
              supplier.id === id
                ? {
                    ...supplier,
                    ...data,
                    id: supplier.id,
                  }
                : supplier,
          ),
        }));
      },

      // --------------------------------------------------
      // حذف المورد
      // --------------------------------------------------

      deleteSupplier: (id) => {
        set((state) => ({
          suppliers: state.suppliers.filter(
            (supplier) => supplier.id !== id,
          ),
        }));
      },

      // --------------------------------------------------
      // البحث بالـ ID
      // --------------------------------------------------

      getSupplierById: (id) => {
        return get().suppliers.find(
          (supplier) => supplier.id === id,
        );
      },

      // --------------------------------------------------
      // البحث بكود الحساب
      // --------------------------------------------------

      getSupplierByAccountCode: (accountCode) => {
        return get().suppliers.find(
          (supplier) =>
            supplier.accountCode === accountCode,
        );
      },

      // --------------------------------------------------
      // البحث
      // --------------------------------------------------

      searchSuppliers: (query) => {
        const value = query.trim().toLowerCase();

        if (!value) {
          return get().suppliers;
        }

        return get().suppliers.filter(
          (supplier) =>
            supplier.id
              .toLowerCase()
              .includes(value) ||
            supplier.name
              .toLowerCase()
              .includes(value) ||
            String(supplier.phone || "")
              .toLowerCase()
              .includes(value) ||
            String(supplier.address || "")
              .toLowerCase()
              .includes(value) ||
            String(supplier.accountCode || "")
              .toLowerCase()
              .includes(value),
        );
      },

      // --------------------------------------------------
      // تعديل الرصيد
      // --------------------------------------------------

      updateSupplierBalance: (id, balance) => {
        set((state) => ({
          suppliers: state.suppliers.map(
            (supplier) =>
              supplier.id === id
                ? {
                    ...supplier,
                    balance,
                  }
                : supplier,
          ),
        }));
      },

      // --------------------------------------------------
      // مسح الموردين
      // --------------------------------------------------

      clearSuppliers: () => {
        set({
          suppliers: [],
        });
      },
    }),

    {
      name: "erp-suppliers-storage",

      version: 1,

      // --------------------------------------------------
      // دمج البيانات القديمة
      // --------------------------------------------------

      merge: (persistedState, currentState) => {
        const persisted =
          persistedState as Partial<SuppliersState>;

        const suppliers = Array.isArray(
          persisted?.suppliers,
        )
          ? persisted.suppliers.map((supplier) => ({
              ...supplier,

              balance:
                typeof supplier.balance === "number"
                  ? supplier.balance
                  : 0,

              isActive:
                supplier.isActive ?? true,
            }))
          : [];

        return {
          ...currentState,
          suppliers,
        };
      },
    },
  ),
);