"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FiSearch,
  FiPlus,
  FiRefreshCw,
  FiEye,
  FiEdit2,
  FiTruck,
  FiPhone,
  FiMapPin,
  FiAlertCircle,
  FiUsers,
  FiDollarSign,
  FiFilter,
  FiX,
} from "react-icons/fi";
import { toast } from "sonner";

import { getSuppliers } from "@/lib/api/suppliers";

// ==========================================
// Types
// ==========================================

interface Supplier {
  id: string;
  companyId: string;
  name: string;
  phone?: string | null;
  address?: string | null;
  accountId?: string | null;
  accountCode?: string | null;
  accountName?: string | null;
  balance?: number | string | null;
  notes?: string | null;
  status?: string | null;
  isActive?: boolean | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

type StatusFilter = "all" | "active" | "inactive";

// ==========================================
// Helpers
// ==========================================

const formatNumber = (value: number | string | null | undefined) => {
  const number = Number(value ?? 0);

  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
};

const getSupplierStatus = (supplier: Supplier) => {
  const active =
    supplier.isActive === true &&
    String(supplier.status ?? "").toLowerCase() === "active";

  return active ? "active" : "inactive";
};

// ==========================================
// Page
// ==========================================

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [companyId, setCompanyId] = useState<string | null>(null);

  // ========================================
  // Get current user company
  // ========================================

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("authUser");

      if (!storedUser) {
        toast.error("لم يتم العثور على بيانات المستخدم");
        setLoading(false);
        return;
      }

      const user = JSON.parse(storedUser);

      if (user.type === "platform") {
        toast.error("لا يمكن لمستخدم المنصة الوصول إلى الموردين");
        setLoading(false);
        return;
      }

      if (!user.companyId) {
        toast.error("لم يتم تحديد الشركة الخاصة بالمستخدم");
        setLoading(false);
        return;
      }

