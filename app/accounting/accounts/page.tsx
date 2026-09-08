"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiBookOpen,
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiFilter,
  FiRefreshCw,
  FiPrinter,
  FiChevronDown,
  FiChevronLeft,
  FiX,
  FiSave,
} from "react-icons/fi";
import { useERPStore, type AccountType, type Account } from "@/Store/erpStore";

const typeLabels: Record<AccountType, string> = {
  asset: "أصل",
  liability: "التزام",
  equity: "حقوق ملكية",
  revenue: "إيراد",
  expense: "مصروف",
};

export default function AccountsPage() {
  const { accounts, journalEntries, addAccount, updateAccount, deleteAccount } =
    useERPStore();

  const [search, setSearch] = useState("");

  const [typeFilter, setTypeFilter] = useState<"all" | AccountType>("all");

  const [showZeroBalances, setShowZeroBalances] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [viewAccount, setViewAccount] = useState<Account | null>(null);

  const [form, setForm] = useState({
    name: "",
    type: "asset" as AccountType,
    parent: "",
    level: 0,
    description: "",
  });

  /* ======================================================
     أرصدة الحسابات
  ====================================================== */

  const accountBalances = useMemo(() => {
    const balances: Record<
      string,
      {
        debit: number;
        credit: number;
        balance: number;
      }
    > = {};

    accounts.forEach((account) => {
      balances[account.code] = {
        debit: 0,
        credit: 0,
        balance: 0,
      };
    });

    journalEntries
      .filter((entry) => entry.status === "posted")
      .forEach((entry) => {
        entry.lines.forEach((line) => {
          if (!balances[line.accountCode]) {
            balances[line.accountCode] = {
              debit: 0,
              credit: 0,
              balance: 0,
            };
          }

          balances[line.accountCode].debit += Number(line.debit || 0);

          balances[line.accountCode].credit += Number(line.credit || 0);

          balances[line.accountCode].balance =
            balances[line.accountCode].debit -
            balances[line.accountCode].credit;
        });
      });

    return balances;
  }, [accounts, journalEntries]);

  /* ======================================================
     الحسابات المفلترة
  ====================================================== */

  const filteredAccounts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...accounts]
      .filter((account) => {
        const matchesSearch =
          !query ||
          account.code.toLowerCase().includes(query) ||
          account.name.toLowerCase().includes(query);

        const matchesType = typeFilter === "all" || account.type === typeFilter;

        const balance = accountBalances[account.code]?.balance ?? 0;

        const matchesZeroBalance =
          showZeroBalances || account.level === 0 || balance !== 0;

        return matchesSearch && matchesType && matchesZeroBalance;
      })
      .sort((a, b) =>
        a.code.localeCompare(b.code, undefined, {
          numeric: true,
        }),
      );
  }, [accounts, search, typeFilter, showZeroBalances, accountBalances]);

  /* ======================================================
     الإحصائيات
  ====================================================== */

  const stats = useMemo(() => {
    let totalAssets = 0;
    let totalLiabilities = 0;
    let totalEquity = 0;
    let totalRevenue = 0;
    let totalExpenses = 0;

    accounts
      .filter((account) => account.level !== 0)
      .forEach((account) => {
        const balance = accountBalances[account.code]?.balance ?? 0;

        if (account.type === "asset") {
          totalAssets += balance;
        }

        if (account.type === "liability") {
          totalLiabilities += Math.abs(balance);
        }

        if (account.type === "equity") {
          totalEquity += Math.abs(balance);
        }

        if (account.type === "revenue") {
          totalRevenue += Math.abs(balance);
        }

        if (account.type === "expense") {
          totalExpenses += balance;
        }
      });

    return {
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalRevenue,
      totalExpenses,
      accountCount: accounts.filter((account) => account.level !== 0).length,
      rootAccountCount: accounts.filter((account) => account.level === 0)
        .length,
    };
  }, [accounts, accountBalances]);

  /* ======================================================
     تنسيق المبالغ
  ====================================================== */

  const formatMoney = (value: number) => {
    return Number(value || 0).toLocaleString("ar-SA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  /* ======================================================
     تسمية الرصيد
  ====================================================== */

  const getBalanceLabel = (account: Account) => {
    if (account.level === 0) {
      return "—";
    }

    const balance = accountBalances[account.code]?.balance ?? 0;

    if (balance === 0) {
      return "0.00";
    }

    return formatMoney(Math.abs(balance));
  };

  /* ======================================================
     طبيعة الرصيد
  ====================================================== */

  const getBalanceType = (account: Account) => {
    if (account.level === 0) {
      return "";
    }

    const balance = accountBalances[account.code]?.balance ?? 0;

    if (balance === 0) {
      return "";
    }

    if (account.type === "asset" || account.type === "expense") {
      return balance >= 0 ? "مدين" : "دائن";
    }

    return balance >= 0 ? "دائن" : "مدين";
  };

  /* ======================================================
     لون نوع الحساب
  ====================================================== */

  const getTypeBadge = (type: AccountType) => {
    const styles: Record<AccountType, string> = {
      asset: "bg-blue-50 text-blue-700",
      liability: "bg-red-50 text-red-700",
      equity: "bg-purple-50 text-purple-700",
      revenue: "bg-green-50 text-green-700",
      expense: "bg-orange-50 text-orange-700",
    };

    return styles[type];
  };

  /* ======================================================
     فتح إضافة
  ====================================================== */

  const openAddModal = () => {
    setEditingId(null);

    setForm({
      name: "",
      type: "asset",
      parent: "",
      level: 0,
      description: "",
    });

    setShowModal(true);
  };

  /* ======================================================
     فتح تعديل
  ====================================================== */

  const openEditModal = (account: Account) => {
    setEditingId(account.id);

    setForm({
      name: account.name,
      type: account.type,
      parent: account.parent,
      level: account.level,
      description: account.description || "",
    });

    setShowModal(true);
  };

  /* ======================================================
     عرض الحساب
  ====================================================== */

  const openViewModal = (account: Account) => {
    setViewAccount(account);
  };

  /* ======================================================
     إغلاق النافذة
  ====================================================== */

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  /* ======================================================
     الحسابات الرئيسية
  ====================================================== */

  const rootAccounts = useMemo(() => {
    return accounts
      .filter((account) => account.level === 0)
      .filter((account) => account.id !== editingId)
      .sort((a, b) =>
        a.code.localeCompare(b.code, undefined, {
          numeric: true,
        }),
      );
  }, [accounts, editingId]);

  /* ======================================================
     حفظ الحساب
  ====================================================== */

  const handleSaveAccount = () => {
    const name = form.name.trim();

    if (!name) {
      alert("يرجى إدخال اسم الحساب.");
      return;
    }

    if (form.level > 0 && !form.parent.trim()) {
      alert("يرجى اختيار الحساب الأب.");
      return;
    }

    if (form.parent.trim()) {
      const parentAccount = accounts.find(
        (account) => account.code === form.parent,
      );

      if (!parentAccount) {
        alert("الحساب الأب المحدد غير موجود.");
        return;
      }

      if (parentAccount.level !== 0) {
        alert("لا يمكن اختيار حساب فرعي كحساب أب. يجب اختيار حساب رئيسي.");
        return;
      }

      if (parentAccount.type !== form.type) {
        alert(
          `نوع الحساب يجب أن يتوافق مع نوع الحساب الأب (${typeLabels[parentAccount.type]}).`,
        );
        return;
      }
    }

    const accountData = {
      name,
      type: form.type,
      parent: form.parent.trim(),
      level: form.parent.trim() ? 1 : 0,
      description: form.description.trim() || undefined,
    };

    if (editingId) {
      updateAccount(editingId, accountData);

      alert("تم تعديل الحساب وحفظ التغييرات بنجاح.");
    } else {
      addAccount(accountData);

      alert("تم إضافة الحساب بنجاح، وتم إنشاء رقم الحساب تلقائيًا.");
    }

    closeModal();
  };

  /* ======================================================
     حذف الحساب
  ====================================================== */

  const handleDelete = (account: Account) => {
    const hasChildren = accounts.some((item) => item.parent === account.code);

    if (hasChildren) {
      alert("لا يمكن حذف هذا الحساب لأنه يحتوي على حسابات فرعية.");
      return;
    }

    const usedInJournal = journalEntries.some((entry) =>
      entry.lines.some((line) => line.accountCode === account.code),
    );

    if (usedInJournal) {
      alert("لا يمكن حذف هذا الحساب لأنه مستخدم في قيود يومية.");
      return;
    }

    const confirmed = window.confirm(
      `هل أنت متأكد من حذف الحساب "${account.name}"؟`,
    );

    if (!confirmed) {
      return;
    }

    deleteAccount(account.id);
  };

  /* ======================================================
     الطباعة
  ====================================================== */

  const handlePrint = () => {
    window.print();
  };

  /* ======================================================
     إعادة ضبط الفلاتر
  ====================================================== */

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setShowZeroBalances(true);
  };

  return (
    <>
      <main dir="rtl" className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-7">
        {/* ==================================================
            Header
        ================================================== */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-7 print:hidden">
          <div>
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <Link
                href="/accounting"
                className="hover:text-amber-600 transition"
              >
                المحاسبة
              </Link>

              <FiChevronLeft className="w-3 h-3" />

              <span className="text-gray-700">دليل الحسابات</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <FiBookOpen className="w-5 h-5" />
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                  دليل الحسابات
                </h1>

                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  إدارة وتصنيف الحسابات المحاسبية للنظام
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs sm:text-sm font-medium transition"
            >
              <FiPrinter className="w-4 h-4" />
              طباعة
            </button>

            <button
              type="button"
              onClick={openAddModal}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs sm:text-sm font-medium transition"
            >
              <FiPlus className="w-4 h-4" />
              حساب جديد
            </button>
          </div>
        </div>

        {/* ==================================================
            Summary
        ================================================== */}

        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 print:hidden">
          <StatCard
            title="الحسابات الفرعية"
            value={stats.accountCount.toString()}
            subtitle="حساب"
          />

          <StatCard
            title="الحسابات الرئيسية"
            value={stats.rootAccountCount.toString()}
            subtitle="حساب"
          />

          <StatCard
            title="الأصول"
            value={formatMoney(stats.totalAssets)}
            subtitle="ريال"
          />

          <StatCard
            title="الالتزامات"
            value={formatMoney(stats.totalLiabilities)}
            subtitle="ريال"
          />

          <StatCard
            title="الإيرادات"
            value={formatMoney(stats.totalRevenue)}
            subtitle="ريال"
          />

          <StatCard
            title="المصروفات"
            value={formatMoney(stats.totalExpenses)}
            subtitle="ريال"
          />
        </div>

        {/* ==================================================
            Filters
        ================================================== */}

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 sm:p-5 mb-6 print:hidden">
          <div className="flex items-center gap-2 mb-4">
            <FiFilter className="w-4 h-4 text-amber-600" />

            <h2 className="text-sm font-bold text-gray-800">البحث والتصفية</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="البحث بالكود أو اسم الحساب..."
                className="w-full pr-9 pl-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-800 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) =>
                setTypeFilter(e.target.value as "all" | AccountType)
              }
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-800 text-xs sm:text-sm outline-none focus:border-amber-500"
            >
              <option value="all">جميع أنواع الحسابات</option>

              <option value="asset">الأصول</option>

              <option value="liability">الالتزامات</option>

              <option value="equity">حقوق الملكية</option>

              <option value="revenue">الإيرادات</option>

              <option value="expense">المصروفات</option>
            </select>

            <div className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg px-3 py-2.5">
              <label className="text-xs sm:text-sm text-gray-700 cursor-pointer">
                إظهار الحسابات صفر الرصيد
              </label>

              <button
                type="button"
                onClick={() => setShowZeroBalances(!showZeroBalances)}
                className={`relative w-10 h-5 rounded-full transition ${
                  showZeroBalances ? "bg-amber-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition ${
                    showZeroBalances ? "right-0.5" : "right-[22px]"
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex justify-end mt-3">
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-2 text-xs text-gray-500 hover:text-amber-600 transition"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
              إعادة ضبط الفلاتر
            </button>
          </div>
        </div>

        {/* ==================================================
            Accounts Table
        ================================================== */}

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-800">
                الحسابات
              </h2>

              <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
                عدد النتائج: {filteredAccounts.length}
              </p>
            </div>

            <div className="text-[10px] sm:text-[11px] text-gray-400">
              البيانات محفوظة في Zustand + LocalStorage
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-right">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                    الكود
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                    اسم الحساب
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                    النوع
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                    مدين
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                    دائن
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                    الرصيد
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                    طبيعة الرصيد
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 text-center">
                    إجراءات
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <FiBookOpen className="w-8 h-8 text-gray-200 mx-auto mb-3" />

                      <p className="text-sm font-medium text-gray-600">
                        لا توجد حسابات
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        ابدأ بإضافة أول حساب إلى دليل الحسابات.
                      </p>

                      <button
                        type="button"
                        onClick={openAddModal}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-xs hover:bg-amber-700 transition"
                      >
                        <FiPlus className="w-3.5 h-3.5" />
                        إضافة حساب
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((account) => {
                    const balanceData = accountBalances[account.code] || {
                      debit: 0,
                      credit: 0,
                      balance: 0,
                    };

                    const isParent = account.level === 0;

                    const balanceType = getBalanceType(account);

                    return (
                      <tr
                        key={account.id}
                        className={`hover:bg-gray-50 transition ${
                          isParent ? "bg-gray-50/70" : ""
                        }`}
                      >
                        <td className="px-4 py-3 align-middle">
                          <span
                            className={`text-xs font-mono ${
                              isParent
                                ? "font-bold text-gray-800"
                                : "text-gray-600"
                            }`}
                          >
                            {account.code}
                          </span>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div
                            className="flex items-center gap-2"
                            style={{
                              paddingRight: account.level * 22,
                            }}
                          >
                            {isParent ? (
                              <FiChevronDown className="w-3.5 h-3.5 text-gray-400" />
                            ) : (
                              <FiChevronLeft className="w-3 h-3 text-gray-300" />
                            )}

                            <div>
                              <p
                                className={`text-xs ${
                                  isParent
                                    ? "font-bold text-gray-800"
                                    : "font-medium text-gray-700"
                                }`}
                              >
                                {account.name}
                              </p>

                              {account.description && (
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {account.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <span
                            className={`inline-flex px-2 py-1 rounded-full text-[10px] font-medium ${getTypeBadge(
                              account.type,
                            )}`}
                          >
                            {typeLabels[account.type]}
                          </span>
                        </td>

                        <td className="px-4 py-3 align-middle text-xs text-gray-600">
                          {isParent ? "—" : formatMoney(balanceData.debit)}
                        </td>

                        <td className="px-4 py-3 align-middle text-xs text-gray-600">
                          {isParent ? "—" : formatMoney(balanceData.credit)}
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <span
                            className={`text-xs font-bold ${
                              balanceData.balance === 0
                                ? "text-gray-400"
                                : "text-gray-800"
                            }`}
                          >
                            {getBalanceLabel(account)}
                          </span>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          {balanceType ? (
                            <span
                              className={`text-[10px] font-medium px-2 py-1 rounded ${
                                balanceType === "مدين"
                                  ? "bg-blue-50 text-blue-600"
                                  : "bg-green-50 text-green-600"
                              }`}
                            >
                              {balanceType}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">—</span>
                          )}
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              title="عرض"
                              onClick={() => openViewModal(account)}
                              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            >
                              <FiEye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              title="تعديل"
                              onClick={() => openEditModal(account)}
                              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition"
                            >
                              <FiEdit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              title="حذف"
                              onClick={() => handleDelete(account)}
                              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>

              <tfoot className="bg-gray-50 border-t border-gray-200">
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-3 text-xs font-bold text-gray-700"
                  >
                    إجمالي الأرصدة الظاهرة
                  </td>

                  <td className="px-4 py-3 text-xs font-bold text-gray-800">
                    {formatMoney(
                      filteredAccounts.reduce(
                        (sum, account) =>
                          sum + (accountBalances[account.code]?.debit || 0),
                        0,
                      ),
                    )}
                  </td>

                  <td className="px-4 py-3 text-xs font-bold text-gray-800">
                    {formatMoney(
                      filteredAccounts.reduce(
                        (sum, account) =>
                          sum + (accountBalances[account.code]?.credit || 0),
                        0,
                      ),
                    )}
                  </td>

                  <td colSpan={3} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* ==================================================
            Information
        ================================================== */}

        <div className="mt-5 bg-amber-50 border border-amber-100 rounded-xl p-4 print:hidden">
          <div className="flex gap-3">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
              <FiBookOpen className="w-4 h-4" />
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-800">
                آلية ترقيم الحسابات
              </h3>

              <p className="text-[11px] sm:text-xs text-gray-600 leading-6 mt-1">
                يتم إنشاء رقم الحساب تلقائيًا بواسطة النظام. الحسابات الرئيسية
                تبدأ من 1000 للأصول، 2000 للالتزامات، 3000 لحقوق الملكية، 4000
                للإيرادات، و5000 للمصروفات. أما الحسابات الفرعية فيتم ترقيمها
                تلقائيًا أسفل الحساب الأب.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ==================================================
          Add / Edit Modal
      ================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />

          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-800">
                  {editingId ? "تعديل الحساب" : "إضافة حساب جديد"}
                </h2>

                <p className="text-[11px] text-gray-400 mt-1">
                  رقم الحساب يتم إنشاؤه تلقائيًا بواسطة النظام
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* رقم + اسم */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-2">
                    رقم الحساب
                  </label>

                  <input
                    type="text"
                    value={
                      editingId
                        ? accounts.find((account) => account.id === editingId)
                            ?.code || ""
                        : "يُنشأ تلقائيًا"
                    }
                    readOnly
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm outline-none cursor-not-allowed"
                  />

                  {!editingId && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      سيقوم النظام بتحديد الرقم عند الحفظ
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-2">
                    اسم الحساب
                  </label>

                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                    placeholder="مثال: الصندوق"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-800 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />
                </div>
              </div>

              {/* النوع + الأب + المستوى */}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-2">
                    نوع الحساب
                  </label>

                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        type: e.target.value as AccountType,
                      })
                    }
                    disabled={!!form.parent && !editingId}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-800 text-sm outline-none focus:border-amber-500 disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <option value="asset">الأصول</option>

                    <option value="liability">الالتزامات</option>

                    <option value="equity">حقوق الملكية</option>

                    <option value="revenue">الإيرادات</option>

                    <option value="expense">المصروفات</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-2">
                    الحساب الأب
                  </label>

                  <select
                    value={form.parent}
                    onChange={(e) => {
                      const parentCode = e.target.value;

                      const parentAccount = accounts.find(
                        (account) => account.code === parentCode,
                      );

                      setForm({
                        ...form,
                        parent: parentCode,
                        level: parentCode ? 1 : 0,
                        type: parentAccount?.type || form.type,
                      });
                    }}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-800 text-sm outline-none focus:border-amber-500"
                  >
                    <option value="">بدون حساب أب</option>

                    {rootAccounts.map((account) => (
                      <option key={account.id} value={account.code}>
                        {account.code} - {account.name}
                      </option>
                    ))}
                  </select>

                  {rootAccounts.length === 0 && (
                    <p className="text-[10px] text-gray-400 mt-1">
                      لم تتم إضافة حسابات رئيسية بعد.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-2">
                    المستوى
                  </label>

                  <input
                    type="text"
                    value={form.level === 0 ? "حساب رئيسي" : "حساب فرعي"}
                    readOnly
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 text-sm outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* ملاحظة */}

              {form.parent ? (
                <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-2.5">
                  <p className="text-[11px] text-blue-700 leading-5">
                    سيتم إنشاء رقم هذا الحساب تلقائيًا تحت الحساب الأب المحدد.
                  </p>
                </div>
              ) : (
                <div className="rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5">
                  <p className="text-[11px] text-amber-700 leading-5">
                    هذا الحساب سيكون حسابًا رئيسيًا، وسيحصل تلقائيًا على رقم حسب
                    نوع الحساب وترتيبه.
                  </p>
                </div>
              )}

              {/* الوصف */}

              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  الوصف
                </label>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  placeholder="وصف الحساب..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-800 text-sm outline-none resize-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>
            </div>

            {/* Buttons */}

            <div className="flex items-center justify-end gap-2 px-5 py-4 bg-gray-50 border-t border-gray-100">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-600 text-xs font-medium hover:bg-gray-50 transition"
              >
                إلغاء
              </button>

              <button
                type="button"
                onClick={handleSaveAccount}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition"
              >
                <FiSave className="w-4 h-4" />

                {editingId ? "حفظ التعديلات" : "حفظ الحساب"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          View Modal
      ================================================== */}

      {viewAccount && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setViewAccount(null)}
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-800">
                  تفاصيل الحساب
                </h2>

                <p className="text-[11px] text-gray-400 mt-1">
                  معلومات الحساب ورصيده الحالي
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewAccount(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <ViewRow label="رقم الحساب" value={viewAccount.code} />

              <ViewRow label="اسم الحساب" value={viewAccount.name} />

              <ViewRow
                label="نوع الحساب"
                value={typeLabels[viewAccount.type]}
              />

              <ViewRow
                label="المستوى"
                value={viewAccount.level === 0 ? "حساب رئيسي" : "حساب فرعي"}
              />

              <ViewRow
                label="الحساب الأب"
                value={
                  viewAccount.parent
                    ? (() => {
                        const parent = accounts.find(
                          (account) => account.code === viewAccount.parent,
                        );

                        return parent
                          ? `${parent.code} - ${parent.name}`
                          : viewAccount.parent;
                      })()
                    : "لا يوجد"
                }
              />

              <ViewRow
                label="الوصف"
                value={viewAccount.description || "لا يوجد وصف"}
              />

              <ViewRow label="الرصيد" value={getBalanceLabel(viewAccount)} />

              {getBalanceType(viewAccount) && (
                <ViewRow
                  label="طبيعة الرصيد"
                  value={getBalanceType(viewAccount)}
                />
              )}
            </div>

            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewAccount(null)}
                className="px-4 py-2.5 rounded-lg bg-gray-800 text-white text-xs font-medium hover:bg-gray-900 transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          Print
      ================================================== */}

      <div className="hidden print:block accounts-print">
        <div className="text-center mb-5">
          <h1 className="text-xl font-bold">شركة الجابري</h1>

          <p className="text-sm">للعسل والزيوت الطبيعة وخدمات العمرة</p>

          <p className="text-xs text-gray-500">البيضاء - اليمن</p>

          <p className="text-xs text-gray-500 mt-1">
            هاتف: <bdi dir="ltr">734 434 443</bdi>
          </p>

          <h2 className="text-lg font-bold mt-5">دليل الحسابات</h2>
        </div>

        <table className="w-full border-collapse border border-gray-400 text-sm">
          <thead>
            <tr>
              <th className="border border-gray-400 p-2">الكود</th>

              <th className="border border-gray-400 p-2">اسم الحساب</th>

              <th className="border border-gray-400 p-2">النوع</th>

              <th className="border border-gray-400 p-2">مدين</th>

              <th className="border border-gray-400 p-2">دائن</th>

              <th className="border border-gray-400 p-2">الرصيد</th>
            </tr>
          </thead>

          <tbody>
            {filteredAccounts.map((account) => {
              const balanceData = accountBalances[account.code] || {
                debit: 0,
                credit: 0,
                balance: 0,
              };

              return (
                <tr key={account.id}>
                  <td className="border border-gray-400 p-2">{account.code}</td>

                  <td className="border border-gray-400 p-2">{account.name}</td>

                  <td className="border border-gray-400 p-2">
                    {typeLabels[account.type]}
                  </td>

                  <td className="border border-gray-400 p-2">
                    {account.level === 0 ? "—" : formatMoney(balanceData.debit)}
                  </td>

                  <td className="border border-gray-400 p-2">
                    {account.level === 0
                      ? "—"
                      : formatMoney(balanceData.credit)}
                  </td>

                  <td className="border border-gray-400 p-2">
                    {account.level === 0
                      ? "—"
                      : formatMoney(Math.abs(balanceData.balance))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ==================================================
          Print CSS
      ================================================== */}

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }

          body * {
            visibility: hidden;
          }

          .accounts-print,
          .accounts-print * {
            visibility: visible;
          }

          .accounts-print {
            position: absolute;
            top: 0;
            right: 0;
            left: 0;
            width: 100%;
            padding: 20px;
            background: white;
          }

          @page {
            size: A4 portrait;
            margin: 12mm;
          }
        }
      `}</style>
    </>
  );
}

/* ======================================================
   Stat Card
====================================================== */

function StatCard({
  title,
  value,
  subtitle,
}: {
  title: string;
  value: string;
  subtitle: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
      <p className="text-[10px] sm:text-xs text-gray-500">{title}</p>

      <div className="flex items-end gap-1.5 mt-2">
        <h3 className="text-base sm:text-lg font-bold text-gray-800">
          {value}
        </h3>

        <span className="text-[9px] sm:text-[10px] text-gray-400 mb-0.5">
          {subtitle}
        </span>
      </div>
    </div>
  );
}

/* ======================================================
   View Row
====================================================== */

function ViewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>

      <span className="text-xs font-medium text-gray-800 text-left">
        {value}
      </span>
    </div>
  );
}
