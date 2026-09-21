"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiPackage,
  FiDollarSign,
  FiAlertTriangle,
  FiLayers,
  FiMoreVertical,
} from "react-icons/fi";

import { useERPStore } from "@/Store/erpStore";

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("جميع التصنيفات");

  /* =====================================================
     ZUSTAND - ERP STORE
  ===================================================== */

  const products = useERPStore((state) => state.products);

  /*
   * نعتمد على دالة المخزون الموجودة داخل Zustand
   * بدل إعادة حساب الكمية في الصفحة.
   */
  const getInventory = useERPStore((state) => state.getInventory);

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

  const getCategory = (
    productCategory: string | undefined,
    code: string | number,
  ) => {
    /*
     * إذا كان المنتج يحتوي على تصنيف محفوظ
     * نستخدمه مباشرة.
     */
    if (productCategory?.trim()) {
      return productCategory;
    }

    /*
     * تصنيف احتياطي حسب كود الصنف.
     */
    const codeString = String(code);

    if (codeString.startsWith("100")) {
      return "العسل";
    }

    if (codeString.startsWith("200")) {
      return "الزيوت";
    }

    if (codeString.startsWith("300")) {
      return "خدمات العمرة";
    }

    return "أخرى";
  };

  /* =====================================================
     STATUS
  ===================================================== */

  const getStatus = (stock: number): "متوفر" | "منخفض" | "نافذ" => {
    if (stock <= 0) {
      return "نافذ";
    }

    if (stock <= 10) {
      return "منخفض";
    }

    return "متوفر";
  };

  /* =====================================================
     INVENTORY DATA
  ===================================================== */

  const inventory = useMemo(() => {
    return getInventory();
  }, [getInventory, products]);

  const inventoryProducts = useMemo(() => {
    return products.map((product) => {
      /*
       * البحث عن بيانات هذا المنتج في المخزون.
       */
      const inventoryItem = inventory.find(
        (item) => item.productId === product.id,
      );

      /*
       * إذا لم توجد حركة للمخزون
       * يكون المخزون صفر.
       */
      const purchasedQuantity = Number(inventoryItem?.purchaseQuantity || 0);

      const soldQuantity = Number(inventoryItem?.saleQuantity || 0);

      const quantity = Number(inventoryItem?.quantity || 0);

      const averagePurchasePrice = Number(
        inventoryItem?.averagePurchasePrice || 0,
      );

      const total = Number(inventoryItem?.inventoryValue || 0);

      /*
       * التصنيف
       */
      const productCategory = getCategory(product.category, product.code);

      /*
       * الحالة
       */
      const status = getStatus(quantity);

      return {
        ...product,

        quantity,

        averagePurchasePrice,

        total,

        category: productCategory,

        status,

        purchasedQuantity,

        soldQuantity,
      };
    });
  }, [products, inventory]);

  /* =====================================================
     FILTER
  ===================================================== */

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();

    return inventoryProducts.filter((product) => {
      const matchesSearch =
        !value ||
        String(product.id).toLowerCase().includes(value) ||
        String(product.code).toLowerCase().includes(value) ||
        String(product.name).toLowerCase().includes(value);

      const matchesCategory =
        category === "جميع التصنيفات" || product.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [inventoryProducts, search, category]);

  /* =====================================================
     STATISTICS
  ===================================================== */

  const totalProducts = inventoryProducts.length;

  const totalInventoryValue = useMemo(() => {
    return inventoryProducts.reduce(
      (total, product) => total + product.total,
      0,
    );
  }, [inventoryProducts]);

  const lowStockProducts = useMemo(() => {
    return inventoryProducts.filter(
      (product) => product.quantity > 0 && product.quantity <= 10,
    ).length;
  }, [inventoryProducts]);

  const outOfStockProducts = useMemo(() => {
    return inventoryProducts.filter((product) => product.quantity <= 0).length;
  }, [inventoryProducts]);

  const totalCategories = useMemo(() => {
    return new Set(inventoryProducts.map((product) => product.category)).size;
  }, [inventoryProducts]);

  /* =====================================================
     CATEGORIES
  ===================================================== */

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(inventoryProducts.map((product) => product.category)),
    );

    return ["جميع التصنيفات", ...uniqueCategories];
  }, [inventoryProducts]);

  /* =====================================================
     JSX
  ===================================================== */

  return (
    <main className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-5" dir="rtl">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">المخزون</h1>

          <p className="mt-0.5 text-xs text-gray-500">
            إدارة الأصناف والكميات وحركة المخزون
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/inventory/movements"
            className="
              inline-flex
              items-center
              justify-center
              rounded-lg
              border
              border-gray-200
              bg-white
              px-3
              py-2
              text-xs
              font-medium
              text-gray-700
              transition
              hover:bg-gray-50
            "
          >
            حركة المخزون
          </Link>

          <Link
            href="/products/new"
            className="
              inline-flex
              items-center
              justify-center
              gap-1.5
              rounded-lg
              bg-amber-600
              px-3
              py-2
              text-xs
              font-medium
              text-white
              transition
              hover:bg-amber-700
            "
          >
            <FiPlus size={15} />
            إضافة صنف
          </Link>
        </div>
      </div>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-5">
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
          title="الأصناف النافذة"
          value={formatMoney(outOfStockProducts)}
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
          TABLE CONTAINER
      ===================================================== */}

      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        {/* =====================================================
            TOOLBAR
        ===================================================== */}

        <div className="border-b border-gray-100 p-3">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-sm font-bold text-gray-800">الأصناف</h2>

              <p className="mt-0.5 text-[11px] text-gray-400">
                عرض {filteredProducts.length} من {totalProducts} صنف
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {/* SEARCH */}

              <div className="relative w-full sm:w-60">
                <FiSearch
                  className="
                    absolute
                    right-2.5
                    top-1/2
                    -translate-y-1/2
                    text-gray-400
                  "
                  size={15}
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="البحث عن صنف..."
                  className="
                    w-full
                    rounded-lg
                    border
                    border-gray-200
                    bg-white
                    py-2
                    pl-3
                    pr-8
                    text-xs
                    text-gray-900
                    outline-none
                    placeholder:text-gray-400
                    focus:border-amber-500
                    focus:ring-1
                    focus:ring-amber-100
                  "
                />
              </div>

              {/* CATEGORY */}

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="
                  rounded-lg
                  border
                  border-gray-200
                  bg-white
                  px-3
                  py-2
                  text-xs
                  text-gray-900
                  outline-none
                  focus:border-amber-500
                "
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
            TABLE
        ===================================================== */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-right text-xs">
            <thead className="bg-gray-50">
              <tr className="text-[11px] text-gray-500">
                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  كود الصنف
                </th>

                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  الصنف
                </th>

                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  التصنيف
                </th>

                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  المشتريات
                </th>

                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  المبيعات
                </th>

                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  المتبقي
                </th>

                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  متوسط سعر الشراء
                </th>

                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  قيمة المخزون
                </th>

                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  الحالة
                </th>

                <th className="whitespace-nowrap px-3 py-2.5 font-semibold">
                  الإجراءات
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="transition hover:bg-gray-50">
                    {/* CODE */}

                    <td className="px-3 py-2.5">
                      <Link
                        href={`/inventory/${product.id}`}
                        className="
                          font-semibold
                          text-amber-600
                          hover:text-amber-700
                        "
                      >
                        {product.code}
                      </Link>
                    </td>

                    {/* NAME */}

                    <td className="px-3 py-2.5">
                      <Link
                        href={`/inventory/${product.id}`}
                        className="
                          font-semibold
                          text-gray-700
                          hover:text-amber-600
                        "
                      >
                        {product.name}
                      </Link>
                    </td>

                    {/* CATEGORY */}

                    <td className="px-3 py-2.5 text-gray-500">
                      {product.category}
                    </td>

                    {/* PURCHASE QUANTITY */}

                    <td className="px-3 py-2.5">
                      <span className="font-medium text-green-600">
                        {product.purchasedQuantity.toLocaleString("ar-SA")}
                      </span>

                      {product.unit && (
                        <span className="mr-1 text-[10px] text-gray-400">
                          {product.unit}
                        </span>
                      )}
                    </td>

                    {/* SALE QUANTITY */}

                    <td className="px-3 py-2.5">
                      <span className="font-medium text-blue-600">
                        {product.soldQuantity.toLocaleString("ar-SA")}
                      </span>

                      {product.unit && (
                        <span className="mr-1 text-[10px] text-gray-400">
                          {product.unit}
                        </span>
                      )}
                    </td>

                    {/* CURRENT QUANTITY */}

                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <span
                          className={`font-bold ${
                            product.quantity <= 0
                              ? "text-red-600"
                              : product.quantity <= 10
                                ? "text-orange-600"
                                : "text-gray-700"
                          }`}
                        >
                          {product.quantity.toLocaleString("ar-SA")}
                        </span>

                        {product.unit && (
                          <span className="text-[10px] text-gray-400">
                            {product.unit}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* AVERAGE PURCHASE PRICE */}

                    <td className="whitespace-nowrap px-3 py-2.5 text-gray-600">
                      {formatMoney(product.averagePurchasePrice)} ريال
                    </td>

                    {/* INVENTORY VALUE */}

                    <td className="whitespace-nowrap px-3 py-2.5 font-semibold text-gray-700">
                      {formatMoney(product.total)} ريال
                    </td>

                    {/* STATUS */}

                    <td className="px-3 py-2.5">
                      <Status status={product.status} />
                    </td>

                    {/* ACTIONS */}

                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-0.5">
                        <Link
                          href={`/inventory/${product.id}`}
                          className="
                            rounded-md
                            p-1.5
                            text-gray-400
                            transition
                            hover:bg-amber-50
                            hover:text-amber-600
                          "
                          title="تفاصيل المخزون"
                        >
                          <FiPackage size={15} />
                        </Link>

                        <button
                          type="button"
                          className="
                            rounded-md
                            p-1.5
                            text-gray-400
                            transition
                            hover:bg-gray-100
                            hover:text-gray-600
                          "
                          title="المزيد"
                        >
                          <FiMoreVertical size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={10}
                    className="
                      px-3
                      py-10
                      text-center
                      text-xs
                      text-gray-400
                    "
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

        <div className="flex flex-col justify-between gap-2 border-t border-gray-100 p-3 sm:flex-row sm:items-center">
          <p className="text-[11px] text-gray-400">
            عرض {filteredProducts.length} من {totalProducts} صنف
          </p>

          <div className="flex gap-1.5">
            <button
              type="button"
              disabled
              className="
                rounded-md
                border
                border-gray-200
                px-2.5
                py-1.5
                text-[11px]
                text-gray-400
              "
            >
              السابق
            </button>

            <button
              type="button"
              className="
                rounded-md
                bg-amber-600
                px-2.5
                py-1.5
                text-[11px]
                text-white
              "
            >
              1
            </button>

            <button
              type="button"
              disabled
              className="
                rounded-md
                border
                border-gray-200
                px-2.5
                py-1.5
                text-[11px]
                text-gray-400
              "
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
    <div className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[11px] text-gray-500">{title}</p>

          <div className="mt-1 flex items-end gap-1.5">
            <h2 className="text-lg font-bold text-gray-800">{value}</h2>

            <span className="mb-0.5 text-[10px] text-gray-400">{subtitle}</span>
          </div>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            warning ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"
          }`}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

/* =====================================================
   STATUS
===================================================== */

function Status({ status }: { status: "متوفر" | "منخفض" | "نافذ" }) {
  const styles = {
    متوفر: "bg-green-50 text-green-600",
    منخفض: "bg-orange-50 text-orange-600",
    نافذ: "bg-red-50 text-red-600",
  };

  const labels = {
    متوفر: "متوفر",
    منخفض: "منخفض",
    نافذ: "المخزون نافذ",
  };

  return (
    <span
      className={`
        inline-flex
        whitespace-nowrap
        rounded-full
        px-2
        py-0.5
        text-[10px]
        font-medium
        ${styles[status]}
      `}
    >
      {labels[status]}
    </span>
  );
}
