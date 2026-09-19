"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* =========================================================
   Types
========================================================= */

export interface BankAccount {
  id: string;
  code: string;
  name: string;
  balance?: number;
  phone?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

/* =========================================================
   Store Interface
========================================================= */

interface BankAccountsStore {
  bankAccounts: BankAccount[];

  addBankAccount: (
    account: Omit<BankAccount, "id">
  ) => BankAccount;

  updateBankAccount: (
    id: string,
    data: Partial<Omit<BankAccount, "id">>
  ) => void;

  deleteBankAccount: (id: string) => void;

  getBankAccountById: (
    id: string
  ) => BankAccount | undefined;

  getBankAccountByCode: (
    code: string
  ) => BankAccount | undefined;

  searchBankAccounts: (
    search: string
  ) => BankAccount[];

  updateBankAccountBalance: (
    id: string,
    balance: number
  ) => void;

  clearBankAccounts: () => void;
}

/* =========================================================
   Helpers
========================================================= */

const createBankAccountId = () =>
  `bank-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}`;

/*
  إنشاء رقم حساب جديد.
  نبدأ من 1001 ونبحث عن أول رقم غير مستخدم.
*/
const generateAccountCode = (
  accounts: BankAccount[]
) => {
  let code = 1001;

  while (
    accounts.some(
      (account) => account.code === String(code)
    )
  ) {
    code++;
  }

  return String(code);
};

/* =========================================================
   Default Bank Accounts
========================================================= */

const defaultBankAccounts: BankAccount[] = [
  {
    id: "bank-1001",
    code: "1001",
    name: "بنك التضامن",
    balance: 0,
    phone: "",
    address: "",
    notes: "",
    isActive: true,
  },
  {
    id: "bank-1002",
    code: "1002",
    name: "العامري للصرافة",
    balance: 0,
    phone: "",
    address: "",
    notes: "",
    isActive: true,
  },
  {
    id: "bank-1003",
    code: "1003",
    name: "العروي للصرافة",
    balance: 0,
    phone: "",
    address: "",
    notes: "",
    isActive: true,
  },
  {
    id: "bank-1004",
    code: "1004",
    name: "الفروي للصرافة",
    balance: 0,
    phone: "",
    address: "",
    notes: "",
    isActive: true,
  },
  {
    id: "bank-1005",
    code: "1005",
    name: "النجم للصرافة",
    balance: 0,
    phone: "",
    address: "",
    notes: "",
    isActive: true,
  },
];

/* =========================================================
   Zustand Store
========================================================= */

export const useBankAccountsStore =
  create<BankAccountsStore>()(
    persist(
      (set, get) => ({
        /* ---------------------------------------------------
           Initial Data
        --------------------------------------------------- */

        bankAccounts: defaultBankAccounts,

        /* ---------------------------------------------------
           Add
        --------------------------------------------------- */

        addBankAccount: (account) => {
          const currentAccounts =
            get().bankAccounts;

          const code =
            account.code?.trim() ||
            generateAccountCode(currentAccounts);

          const codeExists = currentAccounts.some(
            (item) => item.code === code
          );

          if (codeExists) {
            throw new Error(
              `رقم الحساب ${code} مستخدم بالفعل`
            );
          }

          const newAccount: BankAccount = {
            id: createBankAccountId(),
            ...account,
            code,
            balance: account.balance ?? 0,
            isActive: account.isActive ?? true,
          };

          set((state) => ({
            bankAccounts: [
              ...state.bankAccounts,
              newAccount,
            ],
          }));

          return newAccount;
        },

        /* ---------------------------------------------------
           Update
        --------------------------------------------------- */

        updateBankAccount: (id, data) => {
          const currentAccount =
            get().bankAccounts.find(
              (account) => account.id === id
            );

          if (!currentAccount) return;

          /*
            إذا تم تغيير رقم الحساب نتأكد
            أنه غير مستخدم من حساب آخر.
          */
          if (
            data.code &&
            data.code !== currentAccount.code
          ) {
            const codeExists =
              get().bankAccounts.some(
                (account) =>
                  account.id !== id &&
                  account.code === data.code
              );

            if (codeExists) {
              throw new Error(
                `رقم الحساب ${data.code} مستخدم بالفعل`
              );
            }
          }

          set((state) => ({
            bankAccounts: state.bankAccounts.map(
              (account) =>
                account.id === id
                  ? {
                      ...account,
                      ...data,
                    }
                  : account
            ),
          }));
        },

        /* ---------------------------------------------------
           Delete
        --------------------------------------------------- */

        deleteBankAccount: (id) => {
          set((state) => ({
            bankAccounts:
              state.bankAccounts.filter(
                (account) => account.id !== id
              ),
          }));
        },

        /* ---------------------------------------------------
           Get By ID
        --------------------------------------------------- */

        getBankAccountById: (id) => {
          return get().bankAccounts.find(
            (account) => account.id === id
          );
        },

        /* ---------------------------------------------------
           Get By Code
        --------------------------------------------------- */

        getBankAccountByCode: (code) => {
          return get().bankAccounts.find(
            (account) => account.code === code
          );
        },

        /* ---------------------------------------------------
           Search
        --------------------------------------------------- */

        searchBankAccounts: (search) => {
          const value = search
            .trim()
            .toLowerCase();

          if (!value) {
            return get().bankAccounts;
          }

          return get().bankAccounts.filter(
            (account) =>
              account.name
                .toLowerCase()
                .includes(value) ||
              account.code
                .toLowerCase()
                .includes(value) ||
              account.phone
                ?.toLowerCase()
                .includes(value) ||
              account.address
                ?.toLowerCase()
                .includes(value)
          );
        },

        /* ---------------------------------------------------
           Update Balance
        --------------------------------------------------- */

        updateBankAccountBalance: (
          id,
          balance
        ) => {
          set((state) => ({
            bankAccounts:
              state.bankAccounts.map(
                (account) =>
                  account.id === id
                    ? {
                        ...account,
                        balance,
                      }
                    : account
              ),
          }));
        },

        /* ---------------------------------------------------
           Clear
        --------------------------------------------------- */

        clearBankAccounts: () => {
          set({
            bankAccounts: [],
          });
        },
      }),

      /* =====================================================
         Persist
      ===================================================== */

      {
        name: "erp-bank-accounts-storage",

        merge: (
          persistedState,
          currentState
        ) => {
          const persisted =
            persistedState as
              | Partial<BankAccountsStore>
              | undefined;

          const storedAccounts =
            persisted?.bankAccounts;

          if (!storedAccounts) {
            return currentState;
          }

          return {
            ...currentState,
            bankAccounts:
              storedAccounts.map((account) => ({
                ...account,
                balance: account.balance ?? 0,
                isActive:
                  account.isActive ?? true,
              })),
          };
        },
      }
    )
  );