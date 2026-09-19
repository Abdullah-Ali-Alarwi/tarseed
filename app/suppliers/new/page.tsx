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
  FiCheckCircle,
} from "react-icons/fi";
import { useERPStore } from "@/Store/erpStore";

export default function NewSupplierPage() {
  const router = useRouter();

  const { addSupplier } = useERPStore();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [accountCode, setAccountCode] = useState("");
  const [accountName, setAccountName] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setError("");

    const supplierName = name.trim();

    if (!supplierName) {
      setError("يرجى إدخال اسم المورد");
      return;
    }

    const numericBalance = Number(balance || 0);

    if (Number.isNaN(numericBalance)) {
      setError("الرصيد الافتتاحي غير صحيح");
      return;
    }

    setSaving(true);

    try {
      const created = addSupplier({
        name: supplierName,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        balance: numericBalance,
        accountCode: accountCode.trim() || undefined,
        accountName: accountName.trim() || `حساب المورد - ${supplierName}`,
      });

      if (!created) {
        setError("تعذر إنشاء المورد. تأكد من صحة البيانات.");
        setSaving(false);
        return;
      }

      router.push(`/suppliers/${created.id}`);
    } catch (err) {
      console.error(err);

      setError(err instanceof Error ? err.message : "حدث خطأ أثناء حفظ المورد");

      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/suppliers"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-100"
            >
              <FiArrowRight size={20} />
            </Link>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                إضافة مورد جديد
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                إضافة بيانات المورد وإنشاء حسابه المحاسبي
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Supplier information */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                      <FiTruck size={20} />
                    </div>

                    <div>
                      <h2 className="font-bold text-gray-900">بيانات المورد</h2>

                      <p className="text-sm text-gray-500">
                        المعلومات الأساسية للمورد
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6 p-6">
                  {/* Name */}
                  <div>
                    <label
                      htmlFor="name"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      اسم المورد
                      <span className="mr-1 text-red-500">*</span>
                    </label>

                    <div className="relative">
                      <FiTruck
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        size={18}
                      />

                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="مثال: مؤسسة وادي العسل"
                        className="w-full rounded-xl border border-gray-300 bg-white py-3 pr-10 pl-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone + Address */}
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
                          className="w-full rounded-xl border border-gray-300 bg-white py-3 pr-10 pl-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                          dir="ltr"
                        />
                      </div>
                    </div>

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
                          className="w-full rounded-xl border border-gray-300 bg-white py-3 pr-10 pl-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Opening balance */}
                  <div>
                    <label
                      htmlFor="balance"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      الرصيد الافتتاحي
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
                        className="w-full rounded-xl border border-gray-300 bg-white py-3 pr-10 pl-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      />
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      أدخل الرصيد الافتتاحي للمورد إذا كان لديه رصيد سابق في
                      النظام.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Accounting information */}
            <div>
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-100 px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                      <FiDollarSign size={20} />
                    </div>

                    <div>
                      <h2 className="font-bold text-gray-900">
                        الحساب المحاسبي
                      </h2>

                      <p className="text-sm text-gray-500">ربط المورد بحسابه</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 p-6">
                  {/* Account code */}
                  <div>
                    <label
                      htmlFor="accountCode"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      رمز الحساب
                    </label>

                    <input
                      id="accountCode"
                      type="text"
                      value={accountCode}
                      onChange={(e) => setAccountCode(e.target.value)}
                      placeholder="اتركه فارغًا للتوليد التلقائي"
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                      dir="ltr"
                    />

                    <p className="mt-2 text-xs leading-5 text-gray-500">
                      إذا تركته فارغًا، سيقوم النظام بإنشاء حساب فرعي للمورد
                      تلقائيًا.
                    </p>
                  </div>

                  {/* Account name */}
                  <div>
                    <label
                      htmlFor="accountName"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      اسم الحساب
                    </label>

                    <input
                      id="accountName"
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder={
                        name ? `حساب المورد - ${name}` : "اسم الحساب المحاسبي"
                      }
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                    />
                  </div>

                  {/* Info */}
                  <div className="rounded-xl border border-orange-100 bg-orange-50 p-4">
                    <div className="flex items-start gap-3">
                      <FiCheckCircle
                        className="mt-0.5 shrink-0 text-orange-600"
                        size={18}
                      />

                      <div>
                        <p className="text-sm font-semibold text-orange-900">
                          إنشاء الحساب تلقائيًا
                        </p>

                        <p className="mt-1 text-xs leading-5 text-orange-700">
                          عند حفظ المورد سيتم ربطه بالحساب المحاسبي الخاص به،
                          ويمكن استخدام الحساب في فواتير المشتريات والقيود
                          المحاسبية.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/suppliers"
              className="flex items-center justify-center rounded-xl border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition hover:bg-gray-50"
            >
              إلغاء
            </Link>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center justify-center gap-2 rounded-xl bg-orange-600 px-7 py-3 font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <FiSave size={19} />
                  حفظ المورد
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
