import { create } from "zustand";
import { persist } from "zustand/middleware";

// ======================================================
// أنواع البيانات
// ======================================================

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

  // الحساب المحاسبي المرتبط بالفاتورة
  // يجب أن يكون حسابًا فرعيًا
  accountCode: string;
  accountName: string;

  paymentMethod: "cash" | "bank" | "credit";

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

  // الحساب المحاسبي المرتبط بالفاتورة
  // يجب أن يكون حسابًا فرعيًا
  accountCode: string;
  accountName: string;

  paymentMethod: "cash" | "bank" | "credit";

  items: PurchaseItem[];

  subtotal: number;
  discount: number;
  tax: number;
  total: number;

  notes?: string;
}

// ======================================================
// الحسابات المحاسبية
// ======================================================

export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense";

export interface Account {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  parent: string;
  level: number;
  description?: string;
}

// ======================================================
// بيانات تعديل الحساب
// منع تعديل id و code
// ======================================================

export type AccountUpdateData = Partial<
  Omit<Account, "id" | "code">
>;

// ======================================================
// القيود اليومية
// ======================================================

export interface JournalLine {
  id: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

export type JournalStatus = "posted" | "draft";

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
// توليد كود الأصناف تلقائيًا
// ======================================================

const PRODUCT_BASE_CODE = 1001;

function generateProductCode(
  products: Product[]
): string {
  const usedCodes = products
    .map((product) => Number(product.code))
    .filter((code) => Number.isFinite(code));

  // أول صنف
  if (usedCodes.length === 0) {
    return String(PRODUCT_BASE_CODE);
  }

  // أعلى رقم موجود
  let nextCode = Math.max(...usedCodes) + 1;

  // التأكد من عدم وجود تكرار
  while (
    products.some(
      (product) =>
        Number(product.code) === nextCode
    )
  ) {
    nextCode++;
  }

  return String(nextCode);
}

// ======================================================
// أرقام الحسابات الرئيسية
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
// توليد رقم الحساب الرئيسي
//
// الأصول:
// 1000
// 1100
// 1200
//
// الالتزامات:
// 2000
// 2100
// 2200
//
// ======================================================

function generateRootAccountCode(
  accounts: Account[],
  type: AccountType
): string {
  const baseCode =
    ROOT_ACCOUNT_BASE_CODES[type];

  const rootAccounts = accounts.filter(
    (account) =>
      account.level === 0 &&
      account.type === type &&
      !account.parent
  );

  if (rootAccounts.length === 0) {
    return baseCode.toString();
  }

  const usedCodes = rootAccounts
    .map((account) => Number(account.code))
    .filter((code) => Number.isFinite(code));

  let nextCode =
    Math.max(...usedCodes) + 100;

  // التأكد من عدم التكرار
  while (
    accounts.some(
      (account) =>
        Number(account.code) ===
        nextCode
    )
  ) {
    nextCode += 100;
  }

  return nextCode.toString();
}

// ======================================================
// توليد رقم الحساب الفرعي
//
// الأب 1000
//
// 1001
// 1002
// 1003
//
// ======================================================

function generateChildAccountCode(
  accounts: Account[],
  parentCode: string
): string {
  const parentAccount = accounts.find(
    (account) =>
      account.code === parentCode
  );

  if (!parentAccount) {
    throw new Error(
      "الحساب الأب غير موجود."
    );
  }

  // الحساب الأب يجب أن يكون رئيسيًا
  if (parentAccount.level !== 0) {
    throw new Error(
      "لا يمكن استخدام حساب فرعي كحساب أب."
    );
  }

  const children = accounts.filter(
    (account) =>
      account.parent === parentCode
  );

  const parentNumber =
    Number(parentCode);

  if (!Number.isFinite(parentNumber)) {
    throw new Error(
      "رقم الحساب الأب غير صحيح."
    );
  }

  // أول حساب فرعي
  if (children.length === 0) {
    return String(parentNumber + 1);
  }

  const childNumbers = children
    .map((account) => Number(account.code))
    .filter((code) => Number.isFinite(code));

  let nextCode =
    Math.max(...childNumbers) + 1;

  // التأكد من عدم التكرار
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
// توليد رقم الحساب
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
// إنشاء ID آمن
// ======================================================

function generateId(
  prefix: string
): string {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

// ======================================================
// Store Interface
// ======================================================

interface ERPStore {
  // ====================================================
  // المنتجات
  // ====================================================

  products: Product[];

  addProduct: (
    product: Omit<Product, "id" | "code">
  ) => void;

  updateProduct: (
    id: string,
    data: Partial<
      Omit<Product, "id" | "code">
    >
  ) => void;

  deleteProduct: (
    id: string
  ) => void;

  // ====================================================
  // العملاء
  // ====================================================

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

  // ====================================================
  // الموردون
  // ====================================================

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

  // ====================================================
  // المبيعات
  // ====================================================

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

  // ====================================================
  // المشتريات
  // ====================================================

  purchases: Purchase[];

  addPurchase: (
    purchase: Omit<Purchase, "id">
  ) => void;

  updatePurchase: (
    id: string,
    data: Partial<Purchase>
  ) => void;

  deletePurchase: (
    id: string
  ) => void;

  // ====================================================
  // الحسابات
  // ====================================================

  accounts: Account[];

  addAccount: (
    account: Omit<Account, "id" | "code">
  ) => void;

  updateAccount: (
    id: string,
    data: AccountUpdateData
  ) => void;

  deleteAccount: (
    id: string
  ) => void;

  // ====================================================
  // القيود اليومية
  // ====================================================

  journalEntries: JournalEntry[];

  addJournalEntry: (
    entry: Omit<JournalEntry, "id">
  ) => void;

  updateJournalEntry: (
    id: string,
    data: Partial<JournalEntry>
  ) => void;

  deleteJournalEntry: (
    id: string
  ) => void;

  // ====================================================
  // مسح جميع البيانات
  // ====================================================

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

        // --------------------------------------------------
        // إضافة صنف
        //
        // code يتم إنشاؤه تلقائيًا
        // --------------------------------------------------

        addProduct: (product) =>
          set((state) => {
            const generatedCode =
              generateProductCode(
                state.products
              );

            const newProduct: Product = {
              id: generateId("PRODUCT"),

              code: generatedCode,

              name: product.name.trim(),

              unit: product.unit.trim(),
            };

            return {
              ...state,

              products: [
                ...state.products,
                newProduct,
              ],
            };
          }),

        // --------------------------------------------------
        // تعديل الصنف
        //
        // code لا يمكن تغييره
        // --------------------------------------------------

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
              ...state,

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

        // --------------------------------------------------
        // حذف الصنف
        // --------------------------------------------------

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
          set((state) => ({
            customers: [
              ...state.customers,
              {
                ...customer,
                id: generateId("CUSTOMER"),
              },
            ],
          })),

        updateCustomer: (
          id,
          data
        ) =>
          set((state) => ({
            customers:
              state.customers.map(
                (customer) =>
                  customer.id === id
                    ? {
                        ...customer,
                        ...data,
                      }
                    : customer
              ),
          })),

        deleteCustomer: (id) =>
          set((state) => ({
            customers:
              state.customers.filter(
                (customer) =>
                  customer.id !== id
              ),
          })),

        // ==================================================
        // الموردون
        // ==================================================

        suppliers: [],

        addSupplier: (supplier) =>
          set((state) => ({
            suppliers: [
              ...state.suppliers,
              {
                ...supplier,
                id: generateId("SUPPLIER"),
              },
            ],
          })),

        updateSupplier: (
          id,
          data
        ) =>
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
          })),

