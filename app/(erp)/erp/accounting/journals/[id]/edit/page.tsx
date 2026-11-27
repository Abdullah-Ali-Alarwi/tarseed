"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  FiArrowRight,
  FiPlus,
  FiTrash2,
  FiSave,
  FiRefreshCw,
  FiBookOpen,
  FiCalendar,
  FiFileText,
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

import { toast } from "sonner";

import { supabase } from "@/lib/supabase";
import { getUserByUsername } from "@/lib/api/users";

// ==========================================
// Types
// ==========================================

interface CurrentUser {
  id: string;
  username: string;
  name: string;
  type: string;
  role: string;
  companyId: string;
  isActive?: boolean;
  status?: string;
}

interface Account {
  id: string;
  companyId: string;
  code: string;
  name: string;
  type?: string;
  nature?: string;
  parentId?: string | null;
  isGroup?: boolean;
  isActive?: boolean;
  status?: string;
  extra?: Record<string, any>;
}

interface JournalLineForm {
  rowId: string;
  id?: string;
  accountId: string;
  debit: string;
  credit: string;
  description: string;
}

interface Journal {
  id: string;
  journalNumber: string;
  date: string;
  description: string;
  reference: string;
  status: string;
  totalDebit: number;
  totalCredit: number;
  companyId: string;
  createdBy: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
  postedBy?: string | null;
  postedById?: string | null;
  postedByName?: string | null;
  postedAt?: string | null;
}

interface JournalLine {
  id: string;
  journalId: string;
  accountId: string;
  debit: number;
  credit: number;
  description: string;
  companyId: string;
  createdBy: string;
  createdById: string;
  createdByName: string;
  createdAt: string;
}

// ==========================================
// Helpers
// ==========================================

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) return null;

  const value = cookie.substring(name.length + 1);

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);
}

function getAccountExtra(account: Account) {
  return account.extra || {};
}

function canPostAccount(account: Account) {
  const extra = getAccountExtra(account);

  const allowPosting =
    extra.allowPosting === true || extra.allowPosting === "true";

  const isActive = account.isActive === true || account.status === "active";

  return account.isGroup !== true && isActive && allowPosting;
}

function getAccountDisplayName(account: Account) {
  return `${account.code || ""} - ${account.name || ""}`;
}

function createEmptyLine(): JournalLineForm {
  return {
    rowId: crypto.randomUUID(),
    accountId: "",
    debit: "",
    credit: "",
    description: "",
  };
}

function getNumericValue(value: string) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeDate(value: string) {
  if (!value) return "";

  return value.substring(0, 10);
}

// ==========================================
// Page
// ==========================================

