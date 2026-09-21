"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiArrowRight,
  FiSave,
  FiUser,
  FiPhone,
  FiMapPin,
  FiDollarSign,
  FiCreditCard,
} from "react-icons/fi";
import { toast } from "sonner";

import { useERPStore } from "@/Store/erpStore";

export default function NewCustomerPage() {
  const router = useRouter();

  // ==================================================
  // ZUSTAND - ERP STORE
  // ==================================================

  const addCustomer = useERPStore((state) => state.addCustomer);

  // ==================================================
  // FORM STATE
  // ==================================================

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");

  const [saving, setSaving] = useState(false);

  // ==================================================
  // حفظ العميل
  // ==================================================

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const customerName = name.trim();

    // التحقق من اسم العميل
    if (!customerName) {
      toast.error("يرجى إدخال اسم العميل");
      return;
    }

    // التحقق من الرصيد
    const numericBalance = Number(balance || 0);

    if (!Number.isFinite(numericBalance)) {
      toast.error("الرصيد الافتتاحي غير صحيح");
      return;
    }

    setSaving(true);

    try {
      // إنشاء العميل والحساب المحاسبي المرتبط به تلقائيًا
      const created = addCustomer({
        name: customerName,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        balance: numericBalance,
        isActive: true,
      });

      // التحقق من إنشاء العميل
      if (!created?.id) {
        toast.error("تعذر إنشاء العميل. تأكد من صحة البيانات.");
        setSaving(false);
        return;
      }

      // رسالة النجاح
      toast.success("تم إضافة العميل بنجاح", {
        description: `تم إنشاء حساب العميل ${created.name}`,
      });

      // الانتقال إلى كشف حساب العميل
      router.push(`/customers/${created.id}`);
    } catch (error) {
      console.error("Error adding customer:", error);

      toast.error(
        error instanceof Error ? error.message : "حدث خطأ أثناء حفظ العميل",
      );

      setSaving(false);
    }
  };

  // ==================================================
  // PREVIEW
  // ==================================================

  const numericPreviewBalance = Number(balance || 0);

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-50 px-2.5 py-3 sm:px-4 sm:py-4 lg:px-5"
    >
      <div className="mx-auto max-w-5xl">
        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <Link
              href="/customers"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-100"
            >
              <FiArrowRight size={17} />
            </Link>

            <div>
              <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                إضافة عميل جديد
              </h1>

              <p className="mt-0.5 text-xs text-gray-500">
                إضافة بيانات العميل وإنشاء حسابه المحاسبي
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================
            FORM
        ================================================== */}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* ==================================================
                بيانات العميل
            ================================================== */}

            <div className="lg:col-span-2">
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                {/* Header */}

                <div className="border-b border-gray-100 px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      <FiUser size={18} />
                    </div>

                    <div>
                      <h2 className="text-sm font-bold text-gray-900">
                        بيانات العميل
                      </h2>

                      <p className="text-[11px] text-gray-500">
                        المعلومات الأساسية للعميل
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fields */}

                <div className="space-y-4 p-4">
                  {/* ==================================================
                      اسم العميل
                  ================================================== */}

                  <div>
                    <label
                      htmlFor="name"
                      className="mb-1.5 block text-xs font-medium text-gray-700"
                    >
                      اسم العميل
                      <span className="mr-1 text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <FiUser
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                        size={16}
                      />

                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="مثال: شركة الأمل للمقاولات"
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white pr-9 pl-3 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        required
                      />
                    </div>
                  </div>

                  {/* ==================================================
                      الهاتف والعنوان
                  ================================================== */}

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {/* الهاتف */}

                    <div>
                      <label
                        htmlFor="phone"
                        className="mb-1.5 block text-xs font-medium text-gray-700"
                      >
                        رقم الهاتف
                      </label>

                      <div className="relative">
                        <FiPhone
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />

                        <input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="مثال: 777 000 000"
                          className="h-10 w-full rounded-lg border border-gray-300 bg-white pr-9 pl-3 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* العنوان */}

                    <div>
                      <label
                        htmlFor="address"
                        className="mb-1.5 block text-xs font-medium text-gray-700"
                      >
                        العنوان
                      </label>

                      <div className="relative">
                        <FiMapPin
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />

                        <input
                          id="address"
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="مثال: البيضاء - اليمن"
                          className="h-10 w-full rounded-lg border border-gray-300 bg-white pr-9 pl-3 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ==================================================
                      الرصيد الافتتاحي
                  ================================================== */}

                  <div>
                    <label
                      htmlFor="balance"
                      className="mb-1.5 block text-xs font-medium text-gray-700"
                    >
                      الرصيد الافتتاحي
                    </label>

                    <div className="relative">
                      <FiDollarSign
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                        size={16}
                      />

                      <input
                        id="balance"
                        type="number"
                        step="0.01"
                        value={balance}
                        onChange={(e) => setBalance(e.target.value)}
                        placeholder="0"
                        className="h-10 w-full rounded-lg border border-gray-300 bg-white pr-9 pl-3 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <p className="mt-1.5 text-[11px] text-gray-500">
                      يمكنك ترك الرصيد صفرًا إذا لم يكن للعميل رصيد سابق.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ==================================================
                معلومات الحساب
            ================================================== */}

            <div>
              <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                {/* Header */}

                <div className="border-b border-gray-100 px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
                      <FiCreditCard size={18} />
                    </div>

                    <div>
                      <h2 className="text-sm font-bold text-gray-900">
                        الحساب المحاسبي
                      </h2>

                      <p className="text-[11px] text-gray-500">
                        يتم إنشاؤه تلقائيًا
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3.5 p-4">
                  {/* ==================================================
                      مكان الحساب
                  ================================================== */}

                  <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                    <div className="flex items-start gap-2.5">
                      <FiCreditCard
                        className="mt-0.5 shrink-0 text-blue-600"
                        size={17}
                      />

                      <div>
                        <p className="text-xs font-semibold text-blue-900">
                          سيتم إنشاء الحساب تلقائيًا
                        </p>

                        <p className="mt-1.5 text-[11px] leading-5 text-blue-700">
                          عند حفظ العميل، سيقوم النظام بإنشاء حساب محاسبي مستقل
                          وربطه بالعميل.
                        </p>

                        <div className="mt-2.5 rounded-md bg-white px-2.5 py-2.5">
                          <p className="text-[10px] text-gray-500">
                            التصنيف المحاسبي
                          </p>

                          <p className="mt-0.5 text-xs font-semibold text-gray-900">
                            الأصول
                          </p>

                          <p className="mt-0.5 text-xs text-gray-700">
                            ← الأصول المتداولة
                          </p>

                          <p className="mt-0.5 text-xs font-semibold text-blue-700">
                            ← العملاء والذمم المدينة
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ==================================================
                      Preview
                  ================================================== */}

                  <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <div className="space-y-2.5 text-xs">
                      {/* الاسم */}

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-500">اسم العميل</span>

                        <span className="max-w-[160px] truncate font-semibold text-gray-900">
                          {name || "—"}
                        </span>
                      </div>

                      {/* الهاتف */}

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-500">الهاتف</span>

                        <span className="font-semibold text-gray-900" dir="ltr">
                          {phone || "—"}
                        </span>
                      </div>

                      {/* العنوان */}

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-500">العنوان</span>

                        <span className="max-w-[160px] truncate font-semibold text-gray-900">
                          {address || "—"}
                        </span>
                      </div>

                      {/* الرصيد */}

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-gray-500">الرصيد الافتتاحي</span>

                        <span className="font-semibold text-gray-900">
                          {numericPreviewBalance.toLocaleString("ar-SA")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* ==================================================
                      ملاحظة محاسبية
                  ================================================== */}

                  <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                    <p className="text-[11px] leading-5 text-amber-800">
                      حساب العميل سيكون حسابًا فرعيًا مستقلًا تحت حساب العملاء،
                      ويمكن استخدامه لاحقًا في القيود اليومية وكشف حساب العميل.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================
              ACTIONS
          ================================================== */}

          <div className="mt-4 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
            {/* إلغاء */}

            <Link
              href="/customers"
              className="flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
            >
              إلغاء
            </Link>

            {/* حفظ */}

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <FiSave size={16} />
                  حفظ العميل
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
