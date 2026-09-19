"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// ==================================================
// أنواع الدفع
// ==================================================

export type PaymentMethod =
  | "cash"
  | "bank"
  | "credit";

// ==================================================
// الأصناف
// ==================================================

export interface Product {
  id: string;
  code: number;
  name: string;
  unit: string;
}

// ==================================================
// العملاء
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
// الموردين
// ==================================================

export interface Supplier {
  id: string;
  name: string;

  phone?: string;
  address?: string;
  balance?: number;

  // الحساب المحاسبي المرتبط بالمورد
  accountCode?: string;
  accountName?: string;
}

// ==================================================
// حسابات البنوك والصرافة
// ==================================================

export interface BankAccount {
  id: string;

  // رقم الحساب المحاسبي
  code: string;

  // اسم البنك أو الصرافة
  name: string;

  balance?: number;
}

// ==================================================
// بنود المبيعات
// ==================================================

export interface SaleItem {
  productId: string;
  productName: string;

  quantity: number;
  price: number;

  discount: number;
  tax: number;

  total: number;
}

// ==================================================
// بنود المشتريات
// ==================================================

export interface PurchaseItem {
  productId: string;
  productName: string;

  quantity: number;
  price: number;

  discount: number;
  tax: number;

  total: number;
}

// ==================================================
// المبيعات
// ==================================================

export interface Sale {
  id: string;

  invoiceNumber: string;
  date: string;

  customerId: string;
  customerName: string;

  // الحساب المحاسبي المرتبط بالبيع
  accountCode?: string;
  accountName?: string;

  paymentMethod: PaymentMethod;

  items: SaleItem[];

  subtotal: number;
  discount: number;
  tax: number;
  total: number;

  notes?: string;
}

// ==================================================
// المشتريات
// ==================================================

export interface Purchase {
  id: string;

  invoiceNumber: string;
  date: string;

  supplierId: string;
  supplierName: string;

  // الحساب المحاسبي المرتبط بالشراء
  accountCode?: string;
  accountName?: string;

  paymentMethod: PaymentMethod;

  items: PurchaseItem[];

  subtotal: number;
  discount: number;
  tax: number;
  total: number;

  hasTax: boolean;
  taxRate: number;

  notes?: string;
}

// ==================================================
// المخزون
// ==================================================

export interface InventoryItem {
  productId: string;
  productCode: number;
  productName: string;

  unit: string;

  purchaseQuantity: number;
  saleQuantity: number;

  quantity: number;

  averagePurchasePrice: number;
  inventoryValue: number;
}

// ==================================================
// فاتورة المبيعات الجديدة
// ==================================================

export interface NewSale {
  invoiceNumber: string;
  date: string;

  customerId: string;
  customerName: string;

  paymentMethod: PaymentMethod;

  accountCode: string;
  accountName: string;

  items: SaleItem[];

  subtotal: number;
  discount: number;
  tax: number;
  total: number;

  notes: string;
}

// ==================================================
// ثوابت الصندوق
// ==================================================

export const CASH_CUSTOMER_ID =
  "CASH-CUSTOMER";

export const CASH_ACCOUNT_CODE =
  "1002";

export const CASH_ACCOUNT_NAME =
  "الصندوق";

// ==================================================
// إنشاء حساب الصندوق
// ==================================================

const createCashCustomer = (): Customer => {
  return {
    id: CASH_CUSTOMER_ID,

    name: CASH_ACCOUNT_NAME,

    phone: "",
    address: "",

    balance: 0,

    accountCode:
      CASH_ACCOUNT_CODE,

    accountName:
      CASH_ACCOUNT_NAME,
  };
};

// ==================================================
// الحسابات البنكية الافتراضية
// ==================================================

const createDefaultBankAccounts =
  (): BankAccount[] => {
    return [
      {
        id: "bank-1001",
        code: "1001",
        name: "بنك الكريمي ",
        balance: 0,
      },

      {
        id: "bank-1002",
        code: "1002",
        name: "العامري للصرافة",
        balance: 0,
      },

      {
        id: "bank-1003",
        code: "1003",
        name: "العروي للصرافة",
        balance: 0,
      },

      {
        id: "bank-1004",
        code: "1004",
        name: "الفروي للصرافة",
        balance: 0,
      },

      {
        id: "bank-1005",
        code: "1005",
        name: "النجم للصرافة",
        balance: 0,
      },
    ];
  };

