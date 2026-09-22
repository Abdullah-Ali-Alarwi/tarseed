"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/* =========================================================
   TYPES
========================================================= */

export type PaymentMethod = "cash" | "bank" | "credit";

export type SaleStatus = "paid" | "pending" | "cancelled";

export type PurchaseStatus = "paid" | "pending" | "cancelled";

export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "cogs"
  | "expense";

export type AccountNature = "debit" | "credit";

export type AccountEntityType =
  | "cash"
  | "bank"
  | "customer"
  | "supplier"
  | "inventory"
  | "revenue"
  | "expense"
  | "equity"
  | "other";

/* =========================================================
   CONSTANTS
========================================================= */

export const CASH_CUSTOMER_ID = "CASH-CUSTOMER";

export const CASH_ACCOUNT_CODE = "1101";
export const CASH_ACCOUNT_NAME = "الصندوق";

export const INVENTORY_ACCOUNT_CODE = "1104";
export const INVENTORY_ACCOUNT_NAME = "المخزون";

export const INPUT_VAT_ACCOUNT_CODE = "1105";
export const INPUT_VAT_ACCOUNT_NAME =
  "ضريبة القيمة المضافة - مدخلات";

/* =========================================================
   ACCOUNT
========================================================= */

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  nature: AccountNature;
  parentId?: string;
  parentCode?: string;
  level: number;
  isGroup: boolean;
  isActive: boolean;
  entityType?: AccountEntityType;
  entityId?: string;
  balance?: number;
  description?: string;
  isSystem?: boolean;
}

export interface AddAccountInput {
  name: string;
  type: AccountType;
  nature?: AccountNature;
  parentId?: string;
  code?: string;
  isGroup?: boolean;
  entityType?: AccountEntityType;
  entityId?: string;
  description?: string;
}

export interface UpdateAccountInput {
  name?: string;
  description?: string;
  isActive?: boolean;
}

/* =========================================================
   BANK
========================================================= */

export interface BankAccount {
  id: string;
  code: string;
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  balance?: number;
  isActive?: boolean;
  accountId?: string;
  accountCode?: string;
  accountName?: string;
}

export interface AddBankAccountInput {
  name: string;
  phone?: string;
  address?: string;
  notes?: string;
  balance?: number;
}

/* =========================================================
   CUSTOMER
========================================================= */

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  balance?: number;
  accountCode?: string;
  accountName?: string;
  accountId?: string;
  notes?: string;
  isActive?: boolean;
}

export interface AddCustomerInput {
  name: string;
  phone?: string;
  address?: string;
  balance?: number;
  notes?: string;
  isActive?: boolean;
}

/* =========================================================
   SUPPLIER
========================================================= */

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  balance?: number;
  accountCode?: string;
  accountName?: string;
  accountId?: string;
  notes?: string;
  isActive?: boolean;
}

export interface AddSupplierInput {
  name: string;
  phone?: string;
  address?: string;
  balance?: number;
  notes?: string;
  isActive?: boolean;
}

/* =========================================================
   PRODUCT
========================================================= */

export interface Product {
  id: string;
  code: string;
  name: string;
  unit?: string;
  category?: string;
  description?: string;
  isActive?: boolean;
}

export interface AddProductInput {
  name: string;
  unit?: string;
  category?: string;
  description?: string;
  isActive?: boolean;
}

/* =========================================================
   PURCHASE
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
  paymentMethod: PaymentMethod;
  paymentMethodName?: string;
  status: PurchaseStatus;
  notes?: string;
  createdAt?: string;
}

export interface AddPurchaseInput {
  invoiceNumber?: string;
  date: string;
  supplier: string;
  supplierId: string;
  items: PurchaseItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  taxRate?: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentMethodName?: string;
  status?: PurchaseStatus;
  notes?: string;
  accountCode?: string;
  accountName?: string;
}

/* =========================================================
   SALES
========================================================= */

export interface SaleItem {
  id: number;
  productId?: string;
  productCode?: string;
  item: string;
  quantity: number;
  price: number;
  discount: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId?: string;
  customerName?: string;
  paymentMethod: PaymentMethod;
  accountCode?: string;
  accountName?: string;
  items: SaleItem[];
  subtotal: number;
  discount: number;
  totalQuantity: number;
  total: number;
  status: SaleStatus;
  notes?: string;
  createdAt: string;
}

export interface AddSaleInput {
  invoiceNumber?: string;
  date: string;
  customerId?: string;
  customerName?: string;
  paymentMethod: PaymentMethod;
  accountCode?: string;
  accountName?: string;
  items: SaleItem[];
  subtotal: number;
  discount?: number;
  totalQuantity?: number;
  total: number;
  status?: SaleStatus;
  notes?: string;
}

export interface UpdateSaleInput {
  invoiceNumber?: string;
  date?: string;
  customerId?: string;
  customerName?: string;
  paymentMethod?: PaymentMethod;
  accountCode?: string;
  accountName?: string;
  items?: SaleItem[];
  subtotal?: number;
  discount?: number;
  totalQuantity?: number;
  total?: number;
  status?: SaleStatus;
  notes?: string;
}

/* =========================================================
   INVENTORY
========================================================= */

export interface InventoryItem {
  productId: string;
  productCode: string;
  productName: string;
  unit: string;
  purchaseQuantity: number;
  saleQuantity: number;
  quantity: number;
  averagePurchasePrice: number;
  inventoryValue: number;
}

/* =========================================================
   JOURNAL
========================================================= */

export interface JournalLine {
  id: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
  description?: string;
  customerId?: string;
  supplierId?: string;
  bankId?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  description: string;
  referenceType?:
    | "sale"
    | "purchase"
    | "payment"
    | "receipt"
    | "manual"
    | "other";
  referenceId?: string;
  lines: JournalLine[];
  createdAt: string;
}

/* =========================================================
   ACCOUNT TREE
========================================================= */

export interface AccountTreeNode extends Account {
  children: AccountTreeNode[];
}

/* =========================================================
   DEFAULT ACCOUNT TREE
========================================================= */

