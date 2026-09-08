"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  FiArrowRight,
  FiPlus,
  FiTrash2,
  FiSave,
  FiRefreshCw,
  FiFileText,
  FiCheckCircle,
} from "react-icons/fi";

import { useERPStore, type JournalLine } from "@/Store/erpStore";

// =====================================================
// نوع سطر النموذج
// =====================================================

type FormJournalLine = {
  id: number;
  account: string;
  description: string;
  debit: string;
  credit: string;
};

// =====================================================
// الحسابات
// =====================================================

const accounts = [
  {
    code: "1101",
    name: "الصندوق",
  },
  {
    code: "1102",
    name: "البنك",
  },
  {
    code: "1103",
    name: "العملاء",
  },
  {
    code: "1104",
    name: "المخزون",
  },
  {
    code: "2101",
    name: "الموردون",
  },
  {
    code: "3101",
    name: "رأس المال",
  },
  {
    code: "4101",
    name: "المبيعات",
  },
  {
    code: "4102",
    name: "إيرادات خدمات العمرة",
  },
  {
    code: "5101",
    name: "الرواتب",
  },
  {
    code: "5102",
    name: "الإيجار",
  },
  {
    code: "5103",
    name: "الكهرباء",
  },
  {
    code: "5201",
    name: "تكلفة المبيعات",
  },
  {
    code: "5202",
    name: "تكلفة خدمات العمرة",
  },
];

// =====================================================
// الصفحة
// =====================================================

