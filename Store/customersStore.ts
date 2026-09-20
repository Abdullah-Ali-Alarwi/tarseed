import { create } from "zustand";
import { persist } from "zustand/middleware";

// =========================================================
// CONSTANTS
// =========================================================

export const CASH_CUSTOMER_ID = "CASH-CUSTOMER";

export const CASH_ACCOUNT_CODE = "1002";

export const CASH_ACCOUNT_NAME = "الصندوق";

// =========================================================
// CUSTOMER
// =========================================================

export interface Customer {
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

// =========================================================
// STORE
// =========================================================

interface CustomersStore {
  customers: Customer[];

  addCustomer: (
    customer: Omit<Customer, "id">,
  ) => Customer;

  updateCustomer: (
    id: string,
    data: Partial<Omit<Customer, "id">>,
  ) => void;

  deleteCustomer: (id: string) => void;

  getCustomerById: (
    id: string,
  ) => Customer | undefined;

  getCustomerByAccountCode: (
    accountCode: string,
  ) => Customer | undefined;

  searchCustomers: (
    query: string,
  ) => Customer[];

  updateCustomerBalance: (
    id: string,
    amount: number,
  ) => void;

  clearCustomers: () => void;
}

// =========================================================
// ID GENERATOR
// =========================================================

function generateCustomerId() {
  return `customer-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}`;
}

// =========================================================
// CASH CUSTOMER
// =========================================================

const cashCustomer: Customer = {
  id: CASH_CUSTOMER_ID,
  name: "العميل النقدي",
  phone: undefined,
  address: undefined,
  balance: 0,
  accountCode: CASH_ACCOUNT_CODE,
  accountName: CASH_ACCOUNT_NAME,
  notes: "عميل نقدي افتراضي لا يمكن حذفه أو تعديله",
  isActive: true,
};

// =========================================================
// STORE
// =========================================================

export const useCustomersStore = create<CustomersStore>()(
  persist(
    (set, get) => ({
      // =====================================================
      // INITIAL DATA
      // =====================================================

      customers: [cashCustomer],

      // =====================================================
      // ADD CUSTOMER
      // =====================================================

      addCustomer: (customer) => {
        const newCustomer: Customer = {
          id: generateCustomerId(),

          name: customer.name.trim(),

          phone: customer.phone?.trim() || undefined,

          address:
            customer.address?.trim() || undefined,

          balance: Number(customer.balance ?? 0),

          accountCode:
            customer.accountCode?.trim() || undefined,

          accountName:
            customer.accountName?.trim() || undefined,

          notes:
            customer.notes?.trim() || undefined,

          isActive:
            customer.isActive ?? true,
        };

        set((state) => ({
          customers: [
            ...state.customers,
            newCustomer,
          ],
        }));

        return newCustomer;
      },

      // =====================================================
      // UPDATE CUSTOMER
      // =====================================================

      updateCustomer: (id, data) => {
        if (id === CASH_CUSTOMER_ID) {
          return;
        }

        set((state) => ({
          customers: state.customers.map((customer) =>
            customer.id === id
              ? {
                  ...customer,
                  ...data,

                  name:
                    data.name !== undefined
                      ? data.name.trim()
                      : customer.name,

                  phone:
                    data.phone !== undefined
                      ? data.phone?.trim() || undefined
                      : customer.phone,

                  address:
                    data.address !== undefined
                      ? data.address?.trim() || undefined
                      : customer.address,

                  accountCode:
                    data.accountCode !== undefined
                      ? data.accountCode?.trim() || undefined
                      : customer.accountCode,

                  accountName:
                    data.accountName !== undefined
                      ? data.accountName?.trim() || undefined
                      : customer.accountName,

                  notes:
                    data.notes !== undefined
                      ? data.notes?.trim() || undefined
                      : customer.notes,
                }
              : customer,
          ),
        }));
      },

      // =====================================================
      // DELETE CUSTOMER
      // =====================================================

      deleteCustomer: (id) => {
        if (id === CASH_CUSTOMER_ID) {
          return;
        }

        set((state) => ({
          customers: state.customers.filter(
            (customer) => customer.id !== id,
          ),
        }));
      },

      // =====================================================
      // GET CUSTOMER BY ID
      // =====================================================

      getCustomerById: (id) => {
        return get().customers.find(
          (customer) => customer.id === id,
        );
      },

      // =====================================================
      // GET CUSTOMER BY ACCOUNT CODE
      // =====================================================

      getCustomerByAccountCode: (accountCode) => {
        return get().customers.find(
          (customer) =>
            customer.accountCode === accountCode,
        );
      },

      // =====================================================
      // SEARCH CUSTOMERS
      // =====================================================

      searchCustomers: (query) => {
        const value = query.trim().toLowerCase();

        if (!value) {
          return get().customers;
        }

        return get().customers.filter((customer) => {
          return (
            customer.name
              .toLowerCase()
              .includes(value) ||

            String(customer.id)
              .toLowerCase()
              .includes(value) ||

            String(customer.phone ?? "")
              .toLowerCase()
              .includes(value) ||

            String(customer.address ?? "")
              .toLowerCase()
              .includes(value) ||

            String(customer.accountCode ?? "")
              .toLowerCase()
              .includes(value) ||

            String(customer.accountName ?? "")
              .toLowerCase()
              .includes(value)
          );
        });
      },

      // =====================================================
      // UPDATE BALANCE
      // =====================================================

      updateCustomerBalance: (id, amount) => {
        if (id === CASH_CUSTOMER_ID) {
          return;
        }

        set((state) => ({
          customers: state.customers.map((customer) =>
            customer.id === id
              ? {
                  ...customer,
                  balance:
                    Number(customer.balance ?? 0) +
                    Number(amount ?? 0),
                }
              : customer,
          ),
        }));
      },

      // =====================================================
      // CLEAR CUSTOMERS
      // =====================================================

      clearCustomers: () => {
        set({
          customers: [cashCustomer],
        });
      },
    }),

    {
      name: "erp-customers-storage",

      // =====================================================
      // STORAGE MERGE
      // =====================================================

      merge: (persistedState, currentState) => {
        const persisted =
          persistedState as Partial<CustomersStore> | undefined;

        const savedCustomers =
          Array.isArray(persisted?.customers)
            ? persisted.customers
            : [];

        // التأكد من وجود العميل النقدي دائمًا
        const hasCashCustomer =
          savedCustomers.some(
            (customer) =>
              customer.id === CASH_CUSTOMER_ID,
          );

        const normalizedCustomers = hasCashCustomer
          ? savedCustomers
          : [cashCustomer, ...savedCustomers];

        return {
          ...currentState,

          ...persisted,

          customers: normalizedCustomers.map(
            (customer) => ({
              ...customer,

              balance: Number(
                customer.balance ?? 0,
              ),

              isActive:
                customer.isActive ?? true,
            }),
          ),
        };
      },
    },
  ),
);