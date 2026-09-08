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
  FiBookOpen,
} from "react-icons/fi";

export default function PurchasesPage() {
  const [search, setSearch] = useState("");

  const purchases = useERPStore((state) => state.purchases);

  const accounts = useERPStore((state) => state.accounts);

  // ======================================================
  // الحسابات الفرعية فقط
  // ======================================================

  const subAccounts = useMemo(() => {
    return accounts
      .filter((account) => account.level > 0)
      .sort((a, b) =>
        a.code.localeCompare(b.code, undefined, {
          numeric: true,
        }),
      );
  }, [accounts]);

  // ======================================================
  // تحويل القيمة إلى رقم
  // ======================================================

  const getAmount = (amount: unknown): number => {
    if (typeof amount === "number") {
      return amount;
    }

    if (typeof amount === "string") {
      return Number(amount.replace(/[^\d.-]/g, "")) || 0;
    }

    return 0;
  };

  // ======================================================
  // تنسيق المبالغ
  // ======================================================

  const formatMoney = (amount: number) => {
    return amount.toLocaleString("ar-SA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // ======================================================
  // البحث عن الحساب
  // الحسابات الفرعية فقط
  // ======================================================

  const getAccount = (accountCode?: string) => {
    if (!accountCode) {
      return null;
    }

    return subAccounts.find((account) => account.code === accountCode);
  };

  // ======================================================
  // اسم الحساب
  // ======================================================

  const getAccountName = (invoice: (typeof purchases)[number]) => {
    const account = getAccount(invoice.accountCode);

    if (account) {
      return `${account.code} - ${account.name}`;
    }

    if (invoice.accountName) {
      return invoice.accountName;
    }

    return "غير محدد";
  };

  // ======================================================
  // طريقة الدفع
  // ======================================================

  const getPaymentMethodName = (paymentMethod: "cash" | "bank" | "credit") => {
    const methods = {
      cash: "نقدي",
      bank: "تحويل بنكي",
      credit: "آجل",
    };

    return methods[paymentMethod];
  };

  // ======================================================
  // الحالة
  // ======================================================

  const getStatus = (paymentMethod: "cash" | "bank" | "credit") => {
    if (paymentMethod === "credit") {
      return "آجلة";
    }

    return "مدفوعة";
  };

  // ======================================================
  // البحث والتصفية
  // ======================================================

  const filteredInvoices = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return purchases;
    }

    return purchases.filter((invoice) => {
      const accountName = getAccountName(invoice);

      return (
        String(invoice.invoiceNumber).toLowerCase().includes(value) ||
        String(invoice.supplierName).toLowerCase().includes(value) ||
        String(invoice.date).toLowerCase().includes(value) ||
        String(getPaymentMethodName(invoice.paymentMethod))
          .toLowerCase()
          .includes(value) ||
        String(invoice.total).toLowerCase().includes(value) ||
        String(invoice.accountCode || "")
          .toLowerCase()
          .includes(value) ||
        accountName.toLowerCase().includes(value)
      );
    });
  }, [purchases, search, subAccounts]);

  // ======================================================
  // إجمالي المشتريات
  // ======================================================

  const totalPurchases = useMemo(() => {
    return purchases.reduce(
      (total, invoice) => total + getAmount(invoice.total),
      0,
    );
  }, [purchases]);

  // ======================================================
  // عدد الفواتير
  // ======================================================

  const totalInvoices = purchases.length;

  // ======================================================
  // الفواتير المدفوعة
  // ======================================================

  const paidInvoices = useMemo(() => {
    return purchases.filter(
      (invoice) =>
        invoice.paymentMethod === "cash" || invoice.paymentMethod === "bank",
    ).length;
  }, [purchases]);

  // ======================================================
  // المبالغ المستحقة
  // ======================================================

  const dueAmount = useMemo(() => {
    return purchases
      .filter((invoice) => invoice.paymentMethod === "credit")
      .reduce((total, invoice) => total + getAmount(invoice.total), 0);
  }, [purchases]);

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6" dir="rtl">
      {/* ==================================================
          Header
      ================================================== */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">المشتريات</h1>

          <p className="text-sm text-gray-500 mt-1">
            إدارة فواتير المشتريات والموردين والمدفوعات
          </p>
        </div>

        <Link
          href="/purchases/new"
          className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-medium transition"
        >
          <FiPlus size={20} />
          فاتورة مشتريات جديدة
        </Link>
      </div>

      {/* ==================================================
          Summary
      ================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="إجمالي المشتريات"
          value={`${formatMoney(totalPurchases)} ريال`}
          icon={FiDollarSign}
        />

        <StatCard
          title="فواتير المشتريات"
          value={totalInvoices.toLocaleString("ar-SA")}
          icon={FiFileText}
        />

        <StatCard
          title="الفواتير المدفوعة"
          value={paidInvoices.toLocaleString("ar-SA")}
          icon={FiCheckCircle}
        />

        <StatCard
          title="المبالغ المستحقة"
          value={`${formatMoney(dueAmount)} ريال`}
          icon={FiClock}
        />
      </div>

      {/* ==================================================
          الحسابات الفرعية
      ================================================== */}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <FiBookOpen size={20} />
          </div>

          <div>
            <h2 className="font-bold text-gray-800 text-sm">
              الحسابات المحاسبية للمشتريات
            </h2>

            <p className="text-xs text-gray-400 mt-1">
              يتم جلب الحسابات من دليل الحسابات وتظهر الحسابات الفرعية فقط
            </p>
          </div>
        </div>

        {subAccounts.length === 0 ? (
          <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-100 p-3">
            <p className="text-xs text-yellow-700 leading-6">
              لا توجد حسابات فرعية حاليًا. أضف حسابًا رئيسيًا ثم أضف حسابًا
              فرعيًا من دليل الحسابات.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mt-4">
            {subAccounts.map((account) => (
              <span
                key={account.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-xs"
              >
                <span className="font-mono font-semibold">{account.code}</span>

                <span>-</span>

                <span>{account.name}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ==================================================
          فواتير المشتريات
      ================================================== */}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-gray-800">فواتير المشتريات</h2>

              <p className="text-xs text-gray-400 mt-1">
                إجمالي الفواتير: {totalInvoices}
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
                onChange={(e) => setSearch(e.target.value)}
                placeholder="البحث عن فاتورة أو مورد أو حساب..."
                className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] text-right">
            <thead className="bg-gray-50">
              <tr className="text-sm text-gray-500">
                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  رقم الفاتورة
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  المورد
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  الحساب
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  التاريخ
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  المبلغ
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  طريقة الدفع
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
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((invoice) => {
                  const status = getStatus(invoice.paymentMethod);

                  const account = getAccount(invoice.accountCode);

                  return (
                    <tr
                      key={invoice.id}
                      className="hover:bg-gray-50 transition"
                    >
                      {/* رقم الفاتورة */}

                      <td className="px-6 py-4">
                        <Link
                          href={`/purchases/${invoice.id}`}
                          className="font-semibold text-blue-600 hover:text-blue-700"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>

                      {/* المورد */}

                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                        {invoice.supplierName}
                      </td>

                      {/* الحساب */}

                      <td className="px-6 py-4 whitespace-nowrap">
                        {account ? (
                          <div className="flex flex-col">
                            <span className="font-mono text-xs font-semibold text-blue-700">
                              {account.code}
                            </span>

                            <span className="text-xs text-gray-600 mt-0.5">
                              {account.name}
                            </span>
                          </div>
                        ) : invoice.accountName ? (
                          <div className="flex flex-col">
                            <span className="font-mono text-xs font-semibold text-gray-600">
                              {invoice.accountCode}
                            </span>

                            <span className="text-xs text-gray-500 mt-0.5">
                              {invoice.accountName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            غير محدد
                          </span>
                        )}
                      </td>

                      {/* التاريخ */}

                      <td className="px-6 py-4 text-gray-500 whitespace-nowrap">
                        {invoice.date}
                      </td>

                      {/* المبلغ */}

                      <td className="px-6 py-4 font-semibold text-gray-700 whitespace-nowrap">
                        {formatMoney(getAmount(invoice.total))} ريال
                      </td>

                      {/* طريقة الدفع */}

                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {getPaymentMethodName(invoice.paymentMethod)}
                      </td>

                      {/* الحالة */}

                      <td className="px-6 py-4">
                        <Status status={status} />
                      </td>

                      {/* الإجراءات */}

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
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    {purchases.length === 0
                      ? "لا توجد فواتير مشتريات حاليًا"
                      : "لا توجد فواتير مطابقة للبحث"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ==================================================
            Footer
        ================================================== */}

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-t border-gray-100">
          <p className="text-sm text-gray-400">
            عرض {filteredInvoices.length} من {totalInvoices} فاتورة
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition"
            >
              السابق
            </button>

            <button
              type="button"
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm"
            >
              1
            </button>

            <button
              type="button"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition"
            >
              2
            </button>

            <button
              type="button"
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-500 hover:bg-gray-50 transition"
            >
              التالي
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

// ======================================================
// Stat Card
// ======================================================

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>

          <h2 className="text-xl font-bold text-gray-800 mt-2">{value}</h2>
        </div>

        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Icon size={22} />
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
    مدفوعة: "bg-green-50 text-green-600",

    آجلة: "bg-yellow-50 text-yellow-600",

    معلقة: "bg-yellow-50 text-yellow-600",

    متأخرة: "bg-red-50 text-red-600",
  };

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
        styles[status] || "bg-gray-50 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}