        deleteSupplier: (id) =>
          set((state) => ({
            suppliers:
              state.suppliers.filter(
                (supplier) =>
                  supplier.id !== id
              ),
          })),

        // ==================================================
        // المبيعات
        // ==================================================

        sales: [],

        // --------------------------------------------------
        // إضافة فاتورة مبيعات
        //
        // الحساب يجب أن يكون فرعيًا
        // --------------------------------------------------

        addSale: (sale) =>
          set((state) => {
            const account =
              state.accounts.find(
                (item) =>
                  item.code ===
                  sale.accountCode
              );

            if (!account) {
              console.error(
                "لا يمكن إضافة فاتورة المبيعات: الحساب غير موجود."
              );

              return state;
            }

            if (account.level === 0) {
              console.error(
                "لا يمكن استخدام حساب رئيسي في فاتورة المبيعات."
              );

              return state;
            }

            const newSale: Sale = {
              ...sale,

              id: generateId("SALE"),

              accountCode:
                account.code,

              accountName:
                account.name,
            };

            return {
              ...state,

              sales: [
                ...state.sales,
                newSale,
              ],
            };
          }),

        // --------------------------------------------------
        // تعديل فاتورة مبيعات
        // --------------------------------------------------

        updateSale: (
          id,
          data
        ) =>
          set((state) => {
            const currentSale =
              state.sales.find(
                (sale) =>
                  sale.id === id
              );

            if (!currentSale) {
              return state;
            }

            let updatedData = {
              ...data,
            };

            // إذا تم تغيير الحساب
            if (
              data.accountCode !==
              undefined
            ) {
              const account =
                state.accounts.find(
                  (item) =>
                    item.code ===
                    data.accountCode
                );

              if (!account) {
                console.error(
                  "الحساب المحاسبي غير موجود."
                );

                return state;
              }

              if (account.level === 0) {
                console.error(
                  "لا يمكن استخدام حساب رئيسي في فاتورة المبيعات."
                );

                return state;
              }

              updatedData = {
                ...updatedData,
                accountCode:
                  account.code,
                accountName:
                  account.name,
              };
            }

            return {
              ...state,

              sales:
                state.sales.map(
                  (sale) =>
                    sale.id === id
                      ? {
                          ...sale,
                          ...updatedData,
                        }
                      : sale
                ),
            };
          }),

