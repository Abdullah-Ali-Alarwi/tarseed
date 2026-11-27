"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  FiArrowRight,
  FiPlus,
  FiTrash2,
  FiSave,
  FiRefreshCw,
  FiAlertCircle,
} from "react-icons/fi";

import { supabase } from "@/lib/supabase";

// =====================================
// Types
// =====================================

interface CurrentUser {
  id: string;
  username: string;
  name?: string;
  type: string;
  role?: string;
  companyId: string;
  isActive: boolean;
  status: string;
}

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  nature?: string;
  isGroup: boolean;
  allowPosting: boolean;
  isActive: boolean;
  status: string;
  companyId: string;
}

interface OpeningEntryLine {
  accountId: string;
  debit: string;
  credit: string;
}

interface OpeningEntryPayload {
  id: string;
  companyId: string;
  extra: {
    accountId: string;
    date: string;
    debit: number;
    credit: number;
    description: string;
    reference: string;
    createdBy: string;
    createdByName: string;
    createdAt: string;
  };
  createdAt: string;
  updatedAt: string;
}

// =====================================
// Helpers
// =====================================

function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) {
    return null;
  }

  try {
    return decodeURIComponent(cookie.substring(name.length + 1));
  } catch {
    return cookie.substring(name.length + 1);
  }
}

function getTodayDate(): string {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const err = error as {
      message?: string;
      details?: string;
      hint?: string;
    };

    return err.message || err.details || err.hint || "حدث خطأ غير معروف";
  }

  return "حدث خطأ غير معروف";
}

function normalizeAccount(row: any): Account {
  const extra = row.extra && typeof row.extra === "object" ? row.extra : {};

  return {
    id: String(row.id),
    code: String(row.code ?? ""),
    name: String(row.name ?? ""),
    type: String(row.type ?? ""),
    nature: row.nature ?? "",
    isGroup: row.isGroup === true,

    // allowPosting موجود داخل extra في بنية قاعدة البيانات.
    allowPosting: extra.allowPosting === true || row.allowPosting === true,

    isActive: row.isActive === true,
    status: String(row.status ?? ""),
    companyId: String(row.companyId ?? ""),
  };
}

const emptyLine: OpeningEntryLine = {
  accountId: "",
  debit: "",
  credit: "",
};

// =====================================
// Get Current User From Cookie
// =====================================

async function getCurrentUserFromCookie(): Promise<CurrentUser> {
  // نبدأ بقراءة اسم المستخدم من Cookie.
  const username = getCookie("username");

  if (!username) {
    throw new Error(
      "لم يتم العثور على اسم المستخدم في ملفات تعريف الارتباط. يرجى تسجيل الدخول مجدداً.",
    );
  }

  // جلب المستخدم من Supabase باستخدام username.
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    console.error("Get Current User Error:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    throw new Error(error.message || "تعذر جلب بيانات المستخدم");
  }

  if (!data) {
    throw new Error("المستخدم غير موجود في قاعدة البيانات");
  }

  if (data.type === "platform") {
    throw new Error("لا يمكن لمستخدم المنصة إنشاء أرصدة افتتاحية للشركة");
  }

  if (data.isActive !== true || data.status !== "active") {
    throw new Error("حساب المستخدم غير نشط");
  }

  if (!data.companyId) {
    throw new Error("المستخدم غير مرتبط بأي شركة");
  }

  return {
    id: String(data.id),
    username: String(data.username),
    name: String(data.name ?? ""),
    type: String(data.type ?? ""),
    role: String(data.role ?? ""),
    companyId: String(data.companyId),
    isActive: data.isActive === true,
    status: String(data.status ?? ""),
  };
}

// =====================================
// Component
// =====================================

