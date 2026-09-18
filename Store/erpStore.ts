import { create } from "zustand";
import { persist } from "zustand/middleware";

// ======================================================
// المنتجات
// ======================================================

export interface Product {
  id: string;
  code: string;
  name: string;
  unit: string;
}

// ======================================================
// العملاء
// ======================================================

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  balance?: number;

  // الحساب المحاسبي الخاص بالعميل
  accountCode?: string;
  accountName?: string;
}

// ======================================================
// الموردون
// ======================================================

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  balance?: number;

  // الحساب المحاسبي الخاص بالمورد
  accountCode?: string;
  accountName?: string;
}

// ======================================================
// الوكلاء
// ======================================================

export interface Agent {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  balance?: number;

  // الحساب المحاسبي الخاص بالوكيل
  accountCode?: string;
  accountName?: string;
}

// ======================================================
// عناصر المبيعات
// ======================================================

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
}

// ======================================================
// المبيعات
// ======================================================

export interface Sale {
  id: string;
  invoiceNumber: string;
  date: string;

  customerId: string;
  customerName: string;

  accountCode: string;
  accountName: string;

  paymentMethod:
    | "cash"
    | "bank"
    | "credit";

  items: SaleItem[];

  subtotal: number;
  discount: number;
  tax: number;
  total: number;

  notes?: string;
}

// ======================================================
// عناصر المشتريات
// ======================================================

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
  tax: number;
  total: number;
}

// ======================================================
// المشتريات
// ======================================================

export interface Purchase {
  id: string;
  invoiceNumber: string;
  date: string;

  supplierId: string;
  supplierName: string;

  accountCode: string;
  accountName: string;

  paymentMethod:
    | "cash"
    | "bank"
    | "credit";

  items: PurchaseItem[];

  subtotal: number;
  discount: number;
  tax: number;
  total: number;

  notes?: string;
}

// ======================================================
// أنواع الحسابات
// ======================================================

export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense";

// ======================================================
// الحساب المحاسبي
// ======================================================

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;

  // كود الحساب الأب
  parent: string;

  // 0 = رئيسي
  // 1 = فرعي
  // 2 = فرعي من فرعي
  // وهكذا
  level: number;

  description?: string;
}

// ======================================================
// بيانات تعديل الحساب
// ======================================================

export type AccountUpdateData = Partial<
  Omit<Account, "id" | "code">
>;

// ======================================================
// سطر القيد اليومي
// ======================================================

export interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

// ======================================================
// حالة القيد
// ======================================================

export type JournalStatus =
  | "posted"
  | "draft";

// ======================================================
// القيد اليومي
// ======================================================

export interface JournalEntry {
  id: string;
  number: string;
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  status: JournalStatus;
  user: string;
  createdAt: string;
  lines: JournalLine[];
}

// ======================================================
// بيانات إضافة وكيل
// ======================================================

export type AddAgentData = Omit<
  Agent,
  "id" | "accountCode" | "accountName"
> & {
  accountType: AccountType;
  accountParent: string;
};

// ======================================================
// بيانات تعديل وكيل
// ======================================================

export type UpdateAgentData = Partial<
  Omit<
    Agent,
    "id" | "accountCode" | "accountName"
  >
> & {
  accountType?: AccountType;
  accountParent?: string;
};

// ======================================================
// الكود الأساسي للأصناف
// ======================================================

const PRODUCT_BASE_CODE = 1001;

// ======================================================
// الأكواد الأساسية للحسابات
// ======================================================

const ROOT_ACCOUNT_BASE_CODES: Record<
  AccountType,
  number
> = {
  asset: 1000,
  liability: 2000,
  equity: 3000,
  revenue: 4000,
  expense: 5000,
};

// ======================================================
// الأكواد الافتراضية المهمة
// ======================================================

const ACCOUNT_CODES = {
  ASSETS: "1000",
  CUSTOMERS: "1001",

  CASH: "1002",
  BANK: "1003",

  LIABILITIES: "2000",
  SUPPLIERS: "2001",
  AGENTS: "2002",

  EQUITY: "3000",

  REVENUE: "4000",
  SALES: "4001",

  EXPENSES: "5000",
  PURCHASES: "5001",
} as const;

// ======================================================
// إنشاء ID
// ======================================================

