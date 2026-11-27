"use client";

import { useEffect } from "react";

import type { Account, AccountFormData } from "../types";

import AccountForm from "./AccountForm";

interface Props {
  isOpen: boolean;
  accounts: Account[];
  initialData?: Account | null;
  onClose: () => void;
  onSubmit: (data: AccountFormData) => Promise<void>;
}

export default function AccountModal({
  isOpen,
  accounts,
  initialData,
  onClose,
  onSubmit,
}: Props) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-modal-title"
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-5">
          <div>
            <h2
              id="account-modal-title"
              className="text-lg font-bold text-slate-900"
            >
              {initialData ? "تعديل الحساب" : "إضافة حساب جديد"}
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              {initialData
                ? "تحديث بيانات الحساب وإعداداته"
                : "أدخل البيانات الأساسية لإنشاء حساب جديد"}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق النافذة"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-xl text-slate-500 transition hover:bg-red-50 hover:text-red-600"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto p-6">
          <AccountForm
            accounts={accounts}
            initialData={initialData}
            onSubmit={onSubmit}
            onCancel={onClose}
          />
        </div>
      </div>
    </div>
  );
}
