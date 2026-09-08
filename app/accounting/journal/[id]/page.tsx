"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import {
  FiArrowRight,
  FiEdit2,
  FiPrinter,
  FiTrash2,
  FiCheckCircle,
  FiFileText,
  FiUser,
  FiCalendar,
  FiHash,
  FiClock,
} from "react-icons/fi";

import { useERPStore, type JournalEntry } from "@/Store/erpStore";

export default function JournalEntryDetailsPage() {
  const params = useParams();
  const router = useRouter();

  // =====================================================
  // الحصول على ID من الرابط
  // =====================================================

  const entryId = String(params.id);

  // =====================================================
  // الحصول على القيد من Zustand
  // =====================================================

  const entry = useERPStore((state) =>
    state.journalEntries.find((item) => item.id === entryId),
  );

  const deleteJournalEntry = useERPStore((state) => state.deleteJournalEntry);

  // =====================================================
  // إذا لم يوجد القيد
  // =====================================================

  if (!entry) {
    return (
      <main dir="rtl" className="min-h-screen bg-gray-100 p-4 md:p-6">
        <div className="max-w-3xl mx-auto mt-20 bg-white border border-gray-200 rounded-xl shadow-sm p-10 text-center">
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

  // =====================================================
  // الحسابات
  // =====================================================

  const totalDebit = entry.lines.reduce((sum, line) => sum + line.debit, 0);

  const totalCredit = entry.lines.reduce((sum, line) => sum + line.credit, 0);

  const difference = totalDebit - totalCredit;

  const isBalanced = totalDebit === totalCredit;

  // =====================================================
  // حذف القيد
  // =====================================================

  const handleDelete = () => {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف القيد ${entry.number}؟`,
    );

    if (!confirmed) {
      return;
    }

    deleteJournalEntry(entry.id);

    alert("تم حذف القيد بنجاح.");

    router.push("/accounting/journal");
  };

  // =====================================================
  // الطباعة
  // =====================================================

  const handlePrint = () => {
    window.print();
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gray-100 p-4 md:p-6 print:bg-white print:p-0"
    >
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 mb-6 print:hidden">
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

            <span className="text-gray-800 font-medium">{entry.number}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              تفاصيل القيد
            </h1>

            {entry.status === "posted" ? (
              <span className="px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
                <span className="inline-flex items-center gap-1.5">
                  <FiCheckCircle size={14} />
                  مرحّل
                </span>
              </span>
            ) : (
              <span className="px-3 py-1.5 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-bold">
                <span className="inline-flex items-center gap-1.5">
                  <FiClock size={14} />
                  مسودة
                </span>
              </span>
            )}
          </div>

          <p className="text-sm text-gray-500 mt-2">
            عرض تفاصيل القيد المحاسبي وجميع الحركات المرتبطة به
          </p>
        </div>

        {/* Actions */}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2.5 rounded-lg text-sm font-semibold transition"
          >
            <FiPrinter size={17} />
            طباعة
          </button>

          {entry.status === "draft" && (
            <Link
              href={`/accounting/journal/${entry.id}/edit`}
              className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:text-blue-600 px-4 py-2.5 rounded-lg text-sm font-semibold transition"
            >
              <FiEdit2 size={17} />
              تعديل
            </Link>
          )}

          <button
            type="button"
            onClick={handleDelete}
            className="inline-flex items-center justify-center gap-2 bg-white border-2 border-gray-300 hover:bg-red-50 hover:border-red-300 text-gray-700 hover:text-red-600 px-4 py-2.5 rounded-lg text-sm font-semibold transition"
          >
            <FiTrash2 size={17} />
            حذف
          </button>
        </div>
      </div>

      {/* ================================================= */}
      {/* PRINT HEADER */}
      {/* ================================================= */}

      <div className="hidden print:block text-center mb-8">
        <h1 className="text-2xl font-bold">قيد يومية</h1>

        <p className="text-sm mt-2">{entry.number}</p>
      </div>

      {/* ================================================= */}
      {/* BASIC INFORMATION */}
      {/* ================================================= */}

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
        <div className="p-5 md:p-6 border-b-2 border-gray-200">
          <div className="flex items-center gap-2">
            <FiFileText size={20} className="text-amber-600" />

            <h2 className="font-bold text-gray-900">معلومات القيد</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 p-5 md:p-6">
          <InfoBox
            icon={FiHash}
            label="رقم القيد"
            value={entry.number}
            highlight
          />

          <InfoBox
            icon={FiCalendar}
            label="تاريخ القيد"
            value={formatDate(entry.date)}
          />

          <InfoBox
            icon={FiFileText}
            label="رقم المرجع"
            value={entry.reference || "-"}
          />

          <InfoBox icon={FiUser} label="أنشأ بواسطة" value={entry.user} />
        </div>

        {/* Description */}

        <div className="px-5 md:px-6 pb-6">
          <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-gray-500 mb-2">
              بيان القيد
            </p>

            <p className="text-sm font-bold text-gray-800">
              {entry.description}
            </p>
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* JOURNAL LINES */}
      {/* ================================================= */}

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden mb-6">
        <div className="p-5 md:p-6 border-b-2 border-gray-200">
          <h2 className="font-bold text-gray-900">تفاصيل الحسابات</h2>

          <p className="text-sm text-gray-500 mt-1">
            الحسابات المدينة والدائنة الخاصة بالقيد
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px]">
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
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {entry.lines.map((line, index) => (
                <tr key={line.id} className="hover:bg-gray-50 transition">
                  {/* Number */}

                  <td className="px-5 py-5">
                    <span className="w-8 h-8 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                  </td>

                  {/* Account */}

                  <td className="px-5 py-5">
                    <div>
                      <p className="font-bold text-gray-900">
                        {line.accountName}
                      </p>

                      <p className="text-xs text-amber-600 font-semibold mt-1">
                        {line.accountCode}
                      </p>
                    </div>
                  </td>

                  {/* Description */}

                  <td className="px-5 py-5">
                    <span className="text-sm text-gray-600">
                      {line.description || "-"}
                    </span>
                  </td>

                  {/* Debit */}

                  <td className="px-5 py-5">
                    {line.debit > 0 ? (
                      <span className="font-bold text-gray-900">
                        {formatNumber(line.debit)}

                        <span className="text-xs text-gray-400 mr-1">ريال</span>
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>

                  {/* Credit */}

                  <td className="px-5 py-5">
                    {line.credit > 0 ? (
                      <span className="font-bold text-gray-900">
                        {formatNumber(line.credit)}

                        <span className="text-xs text-gray-400 mr-1">ريال</span>
                      </span>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
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

                <td className="px-5 py-5 font-bold text-gray-900">
                  {formatNumber(totalDebit)}

                  <span className="text-xs text-gray-400 mr-1">ريال</span>
                </td>

                <td className="px-5 py-5 font-bold text-gray-900">
                  {formatNumber(totalCredit)}

                  <span className="text-xs text-gray-400 mr-1">ريال</span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      {/* ================================================= */}
      {/* BALANCE STATUS */}
      {/* ================================================= */}

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6 p-5 md:p-6">
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
                <FiFileText size={20} />
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
                : "يوجد فرق بين المدين والدائن"}
            </p>
          </div>

          <div
            className={`text-lg font-bold ${
              isBalanced ? "text-green-700" : "text-red-700"
            }`}
          >
            الفرق:
            <span className="mr-2">
              {formatNumber(Math.abs(difference))} ريال
            </span>
          </div>
        </div>
      </section>

      {/* ================================================= */}
      {/* AUDIT INFORMATION */}
      {/* ================================================= */}

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 md:p-6">
        <h2 className="font-bold text-gray-900 mb-5">معلومات التسجيل</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div>
            <p className="text-xs text-gray-500 mb-1">أنشأ بواسطة</p>

            <p className="text-sm font-bold text-gray-800">{entry.user}</p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">تاريخ الإنشاء</p>

            <p className="text-sm font-bold text-gray-800">
              {entry.createdAt || "-"}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">حالة القيد</p>

            {entry.status === "posted" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-50 border border-green-200 text-green-700 text-xs font-bold">
                <FiCheckCircle size={14} />
                مرحّل
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs font-bold">
                <FiClock size={14} />
                مسودة
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Back */}

      <div className="mt-6 print:hidden">
        <Link
          href="/accounting/journal"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-amber-600 transition"
        >
          <FiArrowRight size={17} />
          العودة إلى القيود اليومية
        </Link>
      </div>

      {/* ================================================= */}
      {/* PRINT STYLE */}
      {/* ================================================= */}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          button,
          a {
            print-color-adjust: exact;
          }

          main {
            background: white !important;
          }
        }
      `}</style>
    </main>
  );
}

// =========================================================
// INFO BOX
// =========================================================

function InfoBox({
  icon: Icon,
  label,
  value,
  highlight = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon
          size={17}
          className={highlight ? "text-amber-600" : "text-gray-500"}
        />

        <span className="text-xs font-semibold text-gray-500">{label}</span>
      </div>

      <p
        className={`text-base font-bold ${
          highlight ? "text-amber-600" : "text-gray-900"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

// =========================================================
// FORMAT NUMBER
// =========================================================

function formatNumber(number: number) {
  return Number(number).toLocaleString("ar-SA");
}

// =========================================================
// FORMAT DATE
// =========================================================

function formatDate(date: string) {
  const [year, month, day] = date.split("-");

  return `${day}/${month}/${year}`;
}
