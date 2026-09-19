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
  FiTrash2,
} from "react-icons/fi";

import { toast } from "sonner";
import { useERPStore } from "@/Store/erpStore";

export default function CustomersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("جميع العملاء");

  // =========================================================
  // ZUSTAND
  // =========================================================

  const customers = useERPStore((state) => state.customers);
  const sales = useERPStore((state) => state.sales);
  const deleteCustomer = useERPStore((state) => state.deleteCustomer);

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
  // إجمالي مبيعات العميل
  // =========================================================

  const getCustomerSales = (customerId: string) => {
    return sales
      .filter((sale) => sale.customerId === customerId)
      .reduce((total, sale) => total + getNumericAmount(sale.total), 0);
  };

  // =========================================================
  // إجمالي المبيعات المدفوعة للعميل
  // =========================================================

  const getCustomerPaid = (customerId: string) => {
    return sales
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
    return sales
      .filter(
        (sale) =>
          sale.customerId === customerId && sale.paymentMethod === "credit",
      )
      .reduce((total, sale) => total + getNumericAmount(sale.total), 0);
  };

  // =========================================================
  // الرصيد المستحق للعميل
  //
  // balance الموجود في العميل
  // + الفواتير الآجلة
  // =========================================================

  const getCustomerDue = (customer: (typeof customers)[number]) => {
    const balance = getNumericAmount(customer.balance);

    const creditSales = getCustomerCreditSales(customer.id);

    return Math.max(0, balance + creditSales);
  };

  // =========================================================
  // حالة العميل
  // =========================================================

  const getCustomerStatus = (customer: (typeof customers)[number]) => {
    const due = getCustomerDue(customer);

    return due > 0 ? "متأخر" : "نشط";
  };

  // =========================================================
  // العملاء بعد البحث والتصفية
  // =========================================================

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

      const status = getCustomerStatus(customer);

      const matchesStatus =
        statusFilter === "جميع العملاء" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [customers, sales, search, statusFilter]);

  // =========================================================
  // الإحصائيات
  // =========================================================

  const statistics = useMemo(() => {
    const totalCustomers = customers.length;

    const totalSales = sales.reduce(
      (total, sale) => total + getNumericAmount(sale.total),
      0,
    );

    const totalCollected = sales
      .filter((sale) => sale.paymentMethod !== "credit")
      .reduce((total, sale) => total + getNumericAmount(sale.total), 0);

    const totalDue = customers.reduce(
      (total, customer) => total + getCustomerDue(customer),
      0,
    );

    const activeCustomers = customers.filter(
      (customer) => getCustomerStatus(customer) === "نشط",
    ).length;

    const overdueCustomers = customers.filter(
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
  }, [customers, sales]);

  // =========================================================
  // حذف العميل
  // =========================================================

  const handleDelete = (customerId: string, customerName: string) => {
    const customerSales = sales.filter(
      (sale) => sale.customerId === customerId,
    );

    // منع حذف العميل إذا كانت له فواتير
    if (customerSales.length > 0) {
      toast.error("لا يمكن حذف العميل", {
        description:
          "يوجد فواتير مبيعات مرتبطة بهذا العميل. احذف أو عدّل الفواتير المرتبطة أولاً.",
      });

      return;
    }

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف العميل "${customerName}"؟\n\nسيتم حذف العميل نهائياً من النظام.`,
    );

    if (!confirmed) {
      return;
    }

    deleteCustomer(customerId);

    toast.success("تم حذف العميل بنجاح", {
      description: `تم حذف العميل ${customerName}`,
    });
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6" dir="rtl">
      <div className="mx-auto max-w-7xl">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">العملاء</h1>

            <p className="mt-1 text-sm text-gray-500">
              إدارة بيانات العملاء والمبيعات والأرصدة المستحقة
            </p>
          </div>

          <Link
            href="/customers/new"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 py-3 font-medium text-white transition hover:bg-amber-700"
          >
            <FiPlus size={20} />
            إضافة عميل
          </Link>
        </div>

        {/* =====================================================
            STATISTICS
        ===================================================== */}

        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
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

        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* جميع العملاء */}

          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <FiUsers size={20} />
              </div>

              <div>
                <p className="text-xs text-gray-500">إجمالي العملاء</p>

                <p className="mt-1 font-bold text-gray-800">
                  {statistics.totalCustomers} عميل
                </p>
              </div>
            </div>
          </div>

          {/* العملاء النشطين */}

          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                <FiUsers size={20} />
              </div>

              <div>
                <p className="text-xs text-gray-500">العملاء النشطين</p>

                <p className="mt-1 font-bold text-green-600">
                  {statistics.activeCustomers} عميل
                </p>
              </div>
            </div>
          </div>

          {/* العملاء المتأخرين */}

          <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-500">
                <FiAlertCircle size={20} />
              </div>

              <div>
                <p className="text-xs text-gray-500">عملاء لديهم مستحقات</p>

                <p className="mt-1 font-bold text-red-500">
                  {statistics.overdueCustomers} عميل
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            CUSTOMERS TABLE
        ===================================================== */}

        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {/* TOOLBAR */}

          <div className="border-b border-gray-100 p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <h2 className="font-bold text-gray-800">قائمة العملاء</h2>

                <p className="mt-1 text-xs text-gray-400">
                  عرض {filteredCustomers.length} من {statistics.totalCustomers}{" "}
                  عميل
                </p>
              </div>

              <div className="flex flex-col gap-3 md:flex-row">
                {/* SEARCH */}

                <div className="relative w-full md:w-80">
                  <FiSearch
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="البحث بالاسم أو الكود أو الهاتف..."
                    className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-10 pl-4 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-100"
                  />
                </div>

                {/* STATUS */}

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-amber-500"
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
            <table className="w-full min-w-[1050px] text-right">
              <thead className="bg-gray-50">
                <tr className="text-sm text-gray-500">
                  <th className="whitespace-nowrap px-6 py-4 font-medium">
                    كود العميل
                  </th>

                  <th className="whitespace-nowrap px-6 py-4 font-medium">
                    اسم العميل
                  </th>

                  <th className="whitespace-nowrap px-6 py-4 font-medium">
                    رقم الهاتف
                  </th>

                  <th className="whitespace-nowrap px-6 py-4 font-medium">
                    العنوان
                  </th>

                  <th className="whitespace-nowrap px-6 py-4 font-medium">
                    إجمالي المبيعات
                  </th>

                  <th className="whitespace-nowrap px-6 py-4 font-medium">
                    المدفوع
                  </th>

                  <th className="whitespace-nowrap px-6 py-4 font-medium">
                    الرصيد المستحق
                  </th>

                  <th className="whitespace-nowrap px-6 py-4 font-medium">
                    الحالة
                  </th>

                  <th className="whitespace-nowrap px-6 py-4 font-medium">
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

                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {customer.phone || "-"}
                        </td>

                        {/* ADDRESS */}

                        <td className="px-6 py-4 text-sm text-gray-500">
                          <span className="block max-w-[220px] truncate">
                            {customer.address || "-"}
                          </span>
                        </td>

                        {/* SALES */}

                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="font-semibold text-gray-700">
                            {formatMoney(customerSales)}
                          </span>

                          <span className="mr-1 text-xs text-gray-400">
                            ريال
                          </span>
                        </td>

                        {/* PAID */}

                        <td className="whitespace-nowrap px-6 py-4">
                          <span className="font-semibold text-green-600">
                            {formatMoney(customerPaid)}
                          </span>

                          <span className="mr-1 text-xs text-gray-400">
                            ريال
                          </span>
                        </td>

                        {/* DUE */}

                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`font-semibold ${
                              customerDue > 0 ? "text-red-600" : "text-gray-700"
                            }`}
                          >
                            {formatMoney(customerDue)}
                          </span>

                          <span className="mr-1 text-xs text-gray-400">
                            ريال
                          </span>
                        </td>

                        {/* STATUS */}

                        <td className="px-6 py-4">
                          <Status status={status} />
                        </td>

                        {/* ACTIONS */}

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                            {/* عرض */}

                            <Link
                              href={`/customers/${customer.id}`}
                              title="عرض العميل"
                              className="rounded-lg p-2 text-gray-500 transition hover:bg-green-50 hover:text-green-600"
                            >
                              <FiEye size={18} />
                            </Link>

                            {/* تعديل */}

                            <Link
                              href={`/customers/${customer.id}/edit`}
                              title="تعديل العميل"
                              className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
                            >
                              <FiEdit size={18} />
                            </Link>

                            {/* حذف */}

                            <button
                              type="button"
                              title="حذف العميل"
                              onClick={() =>
                                handleDelete(customer.id, customer.name)
                              }
                              className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <FiTrash2 size={18} />
                            </button>

                            {/* المزيد */}

                            <Link
                              href={`/customers/${customer.id}`}
                              title="المزيد"
                              className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                            >
                              <FiMoreVertical size={18} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <FiUsers size={40} className="mb-3 text-gray-300" />

                        <p className="font-medium text-gray-500">
                          لا توجد نتائج
                        </p>

                        <p className="mt-1 text-sm text-gray-400">
                          {customers.length === 0
                            ? "لا توجد بيانات عملاء حاليًا"
                            : "لم يتم العثور على عميل مطابق للبحث"}
                        </p>

                        {search && (
                          <button
                            type="button"
                            onClick={() => setSearch("")}
                            className="mt-4 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
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

          <div className="flex flex-col justify-between gap-4 border-t border-gray-100 p-5 md:flex-row md:items-center">
            <p className="text-sm text-gray-400">
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
          </div>
        </div>
      </div>
    </main>
  );
}

// =========================================================
// CUSTOMER STATUS
// =========================================================

function getCustomerStatus(customer: { balance?: number }) {
  const balance = Number(customer.balance || 0);

  return balance > 0 ? "متأخر" : "نشط";
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
    <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>

          <div className="mt-2 flex items-end gap-2">
            <h2 className="text-2xl font-bold text-gray-800">{value}</h2>

            <span className="mb-1 text-xs text-gray-400">{subtitle}</span>
          </div>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${
            warning ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"
          }`}
        >
          <Icon size={22} />
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
      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] || "bg-gray-50 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}
