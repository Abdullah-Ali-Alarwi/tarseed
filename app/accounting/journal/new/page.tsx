"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useERPStore } from "@/Store/erpStore";

import {
  FiArrowRight,
  FiPlus,
  FiTrash2,
  FiSave,
  FiRefreshCw,
  FiFileText,
  FiSearch,
  FiCheckCircle,
  FiAlertCircle,
  FiPrinter,
} from "react-icons/fi";

/* =========================================================
   الأنواع
========================================================= */

type JournalLineForm = {
  id: string;
  accountId: string;
  debit: string;
  credit: string;
  description: string;
};

type AccountOption = {
  id: string;
  code: string;
  name: string;
  type: string;
  nature: string;
  isGroup?: boolean;
  isActive?: boolean;
};

/* =========================================================
   الدوال المساعدة
========================================================= */

const createLineId = () =>
  `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

const createEmptyLine = (): JournalLineForm => ({
  id: createLineId(),
  accountId: "",
  debit: "",
  credit: "",
  description: "",
});

const formatMoney = (value: number) =>
  new Intl.NumberFormat("ar-YE", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));

const accountTypeLabel = (type: string) => {
  switch (type) {
    case "asset":
      return "أصل";

    case "liability":
      return "التزام";

    case "equity":
      return "حقوق ملكية";

    case "revenue":
      return "إيراد";

    case "expense":
      return "مصروف";

    case "cogs":
      return "تكلفة مبيعات";

    default:
      return type || "";
  }
};

const escapeHtml = (value: string) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

/* =========================================================
   صفحة إضافة قيد
========================================================= */

export default function NewJournalEntryPage() {
  /* =======================================================
     Store
  ======================================================= */

  const accounts = useERPStore((state) => state.accounts);
  const journalEntries = useERPStore((state) => state.journalEntries);
  const addJournalEntry = useERPStore((state) => state.addJournalEntry);

  /* =======================================================
     الحالة
  ======================================================= */

  const [date, setDate] = useState(() => {
    return new Date().toISOString().split("T")[0];
  });

  const [description, setDescription] = useState("");

  const [referenceType, setReferenceType] = useState<
    "manual" | "sale" | "purchase" | "payment" | "receipt" | "other"
  >("manual");

  const [referenceId, setReferenceId] = useState("");

  const [lines, setLines] = useState<JournalLineForm[]>([
    createEmptyLine(),
    createEmptyLine(),
  ]);

  const [isSaving, setIsSaving] = useState(false);

  const [searches, setSearches] = useState<Record<string, string>>({});

  const [openAccountLine, setOpenAccountLine] = useState<string | null>(null);

  /* =======================================================
     الحسابات النشطة
  ======================================================= */

  const activeAccounts = useMemo<AccountOption[]>(() => {
    return accounts
      .filter(
        (account) => account.isActive !== false && account.isGroup !== true,
      )
      .map((account) => ({
        id: account.id,
        code: account.code,
        name: account.name,
        type: account.type,
        nature: account.nature,
        isGroup: account.isGroup,
        isActive: account.isActive,
      }))
      .sort((a, b) => {
        return (
          Number(a.code.replace(/\D/g, "")) - Number(b.code.replace(/\D/g, ""))
        );
      });
  }, [accounts]);

  /* =======================================================
     الحسابات المفلترة لكل سطر
  ======================================================= */

  const getFilteredAccounts = (lineId: string) => {
    const search = String(searches[lineId] || "")
      .trim()
      .toLowerCase();

    if (!search) {
      return activeAccounts.slice(0, 40);
    }

    return activeAccounts
      .filter(
        (account) =>
          account.code.toLowerCase().includes(search) ||
          account.name.toLowerCase().includes(search),
      )
      .slice(0, 40);
  };

  /* =======================================================
     الحساب المختار
  ======================================================= */

  const getSelectedAccount = (accountId: string) => {
    return activeAccounts.find((account) => account.id === accountId);
  };

  /* =======================================================
     الإجماليات
  ======================================================= */

  const totalDebit = useMemo(() => {
    return lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  }, [lines]);

  const totalCredit = useMemo(() => {
    return lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  }, [lines]);

  const difference = Math.abs(totalDebit - totalCredit);

  const balanced = totalDebit > 0 && totalCredit > 0 && difference < 0.001;

  /* =======================================================
     رقم القيد التالي
  ======================================================= */

  const nextEntryNumber = useMemo(() => {
    let maxNumber = 0;

    journalEntries.forEach((entry) => {
      const match = String(entry.entryNumber || "").match(/(\d+)$/);

      if (!match) return;

      const number = Number(match[1]);

      if (Number.isFinite(number) && number > maxNumber) {
        maxNumber = number;
      }
    });

    return `JE-${String(Math.max(1000, maxNumber + 1))}`;
  }, [journalEntries]);

  /* =======================================================
     إضافة سطر
  ======================================================= */

  const addLine = () => {
    setLines((current) => [...current, createEmptyLine()]);
  };

  /* =======================================================
     حذف سطر
  ======================================================= */

  const removeLine = (lineId: string) => {
    if (lines.length <= 2) {
      toast.error("يجب أن يحتوي القيد على سطرين على الأقل");
      return;
    }

    setLines((current) => current.filter((line) => line.id !== lineId));

    setSearches((current) => {
      const next = { ...current };
      delete next[lineId];
      return next;
    });

    if (openAccountLine === lineId) {
      setOpenAccountLine(null);
    }
  };

  /* =======================================================
     تعديل السطر
  ======================================================= */

  const updateLine = (
    lineId: string,
    field: keyof JournalLineForm,
    value: string,
  ) => {
    setLines((current) =>
      current.map((line) => {
        if (line.id !== lineId) {
          return line;
        }

        const updated = {
          ...line,
          [field]: value,
        };

        if (field === "debit" && value) {
          updated.credit = "";
        }

        if (field === "credit" && value) {
          updated.debit = "";
        }

        return updated;
      }),
    );
  };

  /* =======================================================
     البحث عن الحساب
  ======================================================= */

  const handleAccountSearch = (lineId: string, value: string) => {
    setSearches((current) => ({
      ...current,
      [lineId]: value,
    }));

    setOpenAccountLine(lineId);

    const line = lines.find((item) => item.id === lineId);

    if (!line) return;

    const selected = getSelectedAccount(line.accountId);

    if (selected && value !== `${selected.code} - ${selected.name}`) {
      updateLine(lineId, "accountId", "");
    }
  };

  /* =======================================================
     اختيار الحساب
  ======================================================= */

  const selectAccount = (lineId: string, account: AccountOption) => {
    updateLine(lineId, "accountId", account.id);

    setSearches((current) => ({
      ...current,
      [lineId]: `${account.code} - ${account.name}`,
    }));

    setOpenAccountLine(null);
  };

  /* =======================================================
     تفريغ النموذج
  ======================================================= */

  const resetForm = () => {
    setDate(new Date().toISOString().split("T")[0]);
    setDescription("");
    setReferenceType("manual");
    setReferenceId("");

    setLines([createEmptyLine(), createEmptyLine()]);

    setSearches({});
    setOpenAccountLine(null);
  };

  /* =======================================================
     إنشاء سند القيد للطباعة
  ======================================================= */

  const openPrintVoucher = ({
    entryNumber,
    entryDate,
    entryDescription,
    entryReferenceType,
    entryReferenceId,
    journalLines,
    debitTotal,
    creditTotal,
  }: {
    entryNumber: string;
    entryDate: string;
    entryDescription: string;
    entryReferenceType: string;
    entryReferenceId: string;
    journalLines: {
      accountCode: string;
      accountName: string;
      debit: number;
      credit: number;
      description: string;
    }[];
    debitTotal: number;
    creditTotal: number;
  }) => {
    const linesHtml = journalLines
      .map(
        (line) => `
          <tr>
            <td>${escapeHtml(line.accountCode)}</td>
            <td>${escapeHtml(line.accountName)}</td>
            <td>${escapeHtml(line.description || "")}</td>
            <td class="number">
              ${formatMoney(line.debit)}
            </td>
            <td class="number">
              ${formatMoney(line.credit)}
            </td>
          </tr>
        `,
      )
      .join("");

    const referenceTypeText =
      entryReferenceType === "manual"
        ? "قيد يدوي"
        : entryReferenceType === "sale"
          ? "مبيعات"
          : entryReferenceType === "purchase"
            ? "مشتريات"
            : entryReferenceType === "payment"
              ? "سند صرف"
              : entryReferenceType === "receipt"
                ? "سند قبض"
                : "أخرى";

    const printWindow = window.open("", "_blank", "width=1000,height=800");

    if (!printWindow) {
      toast.error("تعذر فتح نافذة الطباعة. تأكد من السماح بالنوافذ المنبثقة.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <title>سند قيد ${escapeHtml(entryNumber)}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            padding: 30px;
            background: #fff;
            color: #111827;
            font-family:
              "Tahoma",
              "Arial",
              sans-serif;
          }

          .voucher {
            max-width: 1000px;
            margin: 0 auto;
            border: 1px solid #d1d5db;
            padding: 30px;
          }

          .company {
            text-align: center;
            border-bottom: 2px solid #111827;
            padding-bottom: 18px;
            margin-bottom: 20px;
          }

          .company h1 {
            margin: 0 0 8px;
            font-size: 25px;
          }

          .company p {
            margin: 4px 0;
            font-size: 14px;
            color: #4b5563;
          }

          .title {
            text-align: center;
            margin: 20px 0;
          }

          .title h2 {
            margin: 0;
            font-size: 22px;
          }

          .info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
            margin-bottom: 20px;
          }

          .info-box {
            border: 1px solid #d1d5db;
            padding: 10px 14px;
            display: flex;
            justify-content: space-between;
            gap: 15px;
          }

          .info-box strong {
            color: #374151;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }

          th,
          td {
            border: 1px solid #cbd5e1;
            padding: 10px;
            text-align: right;
            font-size: 14px;
          }

          th {
            background: #f3f4f6;
            font-weight: bold;
          }

          .number {
            text-align: left;
            direction: ltr;
          }

          tfoot td {
            font-weight: bold;
            background: #f9fafb;
          }

          .balanced {
            margin-top: 20px;
            padding: 12px;
            text-align: center;
            border: 1px solid #16a34a;
            background: #f0fdf4;
            color: #166534;
            font-weight: bold;
          }

          .footer {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            padding-top: 20px;
          }

          .signature {
            width: 30%;
            text-align: center;
          }

          .signature-line {
            border-top: 1px solid #6b7280;
            margin-top: 45px;
            padding-top: 8px;
          }

          .actions {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin: 20px auto;
          }

          .actions button {
            border: none;
            background: #111827;
            color: white;
            padding: 10px 25px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          }

          @media print {
            body {
              padding: 0;
            }

            .voucher {
              border: none;
              max-width: none;
              padding: 10px;
            }

            .actions {
              display: none;
            }
          }
        </style>
      </head>

      <body>

        <div class="actions">
          <button onclick="window.print()">
            طباعة سند القيد
          </button>
        </div>

        <div class="voucher">

          <div class="company">
            <h1>شركة الجابري</h1>
            <p>للعسل والزيوت الطبيعة وخدمات العمرة</p>
            <p>البيضاء - اليمن | هاتف: 734 434 443</p>
          </div>

          <div class="title">
            <h2>سند قيد يومية</h2>
          </div>

          <div class="info">

            <div class="info-box">
              <strong>رقم القيد</strong>
              <span>${escapeHtml(entryNumber)}</span>
            </div>

            <div class="info-box">
              <strong>التاريخ</strong>
              <span>${escapeHtml(entryDate)}</span>
            </div>

            <div class="info-box">
              <strong>نوع القيد</strong>
              <span>${escapeHtml(referenceTypeText)}</span>
            </div>

            <div class="info-box">
              <strong>المرجع</strong>
              <span>${escapeHtml(entryReferenceId || "-")}</span>
            </div>

          </div>

          <div class="info-box">
            <strong>البيان</strong>
            <span>${escapeHtml(entryDescription)}</span>
          </div>

          <table>

            <thead>
              <tr>
                <th>رمز الحساب</th>
                <th>الحساب</th>
                <th>البيان</th>
                <th>مدين</th>
                <th>دائن</th>
              </tr>
            </thead>

            <tbody>
              ${linesHtml}
            </tbody>

            <tfoot>
              <tr>
                <td colspan="3">الإجمالي</td>
                <td class="number">
                  ${formatMoney(debitTotal)}
                </td>
                <td class="number">
                  ${formatMoney(creditTotal)}
                </td>
              </tr>
            </tfoot>

          </table>

          <div class="balanced">
            القيد متوازن — إجمالي المدين يساوي إجمالي الدائن
          </div>

          <div class="footer">

            <div class="signature">
              المحاسب
              <div class="signature-line"></div>
            </div>

            <div class="signature">
              المراجع
              <div class="signature-line"></div>
            </div>

            <div class="signature">
              المدير
              <div class="signature-line"></div>
            </div>

          </div>

        </div>

        <script>
          window.onload = function () {
            setTimeout(function () {
              window.print();
            }, 500);
          };
        </script>

      </body>
      </html>
    `);

    printWindow.document.close();
  };

  /* =======================================================
     حفظ القيد
  ======================================================= */

  const handleSave = () => {
    if (isSaving) {
      return;
    }

    /* -----------------------------------------------------
       التحقق من التاريخ
    ----------------------------------------------------- */

    if (!date) {
      toast.error("يرجى تحديد تاريخ القيد");
      return;
    }

    /* -----------------------------------------------------
       التحقق من البيان
    ----------------------------------------------------- */

    if (!description.trim()) {
      toast.error("يرجى إدخال بيان القيد");
      return;
    }

    /* -----------------------------------------------------
       عدد الأسطر
    ----------------------------------------------------- */

    if (lines.length < 2) {
      toast.error("يجب أن يحتوي القيد على سطرين على الأقل");
      return;
    }

    /* -----------------------------------------------------
       التحقق من الأسطر
    ----------------------------------------------------- */

    const usedAccounts = new Set<string>();

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];

      if (!line.accountId) {
        toast.error(`يرجى اختيار الحساب في السطر ${index + 1}`);
        return;
      }

      const account = getSelectedAccount(line.accountId);

      if (!account) {
        toast.error(`الحساب في السطر ${index + 1} غير موجود`);
        return;
      }

      if (usedAccounts.has(account.id)) {
        toast.error(`لا يمكن تكرار الحساب "${account.name}" في أكثر من سطر`);
        return;
      }

      usedAccounts.add(account.id);

      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);

      if (!Number.isFinite(debit) || debit < 0) {
        toast.error(`قيمة المدين في السطر ${index + 1} غير صحيحة`);
        return;
      }

      if (!Number.isFinite(credit) || credit < 0) {
        toast.error(`قيمة الدائن في السطر ${index + 1} غير صحيحة`);
        return;
      }

      if (debit === 0 && credit === 0) {
        toast.error(`يجب إدخال قيمة مدين أو دائن في السطر ${index + 1}`);
        return;
      }

      if (debit > 0 && credit > 0) {
        toast.error(`لا يمكن إدخال مدين ودائن معًا في السطر ${index + 1}`);
        return;
      }
    }

    /* -----------------------------------------------------
       التحقق من الإجماليات
    ----------------------------------------------------- */

    if (totalDebit <= 0) {
      toast.error("إجمالي المدين يجب أن يكون أكبر من صفر");
      return;
    }

    if (totalCredit <= 0) {
      toast.error("إجمالي الدائن يجب أن يكون أكبر من صفر");
      return;
    }

    if (!balanced) {
      toast.error(`القيد غير متوازن. الفرق: ${formatMoney(difference)}`);
      return;
    }

    /* -----------------------------------------------------
       بدء الحفظ
    ----------------------------------------------------- */

    setIsSaving(true);

    try {
      /* ---------------------------------------------------
         تجهيز أسطر القيد
      --------------------------------------------------- */

      const journalLines = lines.map((line, index) => {
        const account = getSelectedAccount(line.accountId);

        if (!account) {
          throw new Error(`الحساب في السطر ${index + 1} غير موجود`);
        }

        return {
          id: createLineId(),
          accountId: account.id,
          accountCode: account.code,
          accountName: account.name,
          debit: Number(line.debit || 0),
          credit: Number(line.credit || 0),
          description: line.description.trim() || description.trim(),
        };
      });

      /* ---------------------------------------------------
         حفظ القيد في Zustand
         
         لا نعتمد على قيمة الإرجاع من addJournalEntry
      --------------------------------------------------- */

      addJournalEntry({
        entryNumber: nextEntryNumber,
        date,
        description: description.trim(),
        referenceType,
        referenceId: referenceId.trim() || undefined,
        lines: journalLines,
      });

      /* ---------------------------------------------------
         رسالة النجاح
      --------------------------------------------------- */

      toast.success("تم حفظ القيد بنجاح", {
        description: `رقم القيد: ${nextEntryNumber}`,
        duration: 5000,
      });

      /* ---------------------------------------------------
         فتح سند الطباعة
         
         نأخذ نسخة من البيانات قبل تفريغ النموذج
      --------------------------------------------------- */

      const printData = {
        entryNumber: nextEntryNumber,
        entryDate: date,
        entryDescription: description.trim(),
        entryReferenceType: referenceType,
        entryReferenceId: referenceId.trim(),
        journalLines: journalLines.map((line) => ({
          accountCode: line.accountCode,
          accountName: line.accountName,
          debit: line.debit,
          credit: line.credit,
          description: line.description,
        })),
        debitTotal: totalDebit,
        creditTotal: totalCredit,
      };

      /* ---------------------------------------------------
         تفريغ النموذج
      --------------------------------------------------- */

      resetForm();

      /* ---------------------------------------------------
         فتح سند القيد
      --------------------------------------------------- */

      setTimeout(() => {
        openPrintVoucher(printData);
      }, 150);
    } catch (error) {
      console.error("خطأ أثناء حفظ القيد:", error);

      toast.error(
        error instanceof Error ? error.message : "حدث خطأ أثناء حفظ القيد",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =======================================================
     JSX
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-5" dir="rtl">
      <div className="mx-auto max-w-7xl">
        {/* =================================================
            العنوان
        ================================================= */}

        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/accounting/journal"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100"
              title="العودة"
            >
              <FiArrowRight size={18} />
            </Link>

            <div>
              <h1 className="text-lg font-bold text-slate-800 sm:text-xl">
                إضافة قيد يومية
              </h1>

              <p className="mt-1 text-xs text-slate-500 sm:text-sm">
                إنشاء قيد محاسبي جديد
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2">
            <FiFileText className="text-slate-600" size={17} />

            <span className="text-xs font-medium text-slate-600">
              رقم القيد القادم:
            </span>

            <span className="font-bold text-slate-800">{nextEntryNumber}</span>
          </div>
        </div>

        {/* =================================================
            معلومات القيد
        ================================================= */}

        <div className="mb-4 rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-800">معلومات القيد</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2">
            {/* التاريخ */}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                التاريخ
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {/* نوع المرجع */}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                نوع القيد
              </label>

              <select
                value={referenceType}
                onChange={(e) =>
                  setReferenceType(
                    e.target.value as
                      | "manual"
                      | "sale"
                      | "purchase"
                      | "payment"
                      | "receipt"
                      | "other",
                  )
                }
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              >
                <option value="manual">قيد يدوي</option>
                <option value="sale">مبيعات</option>
                <option value="purchase">مشتريات</option>
                <option value="payment">سند صرف</option>
                <option value="receipt">سند قبض</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            {/* البيان */}

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                البيان
              </label>

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="أدخل بيان القيد..."
                className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {/* المرجع */}

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700">
                رقم المرجع
                <span className="mr-1 font-normal text-slate-400">
                  (اختياري)
                </span>
              </label>

              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="رقم الفاتورة أو السند..."
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>
        </div>

        {/* =================================================
            جدول القيد
        ================================================= */}

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">تفاصيل القيد</h2>

              <p className="mt-1 text-xs text-slate-500">
                يجب أن يتساوى إجمالي المدين مع إجمالي الدائن
              </p>
            </div>

            <button
              type="button"
              onClick={addLine}
              className="flex h-9 items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 text-xs font-semibold text-white transition hover:bg-slate-700"
            >
              <FiPlus size={16} />
              إضافة سطر
            </button>
          </div>

          {/* الجدول */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-right">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="w-10 px-3 py-3 text-center text-xs font-bold text-slate-600">
                    #
                  </th>

                  <th className="px-3 py-3 text-xs font-bold text-slate-600">
                    الحساب
                  </th>

                  <th className="w-40 px-3 py-3 text-xs font-bold text-slate-600">
                    مدين
                  </th>

                  <th className="w-40 px-3 py-3 text-xs font-bold text-slate-600">
                    دائن
                  </th>

                  <th className="w-64 px-3 py-3 text-xs font-bold text-slate-600">
                    البيان
                  </th>

                  <th className="w-12 px-3 py-3"></th>
                </tr>
              </thead>

              <tbody>
                {lines.map((line, index) => {
                  const selectedAccount = getSelectedAccount(line.accountId);

                  const filteredAccounts = getFilteredAccounts(line.id);

                  return (
                    <tr
                      key={line.id}
                      className="border-b border-slate-100 align-top"
                    >
                      {/* الرقم */}

                      <td className="px-3 py-3 text-center text-xs font-semibold text-slate-500">
                        {index + 1}
                      </td>

                      {/* الحساب */}

                      <td className="relative px-3 py-3">
                        <div className="relative">
                          <div className="relative">
                            <FiSearch
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                              size={15}
                            />

                            <input
                              type="text"
                              value={
                                searches[line.id] ??
                                (selectedAccount
                                  ? `${selectedAccount.code} - ${selectedAccount.name}`
                                  : "")
                              }
                              onFocus={() => setOpenAccountLine(line.id)}
                              onChange={(e) =>
                                handleAccountSearch(line.id, e.target.value)
                              }
                              placeholder="ابحث عن الحساب..."
                              className="h-10 w-full rounded-lg border border-slate-300 bg-white pr-9 pl-3 text-xs outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                            />
                          </div>

                          {openAccountLine === line.id && (
                            <div className="absolute right-3 left-3 z-30 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-xl">
                              {filteredAccounts.length === 0 ? (
                                <div className="p-4 text-center text-xs text-slate-500">
                                  لا توجد حسابات مطابقة
                                </div>
                              ) : (
                                filteredAccounts.map((account) => (
                                  <button
                                    type="button"
                                    key={account.id}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() =>
                                      selectAccount(line.id, account)
                                    }
                                    className="flex w-full items-center justify-between gap-3 border-b border-slate-100 px-3 py-2.5 text-right transition last:border-b-0 hover:bg-slate-50"
                                  >
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-mono text-xs font-bold text-slate-700">
                                          {account.code}
                                        </span>

                                        <span className="truncate text-xs font-semibold text-slate-800">
                                          {account.name}
                                        </span>
                                      </div>

                                      <div className="mt-1 text-[10px] text-slate-400">
                                        {accountTypeLabel(account.type)}
                                      </div>
                                    </div>
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* المدين */}

                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.debit}
                          onChange={(e) =>
                            updateLine(line.id, "debit", e.target.value)
                          }
                          placeholder="0.00"
                          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-left text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                        />
                      </td>

                      {/* الدائن */}

                      <td className="px-3 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.credit}
                          onChange={(e) =>
                            updateLine(line.id, "credit", e.target.value)
                          }
                          placeholder="0.00"
                          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-left text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                        />
                      </td>

                      {/* البيان */}

                      <td className="px-3 py-3">
                        <input
                          type="text"
                          value={line.description}
                          onChange={(e) =>
                            updateLine(line.id, "description", e.target.value)
                          }
                          placeholder="بيان السطر..."
                          className="h-10 w-full rounded-lg border border-slate-300 px-3 text-xs outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                        />
                      </td>

                      {/* حذف */}

                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          disabled={lines.length <= 2}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30"
                          title="حذف السطر"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* الإجماليات */}

              <tfoot>
                <tr className="bg-slate-50">
                  <td
                    colSpan={2}
                    className="px-3 py-4 text-left text-sm font-bold text-slate-700"
                  >
                    الإجمالي
                  </td>

                  <td className="px-3 py-4">
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left font-bold text-slate-800">
                      {formatMoney(totalDebit)}
                    </div>
                  </td>

                  <td className="px-3 py-4">
                    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left font-bold text-slate-800">
                      {formatMoney(totalCredit)}
                    </div>
                  </td>

                  <td colSpan={2} className="px-3 py-4">
                    {balanced ? (
                      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-bold text-green-700">
                        <FiCheckCircle size={17} />

                        <span>القيد متوازن</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
                        <div className="flex items-center gap-2">
                          <FiAlertCircle size={17} />

                          <span>القيد غير متوازن</span>
                        </div>

                        <span>الفرق: {formatMoney(difference)}</span>
                      </div>
                    )}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* =================================================
              أزرار الحفظ
          ================================================= */}

          <div className="flex flex-col-reverse gap-2 border-t border-slate-200 p-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetForm}
              disabled={isSaving}
              className="flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <FiRefreshCw size={15} />
              تفريغ الحقول
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-800 px-6 text-xs font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <FiRefreshCw className="animate-spin" size={16} />
                  جارٍ الحفظ...
                </>
              ) : (
                <>
                  <FiSave size={16} />
                  حفظ القيد وطباعة السند
                </>
              )}
            </button>
          </div>
        </div>

        {/* =================================================
            ملاحظة
        ================================================= */}

        <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-3">
          <div className="flex gap-2">
            <FiPrinter className="mt-0.5 shrink-0 text-blue-600" size={17} />

            <p className="text-xs leading-6 text-blue-800">
              بعد الضغط على <strong>حفظ القيد وطباعة السند</strong>، سيتم حفظ
              القيد أولًا، ثم تفريغ الحقول وفتح سند القيد في نافذة جديدة
              للطباعة.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