function generateId(
  prefix: string
): string {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

// ======================================================
// توليد كود المنتج
// ======================================================

function generateProductCode(
  products: Product[]
): string {
  const codes = products
    .map((product) =>
      Number(product.code)
    )
    .filter((code) =>
      Number.isFinite(code)
    );

  if (codes.length === 0) {
    return String(
      PRODUCT_BASE_CODE
    );
  }

  let nextCode =
    Math.max(...codes) + 1;

  while (
    products.some(
      (product) =>
        Number(product.code) ===
        nextCode
    )
  ) {
    nextCode++;
  }

  return String(nextCode);
}

// ======================================================
// الحسابات الافتراضية
// ======================================================

function createDefaultAccounts(): Account[] {
  return [
    // ==================================================
    // الأصول
    // ==================================================

    {
      id: "ACCOUNT-1000",
      code: "1000",
      name: "الأصول",
      type: "asset",
      parent: "",
      level: 0,
      description:
        "الحساب الرئيسي للأصول",
    },

    {
      id: "ACCOUNT-1001",
      code: "1001",
      name: "العملاء",
      type: "asset",
      parent: "1000",
      level: 1,
      description:
        "الحساب الرئيسي للعملاء",
    },

    {
      id: "ACCOUNT-1002",
      code: "1002",
      name: "الصندوق",
      type: "asset",
      parent: "1000",
      level: 1,
      description:
        "حساب الصندوق والنقدية",
    },

    {
      id: "ACCOUNT-1003",
      code: "1003",
      name: "البنك",
      type: "asset",
      parent: "1000",
      level: 1,
      description:
        "حساب البنك",
    },

    // ==================================================
    // الالتزامات
    // ==================================================

    {
      id: "ACCOUNT-2000",
      code: "2000",
      name: "الالتزامات",
      type: "liability",
      parent: "",
      level: 0,
      description:
        "الحساب الرئيسي للالتزامات",
    },

    {
      id: "ACCOUNT-2001",
      code: "2001",
      name: "الموردين",
      type: "liability",
      parent: "2000",
      level: 1,
      description:
        "الحساب الرئيسي للموردين",
    },

    {
      id: "ACCOUNT-2002",
      code: "2002",
      name: "الوكلاء",
      type: "liability",
      parent: "2000",
      level: 1,
      description:
        "الحساب الرئيسي للوكلاء",
    },

    // ==================================================
    // حقوق الملكية
    // ==================================================

    {
      id: "ACCOUNT-3000",
      code: "3000",
      name: "حقوق الملكية",
      type: "equity",
      parent: "",
      level: 0,
      description:
        "الحساب الرئيسي لحقوق الملكية",
    },

    // ==================================================
    // الإيرادات
    // ==================================================

    {
      id: "ACCOUNT-4000",
      code: "4000",
      name: "الإيرادات",
      type: "revenue",
      parent: "",
      level: 0,
      description:
        "الحساب الرئيسي للإيرادات",
    },

    {
      id: "ACCOUNT-4001",
      code: "4001",
      name: "المبيعات",
      type: "revenue",
      parent: "4000",
      level: 1,
      description:
        "حساب إيرادات المبيعات",
    },

    // ==================================================
    // المصروفات
    // ==================================================

    {
      id: "ACCOUNT-5000",
      code: "5000",
      name: "المصروفات",
      type: "expense",
      parent: "",
      level: 0,
      description:
        "الحساب الرئيسي للمصروفات",
    },

    {
      id: "ACCOUNT-5001",
      code: "5001",
      name: "المشتريات",
      type: "expense",
      parent: "5000",
      level: 1,
      description:
        "حساب المشتريات",
    },
  ];
}

// ======================================================
// توليد كود حساب رئيسي
// ======================================================

function generateRootAccountCode(
  accounts: Account[],
  type: AccountType
): string {
  const baseCode =
    ROOT_ACCOUNT_BASE_CODES[type];

  const rootAccounts =
    accounts.filter(
      (account) =>
        account.level === 0 &&
        account.type === type &&
        !account.parent
    );

  if (rootAccounts.length === 0) {
    let code = baseCode;

    while (
      accounts.some(
        (account) =>
          Number(account.code) ===
          code
      )
    ) {
      code += 100;
    }

    return String(code);
  }

  const codes = rootAccounts
    .map((account) =>
      Number(account.code)
    )
    .filter((code) =>
      Number.isFinite(code)
    );

  let nextCode =
    Math.max(...codes) + 100;

  while (
    accounts.some(
      (account) =>
        Number(account.code) ===
        nextCode
    )
  ) {
    nextCode += 100;
  }

  return String(nextCode);
}

// ======================================================
// توليد كود حساب تحت أي حساب
// ======================================================

function generateChildAccountCode(
  accounts: Account[],
  parentCode: string
): string {
  const parentAccount =
    accounts.find(
      (account) =>
        account.code ===
        parentCode
    );

  if (!parentAccount) {
    throw new Error(
      "الحساب الأب غير موجود."
    );
  }

  const children =
    accounts.filter(
      (account) =>
        account.parent ===
        parentCode
    );

  const parentNumber =
    Number(parentCode);

  if (!Number.isFinite(parentNumber)) {
    throw new Error(
      "رقم الحساب الأب غير صحيح."
    );
  }

  if (children.length === 0) {
    let firstCode =
      parentNumber + 1;

    while (
      accounts.some(
        (account) =>
          Number(account.code) ===
          firstCode
      )
    ) {
      firstCode++;
    }

    return String(firstCode);
  }

  const childNumbers =
    children
      .map((account) =>
        Number(account.code)
      )
      .filter((code) =>
        Number.isFinite(code)
      );

  let nextCode =
    Math.max(...childNumbers) + 1;

  while (
    accounts.some(
      (account) =>
        Number(account.code) ===
        nextCode
    )
  ) {
    nextCode++;
  }

  return String(nextCode);
}

// ======================================================
// توليد كود الحساب
// ======================================================

function generateAccountCode(
  accounts: Account[],
  type: AccountType,
  parent: string
): string {
  if (!parent) {
    return generateRootAccountCode(
      accounts,
      type
    );
  }

  return generateChildAccountCode(
    accounts,
    parent
  );
}

// ======================================================
// البحث عن حساب
// ======================================================

function findAccount(
  accounts: Account[],
  code?: string
): Account | undefined {
  if (!code) {
    return undefined;
  }

  return accounts.find(
    (account) =>
      account.code === code
  );
}

// ======================================================
// إنشاء رقم قيد
// ======================================================

function generateJournalNumber(
  entries: JournalEntry[]
): string {
  const numbers = entries
    .map((entry) => {
      const match =
        entry.number.match(
          /(\d+)$/
        );

      return match
        ? Number(match[1])
        : 0;
    })
    .filter((number) =>
      Number.isFinite(number)
    );

  const next =
    numbers.length > 0
      ? Math.max(...numbers) + 1
      : 1;

  return `JV-${String(
    next
  ).padStart(4, "0")}`;
}

// ======================================================
// التحقق من توازن القيد
// ======================================================

function isJournalBalanced(
  lines: JournalLine[]
): boolean {
  const debit = lines.reduce(
    (sum, line) =>
      sum +
      Number(line.debit || 0),
    0
  );

  const credit = lines.reduce(
    (sum, line) =>
      sum +
      Number(line.credit || 0),
    0
  );

  return (
    Math.abs(
      debit - credit
    ) < 0.000001
  );
}

// ======================================================
// إنشاء سطر قيد
// ======================================================

function createJournalLine(
  account: Account,
  description: string,
  debit: number,
  credit: number
): JournalLine {
  return {
    id: generateId(
      "JLINE"
    ),

    accountCode:
      account.code,

    accountName:
      account.name,

    description,

    debit:
      Number(debit || 0),

    credit:
      Number(credit || 0),
  };
}

// ======================================================
// معرفة الحساب المقابل للبيع
// ======================================================

function getSaleDebitAccount(
  accounts: Account[],
  sale: Sale
): Account | undefined {
  if (
    sale.paymentMethod ===
    "cash"
  ) {
    return findAccount(
      accounts,
      ACCOUNT_CODES.CASH
    );
  }

  if (
    sale.paymentMethod ===
    "bank"
  ) {
    return findAccount(
      accounts,
      ACCOUNT_CODES.BANK
    );
  }

  return findAccount(
    accounts,
    sale.accountCode
  );
}

// ======================================================
// معرفة الحساب المقابل للشراء
// ======================================================

function getPurchaseCreditAccount(
  accounts: Account[],
  purchase: Purchase
): Account | undefined {
  if (
    purchase.paymentMethod ===
    "cash"
  ) {
    return findAccount(
      accounts,
      ACCOUNT_CODES.CASH
    );
  }

  if (
    purchase.paymentMethod ===
    "bank"
  ) {
    return findAccount(
      accounts,
      ACCOUNT_CODES.BANK
    );
  }

  return findAccount(
    accounts,
    purchase.accountCode
  );
}

// ======================================================
// إنشاء قيد المبيعات
// ======================================================

function createSaleJournalEntry(
  accounts: Account[],
  entries: JournalEntry[],
  sale: Sale,
  saleId: string
): JournalEntry | null {
  const amount =
    Number(sale.total || 0);

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return null;
  }

  const debitAccount =
    getSaleDebitAccount(
      accounts,
      sale
    );

  const salesAccount =
    findAccount(
      accounts,
      ACCOUNT_CODES.SALES
    );

  if (!debitAccount) {
    console.error(
      "حساب الطرف المدين في المبيعات غير موجود."
    );

    return null;
  }

  if (!salesAccount) {
    console.error(
      "حساب المبيعات 4001 غير موجود."
    );

    return null;
  }

  const debitDescription =
    sale.paymentMethod ===
    "credit"
      ? `بيع آجل للعميل: ${sale.customerName}`
      : `بيع ${sale.paymentMethod === "cash" ? "نقدي" : "بنكي"} للعميل: ${sale.customerName}`;

  const lines: JournalLine[] = [
    createJournalLine(
      debitAccount,
      debitDescription,
      amount,
      0
    ),

    createJournalLine(
      salesAccount,
      `إيراد مبيعات - فاتورة ${sale.invoiceNumber}`,
      0,
      amount
    ),
  ];

  if (
    !isJournalBalanced(lines)
  ) {
    console.error(
      "قيد المبيعات غير متوازن."
    );

    return null;
  }

  return {
    id: generateId(
      "JOURNAL"
    ),

    number:
      generateJournalNumber(
        entries
      ),

    date: sale.date,

    reference:
      `SALE:${saleId}`,

    description:
      `قيد مبيعات - ${sale.invoiceNumber}`,

    debit: amount,

    credit: amount,

    status: "posted",

    user: "system",

    createdAt:
      new Date().toISOString(),

    lines,
  };
}

