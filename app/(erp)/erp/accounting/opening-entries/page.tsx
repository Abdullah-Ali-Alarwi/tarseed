"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import {
  FiPlus,
  FiSearch,
  FiRefreshCw,
  FiEdit2,
  FiTrash2,
  FiBookOpen,
  FiDollarSign,
  FiArrowUpCircle,
  FiArrowDownCircle,
} from "react-icons/fi";
import { toast } from "sonner";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// المستخدم الحالي
interface CurrentUser {
  id: number | string;
  name: string;
  username: string;
  type: string;
  role: string;
  companyId?: string;
  companyname?: string;
}

// الحساب
interface Account {
  id: number | string;
  code: string;
  name: string;
  type: "asset" | "liability" | "equity" | "revenue" | "expense";
  nature: "debit" | "credit";
  isGroup: boolean;
  allowPosting: boolean;
  isActive: boolean;
  companyId: string;
}

// الرصيد الافتتاحي
interface OpeningEntry {
  id: number | string;
  accountId: number | string;
  date: string;
  debit: number;
  credit: number;
  description?: string;
  reference?: string;
  companyId: string;
  createdAt?: string;
  createdBy?: string;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;

  const cookie = document.cookie
    .split("; ")
    .find((item) => item.startsWith(`${name}=`));

  if (!cookie) return null;