        // --------------------------------------------------
        // حذف فاتورة مبيعات
        // --------------------------------------------------

        deleteSale: (id) =>
          set((state) => ({
            sales:
              state.sales.filter(
                (sale) =>
                  sale.id !== id
              ),
          })),

        // ==================================================
        // المشتريات
        // ==================================================

        purchases: [],

        // --------------------------------------------------
        // إضافة فاتورة مشتريات
        //
        // الحساب يجب أن يكون فرعيًا
        // --------------------------------------------------

        addPurchase: (purchase) =>
          set((state) => {
            const account =
              state.accounts.find(
                (item) =>
                  item.code ===
                  purchase.accountCode
              );

            if (!account) {
              console.error(
                "لا يمكن إضافة فاتورة المشتريات: الحساب غير موجود."
              );

              return state;
            }

            if (account.level === 0) {
              console.error(
                "لا يمكن استخدام حساب رئيسي في فاتورة المشتريات."
              );

              return state;
            }

            const newPurchase: Purchase =
              {
                ...purchase,

                id: generateId(
                  "PURCHASE"
                ),

                accountCode:
                  account.code,

                accountName:
                  account.name,
              };

            return {
              ...state,

              purchases: [
                ...state.purchases,
                newPurchase,
              ],
            };
          }),

        // --------------------------------------------------
        // تعديل فاتورة مشتريات
        // --------------------------------------------------

        updatePurchase: (
          id,
          data
        ) =>
          set((state) => {
            const currentPurchase =
              state.purchases.find(
                (purchase) =>
                  purchase.id === id
              );

            if (!currentPurchase) {
              return state;
            }

            let updatedData = {
              ...data,
            };

            // إذا تم تغيير الحساب
            if (
              data.accountCode !==
              undefined
            ) {
              const account =
                state.accounts.find(
                  (item) =>
                    item.code ===
                    data.accountCode
                );

              if (!account) {
                console.error(
                  "الحساب المحاسبي غير موجود."
                );

                return state;
              }

              if (account.level === 0) {
                console.error(
                  "لا يمكن استخدام حساب رئيسي في فاتورة المشتريات."
                );

                return state;
              }

              updatedData = {
                ...updatedData,
                accountCode:
                  account.code,
                accountName:
                  account.name,
              };
            }

            return {
              ...state,

              purchases:
                state.purchases.map(
                  (purchase) =>
                    purchase.id === id
                      ? {
                          ...purchase,
                          ...updatedData,
                        }
                      : purchase
                ),
            };
          }),

        // --------------------------------------------------
        // حذف فاتورة مشتريات
        // --------------------------------------------------

        deletePurchase: (id) =>
          set((state) => ({
            purchases:
              state.purchases.filter(
                (purchase) =>
                  purchase.id !== id
              ),
          })),

        // ==================================================
        // الحسابات
        // ==================================================

        accounts: [],

        // --------------------------------------------------
        // إضافة حساب
        //
        // code لا يتم إدخاله من المستخدم
        // يتم إنشاؤه تلقائيًا
        // --------------------------------------------------

        addAccount: (account) =>
          set((state) => {
            const parentCode =
              account.parent?.trim() ||
              "";

            // ----------------------------------------------
            // البحث عن الأب
            // ----------------------------------------------

            const parentAccount =
              parentCode
                ? state.accounts.find(
                    (item) =>
                      item.code ===
                      parentCode
                  )
                : undefined;

            // ----------------------------------------------
            // إذا كان هناك أب يجب أن يكون موجودًا
            // ----------------------------------------------

            if (
              parentCode &&
              !parentAccount
            ) {
              console.error(
                "لا يمكن إضافة الحساب: الحساب الأب غير موجود."
              );

              return state;
            }

            // ----------------------------------------------
            // الأب يجب أن يكون رئيسيًا
            // ----------------------------------------------

            if (
              parentAccount &&
              parentAccount.level !== 0
            ) {
              console.error(
                "لا يمكن استخدام حساب فرعي كحساب أب."
              );

              return state;
            }

            // ----------------------------------------------
            // نوع الحساب يجب أن يطابق الأب
            // ----------------------------------------------

            if (
              parentAccount &&
              parentAccount.type !==
                account.type
            ) {
              console.error(
                "نوع الحساب لا يتطابق مع نوع الحساب الأب."
              );

              return state;
            }

            // ----------------------------------------------
            // المستوى
            // ----------------------------------------------

            const level =
              parentAccount
                ? 1
                : 0;

            // ----------------------------------------------
            // الرقم التلقائي
            // ----------------------------------------------

            const generatedCode =
              generateAccountCode(
                state.accounts,
                account.type,
                parentCode
              );

            // ----------------------------------------------
            // إنشاء الحساب
            // ----------------------------------------------

            const newAccount: Account = {
              id: generateId(
                "ACCOUNT"
              ),

              code: generatedCode,

              name: account.name.trim(),

              type: account.type,

              parent: parentCode,

              level,

              description:
                account.description?.trim() ||
                "",
            };

            return {
              ...state,

              accounts: [
                ...state.accounts,
                newAccount,
              ],
            };
          }),

