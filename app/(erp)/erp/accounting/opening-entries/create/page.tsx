"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import {
  FiArrowRight,
  FiPlus,
  FiTrash2,
  FiSave,
  FiRefreshCw,
} from "react-icons/fi";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// =========================
// Types
// =========================

interface CurrentUser {
  id: number | string;
  name: string;
  username: string;
  type: string;
  companyId?: string | number;
}

interface Account {
  id: number | string;
  code: string;
  name: string;
  type: string;
  nature?: "debit" | "credit";
  parentId?: number | string | null;
  isGroup: boolean;
  allowPosting: boolean;
  isActive?: boolean;
  companyId: string | number;
}

interface OpeningEntryLine {
  accountId: string;
  debit: string;
  credit: string;
}

interface OpeningEntryPayload {
  accountId: string;
  date: string;
  debit: number;
  credit: number;
  description: string;
  reference: string;
  companyId: string;
  createdBy: number | string;
  createdAt: string;
}

// =========================
// Helpers
// =========================

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.substring(name.length + 1));
}

function getTodayDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const createEmptyLine = (): OpeningEntryLine => ({
  accountId: "",
  debit: "",
  credit: "",
});

// =========================
// Page
// =========================

export default function CreateOpeningEntriesPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [companyId, setCompanyId] = useState("");

  const [accounts, setAccounts] = useState<Account[]>([]);

  const [date, setDate] = useState(getTodayDate());
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");

  const [lines, setLines] = useState<OpeningEntryLine[]>([createEmptyLine()]);

  // =========================
  // Load user and accounts
  // =========================

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const username = getCookie("username");

        if (!username) {
          toast.error("انتهت جلسة الدخول، يرجى تسجيل الدخول");
          router.replace("/login");
          return;
        }

        const usersResponse = await axios.get<CurrentUser[]>(
          `${API_URL}/users`,
          {
            params: { username },
          },
        );

        const currentUser = usersResponse.data.find(
          (item) => item.username === username,
        );

        if (!currentUser) {
          toast.error("تعذر العثور على بيانات المستخدم");
          return;
        }

        if (currentUser.type === "platform") {
          toast.error("مستخدم المنصة لا يستطيع الوصول إلى نظام المحاسبة");
          router.replace("/wazan/dashboard");
          return;
        }

        if (!currentUser.companyId) {
          toast.error("المستخدم غير مرتبط بشركة");
          return;
        }

        const currentCompanyId = String(currentUser.companyId);

        setUser(currentUser);
        setCompanyId(currentCompanyId);

        const accountsResponse = await axios.get<Account[]>(
          `${API_URL}/accounts`,
          {
            params: {
              companyId: currentCompanyId,
            },
          },
        );

        // الحسابات النهائية النشطة والقابلة للترحيل
        // الحساب الذي لا يحتوي isActive يعتبر نشطاً
        const eligibleAccounts = accountsResponse.data
          .filter((account) => {
            const belongsToCompany =
              String(account.companyId) === currentCompanyId;

            const isActive = account.isActive !== false;

            const isFinalAccount = account.isGroup === false;

            const allowsPosting = account.allowPosting === true;

            return (
              belongsToCompany && isActive && isFinalAccount && allowsPosting
            );
          })
          .sort((a, b) =>
            a.code.localeCompare(b.code, undefined, {
              numeric: true,
            }),
          );

        setAccounts(eligibleAccounts);
      } catch (error) {
        console.error("Load error:", error);
        toast.error("حدث خطأ أثناء تحميل بيانات الصفحة");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [router]);

  // =========================
  // Calculations
  // =========================

  const totalDebit = useMemo(() => {
    return lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  }, [lines]);

  const totalCredit = useMemo(() => {
    return lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  }, [lines]);

  const difference = totalDebit - totalCredit;

  const isBalanced =
    totalDebit > 0 && totalCredit > 0 && Math.abs(difference) < 0.000001;

  // =========================
  // Lines handlers
  // =========================

  function addLine() {
    setLines((previous) => [...previous, createEmptyLine()]);
  }

  function removeLine(index: number) {
    if (lines.length === 1) {
      toast.error("يجب أن يحتوي القيد على سطر واحد على الأقل");
      return;
    }

    setLines((previous) => previous.filter((_, i) => i !== index));
  }

  function updateLine(
    index: number,
    field: keyof OpeningEntryLine,
    value: string,
  ) {
    setLines((previous) =>
      previous.map((line, i) =>
        i === index
          ? {
              ...line,
              [field]: value,
              ...(field === "debit" && value ? { credit: "" } : {}),
              ...(field === "credit" && value ? { debit: "" } : {}),
            }
          : line,
      ),
    );
  }

  // =========================
  // Validation
  // =========================

  function validateForm(): boolean {
    if (!user || !companyId) {
      toast.error("بيانات المستخدم أو الشركة غير مكتملة");
      return false;
    }

    if (!date) {
      toast.error("يرجى تحديد تاريخ الرصيد الافتتاحي");
      return false;
    }

    if (accounts.length === 0) {
      toast.error("لا توجد حسابات قابلة للترحيل لهذه الشركة");
      return false;
    }

    if (lines.length === 0) {
      toast.error("أضف حساباً واحداً على الأقل");
      return false;
    }

    const selectedAccountIds = lines.map((line) => line.accountId);

    if (selectedAccountIds.some((id) => !id)) {
      toast.error("يرجى اختيار حساب لكل سطر");
      return false;
    }

    if (new Set(selectedAccountIds).size !== selectedAccountIds.length) {
      toast.error("لا يمكن تكرار الحساب في نفس الرصيد الافتتاحي");
      return false;
    }

    for (const line of lines) {
      const debit = Number(line.debit) || 0;
      const credit = Number(line.credit) || 0;

      if (debit < 0 || credit < 0) {
        toast.error("لا يمكن إدخال مبالغ سالبة");
        return false;
      }

      if (debit > 0 && credit > 0) {
        toast.error("لا يمكن إدخال مدين ودائن في نفس السطر");
        return false;
      }

      if (debit === 0 && credit === 0) {
        toast.error("يرجى إدخال مبلغ مدين أو دائن لكل حساب");
        return false;
      }

      const selectedAccount = accounts.find(
        (account) => String(account.id) === line.accountId,
      );

      if (!selectedAccount) {
        toast.error("يوجد حساب غير صالح أو لا يتبع الشركة الحالية");
        return false;
      }

      if (
        String(selectedAccount.companyId) !== companyId ||
        selectedAccount.isGroup !== false ||
        selectedAccount.allowPosting !== true ||
        selectedAccount.isActive === false
      ) {
        toast.error("أحد الحسابات غير مؤهل لإجراء القيد");
        return false;
      }
    }

    if (!isBalanced) {
      toast.error("القيد غير متوازن، يجب أن يتساوى المدين والدائن");
      return false;
    }

    return true;
  }

  // =========================
  // Save
  // =========================

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (saving) return;

    if (!validateForm()) return;

    if (!user) return;

    try {
      setSaving(true);

      const createdAt = new Date().toISOString();

      const payload: OpeningEntryPayload[] = lines.map((line) => ({
        accountId: line.accountId,
        date,
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
        description: description.trim(),
        reference: reference.trim(),
        companyId,
        createdBy: user.id,
        createdAt,
      }));

      // حفظ السطور في JSON Server
      const savedEntries: Array<{ id: number | string }> = [];

      try {
        for (const entry of payload) {
          const response = await axios.post(`${API_URL}/openingEntries`, entry);

          savedEntries.push(response.data);
        }
      } catch (saveError) {
        console.error("Save error:", saveError);

        // محاولة حذف السطور التي تم حفظها إذا فشل أحد الطلبات
        for (const savedEntry of savedEntries) {
          try {
            await axios.delete(`${API_URL}/openingEntries/${savedEntry.id}`);
          } catch (rollbackError) {
            console.error("Rollback error:", rollbackError);
          }
        }

        throw saveError;
      }

      toast.success("تم حفظ الأرصدة الافتتاحية بنجاح");

      router.push("/erp/accounting/opening-entries");
      router.refresh();
    } catch (error) {
      console.error("Submit error:", error);
      toast.error("تعذر حفظ الأرصدة الافتتاحية");
    } finally {
      setSaving(false);
    }
  }

  // =========================
  // Loading
  // =========================

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center" dir="rtl">
        <div className="flex items-center gap-3 text-gray-600">
          <FiRefreshCw className="animate-spin text-xl" />
          <span>جاري تحميل البيانات...</span>
        </div>
      </div>
    );
  }

  // =========================
  // UI
  // =========================

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      {/* Header */}

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            إضافة الأرصدة الافتتاحية
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            إدخال أرصدة الحسابات عند بداية العمل بالنظام المحاسبي.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push("/erp/accounting/opening-entries")}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-50"
        >
          <FiArrowRight />
          العودة
        </button>
      </div>

      {/* Company information */}

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">المستخدم الحالي</p>
            <p className="mt-1 font-semibold text-gray-800">{user?.name}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500">معرف الشركة</p>
            <p className="mt-1 break-all font-mono text-sm text-gray-700">
              {companyId}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic information */}

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-5 text-lg font-bold text-gray-800">
            البيانات الأساسية
          </h2>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                تاريخ الرصيد الافتتاحي
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
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
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                البيان
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="وصف الرصيد الافتتاحي..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Accounts lines */}

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                تفاصيل الأرصدة
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                اختر الحسابات النهائية التي تسمح بالترحيل.
              </p>
            </div>

            <button
              type="button"
              onClick={addLine}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition hover:bg-blue-700"
            >
              <FiPlus />
              إضافة حساب
            </button>
          </div>

          {accounts.length === 0 ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800">
              لا توجد حسابات نهائية قابلة للترحيل لهذه الشركة. تأكد من وجود
              حسابات تسمح بالترحيل وليست حسابات تجميعية.
            </div>
          ) : (
            <div className="space-y-4">
              {lines.map((line, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="font-semibold text-gray-700">
                      الحساب رقم {index + 1}
                    </span>

                    <button
                      type="button"
                      onClick={() => removeLine(index)}
                      className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-50"
                    >
                      <FiTrash2 />
                      حذف
                    </button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Account */}

                    <div className="md:col-span-3">
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        الحساب
                      </label>

                      <select
                        value={line.accountId}
                        onChange={(e) =>
                          updateLine(index, "accountId", e.target.value)
                        }
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500"
                        required
                      >
                        <option value="">اختر الحساب</option>

                        {accounts.map((account) => (
                          <option
                            key={account.id}
                            value={String(account.id)}
                            disabled={lines.some(
                              (otherLine, otherIndex) =>
                                otherIndex !== index &&
                                otherLine.accountId === String(account.id),
                            )}
                          >
                            {account.code} - {account.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Debit */}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        مدين
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.debit}
                        onChange={(e) =>
                          updateLine(index, "debit", e.target.value)
                        }
                        placeholder="0.00"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Credit */}

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700">
                        دائن
                      </label>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.credit}
                        onChange={(e) =>
                          updateLine(index, "credit", e.target.value)
                        }
                        placeholder="0.00"
                        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals */}

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-4 text-lg font-bold text-gray-800">ملخص الأرصدة</h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-sm text-blue-700">إجمالي المدين</p>

              <p className="mt-2 text-xl font-bold text-blue-800">
                {totalDebit.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-4">
              <p className="text-sm text-green-700">إجمالي الدائن</p>

              <p className="mt-2 text-xl font-bold text-green-800">
                {totalCredit.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>

            <div
              className={`rounded-lg p-4 ${
                isBalanced ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <p
                className={`text-sm ${
                  isBalanced ? "text-green-700" : "text-red-700"
                }`}
              >
                الفرق
              </p>

              <p
                className={`mt-2 text-xl font-bold ${
                  isBalanced ? "text-green-800" : "text-red-800"
                }`}
              >
                {Math.abs(difference).toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          <div className="mt-4">
            {isBalanced ? (
              <p className="text-sm font-medium text-green-700">
                ✓ القيد متوازن ويمكن حفظه.
              </p>
            ) : (
              <p className="text-sm font-medium text-red-600">
                القيد غير متوازن. يجب أن يتساوى إجمالي المدين والدائن.
              </p>
            )}
          </div>
        </div>

        {/* Actions */}

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => router.push("/erp/accounting/opening-entries")}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
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
