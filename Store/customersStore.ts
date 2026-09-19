"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ==================================================
// Customer Interface
// ==================================================

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  balance?: number;

  // الحساب المحاسبي المرتبط بالعميل
  accountCode?: string;
  accountName?: string;
}

// ==================================================
// Store Interface
// ==================================================

interface CustomersStore {
  customers: Customer[];

  // إضافة عميل
  addCustomer: (
    customer: Omit<Customer, "id">
  ) => Customer;

  // تعديل عميل
  updateCustomer: (
    id: string,
    data: Partial<Omit<Customer, "id">>
  ) => void;

  // حذف عميل
  deleteCustomer: (id: string) => void;

  // البحث عن عميل بالـ ID
  getCustomerById: (
    id: string
  ) => Customer | undefined;

  // البحث عن عميل بالحساب
  getCustomerByAccountCode: (
    accountCode: string
  ) => Customer | undefined;

  // البحث بالاسم
  searchCustomers: (
    search: string
  ) => Customer[];

  // تغيير الرصيد
  updateCustomerBalance: (
    id: string,
    balance: number
  ) => void;

  // مسح جميع العملاء
  clearCustomers: () => void;
}

// ==================================================
// Constants
// ==================================================

// العميل النقدي الخاص بالنظام
export const CASH_CUSTOMER_ID = "CASH-CUSTOMER";

// حساب الصندوق
export const CASH_ACCOUNT_CODE = "1002";

export const CASH_ACCOUNT_NAME = "الصندوق";

// ==================================================
// إنشاء العميل النقدي
// ==================================================

const createCashCustomer = (): Customer => ({
  id: CASH_CUSTOMER_ID,

  name: CASH_ACCOUNT_NAME,

  phone: "",

  address: "",

  balance: 0,

  accountCode: CASH_ACCOUNT_CODE,

  accountName: CASH_ACCOUNT_NAME,
});

// ==================================================
// إنشاء ID
// ==================================================

const createCustomerId = () =>
  `customer-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}`;

// ==================================================
// Zustand Store
// ==================================================

export const useCustomersStore = 
  create<CustomersStore>()(
    persist(
      (set, get) => ({
        // ==================================================
        // البيانات الافتراضية
        // ==================================================

        customers: [
          {
            id: "customer-001",
            name: "احمد محمد احمد العيشي",
            phone: "",
            address: "",
            balance: 0,
            accountCode: "1001",
            accountName:
              "احمد محمد احمد العيشي",
          },

          {
            id: "customer-002",
            name: "محمد علي صالح",
            phone: "",
            address: "",
            balance: 0,
            accountCode: "1002",
            accountName: "محمد علي صالح",
          },

          {
            id: "customer-003",
            name: "عبدالله احمد",
            phone: "",
            address: "",
            balance: 0,
            accountCode: "1003",
            accountName: "عبدالله احمد",
          },

          createCashCustomer(),
        ],

        // ==================================================
        // إضافة عميل
        // ==================================================

        addCustomer: (customer) => {
          const newCustomer: Customer = {
            id: createCustomerId(),

            ...customer,

            balance:
              customer.balance ?? 0,
          };

          set((state) => ({
            customers: [
              ...state.customers,
              newCustomer,
            ],
          }));

          return newCustomer;
        },

        // ==================================================
        // تعديل عميل
        // ==================================================

        updateCustomer: (id, data) => {
          // منع تعديل العميل النقدي
          if (id === CASH_CUSTOMER_ID) {
            return;
          }

          set((state) => ({
            customers: state.customers.map(
              (customer) =>
                customer.id === id
                  ? {
                      ...customer,
                      ...data,
                    }
                  : customer
            ),
          }));
        },

        // ==================================================
        // حذف عميل
        // ==================================================

        deleteCustomer: (id) => {
          // منع حذف العميل النقدي
          if (id === CASH_CUSTOMER_ID) {
            return;
          }

          set((state) => ({
            customers: state.customers.filter(
              (customer) =>
                customer.id !== id
            ),
          }));
        },

        // ==================================================
        // الحصول على العميل بواسطة ID
        // ==================================================

        getCustomerById: (id) => {
          return get().customers.find(
            (customer) =>
              customer.id === id
          );
        },

        // ==================================================
        // الحصول على العميل بواسطة رقم الحساب
        // ==================================================

        getCustomerByAccountCode: (
          accountCode
        ) => {
          return get().customers.find(
            (customer) =>
              customer.accountCode ===
              accountCode
          );
        },

        // ==================================================
        // البحث عن العملاء
        // ==================================================

        searchCustomers: (search) => {
          const value =
            search.trim().toLowerCase();

          if (!value) {
            return get().customers;
          }

          return get().customers.filter(
            (customer) =>
              customer.name
                .toLowerCase()
                .includes(value) ||

              customer.phone
                ?.toLowerCase()
                .includes(value) ||

              customer.accountCode
                ?.toLowerCase()
                .includes(value) ||

              customer.accountName
                ?.toLowerCase()
                .includes(value)
          );
        },

        // ==================================================
        // تعديل رصيد العميل
        // ==================================================

        updateCustomerBalance: (
          id,
          balance
        ) => {
          set((state) => ({
            customers: state.customers.map(
              (customer) =>
                customer.id === id
                  ? {
                      ...customer,
                      balance,
                    }
                  : customer
            ),
          }));
        },

        // ==================================================
        // مسح جميع العملاء
        // ==================================================

        clearCustomers: () => {
          set({
            customers: [
              createCashCustomer(),
            ],
          });
        },
      }),

      // ==================================================
      // Persist
      // ==================================================

      {
        name: "erp-customers-storage",

        // ==================================================
        // دمج البيانات القديمة مع البيانات الحالية
        // ==================================================

        merge: (
          persistedState,
          currentState
        ) => {
          const persisted =
            persistedState as
              | Partial<CustomersStore>
              | undefined;

          const storedCustomers =
            persisted?.customers;

          if (!storedCustomers) {
            return currentState;
          }

          // ----------------------------------------------
          // التأكد من وجود العميل النقدي
          // ----------------------------------------------

          const cashCustomerExists =
            storedCustomers.some(
              (customer) =>
                customer.id ===
                CASH_CUSTOMER_ID
            );

          let customers: Customer[];

          if (cashCustomerExists) {
            customers =
              storedCustomers.map(
                (customer) => {
                  if (
                    customer.id !==
                    CASH_CUSTOMER_ID
                  ) {
                    return {
                      ...customer,

                      balance:
                        customer.balance ??
                        0,
                    };
                  }

                  return {
                    ...customer,

                    id: CASH_CUSTOMER_ID,

                    name: CASH_ACCOUNT_NAME,

                    accountCode:
                      CASH_ACCOUNT_CODE,

                    accountName:
                      CASH_ACCOUNT_NAME,

                    balance:
                      customer.balance ??
                      0,
                  };
                }
              );
          } else {
            customers = [
              createCashCustomer(),
              ...storedCustomers,
            ];
          }

          return {
            ...currentState,

            customers,
          };
        },
      }
    )
  );