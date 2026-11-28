"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react";

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

// =====================================================
// TYPES
// =====================================================

interface CurrentUser {
  id: string | number;
  username: string;
  name?: string;
  type: string;
  companyId?: string | number;
  companyname?: string;
  isActive?: boolean;
  status?: string;
}

interface Account {
  id: string | number;
  code: string;
  name: string;
  type: string;
  isGroup: boolean;
  allowPosting: boolean;
  isActive: boolean;
  status?: string;
  companyId: string | number;
  extra?: Record<string, any>;
}

interface OpeningEntryLine {
  accountId: string;
  debit: string;
  credit: string;
}

// =====================================================
// HELPERS
// =====================================================

function getCurrentUsername(): string {
  if (typeof window === "undefined") return "";

  const cookie = document.cookie
    .split(";")
    .find((item) => item.trim().startsWith("username="));

  let cookieUsername = "";

  try {
    cookieUsername = cookie
      ? decodeURIComponent(cookie.split("=").slice(1).join("="))
      : "";
  } catch {
    cookieUsername = "";
  }

  let storedUser: Partial<CurrentUser> | null = null;

  try {
    storedUser = JSON.parse(localStorage.getItem("authUser") || "null");
  } catch {
    storedUser = null;
  }

  return cookieUsername || storedUser?.username || "";
}

function normalizeAccount(account: any): Account {
  const extra =
    account.extra && typeof account.extra === "object" ? account.extra : {};

  return {
    ...extra,
    ...account,

    allowPosting:
      extra.allowPosting ?? account.allowPosting ?? !account.isGroup,

    isGroup: account.isGroup === true,

    isActive: account.isActive !== false,

    extra,
  } as Account;
}

function isValidPostingAccount(account: Account): boolean {
  return (
    account.isActive === true &&
    account.status !== "inactive" &&
    account.isGroup === false &&
    account.allowPosting === true
  );
}

function sortAccounts(accounts: Account[]): Account[] {
  return [...accounts].sort((a, b) =>
    String(a.code).localeCompare(String(b.code), undefined, {
      numeric: true,
    }),
  );
}

const emptyLine: OpeningEntryLine = {
  accountId: "",
  debit: "",
  credit: "",
};

// =====================================================
// COMPONENT
// =====================================================