// ======================================================
// إنشاء قيد المشتريات
// ======================================================

function createPurchaseJournalEntry(
  accounts: Account[],
  entries: JournalEntry[],
  purchase: Purchase,
  purchaseId: string
): JournalEntry | null {
  const amount =
    Number(purchase.total || 0);

  if (
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return null;
  }

  const purchasesAccount =
    findAccount(
      accounts,
      ACCOUNT_CODES.PURCHASES
    );

  const creditAccount =
    getPurchaseCreditAccount(
      accounts,
      purchase
    );

  if (!purchasesAccount) {
    console.error(
      "حساب المشتريات 5001 غير موجود."
    );

    return null;
  }

  if (!creditAccount) {
    console.error(
      "حساب الطرف الدائن في المشتريات غير موجود."
    );

    return null;
  }

  const creditDescription =
    purchase.paymentMethod ===
    "credit"
      ? `شراء آجل من المورد: ${purchase.supplierName}`
      : `شراء ${purchase.paymentMethod === "cash" ? "نقدي" : "بنكي"} من المورد: ${purchase.supplierName}`;

  const lines: JournalLine[] = [
    createJournalLine(
      purchasesAccount,
      `مشتريات - فاتورة ${purchase.invoiceNumber}`,
      amount,
      0
    ),

    createJournalLine(
      creditAccount,
      creditDescription,
      0,
      amount
    ),
  ];

  if (
    !isJournalBalanced(lines)
  ) {
    console.error(
      "قيد المشتريات غير متوازن."
    );

    return null;
  }

  return {
    id: generateId(
      "JOURNAL"
    ),

    number:
      generateJournalNumber(
        entries
      ),

    date: purchase.date,

    reference:
      `PURCHASE:${purchaseId}`,

    description:
      `قيد مشتريات - ${purchase.invoiceNumber}`,

    debit: amount,

    credit: amount,

    status: "posted",

    user: "system",

    createdAt:
      new Date().toISOString(),

    lines,
  };
}

// ======================================================
// التحقق من أن الحساب ليس داخل شجرته
// ======================================================

function isDescendant(
  accounts: Account[],
  possibleChildCode: string,
  possibleParentCode: string
): boolean {
  let current =
    accounts.find(
      (account) =>
        account.code ===
        possibleParentCode
    );

  while (current) {
    if (
      current.parent ===
      possibleChildCode
    ) {
      return true;
    }

    if (!current.parent) {
      break;
    }

    current =
      accounts.find(
        (account) =>
          account.code ===
          current!.parent
      );
  }

  return false;
}

// ======================================================
// واجهة Zustand
// ======================================================

interface ERPStore {
  // ==================================================
  // المنتجات
  // ==================================================

  products: Product[];

  addProduct: (
    product: Omit<
      Product,
      "id" | "code"
    >
  ) => void;

  updateProduct: (
    id: string,
    data: Partial<
      Omit<
        Product,
        "id" | "code"
      >
    >
  ) => void;

  deleteProduct: (
    id: string
  ) => void;

  // ==================================================
  // العملاء
  // ==================================================

  customers: Customer[];

  addCustomer: (
    customer: Omit<Customer, "id">
  ) => void;

  updateCustomer: (
    id: string,
    data: Partial<Customer>
  ) => void;

  deleteCustomer: (
    id: string
  ) => void;

  // ==================================================
  // الموردون
  // ==================================================

  suppliers: Supplier[];

  addSupplier: (
    supplier: Omit<Supplier, "id">
  ) => void;

  updateSupplier: (
    id: string,
    data: Partial<Supplier>
  ) => void;

  deleteSupplier: (
    id: string
  ) => void;

  // ==================================================
  // الوكلاء
  // ==================================================

  agents: Agent[];

  addAgent: (
    agent: AddAgentData
  ) => void;

  updateAgent: (
    id: string,
    data: UpdateAgentData
  ) => void;

  deleteAgent: (
    id: string
  ) => void;

  // ==================================================
  // المبيعات
  // ==================================================

  sales: Sale[];

  addSale: (
    sale: Omit<Sale, "id">
  ) => void;

  updateSale: (
    id: string,
    data: Partial<Sale>
  ) => void;

  deleteSale: (
    id: string
  ) => void;

  // ==================================================
  // المشتريات
  // ==================================================

  purchases: Purchase[];

  addPurchase: (
    purchase: Omit<
      Purchase,
      "id"
    >
  ) => void;

  updatePurchase: (
    id: string,
    data: Partial<Purchase>
  ) => void;

  deletePurchase: (
    id: string
  ) => void;

  // ==================================================
  // الحسابات
  // ==================================================

  accounts: Account[];

  addAccount: (
    account: Omit<
      Account,
      "id" | "code"
    >
  ) => void;

  updateAccount: (
    id: string,
    data: AccountUpdateData
  ) => void;

  deleteAccount: (
    id: string
  ) => void;

  // ==================================================
  // القيود اليومية
  // ==================================================

  journalEntries: JournalEntry[];

  addJournalEntry: (
    entry: Omit<
      JournalEntry,
      "id"
    >
  ) => void;

  updateJournalEntry: (
    id: string,
    data: Partial<JournalEntry>
  ) => void;

  deleteJournalEntry: (
    id: string
  ) => void;

  // ==================================================
  // مسح البيانات
  // ==================================================

  clearStore: () => void;
}

// ======================================================
// Zustand Store
// ======================================================

