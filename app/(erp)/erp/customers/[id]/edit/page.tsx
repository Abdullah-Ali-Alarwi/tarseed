"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  FiArrowRight,
  FiSave,
  FiUser,
  FiPhone,
  FiMapPin,
  FiCreditCard,
  FiFileText,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import { toast } from "sonner";

import { useERPStore } from "@/Store/erpStore";

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();

  const customerId = String(params.id);

  // =========================================================
  // ZUSTAND - ERP STORE
  // =========================================================

  const customer = useERPStore((state) =>
    state.customers.find((item) => item.id === customerId),
  );

  const updateCustomer = useERPStore((state) => state.updateCustomer);

  // =========================================================
  // FORM
  // =========================================================

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [accountCode, setAccountCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [isSaving, setIsSaving] = useState(false);

  // =========================================================
  // تحميل بيانات العميل
  // =========================================================

  useEffect(() => {
    if (!customer) return;

    setName(customer.name ?? "");
    setPhone(customer.phone ?? "");
    setAddress(customer.address ?? "");
    setBalance(String(customer.balance ?? 0));

    setAccountCode(customer.accountCode ?? "");
    setAccountName(customer.accountName ?? customer.name ?? "");

    setNotes(customer.notes ?? "");
    setIsActive(customer.isActive ?? true);
  }, [customer]);

  // =========================================================
  // التحقق من العميل النقدي
  // =========================================================

  if (customerId === "CASH-CUSTOMER") {
    return (
      <main className="min-h-screen bg-gray-50 p-3" dir="rtl">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border border-red-100 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
              <FiAlertCircle size={24} />
            </div>

            <h1 className="text-lg font-bold text-gray-800">
              لا يمكن تعديل العميل النقدي
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              العميل النقدي مرتبط بحساب الصندوق ولا يمكن تعديله.
            </p>

            <Link
              href="/customers"
              className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-amber-600 px-4 text-xs font-medium text-white transition hover:bg-amber-700"
            >
              <FiArrowRight size={15} />
              العودة إلى العملاء
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================
  // العميل غير موجود
  // =========================================================

  if (!customer) {
    return (
      <main className="min-h-screen bg-gray-50 p-3" dir="rtl">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-xl border border-gray-100 bg-white p-6 text-center shadow-sm">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400">
              <FiUser size={24} />
            </div>

            <h1 className="text-lg font-bold text-gray-800">
              العميل غير موجود
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              لم يتم العثور على العميل المطلوب في النظام.
            </p>

            <Link
              href="/customers"
              className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-amber-600 px-4 text-xs font-medium text-white transition hover:bg-amber-700"
            >
              <FiArrowRight size={15} />
              العودة إلى العملاء
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // =========================================================
  // حفظ التعديلات
  // =========================================================

  const handleSave = () => {
    const cleanName = name.trim();

    if (!cleanName) {
      toast.error("اسم العميل مطلوب");
      return;
    }

    const numericBalance = Number(balance.replace(/[^\d.-]/g, ""));

    if (Number.isNaN(numericBalance)) {
      toast.error("الرصيد غير صحيح");
      return;
    }

    setIsSaving(true);

    try {
      updateCustomer(customerId, {
        name: cleanName,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        balance: numericBalance,
        notes: notes.trim() || undefined,
        isActive,
      });

      toast.success("تم حفظ بيانات العميل", {
        description: `تم تحديث بيانات ${cleanName} بنجاح.`,
      });

      setTimeout(() => {
        router.push(`/customers/${customerId}`);
      }, 500);
    } catch (error) {
      console.error(error);

      toast.error("حدث خطأ أثناء حفظ البيانات");
      setIsSaving(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <main className="min-h-screen bg-gray-50 p-2 sm:p-3" dir="rtl">
      <div className="mx-auto max-w-4xl">
        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-3 rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <FiUser size={16} />
              </div>

              <div>
                <h1 className="text-base font-bold text-gray-800">
                  تعديل العميل
                </h1>

                <p className="text-[10px] text-gray-400">
                  تعديل بيانات العميل المرتبط بحسابه المحاسبي
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/customers/${customerId}`}
                className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 text-[11px] font-medium text-gray-600 transition hover:bg-gray-50"
              >
                <FiArrowRight size={14} />
                رجوع
              </Link>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex h-8 items-center gap-1.5 rounded-md bg-amber-600 px-3 text-[11px] font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? <FiCheckCircle size={14} /> : <FiSave size={14} />}

                {isSaving ? "جاري الحفظ..." : "حفظ التعديلات"}
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================
            CUSTOMER INFORMATION
        ===================================================== */}

        <section className="mb-3 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/70 px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                <FiUser size={14} />
              </div>

              <div>
                <h2 className="text-xs font-bold text-gray-800">
                  بيانات العميل
                </h2>

                <p className="text-[9px] text-gray-400">
                  المعلومات الأساسية للعميل
                </p>
              </div>
            </div>
          </div>

          <div className="p-3">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {/* الاسم */}

              <FormField
                label="اسم العميل"
                required
                icon={<FiUser size={13} />}
              >
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="اسم العميل"
                  className={inputClass}
                />
              </FormField>

              {/* الهاتف */}

              <FormField label="رقم الهاتف" icon={<FiPhone size={13} />}>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="رقم الهاتف"
                  className={inputClass}
                  dir="ltr"
                />
              </FormField>

              {/* العنوان */}

              <FormField label="العنوان" icon={<FiMapPin size={13} />}>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="عنوان العميل"
                  className={inputClass}
                />
              </FormField>

              {/* الرصيد */}

              <FormField label="الرصيد" icon={<FiCreditCard size={13} />}>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    placeholder="0"
                    className={`${inputClass} pl-14`}
                  />

                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-400">
                    ريال
                  </span>
                </div>
              </FormField>
            </div>

            {/* حالة العميل */}

            <div className="mt-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />

                <span className="text-[11px] font-medium text-gray-700">
                  العميل نشط
                </span>
              </label>

              <p className="mt-1 pr-5 text-[9px] text-gray-400">
                يمكن إلغاء تنشيط العميل بدلًا من حذفه من النظام.
              </p>
            </div>
          </div>
        </section>

        {/* =====================================================
            ACCOUNT INFORMATION
        ===================================================== */}

        <section className="mb-3 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/70 px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-50 text-blue-600">
                <FiCreditCard size={14} />
              </div>

              <div>
                <h2 className="text-xs font-bold text-gray-800">
                  الحساب المحاسبي
                </h2>

                <p className="text-[9px] text-gray-400">
                  الحساب المرتبط بهذا العميل في شجرة الحسابات
                </p>
              </div>
            </div>
          </div>

          <div className="p-3">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {/* رقم الحساب */}

              <FormField label="رقم الحساب">
                <input
                  type="text"
                  value={accountCode}
                  readOnly
                  className={`${inputClass} cursor-not-allowed bg-gray-50 text-gray-500`}
                  dir="ltr"
                />
              </FormField>

              {/* اسم الحساب */}

              <FormField label="اسم الحساب">
                <input
                  type="text"
                  value={accountName}
                  readOnly
                  className={`${inputClass} cursor-not-allowed bg-gray-50 text-gray-500`}
                />
              </FormField>
            </div>

            {/* معلومات الحساب */}

            <div className="mt-2 rounded-md border border-blue-100 bg-blue-50 px-2.5 py-2">
              <div className="flex items-start gap-2 text-blue-700">
                <FiCreditCard size={13} className="mt-0.5 shrink-0" />

                <p className="text-[10px] leading-5">
                  هذا الحساب تم إنشاؤه وربطه بالعميل تلقائيًا بواسطة النظام تحت
                  حساب العملاء والذمم المدينة
                  <strong className="mx-1">1103</strong>. لا يتم تغيير رقم
                  الحساب يدويًا من هذه الصفحة.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================
            NOTES
        ===================================================== */}

        <section className="mb-3 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-gray-50/70 px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-600">
                <FiFileText size={14} />
              </div>

              <div>
                <h2 className="text-xs font-bold text-gray-800">ملاحظات</h2>

                <p className="text-[9px] text-gray-400">
                  معلومات إضافية عن العميل
                </p>
              </div>
            </div>
          </div>

          <div className="p-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="اكتب أي ملاحظات..."
              className="w-full resize-none rounded-md border border-gray-200 px-2.5 py-2 text-[11px] text-gray-800 outline-none placeholder:text-gray-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-100"
            />
          </div>
        </section>

        {/* =====================================================
            BOTTOM ACTIONS
        ===================================================== */}

        <div className="flex items-center justify-between rounded-lg border border-gray-100 bg-white p-2.5 shadow-sm">
          <Link
            href="/customers"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-gray-200 px-3 text-[11px] font-medium text-gray-600 transition hover:bg-gray-50"
          >
            <FiArrowRight size={14} />
            قائمة العملاء
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-amber-600 px-4 text-[11px] font-medium text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? <FiCheckCircle size={14} /> : <FiSave size={14} />}

            {isSaving ? "جاري الحفظ..." : "حفظ التعديلات"}
          </button>
        </div>
      </div>
    </main>
  );
}

// =========================================================
// FORM FIELD
// =========================================================

function FormField({
  label,
  children,
  required = false,
  icon,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1 text-[10px] font-medium text-gray-600">
        {icon && <span className="text-gray-400">{icon}</span>}

        {label}

        {required && <span className="text-red-500">*</span>}
      </label>

      {children}
    </div>
  );
}

// =========================================================
// INPUT STYLE
// =========================================================

const inputClass =
  "h-8 w-full rounded-md border border-gray-200 bg-white px-2.5 text-[11px] text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-amber-500 focus:ring-1 focus:ring-amber-100";
