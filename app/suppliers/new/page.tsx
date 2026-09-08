"use client";

import Link from "next/link";
import { useState } from "react";
import {
  FiArrowRight,
  FiPlus,
  FiSave,
  FiTruck,
  FiPhone,
  FiMapPin,
  FiFileText,
  FiCheckCircle,
} from "react-icons/fi";
import { useERPStore } from "@/Store/erpStore";

export default function NewSupplierPage() {
  const addSupplier = useERPStore((state) => state.addSupplier);

  // ======================================================
  // بيانات المورد
  // ======================================================

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("0");

  // ======================================================
  // حالة الحفظ
  // ======================================================

  const [isSaved, setIsSaved] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [savedSupplierId, setSavedSupplierId] = useState("");

  // ======================================================
  // تفريغ الحقول
  // ======================================================

  const clearFields = () => {
    setName("");
    setPhone("");
    setAddress("");
    setBalance("0");
  };

  // ======================================================
  // حفظ المورد
  // ======================================================

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    const cleanAddress = address.trim();

    const numericBalance = Number(balance) || 0;

    // ==================================================
    // التحقق من البيانات
    // ==================================================

    if (!cleanName) {
      alert("يرجى إدخال اسم المورد.");
      return;
    }

    if (!cleanPhone) {
      alert("يرجى إدخال رقم الهاتف.");
      return;
    }

    if (numericBalance < 0) {
      alert("لا يمكن أن يكون الرصيد الافتتاحي سالبًا.");
      return;
    }

    // ==================================================
    // إضافة المورد
    //
    // ملاحظة:
    // لا نرسل id لأن Zustand يقوم بإنشائه تلقائيًا.
    // ==================================================

    addSupplier({
      name: cleanName,
      phone: cleanPhone,
      address: cleanAddress,
      balance: numericBalance,
    });

    // ==================================================
    // إنشاء معرف للعرض فقط
    //
    // هذا ليس معرف المورد المخزن.
    // نستخدمه فقط كمرجع بصري بعد الحفظ.
    // ==================================================

    const displayId = `S${Date.now().toString().slice(-6)}`;

    setSavedSupplierId(displayId);

    setIsSaved(true);
    setShowSuccess(true);

    // ==================================================
    // تفريغ الحقول
    // ==================================================

    clearFields();

    // ==================================================
    // إخفاء رسالة النجاح
    // ==================================================

    window.setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  // ======================================================
  // إضافة مورد آخر
  // ======================================================

  const handleNewSupplier = () => {
    clearFields();

    setIsSaved(false);
    setShowSuccess(false);
    setSavedSupplierId("");
  };

  return (
    <main className="min-h-screen bg-gray-50 p-4 sm:p-6" dir="rtl">
      <div className="max-w-5xl mx-auto">
        {/* ==================================================
            Header
        ================================================== */}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            {/* Breadcrumb */}

            <div className="flex items-center gap-2 mb-2 text-sm">
              <Link
                href="/"
                className="text-gray-400 hover:text-amber-600 transition"
              >
                الرئيسية
              </Link>

              <FiArrowRight size={15} className="text-gray-400" />

              <Link
                href="/suppliers"
                className="text-gray-400 hover:text-amber-600 transition"
              >
                الموردين
              </Link>

              <FiArrowRight size={15} className="text-gray-400" />

              <span className="text-gray-600">إضافة مورد</span>
            </div>

            {/* Title */}

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <FiTruck size={23} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  إضافة مورد جديد
                </h1>

                <p className="text-sm text-gray-500 mt-1">
                  تسجيل بيانات المورد في النظام
                </p>
              </div>
            </div>
          </div>

          {/* العودة */}

          <Link
            href="/suppliers"
            className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-lg font-medium transition"
          >
            <FiArrowRight size={18} />
            العودة للموردين
          </Link>
        </div>

        {/* ==================================================
            Success Message
        ================================================== */}

        {showSuccess && (
          <div className="mb-6 flex items-center gap-3 bg-green-50 border border-green-200 text-green-700 px-4 py-4 rounded-xl">
            <FiCheckCircle size={21} />

            <div>
              <p className="font-semibold">تم حفظ المورد بنجاح</p>

              <p className="text-sm mt-1">
                تم حفظ بيانات المورد وتفريغ الحقول لإضافة مورد جديد.
              </p>

              {savedSupplierId && (
                <p className="text-xs mt-1 text-green-600">
                  رقم العملية: {savedSupplierId}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ==================================================
            Form
        ================================================== */}

        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* ==================================================
                Section Header
            ================================================== */}

            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                  <FiFileText size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-gray-800">بيانات المورد</h2>

                  <p className="text-sm text-gray-500 mt-1">
                    أدخل المعلومات الأساسية للمورد
                  </p>
                </div>
              </div>
            </div>

            {/* ==================================================
                Fields
            ================================================== */}

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ==================================================
                    اسم المورد
                ================================================== */}

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    اسم المورد
                  </label>

                  <div className="relative">
                    <FiTruck
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
                      placeholder="أدخل اسم المورد"
                      required
                      className="w-full h-12 pr-10 pl-4 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                </div>

                {/* ==================================================
                    الهاتف
                ================================================== */}

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
                      required
                      dir="ltr"
                      className="w-full h-12 pr-10 pl-4 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                </div>

                {/* ==================================================
                    العنوان
                ================================================== */}

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
                      placeholder="أدخل عنوان المورد"
                      className="w-full h-12 pr-10 pl-4 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none placeholder:text-gray-400 focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                </div>

                {/* ==================================================
                    الرصيد الافتتاحي
                ================================================== */}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    الرصيد الافتتاحي
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={balance}
                    onChange={(event) => {
                      setBalance(event.target.value);
                      setIsSaved(false);
                    }}
                    className="w-full h-12 px-4 bg-white text-gray-900 border border-gray-300 rounded-lg outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />

                  <p className="text-xs text-gray-400 mt-2">
                    المبلغ المستحق للمورد عند بداية التعامل.
                  </p>
                </div>
              </div>

              {/* ==================================================
                  ملاحظة
              ================================================== */}

              <div className="mt-6 bg-amber-50 border border-amber-100 rounded-xl p-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 shrink-0 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                    <FiTruck size={16} />
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-800">تنبيه</h3>

                    <p className="text-[11px] sm:text-xs text-gray-600 leading-6 mt-1">
                      بعد الضغط على حفظ المورد سيتم حفظ البيانات وتفريغ جميع
                      الحقول تلقائيًا لتتمكن من إضافة مورد آخر.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* ==================================================
                Buttons
            ================================================== */}

            <div className="p-6 bg-gray-50 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row justify-end gap-3">
                <Link
                  href="/suppliers"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  إلغاء
                </Link>

                {isSaved && (
                  <button
                    type="button"
                    onClick={handleNewSupplier}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-lg font-medium transition"
                  >
                    <FiPlus size={18} />
                    إضافة مورد آخر
                  </button>
                )}

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition"
                >
                  <FiSave size={19} />

                  {isSaved ? "تم الحفظ" : "حفظ المورد"}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
