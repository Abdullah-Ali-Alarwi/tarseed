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
} from "react-icons/fi";
import { toast } from "sonner";
import { useERPStore } from "@/Store/erpStore";

export default function NewCustomerPage() {
  const router = useRouter();

  const { addCustomer } = useERPStore();

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

    // ----------------------------------------------
    // التحقق من الاسم
    // ----------------------------------------------

    if (!customerName) {
      toast.error("يرجى إدخال اسم العميل");
      return;
    }

    // ----------------------------------------------
    // التحقق من الرصيد
    // ----------------------------------------------

    const numericBalance = Number(balance || 0);

    if (Number.isNaN(numericBalance)) {
      toast.error("الرصيد الافتتاحي غير صحيح");
      return;
    }

    setSaving(true);

    try {
      const created = addCustomer({
        name: customerName,

        phone: phone.trim() || undefined,

        address: address.trim() || undefined,

        balance: numericBalance,
      });

      if (!created) {
        toast.error("تعذر إنشاء العميل. تأكد من صحة البيانات.");

        setSaving(false);
        return;
      }

      // ----------------------------------------------
      // رسالة نجاح
      // ----------------------------------------------

      toast.success("تم إضافة العميل بنجاح");

      // ----------------------------------------------
      // الانتقال إلى صفحة العميل
      // ----------------------------------------------

      router.push(`/customers/${created.id}`);
    } catch (err) {
      console.error(err);

      toast.error(
        err instanceof Error ? err.message : "حدث خطأ أثناء حفظ العميل",
      );

      setSaving(false);
    }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        {/* ==================================================
            Header
        ================================================== */}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/customers"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-100"
            >
              <FiArrowRight size={20} />
            </Link>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                إضافة عميل جديد
              </h1>

              <p className="mt-1 text-sm text-gray-500">إضافة بيانات العميل</p>
            </div>
          </div>
        </div>

        {/* ==================================================
            Form
        ================================================== */}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* ==================================================
                بيانات العميل
            ================================================== */}

            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                {/* Header */}

                <div className="border-b border-gray-100 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                      <FiUser size={20} />
                    </div>

                    <div>
                      <h2 className="font-bold text-gray-900">بيانات العميل</h2>

                      <p className="text-sm text-gray-500">
                        المعلومات الأساسية للعميل
                      </p>
                    </div>
                  </div>
                </div>

                {/* Fields */}

                <div className="space-y-6 p-6">
                  {/* ==================================================
                      اسم العميل
                  ================================================== */}

                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      اسم العميل
                      <span className="mr-1 text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <FiUser
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />

                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="مثال: شركة الأمل للمقاولات"
                        className="w-full rounded-xl border border-gray-300 bg-white py-3 pr-10 pl-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        required
                      />
                    </div>
                  </div>

                  {/* ==================================================
                      الهاتف والعنوان
                  ================================================== */}

                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                    {/* الهاتف */}

                    <div>
                      <label
                        htmlFor="phone"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        رقم الهاتف
                      </label>

                      <div className="relative">
                        <FiPhone
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />

                        <input
                          id="phone"
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="مثال: 777 000 000"
                          className="w-full rounded-xl border border-gray-300 bg-white py-3 pr-10 pl-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                          dir="ltr"
                        />
                      </div>
                    </div>

                    {/* العنوان */}

                    <div>
                      <label
                        htmlFor="address"
                        className="mb-2 block text-sm font-medium text-gray-700"
                      >
                        العنوان
                      </label>

                      <div className="relative">
                        <FiMapPin
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={18}
                        />

                        <input
                          id="address"
                          type="text"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          placeholder="مثال: البيضاء - اليمن"
                          className="w-full rounded-xl border border-gray-300 bg-white py-3 pr-10 pl-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ==================================================
                      الرصيد
                  ================================================== */}

                  <div>
                    <label
                      htmlFor="balance"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      الرصيد الحالي
                    </label>

                    <div className="relative">
                      <FiDollarSign
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />

                      <input
                        id="balance"
                        type="number"
                        step="0.01"
                        value={balance}
                        onChange={(e) => setBalance(e.target.value)}
                        placeholder="0"
                        className="w-full rounded-xl border border-gray-300 bg-white py-3 pr-10 pl-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      />
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      يمكنك ترك الرصيد صفرًا إذا لم يكن للعميل رصيد سابق.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ==================================================
                معلومات إضافية
            ================================================== */}

            <div>
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                      <FiUser size={20} />
                    </div>

                    <div>
                      <h2 className="font-bold text-gray-900">
                        معلومات العميل
                      </h2>

                      <p className="text-sm text-gray-500">بيانات إضافية</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 p-6">
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <p className="text-sm font-semibold text-blue-900">
                      بيانات العميل
                    </p>

                    <p className="mt-2 text-xs leading-5 text-blue-700">
                      سيتم حفظ بيانات العميل في النظام ويمكن استخدامه لاحقًا في
                      فواتير المبيعات.
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-500">الاسم</span>

                        <span className="font-semibold text-gray-900">
                          {name || "—"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-500">الهاتف</span>

                        <span className="font-semibold text-gray-900" dir="ltr">
                          {phone || "—"}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-gray-500">الرصيد</span>

                        <span className="font-semibold text-gray-900">
                          {Number(balance || 0).toLocaleString("ar-SA")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ==================================================
              Actions
          ================================================== */}

          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/customers"
              className="flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
            >
              إلغاء
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <FiSave size={19} />
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
