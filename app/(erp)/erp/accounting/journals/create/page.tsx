"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

import {
  FiArrowRight,
  FiPlus,
  FiTrash2,
  FiSave,
  FiCheckCircle,
  FiCalendar,
  FiFileText,
  FiBookOpen,
  FiAlertCircle,
  FiRefreshCw,
} from "react-icons/fi";

import { toast } from "sonner";

import { logCreate } from "@/app/(erp)/erp/lib/activity";

// ============================================
// API
// ============================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================================
// Types
// ============================================

type JournalStatus = "draft" | "posted";

interface CurrentUser {
  id: number | string;
  name: string;
  username: string;
  type: string;
  role: string;
  companyId?: string;
  companyname?: string;
}

interface Account {
  id: number | string;
  companyId: string;

  code?: string;
  accountCode?: string;

  name?: string;
  accountName?: string;

  type?: string;
  nature?: string;

  allowPosting?: boolean;
  isActive?: boolean;
  isGroup?: boolean;
}

interface Journal {
  id: number | string;
  journalNumber: string;
  companyId: string;
  status: JournalStatus | "cancelled";
}

interface JournalLineForm {
  tempId: string;
  accountId: string;
  debit: string;
  credit: string;
  description: string;
}

// ============================================
// Helpers
// ============================================

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.substring(name.length + 1));
}

function getLocalDate() {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);
}

function getAccountCode(account: Account) {
  return account.code || account.accountCode || "";
}

function getAccountName(account: Account) {
  return account.name || account.accountName || "";
}

function createEmptyLine(): JournalLineForm {
  return {
    tempId: `${Date.now()}-${Math.random()}`,
    accountId: "",
    debit: "",
    credit: "",
    description: "",
  };
}

// ============================================
// Page
// ============================================

