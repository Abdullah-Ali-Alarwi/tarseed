"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiPlus,
  FiSearch,
  FiEye,
  FiEdit2,
  FiTrash2,
  FiFilter,
  FiCalendar,
  FiFileText,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiRefreshCw,
} from "react-icons/fi";

import { useERPStore, type JournalStatus } from "@/Store/erpStore";

export default function JournalPage() {
  // =====================================================
  // الفلاتر
  // =====================================================

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | JournalStatus>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // =====================================================
  // بيانات القيود من Zustand
  // =====================================================

  const entries = useERPStore((state) => state.journalEntries);

  const deleteJournalEntry = useERPStore((state) => state.deleteJournalEntry);

  // =====================================================
  // تنسيق الأرقام
  // =====================================================

  const formatNumber = (number: number) => {
    return Number(number).toLocaleString("ar-SA");
  };

  // =====================================================
  // فلترة القيود
  // =====================================================

  const filteredEntries = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return entries
      .filter((entry) => {
        const matchesSearch =
          !searchValue ||
          entry.number.toLowerCase().includes(searchValue) ||
          entry.reference.toLowerCase().includes(searchValue) ||
          entry.description.toLowerCase().includes(searchValue) ||
          entry.user.toLowerCase().includes(searchValue);

        const matchesStatus = status === "all" || entry.status === status;

        const matchesFromDate = !dateFrom || entry.date >= dateFrom;

        const matchesToDate = !dateTo || entry.date <= dateTo;

        return (
          matchesSearch && matchesStatus && matchesFromDate && matchesToDate
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [entries, search, status, dateFrom, dateTo]);

  // =====================================================
  // حذف القيد
  // =====================================================

  const deleteEntry = (id: string) => {
    const confirmed = window.confirm("هل أنت متأكد من حذف هذا القيد؟");

    if (!confirmed) {
      return;
    }

    deleteJournalEntry(id);
  };

  // =====================================================
  // الإحصائيات
  // =====================================================

  const totalEntries = entries.length;

  const postedEntries = entries.filter(
    (entry) => entry.status === "posted",
  ).length;

  const draftEntries = entries.filter(
    (entry) => entry.status === "draft",
  ).length;

  const totalDebit = entries.reduce((sum, entry) => sum + entry.debit, 0);

  const totalCredit = entries.reduce((sum, entry) => sum + entry.credit, 0);

  // =====================================================
  // العرض
  // =====================================================

  return (
    <main dir="rtl" className="min-h-screen bg-gray-100 p-4 md:p-6">
      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Link
              href="/accounting"
              className="hover:text-amber-600 transition"
            >
              المحاسبة
            </Link>

            <span>/</span>

            <span className="text-gray-800 font-medium">القيود اليومية</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            القيود اليومية
          </h1>

          <p className="text-sm text-gray-500 mt-2">
            إدارة ومراجعة جميع القيود المحاسبية
          </p>
        </div>

        <Link
          href="/accounting/journal/new"
          className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-lg text-sm font-semibold transition shadow-sm"
        >
          <FiPlus size={19} />
          إضافة قيد جديد
        </Link>
      </div>

      {/* ================================================= */}
      {/* STATISTICS */}
      {/* ================================================= */}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="إجمالي القيود"
          value={totalEntries}
          icon={FiFileText}
        />

        <StatCard
          title="القيود المرحلة"
          value={postedEntries}
          icon={FiCheckCircle}
        />

        <StatCard title="المسودات" value={draftEntries} icon={FiClock} />

        <StatCard
          title="إجمالي العمليات"
          value={`${formatNumber(totalDebit)} ريال`}
          icon={FiDollarSign}
        />
      </div>

      {/* ================================================= */}
      {/* BALANCE INFO */}
      {/* ================================================= */}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي المدين</p>

              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatNumber(totalDebit)} ريال
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FiDollarSign size={22} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">إجمالي الدائن</p>

              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatNumber(totalCredit)} ريال
              </p>
            </div>

            <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
              <FiCheckCircle size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* ================================================= */}
      {/* FILTERS */}
      {/* ================================================= */}

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6">
        <div className="p-5 border-b-2 border-gray-200">
          <div className="flex items-center gap-2">
            <FiFilter size={19} className="text-amber-600" />

            <h2 className="font-bold text-gray-900">البحث والفلترة</h2>
          </div>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* البحث */}

            <div className="lg:col-span-2">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                بحث
              </label>

              <div className="relative">
                <FiSearch
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                  size={19}
                />

                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="رقم القيد أو المرجع أو البيان..."
                  className="w-full h-12 bg-gray-50 border-2 border-gray-300 rounded-lg pr-11 pl-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                />
              </div>
            </div>

            {/* الحالة */}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                الحالة
              </label>

              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "all" | JournalStatus)
                }
                className="w-full h-12 bg-gray-50 border-2 border-gray-300 rounded-lg px-3 text-sm text-gray-900 font-medium outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
              >
                <option value="all">جميع الحالات</option>

                <option value="posted">مرحّل</option>

                <option value="draft">مسودة</option>
              </select>
            </div>

            {/* من تاريخ */}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                من تاريخ
              </label>

              <div className="relative">
                <FiCalendar
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />

                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full h-12 bg-gray-50 border-2 border-gray-300 rounded-lg pr-10 pl-3 text-sm text-gray-900 outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                />
              </div>
            </div>

            {/* إلى تاريخ */}

            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                إلى تاريخ
              </label>

              <div className="relative">
                <FiCalendar
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={18}
                />

                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full h-12 bg-gray-50 border-2 border-gray-300 rounded-lg pr-10 pl-3 text-sm text-gray-900 outline-none focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition"
                />
              </div>
            </div>
          </div>

          {(search || status !== "all" || dateFrom || dateTo) && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatus("all");
                setDateFrom("");
                setDateTo("");
              }}
              className="inline-flex items-center gap-2 mt-4 text-sm font-semibold text-gray-600 hover:text-amber-600 transition"
            >
              <FiRefreshCw size={16} />
              إعادة تعيين الفلاتر
            </button>
          )}
        </div>
      </section>

      {/* ================================================= */}
      {/* JOURNAL TABLE */}
      {/* ================================================= */}

      <section className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-5 border-b-2 border-gray-200">
          <div>
            <h2 className="font-bold text-gray-900">قائمة القيود</h2>

            <p className="text-sm text-gray-500 mt-1">
              عدد النتائج: {filteredEntries.length}
            </p>
          </div>
        </div>

        {/* Table */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-5 py-4 text-right text-sm font-bold text-gray-800">
                  رقم القيد
                </th>

                <th className="px-5 py-4 text-right text-sm font-bold text-gray-800">
                  التاريخ
                </th>

                <th className="px-5 py-4 text-right text-sm font-bold text-gray-800">
                  المرجع
                </th>

                <th className="px-5 py-4 text-right text-sm font-bold text-gray-800">
                  البيان
                </th>

                <th className="px-5 py-4 text-right text-sm font-bold text-gray-800">
                  المدين
                </th>

                <th className="px-5 py-4 text-right text-sm font-bold text-gray-800">
                  الدائن
                </th>

                <th className="px-5 py-4 text-center text-sm font-bold text-gray-800">
                  الحالة
                </th>

                <th className="px-5 py-4 text-center text-sm font-bold text-gray-800">
                  الإجراءات
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-gray-50 transition">
                    {/* رقم القيد */}

                    <td className="px-5 py-4">
                      <Link
                        href={`/accounting/journal/${entry.id}`}
                        className="font-bold text-amber-600 hover:text-amber-700"
                      >
                        {entry.number}
                      </Link>
                    </td>

                    {/* التاريخ */}

                    <td className="px-5 py-4 text-sm text-gray-700">
                      {formatDate(entry.date)}
                    </td>

                    {/* المرجع */}

                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600">
                        {entry.reference || "-"}
                      </span>
                    </td>

                    {/* البيان */}

                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {entry.description}
                        </p>

                        <p className="text-xs text-gray-400 mt-1">
                          بواسطة: {entry.user}
                        </p>
                      </div>
                    </td>

                    {/* المدين */}

                    <td className="px-5 py-4">
                      <span className="font-semibold text-gray-800">
                        {formatNumber(entry.debit)}
                      </span>

                      <span className="text-xs text-gray-400 mr-1">ريال</span>
                    </td>

                    {/* الدائن */}

                    <td className="px-5 py-4">
                      <span className="font-semibold text-gray-800">
                        {formatNumber(entry.credit)}
                      </span>

                      <span className="text-xs text-gray-400 mr-1">ريال</span>
                    </td>

                    {/* الحالة */}

                    <td className="px-5 py-4 text-center">
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
                    </td>

                    {/* الإجراءات */}

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* عرض */}

                        <Link
                          href={`/accounting/journal/${entry.id}`}
                          title="عرض القيد"
                          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:text-amber-600 hover:border-amber-300 hover:bg-amber-50 transition"
                        >
                          <FiEye size={17} />
                        </Link>

                        {/* تعديل */}

                        {entry.status === "draft" && (
                          <Link
                            href={`/accounting/journal/${entry.id}/edit`}
                            title="تعديل القيد"
                            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition"
                          >
                            <FiEdit2 size={17} />
                          </Link>
                        )}

                        {/* حذف */}

                        <button
                          type="button"
                          onClick={() => deleteEntry(entry.id)}
                          title="حذف القيد"
                          className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50 transition"
                        >
                          <FiTrash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-4">
                        <FiFileText size={25} />
                      </div>

                      <h3 className="font-bold text-gray-800">لا توجد قيود</h3>

                      <p className="text-sm text-gray-500 mt-2">
                        لم يتم العثور على قيود مطابقة للبحث
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>

            {/* ================================================= */}
            {/* FOOTER */}
            {/* ================================================= */}

            {filteredEntries.length > 0 && (
              <tfoot>
                <tr className="bg-gray-100 border-t-2 border-gray-300">
                  <td
                    colSpan={4}
                    className="px-5 py-5 text-left font-bold text-gray-900"
                  >
                    الإجمالي
                  </td>

                  <td className="px-5 py-5 font-bold text-gray-900">
                    {formatNumber(
                      filteredEntries.reduce(
                        (sum, entry) => sum + entry.debit,
                        0,
                      ),
                    )}

                    <span className="text-xs font-normal text-gray-500 mr-1">
                      ريال
                    </span>
                  </td>

                  <td className="px-5 py-5 font-bold text-gray-900">
                    {formatNumber(
                      filteredEntries.reduce(
                        (sum, entry) => sum + entry.credit,
                        0,
                      ),
                    )}

                    <span className="text-xs font-normal text-gray-500 mr-1">
                      ريال
                    </span>
                  </td>

                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>
    </main>
  );
}

/* ================================================= */
/* STAT CARD */
/* ================================================= */

function StatCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>

        <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Icon size={23} />
        </div>
      </div>
    </div>
  );
}

/* ================================================= */
/* DATE FORMAT */
/* ================================================= */

function formatDate(date: string) {
  const [year, month, day] = date.split("-");

  return `${day}/${month}/${year}`;
}