export default function EditJournalPage() {
  const router = useRouter();
  const params = useParams();

  const journalId = String(params.id || "");

  // ========================================
  // User
  // ========================================

  const [user, setUser] = useState<CurrentUser | null>(null);
  const [companyId, setCompanyId] = useState("");
  const [userLoading, setUserLoading] = useState(true);
  const [userError, setUserError] = useState("");

  // ========================================
  // Journal
  // ========================================

  const [journal, setJournal] = useState<Journal | null>(null);
  const [journalLoading, setJournalLoading] = useState(true);
  const [journalError, setJournalError] = useState("");

  // ========================================
  // Accounts
  // ========================================

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(false);

  // ========================================
  // Form
  // ========================================

  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");

  const [lines, setLines] = useState<JournalLineForm[]>([]);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // ========================================
  // Load User
  // ========================================

  useEffect(() => {
    let ignore = false;

    async function loadUser() {
      try {
        setUserLoading(true);
        setUserError("");

        const username = getCookie("username");

        if (!username) {
          throw new Error("يرجى تسجيل الدخول مجدداً");
        }

        const userData = await getUserByUsername(username);

        if (!userData) {
          throw new Error("المستخدم غير موجود");
        }

        if (userData.username !== username) {
          throw new Error("بيانات المستخدم غير صحيحة");
        }

        if (userData.type === "platform") {
          throw new Error("مستخدم المنصة لا يمكنه تعديل قيود الشركة");
        }

        if (!userData.companyId) {
          throw new Error("المستخدم غير مرتبط بشركة");
        }

        if (userData.isActive === false || userData.status === "inactive") {
          throw new Error("هذا الحساب غير نشط");
        }

        if (ignore) return;

        const normalizedUser: CurrentUser = {
          id: String(userData.id),
          username: userData.username,
          name: userData.name || userData.username,
          type: userData.type,
          role: userData.role,
          companyId: String(userData.companyId),
          isActive: userData.isActive,
          status: userData.status,
        };

        setUser(normalizedUser);
        setCompanyId(String(userData.companyId));
      } catch (error) {
        console.error("Load User Error:", error);

        if (!ignore) {
          setUserError(
            error instanceof Error
              ? error.message
              : "تعذر تحميل بيانات المستخدم",
          );
        }
      } finally {
        if (!ignore) {
          setUserLoading(false);
        }
      }
    }

    void loadUser();

    return () => {
      ignore = true;
    };
  }, []);

  // ========================================
  // Load Accounts
  // ========================================

  const fetchAccounts = useCallback(async () => {
    if (!companyId) return;

    try {
      setAccountsLoading(true);

      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .eq("companyId", companyId);

      if (error) throw error;

      const normalizedAccounts = (data || []) as Account[];

      const companyAccounts = normalizedAccounts.filter(
        (account) =>
          String(account.companyId) === companyId && canPostAccount(account),
      );

      setAccounts(companyAccounts);
    } catch (error) {
      console.error("Fetch Accounts Error:", error);

      toast.error(
        error instanceof Error ? error.message : "تعذر تحميل الحسابات",
      );
    } finally {
      setAccountsLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      void fetchAccounts();
    }
  }, [companyId, fetchAccounts]);

  // ========================================
  // Load Journal And Lines
  // ========================================

  const fetchJournal = useCallback(async () => {
    if (!companyId || !journalId) return;

    try {
      setJournalLoading(true);
      setJournalError("");

      // جلب رأس القيد مع التحقق من الشركة

      const { data: journalData, error: journalFetchError } = await supabase
        .from("journals")
        .select("*")
        .eq("id", journalId)
        .eq("companyId", companyId)
        .maybeSingle();

      if (journalFetchError) throw journalFetchError;

      if (!journalData) {
        throw new Error("القيد غير موجود أو لا تملك صلاحية الوصول إليه");
      }

      const normalizedJournal = journalData as Journal;

      if (normalizedJournal.status !== "draft") {
        throw new Error("لا يمكن تعديل هذا القيد لأنه ليس في حالة مسودة");
      }

      // جلب تفاصيل القيد

      const { data: linesData, error: linesFetchError } = await supabase
        .from("journalLines")
        .select("*")
        .eq("journalId", journalId)
        .eq("companyId", companyId);

      if (linesFetchError) throw linesFetchError;

      const normalizedLines = (linesData || []) as JournalLine[];

      if (normalizedLines.length === 0) {
        throw new Error("لا توجد تفاصيل مرتبطة بهذا القيد");
      }

      const formLines: JournalLineForm[] = normalizedLines.map((line) => ({
        rowId: crypto.randomUUID(),
        id: line.id,
        accountId: String(line.accountId),
        debit: Number(line.debit) > 0 ? String(line.debit) : "",
        credit: Number(line.credit) > 0 ? String(line.credit) : "",
        description: line.description || "",
      }));

      setJournal(normalizedJournal);
      setDate(normalizeDate(normalizedJournal.date));
      setDescription(normalizedJournal.description || "");
      setReference(normalizedJournal.reference || "");
      setLines(formLines);
    } catch (error) {
      console.error("Fetch Journal Error:", error);

      setJournalError(
        error instanceof Error ? error.message : "تعذر تحميل بيانات القيد",
      );
    } finally {
      setJournalLoading(false);
    }
  }, [companyId, journalId]);

  useEffect(() => {
    if (companyId && journalId) {
      void fetchJournal();
    }
  }, [companyId, journalId, fetchJournal]);

  // ========================================
  // Update Line
  // ========================================

  const updateLine = (
    rowId: string,
    field: keyof JournalLineForm,
    value: string,
  ) => {
    setLines((previous) =>
      previous.map((line) => {
        if (line.rowId !== rowId) return line;

        const updated = {
          ...line,
          [field]: value,
        };

        if (field === "debit" && value !== "") {
          updated.credit = "";
        }

        if (field === "credit" && value !== "") {
          updated.debit = "";
        }

        return updated;
      }),
    );

    setFormError("");
  };

  // ========================================
  // Add Line
  // ========================================

  const addLine = () => {
    setLines((previous) => [...previous, createEmptyLine()]);
  };

  // ========================================
  // Remove Line
  // ========================================

  const removeLine = (rowId: string) => {
    if (lines.length <= 2) {
      toast.error("يجب أن يحتوي القيد على سطرين على الأقل");
      return;
    }

    setLines((previous) => previous.filter((line) => line.rowId !== rowId));
  };

  // ========================================
  // Calculations
  // ========================================

  const totalDebit = useMemo(() => {
    return lines.reduce((sum, line) => sum + getNumericValue(line.debit), 0);
  }, [lines]);

  const totalCredit = useMemo(() => {
    return lines.reduce((sum, line) => sum + getNumericValue(line.credit), 0);
  }, [lines]);

  const difference = totalDebit - totalCredit;
  const isBalanced = Math.abs(difference) < 0.01;

  // ========================================
  // Validate Form
  // ========================================

  const validateForm = () => {
    if (!date) {
      return "يرجى تحديد تاريخ القيد";
    }

    if (!description.trim()) {
      return "يرجى إدخال بيان القيد";
    }

    if (lines.length < 2) {
      return "يجب إضافة سطرين على الأقل";
    }

    const selectedAccounts = new Set<string>();

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];

      if (!line.accountId) {
        return `يرجى اختيار الحساب في السطر رقم ${index + 1}`;
      }

      if (selectedAccounts.has(line.accountId)) {
        return `الحساب مكرر في السطر رقم ${index + 1}`;
      }

      selectedAccounts.add(line.accountId);

      const debit = getNumericValue(line.debit);
      const credit = getNumericValue(line.credit);

      if (debit < 0 || credit < 0) {
        return `لا يمكن إدخال مبلغ سالب في السطر رقم ${index + 1}`;
      }

      if (debit > 0 && credit > 0) {
        return `لا يمكن إدخال مدين ودائن معاً في السطر رقم ${index + 1}`;
      }

      if (debit === 0 && credit === 0) {
        return `يرجى إدخال مبلغ مدين أو دائن في السطر رقم ${index + 1}`;
      }

      const account = accounts.find(
        (item) => String(item.id) === line.accountId,
      );

      if (!account) {
        return `الحساب المحدد في السطر رقم ${index + 1} غير صالح أو غير قابل للترحيل`;
      }
    }

    if (totalDebit <= 0 || totalCredit <= 0) {
      return "يجب إدخال مبالغ في جانبي المدين والدائن";
    }

    if (!isBalanced) {
      return "القيد غير متوازن، يجب أن يتساوى المدين مع الدائن";
    }

    return "";
  };

  // ========================================
  // Update Journal
  // ========================================

  const handleSubmit = async () => {
    if (saving) return;

    setFormError("");

    const validationError = validateForm();

    if (validationError) {
      setFormError(validationError);
      toast.error(validationError);
      return;
    }

    if (!user || !companyId || !journal) {
      toast.error("بيانات المستخدم أو القيد غير متوفرة");
      return;
    }

    try {
      setSaving(true);

      const now = new Date().toISOString();

      // إعادة التحقق من حالة القيد قبل التحديث

      const { data: currentJournal, error: checkError } = await supabase
        .from("journals")
        .select("id, status, companyId")
        .eq("id", journalId)
        .eq("companyId", companyId)
        .maybeSingle();

      if (checkError) throw checkError;

      if (!currentJournal) {
        throw new Error("القيد غير موجود أو لا تملك صلاحية تعديله");
      }

      if (currentJournal.status !== "draft") {
        throw new Error("لم يعد بالإمكان تعديل هذا القيد");
      }

      // تحديث رأس القيد

      const { error: updateJournalError } = await supabase
        .from("journals")
        .update({
          date,
          description: description.trim(),
          reference: reference.trim(),
          totalDebit,
          totalCredit,
        })
        .eq("id", journalId)
        .eq("companyId", companyId)
        .eq("status", "draft");

      if (updateJournalError) throw updateJournalError;

      // حذف التفاصيل القديمة

      const { error: deleteLinesError } = await supabase
        .from("journalLines")
        .delete()
        .eq("journalId", journalId)
        .eq("companyId", companyId);

      if (deleteLinesError) {
        throw deleteLinesError;
      }

      // تجهيز التفاصيل الجديدة

      const journalLinesPayload: JournalLine[] = lines.map((line) => ({
        id: line.id || crypto.randomUUID(),
        journalId,
        accountId: line.accountId,
        debit: getNumericValue(line.debit),
        credit: getNumericValue(line.credit),
        description: line.description.trim(),
        companyId,
        createdBy: user.username,
        createdById: user.id,
        createdByName: user.name,
        createdAt: now,
      }));

      // حفظ التفاصيل الجديدة

      const { error: insertLinesError } = await supabase
        .from("journalLines")
        .insert(journalLinesPayload);

      if (insertLinesError) {
        throw insertLinesError;
      }

      toast.success(`تم تحديث القيد ${journal.journalNumber} بنجاح`);

      router.push("/erp/accounting/journals");
      router.refresh();
    } catch (error) {
      console.error("Update Journal Error:", error);

      const message =
        error instanceof Error ? error.message : "حدث خطأ أثناء تحديث القيد";

      setFormError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  // ========================================
  // Loading User
  // ========================================

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

  // ========================================
  // User Error
  // ========================================

  if (userError || !companyId) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50 p-5"
      >
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <FiAlertCircle size={35} className="mx-auto mb-3 text-red-500" />

          <h2 className="font-bold text-red-600">تعذر فتح صفحة تعديل القيد</h2>

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

  // ========================================
  // Loading Journal
  // ========================================

  if (journalLoading || accountsLoading) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />

          <p className="text-sm text-slate-500">
            جارٍ تحميل بيانات القيد والحسابات...
          </p>
        </div>
      </div>
    );
  }

  // ========================================
  // Journal Error
  // ========================================

  if (journalError || !journal) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50 p-5"
      >
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <FiAlertCircle size={35} className="mx-auto mb-3 text-red-500" />

          <h2 className="font-bold text-red-600">تعذر فتح القيد</h2>

          <p className="mt-3 text-sm text-slate-600">
            {journalError || "القيد غير موجود"}
          </p>

          <button
            onClick={() => router.push("/erp/accounting/journals")}
            className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white"
          >
            العودة إلى القيود اليومية
          </button>
        </div>
      </div>
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <div
      dir="rtl"
      className="min-h-screen space-y-6 bg-slate-50 p-5 pb-10 text-slate-800"
    >
      {/* Header */}

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <button
            onClick={() => router.push("/erp/accounting/journals")}
            className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-blue-600"
          >
            <FiArrowRight />
            العودة إلى القيود اليومية
          </button>

          <h1 className="text-2xl font-bold text-slate-900">تعديل قيد يومي</h1>

          <p className="mt-2 text-sm text-slate-500">
            تعديل بيانات القيد {journal.journalNumber}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
            <FiBookOpen size={18} />

            <span>
              الشركة: <strong>{user?.name || "الشركة الحالية"}</strong>
            </span>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
            مسودة
          </div>
        </div>
      </div>

      {/* Journal Information */}

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2 border-b border-slate-100 pb-4">
          <FiFileText className="text-blue-600" size={20} />

          <h2 className="font-bold text-slate-800">بيانات القيد</h2>
        </div>

        {/* Journal Number */}

        <div className="mb-5 rounded-lg border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs text-slate-500">رقم القيد</p>

          <p className="mt-1 font-bold text-slate-900">
            {journal.journalNumber}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Date */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              تاريخ القيد <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <FiCalendar
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white py-3 pl-3 pr-10 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Reference */}

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              المرجع
            </label>

            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="رقم المرجع أو المستند"
              className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Description */}

          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              بيان القيد <span className="text-red-500">*</span>
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="اكتب وصفاً واضحاً للعملية المالية..."
              className="w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      {/* Journal Lines */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-slate-800">تفاصيل القيد</h2>

            <p className="mt-1 text-xs text-slate-500">
              أضف الحسابات والمبالغ المدينة والدائنة
            </p>
          </div>

          <button
            type="button"
            onClick={addLine}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            <FiPlus size={17} />
            إضافة سطر
          </button>
        </div>

        {accounts.length === 0 ? (
          <div className="p-8 text-center">
            <FiAlertCircle size={35} className="mx-auto mb-3 text-amber-500" />

            <h3 className="font-semibold text-slate-700">
              لا توجد حسابات قابلة للترحيل
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              يرجى التأكد من إعداد شجرة الحسابات وتفعيل الحسابات القابلة
              للترحيل.
            </p>

            <button
              type="button"
              onClick={() => router.push("/erp/accounting/accounts")}
              className="mt-4 text-sm font-medium text-blue-600 hover:underline"
            >
              الانتقال إلى شجرة الحسابات
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-right text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="w-12 px-4 py-4 text-center">#</th>
                  <th className="px-4 py-4">الحساب</th>
                  <th className="px-4 py-4">البيان</th>
                  <th className="w-44 px-4 py-4">مدين</th>
                  <th className="w-44 px-4 py-4">دائن</th>
                  <th className="w-16 px-4 py-4 text-center">حذف</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {lines.map((line, index) => (
                  <tr key={line.rowId} className="transition hover:bg-slate-50">
                    <td className="px-4 py-4 text-center text-slate-500">
                      {index + 1}
                    </td>

                    <td className="px-4 py-4">
                      <select
                        value={line.accountId}
                        onChange={(e) =>
                          updateLine(line.rowId, "accountId", e.target.value)
                        }
                        className="w-full min-w-[230px] rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                      >
                        <option value="">اختر الحساب</option>

                        {accounts.map((account) => (
                          <option key={account.id} value={account.id}>
                            {getAccountDisplayName(account)}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="px-4 py-4">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) =>
                          updateLine(line.rowId, "description", e.target.value)
                        }
                        placeholder="بيان السطر"
                        className="w-full min-w-[180px] rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
                      />
                    </td>

                    <td className="px-4 py-4">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.debit}
                        onChange={(e) =>
                          updateLine(line.rowId, "debit", e.target.value)
                        }
                        placeholder="0.00"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-left text-sm outline-none focus:border-blue-500"
                      />
                    </td>

                    <td className="px-4 py-4">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.credit}
                        onChange={(e) =>
                          updateLine(line.rowId, "credit", e.target.value)
                        }
                        placeholder="0.00"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-left text-sm outline-none focus:border-blue-500"
                      />
                    </td>

                    <td className="px-4 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(line.rowId)}
                        title="حذف السطر"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600 transition hover:bg-red-100"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-4 font-bold text-slate-800"
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

      {/* Balance Summary */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <FiDollarSign size={18} />
            إجمالي المدين
          </div>

          <p className="mt-3 text-xl font-bold text-blue-800">
            {formatCurrency(totalDebit)}
          </p>
        </div>

        <div className="rounded-xl border border-green-100 bg-green-50 p-5">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <FiDollarSign size={18} />
            إجمالي الدائن
          </div>

          <p className="mt-3 text-xl font-bold text-green-800">
            {formatCurrency(totalCredit)}
          </p>
        </div>

        <div
          className={`rounded-xl border p-5 ${
            isBalanced
              ? "border-green-100 bg-green-50"
              : "border-red-100 bg-red-50"
          }`}
        >
          <div
            className={`flex items-center gap-2 text-sm ${
              isBalanced ? "text-green-700" : "text-red-700"
            }`}
          >
            {isBalanced ? (
              <FiCheckCircle size={18} />
            ) : (
              <FiAlertCircle size={18} />
            )}
            حالة التوازن
          </div>

          <p
            className={`mt-3 text-xl font-bold ${
              isBalanced ? "text-green-800" : "text-red-700"
            }`}
          >
            {isBalanced
              ? "القيد متوازن"
              : `الفرق: ${formatCurrency(Math.abs(difference))}`}
          </p>
        </div>
      </div>

      {/* Error */}

      {formError && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <FiAlertCircle className="mt-0.5 shrink-0" size={18} />
          <p>{formError}</p>
        </div>
      )}

      {/* Actions */}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => router.push("/erp/accounting/journals")}
          disabled={saving}
          className="rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
        >
          إلغاء
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving || accountsLoading || accounts.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <>
              <FiRefreshCw className="animate-spin" />
              جارٍ تحديث القيد...
            </>
          ) : (
            <>
              <FiSave size={18} />
              حفظ التعديلات
            </>
          )}
        </button>
      </div>
    </div>
  );
}
