"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useERPStore } from "@/Store/erpStore";
import {
  FiPlus,
  FiSearch,
  FiPackage,
  FiDollarSign,
  FiAlertTriangle,
  FiLayers,
  FiMoreVertical,
} from "react-icons/fi";

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("جميع التصنيفات");

  /* =====================================================
     ZUSTAND
  ===================================================== */

  const products = useERPStore((state) => state.products);

  const purchases = useERPStore((state) => state.purchases);

  const sales = useERPStore((state) => state.sales);

  /* =====================================================
     FORMAT MONEY
  ===================================================== */

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("ar-SA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  /* =====================================================
     CATEGORY
  ===================================================== */

  const getCategory = (code: string) => {
    if (code.startsWith("100")) {
      return "العسل";
    }

    if (code.startsWith("200")) {
      return "الزيوت";
    }

    if (code.startsWith("300")) {
      return "خدمات العمرة";
    }

    return "أخرى";
  };

  /* =====================================================
     STATUS
  ===================================================== */

  const getStatus = (stock: number): "متوفر" | "منخفض" => {
    return stock <= 10 ? "منخفض" : "متوفر";
  };

  /* =====================================================
     INVENTORY DATA
     
     المخزون =
     إجمالي المشتريات - إجمالي المبيعات

     سعر الوحدة =
     متوسط سعر الشراء
  ===================================================== */

  const inventoryProducts = useMemo(() => {
    return products.map((product) => {
      let purchasedQuantity = 0;
      let soldQuantity = 0;

      let purchaseValue = 0;
      let purchaseQuantity = 0;

      /* ------------------------------------------
             المشتريات
          ------------------------------------------ */

      purchases.forEach((purchase) => {
        purchase.items.forEach((item) => {
          if (item.productId === product.id) {
            const quantity = getNumericAmount(item.quantity);

            const price = getNumericAmount(item.price);

            purchasedQuantity += quantity;

            purchaseQuantity += quantity;

            purchaseValue += quantity * price;
          }
        });
      });

      /* ------------------------------------------
             المبيعات
          ------------------------------------------ */

      sales.forEach((sale) => {
        sale.items.forEach((item) => {
          if (item.productId === product.id) {
            soldQuantity += getNumericAmount(item.quantity);
          }
        });
      });

      /* ------------------------------------------
             الكمية الحالية
          ------------------------------------------ */

      const quantity = Math.max(purchasedQuantity - soldQuantity, 0);

      /* ------------------------------------------
             متوسط سعر الشراء
          ------------------------------------------ */

      const averagePurchasePrice =
        purchaseQuantity > 0 ? purchaseValue / purchaseQuantity : 0;

      /* ------------------------------------------
             قيمة المخزون
          ------------------------------------------ */

      const total = quantity * averagePurchasePrice;

      return {
        ...product,

        quantity,

        price: averagePurchasePrice,

        total,

        category: getCategory(product.code),

        status: getStatus(quantity),
      };
    });
  }, [products, purchases, sales]);

  /* =====================================================
     FILTER
  ===================================================== */

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();

    return inventoryProducts.filter((product) => {
      const matchesSearch =
        !value ||
        product.id.toLowerCase().includes(value) ||
        product.code.toLowerCase().includes(value) ||
        product.name.toLowerCase().includes(value);

      const matchesCategory =
        category === "جميع التصنيفات" || product.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [inventoryProducts, search, category]);

  /* =====================================================
     TOTAL PRODUCTS
  ===================================================== */

  const totalProducts = inventoryProducts.length;

  /* =====================================================
     TOTAL INVENTORY VALUE
  ===================================================== */

  const totalInventoryValue = useMemo(() => {
    return inventoryProducts.reduce(
      (total, product) => total + product.total,
      0,
    );
  }, [inventoryProducts]);

  /* =====================================================
     LOW STOCK
  ===================================================== */

  const lowStockProducts = useMemo(() => {
    return inventoryProducts.filter((product) => product.quantity <= 10).length;
  }, [inventoryProducts]);

  /* =====================================================
     TOTAL CATEGORIES
  ===================================================== */

  const totalCategories = useMemo(() => {
    return new Set(inventoryProducts.map((product) => product.category)).size;
  }, [inventoryProducts]);

  /* =====================================================
     CATEGORIES
  ===================================================== */

  const categories = useMemo(() => {
    return [
      "جميع التصنيفات",
      ...Array.from(
        new Set(inventoryProducts.map((product) => product.category)),
      ),
    ];
  }, [inventoryProducts]);

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6" dir="rtl">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">المخزون</h1>

          <p className="text-sm text-gray-500 mt-1">
            إدارة الأصناف والكميات وحركة المخزون
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/inventory/movements"
            className="inline-flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-lg font-medium transition"
          >
            حركة المخزون
          </Link>

          <Link
            href="/products/new"
            className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-lg font-medium transition"
          >
            <FiPlus size={20} />
            إضافة صنف
          </Link>
        </div>
      </div>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="إجمالي الأصناف"
          value={formatMoney(totalProducts)}
          subtitle="صنف"
          icon={FiPackage}
        />

        <StatCard
          title="قيمة المخزون"
          value={formatMoney(totalInventoryValue)}
          subtitle="ريال"
          icon={FiDollarSign}
        />

        <StatCard
          title="الأصناف منخفضة"
          value={formatMoney(lowStockProducts)}
          subtitle="صنف"
          icon={FiAlertTriangle}
          warning
        />

        <StatCard
          title="التصنيفات"
          value={formatMoney(totalCategories)}
          subtitle="تصنيف"
          icon={FiLayers}
        />
      </div>

      {/* =====================================================
          TABLE
      ===================================================== */}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* TOOLBAR */}

        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-gray-800">الأصناف</h2>

              <p className="text-xs text-gray-400 mt-1">
                عرض {filteredProducts.length} من {totalProducts} صنف
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              {/* SEARCH */}

              <div className="relative w-full md:w-72">
                <FiSearch
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="البحث عن صنف..."
                  className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-100 placeholder:text-gray-400"
                />
              </div>

              {/* CATEGORY */}

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-amber-500"
              >
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* =====================================================
            TABLE BODY
        ===================================================== */}

        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[1000px]">
            <thead className="bg-gray-50">
              <tr className="text-sm text-gray-500">
                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  كود الصنف
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  الصنف
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  التصنيف
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  الكمية
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  متوسط سعر الشراء
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  قيمة المخزون
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  الحالة
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  الإجراءات
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition">
                    {/* CODE */}

                    <td className="px-6 py-4">
                      <Link
                        href={`/inventory/${product.id}`}
                        className="font-semibold text-amber-600 hover:text-amber-700"
                      >
                        {product.code}
                      </Link>
                    </td>

                    {/* NAME */}

                    <td className="px-6 py-4">
                      <Link
                        href={`/inventory/${product.id}`}
                        className="font-semibold text-gray-700 hover:text-amber-600"
                      >
                        {product.name}
                      </Link>
                    </td>

                    {/* CATEGORY */}

                    <td className="px-6 py-4 text-sm text-gray-500">
                      {product.category}
                    </td>

                    {/* QUANTITY */}

                    <td className="px-6 py-4">
                      <span className="font-semibold text-gray-700">
                        {product.quantity.toLocaleString("ar-SA")}
                      </span>

                      <span className="text-xs text-gray-400 mr-1">
                        {product.unit}
                      </span>
                    </td>

                    {/* AVERAGE PURCHASE PRICE */}

                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatMoney(product.price)} ريال
                    </td>

                    {/* INVENTORY VALUE */}

                    <td className="px-6 py-4 font-semibold text-gray-700 whitespace-nowrap">
                      {formatMoney(product.total)} ريال
                    </td>

                    {/* STATUS */}

                    <td className="px-6 py-4">
                      <Status status={product.status} />
                    </td>

                    {/* ACTIONS */}

                    <td className="px-6 py-4">
                      <button
                        type="button"
                        className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                        title="المزيد"
                      >
                        <FiMoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    لا توجد أصناف مطابقة للبحث أو التصنيف
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* =====================================================
            FOOTER
        ===================================================== */}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border-t border-gray-100">
          <p className="text-sm text-gray-400">
            عرض {filteredProducts.length} من {totalProducts} صنف
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              disabled
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-400 cursor-not-allowed"
            >
              السابق
            </button>

            <button
              type="button"
              className="px-3 py-2 bg-amber-600 text-white rounded-lg text-sm"
            >
              1
            </button>

            <button
              type="button"
              disabled
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-400 cursor-not-allowed"
            >
              التالي
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

/* =====================================================
   STAT CARD
===================================================== */

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  warning = false,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  warning?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>

          <div className="flex items-end gap-2 mt-2">
            <h2 className="text-2xl font-bold text-gray-800">{value}</h2>

            <span className="text-xs text-gray-400 mb-1">{subtitle}</span>
          </div>
        </div>

        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${
            warning ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"
          }`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   STATUS
===================================================== */

function Status({ status }: { status: "متوفر" | "منخفض" }) {
  const styles = {
    متوفر: "bg-green-50 text-green-600",

    منخفض: "bg-red-50 text-red-600",
  };

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

/* =====================================================
   NUMERIC VALUE
===================================================== */

function getNumericAmount(value: unknown): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    return Number(value.replace(/[^\d.-]/g, "")) || 0;
  }

  return 0;
}
