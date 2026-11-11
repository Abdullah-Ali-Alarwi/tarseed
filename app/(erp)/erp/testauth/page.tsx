"use client";

import { useEffect, useState } from "react";
import {
  FiPrinter,
  FiPlus,
  FiTrash2,
  FiBarChart2,
  FiEdit3,
  FiFileText,
  FiSearch,
  FiCalendar,
  FiUser,
  FiPackage,
  FiDollarSign,
} from "react-icons/fi";

interface Role {
  id: number;
  name: string;
  permissions: string[];
}

const buttons = [
  {
    permission: "print_sales",
    label: "طباعة الفاتورة",
    icon: FiPrinter,
  },
  {
    permission: "create_sales",
    label: "فاتورة جديدة",
    icon: FiPlus,
  },
  {
    permission: "update_sales",
    label: "تعديل الفاتورة",
    icon: FiEdit3,
  },
  {
    permission: "delete_sales",
    label: "حذف الفاتورة",
    icon: FiTrash2,
  },
  {
    permission: "view_reports",
    label: "التقارير",
    icon: FiBarChart2,
  },
];

const products = [
  {
    id: 1,
    name: "عسل سدر طبيعي",
    quantity: 2,
    price: 15000,
  },
  {
    id: 2,
    name: "عسل سمرة",
    quantity: 1,
    price: 10000,
  },
  {
    id: 3,
    name: "زيت زيتون",
    quantity: 3,
    price: 5000,
  },
];

export default function Page() {
  const [role, setRole] = useState("");
  const [permissions, setPermissions] = useState<string[]>([]);

  // قراءة الصلاحيات من الكوكيز
  useEffect(() => {
    const cookies = Object.fromEntries(
      document.cookie.split("; ").map((item) => {
        const [key, ...value] = item.split("=");
        return [key, value.join("=")];
      }),
    );

    setRole(decodeURIComponent(cookies.role || ""));
  }, []);

  // جلب صلاحيات المستخدم من API
  useEffect(() => {
    if (!role) return;

    fetch("http://localhost:3001/roles")
      .then((res) => res.json())
      .then((roles: Role[]) => {
        const currentRole = roles.find(
          (r) =>
            String(r.id) === role ||
            r.name.toLowerCase() === role.toLowerCase(),
        );

        setPermissions(currentRole?.permissions || []);
      })
      .catch((error) => {
        console.error("Error fetching permissions:", error);
      });
  }, [role]);

  const total = products.reduce(
    (sum, product) => sum + product.quantity * product.price,
    0,
  );

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("ar-YE").format(price);

  return (
    <main dir="rtl" className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 rounded-2xl bg-[#0E1F33] p-6 text-white shadow-lg md:flex-row md:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-blue-200">
              <FiFileText size={22} />
              <span className="text-sm">إدارة المبيعات</span>
            </div>

            <h1 className="text-2xl font-bold md:text-3xl">الفواتير</h1>

            <p className="mt-2 text-sm text-slate-300">
              إدارة ومتابعة فواتير البيع
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {buttons.map((button) => {
              if (!permissions.includes(button.permission)) return null;

              const Icon = button.icon;

              return (
                <button
                  key={button.permission}
                  className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 text-sm font-semibold transition hover:bg-white/20"
                >
                  <Icon size={17} />
                  {button.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Invoice Information */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-7">
          <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <FiFileText className="text-blue-600" />
              بيانات الفاتورة
            </h2>

            <span className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
              فاتورة بيع
            </span>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">
                رقم الفاتورة
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <FiFileText className="text-slate-400" />
                <span className="font-bold text-slate-800">INV-0001</span>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">
                تاريخ الفاتورة
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <FiCalendar className="text-slate-400" />
                <span className="text-slate-800">09 / 11 / 2026</span>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-600">
                العميل
              </label>
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <FiUser className="text-slate-400" />
                <span className="text-slate-800">العميل النقدي</span>
              </div>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 p-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <FiPackage className="text-blue-600" />
              تفاصيل المنتجات
            </h2>

            <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
              {products.length} منتجات
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px] text-right">
              <thead className="bg-slate-50 text-sm text-slate-500">
                <tr>
                  <th className="px-6 py-4">#</th>
                  <th className="px-6 py-4">اسم المنتج</th>
                  <th className="px-6 py-4">الكمية</th>
                  <th className="px-6 py-4">سعر الوحدة</th>
                  <th className="px-6 py-4">الإجمالي</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {products.map((product, index) => (
                  <tr key={product.id} className="transition hover:bg-slate-50">
                    <td className="px-6 py-5 text-slate-400">{index + 1}</td>

                    <td className="px-6 py-5 font-semibold text-slate-800">
                      {product.name}
                    </td>

                    <td className="px-6 py-5 text-slate-600">
                      {product.quantity}
                    </td>

                    <td className="px-6 py-5 text-slate-600">
                      {formatPrice(product.price)} ر.ي
                    </td>

                    <td className="px-6 py-5 font-bold text-slate-800">
                      {formatPrice(product.quantity * product.price)} ر.ي
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="flex flex-col gap-6 md:flex-row md:justify-between">
          <div className="flex-1 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-3 font-bold text-slate-800">ملاحظات الفاتورة</h3>

            <p className="text-sm leading-7 text-slate-500">
              لا توجد ملاحظات إضافية على هذه الفاتورة.
            </p>
          </div>

          <div className="w-full rounded-2xl bg-[#0E1F33] p-6 text-white shadow-lg md:max-w-sm">
            <h3 className="mb-5 flex items-center gap-2 text-lg font-bold">
              <FiDollarSign />
              ملخص الفاتورة
            </h3>

            <div className="mb-4 flex justify-between text-sm text-slate-300">
              <span>الإجمالي قبل الخصم</span>
              <span>{formatPrice(total)} ر.ي</span>
            </div>

            <div className="mb-4 flex justify-between text-sm text-slate-300">
              <span>الخصم</span>
              <span>0 ر.ي</span>
            </div>

            <div className="mb-5 border-t border-white/20 pt-5">
              <div className="flex items-center justify-between">
                <span className="font-semibold">الإجمالي النهائي</span>
                <span className="text-2xl font-bold text-emerald-400">
                  {formatPrice(total)} ر.ي
                </span>
              </div>
            </div>

            <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-center text-sm font-semibold text-emerald-400">
              حالة الفاتورة: مدفوعة
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pb-4 text-center text-xs text-slate-400">
          WEZZAN ERP © 2026 - جميع الحقوق محفوظة
        </div>
      </div>
    </main>
  );
}
