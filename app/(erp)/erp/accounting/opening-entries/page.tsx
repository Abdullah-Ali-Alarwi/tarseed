"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import Link from "next/link";
import {
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiTrash2,
  FiEdit,
  FiBookOpen,
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiFilter,
} from "react-icons/fi";
import { toast } from "sonner";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  headers: {
    "Content-Type": "application/json",
  },
});

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
  nature?: "debit" | "credit";
  isGroup?: boolean;
  allowPosting?: boolean;
  isActive?: boolean;
  companyId: string | number;
}

interface OpeningEntry {
  id: string;
  accountId: string;
  date: string;
  debit: number;
  credit: number;
  companyId: string | number;
  description?: string;
  reference?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface CurrentUser {
  id: string;
  name?: string;
  username: string;
  role?: string;
  type?: string;
  companyId: string | number;
  companyName?: string;
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (date?: string) => {
  if (!date) return "-";

  return new Date(date).toLocaleDateString("ar-YE");
};

export default function OpeningEntriesPage() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<OpeningEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [selectedDate, setSelectedDate] = useState("");

  const getCurrentUser = useCallback(async () => {
    const username = document.cookie
      .split("; ")
      .find((row) => row.startsWith("username="))
      ?.split("=")[1];

    if (!username) {
      throw new Error("لم يتم العثور على المستخدم الحالي");
    }

    const decodedUsername = decodeURIComponent(username);

    const response = await api.get(
      `/users?username=${encodeURIComponent(decodedUsername)}`,
    );

    const dbUser = response.data?.[0];

    if (!dbUser) {
      throw new Error("المستخدم غير موجود");
    }

    if (dbUser.type === "platform") {
      throw new Error("ليس لديك صلاحية الوصول إلى هذه الصفحة");
    }

    if (!dbUser.companyId) {
      throw new Error("المستخدم غير مرتبط بشركة");
    }

    return {
      id: String(dbUser.id),
      name: dbUser.name || dbUser.fullName || dbUser.username,
      username: dbUser.username,
      role: dbUser.role,
      type: dbUser.type,
      companyId: dbUser.companyId,
      companyName: dbUser.companyName || dbUser.companyname,
    } as CurrentUser;
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);

      const currentUser = await getCurrentUser();
      setUser(currentUser);

      const [accountsResponse, entriesResponse] = await Promise.all([
        api.get("/accounts", {
          params: { companyId: currentUser.companyId },
        }),
        api.get("/openingEntries", {
          params: { companyId: currentUser.companyId },
        }),
      ]);

      const companyAccounts = (accountsResponse.data || []).filter(
        (account: Account) =>
          String(account.companyId) === String(currentUser.companyId),
      );

      const companyEntries = (entriesResponse.data || []).filter(
        (entry: OpeningEntry) =>
          String(entry.companyId) === String(currentUser.companyId),
      );

      setAccounts(companyAccounts);
      setEntries(companyEntries);
    } catch (error) {
      console.error(error);
      toast.error(
        error instanceof Error
          ? error.message
          : "حدث خطأ أثناء تحميل الأرصدة الافتتاحية",
      );
    } finally {
      setLoading(false);
    }
  }, [getCurrentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const accountMap = useMemo(() => {
    const map = new Map<string, Account>();

    accounts.forEach((account) => {
      map.set(String(account.id), account);
    });

    return map;
  }, [accounts]);

  const getAccount = (accountId: string) => {
    return accountMap.get(String(accountId));
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      const account = getAccount(entry.accountId);

      const searchValue = search.trim().toLowerCase();

      const matchesSearch =
        !searchValue ||
        account?.name?.toLowerCase().includes(searchValue) ||
        account?.code?.toLowerCase().includes(searchValue) ||
        entry.reference?.toLowerCase().includes(searchValue) ||
        entry.description?.toLowerCase().includes(searchValue);

      const matchesDate =
        !selectedDate || entry.date?.slice(0, 10) === selectedDate;

      return matchesSearch && matchesDate;
    });
  }, [entries, search, selectedDate, accountMap]);

  const totals = useMemo(() => {
    const debit = filteredEntries.reduce(
      (sum, entry) => sum + Number(entry.debit || 0),
      0,
    );

    const credit = filteredEntries.reduce(
      (sum, entry) => sum + Number(entry.credit || 0),
      0,
    );

    return {
      debit,
      credit,
      difference: Math.abs(debit - credit),
      balanced: Math.abs(debit - credit) < 0.01,
    };
  }, [filteredEntries]);

  const accountCount = useMemo(() => {
    return new Set(filteredEntries.map((entry) => entry.accountId)).size;
  }, [filteredEntries]);

  const handleDelete = async (entry: OpeningEntry) => {
    if (!user) return;

    const account = getAccount(entry.accountId);

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف الرصيد الافتتاحي للحساب ${account?.name || ""}؟`,
    );

    if (!confirmed) return;

    try {
      setDeleting(entry.id);

      // التأكد من أن السجل تابع للشركة الحالية
      const response = await api.get(`/openingEntries/${entry.id}`);

      const existingEntry = response.data as OpeningEntry;

      if (String(existingEntry.companyId) !== String(user.companyId)) {
        toast.error("لا تملك صلاحية حذف هذا السجل");
        return;
      }

      await api.delete(`/openingEntries/${entry.id}`);

      // تسجيل العملية في سجل نشاط المستخدمين
      try {
        await api.post("/activityLogs", {
          id: crypto.randomUUID(),
          companyId: user.companyId,
          userId: user.id,
          username: user.username,
          userName: user.name,
          userRole: user.role,
          action: "delete",
          module: "openingEntries",
          description: `حذف رصيد افتتاحي للحساب ${account?.name || entry.accountId}`,
          recordId: entry.id,
          recordName: account?.name || entry.accountId,
          oldData: existingEntry,
          createdAt: new Date().toISOString(),
        });
      } catch (activityError) {
        console.error("تعذر تسجيل نشاط الحذف:", activityError);
      }

      setEntries((previous) => previous.filter((item) => item.id !== entry.id));

      toast.success("تم حذف الرصيد الافتتاحي بنجاح");
    } catch (error) {
      console.error(error);
      toast.error("حدث خطأ أثناء حذف الرصيد الافتتاحي");
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <FiRefreshCw className="mx-auto mb-3 animate-spin text-3xl text-slate-600" />
          <p className="text-sm text-slate-500">
            جاري تحميل الأرصدة الافتتاحية...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <FiBookOpen className="text-2xl text-slate-700" />

            <h1 className="text-2xl font-bold text-slate-800">
              الأرصدة الافتتاحية
            </h1>
          </div>

          <p className="mt-2 text-sm text-slate-500">
            إدارة الأرصدة الافتتاحية وربطها بالحسابات المحاسبية
          </p>

          {user?.companyName && (
            <p className="mt-1 text-xs text-slate-400">
              الشركة: {user.companyName}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <FiRefreshCw />
            تحديث
          </button>

          <Link
            href="/erp/accounting/opening-entries/create"
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            <FiPlus />
            إضافة أرصدة افتتاحية
          </Link>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">عدد الحسابات</p>

              <h3 className="mt-2 text-2xl font-bold text-slate-800">
                {accountCount}
              </h3>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <FiBookOpen size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">إجمالي المدين</p>

              <h3 className="mt-2 text-xl font-bold text-blue-700">
                {formatMoney(totals.debit)}
              </h3>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <FiDollarSign size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">إجمالي الدائن</p>

              <h3 className="mt-2 text-xl font-bold text-emerald-700">
                {formatMoney(totals.credit)}
              </h3>
            </div>

            <div className="rounded-lg bg-emerald-50 p-3 text-emerald-600">
              <FiDollarSign size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">الفرق</p>

              <h3
                className={`mt-2 text-xl font-bold ${
                  totals.balanced ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {formatMoney(totals.difference)}
              </h3>
            </div>

            <div
              className={`rounded-lg p-3 ${
                totals.balanced
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {totals.balanced ? (
                <FiCheckCircle size={22} />
              ) : (
                <FiAlertCircle size={22} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Balance status */}
      <div
        className={`flex items-center gap-3 rounded-xl border p-4 ${
          totals.balanced
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-amber-200 bg-amber-50 text-amber-800"
        }`}
      >
        {totals.balanced ? (
          <FiCheckCircle size={22} />
        ) : (
          <FiAlertCircle size={22} />
        )}

        <div>
          <p className="font-semibold">
            {totals.balanced ? "الأرصدة متوازنة" : "الأرصدة غير متوازنة"}
          </p>

          <p className="mt-1 text-xs">
            {totals.balanced
              ? "إجمالي المدين يساوي إجمالي الدائن."
              : `يوجد فرق بمقدار ${formatMoney(totals.difference)} بين المدين والدائن.`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="relative">
            <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث برقم الحساب أو اسمه..."
              className="w-full rounded-lg border border-slate-200 py-2.5 pr-10 pl-3 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <div className="relative">
            <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 py-2.5 pr-10 pl-3 text-sm outline-none focus:border-slate-500"
            />
          </div>

          <button
            onClick={() => {
              setSearch("");
              setSelectedDate("");
            }}
            className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50"
          >
            <FiFilter />
            إعادة ضبط البحث
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 p-4">
          <h2 className="font-bold text-slate-800">
            تفاصيل الأرصدة الافتتاحية
          </h2>

          <span className="text-xs text-slate-500">
            {filteredEntries.length} سجل
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-right text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-4">#</th>
                <th className="px-4 py-4">رقم الحساب</th>
                <th className="px-4 py-4">اسم الحساب</th>
                <th className="px-4 py-4">التاريخ</th>
                <th className="px-4 py-4">مدين</th>
                <th className="px-4 py-4">دائن</th>
                <th className="px-4 py-4">البيان</th>
                <th className="px-4 py-4 text-center">الإجراءات</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    لا توجد أرصدة افتتاحية
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, index) => {
                  const account = getAccount(entry.accountId);

                  return (
                    <tr key={entry.id} className="transition hover:bg-slate-50">
                      <td className="px-4 py-4 text-slate-400">{index + 1}</td>

                      <td className="px-4 py-4 font-semibold text-slate-700">
                        {account?.code || "-"}
                      </td>

                      <td className="px-4 py-4 font-medium text-slate-800">
                        {account?.name || "حساب غير معروف"}
                      </td>

                      <td className="px-4 py-4 text-slate-500">
                        {formatDate(entry.date)}
                      </td>

                      <td className="px-4 py-4 font-semibold text-blue-700">
                        {formatMoney(Number(entry.debit || 0))}
                      </td>

                      <td className="px-4 py-4 font-semibold text-emerald-700">
                        {formatMoney(Number(entry.credit || 0))}
                      </td>

                      <td className="max-w-[200px] truncate px-4 py-4 text-slate-500">
                        {entry.description || entry.reference || "-"}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/erp/accounting/opening-entries/${entry.id}/edit`}
                            title="تعديل"
                            className="rounded-lg border border-blue-100 p-2 text-blue-600 hover:bg-blue-50"
                          >
                            <FiEdit size={16} />
                          </Link>

                          <button
                            onClick={() => handleDelete(entry)}
                            disabled={deleting === entry.id}
                            title="حذف"
                            className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            {deleting === entry.id ? (
                              <FiRefreshCw className="animate-spin" size={16} />
                            ) : (
                              <FiTrash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {filteredEntries.length > 0 && (
              <tfoot className="border-t-2 border-slate-200 bg-slate-50 font-bold">
                <tr>
                  <td colSpan={4} className="px-4 py-4 text-slate-700">
                    الإجمالي
                  </td>

                  <td className="px-4 py-4 text-blue-700">
                    {formatMoney(totals.debit)}
                  </td>

                  <td className="px-4 py-4 text-emerald-700">
                    {formatMoney(totals.credit)}
                  </td>

                  <td colSpan={2} className="px-4 py-4">
                    {totals.balanced ? (
                      <span className="text-emerald-700">متوازن</span>
                    ) : (
                      <span className="text-red-600">غير متوازن</span>
                    )}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}