// ==================================================
// إنشاء فاتورة مبيعات جديدة
// ==================================================

const createNewSale = (): NewSale => {
  return {
    invoiceNumber: "",

    date: new Date()
      .toISOString()
      .split("T")[0],

    customerId: "",

    customerName: "",

    paymentMethod: "cash",

    accountCode:
      CASH_ACCOUNT_CODE,

    accountName:
      CASH_ACCOUNT_NAME,

    items: [],

    subtotal: 0,
    discount: 0,
    tax: 0,
    total: 0,

    notes: "",
  };
};

// ==================================================
// إنشاء ID
// ==================================================

const createId = (
  prefix: string
) => {
  return `${prefix}-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 8)}`;
};

// ==================================================
// Zustand Store Interface
// ==================================================

interface ERPStore {
  // ==================================================
  // البيانات
  // ==================================================

  products: Product[];

  customers: Customer[];

  suppliers: Supplier[];

  bankAccounts: BankAccount[];

  sales: Sale[];

  purchases: Purchase[];

  newSale: NewSale;

  // ==================================================
  // فاتورة البيع المؤقتة
  // ==================================================

  setNewSale: (
    data: Partial<NewSale>
  ) => void;

  resetNewSale: () => void;

  // ==================================================
  // المنتجات
  // ==================================================

  addProduct: (
    product: Omit<
      Product,
      "id" | "code"
    >
  ) => Product;

  updateProduct: (
    id: string,
    data: Partial<
      Omit<Product, "id" | "code">
    >
  ) => void;

  deleteProduct: (
    id: string
  ) => void;

  // ==================================================
  // العملاء
  // ==================================================

  addCustomer: (
    customer: Omit<Customer, "id">
  ) => Customer;

  updateCustomer: (
    id: string,
    data: Partial<
      Omit<Customer, "id">
    >
  ) => void;

  deleteCustomer: (
    id: string
  ) => void;

  // ==================================================
  // الموردين
  // ==================================================

  addSupplier: (
    supplier: Omit<Supplier, "id">
  ) => Supplier;

  updateSupplier: (
    id: string,
    data: Partial<
      Omit<Supplier, "id">
    >
  ) => void;

  deleteSupplier: (
    id: string
  ) => void;

  // ==================================================
  // حسابات البنك
  // ==================================================

  addBankAccount: (
    account: Omit<BankAccount, "id">
  ) => BankAccount;

  updateBankAccount: (
    id: string,
    data: Partial<
      Omit<BankAccount, "id">
    >
  ) => void;

  deleteBankAccount: (
    id: string
  ) => void;

  // ==================================================
  // المبيعات
  // ==================================================

  addSale: (
    sale: Omit<Sale, "id">
  ) => Sale;

  updateSale: (
    id: string,
    sale: Partial<
      Omit<Sale, "id">
    >
  ) => void;

  deleteSale: (
    id: string
  ) => void;

  // ==================================================
  // المشتريات
  // ==================================================

  addPurchase: (
    purchase: Omit<Purchase, "id">
  ) => Purchase;

  updatePurchase: (
    id: string,
    purchase: Partial<
      Omit<Purchase, "id">
    >
  ) => void;

  deletePurchase: (
    id: string
  ) => void;

  // ==================================================
  // المخزون
  // ==================================================

  getInventory: () => InventoryItem[];

  getProductQuantity: (
    productId: string
  ) => number;

  // ==================================================
  // تنظيف البيانات
  // ==================================================

  clearStore: () => void;
}

// ==================================================
// إنشاء Zustand
// ==================================================

