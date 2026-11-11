"use client";

import { useEffect } from "react";
import Link from "next/link";

import {
  FiAlertTriangle,
  FiRefreshCw,
  FiHome,
  FiArrowRight,
} from "react-icons/fi";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div
      dir="rtl"
      className="flex min-h-screen items-center justify-center bg-slate-50 p-5"
    >
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        {/* أيقونة الخطأ */}
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-50">
          <FiAlertTriangle size={45} className="text-red-500" />
        </div>

        {/* العنوان */}
        <h1 className="text-2xl font-bold text-slate-900">
          حدث خطأ غير متوقع!
        </h1>

        <p className="mt-4 text-sm leading-8 text-slate-500">
          عذراً، حدث خطأ أثناء معالجة طلبك.
          <br />
          قد تكون المشكلة مؤقتة، يرجى المحاولة مرة أخرى.
          <br />
          إذا استمرت المشكلة، يرجى التواصل مع مسؤول النظام.
        </p>

        {/* رقم الخطأ */}
        {error.digest && (
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <span className="text-xs text-slate-500">رقم مرجع الخطأ</span>

            <p className="mt-1 font-mono text-sm text-slate-700">
              {error.digest}
            </p>
          </div>
        )}

        {/* الأزرار */}
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <FiRefreshCw size={17} />
            إعادة المحاولة
          </button>

          <Link
            href="/erp/dashboard"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <FiHome size={17} />
            العودة للرئيسية
          </Link>
        </div>

        {/* اسم النظام */}
        <div className="mt-10 border-t border-slate-100 pt-5">
          <p className="text-xs font-medium tracking-wide text-slate-400">
            ALJABREE ERP SYSTEM
          </p>
        </div>
      </div>
    </div>
  );
}