  return decodeURIComponent(cookie.substring(name.length + 1));
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("ar-YE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value || 0);

const formatDate = (date: string) => {
  if (!date) return "-";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return "-";

  return new Intl.DateTimeFormat("ar-YE", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(parsedDate);
};

export default function OpeningEntriesPage() {
  const router = useRouter();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  const [companyId, setCompanyId] = useState("");

  const [userLoading, setUserLoading] = useState(true);

  const [userError, setUserError] = useState("");

  const [accounts, setAccounts] = useState<Account[]>([]);

  const [entries, setEntries] = useState<OpeningEntry[]>([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [search, setSearch] = useState("");

  const [dateFilter, setDateFilter] = useState("");

  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  // تحديد المستخدم الحالي والشركة
  useEffect(() => {
    const loadUser = async () => {
      try {
        setUserLoading(true);
        setUserError("");

        const username = getCookie("username");

        if (!username) {
          throw new Error("لم يتم العثور على بيانات تسجيل الدخول");
        }

        const response = await axios.get<CurrentUser[]>(`${API_URL}/users`, {
          params: { username },
        });

        const user = response.data[0];

        if (!user) {
          throw new Error("المستخدم غير موجود");
        }

        if (user.type === "platform") {
          throw new Error("لا يمكن لمستخدم المنصة الوصول إلى هذه الصفحة");
        }

        if (!user.companyId) {
          throw new Error("المستخدم غير مرتبط بأي شركة");
        }

        setCurrentUser(user);
        setCompanyId(user.companyId);
      } catch (err) {
        const message = axios.isAxiosError(err)
          ? err.response?.data?.message || "تعذر الاتصال بالخادم"
          : err instanceof Error
            ? err.message
            : "حدث خطأ غير متوقع";

        setUserError(message);
      } finally {
        setUserLoading(false);
      }
    };

    void loadUser();
  }, []);

  // تحميل الحسابات والأرصدة الافتتاحية
  const fetchData = useCallback(async () => {
    if (!companyId) return;

    try {
      setLoading(true);
      setError("");

      const [accountsResponse, entriesResponse] = await Promise.all([
        axios.get<Account[]>(`${API_URL}/accounts`, {
          params: { companyId },
        }),

        axios.get<OpeningEntry[]>(`${API_URL}/openingEntries`, {
          params: { companyId },
        }),
      ]);

      setAccounts(
        accountsResponse.data.filter(
          (account) => account.companyId === companyId,
        ),
      );

      setEntries(
        entriesResponse.data.filter((entry) => entry.companyId === companyId),
      );
    } catch (err) {
      console.error("Opening Entries Error:", err);

      setError(
        axios.isAxiosError(err)
          ? err.response?.data?.message || "تعذر تحميل الأرصدة الافتتاحية"
          : "حدث خطأ أثناء تحميل البيانات",
      );
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    if (companyId) {
      void fetchData();
    }
  }, [companyId, fetchData]);

  // خريطة الحسابات
  const accountMap = useMemo(() => {
    return new Map(accounts.map((account) => [String(account.id), account]));
  }, [accounts]);

  // الحسابات القابلة للترحيل
  const postingAccounts = useMemo(() => {
    return accounts.filter(
      (account) => account.isActive && account.allowPosting && !account.isGroup,
    );
  }, [accounts]);

  // تصفية الأرصدة
  const filteredEntries = useMemo(() => {
    return entries
      .filter((entry) => {
        const account = accountMap.get(String(entry.accountId));

        if (!account) return false;

        const searchText = search.trim().toLowerCase();

        const matchesSearch =
          !searchText ||
          account.name.toLowerCase().includes(searchText) ||
          account.code.toLowerCase().includes(searchText) ||
          (entry.description || "").toLowerCase().includes(searchText) ||
          (entry.reference || "").toLowerCase().includes(searchText);

        const matchesDate = !dateFilter || entry.date === dateFilter;

        return matchesSearch && matchesDate;
      })
      .sort((a, b) => {
        const accountA = accountMap.get(String(a.accountId));

        const accountB = accountMap.get(String(b.accountId));

        return String(accountA?.code || "").localeCompare(
          String(accountB?.code || ""),
          undefined,
          { numeric: true },
        );
      });
  }, [entries, accountMap, search, dateFilter]);

  // إجماليات الأرصدة
  const totals = useMemo(() => {
    const debit = entries.reduce(
      (sum, entry) => sum + Number(entry.debit || 0),
      0,
    );

    const credit = entries.reduce(
      (sum, entry) => sum + Number(entry.credit || 0),
      0,
    );

    const difference = debit - credit;

    return {
      debit,
      credit,
      difference,
      balanced: Math.abs(difference) < 0.000001,
    };
  }, [entries]);

  // حذف رصيد افتتاحي
  const handleDelete = async (entry: OpeningEntry) => {
    const confirmed = window.confirm(
      "هل أنت متأكد من حذف هذا الرصيد الافتتاحي؟",
    );

    if (!confirmed) return;

    try {
      setDeletingId(entry.id);

      await axios.delete(`${API_URL}/openingEntries/${entry.id}`, {
        params: { companyId },
      });

      setEntries((prev) => prev.filter((item) => item.id !== entry.id));

      toast.success("تم حذف الرصيد الافتتاحي بنجاح");
    } catch (err) {
      console.error(err);

      toast.error("تعذر حذف الرصيد الافتتاحي");
    } finally {
      setDeletingId(null);
    }
  };

  // تحميل المستخدم
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

  if (userError || !companyId) {
    return (
      <div
        dir="rtl"
        className="flex min-h-screen items-center justify-center bg-slate-50 p-5"
      >
        <div className="w-full max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
          <h2 className="font-bold text-red-600">
            تعذر فتح الأرصدة الافتتاحية
          </h2>

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

  return (
    <div
      dir="rtl"
      className="min-h-screen space-y-6 bg-slate-50 p-5 pb-10 text-slate-800"
    >
      {/* العنوان */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            الأرصدة الافتتاحية
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            تسجيل ومراجعة أرصدة الحسابات عند بداية العمل بالنظام
          </p>

          <p className="mt-2 text-sm text-blue-700">
            الشركة:{" "}
            <span className="font-semibold">
              {currentUser?.companyname || "الشركة الحالية"}
            </span>
          </p>
        </div>

        <button
          onClick={() => router.push("/erp/accounting/opening-entries/create")}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-blue-700"
        >
          <FiPlus size={19} />
          إضافة أرصدة افتتاحية
        </button>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">عدد الحسابات ذات الأرصدة</p>
            <FiBookOpen className="text-blue-600" size={22} />
          </div>

          <h3 className="mt-3 text-2xl font-bold text-slate-900">
            {new Set(entries.map((item) => String(item.accountId))).size}
          </h3>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">إجمالي المدين</p>
            <FiArrowUpCircle className="text-green-600" size={22} />
          </div>

          <h3 className="mt-3 text-2xl font-bold text-green-700">
            {formatCurrency(totals.debit)}
          </h3>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">إجمالي الدائن</p>
            <FiArrowDownCircle className="text-red-600" size={22} />
          </div>

          <h3 className="mt-3 text-2xl font-bold text-red-700">
            {formatCurrency(totals.credit)}
          </h3>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">حالة التوازن</p>
            <FiDollarSign className="text-blue-600" size={22} />
          </div>

          <h3
            className={`mt-3 text-xl font-bold ${
              totals.balanced ? "text-green-700" : "text-red-600"
            }`}
          >
            {totals.balanced ? "متوازن" : "غير متوازن"}
          </h3>

          {!totals.balanced && (
            <p className="mt-1 text-xs text-red-500">
              الفرق: {formatCurrency(Math.abs(totals.difference))}
            </p>
          )}
        </div>
      </div>

      {/* تنبيه عدم التوازن */}
      {entries.length > 0 && !totals.balanced && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          تنبيه: إجمالي الأرصدة المدينة لا يساوي إجمالي الأرصدة الدائنة. يجب
          مراجعة الأرصدة قبل اعتمادها.
        </div>
      )}

      {/* البحث والتصفية */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              البحث
            </label>

            <div className="relative">
              <FiSearch
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="اسم الحساب أو رقمه أو البيان..."
                className="w-full rounded-lg border border-slate-300 py-3 pl-3 pr-10 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              تاريخ الرصيد
            </label>

            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-between">
          <button
            onClick={() => {
              setSearch("");
              setDateFilter("");
            }}
            className="text-sm text-slate-500 hover:text-red-600"
          >
            مسح الفلاتر
          </button>

          <button
            onClick={() => void fetchData()}
            disabled={loading}
            className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            تحديث البيانات
          </button>
        </div>
      </div>

      {/* الجدول */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="font-bold text-slate-800">قائمة الأرصدة الافتتاحية</h2>

          <p className="mt-1 text-xs text-slate-500">
            عدد النتائج: {filteredEntries.length}
          </p>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500">
            جارٍ تحميل البيانات...
          </div>
        ) : error ? (
          <div className="py-16 text-center">
            <p className="text-red-600">{error}</p>

            <button
              onClick={() => void fetchData()}
              className="mt-4 text-sm text-blue-600"
            >
              إعادة المحاولة
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-right text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4">رقم الحساب</th>
                  <th className="px-5 py-4">اسم الحساب</th>
                  <th className="px-5 py-4">التاريخ</th>
                  <th className="px-5 py-4">البيان</th>
                  <th className="px-5 py-4">مدين</th>
                  <th className="px-5 py-4">دائن</th>
                  <th className="px-5 py-4 text-center">الإجراءات</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredEntries.map((entry) => {
                  const account = accountMap.get(String(entry.accountId));

                  return (
                    <tr key={entry.id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-4 font-semibold text-blue-700">
                        {account?.code || "-"}
                      </td>

                      <td className="px-5 py-4 font-medium text-slate-800">
                        {account?.name || "حساب غير موجود"}
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap text-slate-600">
                        {formatDate(entry.date)}
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {entry.description || "-"}
                      </td>

                      <td className="px-5 py-4 font-medium text-green-700">
                        {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                      </td>

                      <td className="px-5 py-4 font-medium text-red-700">
                        {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            title="تعديل"
                            onClick={() =>
                              router.push(
                                `/erp/accounting/opening-entries/${entry.id}/edit`,
                              )
                            }
                            className="rounded-lg bg-blue-50 p-2 text-blue-600 hover:bg-blue-100"
                          >
                            <FiEdit2 size={16} />
                          </button>

                          <button
                            title="حذف"
                            disabled={deletingId === entry.id}
                            onClick={() => void handleDelete(entry)}
                            className="rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:opacity-50"
                          >
                            {deletingId === entry.id ? (
                              <FiRefreshCw size={16} className="animate-spin" />
                            ) : (
                              <FiTrash2 size={16} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <FiBookOpen
                        size={40}
                        className="mx-auto mb-3 text-slate-300"
                      />

                      <p className="font-medium text-slate-600">
                        لا توجد أرصدة افتتاحية
                      </p>

                      <p className="mt-2 text-xs text-slate-400">
                        أضف الأرصدة الافتتاحية لبدء استخدام النظام المحاسبي
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>

              <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-4 font-bold text-slate-800"
                  >
                    إجمالي الأرصدة الافتتاحية
                  </td>

                  <td className="px-5 py-4 font-bold text-green-700">
                    {formatCurrency(
                      filteredEntries.reduce(
                        (sum, entry) => sum + Number(entry.debit || 0),
                        0,
                      ),
                    )}
                  </td>

                  <td className="px-5 py-4 font-bold text-red-700">
                    {formatCurrency(
                      filteredEntries.reduce(
                        (sum, entry) => sum + Number(entry.credit || 0),
                        0,
                      ),
                    )}
                  </td>

                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
