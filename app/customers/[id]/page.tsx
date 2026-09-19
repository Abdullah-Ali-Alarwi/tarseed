"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useERPStore } from "@/Store/erpStore";
import {
  FiArrowRight,
  FiEdit,
  FiPrinter,
  FiUser,
  FiPhone,
  FiMapPin,
  FiFileText,
  FiDollarSign,
  FiX,
  FiSave,
} from "react-icons/fi";

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const customerId = String(params.id);

  const customer = useERPStore((state) =>
    state.customers.find((item) => item.id === customerId),
  );

  const sales = useERPStore((state) => state.sales);

  /*
   * دالة تحديث العميل من Zustand
   *
   * إذا كان اسم الدالة في erpStore مختلفاً،
   * غيّر updateCustomer إلى اسم الدالة الموجود عندك.
   */
  const updateCustomer = useERPStore((state) => state.updateCustomer);

  /* =========================================================
     حالة نافذة تعديل العميل
  ========================================================= */

  const [isEditOpen, setIsEditOpen] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    address: "",
    balance: "",
  });

  /* =========================================================
     فتح نافذة التعديل
  ========================================================= */

  const openEditModal = () => {
    if (!customer) return;

    setEditForm({
      name: customer.name || "",
      phone: customer.phone || "",
      address: customer.address || "",
      balance: String(customer.balance ?? 0),
    });

    setIsEditOpen(true);
  };

  /* =========================================================
     إغلاق نافذة التعديل
  ========================================================= */

  const closeEditModal = () => {
    setIsEditOpen(false);
  };

  /* =========================================================
     تغيير بيانات النموذج
  ========================================================= */

  const handleEditChange = (field: keyof typeof editForm, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* =========================================================
     حفظ بيانات العميل
  ========================================================= */

  const handleSaveCustomer = () => {
    if (!customer) return;

    const name = editForm.name.trim();

    if (!name) {
      alert("يرجى إدخال اسم العميل");
      return;
    }

    const balance = Number(editForm.balance);

    if (Number.isNaN(balance)) {
      alert("الرصيد السابق غير صحيح");
      return;
    }

    updateCustomer(customer.id, {
      name,
      phone: editForm.phone.trim(),
      address: editForm.address.trim(),
      balance,
    });

    setIsEditOpen(false);
  };

  /* =========================================================
     مبيعات العميل
  ========================================================= */

  const customerSales = useMemo(() => {
    return sales
      .filter((sale) => sale.customerId === customerId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [sales, customerId]);

  /* =========================================================
     تنسيق المبالغ
  ========================================================= */

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value);
  };

  /* =========================================================
     تنسيق التاريخ
  ========================================================= */

  const formatDate = (date: string) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return new Intl.DateTimeFormat("ar-YE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(parsedDate);
  };

  /* =========================================================
     نوع الدفع
  ========================================================= */

  const getPaymentLabel = (method: string) => {
    switch (method) {
      case "cash":
        return "نقدي";

      case "bank":
        return "تحويل بنكي";

      case "credit":
        return "آجل";

      default:
        return "-";
    }
  };

  /* =========================================================
     كشف الحساب
  ========================================================= */

  const accountStatement = useMemo(() => {
    const openingBalance = Number(customer?.balance || 0);

    let runningBalance = openingBalance;

    const movements = [
      {
        id: "opening-balance",
        date: "",
        documentNumber: "-",
        description: "رصيد سابق",
        debit: 0,
        credit: 0,
        balance: openingBalance,
        type: "opening",
      },
      ...customerSales.map((sale) => {
        const amount = Number(sale.total || 0);

        runningBalance += amount;

        return {
          id: sale.id,
          date: sale.date,
          documentNumber: sale.invoiceNumber,
          description: `فاتورة مبيعات - ${getPaymentLabel(sale.paymentMethod)}`,
          debit: amount,
          credit: 0,
          balance: runningBalance,
          type: "sale",
        };
      }),
    ];

    return {
      openingBalance,
      movements,
      totalDebit: customerSales.reduce(
        (sum, sale) => sum + Number(sale.total || 0),
        0,
      ),
      totalCredit: 0,
      finalBalance: runningBalance,
    };
  }, [customer, customerSales]);

  /* =========================================================
     العميل غير موجود
  ========================================================= */

  if (!customer) {
    return (
      <div dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-6">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
              <FiUser size={30} />
            </div>

            <h1 className="mb-2 text-xl font-bold text-gray-800">
              العميل غير موجود
            </h1>

            <p className="mb-6 text-sm text-gray-500">
              لم يتم العثور على العميل المطلوب.
            </p>

            <button
              onClick={() => router.push("/customers")}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0E1F33] px-5 py-3 text-sm font-semibold text-white hover:opacity-90"
            >
              <FiArrowRight />
              العودة إلى العملاء
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 p-3 sm:p-5 lg:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* =====================================================
            رأس الصفحة
        ====================================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/customers"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                <FiArrowRight size={20} />
              </Link>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
                    كشف حساب العميل
                  </h1>

                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    {customer.id}
                  </span>
                </div>

                <p className="mt-1 text-sm text-gray-500">{customer.name}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <FiPrinter />
                طباعة الكشف
              </button>

              {/* تعديل العميل - يفتح Popup */}
              <button
                type="button"
                onClick={openEditModal}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0E1F33] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
              >
                <FiEdit />
                تعديل العميل
              </button>
            </div>
          </div>
        </div>

        {/* =====================================================
            بيانات العميل
        ====================================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <FiUser size={22} />
            </div>

            <div>
              <h2 className="font-bold text-gray-900">بيانات العميل</h2>

              <p className="text-xs text-gray-500">
                معلومات العميل المرتبط بكشف الحساب
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="mb-1 text-xs text-gray-500">اسم العميل</p>

              <p className="font-bold text-gray-800">{customer.name}</p>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="mb-1 text-xs text-gray-500">رقم الهاتف</p>

              <div className="flex items-center gap-2 font-bold text-gray-800">
                <FiPhone className="text-gray-400" />

                {customer.phone || "غير محدد"}
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="mb-1 text-xs text-gray-500">العنوان</p>

              <div className="flex items-center gap-2 font-bold text-gray-800">
                <FiMapPin className="text-gray-400" />

                {customer.address || "غير محدد"}
              </div>
            </div>

            <div className="rounded-xl bg-gray-50 p-4">
              <p className="mb-1 text-xs text-gray-500">الرصيد السابق</p>

              <p className="font-bold text-orange-600">
                {formatMoney(accountStatement.openingBalance)}
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================
            ملخص كشف الحساب
        ====================================================== */}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">الرصيد السابق</p>

                <p className="mt-2 text-xl font-bold text-gray-800">
                  {formatMoney(accountStatement.openingBalance)}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                <FiDollarSign />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">إجمالي المدين</p>

                <p className="mt-2 text-xl font-bold text-red-600">
                  {formatMoney(accountStatement.totalDebit)}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
                <FiFileText />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">إجمالي الدائن</p>

                <p className="mt-2 text-xl font-bold text-green-600">
                  {formatMoney(accountStatement.totalCredit)}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <FiDollarSign />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">الرصيد الحالي</p>

                <p
                  className={`mt-2 text-xl font-bold ${
                    accountStatement.finalBalance > 0
                      ? "text-orange-600"
                      : "text-green-600"
                  }`}
                >
                  {formatMoney(accountStatement.finalBalance)}
                </p>
              </div>

              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  accountStatement.finalBalance > 0
                    ? "bg-orange-50 text-orange-600"
                    : "bg-green-50 text-green-600"
                }`}
              >
                <FiDollarSign />
              </div>
            </div>
          </div>
        </div>

        {/* =====================================================
            كشف الحساب
        ====================================================== */}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">كشف الحساب</h2>

              <p className="mt-1 text-sm text-gray-500">
                سجل جميع الحركات المالية المسجلة على حساب العميل
              </p>
            </div>
          </div>

          {accountStatement.movements.length === 1 ? (
            <div className="p-10 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <FiFileText size={28} />
              </div>

              <h3 className="font-semibold text-gray-700">لا توجد حركات</h3>

              <p className="mt-1 text-sm text-gray-400">
                لا توجد حركات مالية مسجلة على حساب هذا العميل.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-right">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-xs text-gray-500">
                    <th className="px-4 py-4 font-semibold">م</th>

                    <th className="px-4 py-4 font-semibold">التاريخ</th>

                    <th className="px-4 py-4 font-semibold">رقم المستند</th>

                    <th className="px-4 py-4 font-semibold">البيان</th>

                    <th className="px-4 py-4 font-semibold">مدين</th>

                    <th className="px-4 py-4 font-semibold">دائن</th>

                    <th className="px-4 py-4 font-semibold">الرصيد</th>
                  </tr>
                </thead>

                <tbody>
                  {accountStatement.movements.map((movement, index) => (
                    <tr
                      key={movement.id}
                      className={`border-b border-gray-100 ${
                        movement.type === "opening"
                          ? "bg-gray-50 font-semibold"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {movement.type === "opening" ? "-" : index}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-600">
                        {movement.type === "opening"
                          ? "-"
                          : formatDate(movement.date)}
                      </td>

                      <td className="px-4 py-4">
                        {movement.type === "sale" ? (
                          <Link
                            href={`/sales/${movement.id}`}
                            className="font-bold text-[#0E1F33] hover:underline"
                          >
                            {movement.documentNumber}
                          </Link>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>

                      <td className="px-4 py-4 text-sm text-gray-700">
                        {movement.description}
                      </td>

                      <td className="px-4 py-4 font-semibold text-red-600">
                        {movement.debit > 0 ? formatMoney(movement.debit) : "-"}
                      </td>

                      <td className="px-4 py-4 font-semibold text-green-600">
                        {movement.credit > 0
                          ? formatMoney(movement.credit)
                          : "-"}
                      </td>

                      <td className="px-4 py-4 font-bold text-gray-900">
                        {formatMoney(movement.balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr className="bg-gray-50">
                    <td
                      colSpan={4}
                      className="px-4 py-4 font-bold text-gray-800"
                    >
                      الإجمالي
                    </td>

                    <td className="px-4 py-4 font-bold text-red-600">
                      {formatMoney(accountStatement.totalDebit)}
                    </td>

                    <td className="px-4 py-4 font-bold text-green-600">
                      {formatMoney(accountStatement.totalCredit)}
                    </td>

                    <td className="px-4 py-4 font-bold text-[#0E1F33]">
                      {formatMoney(accountStatement.finalBalance)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* =====================================================
            ملاحظة
        ====================================================== */}

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          <p className="font-semibold">ملاحظة:</p>

          <p className="mt-1 leading-6">
            يتم عرض الحركات المسجلة فعلياً في النظام فقط. حالياً فواتير البيع
            تظهر كحركات مدينة، ولا يتم إنشاء أي حركة سداد أو فاتورة من صفحة كشف
            الحساب.
          </p>
        </div>
      </div>

      {/* =======================================================
          Popup تعديل بيانات العميل
      ======================================================== */}

      {isEditOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeEditModal();
            }
          }}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            {/* رأس النافذة */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  تعديل بيانات العميل
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  تعديل البيانات الأساسية للحساب
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                aria-label="إغلاق"
              >
                <FiX size={20} />
              </button>
            </div>

            {/* محتوى النافذة */}
            <div className="space-y-4 p-5">
              {/* اسم العميل */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  اسم العميل
                </label>

                <div className="relative">
                  <FiUser className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(event) =>
                      handleEditChange("name", event.target.value)
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-3 pr-10 text-sm text-gray-800 outline-none transition focus:border-[#0E1F33] focus:ring-2 focus:ring-[#0E1F33]/10"
                    placeholder="اسم العميل"
                  />
                </div>
              </div>

              {/* الهاتف */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  رقم الهاتف
                </label>

                <div className="relative">
                  <FiPhone className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(event) =>
                      handleEditChange("phone", event.target.value)
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-3 pr-10 text-sm text-gray-800 outline-none transition focus:border-[#0E1F33] focus:ring-2 focus:ring-[#0E1F33]/10"
                    placeholder="رقم الهاتف"
                    dir="ltr"
                  />
                </div>
              </div>

              {/* العنوان */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  العنوان
                </label>

                <div className="relative">
                  <FiMapPin className="absolute right-3 top-3 text-gray-400" />

                  <textarea
                    value={editForm.address}
                    onChange={(event) =>
                      handleEditChange("address", event.target.value)
                    }
                    rows={3}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-white py-3 pl-3 pr-10 text-sm text-gray-800 outline-none transition focus:border-[#0E1F33] focus:ring-2 focus:ring-[#0E1F33]/10"
                    placeholder="عنوان العميل"
                  />
                </div>
              </div>

              {/* الرصيد السابق */}
              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  الرصيد السابق
                </label>

                <div className="relative">
                  <FiDollarSign className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    type="number"
                    value={editForm.balance}
                    onChange={(event) =>
                      handleEditChange("balance", event.target.value)
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-3 pr-10 text-sm text-gray-800 outline-none transition focus:border-[#0E1F33] focus:ring-2 focus:ring-[#0E1F33]/10"
                    placeholder="0"
                    step="0.01"
                  />
                </div>

                <p className="mt-1 text-xs text-gray-400">
                  هذا هو الرصيد الافتتاحي الذي يظهر في كشف الحساب.
                </p>
              </div>
            </div>

            {/* أزرار النافذة */}
            <div className="flex flex-col-reverse gap-2 border-t border-gray-200 bg-gray-50 p-4 sm:flex-row">
              <button
                type="button"
                onClick={closeEditModal}
                className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleSaveCustomer}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#0E1F33] px-4 py-3 text-sm font-semibold text-white hover:opacity-90"
              >
                <FiSave />
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          الطباعة
      ======================================================== */}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          aside,
          nav,
          button,
          a[href="/customers"],
          a[href*="/edit"] {
            display: none !important;
          }

          * {
            box-shadow: none !important;
          }

          @page {
            size: A4;
            margin: 10mm;
          }

          table {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