      setCompanyId(String(user.companyId));
    } catch (error) {
      console.error("Auth user error:", error);
      toast.error("حدث خطأ أثناء قراءة بيانات المستخدم");
      setLoading(false);
    }
  }, []);

  // ========================================
  // Fetch suppliers
  // ========================================

  const fetchSuppliers = useCallback(
    async (showRefresh = false) => {
      if (!companyId) return;

      try {
        if (showRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        const data = await getSuppliers(companyId);

        setSuppliers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Fetch suppliers error:", error);

        toast.error("تعذر تحميل بيانات الموردين");
        setSuppliers([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [companyId],
  );

  useEffect(() => {
    if (companyId) {
      fetchSuppliers();
    }
  }, [companyId, fetchSuppliers]);

  // ========================================
  // Search and filter
  // ========================================

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        supplier.name?.toLowerCase().includes(searchValue) ||
        supplier.phone?.toLowerCase().includes(searchValue) ||
        supplier.accountCode?.toLowerCase().includes(searchValue) ||
        supplier.accountName?.toLowerCase().includes(searchValue);

      const status = getSupplierStatus(supplier);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && status === "active") ||
        (statusFilter === "inactive" && status === "inactive");

      return matchesSearch && matchesStatus;
    });
  }, [suppliers, search, statusFilter]);

  // ========================================
  // Statistics
  // ========================================

  const statistics = useMemo(() => {
    const activeCount = suppliers.filter(
      (supplier) => getSupplierStatus(supplier) === "active",
    ).length;

    const inactiveCount = suppliers.length - activeCount;

    const totalBalance = suppliers.reduce((total, supplier) => {
      return total + Number(supplier.balance ?? 0);
    }, 0);

    return {
      total: suppliers.length,
      active: activeCount,
      inactive: inactiveCount,
      balance: totalBalance,
    };
  }, [suppliers]);

  // ========================================
  // Loading
  // ========================================

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />
          <p className="text-sm text-slate-500">
            جاري تحميل بيانات الموردين...
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <div dir="rtl" className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FiTruck size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">الموردون</h1>

              <p className="mt-1 text-sm text-slate-500">
                إدارة الموردين ومتابعة حساباتهم وأرصدتهم
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fetchSuppliers(true)}
            disabled={refreshing}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} />
            تحديث
          </button>

          <Link
            href="/erp/suppliers/new"
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <FiPlus size={18} />
            إضافة مورد
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="إجمالي الموردين"
          value={formatNumber(statistics.total)}
          icon={<FiUsers size={21} />}
          color="blue"
        />

        <StatCard
          title="الموردون النشطون"
          value={formatNumber(statistics.active)}
          icon={<FiTruck size={21} />}
          color="green"
        />

        <StatCard
          title="الموردون غير النشطين"
          value={formatNumber(statistics.inactive)}
          icon={<FiAlertCircle size={21} />}
          color="orange"
        />

        <StatCard
          title="إجمالي الأرصدة"
          value={formatNumber(statistics.balance)}
          icon={<FiDollarSign size={21} />}
          color="purple"
        />
      </div>

      {/* Search and filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <FiSearch
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={19}
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم المورد أو الهاتف أو رقم الحساب..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-3 pr-10 pl-10 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <FiX size={18} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <FiFilter className="text-slate-400" />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
            >
              <option value="all">جميع الموردين</option>
              <option value="active">النشطون</option>
              <option value="inactive">غير النشطين</option>
            </select>
          </div>
        </div>

        <div className="mt-3 text-sm text-slate-500">
          عرض {filteredSuppliers.length} من أصل {suppliers.length} مورد
        </div>
      </div>

      {/* Suppliers table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-right">
            <thead className="bg-slate-50 text-sm text-slate-600">
              <tr>
                <th className="px-5 py-4 font-semibold">المورد</th>
                <th className="px-5 py-4 font-semibold">رقم الهاتف</th>
                <th className="px-5 py-4 font-semibold">الحساب المحاسبي</th>
                <th className="px-5 py-4 font-semibold">الرصيد</th>
                <th className="px-5 py-4 font-semibold">الحالة</th>
                <th className="px-5 py-4 text-center font-semibold">
                  الإجراءات
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.map((supplier) => {
                const active = getSupplierStatus(supplier) === "active";

                return (
                  <tr
                    key={supplier.id}
                    className="transition hover:bg-slate-50"
                  >
                    {/* Supplier name */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                          <FiTruck size={19} />
                        </div>

                        <div>
                          <p className="font-semibold text-slate-800">
                            {supplier.name}
                          </p>

                          {supplier.address && (
                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                              <FiMapPin size={12} />
                              {supplier.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="px-5 py-4">
                      {supplier.phone ? (
                        <span className="flex items-center gap-2 text-sm text-slate-600">
                          <FiPhone className="text-slate-400" />
                          {supplier.phone}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">غير محدد</span>
                      )}
                    </td>

                    {/* Account */}
                    <td className="px-5 py-4">
                      {supplier.accountCode ? (
                        <div>
                          <p className="font-medium text-slate-700">
                            {supplier.accountCode}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            {supplier.accountName || "حساب المورد"}
                          </p>
                        </div>
                      ) : (
                        <span className="text-sm text-red-500">غير مرتبط</span>
                      )}
                    </td>

                    {/* Balance */}
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-700">
                        {formatNumber(supplier.balance)}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                          active
                            ? "bg-green-50 text-green-700"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {active ? "نشط" : "غير نشط"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          href={`/erp/suppliers/${supplier.id}`}
                          title="عرض التفاصيل"
                          className="rounded-lg p-2 text-blue-600 transition hover:bg-blue-50"
                        >
                          <FiEye size={18} />
                        </Link>

                        <Link
                          href={`/erp/suppliers/${supplier.id}/edit`}
                          title="تعديل المورد"
                          className="rounded-lg p-2 text-amber-600 transition hover:bg-amber-50"
                        >
                          <FiEdit2 size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {/* Empty state */}
              {filteredSuppliers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <FiTruck size={27} />
                    </div>

                    <h3 className="mt-4 font-semibold text-slate-700">
                      {suppliers.length === 0
                        ? "لا يوجد موردون حتى الآن"
                        : "لا توجد نتائج"}
                    </h3>

                    <p className="mt-2 text-sm text-slate-400">
                      {suppliers.length === 0
                        ? "يمكنك إضافة مورد جديد للبدء."
                        : "جرّب تغيير كلمات البحث أو الفلتر."}
                    </p>

                    {suppliers.length === 0 && (
                      <Link
                        href="/erp/suppliers/new"
                        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm text-white hover:bg-blue-700"
                      >
                        <FiPlus />
                        إضافة أول مورد
                      </Link>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Statistics Card
// ==========================================

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "orange" | "purple";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-500">{title}</p>

          <p className="mt-3 text-2xl font-bold text-slate-800">{value}</p>
        </div>

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${colors[color]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