const defaultAccounts: Account[] = [
  /* =====================================================
     1 - ASSETS
  ===================================================== */

  {
    id: "account-assets",
    code: "1",
    name: "الأصول",
    type: "asset",
    nature: "debit",
    level: 1,
    isGroup: true,
    isActive: true,
    isSystem: true,
  },

  {
    id: "account-current-assets",
    code: "11",
    name: "الأصول المتداولة",
    type: "asset",
    nature: "debit",
    parentId: "account-assets",
    parentCode: "1",
    level: 2,
    isGroup: true,
    isActive: true,
    isSystem: true,
  },

  {
    id: "account-cash",
    code: "1101",
    name: "الصندوق",
    type: "asset",
    nature: "debit",
    parentId: "account-current-assets",
    parentCode: "11",
    level: 3,
    isGroup: false,
    isActive: true,
    entityType: "cash",
    entityId: CASH_CUSTOMER_ID,
    balance: 0,
    isSystem: true,
  },

  {
    id: "account-banks",
    code: "1102",
    name: "البنوك والصرافات",
    type: "asset",
    nature: "debit",
    parentId: "account-current-assets",
    parentCode: "11",
    level: 3,
    isGroup: true,
    isActive: true,
    entityType: "bank",
    isSystem: true,
  },

  {
    id: "account-customers",
    code: "1103",
    name: "العملاء والذمم المدينة",
    type: "asset",
    nature: "debit",
    parentId: "account-current-assets",
    parentCode: "11",
    level: 3,
    isGroup: true,
    isActive: true,
    entityType: "customer",
    isSystem: true,
  },

  /*
   * 1104 أصبح حسابًا تفصيليًا وليس Group.
   * السبب: نريد أن يحمل رصيد المخزون الناتج من القيود
   * ويظهر مباشرة ضمن الأصول في الميزانية.
   */
  {
    id: "account-inventory",
    code: "1104",
    name: INVENTORY_ACCOUNT_NAME,
    type: "asset",
    nature: "debit",
    parentId: "account-current-assets",
    parentCode: "11",
    level: 3,
    isGroup: false,
    isActive: true,
    entityType: "inventory",
    balance: 0,
    isSystem: true,
  },

  {
    id: "account-input-vat",
    code: INPUT_VAT_ACCOUNT_CODE,
    name: INPUT_VAT_ACCOUNT_NAME,
    type: "asset",
    nature: "debit",
    parentId: "account-current-assets",
    parentCode: "11",
    level: 3,
    isGroup: false,
    isActive: true,
    balance: 0,
    isSystem: true,
  },

  /* =====================================================
     2 - LIABILITIES
  ===================================================== */

  {
    id: "account-liabilities",
    code: "2",
    name: "الالتزامات",
    type: "liability",
    nature: "credit",
    level: 1,
    isGroup: true,
    isActive: true,
    isSystem: true,
  },

  {
    id: "account-current-liabilities",
    code: "21",
    name: "الالتزامات المتداولة",
    type: "liability",
    nature: "credit",
    parentId: "account-liabilities",
    parentCode: "2",
    level: 2,
    isGroup: true,
    isActive: true,
    isSystem: true,
  },

  {
    id: "account-suppliers",
    code: "2101",
    name: "الموردون والذمم الدائنة",
    type: "liability",
    nature: "credit",
    parentId: "account-current-liabilities",
    parentCode: "21",
    level: 3,
    isGroup: true,
    isActive: true,
    entityType: "supplier",
    isSystem: true,
  },

  {
    id: "account-vat-payable",
    code: "2102",
    name: "ضريبة القيمة المضافة المستحقة",
    type: "liability",
    nature: "credit",
    parentId: "account-current-liabilities",
    parentCode: "21",
    level: 3,
    isGroup: false,
    isActive: true,
    isSystem: true,
  },

  /* =====================================================
     3 - EQUITY
  ===================================================== */

  {
    id: "account-equity",
    code: "3",
    name: "حقوق الملكية",
    type: "equity",
    nature: "credit",
    level: 1,
    isGroup: true,
    isActive: true,
    isSystem: true,
  },

  {
    id: "account-capital-group",
    code: "31",
    name: "رأس المال والاحتياطيات",
    type: "equity",
    nature: "credit",
    parentId: "account-equity",
    parentCode: "3",
    level: 2,
    isGroup: true,
    isActive: true,
    isSystem: true,
  },

  {
    id: "account-capital",
    code: "3101",
    name: "رأس المال",
    type: "equity",
    nature: "credit",
    parentId: "account-capital-group",
    parentCode: "31",
    level: 3,
    isGroup: false,
    isActive: true,
    entityType: "equity",
    isSystem: true,
  },

  {
    id: "account-retained-earnings",
    code: "3102",
    name: "الأرباح المحتجزة",
    type: "equity",
    nature: "credit",
    parentId: "account-capital-group",
    parentCode: "31",
    level: 3,
    isGroup: false,
    isActive: true,
    entityType: "equity",
    isSystem: true,
  },

  /* =====================================================
     4 - REVENUE
  ===================================================== */

  {
    id: "account-revenue",
    code: "4",
    name: "الإيرادات",
    type: "revenue",
    nature: "credit",
    level: 1,
    isGroup: true,
    isActive: true,
    isSystem: true,
  },

  {
    id: "account-sales-revenue",
    code: "41",
    name: "إيرادات المبيعات والخدمات",
    type: "revenue",
    nature: "credit",
    parentId: "account-revenue",
    parentCode: "4",
    level: 2,
    isGroup: true,
    isActive: true,
    isSystem: true,
  },

  {
    id: "account-honey-sales",
    code: "4101",
    name: "مبيعات العسل",
    type: "revenue",
    nature: "credit",
    parentId: "account-sales-revenue",
    parentCode: "41",
    level: 3,
    isGroup: false,
    isActive: true,
    entityType: "revenue",
    isSystem: true,
  },

  {
    id: "account-oils-sales",
    code: "4102",
    name: "مبيعات الزيوت الطبيعية",
    type: "revenue",
    nature: "credit",
    parentId: "account-sales-revenue",
    parentCode: "41",
    level: 3,
    isGroup: false,
    isActive: true,
    entityType: "revenue",
    isSystem: true,
  },

  {
    id: "account-umrah-revenue",
    code: "4103",
    name: "إيرادات خدمات العمرة",
    type: "revenue",
    nature: "credit",
    parentId: "account-sales-revenue",
    parentCode: "41",
    level: 3,
    isGroup: false,
    isActive: true,
    entityType: "revenue",
    isSystem: true,
  },

  /* =====================================================
     5 - COGS
  ===================================================== */

  {
    id: "account-cogs",
    code: "5",
    name: "تكلفة المبيعات",
    type: "cogs",
    nature: "debit",
    level: 1,
    isGroup: true,
    isActive: true,
    isSystem: true,
  },

  {
    id: "account-cogs-group",
    code: "51",
    name: "تكلفة البضاعة المباعة",
    type: "cogs",
    nature: "debit",
    parentId: "account-cogs",
    parentCode: "5",
    level: 2,
    isGroup: true,
    isActive: true,
    isSystem: true,
  },

  {
    id: "account-honey-cogs",
    code: "5101",
    name: "تكلفة مبيعات العسل",
    type: "cogs",
    nature: "debit",
    parentId: "account-cogs-group",
    parentCode: "51",
    level: 3,
    isGroup: false,
    isActive: true,
    isSystem: true,
  },

  {
    id: "account-oils-cogs",
    code: "5102",
    name: "تكلفة مبيعات الزيوت",
    type: "cogs",
    nature: "debit",
    parentId: "account-cogs-group",
    parentCode: "51",
    level: 3,
    isGroup: false,
    isActive: true,
    isSystem: true,
  },

  /* =====================================================
     6 - EXPENSES
  ===================================================== */

  {
    id: "account-expenses",
    code: "6",
    name: "المصروفات",
    type: "expense",
    nature: "debit",
    level: 1,
    isGroup: true,
    isActive: true,
    isSystem: true,
  },

  {
    id: "account-operating-expenses",
    code: "61",
    name: "المصروفات التشغيلية والإدارية",
    type: "expense",
    nature: "debit",
    parentId: "account-expenses",
    parentCode: "6",
    level: 2,
    isGroup: true,
    isActive: true,
    isSystem: true,
  },

  {
    id: "account-salaries",
    code: "6101",
    name: "الرواتب والأجور",
    type: "expense",
    nature: "debit",
    parentId: "account-operating-expenses",
    parentCode: "61",
    level: 3,
    isGroup: false,
    isActive: true,
    entityType: "expense",
    isSystem: true,
  },

  {
    id: "account-rent",
    code: "6102",
    name: "الإيجارات",
    type: "expense",
    nature: "debit",
    parentId: "account-operating-expenses",
    parentCode: "61",
    level: 3,
    isGroup: false,
    isActive: true,
    entityType: "expense",
    isSystem: true,
  },

  {
    id: "account-electricity",
    code: "6103",
    name: "الكهرباء والمياه",
    type: "expense",
    nature: "debit",
    parentId: "account-operating-expenses",
    parentCode: "61",
    level: 3,
    isGroup: false,
    isActive: true,
    entityType: "expense",
    isSystem: true,
  },

  {
    id: "account-communications",
    code: "6104",
    name: "الاتصالات والإنترنت",
    type: "expense",
    nature: "debit",
    parentId: "account-operating-expenses",
    parentCode: "61",
    level: 3,
    isGroup: false,
    isActive: true,
    entityType: "expense",
    isSystem: true,
  },

  {
    id: "account-transport",
    code: "6105",
    name: "النقل والمواصلات",
    type: "expense",
    nature: "debit",
    parentId: "account-operating-expenses",
    parentCode: "61",
    level: 3,
    isGroup: false,
    isActive: true,
    entityType: "expense",
    isSystem: true,
  },

  {
    id: "account-general-expenses",
    code: "6106",
    name: "مصروفات عمومية وإدارية",
    type: "expense",
    nature: "debit",
    parentId: "account-operating-expenses",
    parentCode: "61",
    level: 3,
    isGroup: false,
    isActive: true,
    entityType: "expense",
    isSystem: true,
  },
];

/* =========================================================
   CASH CUSTOMER
========================================================= */

export const cashCustomer: Customer = {
  id: CASH_CUSTOMER_ID,
  name: "العميل النقدي",
  balance: 0,
  accountCode: CASH_ACCOUNT_CODE,
  accountName: CASH_ACCOUNT_NAME,
  accountId: "account-cash",
  notes: "عميل نقدي افتراضي لا يمكن حذفه أو تعديله",
  isActive: true,
};

/* =========================================================
   HELPERS
========================================================= */