export default function CreateOpeningEntriesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [companyId, setCompanyId] = useState("");

  const [date, setDate] = useState(getTodayDate());

  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");

  const [lines, setLines] = useState<OpeningEntryLine[]>([
    { ...emptyLine },
    { ...emptyLine },
  ]);

  // =====================================
  // Load User and Accounts
  // =====================================

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);

        // المستخدم يؤخذ من Cookie أولاً.
        const user = await getCurrentUserFromCookie();

        if (!mounted) return;

        const currentCompanyId = user.companyId;

        setCompanyId(currentCompanyId);

        // جلب حسابات الشركة.
        const { data, error } = await supabase
          .from("accounts")
          .select("*")
          .eq("companyId", currentCompanyId)
          .order("code", { ascending: true });

        if (error) {
          console.error("Get Accounts Error:", {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
          });

          throw new Error(error.message || "تعذر تحميل الحسابات");
        }

        const normalizedAccounts = (data ?? []).map(normalizeAccount);

        // الحسابات النهائية القابلة للترحيل فقط.
        const finalAccounts = normalizedAccounts.filter(
          (account) =>
            account.companyId === currentCompanyId &&
            account.isActive === true &&
            account.status !== "inactive" &&
            account.isGroup === false &&
            account.allowPosting === true,
        );

        if (!mounted) return;

        setAccounts(finalAccounts);
      } catch (error) {
        console.error("Load Opening Entries Error:", error);

        if (mounted) {
          toast.error(getErrorMessage(error));
          setCompanyId("");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  // =====================================
  // Totals
  // =====================================

  const totalDebit = useMemo(
    () => lines.reduce((total, line) => total + (Number(line.debit) || 0), 0),
    [lines],
  );

  const totalCredit = useMemo(
    () => lines.reduce((total, line) => total + (Number(line.credit) || 0), 0),
    [lines],
  );

  const difference = totalDebit - totalCredit;

  const isBalanced =
    totalDebit > 0 && totalCredit > 0 && Math.abs(difference) < 0.000001;

  // =====================================
  // Lines Management
  // =====================================

  function updateLine(
    index: number,
    field: keyof OpeningEntryLine,
    value: string,
  ) {
    setLines((previous) =>
      previous.map((line, i) => {
        if (i !== index) return line;

        const updated = {
          ...line,
          [field]: value,
        };

        // لا نسمح بإدخال مدين ودائن في السطر نفسه.
        if (field === "debit" && Number(value) > 0) {
          updated.credit = "";
        }

        if (field === "credit" && Number(value) > 0) {
          updated.debit = "";
        }

        return updated;
      }),
    );
  }

  function addLine() {
    setLines((previous) => [...previous, { ...emptyLine }]);
  }

  function removeLine(index: number) {
    if (lines.length <= 2) {
      toast.error("يجب أن يحتوي المستند على سطرين على الأقل");

      return;
    }

    setLines((previous) => previous.filter((_, i) => i !== index));
  }

  // =====================================
  // Validation
  // =====================================

  function validateForm(): boolean {
    if (!companyId) {
      toast.error("لم يتم تحديد الشركة");
      return false;
    }

    if (!date) {
      toast.error("يرجى تحديد تاريخ الأرصدة الافتتاحية");

      return false;
    }

    if (lines.length < 2) {
      toast.error("يجب إدخال حسابين على الأقل");
      return false;
    }

    const selectedAccounts = lines.map((line) => line.accountId);

    if (selectedAccounts.some((id) => !id)) {
      toast.error("يرجى اختيار حساب لكل سطر");
      return false;
    }

    // منع تكرار الحساب.
    if (new Set(selectedAccounts).size !== selectedAccounts.length) {
      toast.error("لا يمكن اختيار الحساب نفسه أكثر من مرة");

      return false;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;

      if (!Number.isFinite(debit) || !Number.isFinite(credit)) {
        toast.error(`المبلغ في السطر ${i + 1} غير صحيح`);

        return false;
      }

      if (debit < 0 || credit < 0) {
        toast.error(`القيم في السطر ${i + 1} لا يمكن أن تكون سالبة`);

        return false;
      }

      if (debit === 0 && credit === 0) {
        toast.error(`يرجى إدخال مبلغ في السطر ${i + 1}`);

        return false;
      }

      if (debit > 0 && credit > 0) {
        toast.error(`لا يمكن إدخال مدين ودائن في السطر ${i + 1}`);

        return false;
      }

      const account = accounts.find((item) => item.id === line.accountId);

      if (!account) {
        toast.error(`الحساب المحدد في السطر ${i + 1} غير صالح`);

        return false;
      }

      if (account.companyId !== companyId) {
        toast.error("يوجد حساب لا يتبع الشركة الحالية");

        return false;
      }

      if (account.isGroup || !account.allowPosting || !account.isActive) {
        toast.error(`الحساب المحدد في السطر ${i + 1} غير قابل للترحيل`);

        return false;
      }
    }

    if (!isBalanced) {
      toast.error("الأرصدة الافتتاحية غير متوازنة");
      return false;
    }

    return true;
  }

  // =====================================
  // Save
  // =====================================

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    if (!validateForm()) return;

    setSaving(true);

    try {
      // إعادة التحقق من المستخدم من Cookie قبل الحفظ.
      // هذه الدالة لا تعيد null؛ إما مستخدم صحيح أو ترمي خطأ.
      const user = await getCurrentUserFromCookie();

      if (user.companyId !== companyId) {
        throw new Error("الشركة المرتبطة بالمستخدم لا تطابق الشركة الحالية");
      }

      const createdAt = new Date().toISOString();

      // التحقق مجدداً من أن الحسابات المختارة موجودة ضمن حسابات الشركة.
      const selectedAccountIds = lines.map((line) => line.accountId);

      const validAccountIds = new Set(
        accounts
          .filter(
            (account) =>
              account.companyId === user.companyId &&
              account.isActive &&
              !account.isGroup &&
              account.allowPosting,
          )
          .map((account) => account.id),
      );

      for (const accountId of selectedAccountIds) {
        if (!validAccountIds.has(accountId)) {
          throw new Error("أحد الحسابات المختارة غير صالح أو غير قابل للترحيل");
        }
      }

      // =====================================
      // Payload
      // =====================================
      // جدول openingEntries يحتوي على:
      // id, companyId, extra, createdAt, updatedAt
      //
      // لذلك جميع تفاصيل السطر توضع داخل extra.
      // لا ترسل accountId كعمود مستقل.

      const payload: OpeningEntryPayload[] = lines.map((line) => ({
        id: crypto.randomUUID(),

        companyId: user.companyId,

        extra: {
          accountId: line.accountId,

          date,

          debit: Number(line.debit) || 0,

          credit: Number(line.credit) || 0,

          description: description.trim(),

          reference: reference.trim(),

          createdBy: user.id,

          createdByName: user.name || user.username,

          createdAt,
        },

        createdAt,

        updatedAt: createdAt,
      }));

      console.log("Opening Entries Payload:", payload);

      // =====================================
      // Supabase Insert
      // =====================================

      const { data, error } = await supabase
        .from("openingEntries")
        .insert(payload)
        .select();

      if (error) {
        console.error("Supabase Insert Error:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });

        throw error;
      }

      console.log("Opening Entries Saved Successfully:", data);

      toast.success("تم حفظ الأرصدة الافتتاحية بنجاح");

      router.push("/erp/accounting/opening-entries");
      router.refresh();
    } catch (error) {
      console.error("Submit Error:", error);

      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  // =====================================
  // Loading
  // =====================================

  if (loading) {
    return (
      <div dir="rtl" className="flex min-h-[400px] items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <FiRefreshCw className="animate-spin" size={20} />

          <span>جاري تحميل البيانات...</span>
        </div>
      </div>
    );
  }

  // =====================================
  // User / Company Error
  // =====================================

  if (!companyId) {
    return (
      <div
        dir="rtl"
        className="m-6 rounded-xl border border-red-200 bg-red-50 p-6 text-red-700"
      >
        <div className="flex items-center gap-2">
          <FiAlertCircle size={22} />

          <h2 className="font-bold">تعذر فتح صفحة الأرصدة الافتتاحية</h2>
        </div>

        <p className="mt-2 text-sm">
          تحقق من تسجيل الدخول وربط المستخدم بالشركة.
        </p>

        <button
          type="button"
          onClick={() => router.back()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
        >
          رجوع
        </button>
      </div>
    );
  }

  // =====================================
  // UI
  // =====================================

  return (
    <div dir="rtl" className="space-y-6 p-4 md:p-6">
      {/* Header */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>المحاسبة</span>

            <span>/</span>

            <span>الأرصدة الافتتاحية</span>

            <span>/</span>

            <span className="text-blue-600">إضافة أرصدة</span>
          </div>

          <h1 className="mt-3 text-2xl font-bold text-gray-800">
            إضافة الأرصدة الافتتاحية
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            إدخال الأرصدة الافتتاحية لحسابات الشركة
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/erp/accounting/opening-entries")}
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
        >
          <FiArrowRight />
          العودة للقائمة
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-5 border-b border-gray-100 pb-3 text-lg font-bold text-gray-800">
            بيانات المستند
          </h2>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                تاريخ الأرصدة الافتتاحية
                <span className="text-red-500"> *</span>
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                رقم المرجع
              </label>

              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="مثال: OPEN-001"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                وصف المستند
              </label>

              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="الأرصدة الافتتاحية للشركة"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </section>

        {/* Opening Entry Lines */}

        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                تفاصيل الأرصدة
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                اختر الحساب وأدخل رصيده المدين أو الدائن
              </p>
            </div>

            <button
              type="button"
              onClick={addLine}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <FiPlus size={17} />
              إضافة حساب
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px] text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="w-12 px-4 py-4 text-center">#</th>

                  <th className="px-4 py-4 text-right">الحساب</th>

                  <th className="w-48 px-4 py-4 text-right">مدين</th>

                  <th className="w-48 px-4 py-4 text-right">دائن</th>

                  <th className="w-16 px-4 py-4 text-center">حذف</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {lines.map((line, index) => (
                  <tr key={index} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3 text-center text-gray-500">
                      {index + 1}
                    </td>

                    <td className="px-4 py-3">
                      <select
                        value={line.accountId}
                        onChange={(e) =>
                          updateLine(index, "accountId", e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                        required
                      >
                        <option value="">اختر الحساب</option>

                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {account.code} - {account.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.debit}
                        onChange={(e) =>
                          updateLine(index, "debit", e.target.value)
                        }
                        placeholder="0.00"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-left outline-none focus:border-blue-500"
                        dir="ltr"
                      />
                    </td>

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.credit}
                        onChange={(e) =>
                          updateLine(index, "credit", e.target.value)
                        }
                        placeholder="0.00"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-left outline-none focus:border-blue-500"
                        dir="ltr"
                      />
                    </td>

                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        title="حذف السطر"
                        className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                      >
                        <FiTrash2 size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot className="border-t-2 border-gray-200 bg-gray-50 font-bold">
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-left">
                    الإجمالي
                  </td>

                  <td className="px-4 py-4 text-left text-blue-700" dir="ltr">
                    {totalDebit.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </td>

                  <td className="px-4 py-4 text-left text-green-700" dir="ltr">
                    {totalCredit.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </td>

                  <td />
                </tr>
              </tfoot>
            </table>
          </div>

          {accounts.length === 0 && (
            <div className="border-t border-gray-100 p-6 text-center text-sm text-amber-700">
              لا توجد حسابات نهائية قابلة للترحيل. أضف الحسابات أولاً من دليل
              الحسابات.
            </div>
          )}
        </section>

        {/* Balance Summary */}

        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-800">ملخص الأرصدة</h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-gray-600">إجمالي المدين</p>

              <p className="mt-2 text-xl font-bold text-blue-700" dir="ltr">
                {totalDebit.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-gray-600">إجمالي الدائن</p>

              <p className="mt-2 text-xl font-bold text-green-700" dir="ltr">
                {totalCredit.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>

            <div
              className={`rounded-lg p-4 ${
                isBalanced ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <p className="text-sm text-gray-600">الفرق</p>

              <p
                className={`mt-2 text-xl font-bold ${
                  isBalanced ? "text-green-700" : "text-red-700"
                }`}
                dir="ltr"
              >
                {Math.abs(difference).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          <div
            className={`mt-4 flex items-center gap-2 rounded-lg p-3 text-sm ${
              isBalanced
                ? "bg-green-50 text-green-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            <FiAlertCircle />

            {isBalanced
              ? "الأرصدة متوازنة ويمكن حفظها."
              : "يجب أن يتساوى إجمالي المدين مع إجمالي الدائن قبل الحفظ."}
          </div>
        </section>

        {/* Actions */}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/erp/accounting/opening-entries")}
            disabled={saving}
            className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            إلغاء
          </button>

          <button
            type="submit"
            disabled={saving || accounts.length === 0}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <FiRefreshCw className="animate-spin" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <FiSave />
                حفظ الأرصدة الافتتاحية
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
