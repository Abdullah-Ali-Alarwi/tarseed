"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowRight,
  FiSave,
  FiTruck,
  FiPhone,
  FiMapPin,
  FiHash,
  FiFileText,
  FiX,
} from "react-icons/fi";
import { toast } from "sonner";

import { useSuppliersStore } from "@/Store/suppliersStore";

export default function EditSupplierPage() {
  const params = useParams();
  const router = useRouter();

  const supplierId = String(params.id || "");

  // ======================================================
  // Zustand
  // ======================================================

  const suppliers = useSuppliersStore((state) => state.suppliers);
  const updateSupplier = useSuppliersStore((state) => state.updateSupplier);

  // ======================================================
  // بيانات المورد
  // ======================================================

  const supplier = suppliers.find((item) => item.id === supplierId);

  // ======================================================
  // Form
  // ======================================================

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [accountCode, setAccountCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [notes, setNotes] = useState("");

  const [saving, setSaving] = useState(false);

  // ======================================================
  // تعبئة البيانات
  // ======================================================

  useEffect(() => {
    if (!supplier) return;

    setName(supplier.name || "");
    setPhone(supplier.phone || "");
    setAddress(supplier.address || "");
    setAccountCode(supplier.accountCode || "");
    setAccountName(supplier.accountName || "");
    setNotes(supplier.notes || "");
  }, [supplier]);

  // ======================================================
  // حفظ التعديلات
  // ======================================================

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!supplier) {
      toast.error("المورد غير موجود");
      return;
    }

    const cleanName = name.trim();

    if (!cleanName) {
      toast.error("اسم المورد مطلوب", {
        description: "يرجى إدخال اسم المورد.",
      });
      return;
    }

    setSaving(true);

    try {
      updateSupplier(supplier.id, {
        name: cleanName,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        accountCode: accountCode.trim() || undefined,
        accountName: accountName.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      toast.success("تم تعديل المورد بنجاح", {
        description: `تم تحديث بيانات ${cleanName}`,
      });

      router.push(`/suppliers/${supplier.id}`);
    } catch (error) {
      console.error(error);

      toast.error("تعذر تعديل المورد", {
        description: "حدث خطأ أثناء حفظ البيانات.",
      });
    } finally {
      setSaving(false);
    }
  };

  // ======================================================
  // المورد غير موجود
  // ======================================================

  if (!supplier) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-gray-50 p-4"
        dir="rtl"
      >
        <div className="w-full max-w-md rounded-xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
            <FiTruck size={26} />
          </div>

          <h1 className="text-lg font-bold text-gray-800">المورد غير موجود</h1>

          <p className="mt-2 text-sm text-gray-500">
            لم يتم العثور على المورد المطلوب.
          </p>

          <Link
            href="/suppliers"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-amber-700"
          >
            <FiArrowRight size={17} />
            العودة إلى الموردين
          </Link>
        </div>
      </main>
    );
  }

  // ======================================================
  // الصفحة
  // ======================================================

  return (
    <main className="min-h-screen bg-gray-50 p-3 sm:p-5" dir="rtl">
      <div className="mx-auto max-w-4xl">
        {/* ==================================================
            Header
        ================================================== */}

        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Link
                href="/suppliers"
                className="rounded-md p-1.5 text-gray-500 transition hover:bg-white hover:text-amber-600"
                title="العودة"
              >
                <FiArrowRight size={18} />
              </Link>

              <h1 className="text-xl font-bold text-gray-800">تعديل المورد</h1>
            </div>

            <p className="mr-9 text-xs text-gray-500">
              تعديل بيانات المورد وإعدادات الحساب
            </p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
            <span className="text-[10px] text-gray-400">كود المورد</span>

            <p className="text-sm font-semibold text-amber-600">
              {supplier.accountCode || supplier.id}
            </p>
          </div>
        </div>

        {/* ==================================================
            Form
        ================================================== */}

        <form onSubmit={handleSubmit}>
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            {/* Form Header */}

            <div className="border-b border-gray-100 bg-gray-50/70 px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <FiTruck size={18} />
                </div>

                <div>
                  <h2 className="text-sm font-bold text-gray-800">
                    بيانات المورد
                  </h2>

                  <p className="text-[11px] text-gray-400">
                    قم بتعديل البيانات المطلوبة ثم اضغط حفظ
                  </p>
                </div>
              </div>
            </div>

            {/* Fields */}

            <div className="p-4 sm:p-5">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {/* اسم المورد */}

                <FormField
                  label="اسم المورد"
                  required
                  icon={<FiTruck size={15} />}
                >
                  <input
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="مثال: شركة مواد البناء"
                    className={inputClass}
                  />
                </FormField>

                {/* رقم الهاتف */}

                <FormField label="رقم الهاتف" icon={<FiPhone size={15} />}>
                  <input
                    type="text"
                    inputMode="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="مثال: 777000000"
                    className={inputClass}
                    dir="ltr"
                  />
                </FormField>

                {/* العنوان */}

                <FormField label="العنوان" icon={<FiMapPin size={15} />}>
                  <input
                    type="text"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="المدينة - المنطقة"
                    className={inputClass}
                  />
                </FormField>

                {/* رقم الحساب */}

                <FormField label="رقم الحساب" icon={<FiHash size={15} />}>
                  <input
                    type="text"
                    value={accountCode}
                    onChange={(event) => setAccountCode(event.target.value)}
                    placeholder="مثال: 2001"
                    className={inputClass}
                    dir="ltr"
                  />
                </FormField>

                {/* اسم الحساب */}

                <FormField label="اسم الحساب" icon={<FiFileText size={15} />}>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(event) => setAccountName(event.target.value)}
                    placeholder="مثال: حساب المورد"
                    className={inputClass}
                  />
                </FormField>

                {/* كود المورد */}

                <FormField label="كود المورد" icon={<FiHash size={15} />}>
                  <input
                    type="text"
                    value={supplier.id}
                    disabled
                    className={`${inputClass} cursor-not-allowed bg-gray-50 text-gray-400`}
                    dir="ltr"
                  />
                </FormField>

                {/* الملاحظات */}

                <div className="md:col-span-2">
                  <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-700">
                    <FiFileText size={14} className="text-gray-400" />
                    الملاحظات
                  </label>

                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="أضف أي ملاحظات خاصة بالمورد..."
                    rows={4}
                    className="w-full resize-none rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              </div>
            </div>

            {/* ==================================================
                Account Information
            ================================================== */}

            <div className="border-t border-gray-100 bg-amber-50/40 px-4 py-3 sm:px-5">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 text-amber-600">
                  <FiFileText size={17} />
                </div>

                <div>
                  <p className="text-xs font-semibold text-gray-700">
                    معلومات الحساب
                  </p>

                  <p className="mt-0.5 text-[11px] leading-5 text-gray-500">
                    رقم واسم الحساب يستخدمان لربط المورد بالحساب المحاسبي الخاص
                    به.
                  </p>
                </div>
              </div>
            </div>

            {/* ==================================================
                Footer Buttons
            ================================================== */}

            <div className="flex flex-col-reverse gap-2 border-t border-gray-100 p-4 sm:flex-row sm:justify-end sm:px-5">
              <Link
                href={`/suppliers/${supplier.id}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-xs font-medium text-gray-600 transition hover:bg-gray-50"
              >
                <FiX size={16} />
                إلغاء
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-xs font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <FiSave size={16} />

                {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

// ======================================================
// Input Class
// ======================================================

const inputClass =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100";

// ======================================================
// Form Field
// ======================================================

function FormField({
  label,
  required = false,
  icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-700">
        {icon && <span className="text-gray-400">{icon}</span>}

        {label}

        {required && <span className="text-red-500">*</span>}
      </label>

      {children}
    </div>
  );
}
