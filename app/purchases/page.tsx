"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useERPStore } from "@/Store/erpStore";

import {
  FiPlus,
  FiSearch,
  FiFileText,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiMoreVertical,
  FiEye,
  FiPrinter,
  FiRefreshCw,
  FiX,
  FiFilter,
  FiCalendar,
  FiUser,
} from "react-icons/fi";

export default function PurchasesPage() {
  // ==================================================
  // Zustand
  // ==================================================

  const { purchases, suppliers } = useERPStore();

  // ==================================================
  // الحالات
  // ==================================================

  const [search, setSearch] = useState("");

  const [supplierFilter, setSupplierFilter] = useState("all");

  const [paymentFilter, setPaymentFilter] = useState("all");

  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedPurchase, setSelectedPurchase] = useState<string | null>(null);

  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const [showFilters, setShowFilters] = useState(false);

  // ==================================================
  // تنسيق العملة
  // ==================================================

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("ar-SA").format(Number(value || 0));
  };

  // ==================================================
  // تنسيق التاريخ
  // ==================================================

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

  // ==================================================
  // الموردون الموجودون في الفواتير
  // ==================================================

  const purchaseSuppliers = useMemo(() => {
    const map = new Map<
      string,
      {
        id: string;
        name: string;
      }
    >();

    purchases.forEach((purchase) => {
      if (!map.has(purchase.supplierId)) {
        map.set(purchase.supplierId, {
          id: purchase.supplierId,
          name: purchase.supplierName,
        });
      }
    });

    suppliers.forEach((supplier) => {
      if (!map.has(supplier.id)) {
        map.set(supplier.id, {
          id: supplier.id,
          name: supplier.name,
        });
      }
    });

    return Array.from(map.values());
  }, [purchases, suppliers]);

  // ==================================================
  // الفواتير المفلترة
  // ==================================================

  const filteredPurchases = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return purchases
      .filter((purchase) => {
        if (!searchValue) return true;

        return (
          purchase.invoiceNumber.toLowerCase().includes(searchValue) ||
          purchase.supplierName.toLowerCase().includes(searchValue) ||
          (purchase.accountName ?? "").toLowerCase().includes(searchValue)
        );
      })

      .filter((purchase) => {
        if (supplierFilter === "all") {
          return true;
        }

        return purchase.supplierId === supplierFilter;
      })

      .filter((purchase) => {
        if (paymentFilter === "all") {
          return true;
        }

        return purchase.paymentMethod === paymentFilter;
      })

      .filter((purchase) => {
        if (statusFilter === "all") {
          return true;
        }

        if (statusFilter === "paid") {
          return (
            purchase.paymentMethod === "cash" ||
            purchase.paymentMethod === "bank"
          );
        }

        if (statusFilter === "credit") {
          return purchase.paymentMethod === "credit";
        }

        return true;
      })

      .sort((a, b) => {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [purchases, search, supplierFilter, paymentFilter, statusFilter]);

  // ==================================================
  // الإحصائيات
  // ==================================================

  const statistics = useMemo(() => {
    const total = purchases.reduce(
      (sum, purchase) => sum + Number(purchase.total || 0),
      0,
    );

    const tax = purchases.reduce(
      (sum, purchase) => sum + Number(purchase.tax || 0),
      0,
    );

    const cash = purchases
      .filter((purchase) => purchase.paymentMethod === "cash")
      .reduce((sum, purchase) => sum + Number(purchase.total || 0), 0);

    const bank = purchases
      .filter((purchase) => purchase.paymentMethod === "bank")
      .reduce((sum, purchase) => sum + Number(purchase.total || 0), 0);

    const credit = purchases
      .filter((purchase) => purchase.paymentMethod === "credit")
      .reduce((sum, purchase) => sum + Number(purchase.total || 0), 0);

    return {
      count: purchases.length,
      total,
      tax,
      cash,
      bank,
      credit,
    };
  }, [purchases]);

  // ==================================================
  // الفاتورة المحددة
  // ==================================================

  const selectedPurchaseData = useMemo(() => {
    if (!selectedPurchase) {
      return null;
    }

    return purchases.find((purchase) => purchase.id === selectedPurchase);
  }, [purchases, selectedPurchase]);

  // ==================================================
  // طريقة الدفع
  // ==================================================

  const paymentLabel = (paymentMethod: string) => {
    switch (paymentMethod) {
      case "cash":
        return "نقدي";

      case "bank":
        return "تحويل بنكي";

      case "credit":
        return "آجل";

      default:
        return paymentMethod;
    }
  };

  // ==================================================
  // لون طريقة الدفع
  // ==================================================

  const paymentClass = (paymentMethod: string) => {
    switch (paymentMethod) {
      case "cash":
        return "bg-green-50 text-green-700 border-green-200";

      case "bank":
        return "bg-blue-50 text-blue-700 border-blue-200";

      case "credit":
        return "bg-orange-50 text-orange-700 border-orange-200";

      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // ==================================================
  // طباعة
  // ==================================================

  const handlePrint = (purchaseId: string) => {
    setMenuOpen(null);

    window.open(`/purchases/${purchaseId}/print`, "_blank");
  };

  // ==================================================
  // الصفحة
  // ==================================================

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-3 text-sm md:p-4">
      <div className="mx-auto max-w-[1500px]">
        {/* ==================================================
            رأس الصفحة
        ================================================== */}

        <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[11px] text-gray-400">
              <Link href="/" className="transition hover:text-[#0E1F33]">
                الرئيسية
              </Link>

              <span>/</span>

              <span className="text-gray-600">المشتريات</span>
            </div>

            <h1 className="text-xl font-bold text-gray-900">المشتريات</h1>

            <p className="mt-0.5 text-[11px] text-gray-500">
              إدارة ومتابعة فواتير المشتريات
            </p>
          </div>

          <Link
            href="/purchases/new"
            className="flex items-center justify-center gap-2 rounded-lg bg-[#0E1F33] px-4 py-2 text-xs font-medium text-white transition hover:opacity-90"
          >
            <FiPlus size={15} />
            فاتورة مشتريات جديدة
          </Link>
        </div>

        {/* ==================================================
            بطاقات الإحصائيات
        ================================================== */}

        <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          {/* عدد الفواتير */}

          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] text-gray-400">عدد الفواتير</p>

                <p className="mt-1 text-lg font-bold text-gray-800">
                  {formatMoney(statistics.count)}
                </p>
              </div>

              <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                <FiFileText size={17} />
              </div>
            </div>
          </div>

          {/* إجمالي المشتريات */}

          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] text-gray-400">إجمالي المشتريات</p>

                <p className="mt-1 text-lg font-bold text-gray-800">
                  {formatMoney(statistics.total)}
                </p>

                <p className="text-[9px] text-gray-400">ريال</p>
              </div>

              <div className="rounded-lg bg-green-50 p-2 text-green-600">
                <FiDollarSign size={17} />
              </div>
            </div>
          </div>

          {/* المدفوعة */}

          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] text-gray-400">المشتريات المدفوعة</p>

                <p className="mt-1 text-lg font-bold text-gray-800">
                  {formatMoney(statistics.cash + statistics.bank)}
                </p>
              </div>

              <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                <FiCheckCircle size={17} />
              </div>
            </div>
          </div>

          {/* الآجل */}

          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] text-gray-400">المشتريات الآجلة</p>

                <p className="mt-1 text-lg font-bold text-gray-800">
                  {formatMoney(statistics.credit)}
                </p>
              </div>

              <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
                <FiClock size={17} />
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            البحث والفلاتر
        ================================================== */}

        <div className="mb-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row">
            {/* البحث */}

            <div className="relative flex-1">
              <FiSearch
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={15}
              />

              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="البحث برقم الفاتورة أو اسم المورد..."
                className="w-full rounded-md border border-gray-200 bg-gray-50 py-2 pr-9 pl-9 text-xs outline-none transition focus:border-[#0E1F33] focus:bg-white"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>

            {/* الفلاتر */}

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-xs font-medium transition ${
                showFilters
                  ? "border-[#0E1F33] bg-[#0E1F33] text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <FiFilter size={14} />
              الفلاتر
            </button>
          </div>

          {/* ==================================================
              الفلاتر
          ================================================== */}

          {showFilters && (
            <div className="mt-3 grid grid-cols-1 gap-2 border-t border-gray-100 pt-3 md:grid-cols-3">
              {/* المورد */}

              <div>
                <label className="mb-1 block text-[10px] font-medium text-gray-500">
                  المورد
                </label>

                <select
                  value={supplierFilter}
                  onChange={(event) => setSupplierFilter(event.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-[#0E1F33]"
                >
                  <option value="all">جميع الموردين</option>

                  {purchaseSuppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* طريقة الدفع */}

              <div>
                <label className="mb-1 block text-[10px] font-medium text-gray-500">
                  طريقة الدفع
                </label>

                <select
                  value={paymentFilter}
                  onChange={(event) => setPaymentFilter(event.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-[#0E1F33]"
                >
                  <option value="all">جميع الطرق</option>

                  <option value="cash">نقدي</option>

                  <option value="bank">تحويل بنكي</option>

                  <option value="credit">آجل</option>
                </select>
              </div>

              {/* حالة الدفع */}

              <div>
                <label className="mb-1 block text-[10px] font-medium text-gray-500">
                  حالة الدفع
                </label>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs outline-none focus:border-[#0E1F33]"
                >
                  <option value="all">الكل</option>

                  <option value="paid">مدفوعة</option>

                  <option value="credit">آجلة</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================
            الملخص السريع
        ================================================== */}

        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <span>
              عرض{" "}
              <strong className="text-gray-700">
                {filteredPurchases.length}
              </strong>{" "}
              فاتورة
            </span>

            <span>|</span>

            <span>
              الضريبة:{" "}
              <strong className="text-gray-700">
                {formatMoney(statistics.tax)}
              </strong>
            </span>
          </div>

          {(search !== "" ||
            supplierFilter !== "all" ||
            paymentFilter !== "all" ||
            statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setSupplierFilter("all");
                setPaymentFilter("all");
                setStatusFilter("all");
              }}
              className="flex items-center gap-1.5 text-[10px] text-[#0E1F33] hover:underline"
            >
              <FiRefreshCw size={11} />
              إعادة ضبط الفلاتر
            </button>
          )}
        </div>

        {/* ==================================================
            جدول المشتريات
        ================================================== */}

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {filteredPurchases.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center p-6 text-center">
              <div className="mb-3 rounded-full bg-gray-100 p-4 text-gray-400">
                <FiFileText size={26} />
              </div>

              <h3 className="text-sm font-bold text-gray-700">
                لا توجد فواتير مشتريات
              </h3>

              <p className="mt-1 text-[10px] text-gray-400">
                لم يتم العثور على فواتير مطابقة للبحث أو الفلاتر.
              </p>

              <Link
                href="/purchases/new"
                className="mt-4 flex items-center gap-2 rounded-md bg-[#0E1F33] px-4 py-2 text-xs text-white"
              >
                <FiPlus size={14} />
                إنشاء فاتورة مشتريات
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1000px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-gray-500">
                      #
                    </th>

                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-gray-500">
                      رقم الفاتورة
                    </th>

                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-gray-500">
                      التاريخ
                    </th>

                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-gray-500">
                      المورد
                    </th>

                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-gray-500">
                      الأصناف
                    </th>

                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-gray-500">
                      الضريبة
                    </th>

                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-gray-500">
                      الإجمالي
                    </th>

                    <th className="px-3 py-2.5 text-right text-[10px] font-semibold text-gray-500">
                      الدفع
                    </th>

                    <th className="px-3 py-2.5 text-center text-[10px] font-semibold text-gray-500">
                      الإجراءات
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredPurchases.map((purchase, index) => {
                    const taxValue = Number(purchase.tax || 0);

                    const taxRateValue = Number(purchase.taxRate || 0);

                    return (
                      <tr
                        key={purchase.id}
                        className="transition hover:bg-gray-50"
                      >
                        {/* الرقم */}

                        <td className="px-3 py-2.5 text-[10px] text-gray-400">
                          {index + 1}
                        </td>

                        {/* رقم الفاتورة */}

                        <td className="px-3 py-2.5">
                          <div className="text-xs font-semibold text-[#0E1F33]">
                            {purchase.invoiceNumber}
                          </div>

                          <div className="mt-0.5 text-[9px] text-gray-400">
                            {purchase.accountCode || "-"}
                          </div>
                        </td>

                        {/* التاريخ */}

                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
                            <FiCalendar size={12} className="text-gray-400" />

                            {formatDate(purchase.date)}
                          </div>
                        </td>

                        {/* المورد */}

                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="rounded-md bg-gray-100 p-1.5 text-gray-400">
                              <FiUser size={13} />
                            </div>

                            <div>
                              <div className="text-xs font-medium text-gray-700">
                                {purchase.supplierName}
                              </div>

                              <div className="mt-0.5 text-[9px] text-gray-400">
                                {purchase.accountName || "-"}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* الأصناف */}

                        <td className="px-3 py-2.5">
                          <span className="rounded-full bg-gray-100 px-2 py-1 text-[9px] font-medium text-gray-600">
                            {formatMoney(purchase.items?.length || 0)} صنف
                          </span>
                        </td>

                        {/* الضريبة */}

                        <td className="px-3 py-2.5">
                          {purchase.hasTax ? (
                            <div>
                              <div className="text-[10px] font-medium text-gray-700">
                                {formatMoney(taxValue)}
                              </div>

                              <div className="mt-0.5 text-[9px] text-gray-400">
                                {taxRateValue}%
                              </div>
                            </div>
                          ) : (
                            <span className="text-[9px] text-gray-400">
                              بدون ضريبة
                            </span>
                          )}
                        </td>

                        {/* الإجمالي */}

                        <td className="px-3 py-2.5">
                          <div className="text-xs font-bold text-gray-800">
                            {formatMoney(purchase.total)}
                          </div>

                          <div className="text-[9px] text-gray-400">ريال</div>
                        </td>

                        {/* طريقة الدفع */}

                        <td className="px-3 py-2.5">
                          <span
                            className={`inline-flex rounded-full border px-2 py-1 text-[9px] font-medium ${paymentClass(
                              purchase.paymentMethod,
                            )}`}
                          >
                            {paymentLabel(purchase.paymentMethod)}
                          </span>
                        </td>

                        {/* الإجراءات */}

                        <td className="px-3 py-2.5">
                          <div className="relative flex items-center justify-center">
                            <button
                              type="button"
                              onClick={() =>
                                setMenuOpen(
                                  menuOpen === purchase.id ? null : purchase.id,
                                )
                              }
                              className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-800"
                            >
                              <FiMoreVertical size={15} />
                            </button>

                            {menuOpen === purchase.id && (
                              <div className="absolute left-0 top-8 z-30 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 text-right shadow-xl">
                                {/* عرض */}

                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedPurchase(purchase.id);

                                    setMenuOpen(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-[11px] text-gray-600 hover:bg-gray-50"
                                >
                                  <FiEye size={14} />
                                  عرض التفاصيل
                                </button>

                                {/* طباعة */}

                                <button
                                  type="button"
                                  onClick={() => handlePrint(purchase.id)}
                                  className="flex w-full items-center gap-2 px-3 py-2 text-[11px] text-gray-600 hover:bg-gray-50"
                                >
                                  <FiPrinter size={14} />
                                  طباعة
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ==================================================
            نافذة تفاصيل الفاتورة
        ================================================== */}

        {selectedPurchaseData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl">
              {/* رأس النافذة */}

              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div>
                  <h2 className="text-sm font-bold text-gray-800">
                    تفاصيل فاتورة المشتريات
                  </h2>

                  <p className="mt-0.5 text-[10px] text-gray-400">
                    {selectedPurchaseData.invoiceNumber}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPurchase(null)}
                  className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100"
                >
                  <FiX size={18} />
                </button>
              </div>

              {/* المحتوى */}

              <div className="max-h-[calc(90vh-65px)] overflow-y-auto p-4">
                {/* البيانات الأساسية */}

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <div className="rounded-md bg-gray-50 p-3">
                    <p className="text-[9px] text-gray-400">رقم الفاتورة</p>

                    <p className="mt-1 text-xs font-bold text-gray-700">
                      {selectedPurchaseData.invoiceNumber}
                    </p>
                  </div>

                  <div className="rounded-md bg-gray-50 p-3">
                    <p className="text-[9px] text-gray-400">التاريخ</p>

                    <p className="mt-1 text-xs font-bold text-gray-700">
                      {formatDate(selectedPurchaseData.date)}
                    </p>
                  </div>

                  <div className="rounded-md bg-gray-50 p-3">
                    <p className="text-[9px] text-gray-400">المورد</p>

                    <p className="mt-1 text-xs font-bold text-gray-700">
                      {selectedPurchaseData.supplierName}
                    </p>
                  </div>

                  <div className="rounded-md bg-gray-50 p-3">
                    <p className="text-[9px] text-gray-400">طريقة الدفع</p>

                    <p className="mt-1 text-xs font-bold text-gray-700">
                      {paymentLabel(selectedPurchaseData.paymentMethod)}
                    </p>
                  </div>
                </div>

                {/* جدول التفاصيل */}

                <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full min-w-[650px]">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-right text-[10px] font-semibold text-gray-500">
                          الصنف
                        </th>

                        <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500">
                          الكمية
                        </th>

                        <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500">
                          السعر
                        </th>

                        <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500">
                          الخصم
                        </th>

                        <th className="px-3 py-2 text-center text-[10px] font-semibold text-gray-500">
                          الإجمالي
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {selectedPurchaseData.items.map((item, index) => (
                        <tr key={`${item.productId}-${index}`}>
                          <td className="px-3 py-2 text-xs text-gray-700">
                            {item.productName}
                          </td>

                          <td className="px-3 py-2 text-center text-xs">
                            {formatMoney(item.quantity)}
                          </td>

                          <td className="px-3 py-2 text-center text-xs">
                            {formatMoney(item.price)}
                          </td>

                          <td className="px-3 py-2 text-center text-xs">
                            {formatMoney(item.discount)}
                          </td>

                          <td className="px-3 py-2 text-center text-xs font-semibold">
                            {formatMoney(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* الإجماليات */}

                <div className="mt-4 flex justify-end">
                  <div className="w-full max-w-xs space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">المجموع الفرعي</span>

                      <span className="font-semibold text-gray-700">
                        {formatMoney(selectedPurchaseData.subtotal)}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">الخصم</span>

                      <span className="font-semibold text-gray-700">
                        {formatMoney(selectedPurchaseData.discount)}
                      </span>
                    </div>

                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">الضريبة</span>

                      <span className="font-semibold text-gray-700">
                        {selectedPurchaseData.hasTax
                          ? `${formatMoney(selectedPurchaseData.tax)} (${Number(
                              selectedPurchaseData.taxRate || 0,
                            )}%)`
                          : "بدون ضريبة"}
                      </span>
                    </div>

                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex justify-between text-sm font-bold">
                        <span>الإجمالي</span>

                        <span>{formatMoney(selectedPurchaseData.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* الملاحظات */}

                {selectedPurchaseData.notes && (
                  <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3">
                    <h3 className="mb-1 text-xs font-bold text-gray-700">
                      ملاحظات
                    </h3>

                    <p className="whitespace-pre-wrap text-[11px] text-gray-500">
                      {selectedPurchaseData.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
