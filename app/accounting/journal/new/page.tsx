"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useERPStore } from "@/Store/erpStore";
import { toast } from "sonner";
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
} from "react-icons/fi";

/* =========================================================
   TYPES
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
   HELPERS
========================================================= */

const createLineId = () => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

const createEmptyLine = (): JournalLineForm => ({
  id: createLineId(),
  accountId: "",
  debit: "",
  credit: "",
  description: "",
});

const formatMoney = (value: number) => {
  return new Intl.NumberFormat("ar-YE", {
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
};

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

/* =========================================================
   PAGE
========================================================= */

export default function NewJournalEntryPage() {
  const router = useRouter();

  /* =======================================================
     STORE
  ======================================================= */

  const accounts = useERPStore((state) => state.accounts);
  const journalEntries = useERPStore((state) => state.journalEntries);
  const addJournalEntry = useERPStore((state) => state.addJournalEntry);

  /* =======================================================
     STATE
  ======================================================= */

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

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
     ACTIVE ACCOUNTS
  ======================================================= */

  const activeAccounts = useMemo<AccountOption[]>(() => {
    return accounts
      .filter(
        (account) => account.isActive !== false && account.isGroup !== true,
      )
      .sort((a, b) =>
        String(a.code).localeCompare(String(b.code), undefined, {
          numeric: true,
        }),
      );
  }, [accounts]);

  /* =======================================================
     FILTER ACCOUNT OPTIONS
  ======================================================= */

  const getFilteredAccounts = (lineId: string) => {
    const search = String(searches[lineId] || "")
      .trim()
      .toLowerCase();

    if (!search) {
      return activeAccounts.slice(0, 40);
    }

    return activeAccounts
      .filter((account) => {
        const code = String(account.code || "").toLowerCase();
        const name = String(account.name || "").toLowerCase();

        return code.includes(search) || name.includes(search);
      })
      .slice(0, 40);
  };

  /* =======================================================
     SELECTED ACCOUNT
  ======================================================= */

  const getSelectedAccount = (accountId: string) => {
    return accounts.find((account) => account.id === accountId);
  };

  /* =======================================================
     TOTALS
  ======================================================= */

  const totals = useMemo(() => {
    let debit = 0;
    let credit = 0;

    lines.forEach((line) => {
      debit += Number(line.debit || 0);
      credit += Number(line.credit || 0);
    });

    return {
      debit,
      credit,
      difference: debit - credit,
      balanced: debit > 0 && credit > 0 && Math.abs(debit - credit) < 0.001,
    };
  }, [lines]);

  /* =======================================================
     NEXT ENTRY NUMBER
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
     ADD LINE
  ======================================================= */

  const addLine = () => {
    setLines((current) => [...current, createEmptyLine()]);
  };

  /* =======================================================
     REMOVE LINE
  ======================================================= */

  const removeLine = (lineId: string) => {
    if (lines.length <= 2) {
      toast.error("يجب أن يحتوي القيد على سطرين على الأقل");
      return;
    }

    setLines((current) => current.filter((line) => line.id !== lineId));

    setSearches((current) => {
      const copy = { ...current };
      delete copy[lineId];
      return copy;
    });

    setOpenAccountLine((current) => (current === lineId ? null : current));
  };

  /* =======================================================
     UPDATE LINE
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

        return {
          ...line,
          [field]: value,
        };
      }),
    );
  };

  /* =======================================================
     DEBIT CHANGE
  ======================================================= */

  const handleDebitChange = (lineId: string, value: string) => {
    setLines((current) =>
      current.map((line) => {
        if (line.id !== lineId) {
          return line;
        }

        return {
          ...line,
          debit: value,
          credit: value ? "" : line.credit,
        };
      }),
    );
  };

  /* =======================================================
     CREDIT CHANGE
  ======================================================= */

  const handleCreditChange = (lineId: string, value: string) => {
    setLines((current) =>
      current.map((line) => {
        if (line.id !== lineId) {
          return line;
        }

        return {
          ...line,
          credit: value,
          debit: value ? "" : line.debit,
        };
      }),
    );
  };

  /* =======================================================
     ACCOUNT SEARCH
  ======================================================= */

  const handleAccountSearch = (lineId: string, value: string) => {
    setSearches((current) => ({
      ...current,
      [lineId]: value,
    }));

    setOpenAccountLine(lineId);

    setLines((current) =>
      current.map((line) => {
        if (line.id !== lineId) {
          return line;
        }

        const selectedAccount = getSelectedAccount(line.accountId);

        const selectedText = selectedAccount
          ? `${selectedAccount.code} - ${selectedAccount.name}`
          : "";

        if (value !== selectedText) {
          return {
            ...line,
            accountId: "",
          };
        }

        return line;
      }),
    );
  };

  /* =======================================================
     SELECT ACCOUNT
  ======================================================= */

  const handleSelectAccount = (lineId: string, accountId: string) => {
    const account = getSelectedAccount(accountId);

    if (!account) return;

    setLines((current) =>
      current.map((line) =>
        line.id === lineId
          ? {
              ...line,
              accountId: account.id,
            }
          : line,
      ),
    );

    setSearches((current) => ({
      ...current,
      [lineId]: `${account.code} - ${account.name}`,
    }));

    setOpenAccountLine(null);
  };

  /* =======================================================
     CLEAR FORM
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
     VALIDATE
  ======================================================= */

  const validate = () => {
    if (!date) {
      toast.error("يرجى اختيار تاريخ القيد");
      return false;
    }

    if (!description.trim()) {
      toast.error("يرجى إدخال بيان القيد");
      return false;
    }

    if (lines.length < 2) {
      toast.error("يجب أن يحتوي القيد على سطرين على الأقل");
      return false;
    }

    const usedAccounts = new Set<string>();

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];

      if (!line.accountId) {
        toast.error(`يرجى اختيار الحساب في السطر ${index + 1}`);
        return false;
      }

      if (usedAccounts.has(line.accountId)) {
        toast.error(`الحساب مكرر في السطر ${index + 1}`);
        return false;
      }

      usedAccounts.add(line.accountId);

      const debit = Number(line.debit || 0);
      const credit = Number(line.credit || 0);

      if (debit < 0 || credit < 0) {
        toast.error(`لا يمكن إدخال مبلغ سالب في السطر ${index + 1}`);
        return false;
      }

      if (debit === 0 && credit === 0) {
        toast.error(`يرجى إدخال مبلغ مدين أو دائن في السطر ${index + 1}`);
        return false;
      }

      if (debit > 0 && credit > 0) {
        toast.error(`لا يمكن أن يحتوي السطر ${index + 1} على مدين ودائن معًا`);
        return false;
      }
    }

    if (totals.debit <= 0) {
      toast.error("يجب أن يحتوي القيد على مبلغ مدين");
      return false;
    }

    if (totals.credit <= 0) {
      toast.error("يجب أن يحتوي القيد على مبلغ دائن");
      return false;
    }

    if (Math.abs(totals.debit - totals.credit) > 0.001) {
      toast.error(
        `القيد غير متوازن. الفرق: ${formatMoney(Math.abs(totals.difference))}`,
      );
      return false;
    }

    return true;
  };

  /* =======================================================
     SAVE
  ======================================================= */

  const handleSave = () => {
    if (isSaving) return;

    if (!validate()) {
      return;
    }

    setIsSaving(true);

    try {
      /*
       * نحتفظ بهذا المعرف لاستخدامه في رابط الطباعة.
       * أما Store فهو الذي ينشئ معرف القيد الفعلي.
       */
      const journalEntryId = createLineId();

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

      /*
       * مهم:
       * addJournalEntry لا يستقبل id أو createdAt
       * لأن الـ Store يقوم بإنشائهما داخليًا.
       */
      addJournalEntry({
        entryNumber: nextEntryNumber,
        date,
        description: description.trim(),
        referenceType,
        referenceId: referenceId.trim() || undefined,
        lines: journalLines,
      });

      toast.success("تم حفظ القيد بنجاح", {
        description: `رقم القيد: ${nextEntryNumber}`,
        duration: 8000,
        action: {
          label: "عرض سند القيد",
          onClick: () => {
            router.push(`/accounting/journal/${journalEntryId}/print`);
          },
        },
      });

      resetForm();
    } catch (error) {
      console.error(error);

      toast.error(
        error instanceof Error ? error.message : "حدث خطأ أثناء حفظ القيد",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-50 px-2.5 py-3 sm:px-4 sm:py-4 lg:px-5"
    >
      <div className="mx-auto max-w-7xl">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <Link
              href="/accounting/journal"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50"
              title="العودة للقيود"
            >
              <FiArrowRight size={17} />
            </Link>

            <div>
              <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
                قيد يومي جديد
              </h1>

              <p className="mt-0.5 text-xs text-gray-500">
                إنشاء قيد محاسبي جديد
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <FiRefreshCw size={15} />
              إعادة ضبط
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !totals.balanced}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-[#0E1F33] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#162b43] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiSave size={15} />

              {isSaving ? "جاري الحفظ..." : "حفظ القيد"}
            </button>
          </div>
        </div>

        {/* =================================================
            ENTRY INFO
        ================================================= */}

        <section className="mb-4 rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm sm:p-4">
          <div className="mb-4 flex items-center gap-2">
            <FiFileText size={17} className="text-blue-600" />

            <h2 className="text-sm font-bold text-gray-800">بيانات القيد</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {/* Entry number */}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                رقم القيد
              </label>

              <input
                type="text"
                value={nextEntryNumber}
                readOnly
                className="h-10 w-full rounded-lg border border-gray-200 bg-gray-100 px-3 text-xs font-bold text-gray-700 outline-none"
              />
            </div>

            {/* Date */}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                التاريخ
              </label>

              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Reference type */}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                نوع المرجع
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
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="manual">قيد يدوي</option>
                <option value="sale">مبيعات</option>
                <option value="purchase">مشتريات</option>
                <option value="payment">سند صرف</option>
                <option value="receipt">سند قبض</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            {/* Reference ID */}

            <div>
              <label className="mb-1.5 block text-xs font-semibold text-gray-700">
                رقم المرجع
                <span className="mr-1 text-[10px] font-normal text-gray-400">
                  اختياري
                </span>
              </label>

              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="مثال: INV-1001"
                className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          {/* Description */}

          <div className="mt-3">
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">
              بيان القيد
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="اكتب وصف القيد أو سبب العملية..."
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </section>

        {/* =================================================
            JOURNAL LINES
        ================================================= */}

        <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {/* Section header */}

          <div className="flex flex-col gap-2.5 border-b border-gray-200 p-3.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-800">تفاصيل القيد</h2>

              <p className="mt-0.5 text-[11px] text-gray-500">
                اختر الحساب ثم أدخل المبلغ المدين أو الدائن
              </p>
            </div>

            <button
              type="button"
              onClick={addLine}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-blue-700"
            >
              <FiPlus size={15} />
              إضافة سطر
            </button>
          </div>

          {/* =================================================
              TABLE
          ================================================= */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs">
                  <th className="w-10 border-b border-l border-gray-200 px-2.5 py-2.5 text-center">
                    #
                  </th>

                  <th className="border-b border-l border-gray-200 px-2.5 py-2.5 text-right">
                    الحساب
                  </th>

                  <th className="w-40 border-b border-l border-gray-200 px-2.5 py-2.5">
                    مدين
                  </th>

                  <th className="w-40 border-b border-l border-gray-200 px-2.5 py-2.5">
                    دائن
                  </th>

                  <th className="border-b border-l border-gray-200 px-2.5 py-2.5 text-right">
                    البيان
                  </th>

                  <th className="w-12 border-b border-gray-200 px-2.5 py-2.5">
                    حذف
                  </th>
                </tr>
              </thead>

              <tbody>
                {lines.map((line, index) => {
                  const selectedAccount = getSelectedAccount(line.accountId);

                  const filteredAccounts = getFilteredAccounts(line.id);

                  return (
                    <tr key={line.id} className="align-top hover:bg-gray-50/50">
                      {/* Number */}

                      <td className="border-b border-l border-gray-200 px-2.5 py-3 text-center text-xs font-bold text-gray-500">
                        {index + 1}
                      </td>

                      {/* Account */}

                      <td className="relative border-b border-l border-gray-200 px-2.5 py-3">
                        <div className="relative">
                          <FiSearch
                            size={14}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400"
                          />

                          <input
                            type="text"
                            value={
                              searches[line.id] ??
                              (selectedAccount
                                ? `${selectedAccount.code} - ${selectedAccount.name}`
                                : "")
                            }
                            onChange={(e) =>
                              handleAccountSearch(line.id, e.target.value)
                            }
                            onFocus={() => setOpenAccountLine(line.id)}
                            placeholder="ابحث عن الحساب..."
                            className={`h-9 w-full rounded-lg border ${
                              line.accountId
                                ? "border-green-300 bg-green-50/30"
                                : "border-gray-300 bg-white"
                            } py-2 pr-8 pl-2.5 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100`}
                          />
                        </div>

                        {/* Account dropdown */}

                        {openAccountLine === line.id && (
                          <div className="absolute right-2.5 left-2.5 top-[calc(100%-6px)] z-50 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-xl">
                            {filteredAccounts.length === 0 ? (
                              <div className="p-3 text-center text-xs text-gray-500">
                                لا توجد حسابات مطابقة
                              </div>
                            ) : (
                              filteredAccounts.map((account) => (
                                <button
                                  key={account.id}
                                  type="button"
                                  onClick={() =>
                                    handleSelectAccount(line.id, account.id)
                                  }
                                  className="flex w-full items-center justify-between border-b border-gray-100 px-3 py-2.5 text-right transition last:border-b-0 hover:bg-blue-50"
                                >
                                  <div>
                                    <p className="text-xs font-bold text-gray-800">
                                      {account.name}
                                    </p>

                                    <p className="mt-0.5 text-[10px] text-gray-500">
                                      {account.code}
                                    </p>
                                  </div>

                                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-600">
                                    {accountTypeLabel(account.type)}
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        )}

                        {selectedAccount && (
                          <p className="mt-1 text-[10px] text-green-600">
                            طبيعة الحساب:{" "}
                            {selectedAccount.nature === "debit"
                              ? "مدين"
                              : "دائن"}
                          </p>
                        )}
                      </td>

                      {/* Debit */}

                      <td className="border-b border-l border-gray-200 px-2.5 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.debit}
                          onChange={(e) =>
                            handleDebitChange(line.id, e.target.value)
                          }
                          placeholder="0.00"
                          className="h-9 w-full rounded-lg border border-blue-200 bg-blue-50/30 px-2.5 text-left text-xs font-semibold text-blue-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </td>

                      {/* Credit */}

                      <td className="border-b border-l border-gray-200 px-2.5 py-3">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={line.credit}
                          onChange={(e) =>
                            handleCreditChange(line.id, e.target.value)
                          }
                          placeholder="0.00"
                          className="h-9 w-full rounded-lg border border-green-200 bg-green-50/30 px-2.5 text-left text-xs font-semibold text-green-800 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100"
                        />
                      </td>

                      {/* Description */}

                      <td className="border-b border-l border-gray-200 px-2.5 py-3">
                        <input
                          type="text"
                          value={line.description}
                          onChange={(e) =>
                            updateLine(line.id, "description", e.target.value)
                          }
                          placeholder="بيان السطر..."
                          className="h-9 w-full rounded-lg border border-gray-300 bg-white px-2.5 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                      </td>

                      {/* Delete */}

                      <td className="border-b border-gray-200 px-2.5 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeLine(line.id)}
                          className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg text-red-500 transition hover:bg-red-50 hover:text-red-700"
                          title="حذف السطر"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>

              {/* =================================================
                  TOTALS
              ================================================= */}

              <tfoot>
                <tr className="bg-gray-50">
                  <td
                    colSpan={2}
                    className="border-l border-gray-200 px-3 py-3 text-left text-xs font-bold text-gray-700"
                  >
                    الإجمالي
                  </td>

                  <td className="border-l border-gray-200 px-3 py-3 text-center text-xs font-bold text-blue-700">
                    {formatMoney(totals.debit)}
                  </td>

                  <td className="border-l border-gray-200 px-3 py-3 text-center text-xs font-bold text-green-700">
                    {formatMoney(totals.credit)}
                  </td>

                  <td colSpan={2} className="px-3 py-3" />
                </tr>
              </tfoot>
            </table>
          </div>
        </section>

        {/* =================================================
            BALANCE STATUS
        ================================================= */}

        <section className="mt-4">
          {totals.balanced ? (
            <div className="flex flex-col gap-2.5 rounded-xl border border-green-200 bg-green-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100">
                  <FiCheckCircle size={19} className="text-green-600" />
                </div>

                <div>
                  <p className="text-xs font-bold text-green-800">
                    القيد متوازن
                  </p>

                  <p className="mt-0.5 text-[10px] text-green-700">
                    إجمالي المدين يساوي إجمالي الدائن
                  </p>
                </div>
              </div>

              <div className="text-xs font-bold text-green-800">
                {formatMoney(totals.debit)} ريال
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 rounded-xl border border-orange-200 bg-orange-50 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange-100">
                  <FiAlertCircle size={19} className="text-orange-600" />
                </div>

                <div>
                  <p className="text-xs font-bold text-orange-800">
                    القيد غير متوازن
                  </p>

                  <p className="mt-0.5 text-[10px] text-orange-700">
                    يجب أن يكون إجمالي المدين مساويًا لإجمالي الدائن
                  </p>
                </div>
              </div>

              <div className="text-xs font-bold text-orange-800">
                الفرق: {formatMoney(Math.abs(totals.difference))} ريال
              </div>
            </div>
          )}
        </section>

        {/* =================================================
            BOTTOM ACTIONS
        ================================================= */}

        <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:justify-end">
          <Link
            href="/accounting/journal"
            className="flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
          >
            <FiArrowRight size={15} />
            إلغاء والعودة
          </Link>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !totals.balanced}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[#0E1F33] px-6 py-2.5 text-xs font-bold text-white transition hover:bg-[#162b43] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiSave size={15} />

            {isSaving ? "جاري الحفظ..." : "حفظ القيد"}
          </button>
        </div>

        {/* =================================================
            COMPANY FOOTER
        ================================================= */}

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-3 text-center">
          <p className="text-xs font-bold text-gray-700">شركة الجابري</p>

          <p className="mt-0.5 text-[10px] text-gray-500">
            للعسل والزيوت الطبيعة وخدمات العمرة
          </p>

          <p className="mt-0.5 text-[10px] text-gray-400">
            البيضاء - اليمن | هاتف: 734 434 443
          </p>
        </div>
      </div>
    </main>
  );
}
