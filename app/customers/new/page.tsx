"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FiArrowRight,
  FiPlus,
  FiSave,
  FiUser,
  FiPhone,
  FiMapPin,
  FiFileText,
  FiDollarSign,
  FiCheckCircle,
  FiBookOpen,
} from "react-icons/fi";
import { useERPStore } from "@/Store/erpStore";

export default function NewCustomerPage() {
  const addCustomer = useERPStore((state) => state.addCustomer);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("0");

  const [isSaved, setIsSaved] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedCustomerId, setSavedCustomerId] = useState("");
  const [savedAccountCode, setSavedAccountCode] = useState("");

  /* =====================================================
     حفظ العميل
  ===================================================== */

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanAddress = address.trim();
    const openingBalance = Number(balance) || 0;

    /* -----------------------------------------------------
       التحقق من البيانات
    ----------------------------------------------------- */

    if (!cleanName) {
      alert("يرجى إدخال اسم العميل");
      return;
    }

    if (!cleanPhone) {
      alert("يرجى إدخال رقم الهاتف");
      return;
    }

    if (openingBalance < 0) {
      alert("الرصيد الافتتاحي لا يمكن أن يكون سالبًا في هذه الشاشة");
      return;
    }

    /* -----------------------------------------------------
       إضافة العميل

       الـStore مسؤول عن:

       1. إنشاء كود العميل.
       2. إنشاء الحساب المحاسبي للعميل.
       3. وضع الحساب تحت 1001 العملاء.
       4. ربط accountCode و accountName بالعميل.
       5. إنشاء قيد الرصيد الافتتاحي إذا كان موجودًا.
    ----------------------------------------------------- */

    const result = addCustomer({
      name: cleanName,
      phone: cleanPhone,
      address: cleanAddress,
      balance: openingBalance,
    });

    /*
     * إذا كان addCustomer في الـStore يعيد العميل
     * يمكننا عرض بياناته مباشرة.
     *
     * وإذا كانت النسخة الحالية من الـStore لا تعيد قيمة،
     * سيظل الحفظ يعمل بشكل طبيعي.
     */

    if (result) {
      setSavedCustomerId(result.id || "");
      setSavedAccountCode(result.accountCode || "");
    }

    setIsSaved(true);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
    }, 4000);
  };

  /* =====================================================
     إضافة عميل آخر
  ===================================================== */

  const handleNewCustomer = () => {
    setName("");
    setPhone("");
    setAddress("");
    setBalance("0");

    setIsSaved(false);
    setShowSuccess(false);

    setSavedCustomerId("");
    setSavedAccountCode("");
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            {/* Breadcrumb */}

            <div className="flex items-center gap-2 mb-3 text-sm">
              <Link
                href="/"
                className="text-gray-400 hover:text-green-600 transition"
              >
                الرئيسية
              </Link>

              <FiArrowRight size={15} className="text-gray-400" />

              <Link
                href="/customers"
                className="text-gray-400 hover:text-green-600 transition"
              >
                العملاء
              </Link>

              <FiArrowRight size={15} className="text-gray-400" />

              <span className="text-gray-600">إضافة عميل</span>
            </div>

            {/* Title */}

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <FiUser size={23} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  إضافة عميل جديد
                </h1>

                <p className="text-sm text-gray-500 mt-1">
                  تسجيل بيانات العميل وإنشاء حسابه المحاسبي
                </p>
              </div>
            </div>
          </div>

          {/* Back */}

          <Link
            href="/customers"
            className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-lg font-medium transition"
          >
            <FiArrowRight size={18} />
            العودة للعملاء
          </Link>
        </div>

        {/* =================================================
            SUCCESS MESSAGE
        ================================================= */}

        {showSuccess && (
          <div className="mb-6 flex items-start gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-xl">
            <FiCheckCircle size={21} className="mt-0.5 shrink-0" />

            <div>
              <p className="font-semibold">تم حفظ العميل بنجاح</p>

              <p className="text-sm mt-1">
                تم إنشاء العميل وربطه بالحساب المحاسبي تلقائيًا.
              </p>

              {savedCustomerId && (
                <p className="text-xs mt-2 text-green-600">
                  كود العميل:{" "}
                  <span className="font-bold">{savedCustomerId}</span>
                </p>
              )}

              {savedAccountCode && (
                <p className="text-xs mt-1 text-green-600">
                  الحساب المحاسبي:{" "}
                  <span className="font-bold">{savedAccountCode}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* =================================================
            FORM
        ================================================= */}

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* =================================================
                FORM HEADER
            ================================================= */}

            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                  <FiFileText size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-gray-800">بيانات العميل</h2>

                  <p className="text-sm text-gray-500 mt-1">
                    أدخل المعلومات الأساسية للعميل
                  </p>
                </div>
              </div>
            </div>

            {/* =================================================
                FIELDS
            ================================================= */}

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* اسم العميل */}

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    اسم العميل
                  </label>

                  <div className="relative">
                    <FiUser
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />

                    <input
                      type="text"
                      value={name}
                      onChange={(event) => {
                        setName(event.target.value);
                        setIsSaved(false);
                      }}
                      placeholder="أدخل اسم العميل"
                      autoFocus
                      className="w-full h-12 pr-10 pl-4 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                </div>

                {/* رقم الهاتف */}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    رقم الهاتف
                  </label>

                  <div className="relative">
                    <FiPhone
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />

                    <input
                      type="text"
                      value={phone}
                      onChange={(event) => {
                        setPhone(event.target.value);
                        setIsSaved(false);
                      }}
                      placeholder="أدخل رقم الهاتف"
                      dir="ltr"
                      className="w-full h-12 pr-10 pl-4 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                </div>

                {/* العنوان */}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    العنوان
                  </label>

                  <div className="relative">
                    <FiMapPin
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />

                    <input
                      type="text"
                      value={address}
                      onChange={(event) => {
                        setAddress(event.target.value);
                        setIsSaved(false);
                      }}
                      placeholder="أدخل عنوان العميل"
                      className="w-full h-12 pr-10 pl-4 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                </div>

                {/* الرصيد الافتتاحي */}

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    الرصيد الافتتاحي
                  </label>

                  <div className="relative">
                    <FiDollarSign
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={balance}
                      onChange={(event) => {
                        setBalance(event.target.value);
                        setIsSaved(false);
                      }}
                      className="w-full h-12 pr-10 pl-4 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  <p className="text-xs text-gray-400 mt-2">
                    المبلغ المستحق على العميل عند بداية التعامل. سيتم تسجيله
                    محاسبيًا على حساب العميل.
                  </p>
                </div>
              </div>

              {/* =================================================
                  ACCOUNTING INFORMATION
              ================================================= */}

              <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 shrink-0 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                    <FiBookOpen size={18} />
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-blue-800">
                      الربط المحاسبي
                    </h3>

                    <p className="text-xs text-blue-700 leading-6 mt-1">
                      عند حفظ العميل، يقوم النظام تلقائيًا بإنشاء حساب مستقل له
                      تحت حساب العملاء.
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                      <span className="px-2.5 py-1 rounded-lg bg-white text-blue-700 font-semibold">
                        1000 الأصول
                      </span>

                      <span className="text-blue-400">←</span>

                      <span className="px-2.5 py-1 rounded-lg bg-white text-blue-700 font-semibold">
                        1001 العملاء
                      </span>

                      <span className="text-blue-400">←</span>

                      <span className="px-2.5 py-1 rounded-lg bg-white text-blue-700 font-semibold">
                        حساب العميل
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* =================================================
                  OPENING BALANCE INFORMATION
              ================================================= */}

              {Number(balance) > 0 && (
                <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 shrink-0 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                      <FiDollarSign size={18} />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-amber-800">
                        الرصيد الافتتاحي
                      </h3>

                      <p className="text-xs text-amber-700 leading-6 mt-1">
                        سيتم تسجيل مبلغ{" "}
                        <span className="font-bold">
                          {Number(balance || 0).toLocaleString("ar-SA")}
                        </span>{" "}
                        ريال كرصيد مدين على حساب العميل.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* =================================================
                BUTTONS
            ================================================= */}

            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Link
                  href="/customers"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  إلغاء
                </Link>

                {isSaved && (
                  <button
                    type="button"
                    onClick={handleNewCustomer}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition"
                  >
                    <FiPlus size={18} />
                    إضافة عميل آخر
                  </button>
                )}

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                >
                  <FiSave size={19} />

                  {isSaved ? "تم الحفظ" : "حفظ العميل"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
