"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiFileText,
  FiDollarSign,
  FiClock,
  FiCheckCircle,
  FiMoreVertical,
  FiPrinter,
  FiEye,
  FiX,
  FiCreditCard,
  FiUser,
} from "react-icons/fi";

import { usePurchasesStore } from "@/Store/purchasesStore";
import { useSuppliersStore } from "@/Store/suppliersStore";

/* =========================================================
   الأنواع
========================================================= */

type PaymentMethod = "cash" | "bank" | "credit";

type PurchaseStatus = "paid" | "pending" | "cancelled" | string;

/* =========================================================
   تنسيق العملة
========================================================= */

const formatMoney = (value: number = 0) => {
  return new Intl.NumberFormat("ar-SA", {
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
};

/* =========================================================
   أسماء طرق الدفع
========================================================= */

const paymentLabels: Record<PaymentMethod, string> = {
  cash: "نقدي",
  bank: "تحويل بنكي",
  credit: "آجل",
};

/* =========================================================
   الصفحة
========================================================= */

export default function PurchasesPage() {
  /* =======================================================
     Stores
  ======================================================= */

  const purchases = usePurchasesStore((state) => state.purchases);
  const suppliers = useSuppliersStore((state) => state.suppliers);

  /* =======================================================
     States
  ======================================================= */

  const [search, setSearch] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedPurchase, setSelectedPurchase] = useState<any>(null);

  const [showDetails, setShowDetails] = useState(false);

  const [openMenu, setOpenMenu] = useState<string | null>(null);

  /* =======================================================
     خريطة الموردين

     نستخدم useSuppliersStore كمصدر أساسي للموردين
  ======================================================= */

  const supplierMap = useMemo(() => {
    const map = new Map<string, (typeof suppliers)[number]>();

    suppliers.forEach((supplier) => {
      map.set(supplier.id, supplier);
    });

    return map;
  }, [suppliers]);

  /* =======================================================
     تجهيز المشتريات

     يتم أخذ بيانات المورد من Suppliers Store
  ======================================================= */

  const purchasesWithSupplier = useMemo(() => {
    return purchases.map((purchase: any) => {
      const supplier = supplierMap.get(purchase.supplierId);

      const isCredit = purchase.paymentMethod === "credit";

      return {
        ...purchase,

        supplierData: supplier,

        /* المورد من Store هو المصدر الأساسي */
        supplierDisplayName: supplier?.name || purchase.supplier || "غير محدد",

        supplierPhone: supplier?.phone || "",

        supplierAccountCode:
          supplier?.accountCode || purchase.accountCode || "",

        supplierAccountName:
          supplier?.accountName || purchase.accountName || "",

        /*
          الحساب المحاسبي يستخدم فعلياً
          في حالة الشراء الآجل
        */
        linkedAccountCode: isCredit
          ? supplier?.accountCode || purchase.accountCode || ""
          : "",

        linkedAccountName: isCredit
          ? supplier?.accountName || purchase.accountName || ""
          : "",
      };
    });
  }, [purchases, supplierMap]);

  /* =======================================================
     الفلترة
  ======================================================= */

  const filteredPurchases = useMemo(() => {
    const query = search.trim().toLowerCase();

    return purchasesWithSupplier.filter((purchase: any) => {
      const matchesSearch =
        !query ||
        String(purchase.invoiceNumber || "")
          .toLowerCase()
          .includes(query) ||
        String(purchase.supplierDisplayName || "")
          .toLowerCase()
          .includes(query) ||
        String(purchase.supplierAccountCode || "")
          .toLowerCase()
          .includes(query) ||
        String(purchase.supplierAccountName || "")
          .toLowerCase()
          .includes(query);

      const matchesSupplier =
        !supplierFilter || purchase.supplierId === supplierFilter;

      const matchesPayment =
        !paymentFilter || purchase.paymentMethod === paymentFilter;

      const matchesStatus = !statusFilter || purchase.status === statusFilter;

      return (
        matchesSearch && matchesSupplier && matchesPayment && matchesStatus
      );
    });
  }, [
    purchasesWithSupplier,
    search,
    supplierFilter,
    paymentFilter,
    statusFilter,
  ]);

  /* =======================================================
     الإحصائيات
  ======================================================= */

  const statistics = useMemo(() => {
    const totalInvoices = filteredPurchases.length;

    const totalPurchases = filteredPurchases.reduce(
      (sum: number, purchase: any) => sum + Number(purchase.total || 0),
      0,
    );

    const paid = filteredPurchases.reduce((sum: number, purchase: any) => {
      if (
        purchase.paymentMethod === "credit" ||
        purchase.status === "pending"
      ) {
        return sum;
      }

      return sum + Number(purchase.total || 0);
    }, 0);

    const credit = filteredPurchases.reduce((sum: number, purchase: any) => {
      if (purchase.paymentMethod === "credit") {
        return sum + Number(purchase.total || 0);
      }

      return sum;
    }, 0);

    return {
      totalInvoices,
      totalPurchases,
      paid,
      credit,
    };
  }, [filteredPurchases]);

  /* =======================================================
     فتح التفاصيل
  ======================================================= */

  const handleView = (purchase: any) => {
    setSelectedPurchase(purchase);
    setShowDetails(true);
    setOpenMenu(null);
  };

  /* =======================================================
     الطباعة
  ======================================================= */

  const handlePrint = (purchase: any) => {
    setSelectedPurchase(purchase);
    setOpenMenu(null);

    setTimeout(() => {
      window.print();
    }, 200);
  };

  /* =======================================================
     حالة الفاتورة
  ======================================================= */

  const getStatusLabel = (status: PurchaseStatus) => {
    switch (status) {
      case "paid":
        return "مدفوعة";

      case "pending":
        return "آجلة";

      case "cancelled":
        return "ملغاة";

      default:
        return status || "غير محدد";
    }
  };

  const getStatusClass = (status: PurchaseStatus) => {
    switch (status) {
      case "paid":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";

      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";

      case "cancelled":
        return "bg-red-50 text-red-700 border-red-200";

      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gray-50 text-gray-800 text-[12px]"
    >
      {/* ===================================================
          رأس الصفحة
      =================================================== */}

      <div className="px-3 sm:px-4 lg:px-5 pt-3 pb-2">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-base sm:text-lg font-bold text-gray-900">
              المشتريات
            </h1>

            <p className="mt-0.5 text-[10px] text-gray-500">
              إدارة ومتابعة فواتير المشتريات وحسابات الموردين
            </p>
          </div>

          <Link
            href="/purchases/new"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-[#0E1F33] px-3 text-[11px] font-semibold text-white transition hover:bg-[#162d49]"
          >
            <FiPlus size={14} />
            فاتورة شراء جديدة
          </Link>
        </div>
      </div>

      {/* ===================================================
          الإحصائيات
      =================================================== */}

      <div className="grid grid-cols-2 gap-2 px-3 sm:grid-cols-4 sm:px-4 lg:px-5">
        {/* عدد الفواتير */}

        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500">عدد الفواتير</p>

              <p className="mt-0.5 text-base font-bold text-gray-900">
                {statistics.totalInvoices}
              </p>
            </div>

            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600">
              <FiFileText size={14} />
            </div>
          </div>
        </div>

        {/* إجمالي المشتريات */}

        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500">إجمالي المشتريات</p>

              <p className="mt-0.5 text-base font-bold text-gray-900">
                {formatMoney(statistics.totalPurchases)}
              </p>
            </div>

            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-50 text-purple-600">
              <FiDollarSign size={14} />
            </div>
          </div>
        </div>

        {/* المدفوع */}

        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500">المدفوع</p>

              <p className="mt-0.5 text-base font-bold text-emerald-600">
                {formatMoney(statistics.paid)}
              </p>
            </div>

            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
              <FiCheckCircle size={14} />
            </div>
          </div>
        </div>

        {/* الآجل */}

        <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-gray-500">المشتريات الآجلة</p>

              <p className="mt-0.5 text-base font-bold text-amber-600">
                {formatMoney(statistics.credit)}
              </p>
            </div>

            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-600">
              <FiClock size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================
          البحث والفلاتر
      =================================================== */}

      <div className="px-3 pt-3 sm:px-4 lg:px-5">
        <div className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-sm">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {/* البحث */}

            <div className="relative">
              <FiSearch
                size={14}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث برقم الفاتورة أو المورد..."
                className="h-8 w-full rounded-md border border-gray-200 bg-gray-50 pr-8 pl-2 text-[11px] outline-none transition focus:border-[#0E1F33] focus:bg-white"
              />
            </div>

            {/* المورد */}

            <select
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="h-8 rounded-md border border-gray-200 bg-gray-50 px-2 text-[11px] outline-none focus:border-[#0E1F33]"
            >
              <option value="">كل الموردين</option>

              {suppliers
                .filter((supplier) => supplier.isActive !== false)
                .map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
            </select>

            {/* طريقة الدفع */}

            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="h-8 rounded-md border border-gray-200 bg-gray-50 px-2 text-[11px] outline-none focus:border-[#0E1F33]"
            >
              <option value="">كل طرق الدفع</option>
              <option value="cash">نقدي</option>
              <option value="bank">تحويل بنكي</option>
              <option value="credit">آجل</option>
            </select>

            {/* الحالة */}

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-8 rounded-md border border-gray-200 bg-gray-50 px-2 text-[11px] outline-none focus:border-[#0E1F33]"
            >
              <option value="">كل الحالات</option>
              <option value="paid">مدفوعة</option>
              <option value="pending">آجلة</option>
              <option value="cancelled">ملغاة</option>
            </select>
          </div>
        </div>
      </div>

      {/* ===================================================
          الجدول
      =================================================== */}

      <div className="px-3 pb-4 pt-3 sm:px-4 lg:px-5">
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          {/* رأس الجدول */}

          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <div>
              <h2 className="text-[12px] font-bold text-gray-900">
                فواتير المشتريات
              </h2>

              <p className="mt-0.5 text-[9px] text-gray-400">
                {filteredPurchases.length} فاتورة
              </p>
            </div>
          </div>

          {/* Scroll أفقي عند الحاجة */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-[10px] text-gray-500">
                  <th className="whitespace-nowrap px-2.5 py-2 text-right font-semibold">
                    #
                  </th>

                  <th className="whitespace-nowrap px-2.5 py-2 text-right font-semibold">
                    رقم الفاتورة
                  </th>

                  <th className="whitespace-nowrap px-2.5 py-2 text-right font-semibold">
                    التاريخ
                  </th>

                  <th className="whitespace-nowrap px-2.5 py-2 text-right font-semibold">
                    المورد
                  </th>

                  <th className="whitespace-nowrap px-2.5 py-2 text-right font-semibold">
                    الحساب
                  </th>

                  <th className="whitespace-nowrap px-2.5 py-2 text-center font-semibold">
                    الأصناف
                  </th>

                  <th className="whitespace-nowrap px-2.5 py-2 text-right font-semibold">
                    الإجمالي
                  </th>

                  <th className="whitespace-nowrap px-2.5 py-2 text-center font-semibold">
                    الدفع
                  </th>

                  <th className="whitespace-nowrap px-2.5 py-2 text-center font-semibold">
                    الحالة
                  </th>

                  <th className="whitespace-nowrap px-2.5 py-2 text-center font-semibold">
                    الإجراءات
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredPurchases.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FiFileText size={30} className="mb-2 text-gray-300" />

                        <p className="text-[11px] font-semibold text-gray-500">
                          لا توجد فواتير مشتريات
                        </p>

                        <p className="mt-1 text-[9px] text-gray-400">
                          جرّب تغيير البحث أو الفلاتر
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPurchases.map((purchase: any, index: number) => {
                    const isCredit = purchase.paymentMethod === "credit";

                    return (
                      <tr
                        key={purchase.id || purchase.invoiceNumber || index}
                        className="border-b border-gray-100 transition hover:bg-gray-50"
                      >
                        {/* الرقم */}

                        <td className="whitespace-nowrap px-2.5 py-2 text-[10px] text-gray-400">
                          {index + 1}
                        </td>

                        {/* رقم الفاتورة */}

                        <td className="whitespace-nowrap px-2.5 py-2">
                          <button
                            type="button"
                            onClick={() => handleView(purchase)}
                            className="font-semibold text-[#0E1F33] hover:underline"
                          >
                            {purchase.invoiceNumber || purchase.id || "-"}
                          </button>
                        </td>

                        {/* التاريخ */}

                        <td className="whitespace-nowrap px-2.5 py-2 text-[10px] text-gray-600">
                          {purchase.date || "-"}
                        </td>

                        {/* المورد */}

                        <td className="px-2.5 py-2">
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                              <FiUser size={12} />
                            </div>

                            <div className="min-w-0">
                              <p className="max-w-[150px] truncate text-[10px] font-semibold text-gray-800">
                                {purchase.supplierDisplayName}
                              </p>

                              {purchase.supplierPhone && (
                                <p className="text-[8px] text-gray-400">
                                  {purchase.supplierPhone}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* الحساب المحاسبي */}

                        <td className="px-2.5 py-2">
                          {isCredit ? (
                            <div className="min-w-[125px]">
                              <div className="flex items-center gap-1">
                                <FiCreditCard
                                  size={11}
                                  className="text-amber-600"
                                />

                                <span className="text-[9px] font-semibold text-amber-700">
                                  {purchase.linkedAccountCode || "بدون حساب"}
                                </span>
                              </div>

                              <p className="mt-0.5 max-w-[150px] truncate text-[8px] text-gray-500">
                                {purchase.linkedAccountName ||
                                  "لم يتم ربط الحساب"}
                              </p>
                            </div>
                          ) : (
                            <span className="text-[9px] text-gray-300">—</span>
                          )}
                        </td>

                        {/* عدد الأصناف */}

                        <td className="whitespace-nowrap px-2.5 py-2 text-center text-[10px] text-gray-600">
                          {purchase.itemCount ?? purchase.items?.length ?? 0}
                        </td>

                        {/* الإجمالي */}

                        <td className="whitespace-nowrap px-2.5 py-2">
                          <span className="text-[10px] font-bold text-gray-900">
                            {formatMoney(purchase.total || 0)}
                          </span>
                        </td>

                        {/* طريقة الدفع */}

                        <td className="whitespace-nowrap px-2.5 py-2 text-center">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-medium ${
                              purchase.paymentMethod === "credit"
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : purchase.paymentMethod === "bank"
                                  ? "border-blue-200 bg-blue-50 text-blue-700"
                                  : "border-emerald-200 bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {paymentLabels[
                              purchase.paymentMethod as PaymentMethod
                            ] ||
                              purchase.paymentMethod ||
                              "-"}
                          </span>
                        </td>

                        {/* الحالة */}

                        <td className="whitespace-nowrap px-2.5 py-2 text-center">
                          <span
                            className={`inline-flex rounded-full border px-2 py-0.5 text-[9px] font-medium ${getStatusClass(
                              purchase.status,
                            )}`}
                          >
                            {getStatusLabel(purchase.status)}
                          </span>
                        </td>

                        {/* الإجراءات */}

                        <td className="relative px-2.5 py-2 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenu(
                                openMenu === purchase.id ? null : purchase.id,
                              )
                            }
                            className="inline-flex h-6 w-6 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
                          >
                            <FiMoreVertical size={14} />
                          </button>

                          {openMenu === purchase.id && (
                            <div className="absolute left-2 top-9 z-30 w-32 overflow-hidden rounded-md border border-gray-200 bg-white text-right shadow-lg">
                              <button
                                type="button"
                                onClick={() => handleView(purchase)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-[10px] text-gray-700 hover:bg-gray-50"
                              >
                                <FiEye size={12} />
                                عرض التفاصيل
                              </button>

                              <button
                                type="button"
                                onClick={() => handlePrint(purchase)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-[10px] text-gray-700 hover:bg-gray-50"
                              >
                                <FiPrinter size={12} />
                                طباعة
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ===================================================
          نافذة التفاصيل
      =================================================== */}

      {showDetails && selectedPurchase && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3"
          onClick={() => setShowDetails(false)}
        >
          <div
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* رأس النافذة */}

            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3">
              <div>
                <h2 className="text-sm font-bold text-gray-900">
                  تفاصيل فاتورة المشتريات
                </h2>

                <p className="mt-0.5 text-[10px] text-gray-400">
                  {selectedPurchase.invoiceNumber || selectedPurchase.id}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 hover:bg-gray-100"
              >
                <FiX size={16} />
              </button>
            </div>

            {/* معلومات الفاتورة */}

            <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-4">
              <div className="rounded-md bg-gray-50 p-2">
                <p className="text-[9px] text-gray-400">رقم الفاتورة</p>

                <p className="mt-1 text-[10px] font-bold">
                  {selectedPurchase.invoiceNumber || "-"}
                </p>
              </div>

              <div className="rounded-md bg-gray-50 p-2">
                <p className="text-[9px] text-gray-400">التاريخ</p>

                <p className="mt-1 text-[10px] font-bold">
                  {selectedPurchase.date || "-"}
                </p>
              </div>

              <div className="rounded-md bg-gray-50 p-2">
                <p className="text-[9px] text-gray-400">المورد</p>

                <p className="mt-1 truncate text-[10px] font-bold">
                  {selectedPurchase.supplierDisplayName}
                </p>
              </div>

              <div className="rounded-md bg-gray-50 p-2">
                <p className="text-[9px] text-gray-400">طريقة الدفع</p>

                <p className="mt-1 text-[10px] font-bold">
                  {paymentLabels[
                    selectedPurchase.paymentMethod as PaymentMethod
                  ] ||
                    selectedPurchase.paymentMethod ||
                    "-"}
                </p>
              </div>
            </div>

            {/* الحساب الآجل */}

            {selectedPurchase.paymentMethod === "credit" && (
              <div className="mx-4 mb-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                <div className="mb-1 flex items-center gap-1.5">
                  <FiCreditCard size={13} className="text-amber-600" />

                  <span className="text-[10px] font-bold text-amber-800">
                    الحساب المحاسبي للمورد
                  </span>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div>
                    <span className="text-[8px] text-amber-600">
                      رمز الحساب
                    </span>

                    <p className="text-[10px] font-bold text-amber-900">
                      {selectedPurchase.linkedAccountCode || "غير مرتبط"}
                    </p>
                  </div>

                  <div>
                    <span className="text-[8px] text-amber-600">
                      اسم الحساب
                    </span>

                    <p className="text-[10px] font-bold text-amber-900">
                      {selectedPurchase.linkedAccountName || "غير مرتبط"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* الأصناف */}

            <div className="px-4 pb-4">
              <div className="overflow-hidden rounded-md border border-gray-200">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[9px] text-gray-500">
                      <th className="px-2 py-2 text-right">الصنف</th>

                      <th className="px-2 py-2 text-center">الكمية</th>

                      <th className="px-2 py-2 text-center">السعر</th>

                      <th className="px-2 py-2 text-left">الإجمالي</th>
                    </tr>
                  </thead>

                  <tbody>
                    {(selectedPurchase.items || []).map(
                      (item: any, index: number) => (
                        <tr
                          key={index}
                          className="border-t border-gray-100 text-[9px]"
                        >
                          <td className="px-2 py-2">
                            {item.name || item.productName || "-"}
                          </td>

                          <td className="px-2 py-2 text-center">
                            {item.quantity || 0}
                          </td>

                          <td className="px-2 py-2 text-center">
                            {formatMoney(item.price || item.unitPrice || 0)}
                          </td>

                          <td className="px-2 py-2 text-left font-semibold">
                            {formatMoney(
                              item.total ||
                                Number(item.quantity || 0) *
                                  Number(item.price || item.unitPrice || 0),
                            )}
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>

              {/* الإجماليات */}

              <div className="mt-3 mr-auto w-full max-w-xs space-y-1 rounded-md bg-gray-50 p-3">
                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">الإجمالي قبل الخصم</span>

                  <span className="font-semibold">
                    {formatMoney(selectedPurchase.subtotal || 0)}
                  </span>
                </div>

                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">الخصم</span>

                  <span className="font-semibold">
                    {formatMoney(selectedPurchase.discount || 0)}
                  </span>
                </div>

                <div className="flex justify-between text-[10px]">
                  <span className="text-gray-500">الضريبة</span>

                  <span className="font-semibold">
                    {formatMoney(selectedPurchase.tax || 0)}
                  </span>
                </div>

                <div className="mt-1 flex justify-between border-t border-gray-200 pt-2 text-[11px]">
                  <span className="font-bold">الإجمالي النهائي</span>

                  <span className="font-bold text-[#0E1F33]">
                    {formatMoney(selectedPurchase.total || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* أسفل النافذة */}

            <div className="flex justify-end gap-2 border-t border-gray-100 px-4 py-3">
              <button
                type="button"
                onClick={() => handlePrint(selectedPurchase)}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#0E1F33] px-3 text-[10px] font-semibold text-white"
              >
                <FiPrinter size={13} />
                طباعة
              </button>

              <button
                type="button"
                onClick={() => setShowDetails(false)}
                className="h-8 rounded-md border border-gray-200 px-3 text-[10px] font-semibold text-gray-600 hover:bg-gray-50"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================
          CSS للطباعة
      =================================================== */}

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }

          .fixed,
          .fixed * {
            visibility: visible;
          }

          .fixed {
            position: absolute !important;
            inset: 0 !important;
            background: white !important;
          }

          .fixed > div {
            box-shadow: none !important;
            max-width: 100% !important;
            max-height: none !important;
          }
        }
      `}</style>
    </div>
  );
}
