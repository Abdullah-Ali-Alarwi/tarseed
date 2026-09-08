"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FiArrowRight,
  FiPlus,
  FiTrash2,
  FiSave,
  FiRefreshCw,
} from "react-icons/fi";

import {
  useERPStore,
  type JournalLine,
  type JournalStatus,
} from "@/Store/erpStore";

type FormJournalLine = {
  id: number;
  account: string;
  description: string;
  debit: string;
  credit: string;
};

const accounts = [
  { code: "1101", name: "الصندوق" },
  { code: "1102", name: "البنك" },
  { code: "1103", name: "العملاء" },
  { code: "1104", name: "المخزون" },
  { code: "2101", name: "الموردون" },
  { code: "3101", name: "رأس المال" },
  { code: "4101", name: "المبيعات" },
  { code: "4102", name: "إيرادات خدمات العمرة" },
  { code: "5101", name: "الرواتب" },
  { code: "5102", name: "الإيجار" },
  { code: "5103", name: "الكهرباء" },
  { code: "5201", name: "تكلفة المبيعات" },
  { code: "5202", name: "تكلفة خدمات العمرة" },
];

export default function NewJournalEntryPage() {
  const addJournalEntry = useERPStore((state) => state.addJournalEntry);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");

  const [lines, setLines] = useState<FormJournalLine[]>([
    {
      id: 1,
      account: "",
      description: "",
      debit: "",
      credit: "",
    },
    {
      id: 2,
      account: "",
      description: "",
      debit: "",
      credit: "",
    },
  ]);

  const getAccountName = (accountCode: string) => {
    return (
      accounts.find((account) => account.code === accountCode)?.name ||
      "حساب غير معروف"
    );
  };

  const addLine = () => {
    setLines((currentLines) => [
      ...currentLines,
      {
        id: Date.now() + Math.floor(Math.random() * 10000),
        account: "",
        description: "",
        debit: "",
        credit: "",
      },
    ]);
  };

  const removeLine = (id: number) => {
    if (lines.length <= 2) {
      return;
    }

    setLines((currentLines) => currentLines.filter((line) => line.id !== id));
  };

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

  const handleDebitChange = (id: number, value: string) => {
    setLines((currentLines) =>
      currentLines.map((line) =>
        line.id === id
          ? {
              ...line,
              debit: value,
              credit: value ? "" : line.credit,
            }
          : line,
      ),
    );
  };

  const handleCreditChange = (id: number, value: string) => {
    setLines((currentLines) =>
      currentLines.map((line) =>
        line.id === id
          ? {
              ...line,
              credit: value,
              debit: value ? "" : line.debit,
            }
          : line,
      ),
    );
  };

  const totalDebit = lines.reduce(
    (sum, line) => sum + (Number(line.debit) || 0),
    0,
  );

  const totalCredit = lines.reduce(
    (sum, line) => sum + (Number(line.credit) || 0),
    0,
  );

  const difference = totalDebit - totalCredit;

  const isBalanced = totalDebit > 0 && totalDebit === totalCredit;

  const hasInvalidLines = lines.some((line) => {
    const debit = Number(line.debit) || 0;
    const credit = Number(line.credit) || 0;

    return (
      !line.account ||
      (debit === 0 && credit === 0) ||
      (debit > 0 && credit > 0)
    );
  });

  const buildJournalLines = (): JournalLine[] => {
    return lines
      .filter((line) => line.account)
      .map((line) => ({
        id: String(line.id),
        accountCode: line.account,
        accountName: getAccountName(line.account),
        description: line.description.trim() || description.trim(),
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
      }));
  };

  const generateJournalNumber = () => {
    return `JE-${Date.now()}`;
  };

  const generateCreatedAt = () => {
    return new Date().toLocaleString("ar-SA", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const validateForm = () => {
    if (!date) {
      alert("يرجى اختيار تاريخ القيد.");
      return false;
    }

    if (!description.trim()) {
      alert("يرجى إدخال بيان القيد.");
      return false;
    }

    if (hasInvalidLines) {
      alert(
        "يرجى التأكد من اختيار الحساب وإدخال مبلغ مدين أو دائن لكل سطر، وعدم إدخال المدين والدائن في نفس السطر.",
      );
      return false;
    }

    return true;
  };

  const saveEntry = (status: JournalStatus) => {
    if (!validateForm()) {
      return;
    }

    if (status === "posted" && !isBalanced) {
      alert(
        "لا يمكن ترحيل القيد. يجب أن يتساوى إجمالي المدين مع إجمالي الدائن.",
      );
      return;
    }

    const journalNumber = generateJournalNumber();

    const journalLines = buildJournalLines();

    addJournalEntry({
      number: journalNumber,
      date,
      reference: reference.trim() || journalNumber,
      description: description.trim(),
      debit: totalDebit,
      credit: totalCredit,
      status,
      user: "Admin",
      createdAt: generateCreatedAt(),
      lines: journalLines,
    });

    if (status === "posted") {
      alert(`تم حفظ وترحيل القيد ${journalNumber} بنجاح.`);
    } else {
      alert(`تم حفظ القيد ${journalNumber} كمسودة.`);
    }

    setReference("");
    setDescription("");

    setLines([
      {
        id: Date.now(),
        account: "",
        description: "",
        debit: "",
        credit: "",
      },
      {
        id: Date.now() + 1,
        account: "",
        description: "",
        debit: "",
        credit: "",
      },
    ]);
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveEntry("posted");
  };

  const handleSaveDraft = () => {
    saveEntry("draft");
  };

  return (
    <main dir="rtl" className="min-h-screen bg-gray-100 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
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

            <span className="text-gray-700">إضافة قيد</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            إضافة قيد يومية جديد
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            تسجيل عملية محاسبية جديدة
          </p>
        </div>

        <Link
          href="/accounting/journal"
          className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 px-5 py-3 rounded-lg text-sm font-semibold transition"
        >
          <FiArrowRight size={18} />
          العودة للقيود
        </Link>
      </div>

      <form onSubmit={handleSave}>
        <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 md:p-6 mb-6">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900">بيانات القيد</h2>

            <p className="text-sm text-gray-500 mt-1">
              أدخل البيانات الأساسية للقيد المحاسبي
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                تاريخ القيد
              </label>

              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                required
                className="w-full h-12 bg-gray-50 border-2 border-gray-300 rounded-lg px-4 text-sm text-gray-900 font-medium outline-none hover:border-gray-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                رقم المرجع
              </label>

              <input
                type="text"
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="مثال: INV-10025"
                className="w-full h-12 bg-gray-50 border-2 border-gray-300 rounded-lg px-4 text-sm text-gray-900 font-medium placeholder:text-gray-400 outline-none hover:border-gray-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                بيان القيد
              </label>

              <input
                type="text"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="مثال: شراء بضاعة نقدًا"
                required
                className="w-full h-12 bg-gray-50 border-2 border-gray-300 rounded-lg px-4 text-sm text-gray-900 font-medium placeholder:text-gray-400 outline-none hover:border-gray-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
              />
            </div>
          </div>
        </section>

        <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 md:p-6 border-b-2 border-gray-200">
            <div>
              <h2 className="text-lg font-bold text-gray-900">تفاصيل القيد</h2>

              <p className="text-sm text-gray-500 mt-1">
                أدخل الحسابات والمبالغ المدينة والدائنة
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

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-gray-100 border-b-2 border-gray-300">
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

                  <th className="px-5 py-4 text-center text-sm font-bold text-gray-800 w-20">
                    حذف
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {lines.map((line, index) => (
                  <tr key={line.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-200 text-gray-700 text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>

                        <select
                          value={line.account}
                          onChange={(event) =>
                            updateLine(line.id, "account", event.target.value)
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
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <input
                        type="text"
                        value={line.description}
                        onChange={(event) =>
                          updateLine(line.id, "description", event.target.value)
                        }
                        placeholder="بيان السطر"
                        className="w-full h-12 bg-gray-50 border-2 border-gray-300 rounded-lg px-3 text-sm text-gray-900 placeholder:text-gray-400 outline-none hover:border-gray-400 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                      />
                    </td>

                    <td className="px-5 py-4">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.debit}
                        onChange={(event) =>
                          handleDebitChange(line.id, event.target.value)
                        }
                        placeholder="0.00"
                        className="w-full h-12 bg-white border-2 border-gray-400 rounded-lg px-4 text-sm text-gray-900 font-bold placeholder:text-gray-400 outline-none hover:border-gray-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                      />
                    </td>

                    <td className="px-5 py-4">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={line.credit}
                        onChange={(event) =>
                          handleCreditChange(line.id, event.target.value)
                        }
                        placeholder="0.00"
                        className="w-full h-12 bg-white border-2 border-gray-400 rounded-lg px-4 text-sm text-gray-900 font-bold placeholder:text-gray-400 outline-none hover:border-gray-500 focus:border-amber-500 focus:ring-4 focus:ring-amber-100"
                      />
                    </td>

                    <td className="px-5 py-4 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(line.id)}
                        disabled={lines.length <= 2}
                        title="حذف السطر"
                        className="inline-flex items-center justify-center w-10 h-10 rounded-lg text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

              <tfoot>
                <tr className="bg-gray-100 border-t-2 border-gray-300">
                  <td
                    colSpan={2}
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

          <div className="p-5 md:p-6 border-t-2 border-gray-200">
            <div
              className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border-2 ${
                isBalanced
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div>
                <p
                  className={`text-base font-bold ${
                    isBalanced ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {isBalanced ? "✓ القيد متوازن" : "⚠ القيد غير متوازن"}
                </p>

                <p
                  className={`text-sm mt-1 ${
                    isBalanced ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {isBalanced
                    ? "إجمالي المدين يساوي إجمالي الدائن"
                    : "يجب أن يتساوى إجمالي المدين مع إجمالي الدائن قبل الترحيل"}
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

          <div className="flex flex-col sm:flex-row justify-end gap-3 p-5 md:p-6 border-t-2 border-gray-200">
            <Link
              href="/accounting/journal"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold text-sm transition"
            >
              إلغاء
            </Link>

            <button
              type="button"
              onClick={handleSaveDraft}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-semibold text-sm transition"
            >
              <FiRefreshCw size={17} />
              حفظ كمسودة
            </button>

            <button
              type="submit"
              disabled={!isBalanced}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition"
            >
              <FiSave size={18} />
              حفظ وترحيل القيد
            </button>
          </div>
        </section>
      </form>
    </main>
  );
}
