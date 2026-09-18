"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiTruck,
  FiDollarSign,
  FiCreditCard,
  FiAlertCircle,
  FiMoreVertical,
  FiMapPin,
  FiBookOpen,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";

import { useERPStore } from "@/Store/erpStore";

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("جميع الموردين");

  const suppliers = useERPStore((state) => state.suppliers);
  const purchases = useERPStore((state) => state.purchases);
  const accounts = useERPStore((state) => state.accounts);
  const journalEntries = useERPStore((state) => state.journalEntries);

  // ======================================================
  // تحويل أي قيمة إلى رقم
  // ======================================================

  const getAmount = (value: unknown): number => {
    if (typeof value === "number") {
      return value;
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
  // حساب رصيد الحساب من القيود اليومية
  //
  // الموردون ضمن الالتزامات:
  // الرصيد = الدائن - المدين
  // ======================================================

  const getAccountBalance = (accountCode?: string) => {
    if (!accountCode) {
      return 0;
    }

    return journalEntries
      .filter((entry) => entry.status === "posted")
      .reduce((balance, entry) => {
        const accountLines = entry.lines.filter(
          (line) => line.accountCode === accountCode,
        );

        const debit = accountLines.reduce(
          (total, line) => total + getAmount(line.debit),
          0,
        );

        const credit = accountLines.reduce(
          (total, line) => total + getAmount(line.credit),
          0,
        );

        return balance + credit - debit;
      }, 0);
  };

  // ======================================================
  // البحث عن حساب المورد
  //
  // الأولوية:
  // 1. accountCode الموجود داخل المورد
  // 2. حساب تابع للحساب 2001
  // ======================================================

  const getSupplierAccount = (supplier: (typeof suppliers)[number]) => {
    if (supplier.accountCode) {
      const account = accounts.find(
        (item) => item.code === supplier.accountCode,
      );

      if (account) {
        return account;
      }
    }

    return accounts.find(
      (account) =>
        account.parent === "2001" &&
        account.name.trim() === supplier.name.trim(),
    );
  };

  // ======================================================
  // إجمالي مشتريات المورد
  // ======================================================

  const getSupplierPurchases = (supplierId: string) => {
    return purchases
      .filter((purchase) => purchase.supplierId === supplierId)
      .reduce((total, purchase) => total + getAmount(purchase.total), 0);
  };

  // ======================================================
  // إجمالي المدفوع للمورد
  // ======================================================

  const getSupplierPaid = (supplierId: string) => {
    return purchases
      .filter(
        (purchase) =>
          purchase.supplierId === supplierId &&
          purchase.paymentMethod !== "credit",
      )
      .reduce((total, purchase) => total + getAmount(purchase.total), 0);
  };

  // ======================================================
  // المبلغ المستحق من الحساب المحاسبي
  //
  // إذا لم يكن المورد مرتبطًا بحساب:
  // نرجع للحساب التشغيلي القديم مؤقتًا.
  // ======================================================

  const getSupplierDue = (supplier: (typeof suppliers)[number]) => {
    const account = getSupplierAccount(supplier);

    if (account) {
      return Math.max(0, getAccountBalance(account.code));
    }

    return Math.max(
      0,
      getAmount(supplier.balance) +
        purchases
          .filter(
            (purchase) =>
              purchase.supplierId === supplier.id &&
              purchase.paymentMethod === "credit",
          )
          .reduce((total, purchase) => total + getAmount(purchase.total), 0),
    );
  };

  // ======================================================
  // حالة المورد
  // ======================================================

  const getSupplierStatus = (supplier: (typeof suppliers)[number]) => {
    const due = getSupplierDue(supplier);

    return due > 0 ? "متأخر" : "نشط";
  };

  // ======================================================
  // الموردين المفلترين
  // ======================================================

  const filteredSuppliers = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return suppliers.filter((supplier) => {
      const matchesSearch =
        !searchValue ||
        supplier.id.toLowerCase().includes(searchValue) ||
        supplier.name.toLowerCase().includes(searchValue) ||
        String(supplier.phone || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(supplier.address || "")
          .toLowerCase()
          .includes(searchValue) ||
        String(supplier.accountCode || "")
          .toLowerCase()
          .includes(searchValue);

      const status = getSupplierStatus(supplier);

      const matchesStatus =
        statusFilter === "جميع الموردين" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [suppliers, purchases, accounts, journalEntries, search, statusFilter]);

  // ======================================================
  // الإحصائيات
  // ======================================================

  const statistics = useMemo(() => {
    const totalSuppliers = suppliers.length;

    const totalPurchases = purchases.reduce(
      (total, purchase) => total + getAmount(purchase.total),
      0,
    );

    const totalPaid = purchases
      .filter((purchase) => purchase.paymentMethod !== "credit")
      .reduce((total, purchase) => total + getAmount(purchase.total), 0);

    const totalDue = suppliers.reduce(
      (total, supplier) => total + getSupplierDue(supplier),
      0,
    );

    const linkedSuppliers = suppliers.filter((supplier) => {
      return Boolean(getSupplierAccount(supplier));
    }).length;

    const unlinkedSuppliers = totalSuppliers - linkedSuppliers;

    return {
      totalSuppliers,
      totalPurchases,
      totalPaid,
      totalDue,
      linkedSuppliers,
      unlinkedSuppliers,
    };
  }, [suppliers, purchases, accounts, journalEntries]);

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6" dir="rtl">
      {/* ==================================================
          Header
      ================================================== */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">الموردين</h1>

          <p className="text-sm text-gray-500 mt-1">
            إدارة الموردين وحساباتهم وأرصدتهم المحاسبية
          </p>
        </div>

        <Link
          href="/suppliers/new"
          className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-lg font-medium transition"
        >
          <FiPlus size={20} />
          إضافة مورد
        </Link>
      </div>

      {/* ==================================================
          Statistics
      ================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard
          title="إجمالي الموردين"
          value={formatMoney(statistics.totalSuppliers)}
          subtitle="مورد"
          icon={FiTruck}
        />

        <StatCard
          title="إجمالي المشتريات"
          value={formatMoney(statistics.totalPurchases)}
          subtitle="ريال"
          icon={FiDollarSign}
        />

        <StatCard
          title="المبالغ المدفوعة"
          value={formatMoney(statistics.totalPaid)}
          subtitle="ريال"
          icon={FiCreditCard}
        />

        <StatCard
          title="أرصدة الموردين"
          value={formatMoney(statistics.totalDue)}
          subtitle="ريال"
          icon={FiAlertCircle}
          warning
        />
      </div>

      {/* ==================================================
          Accounting Status
      ================================================== */}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FiBookOpen size={20} />
            </div>

            <div>
              <p className="text-xs text-gray-500">حساب الموردين الرئيسي</p>

              <p className="font-bold text-gray-800 mt-1">2001 - الموردين</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <FiCheckCircle size={20} />
            </div>

            <div>
              <p className="text-xs text-gray-500">حسابات مرتبطة</p>

              <p className="font-bold text-green-600 mt-1">
                {statistics.linkedSuppliers} مورد
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-500 flex items-center justify-center">
              <FiXCircle size={20} />
            </div>

            <div>
              <p className="text-xs text-gray-500">حسابات غير مرتبطة</p>

              <p className="font-bold text-red-500 mt-1">
                {statistics.unlinkedSuppliers} مورد
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ==================================================
          Suppliers Table
      ================================================== */}

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Toolbar */}

        <div className="p-5 border-b border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-gray-800">قائمة الموردين</h2>

              <p className="text-xs text-gray-400 mt-1">
                {filteredSuppliers.length} مورد
              </p>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              {/* Search */}

              <div className="relative w-full md:w-80">
                <FiSearch
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="البحث عن مورد أو حساب أو هاتف..."
                  className="w-full pr-10 pl-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-100 placeholder:text-gray-400"
                />
              </div>

              {/* Status */}

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-amber-500"
              >
                <option value="جميع الموردين">جميع الموردين</option>

                <option value="نشط">نشط</option>

                <option value="متأخر">متأخر</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}

        <div className="overflow-x-auto">
          <table className="w-full text-right min-w-[1250px]">
            <thead className="bg-gray-50">
              <tr className="text-sm text-gray-500">
                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  كود المورد
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  اسم المورد
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  الحساب المحاسبي
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  رقم الهاتف
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  العنوان
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  إجمالي المشتريات
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  المدفوع
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
              {filteredSuppliers.length > 0 ? (
                filteredSuppliers.map((supplier) => {
                  const supplierPurchases = getSupplierPurchases(supplier.id);

                  const supplierPaid = getSupplierPaid(supplier.id);

                  const supplierDue = getSupplierDue(supplier);

                  const status = getSupplierStatus(supplier);

                  const supplierAccount = getSupplierAccount(supplier);

                  return (
                    <tr
                      key={supplier.id}
                      className="hover:bg-gray-50 transition"
                    >
                      {/* ID */}

                      <td className="px-6 py-4">
                        <Link
                          href={`/suppliers/${supplier.id}`}
                          className="font-semibold text-amber-600 hover:text-amber-700"
                        >
                          {supplier.id}
                        </Link>
                      </td>

                      {/* Name */}

                      <td className="px-6 py-4">
                        <Link
                          href={`/suppliers/${supplier.id}`}
                          className="font-semibold text-gray-700 hover:text-amber-600"
                        >
                          {supplier.name}
                        </Link>
                      </td>

                      {/* Account */}

                      <td className="px-6 py-4">
                        {supplierAccount ? (
                          <Link
                            href={`/accounting/ledger?account=${supplierAccount.code}`}
                            className="inline-flex flex-col hover:text-amber-600 transition"
                          >
                            <span className="font-semibold text-blue-600">
                              {supplierAccount.code}
                            </span>

                            <span className="text-xs text-gray-500 mt-1">
                              {supplierAccount.name}
                            </span>
                          </Link>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-600 px-2.5 py-1.5 rounded-lg">
                            <FiXCircle size={14} />
                            غير مرتبط
                          </span>
                        )}
                      </td>

                      {/* Phone */}

                      <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                        {supplier.phone || "-"}
                      </td>

                      {/* Address */}

                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2 max-w-[220px]">
                          <FiMapPin
                            size={15}
                            className="text-gray-400 shrink-0"
                          />

                          <span className="truncate">
                            {supplier.address || "-"}
                          </span>
                        </div>
                      </td>

                      {/* Purchases */}

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-gray-700">
                          {formatMoney(supplierPurchases)}
                        </span>

                        <span className="text-xs text-gray-400 mr-1">ريال</span>
                      </td>

                      {/* Paid */}

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-green-600">
                          {formatMoney(supplierPaid)}
                        </span>

                        <span className="text-xs text-gray-400 mr-1">ريال</span>
                      </td>

                      {/* Due */}

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            supplierDue > 0 ? "text-red-600" : "text-gray-700"
                          }`}
                        >
                          {formatMoney(supplierDue)}
                        </span>

                        <span className="text-xs text-gray-400 mr-1">ريال</span>
                      </td>

                      {/* Status */}

                      <td className="px-6 py-4">
                        <Status status={status} />
                      </td>

                      {/* Actions */}

                      <td className="px-6 py-4">
                        <Link
                          href={`/suppliers/${supplier.id}`}
                          className="inline-flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition"
                          title="عرض المورد"
                        >
                          <FiMoreVertical size={18} />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FiTruck size={40} className="text-gray-300 mb-3" />

                      <p className="text-gray-500 font-medium">لا توجد نتائج</p>

                      <p className="text-sm text-gray-400 mt-1">
                        لم يتم العثور على مورد مطابق للبحث
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 border-t border-gray-100">
          <p className="text-sm text-gray-400">
            عرض {filteredSuppliers.length} من أصل {suppliers.length} مورد
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
              className="px-3 py-2 bg-amber-600 text-white rounded-lg text-sm"
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
      className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
        styles[status] || "bg-gray-50 text-gray-500"
      }`}
    >
      {status}
    </span>
  );
}