export default function CreateOpeningEntriesPage() {
  const router = useRouter();

  // ===================================================
  // STATES
  // ===================================================

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [accounts, setAccounts] = useState<Account[]>([]);

  const [companyId, setCompanyId] = useState("");

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");

  const [lines, setLines] = useState<OpeningEntryLine[]>([
    { ...emptyLine },
    { ...emptyLine },
  ]);

  // ===================================================
  // LOAD USER AND ACCOUNTS
  // ===================================================

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const username = getCurrentUsername();

      if (!username) {
        throw new Error("لم يتم العثور على بيانات تسجيل الدخول");
      }

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("username", username)
        .maybeSingle();

      if (userError) {
        console.error("Get current user error:", userError);
        throw new Error(userError.message);
      }

      if (!user) {
        throw new Error("المستخدم غير موجود");
      }

      if (user.type === "platform") {
        throw new Error("لا يمكن لمستخدم المنصة إنشاء أرصدة افتتاحية للشركة");
      }

      if (!user.companyId) {
        throw new Error("المستخدم غير مرتبط بأي شركة");
      }

      if (user.isActive === false || user.status === "inactive") {
        throw new Error("حساب المستخدم غير نشط");
      }

      const currentCompanyId = String(user.companyId);

      setCurrentUser(user);
      setCompanyId(currentCompanyId);

      const { data: accountsData, error: accountsError } = await supabase
        .from("accounts")
        .select("*")
        .eq("companyId", currentCompanyId)
        .order("code", { ascending: true });

      if (accountsError) {
        console.error("Get accounts error:", accountsError);
        throw new Error(accountsError.message);
      }

      const normalizedAccounts = (accountsData || []).map(normalizeAccount);

      const postingAccounts = sortAccounts(
        normalizedAccounts.filter(isValidPostingAccount),
      );

      setAccounts(postingAccounts);
    } catch (error) {
      console.error("Opening Entries Load Error:", error);

      toast.error(
        error instanceof Error ? error.message : "تعذر تحميل البيانات",
      );

      setCompanyId("");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ===================================================
  // TOTALS
  // ===================================================

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

  // ===================================================
  // LINES MANAGEMENT
  // ===================================================

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

  // ===================================================
  // VALIDATION
  // ===================================================

  function validateForm(): boolean {
    if (!currentUser || !companyId) {
      toast.error("لم يتم تحديد المستخدم أو الشركة");
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

    if (new Set(selectedAccounts).size !== selectedAccounts.length) {
      toast.error("لا يمكن اختيار الحساب نفسه أكثر من مرة");
      return false;
    }

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;

      if (
        !Number.isFinite(debit) ||
        !Number.isFinite(credit) ||
        debit < 0 ||
        credit < 0
      ) {
        toast.error(`القيم في السطر ${i + 1} غير صحيحة`);
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

      const account = accounts.find(
        (item) => String(item.id) === line.accountId,
      );

      if (!account) {
        toast.error(`الحساب المحدد في السطر ${i + 1} غير صالح`);
        return false;
      }

      if (String(account.companyId) !== companyId) {
        toast.error("يوجد حساب لا يتبع الشركة الحالية");
        return false;
      }

      if (!isValidPostingAccount(account)) {
        toast.error(`الحساب ${account.name} غير قابل للترحيل`);
        return false;
      }
    }

    if (!isBalanced) {
      toast.error("الأرصدة الافتتاحية غير متوازنة");
      return false;
    }

    return true;
  }

  // ===================================================
  // SAVE
  // ===================================================

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (saving) return;

    if (!validateForm()) return;

    setSaving(true);

    try {
      // إعادة التحقق من المستخدم قبل الحفظ
      const username = getCurrentUsername();

      if (!username) {
        throw new Error("تعذر تحديد المستخدم الحالي");
      }

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, username, type, companyId, isActive, status")
        .eq("username", username)
        .maybeSingle();

      if (userError) {
        throw new Error(userError.message);
      }

      if (!user) {
        throw new Error("المستخدم غير موجود");
      }

      if (user.type === "platform" || String(user.companyId) !== companyId) {
        throw new Error("لا تملك صلاحية إنشاء أرصدة لهذه الشركة");
      }

      if (user.isActive === false || user.status === "inactive") {
        throw new Error("حساب المستخدم غير نشط");
      }

      // وقت إنشاء المستند
      const createdAt = new Date().toISOString();

      /*
       * بنية جدول openingEntries:
       *
       * id
       * companyId
       * extra JSONB
       * createdAt
       * updatedAt
       *
       * تفاصيل الحساب والتاريخ والمبالغ تحفظ داخل extra.
       */

      const payload = lines.map((line) => ({
        id: crypto.randomUUID(),

        companyId,

        createdAt,

        updatedAt: createdAt,

        extra: {
          accountId: line.accountId,

          date,

          debit: Number(line.debit) || 0,

          credit: Number(line.credit) || 0,

          description: description.trim(),

          reference: reference.trim(),

          createdBy: String(user.id),

          createdAt,
        },
      }));

      // تنفيذ عملية الإدخال مرة واحدة فقط
      const { error: insertError } = await supabase
        .from("openingEntries")
        .insert(payload);

      if (insertError) {
        console.error("Opening Entries Insert Error:", insertError);

        throw new Error(insertError.message);
      }

      toast.success("تم حفظ الأرصدة الافتتاحية بنجاح");

      router.push("/erp/accounting/opening-entries");

      router.refresh();
    } catch (error: any) {
      console.error("Submit error:", error);

      console.error("Error details:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        name: error?.name,
        stack: error?.stack,
        json: JSON.stringify(error, Object.getOwnPropertyNames(error ?? {})),
      });

      toast.error(error?.message || "تعذر حفظ الأرصدة الافتتاحية");
    } finally {
      setSaving(false);
    }
  }

  // ===================================================
  // LOADING
  // ===================================================

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

  // ===================================================
  // NO COMPANY
  // ===================================================

  if (!companyId || !currentUser) {
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
          onClick={() => router.back()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
        >
          رجوع
        </button>
      </div>
    );
  }

  // ===================================================
  // UI
  // ===================================================

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
                          <option key={account.id} value={String(account.id)}>
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
