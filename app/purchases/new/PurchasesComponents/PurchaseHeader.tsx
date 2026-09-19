"use client";

import Link from "next/link";
import { FiArrowRight, FiPrinter, FiSave, FiCheckCircle } from "react-icons/fi";

interface PurchaseHeaderProps {
  invoiceNumber: string;
  date: string;
  isSaved: boolean;
  showSuccess: boolean;
  savedInvoiceNumber: string;
  onDateChange: (value: string) => void;
  onSave: () => void;
  onPrint: () => void;
}

export default function PurchaseHeader({
  invoiceNumber,
  date,
  isSaved,
  showSuccess,
  savedInvoiceNumber,
  onDateChange,
  onSave,
  onPrint,
}: PurchaseHeaderProps) {
  return (
    <div className="max-w-7xl mx-auto mb-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1 text-xs">
            <Link
              href="/purchases"
              className="text-gray-400 hover:text-blue-600"
            >
              المشتريات
            </Link>

            <FiArrowRight size={13} className="text-gray-400" />

            <span className="text-gray-600">فاتورة مشتريات جديدة</span>
          </div>

          <h1 className="text-xl font-bold text-gray-800">
            فاتورة مشتريات جديدة
          </h1>

          <p className="text-xs text-gray-500 mt-1">
            إدخال وحفظ فاتورة مشتريات جديدة
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onPrint}
            disabled={!isSaved}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium ${
              isSaved
                ? "bg-white border border-blue-200 text-blue-600 hover:bg-blue-50"
                : "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <FiPrinter size={16} />
            طباعة الفاتورة
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaved}
            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium ${
              isSaved
                ? "bg-green-100 text-green-700 cursor-default"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isSaved ? <FiCheckCircle size={16} /> : <FiSave size={16} />}

            {isSaved ? "تم الحفظ" : "حفظ الفاتورة"}
          </button>
        </div>
      </div>

      {showSuccess && (
        <div className="mt-3 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
          <FiCheckCircle size={17} />

          <div>
            <span>تم حفظ الفاتورة بنجاح.</span>

            <p className="text-[11px] mt-0.5">
              رقم الفاتورة: {savedInvoiceNumber}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