export const useERPStore =
  create<ERPStore>()(
    persist(
      (set, get) => ({

        // ==================================================
        // البيانات الافتراضية
        // ==================================================

        products: [],

        // ==================================================
        // حسابات العملاء
        // ==================================================

        customers: [

          {
            id: "customer-001",
            name:
              "احمد محمد احمد العيشي",

            phone: "",

            address: "",

            balance: 0,

            accountCode: "1001",

            accountName:
              "احمد محمد احمد العيشي",
          },

          {
            id: "customer-002",

            name:
              "محمد علي صالح",

            phone: "",

            address: "",

            balance: 0,

            accountCode: "1002",

            accountName:
              "محمد علي صالح",
          },

          {
            id: "customer-003",

            name:
              "عبدالله احمد",

            phone: "",

            address: "",

            balance: 0,

            accountCode: "1003",

            accountName:
              "عبدالله احمد",
          },

          // الصندوق
          createCashCustomer(),
        ],

        // ==================================================
        // الموردين
        // ==================================================

        suppliers: [],

        // ==================================================
        // حسابات البنك
        // ==================================================

        bankAccounts:
          createDefaultBankAccounts(),

        // ==================================================
        // المبيعات
        // ==================================================

        sales: [],

        // ==================================================
        // المشتريات
        // ==================================================

        purchases: [],

        // ==================================================
        // الفاتورة الجديدة
        // ==================================================

        newSale:
          createNewSale(),

        // ==================================================
        // تحديث فاتورة البيع الجديدة
        // ==================================================

        setNewSale: (data) => {

          set((state) => ({
            ...state,

            newSale: {
              ...state.newSale,

              ...data,
            },
          }));

        },

        // ==================================================
        // إعادة فاتورة البيع للحالة الافتراضية
        // ==================================================

        resetNewSale: () => {

          set((state) => ({
            ...state,

            newSale:
              createNewSale(),
          }));

        },

        // ==================================================
        // المنتجات
        // ==================================================

        addProduct: (product) => {

          let newProduct:
            Product;

          set((state) => {

            const usedCodes =
              state.products
                .map(
                  (item) =>
                    Number(
                      item.code
                    )
                )
                .filter(
                  (code) =>
                    Number.isFinite(
                      code
                    )
                );

            const maxCode =
              usedCodes.length > 0
                ? Math.max(
                    ...usedCodes
                  )
                : 1000;

            newProduct = {
              id: createId(
                "product"
              ),

              code:
                maxCode + 1,

              ...product,
            };

            return {
              ...state,

              products: [
                ...state.products,

                newProduct,
              ],
            };

          });

          return newProduct!;
        },

        // ==================================================
        // تعديل منتج
        // ==================================================

        updateProduct: (
          id,
          data
        ) => {

          set((state) => ({
            ...state,

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

        // ==================================================
        // حذف منتج
        // ==================================================

        deleteProduct: (id) => {

          set((state) => ({
            ...state,

            products:
              state.products.filter(
                (product) =>
                  product.id !== id
              ),
          }));

        },

        // ==================================================
        // إضافة عميل
        // ==================================================

        addCustomer: (
          customer
        ) => {

          const newCustomer:
            Customer = {
            id: createId(
              "customer"
            ),

            ...customer,
          };

          set((state) => ({
            ...state,

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

        updateCustomer: (
          id,
          data
        ) => {

          set((state) => ({
            ...state,

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
          }));

        },

        // ==================================================
        // حذف عميل
        // ==================================================

        deleteCustomer: (
          id
        ) => {

          // لا يمكن حذف الصندوق
          if (
            id ===
            CASH_CUSTOMER_ID
          ) {
            return;
          }

          set((state) => ({
            ...state,

            customers:
              state.customers.filter(
                (customer) =>
                  customer.id !== id
              ),
          }));

        },

        // ==================================================
        // إضافة مورد
        // ==================================================

        addSupplier: (
          supplier
        ) => {

          const newSupplier:
            Supplier = {
            id: createId(
              "supplier"
            ),

            ...supplier,
          };

          set((state) => ({
            ...state,

            suppliers: [
              ...state.suppliers,

              newSupplier,
            ],
          }));

          return newSupplier;
        },

        // ==================================================
        // تعديل مورد
        // ==================================================

        updateSupplier: (
          id,
          data
        ) => {

          set((state) => ({
            ...state,

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

        // ==================================================
        // حذف مورد
        // ==================================================

        deleteSupplier: (
          id
        ) => {

          set((state) => ({
            ...state,

            suppliers:
              state.suppliers.filter(
                (supplier) =>
                  supplier.id !== id
              ),
          }));

        },

        // ==================================================
        // إضافة حساب بنك
        // ==================================================

        addBankAccount: (
          account
        ) => {

          const newAccount:
            BankAccount = {
            id: createId(
              "bank"
            ),

            ...account,
          };

          set((state) => ({
            ...state,

            bankAccounts: [
              ...state.bankAccounts,

              newAccount,
            ],
          }));

          return newAccount;
        },

        // ==================================================
        // تعديل حساب بنك
        // ==================================================

        updateBankAccount: (
          id,
          data
        ) => {

          set((state) => ({
            ...state,

            bankAccounts:
              state.bankAccounts.map(
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

        // ==================================================
        // حذف حساب بنك
        // ==================================================

        deleteBankAccount: (
          id
        ) => {

          set((state) => ({
            ...state,

            bankAccounts:
              state.bankAccounts.filter(
                (account) =>
                  account.id !== id
              ),
          }));

        },

        // ==================================================
        // إضافة فاتورة مبيعات
        // ==================================================

        addSale: (sale) => {

          const newSale:
            Sale = {

            id: createId(
              "sale"
            ),

            ...sale,

            // إذا كانت الفاتورة نقدية
            // يتم ربطها بالصندوق تلقائيًا
            ...(sale.paymentMethod ===
            "cash"
              ? {

                  customerId:
                    CASH_CUSTOMER_ID,

                  customerName:
                    CASH_ACCOUNT_NAME,

                  accountCode:
                    CASH_ACCOUNT_CODE,

                  accountName:
                    CASH_ACCOUNT_NAME,

                }
              : {}),
          };

          set((state) => ({
            ...state,

            sales: [
              ...state.sales,

              newSale,
            ],
          }));

          return newSale;
        },

        // ==================================================
        // تعديل فاتورة مبيعات
        // ==================================================

        updateSale: (
          id,
          sale
        ) => {

          set((state) => ({

            ...state,

            sales:
              state.sales.map(
                (item) => {

                  if (
                    item.id !== id
                  ) {
                    return item;
                  }

                  const updatedSale:
                    Sale = {

                    ...item,

                    ...sale,
                  };

                  if (
                    updatedSale.paymentMethod ===
                    "cash"
                  ) {

                    updatedSale.customerId =
                      CASH_CUSTOMER_ID;

                    updatedSale.customerName =
                      CASH_ACCOUNT_NAME;

                    updatedSale.accountCode =
                      CASH_ACCOUNT_CODE;

                    updatedSale.accountName =
                      CASH_ACCOUNT_NAME;
                  }

                  return updatedSale;
                }
              ),

          }));

        },

        // ==================================================
        // حذف فاتورة مبيعات
        // ==================================================

        deleteSale: (id) => {

          set((state) => ({
            ...state,

            sales:
              state.sales.filter(
                (sale) =>
                  sale.id !== id
              ),
          }));

        },

        // ==================================================
        // إضافة فاتورة مشتريات
        // ==================================================

        addPurchase: (
          purchase
        ) => {

          const newPurchase:
            Purchase = {

            id: createId(
              "purchase"
            ),

            ...purchase,

            hasTax:
              purchase.hasTax ??
              Number(
                purchase.tax || 0
              ) > 0,

            taxRate:
              purchase.taxRate ??
              0,
          };

          set((state) => ({
            ...state,

            purchases: [
              ...state.purchases,

              newPurchase,
            ],
          }));

          return newPurchase;
        },

        // ==================================================
        // تعديل فاتورة مشتريات
        // ==================================================

        updatePurchase: (
          id,
          purchase
        ) => {

          set((state) => ({
            ...state,

            purchases:
              state.purchases.map(
                (item) =>
                  item.id === id
                    ? {
                        ...item,
                        ...purchase,
                      }
                    : item
              ),
          }));

        },

        // ==================================================
        // حذف فاتورة مشتريات
        // ==================================================

        deletePurchase: (
          id
        ) => {

          set((state) => ({
            ...state,

            purchases:
              state.purchases.filter(
                (purchase) =>
                  purchase.id !== id
              ),
          }));

        },

        // ==================================================
        // حساب المخزون
        // ==================================================

        getInventory: () => {

          const state =
            get();

          return state.products.map(
            (product) => {

              let purchaseQuantity =
                0;

              let saleQuantity =
                0;

              let purchaseValue =
                0;

              // ------------------------------
              // المشتريات
              // ------------------------------

              state.purchases.forEach(
                (purchase) => {

                  purchase.items.forEach(
                    (item) => {

                      if (
                        item.productId ===
                        product.id
                      ) {

                        purchaseQuantity +=
                          Number(
                            item.quantity ||
                              0
                          );

                        purchaseValue +=
                          Number(
                            item.quantity ||
                              0
                          ) *
                          Number(
                            item.price ||
                              0
                          );
                      }

                    }
                  );

                }
              );

              // ------------------------------
              // المبيعات
              // ------------------------------

              state.sales.forEach(
                (sale) => {

                  sale.items.forEach(
                    (item) => {

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
                  );

                }
              );

              // ------------------------------
              // الكمية الحالية
              // ------------------------------

              const quantity =
                purchaseQuantity -
                saleQuantity;

              // ------------------------------
              // متوسط سعر الشراء
              // ------------------------------

              const averagePurchasePrice =
                purchaseQuantity > 0
                  ? purchaseValue /
                    purchaseQuantity
                  : 0;

              // ------------------------------
              // قيمة المخزون
              // ------------------------------

              const inventoryValue =
                quantity *
                averagePurchasePrice;

              return {

                productId:
                  product.id,

                productCode:
                  product.code,

                productName:
                  product.name,

                unit:
                  product.unit,

                purchaseQuantity,

                saleQuantity,

                quantity,

                averagePurchasePrice,

                inventoryValue,
              };
            }
          );
        },

        // ==================================================
        // كمية منتج معين
        // ==================================================

        getProductQuantity: (
          productId
        ) => {

          const inventory =
            get().getInventory();

          const item =
            inventory.find(
              (product) =>
                product.productId ===
                productId
            );

          return (
            item?.quantity ?? 0
          );
        },

        // ==================================================
        // مسح البيانات
        // ==================================================

        clearStore: () => {

          set({

            products: [],

            customers: [
              createCashCustomer(),
            ],

            suppliers: [],

            bankAccounts:
              createDefaultBankAccounts(),

            sales: [],

            purchases: [],

            newSale:
              createNewSale(),
          });

        },
      }),

      // ==================================================
      // Persist
      // ==================================================

      {
        name: "erp-storage",

        // ==================================================
        // دمج البيانات القديمة مع الجديدة
        // ==================================================

        merge: (
          persistedState,
          currentState
        ) => {

          const persisted =
            persistedState as
              | Partial<ERPStore>
              | undefined;

          // ------------------------------
          // العملاء
          // ------------------------------

          const persistedCustomers =
            persisted?.customers ??
            currentState.customers;

          const cashCustomerExists =
            persistedCustomers.some(
              (customer) =>
                customer.id ===
                CASH_CUSTOMER_ID
            );

          let customers:
            Customer[];

          if (
            cashCustomerExists
          ) {

            customers =
              persistedCustomers.map(
                (customer) => {

                  if (
                    customer.id !==
                    CASH_CUSTOMER_ID
                  ) {
                    return customer;
                  }

                  return {

                    ...customer,

                    id:
                      CASH_CUSTOMER_ID,

                    name:
                      CASH_ACCOUNT_NAME,

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

              ...persistedCustomers,

            ];
          }

          // ------------------------------
          // الحسابات البنكية
          // ------------------------------

          const bankAccounts =
            persisted?.bankAccounts ??
            currentState.bankAccounts;

          // ------------------------------
          // الفاتورة الجديدة
          // ------------------------------

          const newSale:
            NewSale = {

            ...createNewSale(),

            ...(persisted?.newSale ??
              {}),
          };

          // ------------------------------
          // النتيجة
          // ------------------------------

          return {

            ...currentState,

            products:
              persisted?.products ??
              currentState.products,

            customers,

            suppliers:
              persisted?.suppliers ??
              currentState.suppliers,

            bankAccounts,

            sales:
              persisted?.sales ??
              currentState.sales,

            purchases:
              persisted?.purchases ??
              currentState.purchases,

            newSale,
          };
        },
      }
    )
  );