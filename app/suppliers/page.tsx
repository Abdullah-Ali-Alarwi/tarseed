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
  FiEye,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
} from "react-icons/fi";
import { toast } from "sonner";

import { useERPStore } from "@/Store/erpStore";

export default function SuppliersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("جميع الموردين");

  // ======================================================
  // Zustand - ERP Store
  // ======================================================

  const suppliers = useERPStore((state) => state.suppliers);
  const purchases = useERPStore((state) => state.purchases);
  const deleteSupplier = useERPStore((state) => state.deleteSupplier);

  // ======================================================
  // تحويل أي قيمة إلى رقم
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
  // إجمالي مشتريات المورد
  // ======================================================

  const getSupplierPurchases = (supplierId: string) => {
    return purchases
      .filter(
        (purchase) =>
          purchase.supplierId === supplierId && purchase.status !== "cancelled",
      )
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
          purchase.paymentMethod !== "credit" &&
          purchase.status !== "cancelled",
      )
      .reduce((total, purchase) => total + getAmount(purchase.total), 0);
  };

  // ======================================================
  // إجمالي الفواتير الآجلة
  // ======================================================

  const getSupplierCreditPurchases = (supplierId: string) => {
    return purchases
      .filter(
        (purchase) =>
          purchase.supplierId === supplierId &&
          purchase.paymentMethod === "credit" &&
          purchase.status !== "cancelled",
      )
      .reduce((total, purchase) => total + getAmount(purchase.total), 0);
  };

  // ======================================================
  // الرصيد المستحق
  // ======================================================

  const getSupplierDue = (supplier: (typeof suppliers)[number]) => {
    const balance = getAmount(supplier.balance);
    const creditPurchases = getSupplierCreditPurchases(supplier.id);

    return Math.max(0, balance + creditPurchases);
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
          .includes(searchValue) ||
        String(supplier.accountName || "")
          .toLowerCase()
          .includes(searchValue);

      const status = getSupplierStatus(supplier);

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

    const validPurchases = purchases.filter(
      (purchase) => purchase.status !== "cancelled",
    );

    const totalPurchases = validPurchases.reduce(
      (total, purchase) => total + getAmount(purchase.total),
      0,
    );

    const totalPaid = validPurchases
      .filter((purchase) => purchase.paymentMethod !== "credit")
      .reduce((total, purchase) => total + getAmount(purchase.total), 0);

    const totalDue = suppliers.reduce(
      (total, supplier) => total + getSupplierDue(supplier),
      0,
    );

    const activeSuppliers = suppliers.filter(
      (supplier) => getSupplierStatus(supplier) === "نشط",
    ).length;

    const overdueSuppliers = suppliers.filter(
      (supplier) => getSupplierStatus(supplier) === "متأخر",
    ).length;

    return {
      totalSuppliers,
      totalPurchases,
      totalPaid,
      totalDue,
      activeSuppliers,
      overdueSuppliers,
    };
  }, [suppliers, purchases]);

  // ======================================================
  // حذف المورد
  // ======================================================

  const handleDelete = (supplierId: string, supplierName: string) => {
    const supplierPurchases = purchases.filter(
      (purchase) =>
        purchase.supplierId === supplierId && purchase.status !== "cancelled",
    );

    if (supplierPurchases.length > 0) {
      toast.error("لا يمكن حذف المورد", {
        description:
          "يوجد فواتير مشتريات مرتبطة بهذا المورد. احذف أو عدّل الفواتير المرتبطة أولاً.",
      });

      return;
    }

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف المورد "${supplierName}"؟\n\nسيتم حذف المورد نهائياً من النظام.`,
    );

    if (!confirmed) return;

    deleteSupplier(supplierId);

    toast.success("تم حذف المورد بنجاح", {
      description: `تم حذف المورد ${supplierName}`,
    });
  };

  // ======================================================
  // الصفحة
  // ======================================================

  return (
    <main className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-5" dir="rtl">
      {/* Header */}

      <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-bold text-gray-800">الموردين</h1>

          <p className="mt-0.5 text-xs text-gray-500">
            إدارة الموردين والمشتريات والأرصدة المستحقة
          </p>
        </div>

        <Link
          href="/suppliers/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700"
        >
          <FiPlus size={17} />
          إضافة مورد
        </Link>
      </div>

      {/* Statistics */}

      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
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
          title="الأرصدة المستحقة"
          value={formatMoney(statistics.totalDue)}
          subtitle="ريال"
          icon={FiAlertCircle}
          warning
        />
      </div>

      {/* Supplier Status */}

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <FiTruck size={18} />
            </div>

            <div>
              <p className="text-[11px] text-gray-500">إجمالي الموردين</p>

              <p className="mt-0.5 text-sm font-bold text-gray-800">
                {statistics.totalSuppliers} مورد
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <FiCheckCircle size={18} />
            </div>

            <div>
              <p className="text-[11px] text-gray-500">الموردين النشطين</p>

              <p className="mt-0.5 text-sm font-bold text-green-600">
                {statistics.activeSuppliers} مورد
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
              <FiAlertCircle size={18} />
            </div>

            <div>
              <p className="text-[11px] text-gray-500">موردون لديهم مستحقات</p>

              <p className="mt-0.5 text-sm font-bold text-red-500">
                {statistics.overdueSuppliers} مورد
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Suppliers Table */}

      <div className="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
        {/* Toolbar */}

        <div className="border-b border-gray-100 p-3.5">
          <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-sm font-bold text-gray-800">
                قائمة الموردين
              </h2>

              <p className="mt-0.5 text-[11px] text-gray-400">
                {filteredSuppliers.length} مورد
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              {/* Search */}

              <div className="relative w-full sm:w-64">
                <FiSearch
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="البحث عن مورد أو هاتف..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2 pr-9 pl-3 text-xs text-gray-900 outline-none placeholder:text-gray-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-100"
                />
              </div>

              {/* Status */}

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-900 outline-none focus:border-amber-500"
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
          <table className="w-full min-w-[1000px] text-right text-xs">
            <thead className="bg-gray-50">
              <tr className="text-[11px] text-gray-500">
                <th className="whitespace-nowrap px-4 py-3 font-medium">
                  كود المورد
                </th>

                <th className="whitespace-nowrap px-4 py-3 font-medium">
                  اسم المورد
                </th>

                <th className="whitespace-nowrap px-4 py-3 font-medium">
                  رقم الهاتف
                </th>

                <th className="whitespace-nowrap px-4 py-3 font-medium">
                  العنوان
                </th>

                <th className="whitespace-nowrap px-4 py-3 font-medium">
                  إجمالي المشتريات
                </th>

                <th className="whitespace-nowrap px-4 py-3 font-medium">
                  المدفوع
                </th>

                <th className="whitespace-nowrap px-4 py-3 font-medium">
                  الرصيد المستحق
                </th>

                <th className="whitespace-nowrap px-4 py-3 font-medium">
                  الحالة
                </th>

                <th className="whitespace-nowrap px-4 py-3 font-medium">
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

                  return (
                    <tr
                      key={supplier.id}
                      className="transition hover:bg-gray-50"
                    >
                      {/* ID */}

                      <td className="px-4 py-3">
                        <Link
                          href={`/suppliers/${supplier.id}`}
                          className="font-semibold text-amber-600 hover:text-amber-700"
                        >
                          {supplier.accountCode || supplier.id}
                        </Link>
                      </td>

                      {/* Name */}

                      <td className="px-4 py-3">
                        <Link
                          href={`/suppliers/${supplier.id}`}
                          className="font-semibold text-gray-700 hover:text-amber-600"
                        >
                          {supplier.name}
                        </Link>
                      </td>

                      {/* Phone */}

                      <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                        {supplier.phone || "-"}
                      </td>

                      {/* Address */}

                      <td className="px-4 py-3 text-gray-600">
                        <div className="flex max-w-[180px] items-center gap-1.5">
                          <FiMapPin
                            size={13}
                            className="shrink-0 text-gray-400"
                          />

                          <span className="truncate">
                            {supplier.address || "-"}
                          </span>
                        </div>
                      </td>

                      {/* Purchases */}

                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="font-semibold text-gray-700">
                          {formatMoney(supplierPurchases)}
                        </span>

                        <span className="mr-1 text-[10px] text-gray-400">
                          ريال
                        </span>
                      </td>

                      {/* Paid */}

                      <td className="whitespace-nowrap px-4 py-3">
                        <span className="font-semibold text-green-600">
                          {formatMoney(supplierPaid)}
                        </span>

                        <span className="mr-1 text-[10px] text-gray-400">
                          ريال
                        </span>
                      </td>

                      {/* Due */}

                      <td className="whitespace-nowrap px-4 py-3">
                        <span
                          className={`font-semibold ${
                            supplierDue > 0 ? "text-red-600" : "text-gray-700"
                          }`}
                        >
                          {formatMoney(supplierDue)}
                        </span>

                        <span className="mr-1 text-[10px] text-gray-400">
                          ريال
                        </span>
                      </td>

                      {/* Status */}

                      <td className="px-4 py-3">
                        <Status status={status} />
                      </td>

                      {/* Actions */}

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-0.5">
                          <Link
                            href={`/suppliers/${supplier.id}`}
                            title="عرض المورد"
                            className="rounded-md p-1.5 text-gray-500 transition hover:bg-green-50 hover:text-green-600"
                          >
                            <FiEye size={16} />
                          </Link>

                          <Link
                            href={`/suppliers/${supplier.id}/edit`}
                            title="تعديل المورد"
                            className="rounded-md p-1.5 text-gray-500 transition hover:bg-blue-50 hover:text-blue-600"
                          >
                            <FiEdit size={16} />
                          </Link>

                          <button
                            type="button"
                            title="حذف المورد"
                            onClick={() =>
                              handleDelete(supplier.id, supplier.name)
                            }
                            className="rounded-md p-1.5 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                          >
                            <FiTrash2 size={16} />
                          </button>

                          <Link
                            href={`/suppliers/${supplier.id}`}
                            title="المزيد"
                            className="rounded-md p-1.5 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
                          >
                            <FiMoreVertical size={16} />
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
                      <FiTruck size={34} className="mb-2 text-gray-300" />

                      <p className="text-sm font-medium text-gray-500">
                        لا توجد نتائج
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        لم يتم العثور على مورد مطابق للبحث
                      </p>

                      {(search || statusFilter !== "جميع الموردين") && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearch("");
                            setStatusFilter("جميع الموردين");
                          }}
                          className="mt-3 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-amber-700"
                        >
                          إظهار جميع الموردين
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}

        <div className="flex flex-col justify-between gap-2 border-t border-gray-100 px-4 py-3 sm:flex-row sm:items-center">
          <p className="text-xs text-gray-400">
            عرض{" "}
            <span className="font-semibold text-gray-600">
              {filteredSuppliers.length}
            </span>{" "}
            من أصل{" "}
            <span className="font-semibold text-gray-600">
              {suppliers.length}
            </span>{" "}
            مورد
          </p>
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
    <div className="rounded-lg border border-gray-100 bg-white p-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-gray-500">{title}</p>

          <div className="mt-1.5 flex items-end gap-1.5">
            <h2 className="truncate text-lg font-bold text-gray-800">
              {value}
            </h2>

            <span className="mb-0.5 whitespace-nowrap text-[10px] text-gray-400">
              {subtitle}
            </span>
          </div>
        </div>

        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            warning ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-600"
          }`}
        >
          <Icon size={18} />
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
      className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
        styles[status] || "bg-gray-50 text-gray-500"
      }`}
    >
      {status}
    </span>
  );
}
