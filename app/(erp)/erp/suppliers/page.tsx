"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiUsers,
  FiPhone,
  FiMapPin,
  FiEdit2,
  FiEye,
  FiDollarSign,
  FiFilter,
  FiX,
} from "react-icons/fi";
import { toast } from "sonner";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

type Supplier = {
  id: string;
  companyId: string;
  name: string;
  phone?: string;
  address?: string;
  accountCode?: string;
  accountName?: string;
  balance?: number;
  notes?: string;
  status?: string;
  isActive?: boolean;
  createdAt?: string;
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const loadSuppliers = useCallback(async () => {
    try {
      setLoading(true);

      const authUser = localStorage.getItem("authUser");

      if (!authUser) {
        toast.error("يرجى تسجيل الدخول أولاً");
        setSuppliers([]);
        return;
      }

      const parsedUser = JSON.parse(authUser);

      if (!parsedUser.username) {
        toast.error("بيانات المستخدم غير مكتملة");
        return;
      }

      // جلب المستخدم من قاعدة البيانات
      const usersRes = await api.get("/users", {
        params: {
          username: parsedUser.username,
        },
      });

      const dbUser = usersRes.data?.[0];

      if (!dbUser) {
        toast.error("لم يتم العثور على المستخدم");
        return;
      }

      if (dbUser.type === "platform") {
        toast.error("لا يمكن لمستخدم المنصة الوصول إلى الموردين");
        return;
      }

      if (!dbUser.companyId) {
        toast.error("المستخدم غير مرتبط بشركة");
        return;
      }

      const companyId = String(dbUser.companyId);

      // جلب الموردين التابعين للشركة الحالية
      const suppliersRes = await api.get("/suppliers", {
        params: {
          companyId,
        },
      });

      setSuppliers(Array.isArray(suppliersRes.data) ? suppliersRes.data : []);
    } catch (error) {
      console.error("Suppliers loading error:", error);
      toast.error("حدث خطأ أثناء تحميل الموردين");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSuppliers();
  }, [loadSuppliers]);

  // البحث والتصفية
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
      const value = search.trim().toLowerCase();

      const matchesSearch =
        !value ||
        supplier.name?.toLowerCase().includes(value) ||
        supplier.phone?.toLowerCase().includes(value) ||
        supplier.accountCode?.toLowerCase().includes(value);

      const active = supplier.status === "active" || supplier.isActive === true;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && active) ||
        (statusFilter === "inactive" && !active);

      return matchesSearch && matchesStatus;
    });
  }, [suppliers, search, statusFilter]);

  // الإحصائيات
  const totalBalance = useMemo(
    () =>
      suppliers.reduce(
        (total, supplier) => total + Number(supplier.balance || 0),
        0,
      ),
    [suppliers],
  );

  const activeCount = suppliers.filter(
    (supplier) => supplier.status === "active" || supplier.isActive === true,
  ).length;

  const inactiveCount = suppliers.length - activeCount;

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("ar-YE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div dir="rtl" className="space-y-5">
      {/* عنوان الصفحة */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">قائمة الموردين</h1>
          <p className="mt-1 text-xs text-slate-500">
            إدارة الموردين ومتابعة بياناتهم وأرصدتهم
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadSuppliers}
            disabled={loading}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
            تحديث
          </button>

          <Link
            href="/erp/suppliers/new"
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-slate-700"
          >
            <FiPlus size={15} />
            إضافة مورد
          </Link>
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">إجمالي الموردين</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-800">
                {suppliers.length}
              </h3>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <FiUsers size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">الموردون النشطون</p>
              <h3 className="mt-2 text-2xl font-bold text-green-600">
                {activeCount}
              </h3>
            </div>
            <div className="rounded-xl bg-green-50 p-3 text-green-600">
              <FiUsers size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">الموردون غير النشطين</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-500">
                {inactiveCount}
              </h3>
            </div>
            <div className="rounded-xl bg-slate-100 p-3 text-slate-500">
              <FiFilter size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">إجمالي أرصدة الموردين</p>
              <h3 className="mt-2 text-xl font-bold text-amber-600">
                {formatMoney(totalBalance)}
              </h3>
            </div>
            <div className="rounded-xl bg-amber-50 p-3 text-amber-600">
              <FiDollarSign size={21} />
            </div>
          </div>
        </div>
      </div>

      {/* البحث والتصفية */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <FiSearch
              size={16}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم المورد أو رقم الهاتف أو الحساب..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pr-9 pl-9 text-xs outline-none transition focus:border-slate-400 focus:bg-white"
            />

            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                <FiX size={15} />
              </button>
            )}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs outline-none focus:border-slate-400"
          >
            <option value="all">جميع الحالات</option>
            <option value="active">نشط</option>
            <option value="inactive">غير نشط</option>
          </select>
        </div>
      </div>

      {/* جدول الموردين */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">الموردون</h2>
            <p className="mt-1 text-[11px] text-slate-400">
              عدد النتائج: {filteredSuppliers.length}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-60 items-center justify-center">
            <FiRefreshCw size={22} className="animate-spin text-slate-400" />
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-4 text-center">
            <div className="mb-3 rounded-full bg-slate-100 p-4 text-slate-400">
              <FiUsers size={27} />
            </div>

            <h3 className="text-sm font-bold text-slate-700">
              {search || statusFilter !== "all"
                ? "لا توجد نتائج مطابقة"
                : "لا يوجد موردون حتى الآن"}
            </h3>

            <p className="mt-2 text-xs text-slate-400">
              {search || statusFilter !== "all"
                ? "جرّب تغيير كلمات البحث أو الفلتر"
                : "يمكنك البدء بإضافة مورد جديد"}
            </p>

            {!search && statusFilter === "all" && (
              <Link
                href="/erp/suppliers/new"
                className="mt-4 flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-xs text-white hover:bg-slate-700"
              >
                <FiPlus size={14} />
                إضافة مورد
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-right">
              <thead className="bg-slate-50 text-[11px] text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">المورد</th>
                  <th className="px-4 py-3 font-semibold">الهاتف</th>
                  <th className="px-4 py-3 font-semibold">العنوان</th>
                  <th className="px-4 py-3 font-semibold">الحساب المحاسبي</th>
                  <th className="px-4 py-3 font-semibold">الرصيد</th>
                  <th className="px-4 py-3 font-semibold">الحالة</th>
                  <th className="px-4 py-3 text-center font-semibold">
                    الإجراءات
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map((supplier) => {
                  const active =
                    supplier.status === "active" || supplier.isActive === true;

                  return (
                    <tr
                      key={supplier.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <FiUsers size={17} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800">
                              {supplier.name}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              #{supplier.id}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-600">
                        <span className="flex items-center gap-2">
                          <FiPhone size={13} className="text-slate-400" />
                          {supplier.phone || "—"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-xs text-slate-600">
                        <span className="flex items-center gap-2">
                          <FiMapPin size={13} className="text-slate-400" />
                          {supplier.address || "—"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-slate-700">
                          {supplier.accountCode || "—"}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {supplier.accountName || ""}
                        </p>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-bold ${
                            Number(supplier.balance || 0) > 0
                              ? "text-amber-600"
                              : Number(supplier.balance || 0) < 0
                                ? "text-red-600"
                                : "text-green-600"
                          }`}
                        >
                          {formatMoney(Number(supplier.balance || 0))}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-medium ${
                            active
                              ? "bg-green-50 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {active ? "نشط" : "غير نشط"}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <Link
                            href={`/erp/suppliers/${supplier.id}`}
                            title="عرض المورد"
                            className="rounded-lg bg-blue-50 p-2 text-blue-600 transition hover:bg-blue-100"
                          >
                            <FiEye size={14} />
                          </Link>

                          <Link
                            href={`/erp/suppliers/${supplier.id}/edit`}
                            title="تعديل المورد"
                            className="rounded-lg bg-amber-50 p-2 text-amber-600 transition hover:bg-amber-100"
                          >
                            <FiEdit2 size={14} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
