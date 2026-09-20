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
  FiEye,
  FiEdit,
} from "react-icons/fi";

import { useCustomersStore, CASH_CUSTOMER_ID } from "@/Store/customersStore";

import { useSalesStore } from "@/Store/salesStore";

// =========================================================
// Customers Page
// =========================================================

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("جميع العملاء");

  // =========================================================
  // ZUSTAND - CUSTOMERS
  // =========================================================

  const customers = useCustomersStore((state) => state.customers);

  // =========================================================
  // ZUSTAND - SALES
  // =========================================================

  const sales = useSalesStore((state) => state.sales);

  // =========================================================
  // استبعاد العميل النقدي
  // =========================================================

  const normalCustomers = useMemo(() => {
    return customers.filter((customer) => customer.id !== CASH_CUSTOMER_ID);
  }, [customers]);

  // =========================================================
  // تحويل أي قيمة إلى رقم
  // =========================================================

  const getNumericAmount = (value: unknown): number => {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === "string") {
      return Number(value.replace(/[^\d.-]/g, "")) || 0;
    }

    return 0;
  };

  // =========================================================
  // تنسيق المبلغ
  // =========================================================

  const formatMoney = (amount: number) => {
    return Number(amount || 0).toLocaleString("ar-SA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  // =========================================================
  // استبعاد الفواتير الملغاة
  // =========================================================

  const validSales = useMemo(() => {
    return sales.filter((sale) => sale.status !== "cancelled");
  }, [sales]);

  // =========================================================
  // إجمالي مبيعات العميل
  // =========================================================

  const getCustomerSales = (customerId: string) => {
    return validSales
      .filter((sale) => sale.customerId === customerId)
      .reduce((total, sale) => total + getNumericAmount(sale.total), 0);
  };

  // =========================================================
  // إجمالي المدفوع
  // =========================================================

  const getCustomerPaid = (customerId: string) => {
    return validSales
      .filter(
        (sale) =>
          sale.customerId === customerId && sale.paymentMethod !== "credit",
      )
      .reduce((total, sale) => total + getNumericAmount(sale.total), 0);
  };

  // =========================================================
  // إجمالي المبيعات الآجلة
  // =========================================================

  const getCustomerCreditSales = (customerId: string) => {
    return validSales
      .filter(
        (sale) =>
          sale.customerId === customerId && sale.paymentMethod === "credit",
      )
      .reduce((total, sale) => total + getNumericAmount(sale.total), 0);
  };

  // =========================================================
  // الرصيد المستحق
  // =========================================================
  //
  // رصيد العميل في Customer Store
  // +
  // المبيعات الآجلة
  //
  // =========================================================

  const getCustomerDue = (customer: (typeof normalCustomers)[number]) => {
    const balance = getNumericAmount(customer.balance);

    const creditSales = getCustomerCreditSales(customer.id);

    return Math.max(0, balance + creditSales);
  };

  // =========================================================
  // حالة العميل
  // =========================================================

  const getCustomerStatus = (customer: (typeof normalCustomers)[number]) => {
    const due = getCustomerDue(customer);

    return due > 0 ? "متأخر" : "نشط";
  };

  // =========================================================
  // البحث والتصفية
  // =========================================================

  const filteredCustomers = useMemo(() => {
    const value = search.trim().toLowerCase();

    return normalCustomers.filter((customer) => {
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
          .includes(value) ||
        String(customer.accountCode ?? "")
          .toLowerCase()
          .includes(value) ||
        String(customer.accountName ?? "")
          .toLowerCase()
          .includes(value);

      const status = getCustomerStatus(customer);

      const matchesStatus =
        statusFilter === "جميع العملاء" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [normalCustomers, validSales, search, statusFilter]);

  // =========================================================
  // الإحصائيات
  // =========================================================

  const statistics = useMemo(() => {
    const totalCustomers = normalCustomers.length;

    const totalSales = validSales.reduce(
      (total, sale) => total + getNumericAmount(sale.total),
      0,
    );

    const totalCollected = validSales
      .filter((sale) => sale.paymentMethod !== "credit")
      .reduce((total, sale) => total + getNumericAmount(sale.total), 0);

    const totalDue = normalCustomers.reduce(
      (total, customer) => total + getCustomerDue(customer),
      0,
    );

    const activeCustomers = normalCustomers.filter(
      (customer) => getCustomerStatus(customer) === "نشط",
    ).length;

    const overdueCustomers = normalCustomers.filter(
      (customer) => getCustomerStatus(customer) === "متأخر",
    ).length;

    return {
      totalCustomers,
      totalSales,
      totalCollected,
      totalDue,
      activeCustomers,
      overdueCustomers,
    };
  }, [normalCustomers, validSales]);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-50 p-2 sm:p-3" dir="rtl">
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-3 flex flex-col justify-between gap-2 rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm md:flex-row md:items-center">
          <div>
            <h1 className="text-lg font-bold text-gray-800">العملاء</h1>

            <p className="mt-0.5 text-[10px] text-gray-500">
              إدارة بيانات العملاء والمبيعات والأرصدة المستحقة
            </p>
          </div>

          <Link
            href="/customers/new"
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-md bg-amber-600 px-3 text-xs font-medium text-white transition hover:bg-amber-700"
          >
            <FiPlus size={15} />
            إضافة عميل
          </Link>
        </div>

        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <div className="mb-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <StatCard
            title="إجمالي العملاء"
            value={statistics.totalCustomers.toLocaleString("ar-SA")}
            subtitle="عميل"
            icon={FiUsers}
          />

          <StatCard
            title="إجمالي المبيعات"
            value={formatMoney(statistics.totalSales)}
            subtitle="ريال"
            icon={FiDollarSign}
          />

          <StatCard
            title="المبالغ المحصلة"
            value={formatMoney(statistics.totalCollected)}
            subtitle="ريال"
            icon={FiCreditCard}
          />

          <StatCard
            title="المبالغ المستحقة"
            value={formatMoney(statistics.totalDue)}
            subtitle="ريال"
            icon={FiAlertCircle}
            warning
          />
        </div>

        {/* =====================================================
            CUSTOMER STATUS SUMMARY
        ===================================================== */}

        <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <SummaryCard
            title="إجمالي العملاء"
            value={`${statistics.totalCustomers} عميل`}
            icon={FiUsers}
            type="all"
          />

          <SummaryCard
            title="العملاء النشطين"
            value={`${statistics.activeCustomers} عميل`}
            icon={FiUsers}
            type="active"
          />

          <SummaryCard
            title="عملاء لديهم مستحقات"
            value={`${statistics.overdueCustomers} عميل`}
            icon={FiAlertCircle}
            type="overdue"
          />
        </div>

        {/* =====================================================
            CUSTOMERS TABLE
        ===================================================== */}

        <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
          {/* TOOLBAR */}

          <div className="border-b border-gray-100 p-2.5">
            <div className="flex flex-col justify-between gap-2 lg:flex-row lg:items-center">
              <div>
                <h2 className="text-xs font-bold text-gray-800">
                  قائمة العملاء
                </h2>

                <p className="mt-0.5 text-[10px] text-gray-400">
                  عرض {filteredCustomers.length} من {statistics.totalCustomers}{" "}
                  عميل
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                {/* SEARCH */}

                <div className="relative w-full sm:w-64">
                  <FiSearch
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                    size={14}
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="البحث بالاسم أو الكود أو الهاتف..."
                    className="h-8 w-full rounded-md border border-gray-200 bg-white pr-8 pl-2.5 text-[11px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-100"
                  />
                </div>

                {/* STATUS */}

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="h-8 rounded-md border border-gray-200 bg-white px-2.5 text-[11px] text-gray-900 outline-none focus:border-amber-500"
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
            <table className="w-full min-w-[950px] text-right">
              <thead className="bg-gray-50">
                <tr className="text-[10px] text-gray-500">
                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    كود العميل
                  </th>

                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    اسم العميل
                  </th>

                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    الحساب
                  </th>

                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    الهاتف
                  </th>

                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    إجمالي المبيعات
                  </th>

                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    المدفوع
                  </th>

                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    المستحق
                  </th>

                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    الحالة
                  </th>

                  <th className="whitespace-nowrap px-3 py-2 font-medium">
                    الإجراءات
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredCustomers.length > 0 ? (
                  filteredCustomers.map((customer) => {
                    const customerSales = getCustomerSales(customer.id);

                    const customerPaid = getCustomerPaid(customer.id);

                    const customerDue = getCustomerDue(customer);

                    const status = getCustomerStatus(customer);

                    return (
                      <tr
                        key={customer.id}
                        className="transition hover:bg-gray-50"
                      >
                        {/* CUSTOMER CODE */}

                        <td className="px-3 py-2">
                          <Link
                            href={`/customers/${customer.id}`}
                            className="text-[11px] font-semibold text-amber-600 hover:text-amber-700"
                          >
                            {customer.id}
                          </Link>
                        </td>

                        {/* NAME */}

                        <td className="max-w-[190px] px-3 py-2">
                          <Link
                            href={`/customers/${customer.id}`}
                            className="block truncate text-[11px] font-semibold text-gray-700 hover:text-amber-600"
                            title={customer.name}
                          >
                            {customer.name}
                          </Link>
                        </td>

                        {/* ACCOUNT */}

                        <td className="px-3 py-2">
                          <div className="max-w-[170px]">
                            <p className="truncate text-[11px] font-medium text-gray-700">
                              {customer.accountName || customer.name}
                            </p>

                            {customer.accountCode && (
                              <p className="text-[9px] text-gray-400">
                                {customer.accountCode}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* PHONE */}

                        <td className="whitespace-nowrap px-3 py-2 text-[10px] text-gray-500">
                          {customer.phone || "-"}
                        </td>

                        {/* SALES */}

                        <td className="whitespace-nowrap px-3 py-2">
                          <span className="text-[11px] font-semibold text-gray-700">
                            {formatMoney(customerSales)}
                          </span>

                          <span className="mr-1 text-[9px] text-gray-400">
                            ريال
                          </span>
                        </td>

                        {/* PAID */}

                        <td className="whitespace-nowrap px-3 py-2">
                          <span className="text-[11px] font-semibold text-green-600">
                            {formatMoney(customerPaid)}
                          </span>

                          <span className="mr-1 text-[9px] text-gray-400">
                            ريال
                          </span>
                        </td>

                        {/* DUE */}

                        <td className="whitespace-nowrap px-3 py-2">
                          <span
                            className={`text-[11px] font-semibold ${
                              customerDue > 0 ? "text-red-600" : "text-gray-700"
                            }`}
                          >
                            {formatMoney(customerDue)}
                          </span>

                          <span className="mr-1 text-[9px] text-gray-400">
                            ريال
                          </span>
                        </td>

                        {/* STATUS */}

                        <td className="px-3 py-2">
                          <Status status={status} />
                        </td>

                        {/* ACTIONS */}

                        <td className="px-3 py-2">
                          <div className="flex items-center gap-0.5">
                            {/* عرض */}

                            <Link
                              href={`/customers/${customer.id}`}
                              title="عرض العميل"
                              className="rounded-md p-1.5 text-gray-400 transition hover:bg-green-50 hover:text-green-600"
                            >
                              <FiEye size={14} />
                            </Link>

                            {/* تعديل */}

                            <Link
                              href={`/customers/${customer.id}/edit`}
                              title="تعديل العميل"
                              className="rounded-md p-1.5 text-gray-400 transition hover:bg-blue-50 hover:text-blue-600"
                            >
                              <FiEdit size={14} />
                            </Link>

                            {/* المزيد */}

                            <Link
                              href={`/customers/${customer.id}`}
                              title="المزيد"
                              className="rounded-md p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                            >
                              <FiMoreVertical size={14} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FiUsers size={32} className="mb-2 text-gray-300" />

                        <p className="text-xs font-medium text-gray-500">
                          لا توجد نتائج
                        </p>

                        <p className="mt-1 text-[10px] text-gray-400">
                          {normalCustomers.length === 0
                            ? "لا توجد بيانات عملاء حاليًا"
                            : "لم يتم العثور على عميل مطابق للبحث"}
                        </p>

                        {(search || statusFilter !== "جميع العملاء") && (
                          <button
                            type="button"
                            onClick={() => {
                              setSearch("");
                              setStatusFilter("جميع العملاء");
                            }}
                            className="mt-3 rounded-md bg-amber-600 px-3 py-1.5 text-[10px] font-medium text-white transition hover:bg-amber-700"
                          >
                            إظهار جميع العملاء
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* FOOTER */}

          <div className="flex items-center justify-between border-t border-gray-100 px-3 py-2">
            <p className="text-[10px] text-gray-400">
              عرض{" "}
              <span className="font-semibold text-gray-600">
                {filteredCustomers.length}
              </span>{" "}
              من أصل{" "}
              <span className="font-semibold text-gray-600">
                {statistics.totalCustomers}
              </span>{" "}
              عميل
            </p>

            <p className="text-[9px] text-gray-400">
              البيانات محفوظة في Zustand
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

// =========================================================
// SUMMARY CARD
// =========================================================

function SummaryCard({
  title,
  value,
  icon: Icon,
  type,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  type: "all" | "active" | "overdue";
}) {
  const styles = {
    all: {
      box: "bg-amber-50",
      icon: "text-amber-600",
      text: "text-gray-800",
    },

    active: {
      box: "bg-green-50",
      icon: "text-green-600",
      text: "text-green-600",
    },

    overdue: {
      box: "bg-red-50",
      icon: "text-red-500",
      text: "text-red-500",
    },
  };

  const style = styles[type];

  return (
    <div className="rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm">
      <div className="flex items-center gap-2">
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${style.box} ${style.icon}`}
        >
          <Icon size={15} />
        </div>

        <div className="min-w-0">
          <p className="text-[9px] text-gray-400">{title}</p>

          <p className={`mt-0.5 text-xs font-bold ${style.text}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

// =========================================================
// STATISTICS CARD
// =========================================================

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
    <div className="rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[10px] text-gray-500">{title}</p>

          <div className="mt-1 flex items-end gap-1">
            <h2 className="text-base font-bold text-gray-800">{value}</h2>

            <span className="mb-0.5 text-[9px] text-gray-400">{subtitle}</span>
          </div>
        </div>

        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            warning ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"
          }`}
        >
          <Icon size={16} />
        </div>
      </div>
    </div>
  );
}

// =========================================================
// STATUS
// =========================================================

function Status({ status }: { status: string }) {
  const styles: Record<string, string> = {
    نشط: "bg-green-50 text-green-600",
    متأخر: "bg-red-50 text-red-600",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-medium ${
        styles[status] || "bg-gray-50 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}
