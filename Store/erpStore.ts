"use client";

import { create } from "zustand";

import { useProductsStore } from "./productsStore";
import { usePurchasesStore } from "./purchasesStore";
import { useSalesStore } from "./salesStore";

/* =========================================================
   المخزون
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
   Store Interface
========================================================= */

interface ERPStore {
  /*
    حساب المخزون من:
    المشتريات - المبيعات
  */

  getInventory: () => InventoryItem[];

  /*
    الحصول على كمية منتج معين
  */

  getProductQuantity: (
    productId: string
  ) => number;

  /*
    الحصول على بيانات مخزون منتج معين
  */

  getInventoryItem: (
    productId: string
  ) => InventoryItem | undefined;

  /*
    مسح بيانات المخزون المؤقتة
    ملاحظة:
    المخزون ليس بيانات مستقلة،
    لذلك لا يوجد clear فعلي هنا.
  */

  clearStore: () => void;
}

/* =========================================================
   حساب المخزون
========================================================= */

const calculateInventory = (): InventoryItem[] => {
  /*
    نقرأ البيانات مباشرة من الـ Stores
  */

  const products =
    useProductsStore.getState().products;

  const purchases =
    usePurchasesStore.getState().purchases;

  const sales =
    useSalesStore.getState().sales;

  /* =======================================================
     حساب مخزون كل منتج
  ======================================================= */

  return products.map((product) => {
    let purchaseQuantity = 0;

    let saleQuantity = 0;

    let purchaseValue = 0;

    /* =====================================================
       المشتريات
    ===================================================== */

    purchases.forEach((purchase) => {
      /*
        نتأكد أن items موجودة
      */

      if (!Array.isArray(purchase.items)) {
        return;
      }

      purchase.items.forEach((item) => {
        /*
          أهم نقطة:

          يجب أن يكون productId الموجود
          في الفاتورة هو نفس product.id
          الموجود في Products Store.
        */

        if (item.productId !== product.id) {
          return;
        }

        const quantity =
          Number(item.quantity) || 0;

        const price =
          Number(item.price) || 0;

        purchaseQuantity += quantity;

        purchaseValue +=
          quantity * price;
      });
    });

    /* =====================================================
       المبيعات
    ===================================================== */

    sales.forEach((sale) => {
      /*
        لا نحسب الفواتير الملغاة
      */

      if (sale.status === "cancelled") {
        return;
      }

      if (!Array.isArray(sale.items)) {
        return;
      }

      sale.items.forEach((item) => {
        /*
          نفس القاعدة:
          productId يجب أن يطابق product.id
        */

        if (item.productId !== product.id) {
          return;
        }

        saleQuantity +=
          Number(item.quantity) || 0;
      });
    });

    /* =====================================================
       الكمية الحالية
    ===================================================== */

    const quantity =
      purchaseQuantity -
      saleQuantity;

    /* =====================================================
       متوسط سعر الشراء
    ===================================================== */

    const averagePurchasePrice =
      purchaseQuantity > 0
        ? purchaseValue /
          purchaseQuantity
        : 0;

    /* =====================================================
       قيمة المخزون
    ===================================================== */

    const inventoryValue =
      quantity *
      averagePurchasePrice;

    /* =====================================================
       النتيجة
    ===================================================== */

    return {
      productId: product.id,

      productCode: product.code,

      productName: product.name,

      unit: product.unit || "",

      purchaseQuantity,

      saleQuantity,

      quantity,

      averagePurchasePrice,

      inventoryValue,
    };
  });
};

/* =========================================================
   Zustand Store
========================================================= */

export const useERPStore =
  create<ERPStore>()(
    (set, get) => ({
      /* ===================================================
         المخزون
      =================================================== */

      getInventory: () => {
        return calculateInventory();
      },

      /* ===================================================
         كمية منتج معين
      =================================================== */

      getProductQuantity: (
        productId
      ) => {
        const inventory =
          calculateInventory();

        const item =
          inventory.find(
            (product) =>
              product.productId ===
              productId
          );

        return item?.quantity ?? 0;
      },

      /* ===================================================
         بيانات مخزون منتج معين
      =================================================== */

      getInventoryItem: (
        productId
      ) => {
        const inventory =
          calculateInventory();

        return inventory.find(
          (product) =>
            product.productId ===
            productId
        );
      },

      /* ===================================================
         Clear
      =================================================== */

      clearStore: () => {
        /*
          المخزون نفسه ليس مخزن بيانات.

          إذا أردت مسح المخزون:
          يجب مسح المنتجات أو المبيعات أو المشتريات
          من الـ Stores الخاصة بها.

          لذلك لا نقوم بأي set هنا.
        */

        set({});
      },
    })
  );