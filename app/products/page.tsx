"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiPackage,
  FiDollarSign,
  FiLayers,
  FiMoreVertical,
  FiEdit,
  FiTrash2,
  FiEye,
} from "react-icons/fi";
import { useERPStore } from "@/Store/erpStore";

export default function ProductsPage() {
  const products = useERPStore((state) => state.products);

  const purchases = useERPStore((state) => state.purchases);

  const sales = useERPStore((state) => state.sales);

  const deleteProduct = useERPStore((state) => state.deleteProduct);

  const [search, setSearch] = useState("");

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
     INVENTORY DATA
     
     الكمية الحالية =
     إجمالي المشتريات - إجمالي المبيعات

     سعر الوحدة =
     متوسط سعر الشراء
  ===================================================== */

  const inventoryProducts = useMemo(() => {
    return products.map((product) => {
      let purchasedQuantity = 0;
      let soldQuantity = 0;

      let totalPurchaseValue = 0;
      let totalPurchaseQuantity = 0;

      /* -----------------------------------------------
         المشتريات
      ----------------------------------------------- */

      purchases.forEach((purchase) => {
        purchase.items.forEach((item) => {
          if (item.productId === product.id) {
            const quantity = getNumericAmount(item.quantity);

            const price = getNumericAmount(item.price);

            purchasedQuantity += quantity;

            totalPurchaseQuantity += quantity;

            totalPurchaseValue += quantity * price;
          }
        });
      });

      /* -----------------------------------------------
         المبيعات
      ----------------------------------------------- */

      sales.forEach((sale) => {
        sale.items.forEach((item) => {
          if (item.productId === product.id) {
            soldQuantity += getNumericAmount(item.quantity);
          }
        });
      });

      /* -----------------------------------------------
         الكمية الحالية
      ----------------------------------------------- */

      const stock = Math.max(purchasedQuantity - soldQuantity, 0);

      /* -----------------------------------------------
         متوسط سعر الشراء
      ----------------------------------------------- */

      const averagePurchasePrice =
        totalPurchaseQuantity > 0
          ? totalPurchaseValue / totalPurchaseQuantity
          : 0;

      /* -----------------------------------------------
         قيمة المخزون
      ----------------------------------------------- */

      const inventoryValue = stock * averagePurchasePrice;

      return {
        ...product,
        stock,
        price: averagePurchasePrice,
        inventoryValue,
      };
    });
  }, [products, purchases, sales]);

  /* =====================================================
     FILTERED PRODUCTS
  ===================================================== */

  const filteredProducts = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return inventoryProducts;
    }

    return inventoryProducts.filter((product) => {
      return (
        String(product.id).toLowerCase().includes(value) ||
        String(product.code).toLowerCase().includes(value) ||
        String(product.name).toLowerCase().includes(value) ||
        String(product.unit).toLowerCase().includes(value)
      );
    });
  }, [inventoryProducts, search]);

  /* =====================================================
     STATISTICS
  ===================================================== */

  const totalProducts = products.length;

  const totalStock = useMemo(() => {
    return inventoryProducts.reduce(
      (total, product) => total + product.stock,
      0,
    );
  }, [inventoryProducts]);

  const totalInventoryValue = useMemo(() => {
    return inventoryProducts.reduce(
      (total, product) => total + product.inventoryValue,
      0,
    );
  }, [inventoryProducts]);

  const totalUnits = useMemo(() => {
    return new Set(products.map((product) => product.unit)).size;
  }, [products]);

  /* =====================================================
     STATUS
  ===================================================== */

  const getStatus = (stock: number) => {
    if (stock <= 0) {
      return {
        label: "نفد المخزون",
        className: "bg-red-50 text-red-600",
      };
    }

    if (stock <= 10) {
      return {
        label: "منخفض",
        className: "bg-yellow-50 text-yellow-600",
      };
    }

    return {
      label: "متوفر",
      className: "bg-green-50 text-green-600",
    };
  };

  /* =====================================================
     DELETE
  ===================================================== */

  const handleDelete = (id: string, name: string) => {
    const confirmed = window.confirm(`هل أنت متأكد من حذف الصنف "${name}"؟`);

    if (!confirmed) {
      return;
    }

    deleteProduct(id);
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">المنتجات</h1>

            <p className="text-sm text-gray-500 mt-1">
              إدارة الأصناف والكميات وقيمة المخزون
            </p>
          </div>

          <Link
            href="/products/new"
            className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-lg font-medium transition"
          >
            <FiPlus size={20} />
            إضافة صنف
          </Link>
        </div>

        {/* =================================================
            STATISTICS
        ================================================= */}

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
            title="إجمالي الكميات"
            value={formatMoney(totalStock)}
            subtitle="وحدة"
            icon={FiLayers}
          />

          <StatCard
            title="وحدات القياس"
            value={formatMoney(totalUnits)}
            subtitle="وحدة"
            icon={FiPackage}
          />
        </div>

        {/* =================================================
            PRODUCTS TABLE
        ================================================= */}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* TOOLBAR */}

          <div className="p-5 border-b border-gray-100">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="font-bold text-gray-800">قائمة المنتجات</h2>

                <p className="text-xs text-gray-400 mt-1">
                  عرض {filteredProducts.length} من {totalProducts} صنف
                </p>
              </div>

              <div className="relative w-full md:w-80">
                <FiSearch
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="البحث بالكود أو اسم الصنف..."
                  className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-100 placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* TABLE */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-right">
              <thead className="bg-gray-50">
                <tr className="text-sm text-gray-500">
                  <th className="px-6 py-4 font-medium whitespace-nowrap">
                    كود الصنف
                  </th>

                  <th className="px-6 py-4 font-medium whitespace-nowrap">
                    اسم الصنف
                  </th>

                  <th className="px-6 py-4 font-medium whitespace-nowrap">
                    الوحدة
                  </th>

                  <th className="px-6 py-4 font-medium whitespace-nowrap">
                    متوسط سعر الشراء
                  </th>

                  <th className="px-6 py-4 font-medium whitespace-nowrap">
                    الكمية
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
                  filteredProducts.map((product) => {
                    const status = getStatus(product.stock);

                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50 transition"
                      >
                        {/* CODE */}

                        <td className="px-6 py-4">
                          <Link
                            href={`/products/${product.id}`}
                            className="font-semibold text-amber-600 hover:text-amber-700"
                          >
                            {product.code}
                          </Link>
                        </td>

                        {/* NAME */}

                        <td className="px-6 py-4">
                          <Link
                            href={`/products/${product.id}`}
                            className="font-semibold text-gray-700 hover:text-amber-600"
                          >
                            {product.name}
                          </Link>
                        </td>

                        {/* UNIT */}

                        <td className="px-6 py-4 text-sm text-gray-500">
                          {product.unit}
                        </td>

                        {/* PURCHASE PRICE */}

                        <td className="px-6 py-4 text-sm font-semibold text-gray-700 whitespace-nowrap">
                          {formatMoney(product.price)} ريال
                        </td>

                        {/* STOCK */}

                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-700">
                            {product.stock.toLocaleString("ar-SA")}
                          </span>

                          <span className="text-xs text-gray-400 mr-1">
                            {product.unit}
                          </span>
                        </td>

                        {/* INVENTORY VALUE */}

                        <td className="px-6 py-4 font-semibold text-gray-700 whitespace-nowrap">
                          {formatMoney(product.inventoryValue)} ريال
                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            <Link
                              href={`/products/${product.id}`}
                              title="عرض"
                              className="p-2 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition"
                            >
                              <FiEye size={17} />
                            </Link>

                            <Link
                              href={`/products/${product.id}/edit`}
                              title="تعديل"
                              className="p-2 rounded-lg text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition"
                            >
                              <FiEdit size={17} />
                            </Link>

                            <button
                              type="button"
                              title="حذف"
                              onClick={() =>
                                handleDelete(product.id, product.name)
                              }
                              className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition"
                            >
                              <FiTrash2 size={17} />
                            </button>

                            <button
                              type="button"
                              title="المزيد"
                              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                            >
                              <FiMoreVertical size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="px-6 py-14 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                          <FiPackage size={28} className="text-gray-400" />
                        </div>

                        <p className="text-gray-600 font-semibold">
                          لا توجد أصناف
                        </p>

                        <p className="text-sm text-gray-400 mt-1">
                          لا توجد أصناف مطابقة للبحث الحالي
                        </p>

                        {!search && (
                          <Link
                            href="/products/new"
                            className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition"
                          >
                            <FiPlus size={17} />
                            إضافة أول صنف
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* =================================================
              PAGINATION
          ================================================= */}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-t border-gray-100">
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
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
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

        <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Icon size={22} />
        </div>
      </div>
    </div>
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
