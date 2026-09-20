
import { create } from "zustand";
import { persist } from "zustand/middleware";

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

/* =========================================================
   STORE
========================================================= */

interface ProductsStore {
  products: Product[];

  /* إضافة صنف */
  addProduct: (
    product: Omit<Product, "id" | "code">
  ) => Product;

  /* تعديل صنف */
  updateProduct: (
    id: string,
    data: Partial<Omit<Product, "id" | "code">>
  ) => void;

  /* حذف صنف */
  deleteProduct: (id: string) => void;

  /* الحصول على صنف بواسطة ID */
  getProductById: (
    id: string
  ) => Product | undefined;

  /* الحصول على صنف بواسطة الكود */
  getProductByCode: (
    code: string
  ) => Product | undefined;

  /* البحث */
  searchProducts: (
    search: string
  ) => Product[];

  /* إنشاء كود جديد */
  generateProductCode: () => string;

  /* حذف جميع الأصناف */
  clearProducts: () => void;
}

/* =========================================================
   الأصناف الافتراضية
========================================================= */

const defaultProducts: Product[] = [

];

/* =========================================================
   ZUSTAND STORE
========================================================= */

export const useProductsStore =
  create<ProductsStore>()(
    persist(
      (set, get) => ({
        /* =================================================
           البيانات الأولية
        ================================================= */

        products: defaultProducts,

        /* =================================================
           إنشاء كود جديد
           
           يبدأ من 1001
           ولا يعيد استخدام الأكواد المحذوفة
        ================================================= */

        generateProductCode: () => {
          const products = get().products;

          const codes = products
            .map((product) => Number(product.code))
            .filter((code) => !Number.isNaN(code));

          if (codes.length === 0) {
            return "1001";
          }

          const maxCode = Math.max(...codes);

          return String(maxCode + 1);
        },

        /* =================================================
           إضافة صنف
        ================================================= */

        addProduct: (productData) => {
          const code = get().generateProductCode();

          const newProduct: Product = {
            id: `product-${Date.now()}-${Math.random()
              .toString(36)
              .substring(2, 8)}`,

            code,

            name: productData.name.trim(),

            unit: productData.unit?.trim() || "",

            category:
              productData.category?.trim() || "",

            description:
              productData.description?.trim() || "",

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

        /* =================================================
           تعديل صنف
           
           الكود لا يتغير
        ================================================= */

        updateProduct: (id, data) => {
          set((state) => ({
            products: state.products.map(
              (product) =>
                product.id === id
                  ? {
                      ...product,
                      ...data,
                      name:
                        data.name !== undefined
                          ? data.name.trim()
                          : product.name,
                      unit:
                        data.unit !== undefined
                          ? data.unit.trim()
                          : product.unit,
                      category:
                        data.category !== undefined
                          ? data.category.trim()
                          : product.category,
                      description:
                        data.description !== undefined
                          ? data.description.trim()
                          : product.description,
                    }
                  : product
            ),
          }));
        },

        /* =================================================
           حذف صنف
        ================================================= */

        deleteProduct: (id) => {
          set((state) => ({
            products: state.products.filter(
              (product) =>
                product.id !== id
            ),
          }));
        },

        /* =================================================
           البحث بواسطة ID
        ================================================= */

        getProductById: (id) => {
          return get().products.find(
            (product) =>
              product.id === id
          );
        },

        /* =================================================
           البحث بواسطة الكود
        ================================================= */

        getProductByCode: (code) => {
          return get().products.find(
            (product) =>
              product.code === code
          );
        },

        /* =================================================
           البحث بالاسم أو الكود أو التصنيف
        ================================================= */

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

              (product.category || "")
                .toLowerCase()
                .includes(value)
          );
        },

        /* =================================================
           حذف جميع الأصناف
        ================================================= */

        clearProducts: () => {
          set({
            products: [],
          });
        },
      }),

      /* ===================================================
         LOCAL STORAGE
      =================================================== */

      {
        name: "erp-products-storage",
      }
    )
  );

