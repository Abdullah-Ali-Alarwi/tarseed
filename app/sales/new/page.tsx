"use client";

import { useState } from "react";
import { Toaster, toast } from "sonner";
import { FiShoppingCart, FiFileText } from "react-icons/fi";

import Buyers from "./SelesComponents/Buyers";
import AddItems, { type InvoiceItem } from "./SelesComponents/AddItems";
import InvoiceItemsTable from "./SelesComponents/InvoiceItemsTable";
import InvoiceSummary from "./SelesComponents/InvoiceSummary";

export default function NewSalesPage() {
  /* =====================================================
     أصناف الفاتورة
  ===================================================== */

  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);

  /* =====================================================
     إضافة صنف
  ===================================================== */

  const handleAddItem = (item: InvoiceItem) => {
    setInvoiceItems((prev) => [...prev, item]);
  };

  /* =====================================================
     حذف صنف
  ===================================================== */

  const handleDeleteItem = (id: number) => {
    const deletedItem = invoiceItems.find((item) => item.id === id);

    setInvoiceItems((prev) => prev.filter((item) => item.id !== id));

    if (deletedItem) {
      toast.success(`تم حذف "${deletedItem.item}" من الفاتورة`);
    }
  };

  /* =====================================================
     سؤال الطباعة
  ===================================================== */

  const askForPrint = (invoiceId: string) => {
    toast(
      <div dir="rtl" className="w-[320px]">
        {/* عنوان الرسالة */}
        <div className="mb-2 text-base font-bold text-gray-800">
          تم حفظ الفاتورة بنجاح
        </div>

        {/* السؤال */}
        <div className="mb-4 text-sm text-gray-600">
          هل تريد طباعة الفاتورة؟
        </div>

        {/* الأزرار */}
        <div className="flex gap-2">
          {/* =============================================
              نعم - طباعة
          ============================================= */}

          <button
            type="button"
            onClick={() => {
              toast.dismiss();

              /*
               * فتح صفحة الطباعة الخاصة بالفاتورة
               *
               * مثال:
               * /sales/sale-1758293847/print
               */

              window.open(`/sales/${invoiceId}/print`, "_blank");
            }}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
          >
            نعم، طباعة
          </button>

          {/* =============================================
              لا
          ============================================= */}

          <button
            type="button"
            onClick={() => {
              toast.dismiss();
            }}
            className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
          >
            لا
          </button>
        </div>
      </div>,
      {
        duration: 10000,
        closeButton: true,
      },
    );
  };

  /* =====================================================
     حفظ الفاتورة
  ===================================================== */

  const handleSaveInvoice = () => {
    /* ===================================================
       التحقق من وجود أصناف
    =================================================== */

    if (invoiceItems.length === 0) {
      toast.error("لا يمكن حفظ الفاتورة بدون أصناف");

      return;
    }

    /* ===================================================
       مؤقتًا

       هنا سنربط salesStore في الخطوة التالية.

       بعد الحفظ الحقيقي سيأتي ID الفاتورة من:

       const savedInvoice = addSale(...);

       ثم:

       savedInvoice.id
    =================================================== */

    const savedInvoiceId = `sale-${Date.now()}`;

    /* ===================================================
       إظهار رسالة الطباعة
    =================================================== */

    askForPrint(savedInvoiceId);
  };

  /* =====================================================
     تفريغ الفاتورة
  ===================================================== */

  const handleClearInvoice = () => {
    if (invoiceItems.length === 0) {
      toast.error("الفاتورة فارغة");

      return;
    }

    setInvoiceItems([]);

    toast.success("تم تفريغ أصناف الفاتورة");
  };

  /* =====================================================
     الصفحة
  ===================================================== */

  return (
    <main dir="rtl" className="min-h-screen bg-gray-50 p-3 text-sm">
      {/* =================================================
          Sonner
      ================================================= */}

      <Toaster position="top-center" richColors closeButton dir="rtl" />

      <div className="mx-auto max-w-[1500px]">
        {/* =================================================
            رأس الصفحة
        ================================================= */}

        <div className="mb-3 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            {/* الأيقونة */}

            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm">
              <FiShoppingCart size={17} />
            </div>

            {/* العنوان */}

            <div>
              <h1 className="text-base font-bold text-gray-800">
                فاتورة مبيعات جديدة
              </h1>

              <p className="text-[10px] text-gray-500">
                إنشاء فاتورة مبيعات وإضافة الأصناف
              </p>
            </div>
          </div>

          {/* عدد الأصناف */}

          <div className="hidden items-center gap-2 rounded-md bg-gray-50 px-3 py-2 sm:flex">
            <FiFileText size={13} className="text-gray-400" />

            <span className="text-[10px] text-gray-500">عدد الأصناف:</span>

            <span className="text-xs font-bold text-gray-800">
              {invoiceItems.length}
            </span>
          </div>
        </div>

        {/* =================================================
            معلومات العميل وطريقة الدفع
        ================================================= */}

        <section className="mb-3 rounded-lg border border-gray-200 bg-white shadow-sm">
          <Buyers />
        </section>

        {/* =================================================
            إضافة الأصناف
        ================================================= */}

        <AddItems onAddItem={handleAddItem} />

        {/* =================================================
            جدول أصناف الفاتورة
        ================================================= */}

        <InvoiceItemsTable
          items={invoiceItems}
          onDeleteItem={handleDeleteItem}
        />

        {/* =================================================
            ملخص الفاتورة
        ================================================= */}

        <InvoiceSummary items={invoiceItems} />

        {/* =================================================
            أزرار الفاتورة
        ================================================= */}

        <div className="mt-3 flex items-center justify-end gap-2">
          {/* ===============================================
              تفريغ الفاتورة
          =============================================== */}

          <button
            type="button"
            onClick={handleClearInvoice}
            className="rounded-md border border-gray-300 bg-white px-5 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            تفريغ الفاتورة
          </button>

          {/* ===============================================
              حفظ الفاتورة
          =============================================== */}

          <button
            type="button"
            onClick={handleSaveInvoice}
            className="rounded-md bg-blue-600 px-6 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 active:scale-[0.98]"
          >
            حفظ الفاتورة
          </button>
        </div>
      </div>
    </main>
  );
}
