"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import {
  FiArrowRight,
  FiEdit,
  FiPrinter,
  FiPhone,
  FiMapPin,
  FiUser,
  FiCreditCard,
  FiFileText,
  FiDollarSign,
  FiCalendar,
  FiArrowDown,
  FiArrowUp,
} from "react-icons/fi";

import { useERPStore } from "@/Store/erpStore";

export default function CustomerAccountPage() {
  const params = useParams();

  const customerId = String(params.id);

  // =========================================================
  // ERP STORE
  // =========================================================

  const customer = useERPStore((state) =>
    state.customers.find((item) => item.id === customerId),
  );

  const getAccountStatement = useERPStore((state) => state.getAccountStatement);

  const getAccountBalance = useERPStore((state) => state.getAccountBalance);

  // =========================================================
  // تنسيق الأرقام
  // =========================================================

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(Number(value || 0));
  };

  // =========================================================
  // بيانات العميل
  // =========================================================

  const customerName = customer?.name || "العميل";

  const accountCode = customer?.accountCode || "-";

  const accountName = customer?.accountName || customerName;

  const accountId = customer?.accountId || "";

  // =========================================================
  // كشف الحساب من القيود المحاسبية
  // =========================================================

  const journalMovements = useMemo(() => {
    if (!customer || !accountId) {
      return [];
    }

    const statement = getAccountStatement(accountId);

    return statement.map((line) => {
      /*
       * getAccountStatement يعيد JournalLine.
       * بعض الإصدارات من الستور قد تحتوي على date/reference
       * بينما النوع الأساسي لـ JournalLine لا يعلنهما.
       *
       * لذلك نقرأهما بشكل آمن دون تغيير نوع الستور.
       */

      const rawLine = line as unknown as {
        id?: string | number;
        date?: string | Date;
        reference?: string | number;
        description?: string;
        debit?: number;
        credit?: number;
        customerId?: string;
        supplierId?: string;
        bankId?: string;
      };

      return {
        id: String(rawLine.id ?? `${accountId}-${Math.random()}`),

        date: rawLine.date ? String(rawLine.date) : "",

        description: rawLine.description?.trim() || "قيد محاسبي",

        reference:
          rawLine.reference !== undefined &&
          rawLine.reference !== null &&
          String(rawLine.reference).trim() !== ""
            ? String(rawLine.reference)
            : "-",

        debit: Number(rawLine.debit || 0),

        credit: Number(rawLine.credit || 0),

        customerId: rawLine.customerId,

        supplierId: rawLine.supplierId,

        bankId: rawLine.bankId,
      };
    });
  }, [customer, accountId, getAccountStatement]);

  // =========================================================
  // الرصيد المحاسبي
  // =========================================================

  const accountBalance = useMemo(() => {
    if (!customer || !accountId) {
      return 0;
    }

    return Number(getAccountBalance(accountId) || 0);
  }, [customer, accountId, getAccountBalance, journalMovements]);

  // =========================================================
  // الإجماليات
  // =========================================================

  const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;

    journalMovements.forEach((movement) => {
      debit += Number(movement.debit || 0);
      credit += Number(movement.credit || 0);
    });

    return {
      debit,
      credit,
      balance: accountBalance || debit - credit,
    };
  }, [journalMovements, accountBalance]);

  // =========================================================
  // الرصيد الجاري لكل حركة
  // =========================================================

  const movementsWithBalance = useMemo(() => {
    let runningBalance = 0;

    return journalMovements.map((movement) => {
      runningBalance +=
        Number(movement.debit || 0) - Number(movement.credit || 0);

      return {
        ...movement,
        runningBalance,
      };
    });
  }, [journalMovements]);

  // =========================================================
  // العميل غير موجود
  // =========================================================

  if (!customer) {
    return (
      <main dir="rtl" className="min-h-screen bg-gray-50 p-3">
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <FiUser size={22} />
            </div>

            <h1 className="text-sm font-bold text-gray-800">
              العميل غير موجود
            </h1>

            <p className="mt-1 text-[11px] text-gray-500">
              لم يتم العثور على العميل المطلوب.
            </p>

            <Link
              href="/customers"
              className="mt-5 inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#0E1F33] px-4 text-[11px] font-medium text-white transition hover:opacity-90"
            >
              <FiArrowRight size={14} />
              العودة إلى العملاء
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================
  // منع عرض العميل النقدي
  // =========================================================

  if (customer.id === "CASH-CUSTOMER") {
    return (
      <main dir="rtl" className="min-h-screen bg-gray-50 p-3">
        <div className="mx-auto flex min-h-[70vh] max-w-4xl items-center justify-center">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <FiCreditCard size={22} />
            </div>

            <h1 className="text-sm font-bold text-gray-800">حساب الصندوق</h1>

            <p className="mt-1 text-[11px] text-gray-500">
              هذا الحساب خاص بالصندوق ولا يعرض كسجل عميل.
            </p>

            <Link
              href="/customers"
              className="mt-5 inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#0E1F33] px-4 text-[11px] font-medium text-white transition hover:opacity-90"
            >
              <FiArrowRight size={14} />
              العودة إلى العملاء
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================
  // الطباعة
  // =========================================================

  const handlePrint = () => {
    window.print();
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-50 p-2 sm:p-3 print:bg-white print:p-0"
    >
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-2 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <Link
              href="/customers"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
              title="العودة"
            >
              <FiArrowRight size={15} />
            </Link>

            <div>
              <h1 className="text-base font-bold text-gray-800">
                كشف حساب العميل
              </h1>

              <p className="text-[9px] text-gray-500">
                عرض جميع الحركات المالية على الحساب المحاسبي للعميل
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Link
              href={`/customers/${customer.id}/edit`}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-[10px] font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <FiEdit size={13} />
              تعديل
            </Link>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#0E1F33] px-3 text-[10px] font-medium text-white transition hover:opacity-90"
            >
              <FiPrinter size={13} />
              طباعة
            </button>
          </div>
        </div>

        {/* =====================================================
            بطاقة معلومات العميل
        ===================================================== */}

        <section className="mb-2 rounded-xl border border-gray-200 bg-white shadow-sm print:rounded-none print:border-b print:shadow-none">
          <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <FiUser size={20} />
              </div>

              <div>
                <h2 className="text-sm font-bold text-gray-800">
                  {customer.name}
                </h2>

                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <FiCreditCard size={11} />
                    الحساب: {accountCode}
                  </span>

                  {customer.phone && (
                    <span className="inline-flex items-center gap-1">
                      <FiPhone size={11} />
                      {customer.phone}
                    </span>
                  )}

                  {customer.address && (
                    <span className="inline-flex items-center gap-1">
                      <FiMapPin size={11} />
                      {customer.address}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 px-4 py-2 text-center">
              <div className="text-[9px] text-gray-500">الرصيد الحالي</div>

              <div
                className={`mt-0.5 text-base font-bold ${
                  totals.balance > 0
                    ? "text-red-600"
                    : totals.balance < 0
                      ? "text-green-600"
                      : "text-gray-700"
                }`}
              >
                {formatMoney(Math.abs(totals.balance))}
              </div>

              <div className="text-[8px] text-gray-400">
                {totals.balance > 0
                  ? "مدين"
                  : totals.balance < 0
                    ? "دائن"
                    : "متزن"}
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            بطاقات الإحصائيات
        ===================================================== */}

        <section className="mb-2 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-gray-500">إجمالي المدين</p>

                <p className="mt-1 text-sm font-bold text-red-600">
                  {formatMoney(totals.debit)}
                </p>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-500">
                <FiArrowDown size={15} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-gray-500">إجمالي الدائن</p>

                <p className="mt-1 text-sm font-bold text-green-600">
                  {formatMoney(totals.credit)}
                </p>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-500">
                <FiArrowUp size={15} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-gray-500">صافي الرصيد</p>

                <p className="mt-1 text-sm font-bold text-gray-800">
                  {formatMoney(Math.abs(totals.balance))}
                </p>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-500">
                <FiDollarSign size={15} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-gray-500">عدد الحركات</p>

                <p className="mt-1 text-sm font-bold text-gray-800">
                  {journalMovements.length}
                </p>
              </div>

              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-500">
                <FiFileText size={15} />
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            معلومات الحساب
        ===================================================== */}

        <section className="mb-2 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-3 py-2">
            <h3 className="text-[11px] font-bold text-gray-800">
              معلومات الحساب
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-x-4 gap-y-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <span className="block text-[9px] text-gray-400">اسم العميل</span>

              <span className="mt-0.5 block text-[10px] font-medium text-gray-700">
                {customer.name}
              </span>
            </div>

            <div>
              <span className="block text-[9px] text-gray-400">كود الحساب</span>

              <span className="mt-0.5 block text-[10px] font-medium text-gray-700">
                {accountCode}
              </span>
            </div>

            <div>
              <span className="block text-[9px] text-gray-400">اسم الحساب</span>

              <span className="mt-0.5 block text-[10px] font-medium text-gray-700">
                {accountName}
              </span>
            </div>

            <div>
              <span className="block text-[9px] text-gray-400">رقم الهاتف</span>

              <span className="mt-0.5 block text-[10px] font-medium text-gray-700">
                {customer.phone || "-"}
              </span>
            </div>
          </div>
        </section>

        {/* =====================================================
            جدول كشف الحساب
        ===================================================== */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 px-3 py-2">
            <div>
              <h3 className="text-[11px] font-bold text-gray-800">
                كشف الحساب
              </h3>

              <p className="text-[8px] text-gray-400">
                الحركات المالية المسجلة على الحساب المحاسبي للعميل
              </p>
            </div>

            <div className="flex items-center gap-1 text-[9px] text-gray-500">
              <FiCalendar size={11} />
              جميع الحركات
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] border-collapse text-right text-[10px]">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-gray-500">
                  <th className="whitespace-nowrap px-3 py-2 font-medium">#</th>

                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    التاريخ
                  </th>

                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    البيان
                  </th>

                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    المرجع
                  </th>

                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    مدين
                  </th>

                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    دائن
                  </th>

                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    الرصيد
                  </th>

                  <th className="whitespace-nowrap px-3 py-2 font-medium print:hidden">
                    الإجراء
                  </th>
                </tr>
              </thead>

              <tbody>
                {movementsWithBalance.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gray-50 text-gray-400">
                          <FiFileText size={18} />
                        </div>

                        <p className="text-[11px] font-medium text-gray-600">
                          لا توجد حركات مالية
                        </p>

                        <p className="mt-1 text-[9px] text-gray-400">
                          لا توجد قيود محاسبية مسجلة على حساب هذا العميل
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  movementsWithBalance.map((movement, index) => (
                    <tr
                      key={movement.id}
                      className="border-b border-gray-100 transition hover:bg-gray-50"
                    >
                      <td className="whitespace-nowrap px-3 py-2 text-gray-400">
                        {index + 1}
                      </td>

                      <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                        {movement.date
                          ? new Date(movement.date).toLocaleDateString("ar-YE")
                          : "-"}
                      </td>

                      <td className="whitespace-nowrap px-3 py-2">
                        <div className="font-medium text-gray-700">
                          {movement.description}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-3 py-2 text-gray-500">
                        {movement.reference}
                      </td>

                      <td className="whitespace-nowrap px-3 py-2 font-medium text-red-600">
                        {movement.debit ? formatMoney(movement.debit) : "-"}
                      </td>

                      <td className="whitespace-nowrap px-3 py-2 font-medium text-green-600">
                        {movement.credit ? formatMoney(movement.credit) : "-"}
                      </td>

                      <td className="whitespace-nowrap px-3 py-2">
                        <span
                          className={`font-bold ${
                            movement.runningBalance > 0
                              ? "text-red-600"
                              : movement.runningBalance < 0
                                ? "text-green-600"
                                : "text-gray-600"
                          }`}
                        >
                          {formatMoney(Math.abs(movement.runningBalance))}
                        </span>

                        <span className="mr-1 text-[8px] text-gray-400">
                          {movement.runningBalance > 0
                            ? "مدين"
                            : movement.runningBalance < 0
                              ? "دائن"
                              : ""}
                        </span>
                      </td>

                      <td className="px-3 py-2 print:hidden">
                        {movement.reference && movement.reference !== "-" ? (
                          <Link
                            href={`/sales/${movement.reference}`}
                            className="inline-flex h-6 items-center gap-1 rounded-md border border-gray-200 px-2 text-[9px] text-gray-600 hover:bg-gray-50"
                          >
                            <FiFileText size={11} />
                            التفاصيل
                          </Link>
                        ) : (
                          <span className="text-[9px] text-gray-400">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>

              {movementsWithBalance.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 font-bold">
                    <td colSpan={4} className="px-3 py-2 text-gray-700">
                      الإجمالي
                    </td>

                    <td className="px-3 py-2 text-red-600">
                      {formatMoney(totals.debit)}
                    </td>

                    <td className="px-3 py-2 text-green-600">
                      {formatMoney(totals.credit)}
                    </td>

                    <td className="px-3 py-2 text-gray-800">
                      {formatMoney(Math.abs(totals.balance))}
                    </td>

                    <td className="print:hidden" />
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>

        {/* =====================================================
            ملخص الرصيد
        ===================================================== */}

        <section className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-xl border border-red-100 bg-red-50 p-3">
            <div className="text-[9px] text-red-500">على العميل</div>

            <div className="mt-1 text-sm font-bold text-red-700">
              {totals.balance > 0 ? formatMoney(totals.balance) : "0"}
            </div>

            <div className="mt-0.5 text-[8px] text-red-400">
              إجمالي المبلغ المدين على العميل
            </div>
          </div>

          <div className="rounded-xl border border-green-100 bg-green-50 p-3">
            <div className="text-[9px] text-green-600">للعميل</div>

            <div className="mt-1 text-sm font-bold text-green-700">
              {totals.balance < 0 ? formatMoney(Math.abs(totals.balance)) : "0"}
            </div>

            <div className="mt-0.5 text-[8px] text-green-500">
              المبلغ الدائن لصالح العميل
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <div className="text-[9px] text-gray-500">حالة الحساب</div>

            <div className="mt-1 text-sm font-bold text-gray-800">
              {totals.balance > 0
                ? "رصيد مدين"
                : totals.balance < 0
                  ? "رصيد دائن"
                  : "الحساب متزن"}
            </div>

            <div className="mt-0.5 text-[8px] text-gray-400">
              حسب القيود المحاسبية المسجلة
            </div>
          </div>
        </section>

        {/* =====================================================
            تذييل الطباعة
        ===================================================== */}

        <div className="mt-6 hidden border-t border-gray-200 pt-3 text-center print:block">
          <p className="text-[10px] font-bold text-gray-700">شركة الجابري</p>

          <p className="mt-1 text-[8px] text-gray-500">
            للعسل والزيوت الطبيعة وخدمات العمرة
          </p>

          <p className="mt-1 text-[8px] text-gray-500">
            البيضاء - اليمن | 734 434 443
          </p>

          <p className="mt-2 text-[8px] text-gray-400">
            كشف حساب العميل: {customer.name}
          </p>

          <p className="mt-1 text-[8px] text-gray-400">الحساب: {accountCode}</p>
        </div>
      </div>

      {/* =======================================================
          CSS خاص بالطباعة
      ======================================================= */}

      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          body {
            background: white !important;
          }

          * {
            box-shadow: none !important;
          }

          .print\\:hidden {
            display: none !important;
          }

          .print\\:block {
            display: block !important;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </main>
  );
}
