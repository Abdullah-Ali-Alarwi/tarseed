"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import {
  FiArrowRight,
  FiBox,
  FiCalendar,
  FiHash,
  FiLayers,
  FiShoppingCart,
  FiTrendingDown,
  FiTrendingUp,
} from "react-icons/fi";

import { useProductsStore } from "@/Store/productsStore";
import { usePurchasesStore } from "@/Store/purchasesStore";
import { useSalesStore } from "@/Store/salesStore";

export default function InventoryProductDetailsPage() {
  const params = useParams();

  const productId = String(params?.id || "");

  /* =====================================================
     Stores
  ===================================================== */

  const products = useProductsStore((state) => state.products);
  const purchases = usePurchasesStore((state) => state.purchases);
  const sales = useSalesStore((state) => state.sales);

  /* =====================================================
     Product
  ===================================================== */

  const product = useMemo(() => {
    if (!productId) return undefined;

    return products.find((item) => item.id === productId);
  }, [products, productId]);

  /* =====================================================
     Product code
  ===================================================== */

  const productCode = product?.code || "";

  /* =====================================================
     Purchases
  ===================================================== */

  const productPurchases = useMemo(() => {
    if (!product) return [];

    return purchases
      .filter((purchase) => {
        // الفواتير الملغاة لا تدخل في حساب المخزون
        if (purchase.status === "cancelled") {
          return false;
        }

        return purchase.items?.some((item) => {
          const sameProductId = item.productId && item.productId === product.id;

          const sameProductCode =
            item.productCode &&
            product.code &&
            item.productCode === product.code;

          return sameProductId || sameProductCode;
        });
      })
      .map((purchase) => {
        const items =
          purchase.items?.filter((item) => {
            const sameProductId =
              item.productId && item.productId === product.id;

            const sameProductCode =
              item.productCode &&
              product.code &&
              item.productCode === product.code;

            return sameProductId || sameProductCode;
          }) || [];

        const quantity = items.reduce(
          (sum, item) => sum + Number(item.quantity || 0),
          0,
        );

        const value = items.reduce(
          (sum, item) => sum + Number(item.total || 0),
          0,
        );

        return {
          purchase,
          items,
          quantity,
          value,
        };
      });
  }, [purchases, product]);

  /* =====================================================
     Sales
  ===================================================== */

  const productSales = useMemo(() => {
    if (!product) return [];

    return sales
      .filter((sale) => {
        // الفواتير الملغاة لا تدخل في حساب المخزون
        if (sale.status === "cancelled") {
          return false;
        }

        return sale.items?.some((item) => {
          const sameProductId = item.productId && item.productId === product.id;

          const sameProductCode =
            item.productCode &&
            product.code &&
            item.productCode === product.code;

          return sameProductId || sameProductCode;
        });
      })
      .map((sale) => {
        const items =
          sale.items?.filter((item) => {
            const sameProductId =
              item.productId && item.productId === product.id;

            const sameProductCode =
              item.productCode &&
              product.code &&
              item.productCode === product.code;

            return sameProductId || sameProductCode;
          }) || [];

        const quantity = items.reduce(
          (sum, item) => sum + Number(item.quantity || 0),
          0,
        );

        const value = items.reduce(
          (sum, item) => sum + Number(item.total || 0),
          0,
        );

        return {
          sale,
          items,
          quantity,
          value,
        };
      });
  }, [sales, product]);

  /* =====================================================
     Inventory calculations
  ===================================================== */

  const statistics = useMemo(() => {
    const purchaseQuantity = productPurchases.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    const saleQuantity = productSales.reduce(
      (sum, item) => sum + item.quantity,
      0,
    );

    const quantity = purchaseQuantity - saleQuantity;

    const purchaseValue = productPurchases.reduce(
      (sum, item) => sum + item.value,
      0,
    );

    const salesValue = productSales.reduce((sum, item) => sum + item.value, 0);

    const averagePurchasePrice =
      purchaseQuantity > 0 ? purchaseValue / purchaseQuantity : 0;

    const inventoryValue = Math.max(quantity, 0) * averagePurchasePrice;

    return {
      purchaseQuantity,
      saleQuantity,
      quantity,
      purchaseValue,
      salesValue,
      averagePurchasePrice,
      inventoryValue,
    };
  }, [productPurchases, productSales]);

  /* =====================================================
     Helpers
  ===================================================== */

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  const formatDate = (date: string) => {
    if (!date) return "-";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
      return date;
    }

    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(parsed);
  };

  /* =====================================================
     Product not found
  ===================================================== */

  if (!product) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-50 p-4"
      >
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
            <FiBox size={30} />
          </div>

          <h1 className="text-xl font-bold text-gray-900">الصنف غير موجود</h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            لم يتم العثور على الصنف المطلوب أو ربما تم حذفه من النظام.
          </p>

          <Link
            href="/inventory"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <FiArrowRight />
            العودة إلى المخزون
          </Link>
        </div>
      </main>
    );
  }

  /* =====================================================
     Main
  ===================================================== */

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 p-3 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-7xl">
        {/* =================================================
            Header
        ================================================= */}

        <div className="mb-6">
          <Link
            href="/inventory"
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-blue-600"
          >
            <FiArrowRight />
            العودة إلى المخزون
          </Link>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm text-gray-500">
                <FiBox />
                <span>إدارة المخزون</span>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                تفاصيل الصنف
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                عرض حركة المخزون والمشتريات والمبيعات الخاصة بهذا الصنف
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/products/${product.id}/edit`}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                تعديل الصنف
              </Link>

              <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-gray-100">
                <FiHash className="text-blue-600" />

                <div>
                  <p className="text-[11px] text-gray-500">رقم الصنف</p>

                  <p className="font-mono font-bold text-gray-900">
                    {product.code}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            Product Card
        ================================================= */}

        <div className="mb-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-600">
                <FiBox size={30} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {product.name}
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    <FiHash size={12} />
                    {product.code}
                  </span>

                  <span className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                    <FiLayers size={12} />
                    {product.unit || "وحدة"}
                  </span>

                  <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    {product.category || "عام"}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                  product.isActive === false
                    ? "bg-red-50 text-red-600"
                    : "bg-green-50 text-green-600"
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    product.isActive === false ? "bg-red-500" : "bg-green-500"
                  }`}
                />

                {product.isActive === false ? "غير نشط" : "نشط"}
              </span>
            </div>
          </div>

          {product.description && (
            <div className="mt-5 rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold text-gray-500">وصف الصنف</p>

              <p className="mt-1 text-sm leading-6 text-gray-700">
                {product.description}
              </p>
            </div>
          )}
        </div>

        {/* =================================================
            Statistics
        ================================================= */}

        <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Current quantity */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">الرصيد الحالي</p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatMoney(statistics.quantity)}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {product.unit || "وحدة"}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <FiBox size={21} />
              </div>
            </div>
          </div>

          {/* Purchases */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">إجمالي المشتريات</p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatMoney(statistics.purchaseQuantity)}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {formatMoney(statistics.purchaseValue)} ريال
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <FiTrendingUp size={21} />
              </div>
            </div>
          </div>

          {/* Sales */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">إجمالي المبيعات</p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatMoney(statistics.saleQuantity)}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  {formatMoney(statistics.salesValue)} ريال
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <FiTrendingDown size={21} />
              </div>
            </div>
          </div>

          {/* Inventory value */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">قيمة المخزون</p>

                <p className="mt-2 text-2xl font-bold text-gray-900">
                  {formatMoney(statistics.inventoryValue)}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  متوسط الشراء: {formatMoney(statistics.averagePurchasePrice)}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <FiShoppingCart size={21} />
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
            Movement
        ================================================= */}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* Purchases */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h2 className="font-bold text-gray-900">حركة المشتريات</h2>

                <p className="mt-1 text-xs text-gray-500">
                  الفواتير التي تحتوي على هذا الصنف
                </p>
              </div>

              <span className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
                {productPurchases.length} فاتورة
              </span>
            </div>

            {productPurchases.length === 0 ? (
              <div className="p-10 text-center">
                <FiShoppingCart className="mx-auto text-gray-300" size={35} />

                <p className="mt-3 text-sm font-semibold text-gray-600">
                  لا توجد مشتريات
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  لم يتم تسجيل مشتريات لهذا الصنف حتى الآن.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-right">
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500">
                        الفاتورة
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold text-gray-500">
                        التاريخ
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold text-gray-500">
                        المورد
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold text-gray-500">
                        الكمية
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold text-gray-500">
                        القيمة
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {productPurchases.map(({ purchase, quantity, value }) => (
                      <tr
                        key={purchase.id}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="px-5 py-4">
                          <Link
                            href={`/purchases/${purchase.id}`}
                            className="font-mono font-semibold text-blue-600 hover:text-blue-700"
                          >
                            {purchase.invoiceNumber}
                          </Link>
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <FiCalendar size={13} />
                            {formatDate(purchase.date)}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-medium text-gray-800">
                          {purchase.supplier || "-"}
                        </td>

                        <td className="px-5 py-4 font-semibold text-gray-800">
                          {formatMoney(quantity)}
                        </td>

                        <td className="px-5 py-4 font-semibold text-gray-900">
                          {formatMoney(value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sales */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h2 className="font-bold text-gray-900">حركة المبيعات</h2>

                <p className="mt-1 text-xs text-gray-500">
                  الفواتير التي تحتوي على هذا الصنف
                </p>
              </div>

              <span className="rounded-lg bg-orange-50 px-3 py-1.5 text-xs font-semibold text-orange-700">
                {productSales.length} فاتورة
              </span>
            </div>

            {productSales.length === 0 ? (
              <div className="p-10 text-center">
                <FiTrendingDown className="mx-auto text-gray-300" size={35} />

                <p className="mt-3 text-sm font-semibold text-gray-600">
                  لا توجد مبيعات
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  لم يتم تسجيل مبيعات لهذا الصنف حتى الآن.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[650px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50 text-right">
                      <th className="px-5 py-3 text-xs font-semibold text-gray-500">
                        الفاتورة
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold text-gray-500">
                        التاريخ
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold text-gray-500">
                        العميل
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold text-gray-500">
                        الكمية
                      </th>

                      <th className="px-5 py-3 text-xs font-semibold text-gray-500">
                        القيمة
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {productSales.map(({ sale, quantity, value }) => (
                      <tr
                        key={sale.id}
                        className="border-b border-gray-50 last:border-0"
                      >
                        <td className="px-5 py-4">
                          <Link
                            href={`/sales/${sale.id}`}
                            className="font-mono font-semibold text-blue-600 hover:text-blue-700"
                          >
                            {sale.invoiceNumber}
                          </Link>
                        </td>

                        <td className="px-5 py-4 text-gray-600">
                          <span className="inline-flex items-center gap-1">
                            <FiCalendar size={13} />
                            {formatDate(sale.date)}
                          </span>
                        </td>

                        <td className="px-5 py-4 font-medium text-gray-800">
                          {sale.customerName || "-"}
                        </td>

                        <td className="px-5 py-4 font-semibold text-gray-800">
                          {formatMoney(quantity)}
                        </td>

                        <td className="px-5 py-4 font-semibold text-gray-900">
                          {formatMoney(value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* =================================================
            Inventory Summary
        ================================================= */}

        <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-gray-900">ملخص حركة المخزون</h2>

              <p className="mt-1 text-xs text-gray-500">
                الكمية الحالية محسوبة من إجمالي المشتريات ناقص إجمالي المبيعات.
              </p>
            </div>

            <div
              className={`rounded-xl px-4 py-3 text-center ${
                statistics.quantity > 0
                  ? "bg-green-50 text-green-700"
                  : statistics.quantity === 0
                    ? "bg-gray-100 text-gray-600"
                    : "bg-red-50 text-red-700"
              }`}
            >
              <p className="text-[11px]">حالة المخزون</p>

              <p className="mt-1 text-sm font-bold">
                {statistics.quantity > 0
                  ? "متوفر"
                  : statistics.quantity === 0
                    ? "نفد المخزون"
                    : "رصيد سالب"}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">المشتريات</p>

              <p className="mt-1 text-lg font-bold text-green-600">
                +{formatMoney(statistics.purchaseQuantity)}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">المبيعات</p>

              <p className="mt-1 text-lg font-bold text-orange-600">
                -{formatMoney(statistics.saleQuantity)}
              </p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-500">الرصيد الحالي</p>

              <p className="mt-1 text-lg font-bold text-blue-600">
                {formatMoney(statistics.quantity)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
