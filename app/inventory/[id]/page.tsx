"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import { useERPStore } from "@/Store/erpStore";
import {
  FiArrowRight,
  FiBox,
  FiShoppingCart,
  FiTruck,
  FiDollarSign,
  FiTrendingDown,
  FiTrendingUp,
  FiAlertCircle,
  FiCheckCircle,
  FiPackage,
  FiFileText,
  FiPrinter,
} from "react-icons/fi";

/* =========================================================
   HELPERS
========================================================= */

const formatMoney = (value: number) => {
  return new Intl.NumberFormat("ar-YE", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("ar-YE", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

const getPaymentMethodName = (method: string) => {
  switch (method) {
    case "cash":
      return "نقدي";

    case "bank":
      return "بنك";

    case "credit":
      return "آجل";

    default:
      return method || "-";
  }
};

const getPurchaseStatusName = (status: string) => {
  switch (status) {
    case "paid":
      return "مدفوعة";

    case "pending":
      return "آجلة";

    case "cancelled":
      return "ملغاة";

    default:
      return status || "-";
  }
};

const getSaleStatusName = (status: string) => {
  switch (status) {
    case "paid":
      return "مدفوعة";

    case "pending":
      return "آجلة";

    case "cancelled":
      return "ملغاة";

    default:
      return status || "-";
  }
};

/* =========================================================
   PAGE
========================================================= */

export default function ProductDetailsPage() {
  const params = useParams();

  const productId = String(params.id || "");

  /* =======================================================
     STORE
  ======================================================= */

  const products = useERPStore((state) => state.products);

  const purchases = useERPStore((state) => state.purchases);

  const sales = useERPStore((state) => state.sales);

  const getInventoryItem = useERPStore((state) => state.getInventoryItem);

  /* =======================================================
     PRODUCT
  ======================================================= */

  const product = useMemo(() => {
    return products.find((item) => String(item.id) === productId);
  }, [products, productId]);

  /* =======================================================
     INVENTORY
  ======================================================= */

  const inventory = useMemo(() => {
    if (!product) {
      return null;
    }

    return getInventoryItem(product.id);
  }, [product, getInventoryItem, purchases, sales, products]);

  /* =======================================================
     PURCHASE MOVEMENTS
  ======================================================= */

  const purchaseMovements = useMemo(() => {
    if (!product) {
      return [];
    }

    const result: {
      id: string;
      invoiceNumber: string;
      date: string;
      supplier: string;
      quantity: number;
      price: number;
      discount: number;
      total: number;
      paymentMethod: string;
      status: string;
    }[] = [];

    purchases.forEach((purchase) => {
      if (purchase.status === "cancelled") {
        return;
      }

      purchase.items.forEach((item) => {
        if (String(item.productId) !== String(product.id)) {
          return;
        }

        result.push({
          id: `${purchase.id}-${item.id}`,

          invoiceNumber: purchase.invoiceNumber,

          date: purchase.date,

          supplier: purchase.supplier,

          quantity: Number(item.quantity || 0),

          price: Number(item.price || 0),

          discount: Number(item.discount || 0),

          total: Number(item.total || 0),

          paymentMethod: purchase.paymentMethod,

          status: purchase.status,
        });
      });
    });

    return result.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [purchases, product]);

  /* =======================================================
     SALE MOVEMENTS
  ======================================================= */

  const saleMovements = useMemo(() => {
    if (!product) {
      return [];
    }

    const result: {
      id: string;
      invoiceNumber: string;
      date: string;
      customer: string;
      quantity: number;
      price: number;
      discount: number;
      total: number;
      paymentMethod: string;
      status: string;
    }[] = [];

    sales.forEach((sale) => {
      if (sale.status === "cancelled") {
        return;
      }

      sale.items.forEach((item) => {
        /*
          نعتمد على productId.

          هذا مهم جدًا لأن المخزون يحسب
          المبيعات اعتمادًا على productId.
        */
        if (String(item.productId) !== String(product.id)) {
          return;
        }

        result.push({
          id: `${sale.id}-${item.id}`,

          invoiceNumber: sale.invoiceNumber,

          date: sale.date,

          customer: sale.customerName || "عميل نقدي",

          quantity: Number(item.quantity || 0),

          price: Number(item.price || 0),

          discount: Number(item.discount || 0),

          total: Number(item.total || 0),

          paymentMethod: sale.paymentMethod,

          status: sale.status,
        });
      });
    });

    return result.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [sales, product]);

  /* =======================================================
     TOTALS
  ======================================================= */

  const totals = useMemo(() => {
    const purchaseQuantity = purchaseMovements.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    );

    const saleQuantity = saleMovements.reduce(
      (sum, item) => sum + Number(item.quantity || 0),
      0,
    );

    const purchaseValue = purchaseMovements.reduce(
      (sum, item) => sum + Number(item.quantity || 0) * Number(item.price || 0),
      0,
    );

    const salesValue = saleMovements.reduce(
      (sum, item) => sum + Number(item.total || 0),
      0,
    );

    const currentQuantity = purchaseQuantity - saleQuantity;

    const averagePurchasePrice =
      purchaseQuantity > 0 ? purchaseValue / purchaseQuantity : 0;

    const inventoryValue = currentQuantity * averagePurchasePrice;

    return {
      purchaseQuantity,
      saleQuantity,
      currentQuantity,
      purchaseValue,
      salesValue,
      averagePurchasePrice,
      inventoryValue,
    };
  }, [purchaseMovements, saleMovements]);

  /* =======================================================
     STOCK STATUS
  ======================================================= */

  const stockStatus = useMemo(() => {
    const quantity = Number(totals.currentQuantity || 0);

    if (quantity <= 0) {
      return {
        label: "المخزون نافذ",
        description: "لا توجد كمية متاحة حاليًا",
        className: "border-red-200 bg-red-50 text-red-700",
        iconClass: "bg-red-100 text-red-600",
        Icon: FiAlertCircle,
      };
    }

    if (quantity <= 5) {
      return {
        label: "مخزون منخفض",
        description: "يُنصح بتوفير كمية إضافية",
        className: "border-orange-200 bg-orange-50 text-orange-700",
        iconClass: "bg-orange-100 text-orange-600",
        Icon: FiAlertCircle,
      };
    }

    return {
      label: "متوفر",
      description: "الكمية متوفرة في المخزون",
      className: "border-green-200 bg-green-50 text-green-700",
      iconClass: "bg-green-100 text-green-600",
      Icon: FiCheckCircle,
    };
  }, [totals.currentQuantity]);

  /* =======================================================
     PRODUCT NOT FOUND
  ======================================================= */

  if (!product) {
    return (
      <main
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-gray-50 p-6"
      >
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <FiBox size={30} className="text-red-500" />
          </div>

          <h1 className="mt-5 text-xl font-bold text-gray-800">
            المنتج غير موجود
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            لم يتم العثور على المنتج المطلوب.
          </p>

          <Link
            href="/inventory"
            className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-[#0E1F33] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#162b43]"
          >
            <FiArrowRight size={18} />
            العودة إلى المخزون
          </Link>
        </div>
      </main>
    );
  }

  /* =======================================================
     PRINT
  ======================================================= */

  const handlePrint = () => {
    window.print();
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          .no-print {
            display: none !important;
          }

          .print-area {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      <main dir="rtl" className="min-h-screen bg-gray-50 p-4 md:p-6">
        <div className="print-area mx-auto max-w-7xl">
          {/* =================================================
              HEADER
          ================================================= */}

          <div className="no-print mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/inventory"
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
                title="العودة إلى المخزون"
              >
                <FiArrowRight size={20} />
              </Link>

              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  تفاصيل المنتج
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  حركة المخزون والمشتريات والمبيعات
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#0E1F33] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#162b43]"
            >
              <FiPrinter size={18} />
              طباعة
            </button>
          </div>

          {/* =================================================
              PRODUCT HEADER
          ================================================= */}

          <section className="mb-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                  <FiPackage size={30} className="text-blue-600" />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-black text-gray-800">
                      {product.name}
                    </h2>

                    {!product.isActive && (
                      <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-500">
                        غير نشط
                      </span>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-gray-500">
                    <span>
                      الكود:{" "}
                      <strong className="text-gray-700">{product.code}</strong>
                    </span>

                    {product.category && (
                      <span>
                        التصنيف:{" "}
                        <strong className="text-gray-700">
                          {product.category}
                        </strong>
                      </span>
                    )}

                    {product.unit && (
                      <span>
                        الوحدة:{" "}
                        <strong className="text-gray-700">
                          {product.unit}
                        </strong>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${stockStatus.className}`}
              >
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-full ${stockStatus.iconClass}`}
                >
                  <stockStatus.Icon size={22} />
                </div>

                <div>
                  <p className="font-bold">{stockStatus.label}</p>

                  <p className="mt-1 text-xs">{stockStatus.description}</p>
                </div>
              </div>
            </div>

            {product.description && (
              <div className="mt-5 rounded-lg bg-gray-50 p-4">
                <p className="text-xs font-bold text-gray-500">وصف المنتج</p>

                <p className="mt-1 text-sm text-gray-700">
                  {product.description}
                </p>
              </div>
            )}
          </section>

          {/* =================================================
              STATISTICS
          ================================================= */}

          <section className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Current Stock */}

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">الكمية الحالية</p>

                  <p className="mt-2 text-2xl font-black text-gray-800">
                    {formatNumber(totals.currentQuantity)}
                  </p>

                  {product.unit && (
                    <p className="mt-1 text-xs text-gray-400">{product.unit}</p>
                  )}
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50">
                  <FiPackage size={22} className="text-blue-600" />
                </div>
              </div>
            </div>

            {/* Purchases */}

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">إجمالي المشتريات</p>

                  <p className="mt-2 text-2xl font-black text-green-700">
                    {formatNumber(totals.purchaseQuantity)}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">الكمية الداخلة</p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-green-50">
                  <FiTrendingUp size={22} className="text-green-600" />
                </div>
              </div>
            </div>

            {/* Sales */}

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">إجمالي المبيعات</p>

                  <p className="mt-2 text-2xl font-black text-red-700">
                    {formatNumber(totals.saleQuantity)}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">الكمية الخارجة</p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50">
                  <FiTrendingDown size={22} className="text-red-600" />
                </div>
              </div>
            </div>

            {/* Inventory Value */}

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">قيمة المخزون</p>

                  <p className="mt-2 text-2xl font-black text-purple-700">
                    {formatMoney(totals.inventoryValue)}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">ريال يمني</p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-50">
                  <FiDollarSign size={22} className="text-purple-600" />
                </div>
              </div>
            </div>
          </section>

          {/* =================================================
              INVENTORY SUMMARY
          ================================================= */}

          <section className="mb-5 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <FiBox className="text-blue-600" />

              <h2 className="font-bold text-gray-800">ملخص المخزون</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500">الكمية المشتراة</p>

                <p className="mt-2 text-lg font-black text-gray-800">
                  {formatNumber(totals.purchaseQuantity)}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500">الكمية المباعة</p>

                <p className="mt-2 text-lg font-black text-gray-800">
                  {formatNumber(totals.saleQuantity)}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500">متوسط سعر الشراء</p>

                <p className="mt-2 text-lg font-black text-gray-800">
                  {formatMoney(totals.averagePurchasePrice)}
                </p>
              </div>

              <div className="rounded-lg bg-gray-50 p-4">
                <p className="text-xs text-gray-500">قيمة المخزون الحالية</p>

                <p className="mt-2 text-lg font-black text-gray-800">
                  {formatMoney(totals.inventoryValue)}
                </p>
              </div>
            </div>

            {/* Stock calculation */}

            <div className="mt-5 rounded-lg border border-blue-100 bg-blue-50 p-4">
              <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-bold text-blue-800">
                <span>المشتريات</span>

                <span className="text-blue-400">−</span>

                <span>المبيعات</span>

                <span className="text-blue-400">=</span>

                <span>الكمية الحالية</span>

                <span className="mr-2 rounded-lg bg-white px-4 py-2 text-blue-900 shadow-sm">
                  {formatNumber(totals.purchaseQuantity)} −{" "}
                  {formatNumber(totals.saleQuantity)} ={" "}
                  {formatNumber(totals.currentQuantity)}
                </span>
              </div>
            </div>
          </section>

          {/* =================================================
              PURCHASES
          ================================================= */}

          <section className="mb-5 rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <div className="flex items-center gap-2">
                <FiTruck className="text-green-600" />

                <div>
                  <h2 className="font-bold text-gray-800">حركة المشتريات</h2>

                  <p className="mt-1 text-xs text-gray-500">
                    الفواتير التي دخل منها المنتج إلى المخزون
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                {purchaseMovements.length} حركة
              </span>
            </div>

            <div className="overflow-x-auto">
              {purchaseMovements.length === 0 ? (
                <div className="p-10 text-center">
                  <FiTruck size={35} className="mx-auto text-gray-300" />

                  <p className="mt-3 text-sm font-bold text-gray-500">
                    لا توجد مشتريات لهذا المنتج
                  </p>
                </div>
              ) : (
                <table className="w-full min-w-[900px] border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-600">
                      <th className="border-b border-gray-200 px-4 py-3 text-right">
                        الفاتورة
                      </th>

                      <th className="border-b border-gray-200 px-4 py-3 text-right">
                        التاريخ
                      </th>

                      <th className="border-b border-gray-200 px-4 py-3 text-right">
                        المورد
                      </th>

                      <th className="border-b border-gray-200 px-4 py-3 text-center">
                        الكمية
                      </th>

                      <th className="border-b border-gray-200 px-4 py-3 text-center">
                        سعر الوحدة
                      </th>

                      <th className="border-b border-gray-200 px-4 py-3 text-center">
                        الإجمالي
                      </th>

                      <th className="border-b border-gray-200 px-4 py-3 text-center">
                        الدفع
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {purchaseMovements.map((movement) => (
                      <tr
                        key={movement.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="border-b border-gray-100 px-4 py-3 text-sm font-bold text-blue-700">
                          {movement.invoiceNumber}
                        </td>

                        <td className="border-b border-gray-100 px-4 py-3 text-sm text-gray-600">
                          {movement.date}
                        </td>

                        <td className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
                          {movement.supplier}
                        </td>

                        <td className="border-b border-gray-100 px-4 py-3 text-center text-sm font-bold text-gray-800">
                          {formatNumber(movement.quantity)}
                        </td>

                        <td className="border-b border-gray-100 px-4 py-3 text-center text-sm text-gray-700">
                          {formatMoney(movement.price)}
                        </td>

                        <td className="border-b border-gray-100 px-4 py-3 text-center text-sm font-bold text-gray-800">
                          {formatMoney(movement.total)}
                        </td>

                        <td className="border-b border-gray-100 px-4 py-3 text-center">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                            {getPaymentMethodName(movement.paymentMethod)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* =================================================
              SALES
          ================================================= */}

          <section className="mb-5 rounded-xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-200 p-5">
              <div className="flex items-center gap-2">
                <FiShoppingCart className="text-red-600" />

                <div>
                  <h2 className="font-bold text-gray-800">حركة المبيعات</h2>

                  <p className="mt-1 text-xs text-gray-500">
                    الفواتير التي خرج منها المنتج من المخزون
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                {saleMovements.length} حركة
              </span>
            </div>

            <div className="overflow-x-auto">
              {saleMovements.length === 0 ? (
                <div className="p-10 text-center">
                  <FiShoppingCart size={35} className="mx-auto text-gray-300" />

                  <p className="mt-3 text-sm font-bold text-gray-500">
                    لا توجد مبيعات لهذا المنتج
                  </p>
                </div>
              ) : (
                <table className="w-full min-w-[950px] border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-xs text-gray-600">
                      <th className="border-b border-gray-200 px-4 py-3 text-right">
                        الفاتورة
                      </th>

                      <th className="border-b border-gray-200 px-4 py-3 text-right">
                        التاريخ
                      </th>

                      <th className="border-b border-gray-200 px-4 py-3 text-right">
                        العميل
                      </th>

                      <th className="border-b border-gray-200 px-4 py-3 text-center">
                        الكمية
                      </th>

                      <th className="border-b border-gray-200 px-4 py-3 text-center">
                        سعر البيع
                      </th>

                      <th className="border-b border-gray-200 px-4 py-3 text-center">
                        الإجمالي
                      </th>

                      <th className="border-b border-gray-200 px-4 py-3 text-center">
                        الدفع
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {saleMovements.map((movement) => (
                      <tr
                        key={movement.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="border-b border-gray-100 px-4 py-3 text-sm font-bold text-blue-700">
                          {movement.invoiceNumber}
                        </td>

                        <td className="border-b border-gray-100 px-4 py-3 text-sm text-gray-600">
                          {movement.date}
                        </td>

                        <td className="border-b border-gray-100 px-4 py-3 text-sm font-semibold text-gray-700">
                          {movement.customer}
                        </td>

                        <td className="border-b border-gray-100 px-4 py-3 text-center text-sm font-bold text-red-700">
                          -{formatNumber(movement.quantity)}
                        </td>

                        <td className="border-b border-gray-100 px-4 py-3 text-center text-sm text-gray-700">
                          {formatMoney(movement.price)}
                        </td>

                        <td className="border-b border-gray-100 px-4 py-3 text-center text-sm font-bold text-gray-800">
                          {formatMoney(movement.total)}
                        </td>

                        <td className="border-b border-gray-100 px-4 py-3 text-center">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                            {getPaymentMethodName(movement.paymentMethod)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* =================================================
              CURRENT STOCK MESSAGE
          ================================================= */}

          <section
            className={`mb-5 rounded-xl border p-5 ${stockStatus.className}`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${stockStatus.iconClass}`}
              >
                <stockStatus.Icon size={25} />
              </div>

              <div>
                <h3 className="font-black">{stockStatus.label}</h3>

                <p className="mt-1 text-sm">
                  الكمية المتبقية من المنتج:{" "}
                  <strong>{formatNumber(totals.currentQuantity)}</strong>{" "}
                  {product.unit || "وحدة"}
                </p>
              </div>
            </div>
          </section>

          {/* =================================================
              COMPANY FOOTER
          ================================================= */}

          <footer className="rounded-xl border border-gray-200 bg-white p-5 text-center">
            <p className="text-sm font-bold text-gray-700">شركة الجابري</p>

            <p className="mt-1 text-xs text-gray-500">
              للعسل والزيوت الطبيعة وخدمات العمرة
            </p>

            <p className="mt-1 text-xs text-gray-400">
              البيضاء - اليمن | هاتف: 734 434 443
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}
