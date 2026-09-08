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

export default function SalesPage() {
  const [search, setSearch] = useState("");

  const sales = useERPStore((state) => state.sales);
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
  // تحويل أي قيمة إلى رقم
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
  // تنسيق المبلغ
  // ======================================================

  const formatMoney = (amount: number) => {
    return amount.toLocaleString("ar-SA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // ======================================================
  // إجمالي الفاتورة
  // ======================================================

  const getSaleTotal = (invoice: (typeof sales)[number]) => {
    if (typeof invoice.total === "number") {
      return invoice.total;
    }

    if (invoice.items?.length) {
      return invoice.items.reduce((total, item) => {
        if (typeof item.total === "number") {
          return total + item.total;
        }

        const itemSubtotal = getAmount(item.quantity) * getAmount(item.price);

        const discount = itemSubtotal * (getAmount(item.discount) / 100);

        return total + Math.max(itemSubtotal - discount, 0);
      }, 0);
    }

    return 0;
  };

  // ======================================================
  // حالة الفاتورة
  // ======================================================

  const getStatus = (invoice: (typeof sales)[number]) => {
    if (invoice.paymentMethod === "credit") {
      return "آجلة";
    }

    return "مدفوعة";
  };

  // ======================================================
  // الحصول على الحساب من رقم الحساب
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

  const getAccountName = (invoice: (typeof sales)[number]) => {
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
  // البحث
  // ======================================================

  const filteredInvoices = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return sales;
    }

    return sales.filter((invoice) => {
      const accountName = getAccountName(invoice);

      return (
        String(invoice.invoiceNumber).toLowerCase().includes(value) ||
        String(invoice.customerName).toLowerCase().includes(value) ||
        String(invoice.date).toLowerCase().includes(value) ||
        String(getStatus(invoice)).toLowerCase().includes(value) ||
        String(accountName).toLowerCase().includes(value) ||
        String(invoice.accountCode || "")
          .toLowerCase()
          .includes(value)
      );
    });
  }, [sales, search, subAccounts]);

  // ======================================================
  // إجمالي المبيعات
  // ======================================================

  const totalSales = useMemo(() => {
    return sales.reduce((total, invoice) => total + getSaleTotal(invoice), 0);
  }, [sales]);

  // ======================================================
  // عدد الفواتير
  // ======================================================

  const totalInvoices = sales.length;

  // ======================================================
  // الفواتير المدفوعة
  // ======================================================

  const paidInvoices = useMemo(() => {
    return sales.filter((invoice) => invoice.paymentMethod !== "credit").length;
  }, [sales]);

  // ======================================================
  // المبالغ المستحقة
  // ======================================================

  const dueAmount = useMemo(() => {
    return sales
      .filter((invoice) => invoice.paymentMethod === "credit")
      .reduce((total, invoice) => total + getSaleTotal(invoice), 0);
  }, [sales]);

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6" dir="rtl">
      {/* ==================================================
          Header
      ================================================== */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">المبيعات</h1>

          <p className="text-sm text-gray-500 mt-1">
            إدارة فواتير المبيعات والعملاء والتحصيلات
          </p>
        </div>

        <Link
          href="/sales/new"
          className="inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg font-medium transition"
        >
          <FiPlus size={20} />
          فاتورة مبيعات جديدة
        </Link>
      </div>

      {/* ==================================================
          Summary
      ================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="إجمالي المبيعات"
          value={`${formatMoney(totalSales)} ريال`}
          icon={FiDollarSign}
        />

        <StatCard
          title="الفواتير"
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
          الحسابات المتاحة
      ================================================== */}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
            <FiBookOpen size={20} />
          </div>

          <div>
            <h2 className="font-bold text-gray-800 text-sm">
              الحسابات المحاسبية المتاحة للمبيعات
            </h2>

            <p className="text-xs text-gray-400 mt-1">
              يتم استخدام الحسابات الفرعية فقط
            </p>
          </div>
        </div>

        {subAccounts.length === 0 ? (
          <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-100 p-3">
            <p className="text-xs text-yellow-700">
              لا توجد حسابات فرعية حاليًا. أضف حسابًا رئيسيًا ثم أضف حسابات
              فرعية من دليل الحسابات.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 mt-4">
            {subAccounts.map((account) => (
              <span
                key={account.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs"
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
          فواتير المبيعات
      ================================================== */}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-gray-800">فواتير المبيعات</h2>

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
                placeholder="البحث عن فاتورة أو عميل أو حساب..."
                className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-green-500 focus:ring-1 focus:ring-green-100 placeholder:text-gray-400"
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
                  العميل
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
                  const status = getStatus(invoice);

                  const account = getAccount(invoice.accountCode);

                  return (
                    <tr
                      key={invoice.id}
                      className="hover:bg-gray-50 transition"
                    >
                      {/* رقم الفاتورة */}
                      <td className="px-6 py-4">
                        <Link
                          href={`/sales/${invoice.id}`}
                          className="font-semibold text-green-600 hover:text-green-700"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                      </td>

                      {/* العميل */}
                      <td className="px-6 py-4 text-gray-700 whitespace-nowrap">
                        {invoice.customerName}
                      </td>

                      {/* الحساب */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {account ? (
                          <div className="flex flex-col">
                            <span className="font-mono text-xs font-semibold text-green-700">
                              {account.code}
                            </span>

                            <span className="text-xs text-gray-600 mt-0.5">
                              {account.name}
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
                        {formatMoney(getSaleTotal(invoice))} ريال
                      </td>

                      {/* طريقة الدفع */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PaymentMethod method={invoice.paymentMethod} />
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
                    {sales.length === 0
                      ? "لا توجد فواتير مبيعات حاليًا"
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
              className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
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

        <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

// ======================================================
// Payment Method
// ======================================================

function PaymentMethod({ method }: { method: "cash" | "bank" | "credit" }) {
  const labels = {
    cash: "نقدي",
    bank: "بنكي",
    credit: "آجل",
  };

  const styles = {
    cash: "bg-green-50 text-green-600",
    bank: "bg-blue-50 text-blue-600",
    credit: "bg-yellow-50 text-yellow-600",
  };

  return (
    <span
      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${styles[method]}`}
    >
      {labels[method]}
    </span>
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
