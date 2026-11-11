"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiArrowRight,
  FiSave,
  FiTruck,
  FiPhone,
  FiMapPin,
  FiDollarSign,
} from "react-icons/fi";
import { toast } from "sonner";

import { useERPStore } from "@/Store/erpStore";

export default function NewSupplierPage() {
  const router = useRouter();

  // ======================================================
  // ERP Store
  // ======================================================

  const addSupplier = useERPStore((state) => state.addSupplier);

  // ======================================================
  // Form State
  // ======================================================

  const [supplierName, setSupplierName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ======================================================
  // حفظ المورد
  // ======================================================

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = supplierName.trim();

    // التحقق من اسم المورد
    if (!name) {
      toast.error("اسم المورد مطلوب");
      return;
    }

    const numericBalance = Number(balance) || 0;

    setIsSaving(true);

    try {
      // ==================================================
      // إضافة المورد
      // الـ ERP Store يقوم تلقائياً بـ:
      // 1. إنشاء ID للمورد
      // 2. إنشاء حساب للمورد
      // 3. ربط الحساب بالمورد
      // 4. إنشاء الحساب تحت 2101
      // ==================================================

      const createdSupplier = addSupplier({
        name,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        balance: numericBalance,
        isActive: true,
      });

      toast.success("تمت إضافة المورد بنجاح", {
        description: `تم إضافة المورد ${name}`,
      });

      // الانتقال إلى كشف حساب المورد
      router.push(`/suppliers/${createdSupplier.id}`);
    } catch (error) {
      console.error("Error adding supplier:", error);

      const message =
        error instanceof Error ? error.message : "حدث خطأ أثناء إضافة المورد";

      toast.error(message);

      setIsSaving(false);
    }
  };

  // ======================================================
  // UI
  // ======================================================

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 p-3 sm:p-4 lg:p-5">
      {/* Header */}

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Link
              href="/suppliers"
              className="rounded-lg p-1.5 text-gray-500 transition hover:bg-white hover:text-amber-600"
            >
              <FiArrowRight size={19} />
            </Link>

            <h1 className="text-xl font-bold text-gray-800">إضافة مورد</h1>
          </div>

          <p className="mr-9 text-xs text-gray-500">
            إضافة مورد جديد إلى النظام
          </p>
        </div>
      </div>

      {/* Form */}

      <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
        <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {/* Form Header */}

          <div className="border-b border-gray-100 bg-gray-50/70 px-4 py-4 sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <FiTruck size={20} />
              </div>

              <div>
                <h2 className="text-sm font-bold text-gray-800">
                  بيانات المورد
                </h2>

                <p className="mt-0.5 text-[11px] text-gray-400">
                  أدخل البيانات الأساسية للمورد
                </p>
              </div>
            </div>
          </div>

          {/* Fields */}

          <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 sm:p-5">
            {/* اسم المورد */}

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                اسم المورد
                <span className="mr-1 text-red-500">*</span>
              </label>

              <div className="relative">
                <FiTruck
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={supplierName}
                  onChange={(event) => setSupplierName(event.target.value)}
                  placeholder="أدخل اسم المورد"
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-9 pl-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  autoFocus
                />
              </div>
            </div>

            {/* الهاتف */}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                رقم الهاتف
              </label>

              <div className="relative">
                <FiPhone
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="مثال: 734434443"
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-9 pl-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>

            {/* الرصيد */}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                الرصيد الافتتاحي
              </label>

              <div className="relative">
                <FiDollarSign
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={balance}
                  onChange={(event) => setBalance(event.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pr-9 pl-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>

            {/* العنوان */}

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-gray-700">
                العنوان
              </label>

              <div className="relative">
                <FiMapPin
                  size={16}
                  className="absolute right-3 top-3 text-gray-400"
                />

                <textarea
                  value={address}
                  onChange={(event) => setAddress(event.target.value)}
                  placeholder="أدخل عنوان المورد"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-200 bg-white py-2.5 pr-9 pl-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>
          </div>

          {/* Footer */}

          <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/50 px-4 py-3 sm:flex-row sm:justify-end sm:px-5">
            {/* إلغاء */}

            <Link
              href="/suppliers"
              className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-4 py-2 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
            >
              إلغاء
            </Link>

            {/* حفظ */}

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-xs font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FiSave size={15} />

              {isSaving ? "جاري الحفظ..." : "حفظ المورد"}
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
