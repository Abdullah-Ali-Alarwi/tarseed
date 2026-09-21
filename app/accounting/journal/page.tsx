"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  FiBookOpen,
  FiCalendar,
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiEdit,
  FiEye,
  FiFileText,
  FiFilter,
  FiPlus,
  FiSearch,
  FiTrash2,
  FiX,
} from "react-icons/fi";

import { useERPStore } from "@/Store/erpStore";

export default function JournalPage() {
  const { journalEntries, deleteJournalEntry } = useERPStore();

  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [referenceFilter, setReferenceFilter] = useState("all");

  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  /* =====================================================
     أنواع القيود
  ===================================================== */

  const referenceLabels: Record<string, string> = {
    sale: "مبيعات",
    purchase: "مشتريات",
    payment: "سداد",
    receipt: "قبض",
    manual: "قيد يدوي",
    other: "أخرى",
  };

  /* =====================================================
     تنسيق المبالغ
  ===================================================== */

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("ar-SA", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value || 0);
  };

  /* =====================================================
     تنسيق التاريخ
  ===================================================== */

  const formatDate = (date: string) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return date;
    }

    return new Intl.DateTimeFormat("ar-SA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(parsedDate);
  };

  /* =====================================================
     إجمالي القيد
  ===================================================== */

  const getEntryTotal = (entry: (typeof journalEntries)[number]) => {
    return entry.lines.reduce((sum, line) => {
      return sum + Number(line.debit || 0);
    }, 0);
  };

  /* =====================================================
     عدد الأسطر
  ===================================================== */

  const getLineCount = (entry: (typeof journalEntries)[number]) => {
    return entry.lines.length;
  };

  /* =====================================================
     نوع القيد
  ===================================================== */

  const getReferenceLabel = (referenceType: string | undefined) => {
    if (!referenceType) {
      return "قيد يدوي";
    }

    return referenceLabels[referenceType] || "أخرى";
  };

  /* =====================================================
     لون نوع القيد
  ===================================================== */

  const getReferenceStyle = (referenceType: string | undefined) => {
    switch (referenceType) {
      case "sale":
        return "bg-green-100 text-green-700";

      case "purchase":
        return "bg-blue-100 text-blue-700";

      case "payment":
        return "bg-orange-100 text-orange-700";

      case "receipt":
        return "bg-purple-100 text-purple-700";

      case "manual":
        return "bg-gray-100 text-gray-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  /* =====================================================
     التحقق من توازن القيد
  ===================================================== */

  const isEntryBalanced = (entry: (typeof journalEntries)[number]) => {
    const debit = entry.lines.reduce(
      (sum, line) => sum + Number(line.debit || 0),
      0,
    );

    const credit = entry.lines.reduce(
      (sum, line) => sum + Number(line.credit || 0),
      0,
    );

    return Math.abs(debit - credit) < 0.01;
  };

  /* =====================================================
     تصفية القيود
  ===================================================== */

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...journalEntries]
      .filter((entry) => {
        if (!query) return true;

        const searchableText = [
          entry.entryNumber,
          entry.description,
          entry.referenceType || "",
          entry.referenceId || "",
          ...entry.lines.map((line) => line.accountCode),
          ...entry.lines.map((line) => line.accountName),
          ...entry.lines.map((line) => line.description || ""),
        ]
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      })
      .filter((entry) => {
        if (referenceFilter === "all") {
          return true;
        }

        return entry.referenceType === referenceFilter;
      })
      .filter((entry) => {
        if (!dateFrom) {
          return true;
        }

        return entry.date >= dateFrom;
      })
      .filter((entry) => {
        if (!dateTo) {
          return true;
        }

        return entry.date <= dateTo;
      })
      .sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);

        if (dateCompare !== 0) {
          return dateCompare;
        }

        return b.entryNumber.localeCompare(a.entryNumber);
      });
  }, [journalEntries, search, dateFrom, dateTo, referenceFilter]);

  /* =====================================================
     الإحصائيات
  ===================================================== */

  const statistics = useMemo(() => {
    const totalEntries = filteredEntries.length;

    const totalDebit = filteredEntries.reduce((sum, entry) => {
      return (
        sum +
        entry.lines.reduce(
          (lineSum, line) => lineSum + Number(line.debit || 0),
          0,
        )
      );
    }, 0);

    const totalCredit = filteredEntries.reduce((sum, entry) => {
      return (
        sum +
        entry.lines.reduce(
          (lineSum, line) => lineSum + Number(line.credit || 0),
          0,
        )
      );
    }, 0);

    const balancedEntries = filteredEntries.filter(isEntryBalanced).length;

    return {
      totalEntries,
      totalDebit,
      totalCredit,
      balancedEntries,
    };
  }, [filteredEntries]);

  /* =====================================================
     حذف القيد
  ===================================================== */

  const handleDelete = (entry: (typeof journalEntries)[number]) => {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف القيد ${entry.entryNumber}؟`,
    );

    if (!confirmed) {
      return;
    }

    deleteJournalEntry(entry.id);

    if (selectedEntryId === entry.id) {
      setSelectedEntryId(null);
    }

    if (expandedEntryId === entry.id) {
      setExpandedEntryId(null);
    }

    toast.success("تم حذف القيد بنجاح");
  };

  /* =====================================================
     فتح / إغلاق تفاصيل القيد
  ===================================================== */

  const toggleEntry = (id: string) => {
    setExpandedEntryId((current) => (current === id ? null : id));
  };

  /* =====================================================
     القيد المحدد
  ===================================================== */

  const selectedEntry = journalEntries.find(
    (entry) => entry.id === selectedEntryId,
  );

  /* =====================================================
     واجهة الصفحة
  ===================================================== */

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gray-50 px-2.5 py-3 sm:px-3 sm:py-4 md:px-4 lg:px-5"
    >
      {/* =================================================
          العنوان
      ================================================= */}

      <div className="mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-[10px] text-gray-500 sm:text-[11px]">
            <FiBookOpen size={12} />
            <span>المحاسبة</span>
            <span>/</span>
            <span>قيود اليومية</span>
          </div>

          <h1 className="text-xl font-bold text-gray-800 sm:text-2xl">
            قيود اليومية
          </h1>

          <p className="mt-0.5 text-[11px] text-gray-500 sm:text-xs">
            إدارة ومراجعة جميع القيود المحاسبية المسجلة في النظام
          </p>
        </div>

        <Link
          href="/accounting/journal/new"
          className="
            flex h-9 w-full items-center justify-center gap-1.5
            rounded-lg bg-[#0E1F33] px-3.5 text-xs font-semibold
            text-white shadow-sm transition hover:bg-[#162d47]
            sm:w-auto
          "
        >
          <FiPlus size={14} />
          <span>قيد يومية جديد</span>
        </Link>
      </div>

      {/* =================================================
          الإحصائيات
      ================================================= */}

      <div className="mb-4 grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        {/* عدد القيود */}

        <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] text-gray-500">عدد القيود</p>

              <p className="mt-1 text-lg font-bold text-gray-800">
                {statistics.totalEntries}
              </p>
            </div>

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FiBookOpen size={16} />
            </div>
          </div>
        </div>

        {/* إجمالي المدين */}

        <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500">إجمالي المدين</p>

              <p className="mt-1 truncate text-base font-bold text-gray-800 sm:text-lg">
                {formatMoney(statistics.totalDebit)}
              </p>
            </div>

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <FiDollarSign size={16} />
            </div>
          </div>
        </div>

        {/* إجمالي الدائن */}

        <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] text-gray-500">إجمالي الدائن</p>

              <p className="mt-1 truncate text-base font-bold text-gray-800 sm:text-lg">
                {formatMoney(statistics.totalCredit)}
              </p>
            </div>

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
              <FiCreditCard size={16} />
            </div>
          </div>
        </div>

        {/* القيود المتوازنة */}

        <div className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[10px] text-gray-500">القيود المتوازنة</p>

              <p className="mt-1 text-lg font-bold text-gray-800">
                {statistics.balancedEntries}
              </p>
            </div>

            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <FiFileText size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* =================================================
          البحث والفلاتر
      ================================================= */}

      <div className="mb-4 rounded-xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="mb-2.5 flex items-center gap-1.5">
          <FiFilter size={14} className="text-gray-500" />

          <h2 className="text-xs font-bold text-gray-800">البحث والتصفية</h2>
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-5">
          {/* البحث */}

          <div className="relative xl:col-span-2">
            <FiSearch
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم القيد أو الحساب أو الوصف..."
              className="
                h-9 w-full rounded-lg border border-gray-200
                bg-gray-50 pr-9 pl-3 text-xs outline-none transition
                focus:border-[#0E1F33] focus:bg-white
              "
            />
          </div>

          {/* من تاريخ */}

          <div className="relative">
            <FiCalendar
              size={13}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="
                h-9 w-full rounded-lg border border-gray-200
                bg-gray-50 pr-9 pl-2 text-xs outline-none
                focus:border-[#0E1F33] focus:bg-white
              "
            />
          </div>

          {/* إلى تاريخ */}

          <div className="relative">
            <FiCalendar
              size={13}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="
                h-9 w-full rounded-lg border border-gray-200
                bg-gray-50 pr-9 pl-2 text-xs outline-none
                focus:border-[#0E1F33] focus:bg-white
              "
            />
          </div>

          {/* نوع القيد */}

          <select
            value={referenceFilter}
            onChange={(e) => setReferenceFilter(e.target.value)}
            className="
              h-9 w-full rounded-lg border border-gray-200
              bg-gray-50 px-2.5 text-xs outline-none
              focus:border-[#0E1F33] focus:bg-white
            "
          >
            <option value="all">كل أنواع القيود</option>
            <option value="manual">قيود يدوية</option>
            <option value="sale">مبيعات</option>
            <option value="purchase">مشتريات</option>
            <option value="payment">سداد</option>
            <option value="receipt">قبض</option>
            <option value="other">أخرى</option>
          </select>
        </div>

        {/* مسح الفلاتر */}

        {(search || dateFrom || dateTo || referenceFilter !== "all") && (
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDateFrom("");
                setDateTo("");
                setReferenceFilter("all");
              }}
              className="
                flex items-center gap-1.5 rounded-lg px-2.5 py-1.5
                text-[11px] text-red-600 transition hover:bg-red-50
              "
            >
              <FiX size={13} />
              مسح الفلاتر
            </button>
          </div>
        )}
      </div>

      {/* =================================================
          جدول القيود
      ================================================= */}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        {/* رأس الجدول */}

        <div className="border-b border-gray-200 px-3 py-2.5">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xs font-bold text-gray-800">
                سجل قيود اليومية
              </h2>

              <p className="mt-0.5 text-[10px] text-gray-500">
                عرض {filteredEntries.length} من {journalEntries.length} قيد
              </p>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
              <FiClock size={12} />
              <span>الأحدث أولاً</span>
            </div>
          </div>
        </div>

        {filteredEntries.length === 0 ? (
          /* =================================================
             لا توجد قيود
          ================================================= */

          <div className="flex min-h-[280px] flex-col items-center justify-center px-4 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
              <FiBookOpen size={24} />
            </div>

            <h3 className="text-sm font-bold text-gray-700">
              لا توجد قيود يومية
            </h3>

            <p className="mt-1.5 max-w-md text-[11px] text-gray-500">
              لم يتم العثور على قيود تطابق البحث أو الفلاتر الحالية.
            </p>

            <Link
              href="/accounting/journal/new"
              className="
                mt-4 flex h-9 items-center gap-1.5 rounded-lg
                bg-[#0E1F33] px-3.5 text-xs font-semibold
                text-white transition hover:bg-[#162d47]
              "
            >
              <FiPlus size={14} />
              إنشاء أول قيد
            </Link>
          </div>
        ) : (
          <>
            {/* =================================================
                نسخة سطح المكتب
            ================================================= */}

            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[850px] text-right">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-[11px] text-gray-600">
                    <th className="px-3 py-2.5 font-semibold">رقم القيد</th>

                    <th className="px-3 py-2.5 font-semibold">التاريخ</th>

                    <th className="px-3 py-2.5 font-semibold">الوصف</th>

                    <th className="px-3 py-2.5 font-semibold">النوع</th>

                    <th className="px-3 py-2.5 font-semibold">الأسطر</th>

                    <th className="px-3 py-2.5 font-semibold">الإجمالي</th>

                    <th className="px-3 py-2.5 font-semibold">الحالة</th>

                    <th className="px-3 py-2.5 text-center font-semibold">
                      الإجراءات
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredEntries.map((entry) => {
                    const expanded = expandedEntryId === entry.id;
                    const balanced = isEntryBalanced(entry);

                    return (
                      <tr
                        key={entry.id}
                        className="border-b border-gray-100 transition hover:bg-gray-50"
                      >
                        <td className="px-3 py-2.5">
                          <button
                            type="button"
                            onClick={() => toggleEntry(entry.id)}
                            className="text-xs font-bold text-[#0E1F33] hover:underline"
                          >
                            {entry.entryNumber}
                          </button>
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5 text-[11px] text-gray-600">
                          {formatDate(entry.date)}
                        </td>

                        <td className="max-w-[230px] px-3 py-2.5">
                          <div
                            className="truncate text-xs font-medium text-gray-800"
                            title={entry.description}
                          >
                            {entry.description}
                          </div>

                          {entry.referenceId && (
                            <div className="mt-0.5 text-[9px] text-gray-400">
                              مرجع: {entry.referenceId}
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-2.5">
                          <span
                            className={`
                              inline-flex rounded-full px-2 py-0.5
                              text-[9px] font-semibold
                              ${getReferenceStyle(entry.referenceType)}
                            `}
                          >
                            {getReferenceLabel(entry.referenceType)}
                          </span>
                        </td>

                        <td className="px-3 py-2.5 text-[11px] text-gray-600">
                          {getLineCount(entry)}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2.5 text-xs font-bold text-gray-800">
                          {formatMoney(getEntryTotal(entry))}
                        </td>

                        <td className="px-3 py-2.5">
                          {balanced ? (
                            <span className="inline-flex rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-semibold text-green-700">
                              متوازن
                            </span>
                          ) : (
                            <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[9px] font-semibold text-red-700">
                              غير متوازن
                            </span>
                          )}
                        </td>

                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-center gap-0.5">
                            <button
                              type="button"
                              onClick={() => toggleEntry(entry.id)}
                              title="عرض التفاصيل"
                              className="
                                flex h-7 w-7 items-center justify-center
                                rounded-md text-blue-600 transition
                                hover:bg-blue-50
                              "
                            >
                              {expanded ? (
                                <FiChevronUp size={14} />
                              ) : (
                                <FiEye size={14} />
                              )}
                            </button>

                            <Link
                              href={`/accounting/journal/${entry.id}/edit`}
                              title="تعديل"
                              className="
                                flex h-7 w-7 items-center justify-center
                                rounded-md text-orange-600 transition
                                hover:bg-orange-50
                              "
                            >
                              <FiEdit size={14} />
                            </Link>

                            <button
                              type="button"
                              onClick={() => handleDelete(entry)}
                              title="حذف"
                              className="
                                flex h-7 w-7 items-center justify-center
                                rounded-md text-red-600 transition
                                hover:bg-red-50
                              "
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* =================================================
                تفاصيل القيود - سطح المكتب
            ================================================= */}

            <div className="hidden lg:block">
              {filteredEntries.map((entry) => {
                if (expandedEntryId !== entry.id) {
                  return null;
                }

                return (
                  <div
                    key={`details-${entry.id}`}
                    className="border-b border-gray-200 bg-gray-50 p-3"
                  >
                    <div className="mb-2.5 flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-bold text-gray-800">
                          تفاصيل القيد {entry.entryNumber}
                        </h3>

                        <p className="mt-0.5 text-[10px] text-gray-500">
                          {entry.description}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setExpandedEntryId(null)}
                        className="text-gray-400 hover:text-gray-700"
                      >
                        <FiX size={17} />
                      </button>
                    </div>

                    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                      <table className="w-full min-w-[650px] text-right">
                        <thead>
                          <tr className="border-b border-gray-200 bg-gray-50 text-[10px] text-gray-500">
                            <th className="px-3 py-2">الحساب</th>

                            <th className="px-3 py-2">الوصف</th>

                            <th className="px-3 py-2">مدين</th>

                            <th className="px-3 py-2">دائن</th>
                          </tr>
                        </thead>

                        <tbody>
                          {entry.lines.map((line) => (
                            <tr
                              key={line.id}
                              className="border-b border-gray-100 last:border-0"
                            >
                              <td className="px-3 py-2">
                                <div className="text-xs font-semibold text-gray-800">
                                  {line.accountName}
                                </div>

                                <div className="mt-0.5 text-[9px] text-gray-400">
                                  {line.accountCode}
                                </div>
                              </td>

                              <td className="px-3 py-2 text-[11px] text-gray-600">
                                {line.description || "-"}
                              </td>

                              <td className="px-3 py-2 text-xs font-semibold text-gray-800">
                                {line.debit > 0 ? formatMoney(line.debit) : "-"}
                              </td>

                              <td className="px-3 py-2 text-xs font-semibold text-gray-800">
                                {line.credit > 0
                                  ? formatMoney(line.credit)
                                  : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>

                        <tfoot>
                          <tr className="border-t-2 border-gray-200 bg-gray-50 text-xs font-bold">
                            <td colSpan={2} className="px-3 py-2">
                              الإجمالي
                            </td>

                            <td className="px-3 py-2">
                              {formatMoney(
                                entry.lines.reduce(
                                  (sum, line) => sum + Number(line.debit || 0),
                                  0,
                                ),
                              )}
                            </td>

                            <td className="px-3 py-2">
                              {formatMoney(
                                entry.lines.reduce(
                                  (sum, line) => sum + Number(line.credit || 0),
                                  0,
                                ),
                              )}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* =================================================
                نسخة الموبايل
            ================================================= */}

            <div className="divide-y divide-gray-100 lg:hidden">
              {filteredEntries.map((entry) => {
                const expanded = expandedEntryId === entry.id;
                const balanced = isEntryBalanced(entry);

                return (
                  <div key={entry.id} className="p-3">
                    {/* رأس البطاقة */}

                    <button
                      type="button"
                      onClick={() => toggleEntry(entry.id)}
                      className="w-full text-right"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-[#0E1F33]">
                              {entry.entryNumber}
                            </span>

                            <span
                              className={`
                                rounded-full px-1.5 py-0.5 text-[9px]
                                font-semibold
                                ${getReferenceStyle(entry.referenceType)}
                              `}
                            >
                              {getReferenceLabel(entry.referenceType)}
                            </span>
                          </div>

                          <p className="mt-1.5 truncate text-xs font-medium text-gray-800">
                            {entry.description}
                          </p>

                          <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-[10px] text-gray-500">
                            <span className="flex items-center gap-1">
                              <FiCalendar size={11} />
                              {formatDate(entry.date)}
                            </span>

                            <span>{getLineCount(entry)} أسطر</span>

                            <span className="font-semibold text-gray-700">
                              {formatMoney(getEntryTotal(entry))}
                            </span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5">
                          {balanced ? (
                            <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-semibold text-green-700">
                              متوازن
                            </span>
                          ) : (
                            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-semibold text-red-700">
                              غير متوازن
                            </span>
                          )}

                          {expanded ? (
                            <FiChevronUp size={14} className="text-gray-400" />
                          ) : (
                            <FiChevronDown
                              size={14}
                              className="text-gray-400"
                            />
                          )}
                        </div>
                      </div>
                    </button>

                    {/* تفاصيل الموبايل */}

                    {expanded && (
                      <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-2.5">
                        <div className="space-y-2">
                          {entry.lines.map((line) => (
                            <div
                              key={line.id}
                              className="rounded-lg border border-gray-200 bg-white p-2.5"
                            >
                              <div className="text-xs font-semibold text-gray-800">
                                {line.accountName}
                              </div>

                              <div className="mt-0.5 text-[9px] text-gray-400">
                                {line.accountCode}
                              </div>

                              {line.description && (
                                <div className="mt-1.5 text-[10px] text-gray-500">
                                  {line.description}
                                </div>
                              )}

                              <div className="mt-2 grid grid-cols-2 gap-1.5">
                                <div className="rounded-lg bg-green-50 p-2">
                                  <div className="text-[9px] text-green-600">
                                    مدين
                                  </div>

                                  <div className="mt-0.5 text-xs font-bold text-green-700">
                                    {line.debit > 0
                                      ? formatMoney(line.debit)
                                      : "-"}
                                  </div>
                                </div>

                                <div className="rounded-lg bg-blue-50 p-2">
                                  <div className="text-[9px] text-blue-600">
                                    دائن
                                  </div>

                                  <div className="mt-0.5 text-xs font-bold text-blue-700">
                                    {line.credit > 0
                                      ? formatMoney(line.credit)
                                      : "-"}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-1.5">
                          <Link
                            href={`/accounting/journal/${entry.id}/edit`}
                            className="
                              flex h-8 items-center justify-center gap-1.5
                              rounded-lg bg-orange-50 text-[10px]
                              font-semibold text-orange-700
                            "
                          >
                            <FiEdit size={12} />
                            تعديل
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDelete(entry)}
                            className="
                              flex h-8 items-center justify-center gap-1.5
                              rounded-lg bg-red-50 text-[10px]
                              font-semibold text-red-700
                            "
                          >
                            <FiTrash2 size={12} />
                            حذف
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* =================================================
          معلومات الشركة
      ================================================= */}

      <div className="mt-4 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-center shadow-sm">
        <div className="text-xs font-bold text-gray-800">شركة الجابري</div>

        <div className="mt-0.5 text-[10px] text-gray-500">
          للعسل والزيوت الطبيعة وخدمات العمرة
        </div>

        <div className="mt-0.5 text-[10px] text-gray-500">البيضاء - اليمن</div>

        <div className="mt-0.5 text-[10px] text-gray-500">
          هاتف: 734 434 443
        </div>
      </div>

      {/* =================================================
          نافذة تفاصيل القيد
      ================================================= */}

      {selectedEntry && (
        <div className="hidden">{selectedEntry.entryNumber}</div>
      )}
    </div>
  );
}