export const useERPStore =
  create<ERPStore>()(
    persist(
      (set) => ({
        // ==================================================
        // المنتجات
        // ==================================================

        products: [],

        addProduct: (product) =>
          set((state) => {
            const code =
              generateProductCode(
                state.products
              );

            const newProduct: Product = {
              id: generateId(
                "PRODUCT"
              ),

              code,

              name:
                product.name.trim(),

              unit:
                product.unit.trim(),
            };

            return {
              products: [
                ...state.products,
                newProduct,
              ],
            };
          }),

        updateProduct: (
          id,
          data
        ) =>
          set((state) => {
            const safeData = {
              ...data,
            };

            delete (
              safeData as Partial<Product>
            ).id;

            delete (
              safeData as Partial<Product>
            ).code;

            return {
              products:
                state.products.map(
                  (product) =>
                    product.id === id
                      ? {
                          ...product,
                          ...safeData,
                        }
                      : product
                ),
            };
          }),

        deleteProduct: (id) =>
          set((state) => ({
            products:
              state.products.filter(
                (product) =>
                  product.id !== id
              ),
          })),

        // ==================================================
        // العملاء
        // ==================================================

        customers: [],

        addCustomer: (customer) =>
          set((state) => {
            const cleanName =
              customer.name.trim();

            if (!cleanName) {
              console.error(
                "اسم العميل مطلوب."
              );

              return state;
            }

            const exists =
              state.customers.some(
                (item) =>
                  item.name
                    .trim()
                    .toLowerCase() ===
                  cleanName.toLowerCase()
              );

            if (exists) {
              console.error(
                "هذا العميل موجود مسبقًا."
              );

              return state;
            }

            // ------------------------------------------
            // حساب العملاء الرئيسي
            // ------------------------------------------

            const customersParent =
              findAccount(
                state.accounts,
                ACCOUNT_CODES.CUSTOMERS
              );

            if (!customersParent) {
              console.error(
                "حساب العملاء 1001 غير موجود."
              );

              return state;
            }

            // ------------------------------------------
            // إنشاء حساب العميل
            // ------------------------------------------

            const accountCode =
              generateChildAccountCode(
                state.accounts,
                customersParent.code
              );

            const customerAccount: Account =
              {
                id: generateId(
                  "ACCOUNT"
                ),

                code: accountCode,

                name: cleanName,

                type: "asset",

                parent:
                  customersParent.code,

                level:
                  customersParent.level +
                  1,

                description:
                  `حساب العميل: ${cleanName}`,
              };

            const newCustomer: Customer =
              {
                ...customer,

                id: generateId(
                  "CUSTOMER"
                ),

                name: cleanName,

                phone:
                  customer.phone?.trim() ||
                  "",

                address:
                  customer.address?.trim() ||
                  "",

                balance:
                  customer.balance ?? 0,

                accountCode,

                accountName:
                  cleanName,
              };

            let journalEntries =
              state.journalEntries;

            // ------------------------------------------
            // رصيد افتتاحي للعميل
            // ------------------------------------------

            const openingBalance =
              Number(
                customer.balance ?? 0
              );

            if (
              Number.isFinite(
                openingBalance
              ) &&
              openingBalance !== 0
            ) {
              const equityAccount =
                findAccount(
                  state.accounts,
                  ACCOUNT_CODES.EQUITY
                );

              if (equityAccount) {
                const amount =
                  Math.abs(
                    openingBalance
                  );

                const debit =
                  openingBalance > 0
                    ? amount
                    : 0;

                const credit =
                  openingBalance < 0
                    ? amount
                    : 0;

                const lines: JournalLine[] =
                  [
                    createJournalLine(
                      customerAccount,
                      `رصيد افتتاحي للعميل: ${cleanName}`,
                      debit,
                      credit
                    ),

                    createJournalLine(
                      equityAccount,
                      `مقابل الرصيد الافتتاحي للعميل: ${cleanName}`,
                      credit,
                      debit
                    ),
                  ];

                journalEntries = [
                  ...journalEntries,
                  {
                    id: generateId(
                      "JOURNAL"
                    ),

                    number:
                      generateJournalNumber(
                        journalEntries
                      ),

                    date:
                      new Date()
                        .toISOString()
                        .slice(
                          0,
                          10
                        ),

                    reference:
                      `CUSTOMER_OPENING:${newCustomer.id}`,

                    description:
                      `رصيد افتتاحي للعميل ${cleanName}`,

                    debit:
                      amount,

                    credit:
                      amount,

                    status:
                      "posted",

                    user:
                      "system",

                    createdAt:
                      new Date().toISOString(),

                    lines,
                  },
                ];
              }
            }

            return {
              customers: [
                ...state.customers,
                newCustomer,
              ],

              accounts: [
                ...state.accounts,
                customerAccount,
              ],

              journalEntries,
            };
          }),

        updateCustomer: (
          id,
          data
        ) =>
          set((state) => {
            const current =
              state.customers.find(
                (customer) =>
                  customer.id === id
              );

            if (!current) {
              return state;
            }

            const newName =
              data.name?.trim();

            if (newName) {
              const duplicate =
                state.customers.some(
                  (customer) =>
                    customer.id !== id &&
                    customer.name
                      .trim()
                      .toLowerCase() ===
                      newName.toLowerCase()
                );

              if (duplicate) {
                console.error(
                  "اسم العميل مستخدم لعميل آخر."
                );

                return state;
              }
            }

            let accounts =
              state.accounts;

            if (
              newName &&
              newName !==
                current.name &&
              current.accountCode
            ) {
              accounts =
                accounts.map(
                  (account) =>
                    account.code ===
                    current.accountCode
                      ? {
                          ...account,
                          name: newName,
                          description:
                            `حساب العميل: ${newName}`,
                        }
                      : account
                );
            }

            return {
              customers:
                state.customers.map(
                  (customer) =>
                    customer.id === id
                      ? {
                          ...customer,
                          ...data,
                          name:
                            newName ??
                            customer.name,
                          accountName:
                            newName ??
                            customer.accountName,
                        }
                      : customer
                ),

              accounts,
            };
          }),

        deleteCustomer: (id) =>
          set((state) => {
            const customer =
              state.customers.find(
                (item) =>
                  item.id === id
              );

            if (!customer) {
              return state;
            }

            const hasSales =
              state.sales.some(
                (sale) =>
                  sale.customerId === id
              );

            if (hasSales) {
              console.error(
                "لا يمكن حذف العميل لأنه مرتبط بالمبيعات."
              );

              return state;
            }

            if (
              customer.accountCode
            ) {
              const used =
                state.journalEntries.some(
                  (entry) =>
                    entry.lines.some(
                      (line) =>
                        line.accountCode ===
                        customer.accountCode
                    )
                );

              if (used) {
                console.error(
                  "لا يمكن حذف العميل لأن حسابه مستخدم في القيود اليومية."
                );

                return state;
              }
            }

            return {
              customers:
                state.customers.filter(
                  (item) =>
                    item.id !== id
                ),

              accounts:
                customer.accountCode
                  ? state.accounts.filter(
                      (account) =>
                        account.code !==
                        customer.accountCode
                    )
                  : state.accounts,
            };
          }),

        // ==================================================
        // الموردون
        // ==================================================

        suppliers: [],

        addSupplier: (supplier) =>
          set((state) => {
            const cleanName =
              supplier.name.trim();

            if (!cleanName) {
              console.error(
                "اسم المورد مطلوب."
              );

              return state;
            }

            const exists =
              state.suppliers.some(
                (item) =>
                  item.name
                    .trim()
                    .toLowerCase() ===
                  cleanName.toLowerCase()
              );

            if (exists) {
              console.error(
                "هذا المورد موجود مسبقًا."
              );

              return state;
            }

            const suppliersParent =
              findAccount(
                state.accounts,
                ACCOUNT_CODES.SUPPLIERS
              );

            if (!suppliersParent) {
              console.error(
                "حساب الموردين 2001 غير موجود."
              );

              return state;
            }

            const accountCode =
              generateChildAccountCode(
                state.accounts,
                suppliersParent.code
              );

            const supplierAccount: Account =
              {
                id: generateId(
                  "ACCOUNT"
                ),

                code: accountCode,

                name: cleanName,

                type: "liability",

                parent:
                  suppliersParent.code,

                level:
                  suppliersParent.level +
                  1,

                description:
                  `حساب المورد: ${cleanName}`,
              };

            const newSupplier: Supplier =
              {
                ...supplier,

                id: generateId(
                  "SUPPLIER"
                ),

                name: cleanName,

                phone:
                  supplier.phone?.trim() ||
                  "",

                address:
                  supplier.address?.trim() ||
                  "",

                balance:
                  supplier.balance ?? 0,

                accountCode,

                accountName:
                  cleanName,
              };

            let journalEntries =
              state.journalEntries;

            // ------------------------------------------
            // رصيد افتتاحي للمورد
            // ------------------------------------------

            const openingBalance =
              Number(
                supplier.balance ?? 0
              );

            if (
              Number.isFinite(
                openingBalance
              ) &&
              openingBalance !== 0
            ) {
              const equityAccount =
                findAccount(
                  state.accounts,
                  ACCOUNT_CODES.EQUITY
                );

              if (equityAccount) {
                const amount =
                  Math.abs(
                    openingBalance
                  );

                const debit =
                  openingBalance < 0
                    ? amount
                    : 0;

                const credit =
                  openingBalance > 0
                    ? amount
                    : 0;

                const lines: JournalLine[] =
                  [
                    createJournalLine(
                      equityAccount,
                      `مقابل الرصيد الافتتاحي للمورد: ${cleanName}`,
                      debit,
                      credit
                    ),

                    createJournalLine(
                      supplierAccount,
                      `رصيد افتتاحي للمورد: ${cleanName}`,
                      credit,
                      debit
                    ),
                  ];

                journalEntries = [
                  ...journalEntries,
                  {
                    id: generateId(
                      "JOURNAL"
                    ),

                    number:
                      generateJournalNumber(
                        journalEntries
                      ),

                    date:
                      new Date()
                        .toISOString()
                        .slice(
                          0,
                          10
                        ),

                    reference:
                      `SUPPLIER_OPENING:${newSupplier.id}`,

                    description:
                      `رصيد افتتاحي للمورد ${cleanName}`,

                    debit:
                      amount,

                    credit:
                      amount,

                    status:
                      "posted",

                    user:
                      "system",

                    createdAt:
                      new Date().toISOString(),

                    lines,
                  },
                ];
              }
            }

            return {
              suppliers: [
                ...state.suppliers,
                newSupplier,
              ],

              accounts: [
                ...state.accounts,
                supplierAccount,
              ],

              journalEntries,
            };
          }),

        updateSupplier: (
          id,
          data
        ) =>
          set((state) => {
            const current =
              state.suppliers.find(
                (supplier) =>
                  supplier.id === id
              );

            if (!current) {
              return state;
            }

            const newName =
              data.name?.trim();

            if (newName) {
              const duplicate =
                state.suppliers.some(
                  (supplier) =>
                    supplier.id !== id &&
                    supplier.name
                      .trim()
                      .toLowerCase() ===
                      newName.toLowerCase()
                );

              if (duplicate) {
                console.error(
                  "اسم المورد مستخدم لمورد آخر."
                );

                return state;
              }
            }

            let accounts =
              state.accounts;

            if (
              newName &&
              newName !==
                current.name &&
              current.accountCode
            ) {
              accounts =
                accounts.map(
                  (account) =>
                    account.code ===
                    current.accountCode
                      ? {
                          ...account,
                          name: newName,
                          description:
                            `حساب المورد: ${newName}`,
                        }
                      : account
                );
            }

            return {
              suppliers:
                state.suppliers.map(
                  (supplier) =>
                    supplier.id === id
                      ? {
                          ...supplier,
                          ...data,
                          name:
                            newName ??
                            supplier.name,
                          accountName:
                            newName ??
                            supplier.accountName,
                        }
                      : supplier
                ),

              accounts,
            };
          }),

        deleteSupplier: (id) =>
          set((state) => {
            const supplier =
              state.suppliers.find(
                (item) =>
                  item.id === id
              );

            if (!supplier) {
              return state;
            }

            const hasPurchases =
              state.purchases.some(
                (purchase) =>
                  purchase.supplierId === id
              );

            if (hasPurchases) {
              console.error(
                "لا يمكن حذف المورد لأنه مرتبط بالمشتريات."
              );

              return state;
            }

            if (
              supplier.accountCode
            ) {
              const used =
                state.journalEntries.some(
                  (entry) =>
                    entry.lines.some(
                      (line) =>
                        line.accountCode ===
                        supplier.accountCode
                    )
                );

              if (used) {
                console.error(
                  "لا يمكن حذف المورد لأن حسابه مستخدم في القيود اليومية."
                );

                return state;
              }
            }

            return {
              suppliers:
                state.suppliers.filter(
                  (item) =>
                    item.id !== id
                ),

              accounts:
                supplier.accountCode
                  ? state.accounts.filter(
                      (account) =>
                        account.code !==
                        supplier.accountCode
                    )
                  : state.accounts,
            };
          }),

        // ==================================================
        // الوكلاء
        // ==================================================

        agents: [],

        addAgent: (agent) =>
          set((state) => {
            const cleanName =
              agent.name.trim();

            if (!cleanName) {
              console.error(
                "اسم الوكيل مطلوب."
              );

              return state;
            }

            const exists =
              state.agents.some(
                (item) =>
                  item.name
                    .trim()
                    .toLowerCase() ===
                  cleanName.toLowerCase()
              );

            if (exists) {
              console.error(
                "هذا الوكيل موجود مسبقًا."
              );

              return state;
            }

            const parentCode =
              agent.accountParent?.trim() ||
              "";

            if (!parentCode) {
              console.error(
                "يجب اختيار حساب الأب."
              );

              return state;
            }

            const parentAccount =
              findAccount(
                state.accounts,
                parentCode
              );

            if (!parentAccount) {
              console.error(
                "حساب الأب غير موجود."
              );

              return state;
            }

            if (
              parentAccount.type !==
              agent.accountType
            ) {
              console.error(
                "نوع الحساب لا يتطابق مع نوع الحساب الأب."
              );

              return state;
            }

            const accountCode =
              generateChildAccountCode(
                state.accounts,
                parentCode
              );

            const agentAccount: Account =
              {
                id: generateId(
                  "ACCOUNT"
                ),

                code: accountCode,

                name: cleanName,

                type:
                  agent.accountType,

                parent:
                  parentCode,

                level:
                  parentAccount.level +
                  1,

                description:
                  `حساب الوكيل: ${cleanName}`,
              };

            const newAgent: Agent =
              {
                id: generateId(
                  "AGENT"
                ),

                name: cleanName,

                phone:
                  agent.phone?.trim() ||
                  "",

                address:
                  agent.address?.trim() ||
                  "",

                balance:
                  agent.balance ?? 0,

                accountCode,

                accountName:
                  cleanName,
              };

            return {
              agents: [
                ...state.agents,
                newAgent,
              ],

              accounts: [
                ...state.accounts,
                agentAccount,
              ],
            };
          }),

        updateAgent: (
          id,
          data
        ) =>
          set((state) => {
            const current =
              state.agents.find(
                (agent) =>
                  agent.id === id
              );

            if (!current) {
              return state;
            }

            const newName =
              data.name?.trim();

            if (newName) {
              const duplicate =
                state.agents.some(
                  (agent) =>
                    agent.id !== id &&
                    agent.name
                      .trim()
                      .toLowerCase() ===
                      newName.toLowerCase()
                );

              if (duplicate) {
                console.error(
                  "اسم الوكيل مستخدم لوكيل آخر."
                );

                return state;
              }
            }

            const currentAccount =
              findAccount(
                state.accounts,
                current.accountCode
              );

            const newType =
              data.accountType ??
              currentAccount?.type ??
              "liability";

            const newParent =
              data.accountParent !==
              undefined
                ? data.accountParent.trim()
                : currentAccount?.parent ||
                  "";

            let accounts =
              state.accounts;

            let finalCode =
              current.accountCode;

            const accountChanged =
              newParent !==
                (currentAccount?.parent ||
                  "") ||
              newType !==
                currentAccount?.type;

            if (accountChanged) {
              if (!newParent) {
                console.error(
                  "يجب اختيار حساب الأب."
                );

                return state;
              }

              const parentAccount =
                findAccount(
                  state.accounts,
                  newParent
                );

              if (!parentAccount) {
                console.error(
                  "حساب الأب الجديد غير موجود."
                );

                return state;
              }

              if (
                parentAccount.type !==
                newType
              ) {
                console.error(
                  "نوع الحساب لا يتطابق مع نوع حساب الأب."
                );

                return state;
              }

              if (
                current.accountCode ===
                newParent
              ) {
                console.error(
                  "لا يمكن وضع الحساب تحت نفسه."
                );

                return state;
              }

              if (
                current.accountCode &&
                isDescendant(
                  state.accounts,
                  current.accountCode,
                  newParent
                )
              ) {
                console.error(
                  "لا يمكن نقل الحساب تحت أحد حساباته الفرعية."
                );

                return state;
              }

              const used =
                current.accountCode
                  ? state.journalEntries.some(
                      (entry) =>
                        entry.lines.some(
                          (line) =>
                            line.accountCode ===
                            current.accountCode
                        )
                    )
                  : false;

              if (used) {
                console.error(
                  "لا يمكن تغيير حساب الوكيل لأن الحساب مستخدم في القيود اليومية."
                );

                return state;
              }

              finalCode =
                generateChildAccountCode(
                  state.accounts,
                  newParent
                );

              const newAccount: Account =
                {
                  id: generateId(
                    "ACCOUNT"
                  ),

                  code: finalCode,

                  name:
                    newName ??
                    current.name,

                  type: newType,

                  parent:
                    newParent,

                  level:
                    parentAccount.level +
                    1,

                  description:
                    `حساب الوكيل: ${
                      newName ??
                      current.name
                    }`,
                };

              accounts =
                accounts.filter(
                  (account) =>
                    account.code !==
                    current.accountCode
                );

              accounts = [
                ...accounts,
                newAccount,
              ];
            } else if (
              current.accountCode &&
              newName &&
              newName !==
                current.name
            ) {
              accounts =
                accounts.map(
                  (account) =>
                    account.code ===
                    current.accountCode
                      ? {
                          ...account,
                          name: newName,
                          description:
                            `حساب الوكيل: ${newName}`,
                        }
                      : account
                );
            }

            return {
              agents:
                state.agents.map(
                  (agent) =>
                    agent.id === id
                      ? {
                          ...agent,
                          ...data,
                          name:
                            newName ??
                            agent.name,
                          accountCode:
                            finalCode,
                          accountName:
                            newName ??
                            agent.accountName,
                        }
                      : agent
                ),

              accounts,
            };
          }),

        deleteAgent: (id) =>
          set((state) => {
            const agent =
              state.agents.find(
                (item) =>
                  item.id === id
              );

            if (!agent) {
              return state;
            }

            if (
              agent.accountCode
            ) {
              const used =
                state.journalEntries.some(
                  (entry) =>
                    entry.lines.some(
                      (line) =>
                        line.accountCode ===
                        agent.accountCode
                    )
                );

              if (used) {
                console.error(
                  "لا يمكن حذف الوكيل لأن حسابه مستخدم في القيود اليومية."
                );

                return state;
              }
            }

            return {
              agents:
                state.agents.filter(
                  (item) =>
                    item.id !== id
                ),

              accounts:
                agent.accountCode
                  ? state.accounts.filter(
                      (account) =>
                        account.code !==
                        agent.accountCode
                    )
                  : state.accounts,
            };
          }),

        // ==================================================
        // المبيعات
        // ==================================================

        sales: [],

        addSale: (sale) =>
          set((state) => {
            const customer =
              state.customers.find(
                (item) =>
                  item.id ===
                  sale.customerId
              );

            if (!customer) {
              console.error(
                "العميل غير موجود."
              );

              return state;
            }

            if (
              !customer.accountCode
            ) {
              console.error(
                "العميل لا يملك حسابًا محاسبيًا."
              );

              return state;
            }

            const customerAccount =
              findAccount(
                state.accounts,
                customer.accountCode
              );

            if (!customerAccount) {
              console.error(
                "حساب العميل غير موجود."
              );

              return state;
            }

            const newSaleId =
              generateId(
                "SALE"
              );

            const newSale: Sale =
              {
                ...sale,

                id: newSaleId,

                accountCode:
                  customerAccount.code,

                accountName:
                  customerAccount.name,

                customerName:
                  customer.name,
              };

            const journal =
              createSaleJournalEntry(
                state.accounts,
                state.journalEntries,
                newSale,
                newSaleId
              );

            if (!journal) {
              return state;
            }

            return {
              sales: [
                ...state.sales,
                newSale,
              ],

              journalEntries: [
                ...state.journalEntries,
                journal,
              ],
            };
          }),

        updateSale: (
          id,
          data
        ) =>
          set((state) => {
            const current =
              state.sales.find(
                (sale) =>
                  sale.id === id
              );

            if (!current) {
              return state;
            }

            const updatedSale: Sale =
              {
                ...current,
                ...data,
              };

            if (
              data.customerId !==
              undefined
            ) {
              const customer =
                state.customers.find(
                  (item) =>
                    item.id ===
                    data.customerId
                );

              if (!customer) {
                console.error(
                  "العميل غير موجود."
                );

                return state;
              }

              if (
                !customer.accountCode
              ) {
                console.error(
                  "العميل لا يملك حسابًا محاسبيًا."
                );

                return state;
              }

              const account =
                findAccount(
                  state.accounts,
                  customer.accountCode
                );

              if (!account) {
                console.error(
                  "حساب العميل غير موجود."
                );

                return state;
              }

              updatedSale.customerName =
                customer.name;

              updatedSale.accountCode =
                account.code;

              updatedSale.accountName =
                account.name;
            }

            if (
              data.accountCode !==
              undefined
            ) {
              const account =
                findAccount(
                  state.accounts,
                  data.accountCode
                );

              if (!account) {
                console.error(
                  "الحساب المحاسبي غير موجود."
                );

                return state;
              }

              updatedSale.accountCode =
                account.code;

              updatedSale.accountName =
                account.name;
            }

            const oldJournal =
              state.journalEntries.find(
                (entry) =>
                  entry.reference ===
                  `SALE:${id}`
              );

            const entriesWithoutOld =
              state.journalEntries.filter(
                (entry) =>
                  entry.reference !==
                  `SALE:${id}`
              );

            const newJournal =
              createSaleJournalEntry(
                state.accounts,
                entriesWithoutOld,
                updatedSale,
                id
              );

            if (!newJournal) {
              return state;
            }

            return {
              sales:
                state.sales.map(
                  (sale) =>
                    sale.id === id
                      ? updatedSale
                      : sale
                ),

              journalEntries: [
                ...entriesWithoutOld,
                newJournal,
              ],
            };
          }),

        deleteSale: (id) =>
          set((state) => ({
            sales:
              state.sales.filter(
                (sale) =>
                  sale.id !== id
              ),

            journalEntries:
              state.journalEntries.filter(
                (entry) =>
                  entry.reference !==
                  `SALE:${id}`
              ),
          })),

        // ==================================================
        // المشتريات
        // ==================================================

        purchases: [],

        addPurchase: (purchase) =>
          set((state) => {
            const supplier =
              state.suppliers.find(
                (item) =>
                  item.id ===
                  purchase.supplierId
              );

            if (!supplier) {
              console.error(
                "المورد غير موجود."
              );

              return state;
            }

            if (
              !supplier.accountCode
            ) {
              console.error(
                "المورد لا يملك حسابًا محاسبيًا."
              );

              return state;
            }

            const supplierAccount =
              findAccount(
                state.accounts,
                supplier.accountCode
              );

            if (!supplierAccount) {
              console.error(
                "حساب المورد غير موجود."
              );

              return state;
            }

            const newPurchaseId =
              generateId(
                "PURCHASE"
              );

            const newPurchase: Purchase =
              {
                ...purchase,

                id: newPurchaseId,

                accountCode:
                  supplierAccount.code,

                accountName:
                  supplierAccount.name,

                supplierName:
                  supplier.name,
              };

            const journal =
              createPurchaseJournalEntry(
                state.accounts,
                state.journalEntries,
                newPurchase,
                newPurchaseId
              );

            if (!journal) {
              return state;
            }

            return {
              purchases: [
                ...state.purchases,
                newPurchase,
              ],

              journalEntries: [
                ...state.journalEntries,
                journal,
              ],
            };
          }),

        updatePurchase: (
          id,
          data
        ) =>
          set((state) => {
            const current =
              state.purchases.find(
                (purchase) =>
                  purchase.id === id
              );

            if (!current) {
              return state;
            }

            const updatedPurchase: Purchase =
              {
                ...current,
                ...data,
              };

            if (
              data.supplierId !==
              undefined
            ) {
              const supplier =
                state.suppliers.find(
                  (item) =>
                    item.id ===
                    data.supplierId
                );

              if (!supplier) {
                console.error(
                  "المورد غير موجود."
                );

                return state;
              }

              if (
                !supplier.accountCode
              ) {
                console.error(
                  "المورد لا يملك حسابًا محاسبيًا."
                );

                return state;
              }

              const account =
                findAccount(
                  state.accounts,
                  supplier.accountCode
                );

              if (!account) {
                console.error(
                  "حساب المورد غير موجود."
                );

                return state;
              }

              updatedPurchase.supplierName =
                supplier.name;

              updatedPurchase.accountCode =
                account.code;

              updatedPurchase.accountName =
                account.name;
            }

            if (
              data.accountCode !==
              undefined
            ) {
              const account =
                findAccount(
                  state.accounts,
                  data.accountCode
                );

              if (!account) {
                console.error(
                  "الحساب المحاسبي غير موجود."
                );

                return state;
              }

              updatedPurchase.accountCode =
                account.code;

              updatedPurchase.accountName =
                account.name;
            }

            const entriesWithoutOld =
              state.journalEntries.filter(
                (entry) =>
                  entry.reference !==
                  `PURCHASE:${id}`
              );

            const newJournal =
              createPurchaseJournalEntry(
                state.accounts,
                entriesWithoutOld,
                updatedPurchase,
                id
              );

            if (!newJournal) {
              return state;
            }

            return {
              purchases:
                state.purchases.map(
                  (purchase) =>
                    purchase.id === id
                      ? updatedPurchase
                      : purchase
                ),

              journalEntries: [
                ...entriesWithoutOld,
                newJournal,
              ],
            };
          }),

        deletePurchase: (id) =>
          set((state) => ({
            purchases:
              state.purchases.filter(
                (purchase) =>
                  purchase.id !== id
              ),

            journalEntries:
              state.journalEntries.filter(
                (entry) =>
                  entry.reference !==
                  `PURCHASE:${id}`
              ),
          })),

        // ==================================================
        // الحسابات
        // ==================================================

        accounts:
          createDefaultAccounts(),

        addAccount: (account) =>
          set((state) => {
            const cleanName =
              account.name.trim();

            if (!cleanName) {
              console.error(
                "اسم الحساب مطلوب."
              );

              return state;
            }

            const parentCode =
              account.parent?.trim() ||
              "";

            let parentAccount:
              | Account
              | undefined;

            if (parentCode) {
              parentAccount =
                findAccount(
                  state.accounts,
                  parentCode
                );

              if (!parentAccount) {
                console.error(
                  "الحساب الأب غير موجود."
                );

                return state;
              }

              if (
                parentAccount.type !==
                account.type
              ) {
                console.error(
                  "نوع الحساب لا يتطابق مع نوع الحساب الأب."
                );

                return state;
              }
            }

            const level =
              parentAccount
                ? parentAccount.level +
                  1
                : 0;

            const code =
              generateAccountCode(
                state.accounts,
                account.type,
                parentCode
              );

            const newAccount: Account =
              {
                id: generateId(
                  "ACCOUNT"
                ),

                code,

                name: cleanName,

                type:
                  account.type,

                parent:
                  parentCode,

                level,

                description:
                  account.description?.trim() ||
                  "",
              };

            return {
              accounts: [
                ...state.accounts,
                newAccount,
              ],
            };
          }),

        updateAccount: (
          id,
          data
        ) =>
          set((state) => {
            const current =
              state.accounts.find(
                (account) =>
                  account.id === id
              );

            if (!current) {
              return state;
            }

            const newParent =
              data.parent !==
              undefined
                ? data.parent.trim()
                : current.parent;

            const newType =
              data.type ??
              current.type;

            if (
              newParent ===
              current.code
            ) {
              console.error(
                "لا يمكن للحساب أن يكون أبًا لنفسه."
              );

              return state;
            }

            if (
              newParent &&
              isDescendant(
                state.accounts,
                current.code,
                newParent
              )
            ) {
              console.error(
                "لا يمكن نقل الحساب تحت أحد حساباته الفرعية."
              );

              return state;
            }

            let newLevel = 0;

            if (newParent) {
              const parent =
                findAccount(
                  state.accounts,
                  newParent
                );

              if (!parent) {
                console.error(
                  "الحساب الأب غير موجود."
                );

                return state;
              }

              if (
                parent.type !==
                newType
              ) {
                console.error(
                  "نوع الحساب لا يتطابق مع نوع الحساب الأب."
                );

                return state;
              }

              newLevel =
                parent.level + 1;
            }

            const safeData = {
              ...data,
              parent: newParent,
              type: newType,
              level: newLevel,
            };

            delete (
              safeData as Partial<Account>
            ).id;

            delete (
              safeData as Partial<Account>
            ).code;

            return {
              accounts:
                state.accounts.map(
                  (account) =>
                    account.id === id
                      ? {
                          ...account,
                          ...safeData,
                        }
                      : account
                ),
            };
          }),

        deleteAccount: (id) =>
          set((state) => {
            const account =
              state.accounts.find(
                (item) =>
                  item.id === id
              );

            if (!account) {
              return state;
            }

            const hasChildren =
              state.accounts.some(
                (item) =>
                  item.parent ===
                  account.code
              );

            if (hasChildren) {
              console.error(
                "لا يمكن حذف الحساب لأنه يحتوي على حسابات فرعية."
              );

              return state;
            }

            const usedInSales =
              state.sales.some(
                (sale) =>
                  sale.accountCode ===
                  account.code
              );

            if (usedInSales) {
              console.error(
                "لا يمكن حذف الحساب لأنه مستخدم في المبيعات."
              );

              return state;
            }

            const usedInPurchases =
              state.purchases.some(
                (purchase) =>
                  purchase.accountCode ===
                  account.code
              );

            if (usedInPurchases) {
              console.error(
                "لا يمكن حذف الحساب لأنه مستخدم في المشتريات."
              );

              return state;
            }

            const usedInJournal =
              state.journalEntries.some(
                (entry) =>
                  entry.lines.some(
                    (line) =>
                      line.accountCode ===
                      account.code
                  )
              );

            if (usedInJournal) {
              console.error(
                "لا يمكن حذف الحساب لأنه مستخدم في القيود اليومية."
              );

              return state;
            }

            const linkedCustomer =
              state.customers.some(
                (customer) =>
                  customer.accountCode ===
                  account.code
              );

            if (linkedCustomer) {
              console.error(
                "لا يمكن حذف الحساب لأنه مرتبط بعميل."
              );

              return state;
            }

            const linkedSupplier =
              state.suppliers.some(
                (supplier) =>
                  supplier.accountCode ===
                  account.code
              );

            if (linkedSupplier) {
              console.error(
                "لا يمكن حذف الحساب لأنه مرتبط بمورد."
              );

              return state;
            }

            const linkedAgent =
              state.agents.some(
                (agent) =>
                  agent.accountCode ===
                  account.code
              );

            if (linkedAgent) {
              console.error(
                "لا يمكن حذف الحساب لأنه مرتبط بوكيل."
              );

              return state;
            }

            return {
              accounts:
                state.accounts.filter(
                  (item) =>
                    item.id !== id
                ),
            };
          }),

        // ==================================================
        // القيود اليومية
        // ==================================================

        journalEntries: [],

        addJournalEntry: (entry) =>
          set((state) => {
            if (
              !entry.lines ||
              entry.lines.length < 2
            ) {
              console.error(
                "القيد يجب أن يحتوي على سطرين على الأقل."
              );

              return state;
            }

            if (
              !isJournalBalanced(
                entry.lines
              )
            ) {
              console.error(
                "لا يمكن حفظ قيد غير متوازن."
              );

              return state;
            }

            const totalDebit =
              entry.lines.reduce(
                (sum, line) =>
                  sum +
                  Number(
                    line.debit || 0
                  ),
                0
              );

            const totalCredit =
              entry.lines.reduce(
                (sum, line) =>
                  sum +
                  Number(
                    line.credit || 0
                  ),
                0
              );

            return {
              journalEntries: [
                ...state.journalEntries,
                {
                  ...entry,

                  id: generateId(
                    "JOURNAL"
                  ),

                  debit:
                    totalDebit,

                  credit:
                    totalCredit,
                },
              ],
            };
          }),

        updateJournalEntry: (
          id,
          data
        ) =>
          set((state) => {
            const current =
              state.journalEntries.find(
                (entry) =>
                  entry.id === id
              );

            if (!current) {
              return state;
            }

            const updated =
              {
                ...current,
                ...data,
              };

            if (
              data.lines &&
              !isJournalBalanced(
                data.lines
              )
            ) {
              console.error(
                "لا يمكن تعديل القيد إلى قيد غير متوازن."
              );

              return state;
            }

            const lines =
              updated.lines;

            const debit =
              lines.reduce(
                (sum, line) =>
                  sum +
                  Number(
                    line.debit || 0
                  ),
                0
              );

            const credit =
              lines.reduce(
                (sum, line) =>
                  sum +
                  Number(
                    line.credit || 0
                  ),
                0
              );

            return {
              journalEntries:
                state.journalEntries.map(
                  (entry) =>
                    entry.id === id
                      ? {
                          ...updated,
                          debit,
                          credit,
                        }
                      : entry
                ),
            };
          }),

        deleteJournalEntry: (
          id
        ) =>
          set((state) => ({
            journalEntries:
              state.journalEntries.filter(
                (entry) =>
                  entry.id !== id
              ),
          })),

        // ==================================================
        // مسح جميع البيانات
        // ==================================================

        clearStore: () =>
          set({
            products: [],
            customers: [],
            suppliers: [],
            agents: [],
            sales: [],
            purchases: [],
            accounts:
              createDefaultAccounts(),
            journalEntries: [],
          }),
      }),

      // ====================================================
      // Persist
      // ====================================================

      {
        name: "erp-storage",

        merge: (
          persistedState,
          currentState
        ) => {
          const persisted =
            persistedState as Partial<ERPStore>;

          // ----------------------------------------------
          // الحسابات
          // ----------------------------------------------

          let accounts =
            currentState.accounts;

          if (
            persisted.accounts &&
            persisted.accounts.length > 0
          ) {
            accounts =
              persisted.accounts;
          }

          // ----------------------------------------------
          // إضافة الحسابات الافتراضية المفقودة
          // ----------------------------------------------

          const defaultAccounts =
            createDefaultAccounts();

          for (const defaultAccount of defaultAccounts) {
            const exists =
              accounts.some(
                (account) =>
                  account.code ===
                  defaultAccount.code
              );

            if (!exists) {
              accounts = [
                ...accounts,
                defaultAccount,
              ];
            }
          }

          // ----------------------------------------------
          // البيانات القديمة
          // ----------------------------------------------

          return {
            ...currentState,

            ...persisted,

            accounts,

            products:
              persisted.products ??
              currentState.products,

            customers:
              persisted.customers ??
              currentState.customers,

            suppliers:
              persisted.suppliers ??
              currentState.suppliers,

            agents:
              persisted.agents ??
              currentState.agents,

            sales:
              persisted.sales ??
              currentState.sales,

            purchases:
              persisted.purchases ??
              currentState.purchases,

            journalEntries:
              persisted.journalEntries ??
              currentState.journalEntries,
          };
        },
      }
    )
  );