export default function EditJournalEntryPage() {
  const params = useParams();
  const router = useRouter();

  // ===================================================
  // ID القيد
  // ===================================================

  const entryId = String(params.id);

  // ===================================================
  // Zustand
  // ===================================================

  const entry = useERPStore((state) =>
    state.journalEntries.find((item) => item.id === entryId),
  );

  const updateJournalEntry = useERPStore((state) => state.updateJournalEntry);

  // ===================================================
  // البيانات المحلية للنموذج
  // ===================================================

  const [initialized, setInitialized] = useState(false);

  const [date, setDate] = useState("");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");

  const [lines, setLines] = useState<FormJournalLine[]>([]);

  // ===================================================
  // تحميل القيد من Zustand إلى النموذج
  // ===================================================

  if (entry && !initialized) {
    setDate(entry.date);
    setReference(entry.reference);
    setDescription(entry.description);

    setLines(
      entry.lines.map((line, index) => ({
        id: Number(line.id.replace(/\D/g, "")) || Date.now() + index,

        account: line.accountCode,

        description: line.description,

        debit: line.debit > 0 ? String(line.debit) : "",

        credit: line.credit > 0 ? String(line.credit) : "",
      })),
    );

    setInitialized(true);
  }

  // ===================================================
  // الحسابات
  // ===================================================

  const getAccountName = (accountCode: string) => {
    return (
      accounts.find((account) => account.code === accountCode)?.name ??
      "حساب غير معروف"
    );
  };

  // ===================================================
  // إضافة سطر
  // ===================================================

  const addLine = () => {
    setLines((currentLines) => [
      ...currentLines,
      {
        id: Date.now(),
        account: "",
        description: "",
        debit: "",
        credit: "",
      },
    ]);
  };

  // ===================================================
  // حذف سطر
  // ===================================================

  const removeLine = (id: number) => {
    if (lines.length <= 2) {
      alert("يجب أن يحتوي القيد على سطرين على الأقل");

      return;
    }

    setLines((currentLines) => currentLines.filter((line) => line.id !== id));
  };

  // ===================================================
  // تحديث السطر
  // ===================================================

  const updateLine = (
    id: number,
    field: keyof FormJournalLine,
    value: string,
  ) => {
    setLines((currentLines) =>
      currentLines.map((line) =>
        line.id === id
          ? {
              ...line,
              [field]: value,
            }
          : line,
      ),
    );
  };

  // ===================================================
  // تغيير المدين
  // ===================================================

  const handleDebitChange = (id: number, value: string) => {
    setLines((currentLines) =>
      currentLines.map((line) =>
        line.id === id
          ? {
              ...line,
              debit: value,
              credit: value !== "" ? "" : line.credit,
            }
          : line,
      ),
    );
  };

  // ===================================================
  // تغيير الدائن
  // ===================================================

  const handleCreditChange = (id: number, value: string) => {
    setLines((currentLines) =>
      currentLines.map((line) =>
        line.id === id
          ? {
              ...line,
              credit: value,
              debit: value !== "" ? "" : line.debit,
            }
          : line,
      ),
    );
  };

  // ===================================================
  // إجمالي المدين
  // ===================================================

  const totalDebit = lines.reduce(
    (sum, line) => sum + Number(line.debit || 0),
    0,
  );

  // ===================================================
  // إجمالي الدائن
  // ===================================================

  const totalCredit = lines.reduce(
    (sum, line) => sum + Number(line.credit || 0),
    0,
  );

  // ===================================================
  // الفرق
  // ===================================================

  const difference = totalDebit - totalCredit;

  // ===================================================
  // التوازن
  // ===================================================

  const isBalanced = totalDebit > 0 && totalDebit === totalCredit;

  // ===================================================
  // التحقق من الأسطر
  // ===================================================

  const hasInvalidLines = lines.some((line) => {
    const debit = Number(line.debit || 0);

    const credit = Number(line.credit || 0);

    return (
      !line.account ||
      (debit === 0 && credit === 0) ||
      (debit > 0 && credit > 0)
    );
  });

  // ===================================================
  // إعادة النموذج للقيم الأصلية
  // ===================================================

  const resetForm = () => {
    if (!entry) {
      return;
    }

    setDate(entry.date);

    setReference(entry.reference);

    setDescription(entry.description);

    setLines(
      entry.lines.map((line, index) => ({
        id: Number(line.id.replace(/\D/g, "")) || Date.now() + index,

        account: line.accountCode,

        description: line.description,

        debit: line.debit > 0 ? String(line.debit) : "",

        credit: line.credit > 0 ? String(line.credit) : "",
      })),
    );
  };

  // ===================================================
  // حفظ التعديلات
  // ===================================================

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!entry) {
      alert("القيد غير موجود.");
      return;
    }

    // -----------------------------------------------
    // التحقق من البيان
    // -----------------------------------------------

    if (!description.trim()) {
      alert("يرجى إدخال بيان القيد.");

      return;
    }

    // -----------------------------------------------
    // التحقق من الأسطر
    // -----------------------------------------------

    if (hasInvalidLines) {
      alert(
        "يرجى التأكد من اختيار الحساب وإدخال مبلغ مدين أو دائن لكل سطر، وعدم إدخال المدين والدائن في نفس السطر.",
      );

      return;
    }

    // -----------------------------------------------
    // التحقق من التوازن
    // -----------------------------------------------

    if (!isBalanced) {
      alert("لا يمكن حفظ التعديلات لأن القيد غير متوازن.");

      return;
    }

    // -----------------------------------------------
    // تحويل الأسطر إلى JournalLine
    // -----------------------------------------------

    const journalLines: JournalLine[] = lines.map((line) => ({
      id: line.id.toString(),

      accountCode: line.account,

      accountName: getAccountName(line.account),

      description: line.description.trim(),

      debit: Number(line.debit || 0),

      credit: Number(line.credit || 0),
    }));

    // -----------------------------------------------
    // تحديث القيد في Zustand
    // -----------------------------------------------

    updateJournalEntry(entry.id, {
      date,

      reference: reference.trim(),

      description: description.trim(),

      debit: totalDebit,

      credit: totalCredit,

      lines: journalLines,
    });

    // -----------------------------------------------
    // نجاح
    // -----------------------------------------------

    alert(`تم تحديث القيد ${entry.number} بنجاح.`);

    // -----------------------------------------------
    // الانتقال للتفاصيل
    // -----------------------------------------------

    router.push(`/accounting/journal/${entry.id}`);
  };

  // ===================================================
  // القيد غير موجود
  // ===================================================

  if (!entry) {
    return (
      <main dir="rtl" className="min-h-screen bg-gray-100 p-4 md:p-6">
        <div className="max-w-2xl mx-auto mt-20 bg-white border border-gray-200 rounded-xl shadow-sm p-10 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-5">
            <FiFileText size={28} />
          </div>

          <h1 className="text-xl font-bold text-gray-900">القيد غير موجود</h1>

          <p className="text-sm text-gray-500 mt-2">
            لم يتم العثور على القيد المطلوب في Zustand.
          </p>

          <Link
            href="/accounting/journal"
            className="inline-flex items-center gap-2 mt-6 bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-lg font-semibold transition"
          >
            <FiArrowRight size={18} />
            العودة إلى القيود
          </Link>
        </div>
      </main>
    );
  }

  // ===================================================
  // العرض
  // ===================================================

  return (
    <main dir="rtl" className="min-h-screen bg-gray-100 p-4 md:p-6">
      {/* =================================================
          HEADER
      ================================================= */}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-6">
        <div>
          {/* Breadcrumb */}

          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Link
              href="/accounting"
              className="hover:text-amber-600 transition"
            >
              المحاسبة
            </Link>

            <FiArrowRight size={14} />

            <Link
              href="/accounting/journal"
              className="hover:text-amber-600 transition"
            >
              القيود اليومية
            </Link>

            <FiArrowRight size={14} />

            <Link
              href={`/accounting/journal/${entry.id}`}
              className="hover:text-amber-600 transition"
            >
              {entry.number}
            </Link>

            <FiArrowRight size={14} />

            <span className="text-gray-800 font-medium">تعديل</span>
          </div>

          {/* Title */}

          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              تعديل القيد
            </h1>

            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
              <FiCheckCircle size={14} />

              {entry.number}
            </span>
          </div>

          <p className="text-sm text-gray-500 mt-2">
            تعديل بيانات القيد المحاسبي والحركات المرتبطة به
          </p>
        </div>

        {/* Back */}

        <Link
          href={`/accounting/journal/${entry.id}`}
          className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-lg text-sm font-semibold transition"
        >
          <FiArrowRight size={18} />
          العودة للتفاصيل
        </Link>
      </div>

      {/* =================================================
          FORM
      ================================================= */}

      <form onSubmit={handleSubmit}>
        {/* =================================================
            BASIC INFORMATION
        ================================================= */}

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
          <div className="p-5 md:p-6 border-b-2 border-gray-200">
            <div className="flex items-center gap-2">
              <FiFileText size={20} className="text-amber-600" />

              <div>
                <h2 className="font-bold text-gray-900">بيانات القيد</h2>

                <p className="text-sm text-gray-500 mt-1">
                  تعديل المعلومات الأساسية للقيد
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* التاريخ */}

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  تاريخ القيد
                </label>

                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                  className="w-full h-12 bg-gray-50 border-2 border-gray-300 rounded-lg px-4 text-sm text-gray-900 font-medium outline-none hover:border-gray-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                />
              </div>

              {/* المرجع */}

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  رقم المرجع
                </label>

                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="مثال: INV-10025"
                  className="w-full h-12 bg-gray-50 border-2 border-gray-300 rounded-lg px-4 text-sm text-gray-900 font-medium placeholder:text-gray-400 outline-none hover:border-gray-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                />
              </div>

              {/* البيان */}

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">
                  بيان القيد
                </label>

                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full h-12 bg-gray-50 border-2 border-gray-300 rounded-lg px-4 text-sm text-gray-900 font-medium outline-none hover:border-gray-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                />
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            JOURNAL LINES
        ================================================= */}

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Header */}

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 md:p-6 border-b-2 border-gray-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900">تفاصيل القيد</h2>

              <p className="text-sm text-gray-500 mt-1">
                قم بتعديل الحسابات والمبالغ المدينة والدائنة
              </p>
            </div>

            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-lg text-sm font-semibold transition"
            >
              <FiPlus size={18} />
              إضافة سطر
            </button>
          </div>

          {/* Table */}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px]">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
                  <th className="px-5 py-4 text-right text-sm font-bold text-gray-800">
                    #
                  </th>

                  <th className="px-5 py-4 text-right text-sm font-bold text-gray-800">
                    الحساب
                  </th>

                  <th className="px-5 py-4 text-right text-sm font-bold text-gray-800">
                    البيان
                  </th>

                  <th className="px-5 py-4 text-right text-sm font-bold text-gray-800">
                    مدين
                  </th>

                  <th className="px-5 py-4 text-right text-sm font-bold text-gray-800">
                    دائن
                  </th>

                  <th className="px-5 py-4 text-center text-sm font-bold text-gray-800">
                    حذف
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {lines.map((line, index) => (
                  <tr key={line.id} className="hover:bg-gray-50 transition">
                    {/* Number */}

                    <td className="px-5 py-4">
                      <span className="w-8 h-8 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                    </td>

                    {/* Account */}

                    <td className="px-5 py-4">
                      <select
                        value={line.account}
                        onChange={(e) =>
                          updateLine(line.id, "account", e.target.value)
                        }
                        required
                        className="w-full h-12 bg-gray-50 border-2 border-gray-300 rounded-lg px-3 text-sm text-gray-900 font-medium outline-none hover:border-gray-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                      >
                        <option value="">اختر الحساب</option>

                        {accounts.map((account) => (
                          <option key={account.code} value={account.code}>
                            {account.code} - {account.name}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Description */}

                    <td className="px-5 py-4">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) =>
                          updateLine(line.id, "description", e.target.value)
                        }
                        placeholder="بيان السطر"
                        className="w-full h-12 bg-gray-50 border-2 border-gray-300 rounded-lg px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none hover:border-gray-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                      />
                    </td>

                    {/* Debit */}

                    <td className="px-5 py-4">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.debit}
                        onChange={(e) =>
                          handleDebitChange(line.id, e.target.value)
                        }
                        placeholder="0.00"
                        className="w-full h-12 bg-white border-2 border-gray-400 rounded-lg px-4 text-sm text-gray-900 font-bold placeholder:text-gray-400 outline-none hover:border-gray-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                      />
                    </td>

                    {/* Credit */}

                    <td className="px-5 py-4">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.credit}
                        onChange={(e) =>
                          handleCreditChange(line.id, e.target.value)
                        }
                        placeholder="0.00"
                        className="w-full h-12 bg-white border-2 border-gray-400 rounded-lg px-4 text-sm text-gray-900 font-bold placeholder:text-gray-400 outline-none hover:border-gray-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                      />
                    </td>

                    {/* Delete */}

                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        disabled={lines.length <= 2}
                        className="w-10 h-10 inline-flex items-center justify-center rounded-lg border border-gray-200 text-red-500 hover:bg-red-50 hover:border-red-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              {/* Totals */}

              <tfoot>
                <tr className="bg-gray-100 border-t-2 border-gray-300">
                  <td
                    colSpan={3}
                    className="px-5 py-5 text-left font-bold text-gray-900"
                  >
                    الإجمالي
                  </td>

                  <td className="px-5 py-5">
                    <div className="bg-white border-2 border-gray-400 rounded-lg px-4 py-3 font-bold text-gray-900">
                      {totalDebit.toLocaleString("ar-SA")} ريال
                    </div>
                  </td>

                  <td className="px-5 py-5">
                    <div className="bg-white border-2 border-gray-400 rounded-lg px-4 py-3 font-bold text-gray-900">
                      {totalCredit.toLocaleString("ar-SA")} ريال
                    </div>
                  </td>

                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* =================================================
              BALANCE
          ================================================= */}

          <div className="p-5 md:p-6 border-t-2 border-gray-200">
            <div
              className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border-2 ${
                isBalanced
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div>
                <div
                  className={`flex items-center gap-2 font-bold ${
                    isBalanced ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {isBalanced ? (
                    <FiCheckCircle size={20} />
                  ) : (
                    <FiRefreshCw size={20} />
                  )}

                  {isBalanced ? "القيد متوازن" : "القيد غير متوازن"}
                </div>

                <p
                  className={`text-sm mt-2 ${
                    isBalanced ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isBalanced
                    ? "إجمالي المدين يساوي إجمالي الدائن"
                    : "يجب أن يتساوى إجمالي المدين مع إجمالي الدائن"}
                </p>
              </div>

              <div
                className={`text-lg font-bold ${
                  isBalanced ? "text-green-700" : "text-red-700"
                }`}
              >
                الفرق:
                <span className="mr-2">
                  {Math.abs(difference).toLocaleString("ar-SA")} ريال
                </span>
              </div>
            </div>
          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="flex flex-col sm:flex-row justify-between gap-3 p-5 md:p-6 border-t-2 border-gray-200">
            <Link
              href={`/accounting/journal/${entry.id}`}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold text-sm transition"
            >
              <FiArrowRight size={17} />
              إلغاء
            </Link>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold text-sm transition"
              >
                <FiRefreshCw size={17} />
                استعادة
              </button>

              <button
                type="submit"
                disabled={!isBalanced || hasInvalidLines}
                className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition"
              >
                <FiSave size={18} />
                حفظ التعديلات
              </button>
            </div>
          </div>
        </section>
      </form>
    </main>
  );
}
