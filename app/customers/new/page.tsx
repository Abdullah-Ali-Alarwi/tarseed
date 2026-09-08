"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FiArrowRight,
  FiPlus,
  FiSave,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiFileText,
  FiDollarSign,
  FiCheckCircle,
} from "react-icons/fi";
import { useERPStore } from "@/Store/erpStore";

export default function NewCustomerPage() {
  const addCustomer = useERPStore((state) => state.addCustomer);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("0");

  const [isSaved, setIsSaved] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [savedCustomerId, setSavedCustomerId] = useState("");

  /* =====================================================
     حفظ العميل
  ===================================================== */

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim()) {
      alert("يرجى إدخال اسم العميل");
      return;
    }

    if (!phone.trim()) {
      alert("يرجى إدخال رقم الهاتف");
      return;
    }

    /*
      مهم:
      لا نرسل id هنا لأن Zustand يقوم
      بإنشائه تلقائيًا.
    */

    addCustomer({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      balance: Number(balance) || 0,
    });

    /*
      الـStore الحالي ينشئ ID تلقائيًا،
      لذلك نعرض رسالة نجاح بدون محاولة
      تخمين الـID.
    */

    setIsSaved(true);
    setShowSuccess(true);

    /*
      البريد الإلكتروني موجود في الواجهة،
      لكنه لا يدخل إلى Customer في الـStore
      الحالي لأنه لا يحتوي على email.
    */

    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  /* =====================================================
     إضافة عميل آخر
  ===================================================== */

  const handleNewCustomer = () => {
    setName("");
    setPhone("");
    setEmail("");
    setAddress("");
    setBalance("0");
    setIsSaved(false);
    setShowSuccess(false);
    setSavedCustomerId("");
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm">
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

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                <FiUser size={23} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  إضافة عميل جديد
                </h1>

                <p className="text-sm text-gray-500 mt-1">
                  تسجيل بيانات العميل وحسابه في النظام
                </p>
              </div>
            </div>
          </div>

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
                تمت إضافة العميل إلى النظام ويمكنك الآن استخدامه في فواتير
                المبيعات.
              </p>

              {savedCustomerId && (
                <p className="text-xs mt-1 text-green-600">
                  كود العميل: {savedCustomerId}
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

                {/* البريد الإلكتروني */}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    البريد الإلكتروني
                  </label>

                  <div className="relative">
                    <FiMail
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      size={18}
                    />

                    <input
                      type="email"
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value);
                        setIsSaved(false);
                      }}
                      placeholder="example@email.com"
                      dir="ltr"
                      className="w-full h-12 pr-10 pl-4 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none placeholder:text-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  <p className="text-[11px] text-gray-400 mt-2">
                    البريد الإلكتروني غير إلزامي.
                  </p>
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

                <div>
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
                      value={balance}
                      onChange={(event) => {
                        setBalance(event.target.value);
                        setIsSaved(false);
                      }}
                      className="w-full h-12 pr-10 pl-4 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:border-green-500 focus:ring-2 focus:ring-green-100"
                    />
                  </div>

                  <p className="text-xs text-gray-400 mt-2">
                    المبلغ المستحق على العميل عند بداية التعامل
                  </p>
                </div>
              </div>
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
