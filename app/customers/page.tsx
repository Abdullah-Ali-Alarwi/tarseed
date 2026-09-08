"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiUsers,
  FiDollarSign,
  FiCreditCard,
  FiAlertCircle,
  FiMoreVertical,
} from "react-icons/fi";

import { useERPStore } from "@/Store/erpStore";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("جميع العملاء");

  /* =========================================================
     ZUSTAND
  ========================================================= */

  const customers = useERPStore((state) => state.customers);

  /* =========================================================
     تحويل الرصيد إلى رقم
  ========================================================= */

  const getBalance = (balance: unknown): number => {
    if (typeof balance === "number") {
      return balance;
    }

    if (typeof balance === "string") {
      return Number(balance.replace(/[^\d.-]/g, "")) || 0;
    }

    return 0;
  };

  /* =========================================================
     العملاء بعد البحث والتصفية
  ========================================================= */

  const filteredCustomers = useMemo(() => {
    const value = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSearch =
        !value ||
        String(customer.id ?? "")
          .toLowerCase()
          .includes(value) ||
        String(customer.name ?? "")
          .toLowerCase()
          .includes(value) ||
        String(customer.phone ?? "")
          .toLowerCase()
          .includes(value) ||
        String(customer.address ?? "")
          .toLowerCase()
          .includes(value);

      const balance = getBalance(customer.balance);

      const status = getCustomerStatus(balance);

      const matchesStatus =
        statusFilter === "جميع العملاء" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, search, statusFilter]);

  /* =========================================================
     الإحصائيات
  ========================================================= */

  const totalCustomers = customers.length;

  /* =========================================================
     إجمالي أرصدة العملاء
  ========================================================= */

  const totalReceivables = useMemo(() => {
    return customers.reduce(
      (total, customer) => total + getBalance(customer.balance),
      0,
    );
  }, [customers]);

  /* =========================================================
     المبالغ المحصلة

     في الـStore الحالي لا يوجد collected
     لذلك نعتمد على الرصيد فقط.

     يمكن إضافة التحصيلات لاحقًا
     عند بناء شاشة سندات القبض.
  ========================================================= */

  const totalCollected = 0;

  /* =========================================================
     المبالغ المستحقة
  ========================================================= */

  const totalDue = totalReceivables;

  /* =========================================================
     تنسيق المبالغ
  ========================================================= */

  const formatMoney = (amount: number) => {
    return Number(amount || 0).toLocaleString("ar-SA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6" dir="rtl">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">العملاء</h1>

          <p className="text-sm text-gray-500 mt-1">
            إدارة بيانات العملاء وحساباتهم وأرصدة المديونية
          </p>
        </div>

        <Link
          href="/customers/new"
          className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-lg font-medium transition"
        >
          <FiPlus size={20} />
          إضافة عميل
        </Link>
      </div>

      {/* =====================================================
          STATISTICS
      ===================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="إجمالي العملاء"
          value={totalCustomers.toLocaleString("ar-SA")}
          subtitle="عميل"
          icon={FiUsers}
        />

        <StatCard
          title="إجمالي الأرصدة"
          value={formatMoney(totalReceivables)}
          subtitle="ريال"
          icon={FiDollarSign}
        />

        <StatCard
          title="المبالغ المحصلة"
          value={formatMoney(totalCollected)}
          subtitle="ريال"
          icon={FiCreditCard}
        />

        <StatCard
          title="المبالغ المستحقة"
          value={formatMoney(totalDue)}
          subtitle="ريال"
          icon={FiAlertCircle}
          warning
        />
      </div>

      {/* =====================================================
          CUSTOMERS TABLE
      ===================================================== */}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* TOOLBAR */}

        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-gray-800">قائمة العملاء</h2>

              <p className="text-xs text-gray-400 mt-1">
                إجمالي العملاء: {totalCustomers}
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              {/* SEARCH */}

              <div className="relative w-full md:w-72">
                <FiSearch
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="البحث عن عميل..."
                  className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-100 placeholder:text-gray-400"
                />
              </div>

              {/* STATUS */}

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-amber-500"
              >
                <option value="جميع العملاء">جميع العملاء</option>

                <option value="نشط">نشط</option>

                <option value="متأخر">متأخر</option>
              </select>
            </div>
          </div>
        </div>

        {/* TABLE */}

        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[850px]">
            <thead className="bg-gray-50">
              <tr className="text-sm text-gray-500">
                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  كود العميل
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  اسم العميل
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  رقم الهاتف
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  العنوان
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  الرصيد المستحق
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
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => {
                  const balance = getBalance(customer.balance);

                  const status = getCustomerStatus(balance);

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-gray-50 transition"
                    >
                      {/* ID */}

                      <td className="px-6 py-4">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="font-semibold text-amber-600 hover:text-amber-700"
                        >
                          {customer.id}
                        </Link>
                      </td>

                      {/* NAME */}

                      <td className="px-6 py-4">
                        <Link
                          href={`/customers/${customer.id}`}
                          className="font-semibold text-gray-700 hover:text-amber-600"
                        >
                          {customer.name}
                        </Link>
                      </td>

                      {/* PHONE */}

                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {customer.phone || "-"}
                      </td>

                      {/* ADDRESS */}

                      <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                        {customer.address || "-"}
                      </td>

                      {/* BALANCE */}

                      <td className="px-6 py-4">
                        <span className="font-semibold text-gray-700">
                          {formatMoney(balance)}
                        </span>

                        <span className="text-xs text-gray-400 mr-1">ريال</span>
                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-4">
                        <Status status={status} />
                      </td>

                      {/* ACTIONS */}

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
                    colSpan={7}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    لا توجد بيانات عملاء مطابقة للبحث
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* =====================================================
            FOOTER / PAGINATION
        ===================================================== */}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border-t border-gray-100">
          <p className="text-sm text-gray-400">
            عرض {filteredCustomers.length} من {totalCustomers} عميل
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
              className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm"
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
    </main>
  );
}

/* =========================================================
   CUSTOMER STATUS
========================================================= */

function getCustomerStatus(balance: number) {
  if (balance > 0) {
    return "متأخر";
  }

  return "نشط";
}

/* =========================================================
   STATISTICS CARD
========================================================= */

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
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>

          <div className="flex items-end gap-2 mt-2">
            <h2 className="text-2xl font-bold text-gray-800">{value}</h2>

            <span className="text-xs text-gray-400 mb-1">{subtitle}</span>
          </div>
        </div>

        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${
            warning ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"
          }`}
        >
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   STATUS
========================================================= */

function Status({ status }: { status: string }) {
  const styles: Record<string, string> = {
    نشط: "bg-green-50 text-green-600",
    متأخر: "bg-red-50 text-red-600",
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
