import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Product {
  id: string;
  code: string;
  name: string;
  unit?: string;
  category?: string;
  description?: string;
  isActive?: boolean;
}

interface ProductsStore {
  products: Product[];

  addProduct: (
    product: Omit<Product, "id" | "code">
  ) => Product;

  updateProduct: (
    id: string,
    data: Partial<Omit<Product, "id" | "code">>
  ) => void;

  deleteProduct: (id: string) => void;

  getProductById: (
    id: string
  ) => Product | undefined;

  getProductByCode: (
    code: string
  ) => Product | undefined;

  searchProducts: (
    search: string
  ) => Product[];

  generateProductCode: () => string;

  clearProducts: () => void;
}

/*
|--------------------------------------------------------------------------
| المنتجات الافتراضية
|--------------------------------------------------------------------------
*/

const defaultProducts: Product[] = [
  {
    id: "product-1001",
    code: "1001",
    name: "عسل",
    unit: "كيلو",
    category: "عسل",
    isActive: true,
  },
  {
    id: "product-1002",
    code: "1002",
    name: "سليط",
    unit: "كيلو",
    category: "زيوت",
    isActive: true,
  },
  {
    id: "product-1003",
    code: "1003",
    name: "زيت",
    unit: "لتر",
    category: "زيوت",
    isActive: true,
  },
  {
    id: "product-1004",
    code: "1004",
    name: "مكسرات",
    unit: "كيلو",
    category: "مواد غذائية",
    isActive: true,
  },
  {
    id: "product-1005",
    code: "1005",
    name: "زبيب ",
    unit: "كيلو",
    category: "مواد غذائية",
    isActive: true,
  },
  {
    id: "product-1006",
    code: "1006",
    name: "بن ",
    unit: "كيلو",
    category: "مواد غذائية",
    isActive: true,
  },
];

/*
|--------------------------------------------------------------------------
| Zustand Store
|--------------------------------------------------------------------------
*/

export const useProductsStore =
  create<ProductsStore>()(
    persist(
      (set, get) => ({
        products: defaultProducts,

        /*
        |--------------------------------------------------------------------------
        | إنشاء كود جديد
        |--------------------------------------------------------------------------
        */

        generateProductCode: () => {
          const products = get().products;

          const codes = products
            .map((product) => Number(product.code))
            .filter((code) => !Number.isNaN(code));

          let nextCode = 1001;

          while (codes.includes(nextCode)) {
            nextCode++;
          }

          return String(nextCode);
        },

        /*
        |--------------------------------------------------------------------------
        | إضافة منتج
        |--------------------------------------------------------------------------
        */

        addProduct: (productData) => {
          const code = get().generateProductCode();

          const newProduct: Product = {
            ...productData,
            id: `product-${Date.now()}`,
            code,
            isActive:
              productData.isActive !== false,
          };

          set((state) => ({
            products: [
              ...state.products,
              newProduct,
            ],
          }));

          return newProduct;
        },

        /*
        |--------------------------------------------------------------------------
        | تعديل منتج
        |--------------------------------------------------------------------------
        */

        updateProduct: (id, data) => {
          set((state) => ({
            products: state.products.map(
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

        /*
        |--------------------------------------------------------------------------
        | حذف منتج
        |--------------------------------------------------------------------------
        */

        deleteProduct: (id) => {
          set((state) => ({
            products: state.products.filter(
              (product) =>
                product.id !== id
            ),
          }));
        },

        /*
        |--------------------------------------------------------------------------
        | البحث بواسطة ID
        |--------------------------------------------------------------------------
        */

        getProductById: (id) => {
          return get().products.find(
            (product) =>
              product.id === id
          );
        },

        /*
        |--------------------------------------------------------------------------
        | البحث بواسطة الكود
        |--------------------------------------------------------------------------
        */

        getProductByCode: (code) => {
          return get().products.find(
            (product) =>
              product.code === code
          );
        },

        /*
        |--------------------------------------------------------------------------
        | البحث
        |--------------------------------------------------------------------------
        */

        searchProducts: (search) => {
          const value =
            search.trim().toLowerCase();

          if (!value) {
            return get().products;
          }

          return get().products.filter(
            (product) =>
              product.name
                .toLowerCase()
                .includes(value) ||
              product.code
                .toLowerCase()
                .includes(value) ||
              product.category
                ?.toLowerCase()
                .includes(value)
          );
        },

        /*
        |--------------------------------------------------------------------------
        | تفريغ المنتجات
        |--------------------------------------------------------------------------
        */

        clearProducts: () => {
          set({
            products: [],
          });
        },
      }),

      {
        name: "erp-products-storage",
      }
    )
  );