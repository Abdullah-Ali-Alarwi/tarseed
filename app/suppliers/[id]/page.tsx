"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useParams } from "next/navigation";
import {
  FiArrowRight,
  FiTruck,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiFileText,
  FiCreditCard,
  FiDollarSign,
  FiEdit,
  FiPrinter,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";

import { useERPStore } from "@/Store/erpStore";

export default function SupplierDetailsPage() {
  const params = useParams();

  const supplierId = String(params.id || "");

  // ======================================================
  // ERP Store
  // ======================================================

  const suppliers = useERPStore((state) => state.suppliers);
  const purchases = useERPStore((state) => state.purchases);

  // ======================================================
  // المورد
  // ======================================================

  const supplier = useMemo(() => {
    return suppliers.find((item) => item.id === supplierId);
  }, [suppliers, supplierId]);

  // ======================================================
  // تحويل القيمة إلى رقم
  // ======================================================

  const getAmount = (value: unknown): number => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === "string") {
      return Number(value.replace(/[^\d.-]/g, "")) || 0;
    }

    return 0;
  };

  // ======================================================
  // تنسيق المبلغ
  // ======================================================

  const formatMoney = (value: number) => {
    return value.toLocaleString("ar-SA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // ======================================================
  // تنسيق التاريخ
  // ======================================================

  const formatDate = (date: string) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return parsedDate.toLocaleDateString("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // ======================================================
  // مشتريات المورد
  // ======================================================

  const supplierPurchases = useMemo(() => {
    if (!supplier) {
      return [];
    }

    return purchases
      .filter(
        (purchase) =>
          purchase.supplierId === supplier.id &&
          purchase.status !== "cancelled",
      )
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();

        return dateA - dateB;
      });
  }, [purchases, supplier]);

  // ======================================================
  // إجمالي المشتريات
  // ======================================================

  const totalPurchases = useMemo(() => {
    return supplierPurchases.reduce(
      (total, purchase) => total + getAmount(purchase.total),
      0,
    );
  }, [supplierPurchases]);

  // ======================================================
  // إجمالي المشتريات الآجلة
  // ======================================================

  const totalCreditPurchases = useMemo(() => {
    return supplierPurchases
      .filter((purchase) => purchase.paymentMethod === "credit")
      .reduce((total, purchase) => total + getAmount(purchase.total), 0);
  }, [supplierPurchases]);

  // ======================================================
  // إجمالي المدفوعات
  // نقدي + تحويل بنكي
  // ======================================================

  const totalPaid = useMemo(() => {
    return supplierPurchases
      .filter((purchase) => purchase.paymentMethod !== "credit")
      .reduce((total, purchase) => total + getAmount(purchase.total), 0);
  }, [supplierPurchases]);

  // ======================================================
  // الرصيد الافتتاحي
  // ======================================================

  const openingBalance = supplier ? getAmount(supplier.balance) : 0;

  // ======================================================
  // الرصيد المستحق
  // ======================================================

  const currentBalance = openingBalance + totalCreditPurchases;

  // ======================================================
  // حالة المورد
  // ======================================================

  const supplierStatus = currentBalance > 0 ? "متأخر" : "نشط";

  // ======================================================
  // إنشاء حركات كشف الحساب
  // ======================================================

  const statement = useMemo(() => {
    if (!supplier) {
      return [];
    }

    const movements: {
      id: string;
      date: string;
      type: "opening" | "purchase" | "payment";
      title: string;
      reference: string;
      debit: number;
      credit: number;
      paymentMethod?: string;
    }[] = [];

    // ----------------------------------------------------
    // الرصيد الافتتاحي
    // ----------------------------------------------------

    if (openingBalance !== 0) {
      movements.push({
        id: `opening-${supplier.id}`,
        date: "",
        type: "opening",
        title: "الرصيد الافتتاحي",
        reference: "-",
        debit: 0,
        credit: openingBalance,
      });
    }

    // ----------------------------------------------------
    // حركات المشتريات
    // ----------------------------------------------------

    supplierPurchases.forEach((purchase) => {
      const total = getAmount(purchase.total);

      if (purchase.paymentMethod === "credit") {
        movements.push({
          id: `${purchase.id}-credit`,
          date: purchase.date,
          type: "purchase",
          title: "فاتورة شراء آجلة",
          reference: purchase.invoiceNumber,
          debit: 0,
          credit: total,
          paymentMethod: purchase.paymentMethod,
        });
      } else {
        /*
         * الفاتورة المدفوعة نقداً أو بنكياً:
         *
         * دائن = قيمة المشتريات
         * مدين = قيمة السداد
         *
         * لذلك لا يتغير الرصيد المستحق.
         */

        movements.push({
          id: `${purchase.id}-purchase`,
          date: purchase.date,
          type: "purchase",
          title: "فاتورة شراء",
          reference: purchase.invoiceNumber,
          debit: total,
          credit: total,
          paymentMethod: purchase.paymentMethod,
        });
      }
    });

    return movements;
  }, [supplier, supplierPurchases, openingBalance]);

  // ======================================================
  // حساب الرصيد الجاري لكل حركة
  // ======================================================

  const statementWithBalance = useMemo(() => {
    let balance = 0;

    return statement.map((movement) => {
      balance += movement.credit;
      balance -= movement.debit;

      return {
        ...movement,
        balance,
      };
    });
  }, [statement]);

  // ======================================================
  // المورد غير موجود
  // ======================================================

  if (!supplier) {
    return (
      <main className="min-h-screen bg-gray-50 p-4 sm:p-6" dir="rtl">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/suppliers"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-amber-600"
          >
            <FiArrowRight size={18} />
            العودة إلى الموردين
          </Link>

          <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
            <FiTruck size={50} className="mx-auto mb-4 text-gray-300" />

            <h1 className="text-xl font-bold text-gray-800">
              المورد غير موجود
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              لم يتم العثور على المورد المطلوب.
            </p>

            <Link
              href="/suppliers"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-3 text-sm font-medium text-white hover:bg-amber-700"
            >
              <FiArrowRight size={18} />
              العودة إلى قائمة الموردين
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // ======================================================
  // الصفحة
  // ======================================================

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6" dir="rtl">
      <div className="mx-auto max-w-7xl">
        {/* ==================================================
            Header
        ================================================== */}

        <div className="mb-6 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <Link
              href="/suppliers"
              className="mb-3 inline-flex items-center gap-2 text-sm text-gray-500 transition hover:text-amber-600"
            >
              <FiArrowRight size={17} />
              الموردين
            </Link>

            <h1 className="text-2xl font-bold text-gray-800">
              كشف حساب المورد
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              جميع الحركات المالية الخاصة بالمورد
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <FiPrinter size={18} />
              طباعة الكشف
            </button>

            <Link
              href={`/suppliers/${supplier.id}/edit`}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700"
            >
              <FiEdit size={18} />
              تعديل المورد
            </Link>
          </div>
        </div>

        {/* ==================================================
            Supplier Information
        ================================================== */}

        <div className="mb-6 rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <FiTruck size={27} />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-800">
                      {supplier.name}
                    </h2>

                    <Status status={supplierStatus} />
                  </div>

                  <p className="mt-1 text-sm text-gray-400">
                    كود المورد:{" "}
                    <span className="font-medium text-gray-600">
                      {supplier.accountCode || supplier.id}
                    </span>
                  </p>
                </div>
              </div>

              {/* الرصيد */}

              <div className="rounded-xl bg-gray-50 px-6 py-4 text-center">
                <p className="text-xs text-gray-500">الرصيد المستحق</p>

                <p
                  className={`mt-1 text-2xl font-bold ${
                    currentBalance > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatMoney(currentBalance)}
                </p>

                <p className="mt-1 text-xs text-gray-400">ريال</p>
              </div>
            </div>
          </div>

          {/* معلومات المورد */}

          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
            <InfoItem
              icon={FiPhone}
              label="رقم الهاتف"
              value={supplier.phone || "-"}
            />

            <InfoItem
              icon={FiMapPin}
              label="العنوان"
              value={supplier.address || "-"}
            />

            <InfoItem
              icon={FiFileText}
              label="كود المورد"
              value={supplier.accountCode || supplier.id}
            />
          </div>
        </div>

        {/* ==================================================
            Statistics
        ================================================== */}

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="الرصيد الافتتاحي"
            value={openingBalance}
            icon={FiDollarSign}
            color="gray"
          />

          <SummaryCard
            title="إجمالي المشتريات"
            value={totalPurchases}
            icon={FiFileText}
            color="amber"
          />

          <SummaryCard
            title="المشتريات المدفوعة"
            value={totalPaid}
            icon={FiCreditCard}
            color="green"
          />

          <SummaryCard
            title="المشتريات الآجلة"
            value={totalCreditPurchases}
            icon={FiAlertCircle}
            color="red"
          />
        </div>

        {/* ==================================================
            Account Statement
        ================================================== */}

        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {/* Statement Header */}

          <div className="flex flex-col justify-between gap-4 border-b border-gray-100 p-5 md:flex-row md:items-center">
            <div>
              <h2 className="font-bold text-gray-800">كشف الحساب</h2>

              <p className="mt-1 text-xs text-gray-400">
                حركات المشتريات والرصيد المستحق للمورد
              </p>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FiCalendar size={16} />

              <span>
                عدد الحركات:{" "}
                <span className="font-semibold text-gray-700">
                  {statementWithBalance.length}
                </span>
              </span>
            </div>
          </div>

          {/* Table */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-right">
              <thead className="bg-gray-50">
                <tr className="text-sm text-gray-500">
                  <th className="whitespace-nowrap px-5 py-4 font-medium">
                    التاريخ
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 font-medium">
                    البيان
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 font-medium">
                    رقم المرجع
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 font-medium">
                    مدين
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 font-medium">
                    دائن
                  </th>

                  <th className="whitespace-nowrap px-5 py-4 font-medium">
                    الرصيد
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {statementWithBalance.length > 0 ? (
                  statementWithBalance.map((movement) => (
                    <tr
                      key={movement.id}
                      className="transition hover:bg-gray-50"
                    >
                      {/* Date */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                        {movement.type === "opening"
                          ? "-"
                          : formatDate(movement.date)}
                      </td>

                      {/* Description */}

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                              movement.type === "opening"
                                ? "bg-gray-100 text-gray-500"
                                : movement.credit > movement.debit
                                  ? "bg-red-50 text-red-600"
                                  : "bg-green-50 text-green-600"
                            }`}
                          >
                            {movement.type === "opening" ? (
                              <FiDollarSign size={17} />
                            ) : movement.credit > movement.debit ? (
                              <FiFileText size={17} />
                            ) : (
                              <FiCreditCard size={17} />
                            )}
                          </div>

                          <div>
                            <p className="font-medium text-gray-700">
                              {movement.title}
                            </p>

                            {movement.paymentMethod && (
                              <p className="mt-1 text-xs text-gray-400">
                                {getPaymentMethodLabel(movement.paymentMethod)}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Reference */}

                      <td className="whitespace-nowrap px-5 py-4">
                        {movement.reference !== "-" ? (
                          <span className="font-medium text-amber-600">
                            {movement.reference}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Debit */}

                      <td className="whitespace-nowrap px-5 py-4">
                        {movement.debit > 0 ? (
                          <>
                            <span className="font-semibold text-green-600">
                              {formatMoney(movement.debit)}
                            </span>

                            <span className="mr-1 text-xs text-gray-400">
                              ريال
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>

                      {/* Credit */}

                      <td className="whitespace-nowrap px-5 py-4">
                        {movement.credit > 0 ? (
                          <>
                            <span className="font-semibold text-red-600">
                              {formatMoney(movement.credit)}
                            </span>

                            <span className="mr-1 text-xs text-gray-400">
                              ريال
                            </span>
                          </>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>

                      {/* Balance */}

                      <td className="whitespace-nowrap px-5 py-4">
                        <span
                          className={`font-bold ${
                            movement.balance > 0
                              ? "text-red-600"
                              : movement.balance < 0
                                ? "text-green-600"
                                : "text-gray-600"
                          }`}
                        >
                          {formatMoney(Math.abs(movement.balance))}
                        </span>

                        <span className="mr-1 text-xs text-gray-400">ريال</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <FiFileText
                        size={45}
                        className="mx-auto mb-4 text-gray-300"
                      />

                      <p className="font-medium text-gray-500">لا توجد حركات</p>

                      <p className="mt-1 text-sm text-gray-400">
                        لا توجد مشتريات أو رصيد افتتاحي لهذا المورد
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>

              {/* Footer */}

              {statementWithBalance.length > 0 && (
                <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-5 py-4 font-bold text-gray-700"
                    >
                      الإجمالي
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 font-bold text-green-600">
                      {formatMoney(
                        statementWithBalance.reduce(
                          (total, movement) => total + movement.debit,
                          0,
                        ),
                      )}{" "}
                      <span className="text-xs font-normal text-gray-400">
                        ريال
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4 font-bold text-red-600">
                      {formatMoney(
                        statementWithBalance.reduce(
                          (total, movement) => total + movement.credit,
                          0,
                        ),
                      )}{" "}
                      <span className="text-xs font-normal text-gray-400">
                        ريال
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-5 py-4">
                      <span
                        className={`font-bold ${
                          currentBalance > 0 ? "text-red-600" : "text-green-600"
                        }`}
                      >
                        {formatMoney(currentBalance)}{" "}
                        <span className="text-xs font-normal text-gray-400">
                          ريال
                        </span>
                      </span>
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Bottom Status */}

          <div className="border-t border-gray-100 p-5">
            <div
              className={`flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:items-center sm:justify-between ${
                currentBalance > 0 ? "bg-red-50" : "bg-green-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {currentBalance > 0 ? (
                  <FiAlertCircle size={21} className="text-red-600" />
                ) : (
                  <FiCheckCircle size={21} className="text-green-600" />
                )}

                <div>
                  <p
                    className={`font-semibold ${
                      currentBalance > 0 ? "text-red-700" : "text-green-700"
                    }`}
                  >
                    {currentBalance > 0
                      ? "يوجد رصيد مستحق للمورد"
                      : "لا يوجد رصيد مستحق على المورد"}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    الرصيد الحالي حسب الحركات المسجلة في النظام
                  </p>
                </div>
              </div>

              <div className="text-left">
                <p className="text-xs text-gray-500">الرصيد الحالي</p>

                <p
                  className={`text-xl font-bold ${
                    currentBalance > 0 ? "text-red-600" : "text-green-600"
                  }`}
                >
                  {formatMoney(currentBalance)} ريال
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          Print Styles
      ================================================== */}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          aside,
          nav,
          button,
          a[href="/suppliers"],
          a[href*="/edit"] {
            display: none !important;
          }

          main {
            padding: 0 !important;
            background: white !important;
          }

          .shadow-sm {
            box-shadow: none !important;
          }

          .border {
            border-color: #ddd !important;
          }
        }
      `}</style>
    </main>
  );
}

// ======================================================
// Info Item
// ======================================================

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-amber-600 shadow-sm">
        <Icon size={18} />
      </div>

      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>

        <p className="mt-1 truncate text-sm font-medium text-gray-700">
          {value}
        </p>
      </div>
    </div>
  );
}

// ======================================================
// Summary Card
// ======================================================

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: "gray" | "amber" | "green" | "red";
}) {
  const styles = {
    gray: {
      box: "bg-gray-50",
      icon: "bg-white text-gray-600",
      value: "text-gray-800",
    },

    amber: {
      box: "bg-amber-50",
      icon: "bg-white text-amber-600",
      value: "text-amber-700",
    },

    green: {
      box: "bg-green-50",
      icon: "bg-white text-green-600",
      value: "text-green-700",
    },

    red: {
      box: "bg-red-50",
      icon: "bg-white text-red-600",
      value: "text-red-700",
    },
  };

  return (
    <div
      className={`rounded-xl border border-gray-100 p-4 shadow-sm ${styles[color].box}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-500">{title}</p>

          <p className={`mt-2 text-xl font-bold ${styles[color].value}`}>
            {formatSummaryMoney(value)}
          </p>

          <p className="mt-1 text-xs text-gray-400">ريال</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${styles[color].icon}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
}

// ======================================================
// Status
// ======================================================

function Status({ status }: { status: string }) {
  const styles: Record<string, string> = {
    نشط: "bg-green-50 text-green-600",
    متأخر: "bg-red-50 text-red-600",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] || "bg-gray-50 text-gray-500"
      }`}
    >
      {status === "نشط" ? (
        <FiCheckCircle size={13} />
      ) : (
        <FiAlertCircle size={13} />
      )}

      {status}
    </span>
  );
}

// ======================================================
// طريقة الدفع
// ======================================================

function getPaymentMethodLabel(method?: string) {
  switch (method) {
    case "cash":
      return "نقدي";

    case "bank":
      return "تحويل بنكي";

    case "credit":
      return "آجل";

    default:
      return "-";
  }
}

// ======================================================
// تنسيق مبالغ البطاقات
// ======================================================

function formatSummaryMoney(value: number) {
  return value.toLocaleString("ar-SA", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
