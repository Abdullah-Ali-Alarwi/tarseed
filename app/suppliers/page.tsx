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
} from "react-icons/fi";

import { useERPStore } from "@/Store/erpStore";

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("جميع الموردين");

  const suppliers = useERPStore((state) => state.suppliers);
  const purchases = useERPStore((state) => state.purchases);

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
  // إجمالي المبلغ المستحق
  // ======================================================

  const getSupplierDue = (supplierId: string) => {
    return purchases
      .filter(
        (purchase) =>
          purchase.supplierId === supplierId &&
          purchase.paymentMethod === "credit",
      )
      .reduce((total, purchase) => total + getAmount(purchase.total), 0);
  };

  // ======================================================
  // حالة المورد
  // ======================================================

  const getSupplierStatus = (supplierId: string) => {
    const due = getSupplierDue(supplierId);

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
          .includes(searchValue);

      const status = getSupplierStatus(supplier.id);

      const matchesStatus =
        statusFilter === "جميع الموردين" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [suppliers, purchases, search, statusFilter]);

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

    const totalDue = purchases
      .filter((purchase) => purchase.paymentMethod === "credit")
      .reduce((total, purchase) => total + getAmount(purchase.total), 0);

    return {
      totalSuppliers,
      totalPurchases,
      totalPaid,
      totalDue,
    };
  }, [suppliers, purchases]);

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6" dir="rtl">
      {/* ==================================================
          Header
      ================================================== */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">الموردين</h1>

          <p className="text-sm text-gray-500 mt-1">
            إدارة بيانات الموردين وحساباتهم والمبالغ المستحقة
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
          title="المبالغ المستحقة"
          value={formatMoney(statistics.totalDue)}
          subtitle="ريال"
          icon={FiAlertCircle}
          warning
        />
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
                  placeholder="البحث عن مورد أو هاتف أو عنوان..."
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
          <table className="w-full text-right min-w-[1050px]">
            <thead className="bg-gray-50">
              <tr className="text-sm text-gray-500">
                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  كود المورد
                </th>

                <th className="px-6 py-4 font-medium whitespace-nowrap">
                  اسم المورد
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

                  const supplierDue = getSupplierDue(supplier.id);

                  const status = getSupplierStatus(supplier.id);

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
                  <td colSpan={9} className="px-6 py-12 text-center">
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