        // --------------------------------------------------
        // تعديل حساب
        // --------------------------------------------------

        updateAccount: (
          id,
          data
        ) =>
          set((state) => {
            const currentAccount =
              state.accounts.find(
                (account) =>
                  account.id === id
              );

            if (!currentAccount) {
              return state;
            }

            // ----------------------------------------------
            // منع الحساب من أن يجعل نفسه أبًا
            // ----------------------------------------------

            if (
              data.parent !==
                undefined &&
              data.parent ===
                currentAccount.code
            ) {
              console.error(
                "لا يمكن للحساب أن يكون أبًا لنفسه."
              );

              return state;
            }

            // ----------------------------------------------
            // التحقق من الأب الجديد
            // ----------------------------------------------

            if (
              data.parent !==
                undefined &&
              data.parent !== ""
            ) {
              const parentAccount =
                state.accounts.find(
                  (account) =>
                    account.code ===
                    data.parent
                );

              if (!parentAccount) {
                console.error(
                  "الحساب الأب غير موجود."
                );

                return state;
              }

              if (
                parentAccount.level !==
                0
              ) {
                console.error(
                  "لا يمكن استخدام حساب فرعي كحساب أب."
                );

                return state;
              }

              const newType =
                data.type ??
                currentAccount.type;

              if (
                parentAccount.type !==
                newType
              ) {
                console.error(
                  "نوع الحساب لا يتطابق مع نوع الحساب الأب."
                );

                return state;
              }
            }

            // ----------------------------------------------
            // منع تغيير الكود
            // ----------------------------------------------

            const safeData = {
              ...data,
            };

            delete (
              safeData as Partial<Account>
            ).id;

            delete (
              safeData as Partial<Account>
            ).code;

            return {
              ...state,

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

        // --------------------------------------------------
        // حذف حساب
        // --------------------------------------------------

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

            // ----------------------------------------------
            // منع حذف حساب له أبناء
            // ----------------------------------------------

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

            // ----------------------------------------------
            // منع حذفه إذا كان في المبيعات
            // ----------------------------------------------

            const usedInSales =
              state.sales.some(
                (sale) =>
                  sale.accountCode ===
                  account.code
              );

            if (usedInSales) {
              console.error(
                "لا يمكن حذف الحساب لأنه مستخدم في فواتير المبيعات."
              );

              return state;
            }

            // ----------------------------------------------
            // منع حذفه إذا كان في المشتريات
            // ----------------------------------------------

            const usedInPurchases =
              state.purchases.some(
                (purchase) =>
                  purchase.accountCode ===
                  account.code
              );

            if (usedInPurchases) {
              console.error(
                "لا يمكن حذف الحساب لأنه مستخدم في فواتير المشتريات."
              );

              return state;
            }

            // ----------------------------------------------
            // منع حذفه إذا كان في القيود
            // ----------------------------------------------

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

            return {
              ...state,

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

        // --------------------------------------------------
        // إضافة قيد
        // --------------------------------------------------

        addJournalEntry: (entry) =>
          set((state) => ({
            journalEntries: [
              ...state.journalEntries,
              {
                ...entry,

                id: generateId(
                  "JOURNAL"
                ),
              },
            ],
          })),

        // --------------------------------------------------
        // تعديل قيد
        // --------------------------------------------------

        updateJournalEntry: (
          id,
          data
        ) =>
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
          })),

        // --------------------------------------------------
        // حذف قيد
        // --------------------------------------------------

        deleteJournalEntry: (id) =>
          set((state) => ({
            journalEntries:
              state.journalEntries.filter(
                (entry) =>
                  entry.id !== id
              ),
          })),

        // ==================================================
        // مسح جميع بيانات النظام
        // ==================================================

        clearStore: () =>
          set({
            products: [],
            customers: [],
            suppliers: [],
            sales: [],
            purchases: [],
            accounts: [],
            journalEntries: [],
          }),
      }),

      {
        name: "erp-storage",
      }
    )
  );