const createId = (prefix: string) => {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}`;
};

const formatPaymentMethod = (
  method: PaymentMethod
) => {
  switch (method) {
    case "cash":
      return "نقدي";

    case "bank":
      return "تحويل بنكي";

    case "credit":
      return "آجل";

    default:
      return method;
  }
};

const getDefaultNature = (
  type: AccountType
): AccountNature => {
  if (
    type === "asset" ||
    type === "expense" ||
    type === "cogs"
  ) {
    return "debit";
  }

  return "credit";
};

/* =========================================================
   ACCOUNT CODE GENERATORS
========================================================= */

const generateChildAccountCode = (
  accounts: Account[],
  parentCode: string
) => {
  const children = accounts.filter(
    (account) =>
      account.parentCode === parentCode
  );

  let max = 0;

  for (const child of children) {
    const suffix = child.code.substring(
      parentCode.length
    );

    if (/^\d+$/.test(suffix)) {
      const number = Number(suffix);

      if (number > max) {
        max = number;
      }
    }
  }

  return `${parentCode}${String(
    max + 1
  ).padStart(2, "0")}`;
};

const generateEntityAccountCode = (
  accounts: Account[],
  parentCode: string
) => {
  const children = accounts.filter(
    (account) =>
      account.parentCode === parentCode
  );

  let max = 0;

  for (const child of children) {
    const suffix = child.code.substring(
      parentCode.length
    );

    if (/^\d+$/.test(suffix)) {
      const number = Number(suffix);

      if (number > max) {
        max = number;
      }
    }
  }

  return `${parentCode}${String(
    max + 1
  ).padStart(3, "0")}`;
};

/* =========================================================
   STORE INTERFACE
========================================================= */

interface ERPStore {
  accounts: Account[];

  addAccount: (
    data: AddAccountInput
  ) => Account;

  updateAccount: (
    id: string,
    data: UpdateAccountInput
  ) => void;

  deleteAccount: (
    id: string
  ) => void;

  getAccountById: (
    id: string
  ) => Account | undefined;

  getAccountByCode: (
    code: string
  ) => Account | undefined;

  getAccountsByParent: (
    parentId: string
  ) => Account[];

  getAccountsByType: (
    type: AccountType
  ) => Account[];

  getAccountForEntity: (
    entityType: AccountEntityType,
    entityId: string
  ) => Account | undefined;

  getAccountTree: () => AccountTreeNode[];

  searchAccounts: (
    query: string
  ) => Account[];

  generateAccountCode: (
    parentId?: string,
    entity?: boolean
  ) => string;

  clearAccounts: () => void;

  bankAccounts: BankAccount[];

  addBankAccount: (
    data: AddBankAccountInput
  ) => BankAccount;

  updateBankAccount: (
    id: string,
    data: Partial<BankAccount>
  ) => void;

  deleteBankAccount: (
    id: string
  ) => void;

  getBankAccountById: (
    id: string
  ) => BankAccount | undefined;

  clearBankAccounts: () => void;

  customers: Customer[];

  addCustomer: (
    data: AddCustomerInput
  ) => Customer;

  updateCustomer: (
    id: string,
    data: Partial<Customer>
  ) => void;

  deleteCustomer: (
    id: string
  ) => void;

  getCustomerById: (
    id: string
  ) => Customer | undefined;

  getCustomerByAccountCode: (
    accountCode: string
  ) => Customer | undefined;

  clearCustomers: () => void;

  suppliers: Supplier[];

  addSupplier: (
    data: AddSupplierInput
  ) => Supplier;

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

  clearSuppliers: () => void;

  products: Product[];

  addProduct: (
    data: AddProductInput
  ) => Product;

  updateProduct: (
    id: string,
    data: Partial<Product>
  ) => void;

  deleteProduct: (
    id: string
  ) => void;

  getProductById: (
    id: string
  ) => Product | undefined;

  getProductByCode: (
    code: string
  ) => Product | undefined;

  clearProducts: () => void;

  purchases: Purchase[];

  addPurchase: (
    data: AddPurchaseInput
  ) => Purchase;

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

  clearPurchases: () => void;

  sales: Sale[];

  addSale: (
    data: AddSaleInput
  ) => Sale;

  updateSale: (
    id: string,
    data: UpdateSaleInput
  ) => void;

  deleteSale: (
    id: string
  ) => void;

  getSaleById: (
    id: string
  ) => Sale | undefined;

  clearSales: () => void;

  getInventory: () => InventoryItem[];

  getInventoryItem: (
    productId: string
  ) => InventoryItem | undefined;

  getProductStock: (
    productId: string
  ) => number;

  getInventoryValue: () => number;

  journalEntries: JournalEntry[];

  addJournalEntry: (
    entry: Omit<
      JournalEntry,
      "id" | "createdAt"
    >
  ) => JournalEntry;

  updateJournalEntry: (
    id: string,
    data: Partial<JournalEntry>
  ) => void;

  deleteJournalEntry: (
    id: string
  ) => void;

  getJournalEntryById: (
    id: string
  ) => JournalEntry | undefined;

  getAccountBalance: (
    accountId: string
  ) => number;

  getAccountStatement: (
    accountId: string
  ) => JournalLine[];

  clearJournalEntries: () => void;

  clearAll: () => void;
}

/* =========================================================
   STORE
========================================================= */

export const useERPStore =
  create<ERPStore>()(
    persist(
      (set, get) => ({
        /* =====================================================
           ACCOUNTS
        ===================================================== */

        accounts: defaultAccounts,

        addAccount: (data) => {
          const state = get();

          const name = data.name.trim();

          if (!name) {
            throw new Error(
              "اسم الحساب مطلوب"
            );
          }

          let parent: Account | undefined;

          if (data.parentId) {
            parent = state.accounts.find(
              (account) =>
                account.id ===
                data.parentId
            );

            if (!parent) {
              throw new Error(
                "الحساب الأب غير موجود"
              );
            }

            if (!parent.isGroup) {
              throw new Error(
                "لا يمكن إضافة حساب تحت حساب تفصيلي"
              );
            }
          }

          const code =
            data.code?.trim() ||
            (parent
              ? generateChildAccountCode(
                  state.accounts,
                  parent.code
                )
              : data.type === "asset"
              ? "1"
              : data.type === "liability"
              ? "2"
              : data.type === "equity"
              ? "3"
              : data.type === "revenue"
              ? "4"
              : data.type === "cogs"
              ? "5"
              : "6");

          if (
            state.accounts.some(
              (account) =>
                account.code === code
            )
          ) {
            throw new Error(
              `كود الحساب ${code} مستخدم بالفعل`
            );
          }

          const accountType =
            parent?.type ?? data.type;

          const accountNature =
            parent?.nature ??
            data.nature ??
            getDefaultNature(
              accountType
            );

          const account: Account = {
            id: createId("account"),
            code,
            name,
            type: accountType,
            nature: accountNature,
            parentId: parent?.id,
            parentCode: parent?.code,
            level: parent
              ? parent.level + 1
              : 1,
            isGroup:
              data.isGroup ?? false,
            isActive: true,
            entityType:
              data.entityType,
            entityId:
              data.entityId,
            balance: 0,
            description:
              data.description,
            isSystem: false,
          };

          set((state) => ({
            accounts: [
              ...state.accounts,
              account,
            ],
          }));

          return account;
        },

        updateAccount: (
          id,
          data
        ) => {
          set((state) => ({
            accounts:
              state.accounts.map(
                (account) => {
                  if (
                    account.id !== id
                  ) {
                    return account;
                  }

                  return {
                    ...account,
                    name:
                      data.name !==
                      undefined
                        ? data.name.trim()
                        : account.name,
                    description:
                      data.description !==
                      undefined
                        ? data.description
                        : account.description,
                    isActive:
                      data.isActive !==
                      undefined
                        ? data.isActive
                        : account.isActive,
                  };
                }
              ),
          }));
        },

        deleteAccount: (id) => {
          set((state) => {
            const account =
              state.accounts.find(
                (item) =>
                  item.id === id
              );

            if (!account) {
              return state;
            }

            if (account.isSystem) {
              return state;
            }

            if (account.entityId) {
              return {
                ...state,
                accounts:
                  state.accounts.map(
                    (item) =>
                      item.id === id
                        ? {
                            ...item,
                            isActive: false,
                          }
                        : item
                  ),
              };
            }

            const hasChildren =
              state.accounts.some(
                (item) =>
                  item.parentId === id
              );

            if (hasChildren) {
              return {
                ...state,
                accounts:
                  state.accounts.map(
                    (item) =>
                      item.id === id
                        ? {
                            ...item,
                            isActive: false,
                          }
                        : item
                  ),
              };
            }

            return {
              ...state,
              accounts:
                state.accounts.filter(
                  (item) =>
                    item.id !== id
                ),
            };
          });
        },

        getAccountById: (id) =>
          get().accounts.find(
            (account) =>
              account.id === id
          ),

        getAccountByCode: (code) =>
          get().accounts.find(
            (account) =>
              account.code === code
          ),

        getAccountsByParent: (
          parentId
        ) =>
          get()
            .accounts.filter(
              (account) =>
                account.parentId ===
                  parentId &&
                account.isActive
            )
            .sort((a, b) =>
              a.code.localeCompare(
                b.code,
                undefined,
                {
                  numeric: true,
                }
              )
            ),

        getAccountsByType: (
          type
        ) =>
          get()
            .accounts.filter(
              (account) =>
                account.type ===
                  type &&
                account.isActive
            )
            .sort((a, b) =>
              a.code.localeCompare(
                b.code,
                undefined,
                {
                  numeric: true,
                }
              )
            ),

        getAccountForEntity: (
          entityType,
          entityId
        ) =>
          get().accounts.find(
            (account) =>
              account.entityType ===
                entityType &&
              account.entityId ===
                entityId
          ),

        getAccountTree: () => {
          const accounts =
            get().accounts.filter(
              (account) =>
                account.isActive
            );

          const buildTree = (
            parentId?: string
          ): AccountTreeNode[] =>
            accounts
              .filter(
                (account) =>
                  account.parentId ===
                  parentId
              )
              .sort((a, b) =>
                a.code.localeCompare(
                  b.code,
                  undefined,
                  {
                    numeric: true,
                  }
                )
              )
              .map((account) => ({
                ...account,
                children:
                  buildTree(
                    account.id
                  ),
              }));

          return buildTree();
        },

        searchAccounts: (
          query
        ) => {
          const value =
            query
              .trim()
              .toLowerCase();

          if (!value) {
            return get().accounts;
          }

          return get().accounts.filter(
            (account) =>
              account.code
                .toLowerCase()
                .includes(value) ||
              account.name
                .toLowerCase()
                .includes(value)
          );
        },

        generateAccountCode: (
          parentId,
          entity = false
        ) => {
          const accounts =
            get().accounts;

          if (!parentId) {
            const roots =
              accounts.filter(
                (account) =>
                  !account.parentId
              );

            let max = 0;

            roots.forEach(
              (account) => {
                const number =
                  Number(
                    account.code
                  );

                if (number > max) {
                  max = number;
                }
              }
            );

            return String(max + 1);
          }

          const parent =
            accounts.find(
              (account) =>
                account.id ===
                parentId
            );

          if (!parent) {
            throw new Error(
              "الحساب الأب غير موجود"
            );
          }

          return entity
            ? generateEntityAccountCode(
                accounts,
                parent.code
              )
            : generateChildAccountCode(
                accounts,
                parent.code
              );
        },

        clearAccounts: () => {
          set({
            accounts:
              defaultAccounts,
          });
        },

        /* =====================================================
           BANKS
        ===================================================== */

        bankAccounts: [
          {
            id: "bank-1001",
            code: "1001",
            name: "بنك التضامن",
            balance: 0,
            isActive: true,
          },
          {
            id: "bank-1002",
            code: "1002",
            name: "العامري للصرافة",
            balance: 0,
            isActive: true,
          },
          {
            id: "bank-1003",
            code: "1003",
            name: "العروي للصرافة",
            balance: 0,
            isActive: true,
          },
          {
            id: "bank-1004",
            code: "1004",
            name: "الفروي للصرافة",
            balance: 0,
            isActive: true,
          },
          {
            id: "bank-1005",
            code: "1005",
            name: "النجم للصرافة",
            balance: 0,
            isActive: true,
          },
        ],

        addBankAccount: (
          data
        ) => {
          const state = get();

          const id =
            createId("bank");

          const usedCodes =
            state.bankAccounts.map(
              (bank) =>
                Number(bank.code)
            );

          const nextCode =
            Math.max(
              1000,
              ...usedCodes
            ) + 1;

          const parent =
            state.accounts.find(
              (account) =>
                account.code ===
                "1102"
            );

          if (!parent) {
            throw new Error(
              "حساب البنوك والصرافات غير موجود"
            );
          }

          const accountCode =
            generateEntityAccountCode(
              state.accounts,
              "1102"
            );

          const accountId =
            createId("account");

          const bank: BankAccount = {
            id,
            code: String(
              nextCode
            ),
            name:
              data.name.trim(),
            phone: data.phone,
            address: data.address,
            notes: data.notes,
            balance:
              data.balance ?? 0,
            isActive: true,
            accountId,
            accountCode,
            accountName:
              data.name.trim(),
          };

          const account: Account = {
            id: accountId,
            code: accountCode,
            name:
              data.name.trim(),
            type: "asset",
            nature: "debit",
            parentId: parent.id,
            parentCode:
              parent.code,
            level:
              parent.level + 1,
            isGroup: false,
            isActive: true,
            entityType: "bank",
            entityId: id,
            balance:
              data.balance ?? 0,
            isSystem: false,
          };

          set({
            bankAccounts: [
              ...state.bankAccounts,
              bank,
            ],
            accounts: [
              ...state.accounts,
              account,
            ],
          });

          return bank;
        },

        updateBankAccount: (
          id,
          data
        ) => {
          set((state) => {
            const bank =
              state.bankAccounts.find(
                (item) =>
                  item.id === id
              );

            if (!bank) {
              return state;
            }

            const newName =
              data.name !==
              undefined
                ? data.name.trim()
                : bank.name;

            return {
              ...state,

              bankAccounts:
                state.bankAccounts.map(
                  (item) =>
                    item.id === id
                      ? {
                          ...item,
                          ...data,
                          name: newName,
                        }
                      : item
                ),

              accounts:
                state.accounts.map(
                  (account) =>
                    account.entityType ===
                      "bank" &&
                    account.entityId ===
                      id
                      ? {
                          ...account,
                          name: newName,
                          isActive:
                            data.isActive ??
                            account.isActive,
                        }
                      : account
                ),
            };
          });
        },

        deleteBankAccount: (
          id
        ) => {
          set((state) => ({
            bankAccounts:
              state.bankAccounts.filter(
                (bank) =>
                  bank.id !== id
              ),

            accounts:
              state.accounts.map(
                (account) =>
                  account.entityType ===
                    "bank" &&
                  account.entityId ===
                    id
                    ? {
                        ...account,
                        isActive: false,
                      }
                    : account
              ),
          }));
        },

        getBankAccountById: (
          id
        ) =>
          get().bankAccounts.find(
            (bank) =>
              bank.id === id
          ),

        clearBankAccounts: () => {
          set((state) => ({
            bankAccounts: [],
            accounts:
              state.accounts.filter(
                (account) =>
                  account.entityType !==
                    "bank" ||
                  account.isSystem
              ),
          }));
        },

        /* =====================================================
           CUSTOMERS
        ===================================================== */

        customers: [
          cashCustomer,
        ],

        addCustomer: (data) => {
          const state = get();

          const id =
            createId("customer");

          const parent =
            state.accounts.find(
              (account) =>
                account.code ===
                "1103"
            );

          if (!parent) {
            throw new Error(
              "حساب العملاء غير موجود"
            );
          }

          const accountCode =
            generateEntityAccountCode(
              state.accounts,
              "1103"
            );

          const accountId =
            createId("account");

          const customer: Customer = {
            id,
            name:
              data.name.trim(),
            phone: data.phone,
            address: data.address,
            balance:
              data.balance ?? 0,
            accountCode,
            accountName:
              data.name.trim(),
            accountId,
            notes: data.notes,
            isActive:
              data.isActive ?? true,
          };

          const account: Account = {
            id: accountId,
            code: accountCode,
            name:
              data.name.trim(),
            type: "asset",
            nature: "debit",
            parentId: parent.id,
            parentCode:
              parent.code,
            level:
              parent.level + 1,
            isGroup: false,
            isActive: true,
            entityType: "customer",
            entityId: id,
            balance:
              data.balance ?? 0,
            isSystem: false,
          };

          set({
            customers: [
              ...state.customers,
              customer,
            ],
            accounts: [
              ...state.accounts,
              account,
            ],
          });

          return customer;
        },

        updateCustomer: (
          id,
          data
        ) => {
          if (
            id ===
            CASH_CUSTOMER_ID
          ) {
            return;
          }

          set((state) => {
            const customer =
              state.customers.find(
                (item) =>
                  item.id === id
              );

            if (!customer) {
              return state;
            }

            const newName =
              data.name !==
              undefined
                ? data.name.trim()
                : customer.name;

            return {
              ...state,

              customers:
                state.customers.map(
                  (item) =>
                    item.id === id
                      ? {
                          ...item,
                          ...data,
                          name: newName,
                        }
                      : item
                ),

              accounts:
                state.accounts.map(
                  (account) =>
                    account.entityType ===
                      "customer" &&
                    account.entityId ===
                      id
                      ? {
                          ...account,
                          name: newName,
                          isActive:
                            data.isActive ??
                            account.isActive,
                        }
                      : account
                ),
            };
          });
        },

        deleteCustomer: (
          id
        ) => {
          if (
            id ===
            CASH_CUSTOMER_ID
          ) {
            return;
          }

          set((state) => ({
            customers:
              state.customers.filter(
                (customer) =>
                  customer.id !== id
              ),

            accounts:
              state.accounts.map(
                (account) =>
                  account.entityType ===
                    "customer" &&
                  account.entityId ===
                    id
                    ? {
                        ...account,
                        isActive: false,
                      }
                    : account
              ),
          }));
        },

        getCustomerById: (
          id
        ) =>
          get().customers.find(
            (customer) =>
              customer.id === id
          ),

        getCustomerByAccountCode: (
          accountCode
        ) =>
          get().customers.find(
            (customer) =>
              customer.accountCode ===
              accountCode
          ),

        clearCustomers: () => {
          set((state) => ({
            customers: [
              cashCustomer,
            ],

            accounts:
              state.accounts.filter(
                (account) =>
                  account.entityType !==
                    "customer" ||
                  account.entityId ===
                    CASH_CUSTOMER_ID
              ),
          }));
        },

        /* =====================================================
           SUPPLIERS
        ===================================================== */

        suppliers: [],

        addSupplier: (data) => {
          const state = get();

          const id =
            createId("supplier");

          const parent =
            state.accounts.find(
              (account) =>
                account.code ===
                "2101"
            );

          if (!parent) {
            throw new Error(
              "حساب الموردين غير موجود"
            );
          }

          const accountCode =
            generateEntityAccountCode(
              state.accounts,
              "2101"
            );

          const accountId =
            createId("account");

          const supplier: Supplier = {
            id,
            name:
              data.name.trim(),
            phone: data.phone,
            address: data.address,
            balance:
              data.balance ?? 0,
            accountCode,
            accountName:
              data.name.trim(),
            accountId,
            notes: data.notes,
            isActive:
              data.isActive ?? true,
          };

          const account: Account = {
            id: accountId,
            code: accountCode,
            name:
              data.name.trim(),
            type: "liability",
            nature: "credit",
            parentId: parent.id,
            parentCode:
              parent.code,
            level:
              parent.level + 1,
            isGroup: false,
            isActive: true,
            entityType: "supplier",
            entityId: id,
            balance:
              data.balance ?? 0,
            isSystem: false,
          };

          set({
            suppliers: [
              ...state.suppliers,
              supplier,
            ],
            accounts: [
              ...state.accounts,
              account,
            ],
          });

          return supplier;
        },

        updateSupplier: (
          id,
          data
        ) => {
          set((state) => {
            const supplier =
              state.suppliers.find(
                (item) =>
                  item.id === id
              );

            if (!supplier) {
              return state;
            }

            const newName =
              data.name !==
              undefined
                ? data.name.trim()
                : supplier.name;

            return {
              ...state,

              suppliers:
                state.suppliers.map(
                  (item) =>
                    item.id === id
                      ? {
                          ...item,
                          ...data,
                          name: newName,
                        }
                      : item
                ),

              accounts:
                state.accounts.map(
                  (account) =>
                    account.entityType ===
                      "supplier" &&
                    account.entityId ===
                      id
                      ? {
                          ...account,
                          name: newName,
                          isActive:
                            data.isActive ??
                            account.isActive,
                        }
                      : account
                ),
            };
          });
        },

        deleteSupplier: (
          id
        ) => {
          set((state) => ({
            suppliers:
              state.suppliers.filter(
                (supplier) =>
                  supplier.id !== id
              ),

            accounts:
              state.accounts.map(
                (account) =>
                  account.entityType ===
                    "supplier" &&
                  account.entityId ===
                    id
                    ? {
                        ...account,
                        isActive: false,
                      }
                    : account
              ),
          }));
        },

        getSupplierById: (
          id
        ) =>
          get().suppliers.find(
            (supplier) =>
              supplier.id === id
          ),

        getSupplierByAccountCode: (
          accountCode
        ) =>
          get().suppliers.find(
            (supplier) =>
              supplier.accountCode ===
              accountCode
          ),

        clearSuppliers: () => {
          set((state) => ({
            suppliers: [],

            accounts:
              state.accounts.filter(
                (account) =>
                  account.entityType !==
                  "supplier"
              ),
          }));
        },

        /* =====================================================
           PRODUCTS
        ===================================================== */

        products: [],

        addProduct: (data) => {
          const state = get();

          const usedCodes =
            state.products.map(
              (product) =>
                Number(product.code)
            );

          const nextCode =
            Math.max(
              1000,
              ...usedCodes
            ) + 1;

          const product: Product = {
            id: createId("product"),
            code: String(
              nextCode
            ),
            name:
              data.name.trim(),
            unit: data.unit,
            category:
              data.category,
            description:
              data.description,
            isActive:
              data.isActive ?? true,
          };

          set((state) => ({
            products: [
              ...state.products,
              product,
            ],
          }));

          return product;
        },

        updateProduct: (
          id,
          data
        ) => {
          set((state) => ({
            products:
              state.products.map(
                (product) =>
                  product.id === id
                    ? {
                        ...product,
                        ...data,
                      }
                    : product
              ),
          }));
        },

        deleteProduct: (
          id
        ) => {
          set((state) => ({
            products:
              state.products.filter(
                (product) =>
                  product.id !== id
              ),
          }));
        },

        getProductById: (
          id
        ) =>
          get().products.find(
            (product) =>
              product.id === id
          ),

        getProductByCode: (
          code
        ) =>
          get().products.find(
            (product) =>
              product.code === code
          ),

        clearProducts: () => {
          set({
            products: [],
          });
        },

        /* =====================================================
           PURCHASES
        ===================================================== */

        purchases: [],

        addPurchase: (data) => {
          const state = get();

          if (!data.items.length) {
            throw new Error(
              "يجب إضافة صنف واحد على الأقل إلى الفاتورة"
            );
          }

          const supplier =
            state.suppliers.find(
              (item) =>
                item.id ===
                data.supplierId
            );

          if (
            data.paymentMethod ===
            "credit"
          ) {
            if (!supplier) {
              throw new Error(
                "المورد غير موجود"
              );
            }

            if (
              !supplier.accountId ||
              !supplier.accountCode
            ) {
              throw new Error(
                "المورد لا يملك حسابًا محاسبيًا مرتبطًا"
              );
            }
          }

          for (const item of data.items) {
            validatePurchaseItem(
              state,
              item
            );
          }

          const purchase: Purchase = {
            id: createId("purchase"),

            invoiceNumber:
              data.invoiceNumber ||
              `PUR-${
                state.purchases.length +
                1001
              }`,

            date: data.date,

            supplier:
              supplier?.name ||
              data.supplier,

            supplierId:
              data.supplierId,

            accountCode:
              supplier?.accountCode,

            accountName:
              supplier?.accountName,

            itemCount:
              data.items.length,

            items: data.items,

            subtotal:
              Number(
                data.subtotal || 0
              ),

            discount:
              Number(
                data.discount || 0
              ),

            tax:
              Number(
                data.tax || 0
              ),

            taxRate:
              Number(
                data.taxRate || 0
              ),

            total:
              Number(
                data.total || 0
              ),

            paymentMethod:
              data.paymentMethod,

            paymentMethodName:
              data.paymentMethodName ||
              formatPaymentMethod(
                data.paymentMethod
              ),

            status:
              data.status ?? "paid",

            notes: data.notes,

            createdAt:
              new Date().toISOString(),
          };

          const shouldPostJournal =
            purchase.status !==
            "cancelled";

          let paymentAccount:
            | Account
            | undefined;

          if (
            purchase.paymentMethod ===
            "cash"
          ) {
            paymentAccount =
              state.accounts.find(
                (account) =>
                  account.code ===
                  CASH_ACCOUNT_CODE
              );
          }

          if (
            purchase.paymentMethod ===
            "bank"
          ) {
            if (
              data.accountCode
            ) {
              paymentAccount =
                state.accounts.find(
                  (account) =>
                    account.code ===
                    data.accountCode
                );
            }

            if (!paymentAccount) {
              const firstBank =
                state.bankAccounts.find(
                  (bank) =>
                    bank.isActive !==
                      false &&
                    bank.accountCode
                );

              if (
                firstBank?.accountCode
              ) {
                paymentAccount =
                  state.accounts.find(
                    (account) =>
                      account.code ===
                      firstBank.accountCode
                  );
              }
            }
          }

          if (
            shouldPostJournal &&
            purchase.paymentMethod !==
              "credit" &&
            !paymentAccount
          ) {
            throw new Error(
              purchase.paymentMethod ===
                "bank"
                ? "لم يتم العثور على الحساب البنكي المستخدم في عملية الشراء"
                : "حساب الصندوق غير موجود"
            );
          }

          if (
            shouldPostJournal &&
            purchase.paymentMethod ===
              "credit" &&
            !supplier?.accountId
          ) {
            throw new Error(
              "حساب المورد غير موجود"
            );
          }

          const journalEntry =
            shouldPostJournal
              ? buildPurchaseJournalEntry(
                  purchase,
                  state.accounts,
                  supplier,
                  paymentAccount,
                  state.journalEntries
                )
              : undefined;

          set((state) => ({
            purchases: [
              ...state.purchases,
              purchase,
            ],

            journalEntries:
              journalEntry
                ? [
                    ...state.journalEntries,
                    journalEntry,
                  ]
                : state.journalEntries,
          }));

          return purchase;
        },

        updatePurchase: (
          id,
          data
        ) => {
          const state = get();

          const oldPurchase =
            state.purchases.find(
              (purchase) =>
                purchase.id === id
            );

          if (!oldPurchase) {
            return;
          }

          const updatedPurchase: Purchase =
            {
              ...oldPurchase,
              ...data,
              items:
                data.items ??
                oldPurchase.items,
            };

          if (
            !updatedPurchase.items.length
          ) {
            throw new Error(
              "يجب أن تحتوي الفاتورة على صنف واحد على الأقل"
            );
          }

          for (const item of updatedPurchase.items) {
            validatePurchaseItem(
              state,
              item
            );
          }

          const supplier =
            state.suppliers.find(
              (item) =>
                item.id ===
                updatedPurchase.supplierId
            );

          let paymentAccount:
            | Account
            | undefined;

          if (
            updatedPurchase.paymentMethod ===
            "cash"
          ) {
            paymentAccount =
              state.accounts.find(
                (account) =>
                  account.code ===
                  CASH_ACCOUNT_CODE
              );
          }

          if (
            updatedPurchase.paymentMethod ===
            "bank"
          ) {
            if (
              updatedPurchase.accountCode
            ) {
              paymentAccount =
                state.accounts.find(
                  (account) =>
                    account.code ===
                    updatedPurchase.accountCode
                );
            }

            if (!paymentAccount) {
              const firstBank =
                state.bankAccounts.find(
                  (bank) =>
                    bank.isActive !==
                      false &&
                    bank.accountCode
                );

              if (
                firstBank?.accountCode
              ) {
                paymentAccount =
                  state.accounts.find(
                    (account) =>
                      account.code ===
                      firstBank.accountCode
                  );
              }
            }
          }

          const shouldPostJournal =
            updatedPurchase.status !==
            "cancelled";

          if (
            shouldPostJournal &&
            updatedPurchase.paymentMethod ===
              "credit" &&
            !supplier?.accountId
          ) {
            throw new Error(
              "المورد لا يملك حسابًا محاسبيًا مرتبطًا"
            );
          }

          if (
            shouldPostJournal &&
            updatedPurchase.paymentMethod !==
              "credit" &&
            !paymentAccount
          ) {
            throw new Error(
              "حساب الدفع غير موجود"
            );
          }

          const remainingEntries =
            state.journalEntries.filter(
              (entry) =>
                !(
                  entry.referenceType ===
                    "purchase" &&
                  entry.referenceId ===
                    id
                )
            );

          const newJournal =
            shouldPostJournal
              ? buildPurchaseJournalEntry(
                  updatedPurchase,
                  state.accounts,
                  supplier,
                  paymentAccount,
                  remainingEntries
                )
              : undefined;

          set((state) => ({
            purchases:
              state.purchases.map(
                (purchase) =>
                  purchase.id === id
                    ? updatedPurchase
                    : purchase
              ),

            journalEntries: [
              ...remainingEntries,
              ...(newJournal
                ? [newJournal]
                : []),
            ],
          }));
        },

        deletePurchase: (
          id
        ) => {
          set((state) => ({
            purchases:
              state.purchases.filter(
                (purchase) =>
                  purchase.id !== id
              ),

            journalEntries:
              state.journalEntries.filter(
                (entry) =>
                  !(
                    entry.referenceType ===
                      "purchase" &&
                    entry.referenceId ===
                      id
                  )
              ),
          }));
        },

        getPurchaseById: (
          id
        ) =>
          get().purchases.find(
            (purchase) =>
              purchase.id === id
          ),

        clearPurchases: () => {
          set((state) => ({
            purchases: [],

            journalEntries:
              state.journalEntries.filter(
                (entry) =>
                  entry.referenceType !==
                  "purchase"
              ),
          }));
        },

        /* =====================================================
           SALES
        ===================================================== */

        sales: [],

        addSale: (data) => {
          const state = get();

          if (!data.items.length) {
            throw new Error(
              "يجب إضافة صنف واحد على الأقل إلى الفاتورة"
            );
          }

          const requestedByProduct =
            new Map<
              string,
              number
            >();

          for (const item of data.items) {
            if (!item.productId) {
              throw new Error(
                `الصنف ${item.item} غير مرتبط بمنتج`
              );
            }

            const quantity =
              Number(
                item.quantity || 0
              );

            if (quantity <= 0) {
              throw new Error(
                `كمية الصنف ${item.item} يجب أن تكون أكبر من صفر`
              );
            }

            requestedByProduct.set(
              item.productId,
              (requestedByProduct.get(
                item.productId
              ) ?? 0) + quantity
            );
          }

          const saleStatus =
            data.status ?? "paid";

          if (
            saleStatus !==
            "cancelled"
          ) {
            for (const [
              productId,
              requestedQuantity,
            ] of requestedByProduct) {
              const product =
                state.products.find(
                  (item) =>
                    item.id ===
                    productId
                );

              if (!product) {
                throw new Error(
                  "المنتج المطلوب بيعه غير موجود"
                );
              }

              const available =
                calculateProductStock(
                  state,
                  productId
                );

              if (
                requestedQuantity >
                available
              ) {
                throw new Error(
                  `المخزون غير كافٍ للمنتج: ${product.name} — المتاح: ${available} ${product.unit || ""}، المطلوب: ${requestedQuantity} ${product.unit || ""}`
                );
              }
            }
          }

          const customer =
            state.customers.find(
              (item) =>
                item.id ===
                data.customerId
            );

          if (
            data.paymentMethod ===
            "credit"
          ) {
            if (!customer) {
              throw new Error(
                "يجب اختيار العميل عند البيع الآجل"
              );
            }

            if (
              !customer.accountId ||
              !customer.accountCode
            ) {
              throw new Error(
                "العميل لا يملك حسابًا محاسبيًا مرتبطًا"
              );
            }
          }

          let paymentAccount:
            | Account
            | undefined;

          if (
            data.paymentMethod ===
            "cash"
          ) {
            paymentAccount =
              state.accounts.find(
                (account) =>
                  account.code ===
                  CASH_ACCOUNT_CODE
              );
          }

          if (
            data.paymentMethod ===
            "bank"
          ) {
            if (
              data.accountCode
            ) {
              paymentAccount =
                state.accounts.find(
                  (account) =>
                    account.code ===
                    data.accountCode
                );
            }

            if (!paymentAccount) {
              const bank =
                state.bankAccounts.find(
                  (item) =>
                    item.accountCode ===
                    data.accountCode
                );

              if (
                bank?.accountCode
              ) {
                paymentAccount =
                  state.accounts.find(
                    (account) =>
                      account.code ===
                      bank.accountCode
                  );
              }
            }

            if (!paymentAccount) {
              const firstBank =
                state.bankAccounts.find(
                  (bank) =>
                    bank.isActive !==
                      false &&
                    bank.accountCode
                );

              if (
                firstBank?.accountCode
              ) {
                paymentAccount =
                  state.accounts.find(
                    (account) =>
                      account.code ===
                      firstBank.accountCode
                  );
              }
            }
          }

          if (
            saleStatus !==
              "cancelled" &&
            data.paymentMethod !==
              "credit" &&
            !paymentAccount
          ) {
            throw new Error(
              data.paymentMethod ===
                "bank"
                ? "لم يتم العثور على الحساب البنكي المستخدم في البيع"
                : "حساب الصندوق غير موجود"
            );
          }

          const sale: Sale = {
            id: createId("sale"),

            invoiceNumber:
              data.invoiceNumber ||
              `INV-${
                state.sales.length +
                1001
              }`,

            date: data.date,

            customerId:
              data.customerId,

            customerName:
              customer?.name ||
              data.customerName,

            paymentMethod:
              data.paymentMethod,

            accountCode:
              data.accountCode ||
              customer?.accountCode,

            accountName:
              data.accountName ||
              customer?.accountName,

            items: data.items,

            subtotal:
              Number(
                data.subtotal || 0
              ),

            discount:
              Number(
                data.discount || 0
              ),

            totalQuantity:
              data.totalQuantity ??
              data.items.reduce(
                (sum, item) =>
                  sum +
                  Number(
                    item.quantity || 0
                  ),
                0
              ),

            total:
              Number(
                data.total || 0
              ),

            status:
              saleStatus,

            notes: data.notes,

            createdAt:
              new Date().toISOString(),
          };

          const journalEntry =
            sale.status !==
            "cancelled"
              ? buildSaleJournalEntry(
                  sale,
                  state,
                  customer,
                  paymentAccount,
                  state.journalEntries
                )
              : undefined;

          set((state) => ({
            sales: [
              ...state.sales,
              sale,
            ],

            journalEntries:
              journalEntry
                ? [
                    ...state.journalEntries,
                    journalEntry,
                  ]
                : state.journalEntries,
          }));

          return sale;
        },

        updateSale: (
          id,
          data
        ) => {
          const state = get();

          const oldSale =
            state.sales.find(
              (sale) =>
                sale.id === id
            );

          if (!oldSale) {
            return;
          }

          const updatedSale: Sale =
            {
              ...oldSale,
              ...data,
              items:
                data.items ??
                oldSale.items,
            };

          if (
            !updatedSale.items.length
          ) {
            throw new Error(
              "يجب أن تحتوي الفاتورة على صنف واحد على الأقل"
            );
          }

          if (
            updatedSale.status !==
            "cancelled"
          ) {
            const requestedByProduct =
              new Map<
                string,
                number
              >();

            for (const item of updatedSale.items) {
              if (!item.productId) {
                throw new Error(
                  `الصنف ${item.item} غير مرتبط بمنتج`
                );
              }

              const quantity =
                Number(
                  item.quantity || 0
                );

              if (quantity <= 0) {
                throw new Error(
                  `كمية الصنف ${item.item} يجب أن تكون أكبر من صفر`
                );
              }

              requestedByProduct.set(
                item.productId,
                (requestedByProduct.get(
                  item.productId
                ) ?? 0) + quantity
              );
            }

            for (const [
              productId,
              requestedQuantity,
            ] of requestedByProduct) {
              const product =
                state.products.find(
                  (item) =>
                    item.id ===
                    productId
                );

              if (!product) {
                throw new Error(
                  "المنتج غير موجود"
                );
              }

              let available =
                calculateProductStock(
                  state,
                  productId
                );

              if (
                oldSale.status !==
                "cancelled"
              ) {
                available +=
                  oldSale.items
                    .filter(
                      (item) =>
                        item.productId ===
                        productId
                    )
                    .reduce(
                      (
                        sum,
                        item
                      ) =>
                        sum +
                        Number(
                          item.quantity ||
                            0
                        ),
                      0
                    );
              }

              if (
                requestedQuantity >
                available
              ) {
                throw new Error(
                  `المخزون غير كافٍ للمنتج: ${product.name} — المتاح: ${available}، المطلوب: ${requestedQuantity}`
                );
              }
            }
          }

          const customer =
            state.customers.find(
              (item) =>
                item.id ===
                updatedSale.customerId
            );

          if (
            updatedSale.paymentMethod ===
            "credit"
          ) {
            if (!customer) {
              throw new Error(
                "يجب اختيار العميل عند البيع الآجل"
              );
            }

            if (
              !customer.accountId ||
              !customer.accountCode
            ) {
              throw new Error(
                "العميل لا يملك حسابًا محاسبيًا مرتبطًا"
              );
            }
          }

          let paymentAccount:
            | Account
            | undefined;

          if (
            updatedSale.paymentMethod ===
            "cash"
          ) {
            paymentAccount =
              state.accounts.find(
                (account) =>
                  account.code ===
                  CASH_ACCOUNT_CODE
              );
          }

          if (
            updatedSale.paymentMethod ===
            "bank"
          ) {
            if (
              updatedSale.accountCode
            ) {
              paymentAccount =
                state.accounts.find(
                  (account) =>
                    account.code ===
                    updatedSale.accountCode
                );
            }

            if (!paymentAccount) {
              const bank =
                state.bankAccounts.find(
                  (item) =>
                    item.accountCode ===
                    updatedSale.accountCode
                );

              if (
                bank?.accountCode
              ) {
                paymentAccount =
                  state.accounts.find(
                    (account) =>
                      account.code ===
                      bank.accountCode
                  );
              }
            }

            if (!paymentAccount) {
              const firstBank =
                state.bankAccounts.find(
                  (bank) =>
                    bank.isActive !==
                      false &&
                    bank.accountCode
                );

              if (
                firstBank?.accountCode
              ) {
                paymentAccount =
                  state.accounts.find(
                    (account) =>
                      account.code ===
                      firstBank.accountCode
                  );
              }
            }
          }

          if (
            updatedSale.status !==
              "cancelled" &&
            updatedSale.paymentMethod !==
              "credit" &&
            !paymentAccount
          ) {
            throw new Error(
              "حساب الدفع غير موجود"
            );
          }

          const remainingEntries =
            state.journalEntries.filter(
              (entry) =>
                !(
                  entry.referenceType ===
                    "sale" &&
                  entry.referenceId ===
                    id
                )
            );

          const newJournal =
            updatedSale.status !==
            "cancelled"
              ? buildSaleJournalEntry(
                  updatedSale,
                  state,
                  customer,
                  paymentAccount,
                  remainingEntries
                )
              : undefined;

          set((state) => ({
            sales:
              state.sales.map(
                (sale) =>
                  sale.id === id
                    ? updatedSale
                    : sale
              ),

            journalEntries: [
              ...remainingEntries,
              ...(newJournal
                ? [newJournal]
                : []),
            ],
          }));
        },

        deleteSale: (
          id
        ) => {
          set((state) => ({
            sales:
              state.sales.filter(
                (sale) =>
                  sale.id !== id
              ),

            journalEntries:
              state.journalEntries.filter(
                (entry) =>
                  !(
                    entry.referenceType ===
                      "sale" &&
                    entry.referenceId ===
                      id
                  )
              ),
          }));
        },

        getSaleById: (
          id
        ) =>
          get().sales.find(
            (sale) =>
              sale.id === id
          ),

        clearSales: () => {
          set((state) => ({
            sales: [],

            journalEntries:
              state.journalEntries.filter(
                (entry) =>
                  entry.referenceType !==
                  "sale"
              ),
          }));
        },

        /* =====================================================
           INVENTORY
        ===================================================== */

        getInventory: () => {
          const state = get();

          return state.products.map(
            (product) => {
              let purchaseQuantity =
                0;

              let purchaseValue =
                0;

              let saleQuantity =
                0;

              for (const purchase of state.purchases) {
                if (
                  purchase.status ===
                  "cancelled"
                ) {
                  continue;
                }

                for (const item of purchase.items) {
                  if (
                    item.productId !==
                    product.id
                  ) {
                    continue;
                  }

                  const quantity =
                    Number(
                      item.quantity || 0
                    );

                  const itemValue =
                    getPurchaseItemInventoryValue(
                      item
                    );

                  purchaseQuantity +=
                    quantity;

                  purchaseValue +=
                    itemValue;
                }
              }

              for (const sale of state.sales) {
                if (
                  sale.status ===
                  "cancelled"
                ) {
                  continue;
                }

                for (const item of sale.items) {
                  if (
                    item.productId ===
                    product.id
                  ) {
                    saleQuantity +=
                      Number(
                        item.quantity ||
                          0
                      );
                  }
                }
              }

              const quantity =
                purchaseQuantity -
                saleQuantity;

              const averagePurchasePrice =
                purchaseQuantity > 0
                  ? purchaseValue /
                    purchaseQuantity
                  : 0;

              const inventoryValue =
                Math.max(
                  0,
                  quantity
                ) *
                averagePurchasePrice;

              return {
                productId:
                  product.id,

                productCode:
                  product.code,

                productName:
                  product.name,

                unit:
                  product.unit || "",

                purchaseQuantity,

                saleQuantity,

                quantity,

                averagePurchasePrice,

                inventoryValue,
              };
            }
          );
        },

        getInventoryItem: (
          productId
        ) =>
          get()
            .getInventory()
            .find(
              (item) =>
                item.productId ===
                productId
            ),

        getProductStock: (
          productId
        ) =>
          calculateProductStock(
            get(),
            productId
          ),

        getInventoryValue: () =>
          get()
            .getInventory()
            .reduce(
              (sum, item) =>
                sum +
                item.inventoryValue,
              0
            ),

        /* =====================================================
           JOURNAL
        ===================================================== */

        journalEntries: [],

        addJournalEntry: (
          data
        ) => {
          const state = get();

          const entry: JournalEntry =
            {
              ...data,

              entryNumber:
                data.entryNumber ||
                generateJournalEntryNumber(
                  state.journalEntries
                ),

              id: createId(
                "journal"
              ),

              createdAt:
                new Date().toISOString(),
            };

          set((state) => ({
            journalEntries: [
              ...state.journalEntries,
              entry,
            ],
          }));

          return entry;
        },

        updateJournalEntry: (
          id,
          data
        ) => {
          set((state) => ({
            journalEntries:
              state.journalEntries.map(
                (entry) =>
                  entry.id === id
                    ? {
                        ...entry,
                        ...data,
                      }
                    : entry
              ),
          }));
        },

        deleteJournalEntry: (
          id
        ) => {
          set((state) => ({
            journalEntries:
              state.journalEntries.filter(
                (entry) =>
                  entry.id !== id
              ),
          }));
        },

        getJournalEntryById: (
          id
        ) =>
          get().journalEntries.find(
            (entry) =>
              entry.id === id
          ),

        getAccountBalance: (
          accountId
        ) => {
          const state = get();

          const account =
            state.accounts.find(
              (item) =>
                item.id === accountId
            );

          if (!account) {
            return 0;
          }

          const lines =
            state.journalEntries.flatMap(
              (entry) =>
                entry.lines
            );

          return lines
            .filter(
              (line) =>
                line.accountId ===
                accountId
            )
            .reduce(
              (sum, line) => {
                if (
                  account.nature ===
                  "debit"
                ) {
                  return (
                    sum +
                    Number(
                      line.debit || 0
                    ) -
                    Number(
                      line.credit || 0
                    )
                  );
                }

                return (
                  sum +
                  Number(
                    line.credit || 0
                  ) -
                  Number(
                    line.debit || 0
                  )
                );
              },
              0
            );
        },

        getAccountStatement: (
          accountId
        ) =>
          get()
            .journalEntries
            .flatMap(
              (entry) =>
                entry.lines
            )
            .filter(
              (line) =>
                line.accountId ===
                accountId
            ),

        clearJournalEntries: () => {
          set({
            journalEntries: [],
          });
        },

        /* =====================================================
           CLEAR ALL
        ===================================================== */

        clearAll: () => {
          set({
            accounts:
              defaultAccounts,

            bankAccounts: [],

            customers: [
              cashCustomer,
            ],

            suppliers: [],

            products: [],

            purchases: [],

            sales: [],

            journalEntries: [],
          });
        },
      }),

      {
        name: "erp-storage",

        version: 2,

       merge: (
  persistedState,
  currentState
): ERPStore => {
  const persisted =
    persistedState as
      | Partial<ERPStore>
      | undefined;

  /*
   * تصحيح الحسابات المحفوظة في localStorage
   */
  let persistedAccounts: Account[] =
    persisted?.accounts &&
    persisted.accounts.length > 0
      ? persisted.accounts.map(
          (account): Account =>
            account.code ===
            INVENTORY_ACCOUNT_CODE
              ? {
                  ...account,

                  name:
                    INVENTORY_ACCOUNT_NAME,

                  type: "asset",

                  nature: "debit",

                  parentId:
                    "account-current-assets",

                  parentCode: "11",

                  level: 3,

                  isGroup: false,

                  isActive: true,

                  entityType:
                    "inventory",

                  isSystem: true,
                }
              : account
        )
      : [...defaultAccounts];

  /*
   * التأكد من وجود حساب ضريبة
   * القيمة المضافة - مدخلات 1105
   */
  const hasInputVat =
    persistedAccounts.some(
      (account) =>
        account.code ===
        INPUT_VAT_ACCOUNT_CODE
    );

  if (!hasInputVat) {
    persistedAccounts.push({
      id: "account-input-vat",

      code: INPUT_VAT_ACCOUNT_CODE,

      name: INPUT_VAT_ACCOUNT_NAME,

      type: "asset",

      nature: "debit",

      parentId:
        "account-current-assets",

      parentCode: "11",

      level: 3,

      isGroup: false,

      isActive: true,

      balance: 0,

      isSystem: true,

      entityType: "other",
    });
  }

  /*
   * التأكد من أن 1104 موجود كحساب مخزون
   */
  const inventoryIndex =
    persistedAccounts.findIndex(
      (account) =>
        account.code ===
        INVENTORY_ACCOUNT_CODE
    );

  if (inventoryIndex === -1) {
    persistedAccounts.push({
      id: "account-inventory",

      code: INVENTORY_ACCOUNT_CODE,

      name: INVENTORY_ACCOUNT_NAME,

      type: "asset",

      nature: "debit",

      parentId:
        "account-current-assets",

      parentCode: "11",

      level: 3,

      isGroup: false,

      isActive: true,

      balance: 0,

      isSystem: true,

      entityType: "inventory",
    });
  }

  return {
    ...currentState,

    ...persisted,

    accounts: persistedAccounts,

    customers:
      persisted?.customers &&
      persisted.customers.length > 0
        ? persisted.customers
        : [cashCustomer],

    bankAccounts:
      persisted?.bankAccounts ??
      currentState.bankAccounts,

    suppliers:
      persisted?.suppliers ??
      currentState.suppliers,

    products:
      persisted?.products ??
      currentState.products,

    purchases:
      persisted?.purchases ??
      currentState.purchases,

    sales:
      persisted?.sales ??
      currentState.sales,

    journalEntries:
      persisted?.journalEntries ??
      currentState.journalEntries,
  };
},
      }
    )
  );

/* =========================================================
   VALIDATE PURCHASE ITEM
========================================================= */

function validatePurchaseItem(
  state: Pick<
    ERPStore,
    "products"
  >,
  item: PurchaseItem
) {
  if (!item.productId) {
    throw new Error(
      `الصنف ${item.name || item.productName || ""} غير مرتبط بمنتج`
    );
  }

  const product =
    state.products.find(
      (p) =>
        p.id === item.productId
    );

  if (!product) {
    throw new Error(
      `المنتج غير موجود: ${
        item.productName ||
        item.name ||
        item.productId
      }`
    );
  }

  if (
    Number(item.quantity || 0) <=
    0
  ) {
    throw new Error(
      `كمية المنتج ${product.name} يجب أن تكون أكبر من صفر`
    );
  }

  if (
    Number(item.price || 0) < 0
  ) {
    throw new Error(
      `سعر شراء المنتج ${product.name} لا يمكن أن يكون سالبًا`
    );
  }
}

/* =========================================================
   INVENTORY VALUE OF PURCHASE ITEM
========================================================= */

/**
 * قيمة الصنف التي تدخل إلى المخزون.
 *
 * مهم جدًا:
 *
 * item.total يجب أن يمثل قيمة الصنف بعد الخصم
 * وقبل ضريبة القيمة المضافة.
 *
 * ضريبة الشراء لا تدخل في تكلفة المخزون.
 */
function getPurchaseItemInventoryValue(
  item: PurchaseItem
) {
  const quantity =
    Number(
      item.quantity || 0
    );

  const total =
    Number(item.total);

  if (
    Number.isFinite(total) &&
    total >= 0
  ) {
    return total;
  }

  const gross =
    quantity *
    Number(
      item.price || 0
    );

  return Math.max(
    0,
    gross -
      Number(
        item.discount || 0
      )
  );
}

/* =========================================================
   INVENTORY CALCULATOR
========================================================= */

function calculateProductStock(
  state: Pick<
    ERPStore,
    "products" | "purchases" | "sales"
  >,
  productId: string
) {
  let purchaseQuantity = 0;
  let saleQuantity = 0;

  for (const purchase of state.purchases) {
    if (
      purchase.status ===
      "cancelled"
    ) {
      continue;
    }

    for (const item of purchase.items) {
      if (
        item.productId ===
        productId
      ) {
        purchaseQuantity +=
          Number(
            item.quantity || 0
          );
      }
    }
  }

  for (const sale of state.sales) {
    if (
      sale.status ===
      "cancelled"
    ) {
      continue;
    }

    for (const item of sale.items) {
      if (
        item.productId ===
        productId
      ) {
        saleQuantity +=
          Number(
            item.quantity || 0
          );
      }
    }
  }

  return (
    purchaseQuantity -
    saleQuantity
  );
}

/* =========================================================
   JOURNAL HELPERS
========================================================= */

function findAccountByCode(
  accounts: Account[],
  code: string
) {
  return accounts.find(
    (account) =>
      account.code === code
  );
}

function generateJournalEntryNumber(
  journalEntries: JournalEntry[]
) {
  let max = 1000;

  for (const entry of journalEntries) {
    const match =
      entry.entryNumber.match(
        /(\d+)$/
      );

    if (match) {
      const number = Number(
        match[1]
      );

      if (number > max) {
        max = number;
      }
    }
  }

  return `JE-${max + 1}`;
}

/* =========================================================
   REVENUE ACCOUNT
========================================================= */

function getRevenueAccountCode(
  product?: Product
) {
  const text =
    `${product?.category || ""} ${
      product?.name || ""
    }`.toLowerCase();

  if (
    text.includes("زيت") ||
    text.includes("زيوت")
  ) {
    return "4102";
  }

  if (
    text.includes("عمرة") ||
    text.includes("عمره") ||
    text.includes("خدمة") ||
    text.includes("خدمات")
  ) {
    return "4103";
  }

  return "4101";
}

/* =========================================================
   COGS ACCOUNT
========================================================= */

function getCogsAccountCode(
  product?: Product
) {
  const text =
    `${product?.category || ""} ${
      product?.name || ""
    }`.toLowerCase();

  if (
    text.includes("زيت") ||
    text.includes("زيوت")
  ) {
    return "5102";
  }

  return "5101";
}

/* =========================================================
   AVERAGE COST
========================================================= */

function calculateAveragePurchaseCost(
  state: Pick<
    ERPStore,
    "products" | "purchases" | "sales"
  >,
  productId: string
) {
  let purchaseQuantity = 0;
  let purchaseValue = 0;

  for (const purchase of state.purchases) {
    if (
      purchase.status ===
      "cancelled"
    ) {
      continue;
    }

    for (const item of purchase.items) {
      if (
        item.productId !==
        productId
      ) {
        continue;
      }

      const quantity =
        Number(
          item.quantity || 0
        );

      const value =
        getPurchaseItemInventoryValue(
          item
        );

      purchaseQuantity +=
        quantity;

      purchaseValue +=
        value;
    }
  }

  if (
    purchaseQuantity <= 0
  ) {
    return 0;
  }

  return (
    purchaseValue /
    purchaseQuantity
  );
}

/* =========================================================
   ITEM COST
========================================================= */

function calculateItemCost(
  state: Pick<
    ERPStore,
    "products" | "purchases" | "sales"
  >,
  productId: string,
  quantity: number
) {
  const averageCost =
    calculateAveragePurchaseCost(
      state,
      productId
    );

  return (
    Math.max(
      0,
      quantity
    ) * averageCost
  );
}

/* =========================================================
   PURCHASE JOURNAL
========================================================= */

/**
 * القيد الصحيح للشراء:
 *
 * مثال:
 *
 * البضاعة       1,000
 * الضريبة         150
 * الإجمالي      1,150
 *
 * القيد:
 *
 * 1104 المخزون                 مدين 1,000
 * 1105 ضريبة المدخلات          مدين   150
 * الصندوق/البنك/المورد        دائن 1,150
 *
 * مهم:
 * الضريبة لا تدخل في المخزون.
 */
function buildPurchaseJournalEntry(
  purchase: Purchase,
  accounts: Account[],
  supplier: Supplier | undefined,
  paymentAccount: Account | undefined,
  journalEntries: JournalEntry[]
): JournalEntry {
  const inventoryAccount =
    findAccountByCode(
      accounts,
      INVENTORY_ACCOUNT_CODE
    );

  if (!inventoryAccount) {
    throw new Error(
      "حساب المخزون 1104 غير موجود"
    );
  }

  const lines: JournalLine[] =
    [];

  /*
   * ==========================================
   * قيمة المخزون قبل الضريبة
   * ==========================================
   */

  let inventoryTotal = 0;

  for (const item of purchase.items) {
    inventoryTotal +=
      getPurchaseItemInventoryValue(
        item
      );
  }

  /*
   * إذا لم تكن قيمة العناصر موجودة بشكل صحيح،
   * نستخدم subtotal - discount.
   *
   * ولا نضيف الضريبة.
   */

  if (
    inventoryTotal <= 0
  ) {
    inventoryTotal =
      Math.max(
        0,
        Number(
          purchase.subtotal || 0
        ) -
          Number(
            purchase.discount || 0
          )
      );
  }

  const taxAmount = Math.max(
    0,
    Number(
      purchase.tax || 0
    )
  );

  const invoiceTotal = Math.max(
    0,
    Number(
      purchase.total || 0
    )
  );

  /*
   * ==========================================
   * 1104 المخزون
   * ==========================================
   */

  if (
    inventoryTotal > 0
  ) {
    lines.push({
      id: createId("line"),

      accountId:
        inventoryAccount.id,

      accountCode:
        inventoryAccount.code,

      accountName:
        inventoryAccount.name,

      debit:
        roundMoney(
          inventoryTotal
        ),

      credit: 0,

      description:
        `إضافة مخزون من فاتورة الشراء ${purchase.invoiceNumber}`,

      supplierId:
        supplier?.id,
    });
  }

  /*
   * ==========================================
   * 1105 ضريبة المدخلات
   * ==========================================
   */

  if (
    taxAmount > 0
  ) {
    const inputVatAccount =
      findAccountByCode(
        accounts,
        INPUT_VAT_ACCOUNT_CODE
      );

    if (!inputVatAccount) {
      throw new Error(
        "حساب ضريبة القيمة المضافة - مدخلات 1105 غير موجود"
      );
    }

    lines.push({
      id: createId("line"),

      accountId:
        inputVatAccount.id,

      accountCode:
        inputVatAccount.code,

      accountName:
        inputVatAccount.name,

      debit:
        roundMoney(
          taxAmount
        ),

      credit: 0,

      description:
        `ضريبة مدخلات لفاتورة الشراء ${purchase.invoiceNumber}`,

      supplierId:
        supplier?.id,
    });
  }

  /*
   * ==========================================
   * الطرف الدائن
   * ==========================================
   */

  if (
    purchase.paymentMethod ===
    "credit"
  ) {
    if (
      !supplier?.accountId ||
      !supplier.accountCode
    ) {
      throw new Error(
        "حساب المورد غير موجود"
      );
    }

    lines.push({
      id: createId("line"),

      accountId:
        supplier.accountId,

      accountCode:
        supplier.accountCode,

      accountName:
        supplier.accountName ||
        supplier.name,

      debit: 0,

      credit:
        roundMoney(
          invoiceTotal
        ),

      description:
        `شراء آجل من ${supplier.name} - ${purchase.invoiceNumber}`,

      supplierId:
        supplier.id,
    });
  } else {
    if (!paymentAccount) {
      throw new Error(
        "حساب الدفع غير موجود"
      );
    }

    lines.push({
      id: createId("line"),

      accountId:
        paymentAccount.id,

      accountCode:
        paymentAccount.code,

      accountName:
        paymentAccount.name,

      debit: 0,

      credit:
        roundMoney(
          invoiceTotal
        ),

      description:
        `دفع قيمة فاتورة الشراء ${purchase.invoiceNumber}`,
    });
  }

  /*
   * ==========================================
   * التحقق من توازن القيد
   * ==========================================
   */

  const debitTotal =
    lines.reduce(
      (sum, line) =>
        sum +
        Number(
          line.debit || 0
        ),
      0
    );

  const creditTotal =
    lines.reduce(
      (sum, line) =>
        sum +
        Number(
          line.credit || 0
        ),
      0
    );

  /*
   * لا نقوم بتعديل المخزون لإجبار القيد على التوازن.
   *
   * إذا كان هناك فرق فهذا خطأ في بيانات الفاتورة:
   *
   * المخزون + الضريبة يجب أن = إجمالي الفاتورة.
   */

  if (
    Math.abs(
      debitTotal -
        creditTotal
    ) > 0.01
  ) {
    throw new Error(
      `قيد الشراء غير متوازن. المدين: ${debitTotal.toFixed(
        2
      )} — الدائن: ${creditTotal.toFixed(
        2
      )}. يجب أن تكون قيمة المخزون + الضريبة مساوية لإجمالي الفاتورة.`
    );
  }

  return {
    id: createId("journal"),

    entryNumber:
      generateJournalEntryNumber(
        journalEntries
      ),

    date: purchase.date,

    description:
      `فاتورة شراء ${purchase.invoiceNumber}`,

    referenceType:
      "purchase",

    referenceId:
      purchase.id,

    lines,

    createdAt:
      new Date().toISOString(),
  };
}

/* =========================================================
   SALE JOURNAL
========================================================= */

/**
 * قيد البيع:
 *
 * أولًا قيد الإيراد:
 *
 * الصندوق/البنك/العميل       مدين
 * المبيعات                   دائن
 *
 * ثانيًا قيد تكلفة المخزون:
 *
 * تكلفة المبيعات              مدين
 * 1104 المخزون                دائن
 */
function buildSaleJournalEntry(
  sale: Sale,
  state: Pick<
    ERPStore,
    | "accounts"
    | "products"
    | "purchases"
    | "sales"
  >,
  customer: Customer | undefined,
  paymentAccount: Account | undefined,
  journalEntries: JournalEntry[]
): JournalEntry {
  const lines: JournalLine[] =
    [];

  /*
   * ==========================================
   * حساب التحصيل
   * ==========================================
   */

  if (
    sale.paymentMethod ===
    "credit"
  ) {
    if (
      !customer?.accountId ||
      !customer.accountCode
    ) {
      throw new Error(
        "حساب العميل غير موجود"
      );
    }

    lines.push({
      id: createId("line"),

      accountId:
        customer.accountId,

      accountCode:
        customer.accountCode,

      accountName:
        customer.accountName ||
        customer.name,

      debit:
        roundMoney(
          sale.total
        ),

      credit: 0,

      description:
        `بيع آجل للعميل ${customer.name} - ${sale.invoiceNumber}`,

      customerId:
        customer.id,
    });
  } else {
    if (!paymentAccount) {
      throw new Error(
        "حساب التحصيل غير موجود"
      );
    }

    lines.push({
      id: createId("line"),

      accountId:
        paymentAccount.id,

      accountCode:
        paymentAccount.code,

      accountName:
        paymentAccount.name,

      debit:
        roundMoney(
          sale.total
        ),

      credit: 0,

      description:
        `تحصيل قيمة فاتورة البيع ${sale.invoiceNumber}`,
    });
  }

  /*
   * ==========================================
   * المبيعات
   * ==========================================
   */

  const revenueLines: JournalLine[] =
    [];

  for (const item of sale.items) {
    if (!item.productId) {
      continue;
    }

    const product =
      state.products.find(
        (p) =>
          p.id ===
          item.productId
      );

    if (!product) {
      continue;
    }

    const itemTotal =
      getSaleItemRevenueValue(
        item
      );

    if (
      itemTotal <= 0
    ) {
      continue;
    }

    const revenueCode =
      getRevenueAccountCode(
        product
      );

    const revenueAccount =
      findAccountByCode(
        state.accounts,
        revenueCode
      );

    if (!revenueAccount) {
      throw new Error(
        `حساب المبيعات ${revenueCode} غير موجود`
      );
    }

    revenueLines.push({
      id: createId("line"),

      accountId:
        revenueAccount.id,

      accountCode:
        revenueAccount.code,

      accountName:
        revenueAccount.name,

      debit: 0,

      credit:
        roundMoney(
          itemTotal
        ),

      description:
        `${product.name} - فاتورة ${sale.invoiceNumber}`,
    });
  }

  /*
   * توزيع إجمالي البيع على أسطر الإيرادات.
   */

  const calculatedRevenue =
    revenueLines.reduce(
      (sum, line) =>
        sum +
        Number(
          line.credit || 0
        ),
      0
    );

  const saleTotal =
    roundMoney(
      sale.total
    );

  if (
    revenueLines.length > 0
  ) {
    const difference =
      roundMoney(
        saleTotal -
          calculatedRevenue
      );

    if (
      Math.abs(
        difference
      ) > 0.01
    ) {
      revenueLines[
        revenueLines.length - 1
      ].credit =
        roundMoney(
          revenueLines[
            revenueLines.length - 1
          ].credit +
            difference
        );
    }

    lines.push(
      ...revenueLines
    );
  }

  /*
   * ==========================================
   * المخزون وتكلفة المبيعات
   * ==========================================
   */

  const inventoryAccount =
    findAccountByCode(
      state.accounts,
      INVENTORY_ACCOUNT_CODE
    );

  if (!inventoryAccount) {
    throw new Error(
      "حساب المخزون 1104 غير موجود"
    );
  }

  const cogsByAccount =
    new Map<
      string,
      {
        account: Account;
        amount: number;
      }
    >();

  for (const item of sale.items) {
    if (!item.productId) {
      continue;
    }

    const product =
      state.products.find(
        (p) =>
          p.id ===
          item.productId
      );

    if (!product) {
      continue;
    }

    const quantity =
      Number(
        item.quantity || 0
      );

    if (
      quantity <= 0
    ) {
      continue;
    }

    const cost =
      calculateItemCost(
        state,
        item.productId,
        quantity
      );

    /*
     * خدمة العمرة لا يفترض أن تسحب
     * من المخزون إذا لم تكن لها مشتريات.
     *
     * لذلك إذا لم توجد تكلفة شراء
     * فلن يتم إنشاء قيد COGS.
     */

    if (
      cost <= 0
    ) {
      continue;
    }

    const cogsCode =
      getCogsAccountCode(
        product
      );

    const cogsAccount =
      findAccountByCode(
        state.accounts,
        cogsCode
      );

    if (!cogsAccount) {
      throw new Error(
        `حساب تكلفة المبيعات ${cogsCode} غير موجود`
      );
    }

    const existing =
      cogsByAccount.get(
        cogsCode
      );

    if (existing) {
      existing.amount +=
        cost;
    } else {
      cogsByAccount.set(
        cogsCode,
        {
          account:
            cogsAccount,
          amount: cost,
        }
      );
    }
  }

  let totalCogs = 0;

  cogsByAccount.forEach(
    ({
      account,
      amount,
    }) => {
      const roundedAmount =
        roundMoney(
          amount
        );

      if (
        roundedAmount <= 0
      ) {
        return;
      }

      totalCogs +=
        roundedAmount;

      lines.push({
        id: createId("line"),

        accountId:
          account.id,

        accountCode:
          account.code,

        accountName:
          account.name,

        debit:
          roundedAmount,

        credit: 0,

        description:
          `تكلفة المبيعات - ${sale.invoiceNumber}`,
      });
    }
  );

  /*
   * ==========================================
   * تخفيض المخزون 1104
   * ==========================================
   */

  if (
    totalCogs > 0
  ) {
    lines.push({
      id: createId("line"),

      accountId:
        inventoryAccount.id,

      accountCode:
        inventoryAccount.code,

      accountName:
        inventoryAccount.name,

      debit: 0,

      credit:
        roundMoney(
          totalCogs
        ),

      description:
        `خروج البضاعة من المخزون - ${sale.invoiceNumber}`,
    });
  }

  /*
   * ==========================================
   * التحقق من توازن القيد
   * ==========================================
   */

  const debitTotal =
    lines.reduce(
      (sum, line) =>
        sum +
        Number(
          line.debit || 0
        ),
      0
    );

  const creditTotal =
    lines.reduce(
      (sum, line) =>
        sum +
        Number(
          line.credit || 0
        ),
      0
    );

  if (
    Math.abs(
      debitTotal -
        creditTotal
    ) > 0.01
  ) {
    throw new Error(
      `قيد البيع غير متوازن. المدين: ${debitTotal.toFixed(
        2
      )} — الدائن: ${creditTotal.toFixed(
        2
      )}`
    );
  }

  return {
    id: createId("journal"),

    entryNumber:
      generateJournalEntryNumber(
        journalEntries
      ),

    date: sale.date,

    description:
      `فاتورة بيع ${sale.invoiceNumber}`,

    referenceType:
      "sale",

    referenceId:
      sale.id,

    lines,

    createdAt:
      new Date().toISOString(),
  };
}

/* =========================================================
   SALE ITEM VALUE
========================================================= */

function getSaleItemRevenueValue(
  item: SaleItem
) {
  const total =
    Number(
      item.total
    );

  if (
    Number.isFinite(total) &&
    total >= 0
  ) {
    return total;
  }

  const quantity =
    Number(
      item.quantity || 0
    );

  const gross =
    quantity *
    Number(
      item.price || 0
    );

  return Math.max(
    0,
    gross -
      Number(
        item.discount || 0
      )
  );
}

/* =========================================================
   MONEY
========================================================= */

function roundMoney(
  value: number
) {
  return Math.round(
    (Number(value) || 0) *
      100
  ) / 100;
}

export default useERPStore;