export default function CreateJournalPage() {
  const router = useRouter();

  // User
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [companyId, setCompanyId] = useState("");

  const [userLoading, setUserLoading] = useState(true);

  const [userError, setUserError] = useState("");

  // Accounts
  const [accounts, setAccounts] = useState<Account[]>([]);

  const [accountsLoading, setAccountsLoading] = useState(false);

  // Existing journals
  const [journals, setJournals] = useState<Journal[]>([]);

  // Form
  const [journalDate, setJournalDate] = useState(getLocalDate());

  const [description, setDescription] = useState("");

  const [reference, setReference] = useState("");

  const [lines, setLines] = useState<JournalLineForm[]>([
    createEmptyLine(),
    createEmptyLine(),
  ]);

  // Save
  const [saving, setSaving] = useState(false);

  // ============================================
  // Load current user
  // ============================================

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      try {
        setUserLoading(true);
        setUserError("");

        const username = getCookie("username");

        if (!username) {
          throw new Error("لم يتم العثور على بيانات تسجيل الدخول");
        }

        const response = await api.get<CurrentUser[]>("/users", {
          params: { username },
        });

        const user = response.data.find((item) => item.username === username);

        if (!user) {
          throw new Error("المستخدم غير موجود");
        }

        if (user.type === "platform") {
          throw new Error("مستخدم المنصة لا يستطيع إنشاء قيود الشركة");
        }

        if (!user.companyId) {
          throw new Error("المستخدم غير مرتبط بأي شركة");
        }

        if (!mounted) return;

        setCurrentUser(user);
        setCompanyId(String(user.companyId));
      } catch (error) {
        const message = axios.isAxiosError(error)
          ? error.response?.data?.message || "تعذر الاتصال بالخادم"
          : error instanceof Error
            ? error.message
            : "حدث خطأ غير متوقع";

        if (mounted) {
          setUserError(message);
        }
      } finally {
        if (mounted) {
          setUserLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  // ============================================
  // Load company accounts and journals
  // ============================================

  useEffect(() => {
    if (!companyId) return;

    let mounted = true;

    async function loadData() {
      try {
        setAccountsLoading(true);

        const [accountsResponse, journalsResponse] = await Promise.all([
          api.get<Account[]>("/accounts", {
            params: { companyId },
          }),

          api.get<Journal[]>("/journals", {
            params: { companyId },
          }),
        ]);

        if (!mounted) return;

        const companyAccounts = accountsResponse.data.filter(
          (account) =>
            String(account.companyId) === companyId &&
            account.allowPosting === true &&
            account.isActive === true &&
            account.isGroup !== true,
        );

        const companyJournals = journalsResponse.data.filter(
          (journal) => String(journal.companyId) === companyId,
        );

        setAccounts(companyAccounts);
        setJournals(companyJournals);
      } catch (error) {
        console.error("Load Journal Data:", error);

        toast.error("تعذر تحميل الحسابات المحاسبية");
      } finally {
        if (mounted) {
          setAccountsLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      mounted = false;
    };
  }, [companyId]);

  // ============================================
  // Totals
  // ============================================

  const totalDebit = useMemo(() => {
    return lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  }, [lines]);

  const totalCredit = useMemo(() => {
    return lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  }, [lines]);

  const difference = totalDebit - totalCredit;

  const isBalanced = Math.abs(difference) < 0.01;

  // ============================================
  // Journal number
  // ============================================

  const journalNumber = useMemo(() => {
    const currentYear = new Date(journalDate).getFullYear();

    const prefix = `JV-${currentYear}-`;

    const numbers = journals
      .filter((journal) => journal.journalNumber?.startsWith(prefix))
      .map((journal) => {
        const number = Number(journal.journalNumber.substring(prefix.length));

        return Number.isFinite(number) ? number : 0;
      });

    const nextNumber = Math.max(0, ...numbers) + 1;

    return `${prefix}${String(nextNumber).padStart(4, "0")}`;
  }, [journals, journalDate]);

  // ============================================
  // Line handlers
  // ============================================

  function handleAddLine() {
    setLines((prev) => [...prev, createEmptyLine()]);
  }

  function handleRemoveLine(tempId: string) {
    if (lines.length <= 2) {
      toast.error("يجب أن يحتوي القيد على سطرين على الأقل");
      return;
    }

    setLines((prev) => prev.filter((line) => line.tempId !== tempId));
  }

  function handleLineChange(
    tempId: string,
    field: keyof JournalLineForm,
    value: string,
  ) {
    setLines((prev) =>
      prev.map((line) => {
        if (line.tempId !== tempId) return line;

        if (field === "debit" || field === "credit") {
          if (value !== "" && Number(value) < 0) {
            return line;
          }

          return {
            ...line,
            [field]: value,

            // لا نسمح بإدخال مدين ودائن في السطر نفسه
            [field === "debit" ? "credit" : "debit"]:
              value !== "" && Number(value) > 0
                ? ""
                : line[field === "debit" ? "credit" : "debit"],
          };
        }

        return {
          ...line,
          [field]: value,
        };
      }),
    );
  }

  // ============================================
  // Validate
  // ============================================

  function validateForm(status: JournalStatus) {
    if (!journalDate) {
      toast.error("يرجى تحديد تاريخ القيد");
      return false;
    }

    if (!description.trim()) {
      toast.error("يرجى إدخال بيان القيد");
      return false;
    }

    if (lines.length < 2) {
      toast.error("يجب إضافة سطرين على الأقل");
      return false;
    }

    const validLines = lines.filter(
      (line) =>
        line.accountId &&
        (Number(line.debit || 0) > 0 || Number(line.credit || 0) > 0),
    );

    if (validLines.length < 2) {
      toast.error("يجب تحديد حسابين على الأقل مع إدخال المبالغ");
      return false;
    }

    for (const line of lines) {
      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);

      if (debit < 0 || credit < 0) {
        toast.error("لا يمكن إدخال مبالغ سالبة");
        return false;
      }

      if (debit > 0 && credit > 0) {
        toast.error("لا يمكن أن يكون السطر مدينًا ودائنًا في الوقت نفسه");
        return false;
      }

      if ((debit > 0 || credit > 0) && !line.accountId) {
        toast.error("يرجى اختيار الحساب لكل سطر يحتوي على مبلغ");
        return false;
      }

      if (
        line.accountId &&
        !accounts.some(
          (account) => String(account.id) === String(line.accountId),
        )
      ) {
        toast.error("يوجد حساب غير صالح أو لا يتبع الشركة الحالية");
        return false;
      }
    }

    if (totalDebit <= 0 || totalCredit <= 0) {
      toast.error("يجب إدخال مبالغ مدينة ودائنة");
      return false;
    }

    if (status === "posted" && !isBalanced) {
      toast.error(
        `القيد غير متوازن. الفرق: ${formatCurrency(Math.abs(difference))}`,
      );
      return false;
    }

    return true;
  }

  // ============================================
  // Save Journal
  // ============================================

  async function handleSave(status: JournalStatus) {
    if (saving) return;

    if (!currentUser || !companyId) {
      toast.error("بيانات المستخدم أو الشركة غير مكتملة");
      return;
    }

    if (!validateForm(status)) return;

    const confirmed =
      status === "posted"
        ? window.confirm(
            "هل تريد حفظ القيد وترحيله؟ بعد الترحيل سيؤثر في القوائم المالية.",
          )
        : true;

    if (!confirmed) return;

    try {
      setSaving(true);

      const now = new Date().toISOString();

      const validLines = lines.filter(
        (line) =>
          line.accountId &&
          (Number(line.debit || 0) > 0 || Number(line.credit || 0) > 0),
      );

      // ========================================
      // Create Journal
      // ========================================

      const journalData = {
        journalNumber,

        date: journalDate,

        description: description.trim(),

        reference: reference.trim(),

        status,

        totalDebit,

        totalCredit,

        companyId,

        // بيانات المنشئ
        createdBy: String(currentUser.id),

        createdById: String(currentUser.id),

        createdByName: currentUser.name || currentUser.username,

        createdAt: now,

        // بيانات الترحيل
        ...(status === "posted"
          ? {
              postedBy: String(currentUser.id),
              postedById: String(currentUser.id),
              postedByName: currentUser.name || currentUser.username,
              postedAt: now,
            }
          : {}),
      };

      const journalResponse = await api.post("/journals", journalData);

      const createdJournal = journalResponse.data;

      // ========================================
      // Create Journal Lines
      // ========================================

      const createdLineIds: string[] = [];

      try {
        for (const line of validLines) {
          const account = accounts.find(
            (item) => String(item.id) === String(line.accountId),
          );

          if (!account) {
            throw new Error("الحساب المحدد غير موجود");
          }

          const lineData = {
            journalId: createdJournal.id,

            accountId: line.accountId,

            debit: Number(line.debit || 0),

            credit: Number(line.credit || 0),

            description: line.description.trim() || description.trim(),

            companyId,

            createdBy: String(currentUser.id),

            createdById: String(currentUser.id),

            createdByName: currentUser.name || currentUser.username,

            createdAt: now,
          };

          const lineResponse = await api.post("/journalLines", lineData);

          createdLineIds.push(String(lineResponse.data.id));
        }
      } catch (lineError) {
        // محاولة التراجع عند فشل حفظ أحد السطور
        for (const lineId of createdLineIds) {
          try {
            await api.delete(`/journalLines/${lineId}`);
          } catch (rollbackError) {
            console.error("Rollback Line Error:", rollbackError);
          }
        }

        try {
          await api.delete(`/journals/${createdJournal.id}`);
        } catch (rollbackError) {
          console.error("Rollback Journal Error:", rollbackError);
        }

        throw lineError;
      }

      // ========================================
      // Activity Log
      // ========================================

      await logCreate(
        "accounting.journals",
        status === "posted"
          ? `إنشاء وترحيل القيد رقم ${journalNumber}`
          : `إنشاء مسودة القيد رقم ${journalNumber}`,
        createdJournal.id,
        journalNumber,
        {
          ...journalData,
          lines: validLines.map((line) => ({
            accountId: line.accountId,
            debit: Number(line.debit || 0),
            credit: Number(line.credit || 0),
          })),
        },
      );

      toast.success(
        status === "posted"
          ? "تم إنشاء القيد وترحيله بنجاح"
          : "تم حفظ القيد كمسودة بنجاح",
      );

      router.push("/erp/accounting/journals");
      router.refresh();
    } catch (error) {
      console.error("Save Journal Error:", error);

      toast.error(
        axios.isAxiosError(error)
          ? error.response?.data?.message || "تعذر حفظ القيد اليومي"
          : error instanceof Error
            ? error.message
            : "حدث خطأ أثناء حفظ القيد",
      );
    } finally {
      setSaving(false);
    }
  }

  // ============================================
  // Loading
  // ============================================

  if (userLoading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="text-sm text-slate-500">
            جارٍ تحميل بيانات المستخدم...
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // User Error
  // ============================================

  if (userError || !companyId) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50 p-5"
      >
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h2 className="font-bold text-red-600">تعذر فتح صفحة إنشاء القيد</h2>

          <p className="mt-3 text-sm text-slate-600">
            {userError || "لم يتم تحديد الشركة الحالية"}
          </p>

          <button
            onClick={() => router.push("/erp/dashboard")}
            className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white"
          >
            العودة إلى الرئيسية
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // UI
  // ============================================

  return (
    <div
      dir="rtl"
      className="min-h-screen space-y-6 bg-slate-50 p-5 pb-10 text-slate-800"
    >
      {/* Header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push("/erp/accounting/journals")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              title="العودة إلى القيود اليومية"
            >
              <FiArrowRight size={18} />
            </button>

            <h1 className="text-2xl font-bold text-slate-900">
              إنشاء قيد يومي
            </h1>
          </div>

          <p className="mt-3 text-sm text-slate-500">
            تسجيل عملية مالية جديدة في الحسابات المحاسبية
          </p>

          <p className="mt-2 text-sm text-blue-700">
            الشركة:{" "}
            <span className="font-semibold">
              {currentUser?.companyname || "الشركة الحالية"}
            </span>
          </p>
        </div>
      </div>

      {/* Journal Information */}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
          <FiFileText className="text-blue-600" size={20} />

          <h2 className="font-bold text-slate-800">بيانات القيد</h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
          {/* Journal Number */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              رقم القيد
            </label>

            <input
              value={journalNumber}
              readOnly
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-blue-700 outline-none"
            />
          </div>

          {/* Date */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              تاريخ القيد
            </label>

            <div className="relative">
              <FiCalendar
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={17}
              />

              <input
                type="date"
                value={journalDate}
                onChange={(e) => setJournalDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-3 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Reference */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              المرجع
            </label>

            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="رقم الفاتورة أو المرجع"
              className="w-full rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Created By */}

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              منشئ القيد
            </label>

            <input
              value={currentUser?.name || currentUser?.username || ""}
              readOnly
              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 outline-none"
            />
          </div>

          {/* Description */}

          <div className="md:col-span-2 xl:col-span-4">
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              بيان القيد *
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="اكتب وصفًا واضحًا للعملية المالية..."
              className="w-full resize-none rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      {/* Journal Lines */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <FiBookOpen className="text-blue-600" size={20} />

              <h2 className="font-bold text-slate-800">
                تفاصيل القيد المحاسبي
              </h2>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              اختر الحسابات وأدخل المبالغ المدينة والدائنة
            </p>
          </div>

          <button
            type="button"
            onClick={handleAddLine}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <FiPlus size={17} />
            إضافة سطر
          </button>
        </div>

        {accountsLoading ? (
          <div className="py-14 text-center text-slate-500">
            جارٍ تحميل الحسابات...
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center">
            <FiAlertCircle size={35} className="mx-auto mb-3 text-amber-500" />

            <h3 className="font-semibold text-slate-700">
              لا توجد حسابات قابلة للترحيل
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              تأكد من وجود حسابات نشطة ومسموح لها بالترحيل في دليل الحسابات.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-right text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="w-16 px-4 py-4 text-center">#</th>

                  <th className="px-4 py-4">الحساب المحاسبي</th>

                  <th className="px-4 py-4">البيان</th>

                  <th className="w-48 px-4 py-4">مدين</th>

                  <th className="w-48 px-4 py-4">دائن</th>

                  <th className="w-20 px-4 py-4 text-center">حذف</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {lines.map((line, index) => (
                  <tr
                    key={line.tempId}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-4 text-center font-semibold text-slate-500">
                      {index + 1}
                    </td>

                    {/* Account */}

                    <td className="px-4 py-3">
                      <select
                        value={line.accountId}
                        onChange={(e) =>
                          handleLineChange(
                            line.tempId,
                            "accountId",
                            e.target.value,
                          )
                        }
                        className="w-full min-w-[250px] rounded-lg border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-blue-500"
                      >
                        <option value="">اختر الحساب</option>

                        {accounts.map((account) => (
                          <option key={account.id} value={String(account.id)}>
                            {getAccountCode(account)} -{" "}
                            {getAccountName(account)}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Line Description */}

                    <td className="px-4 py-3">
                      <input
                        value={line.description}
                        onChange={(e) =>
                          handleLineChange(
                            line.tempId,
                            "description",
                            e.target.value,
                          )
                        }
                        placeholder="بيان السطر"
                        className="w-full min-w-[160px] rounded-lg border border-slate-300 px-3 py-3 text-sm outline-none focus:border-blue-500"
                      />
                    </td>

                    {/* Debit */}

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.debit}
                        onChange={(e) =>
                          handleLineChange(line.tempId, "debit", e.target.value)
                        }
                        placeholder="0.00"
                        className="w-full rounded-lg border border-slate-300 px-3 py-3 text-left text-sm outline-none focus:border-blue-500"
                      />
                    </td>

                    {/* Credit */}

                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.credit}
                        onChange={(e) =>
                          handleLineChange(
                            line.tempId,
                            "credit",
                            e.target.value,
                          )
                        }
                        placeholder="0.00"
                        className="w-full rounded-lg border border-slate-300 px-3 py-3 text-left text-sm outline-none focus:border-blue-500"
                      />
                    </td>

                    {/* Delete */}

                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveLine(line.tempId)}
                        title="حذف السطر"
                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot className="border-t border-slate-200 bg-slate-50">
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-4 text-left font-bold text-slate-700"
                  >
                    الإجمالي
                  </td>

                  <td className="px-4 py-4 font-bold text-blue-700">
                    {formatCurrency(totalDebit)}
                  </td>

                  <td className="px-4 py-4 font-bold text-green-700">
                    {formatCurrency(totalCredit)}
                  </td>

                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Balance Status */}

      <div
        className={`rounded-xl border p-5 shadow-sm ${
          isBalanced
            ? "border-green-200 bg-green-50"
            : "border-amber-200 bg-amber-50"
        }`}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            {isBalanced ? (
              <FiCheckCircle size={25} className="text-green-600" />
            ) : (
              <FiAlertCircle size={25} className="text-amber-600" />
            )}

            <div>
              <h3
                className={`font-bold ${
                  isBalanced ? "text-green-800" : "text-amber-800"
                }`}
              >
                {isBalanced ? "القيد متوازن" : "القيد غير متوازن"}
              </h3>

              <p className="mt-1 text-sm text-slate-600">
                {isBalanced
                  ? "إجمالي المدين يساوي إجمالي الدائن"
                  : "يمكن حفظه كمسودة، لكن لا يمكن ترحيله قبل تحقيق التوازن"}
              </p>
            </div>
          </div>

          <div className="text-left">
            <p className="text-xs text-slate-500">الفرق</p>

            <p
              className={`mt-1 text-xl font-bold ${
                isBalanced ? "text-green-700" : "text-amber-700"
              }`}
            >
              {formatCurrency(Math.abs(difference))}
            </p>
          </div>
        </div>
      </div>

      {/* Save Buttons */}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => router.push("/erp/accounting/journals")}
          disabled={saving}
          className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          إلغاء
        </button>

        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Save Draft */}

          <button
            type="button"
            onClick={() => void handleSave("draft")}
            disabled={saving || accountsLoading}
            className="flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-6 py-3 font-semibold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <FiRefreshCw className="animate-spin" />
            ) : (
              <FiSave size={18} />
            )}
            حفظ كمسودة
          </button>

          {/* Save and Post */}

          <button
            type="button"
            onClick={() => void handleSave("posted")}
            disabled={
              saving || accountsLoading || !isBalanced || accounts.length === 0
            }
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <FiRefreshCw className="animate-spin" />
            ) : (
              <FiCheckCircle size={18} />
            )}
            حفظ وترحيل
          </button>
        </div>
      </div>

      {/* Saving Message */}

      {saving && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center text-sm text-blue-700">
          جارٍ حفظ القيد وتسجيل بيانات المستخدم...
        </div>
      )}
    </div>
  );
}
