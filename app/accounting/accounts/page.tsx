"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FiUsers,
  FiSearch,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiFilter,
  FiRefreshCw,
  FiPrinter,
  FiChevronLeft,
  FiX,
  FiSave,
  FiPhone,
  FiMapPin,
  FiCreditCard,
} from "react-icons/fi";
import { useERPStore, type Agent, type AccountType } from "@/Store/erpStore";

export default function AgentsPage() {
  const {
    agents,
    addAgent,
    updateAgent,
    deleteAgent,
    accounts,
    journalEntries,
  } = useERPStore();

  const [search, setSearch] = useState("");

  const [showZeroBalances, setShowZeroBalances] = useState(true);

  const [showModal, setShowModal] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);

  const [viewAgent, setViewAgent] = useState<Agent | null>(null);

  const [form, setForm] = useState<{
    name: string;
    phone: string;
    address: string;
    balance: string;
    accountType: AccountType;
    accountParent: string;
  }>({
    name: "",
    phone: "",
    address: "",
    balance: "",
    accountType: "liability",
    accountParent: "",
  });

  /* ======================================================
     أنواع الحسابات
  ====================================================== */

  const accountTypes: {
    value: AccountType;
    label: string;
  }[] = [
    {
      value: "asset",
      label: "الأصول",
    },
    {
      value: "liability",
      label: "الالتزامات",
    },
    {
      value: "equity",
      label: "حقوق الملكية",
    },
    {
      value: "revenue",
      label: "الإيرادات",
    },
    {
      value: "expense",
      label: "المصروفات",
    },
  ];

  /* ======================================================
     ترجمة نوع الحساب
  ====================================================== */

  const getAccountTypeLabel = (type: AccountType) => {
    const item = accountTypes.find((item) => item.value === type);

    return item?.label || type;
  };

  /* ======================================================
     حسابات الأب حسب نوع الحساب
  ====================================================== */

  const parentAccounts = useMemo(() => {
    return accounts
      .filter(
        (account) =>
          account.type === form.accountType &&
          account.code !== form.accountParent,
      )
      .sort((a, b) => {
        if (a.level !== b.level) {
          return a.level - b.level;
        }

        return a.code.localeCompare(b.code, "ar");
      });
  }, [accounts, form.accountType, form.accountParent]);

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
     حساب أرصدة الوكلاء
  ====================================================== */

  const agentBalances = useMemo(() => {
    const balances: Record<
      string,
      {
        debit: number;
        credit: number;
        balance: number;
      }
    > = {};

    agents.forEach((agent) => {
      balances[agent.id] = {
        debit: 0,
        credit: 0,
        balance: Number(agent.balance || 0),
      };
    });

    journalEntries
      .filter((entry) => entry.status === "posted")
      .forEach((entry) => {
        entry.lines.forEach((line) => {
          const agent = agents.find(
            (item) => item.accountCode === line.accountCode,
          );

          if (!agent) {
            return;
          }

          if (!balances[agent.id]) {
            balances[agent.id] = {
              debit: 0,
              credit: 0,
              balance: Number(agent.balance || 0),
            };
          }

          balances[agent.id].debit += Number(line.debit || 0);

          balances[agent.id].credit += Number(line.credit || 0);

          balances[agent.id].balance =
            balances[agent.id].debit -
            balances[agent.id].credit +
            Number(agent.balance || 0);
        });
      });

    return balances;
  }, [agents, journalEntries]);

  /* ======================================================
     الوكلاء المفلترون
  ====================================================== */

  const filteredAgents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return [...agents]
      .filter((agent) => {
        const matchesSearch =
          !query ||
          agent.name.toLowerCase().includes(query) ||
          (agent.phone || "").toLowerCase().includes(query) ||
          (agent.address || "").toLowerCase().includes(query) ||
          (agent.accountCode || "").toLowerCase().includes(query);

        const balance =
          agentBalances[agent.id]?.balance ?? Number(agent.balance || 0);

        const matchesZeroBalance = showZeroBalances || balance !== 0;

        return matchesSearch && matchesZeroBalance;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }, [agents, search, showZeroBalances, agentBalances]);

  /* ======================================================
     الإحصائيات
  ====================================================== */

  const stats = useMemo(() => {
    let totalBalance = 0;

    agents.forEach((agent) => {
      totalBalance +=
        agentBalances[agent.id]?.balance ?? Number(agent.balance || 0);
    });

    const agentsWithAccounts = agents.filter(
      (agent) => agent.accountCode,
    ).length;

    return {
      totalAgents: agents.length,
      agentsWithAccounts,
      totalBalance,
    };
  }, [agents, agentBalances]);

  /* ======================================================
     رصيد الوكيل
  ====================================================== */

  const getAgentBalance = (agent: Agent) => {
    return agentBalances[agent.id]?.balance ?? Number(agent.balance || 0);
  };

  /* ======================================================
     طبيعة الرصيد
  ====================================================== */

  const getBalanceType = (agent: Agent) => {
    const balance = getAgentBalance(agent);

    if (balance === 0) {
      return "";
    }

    return balance > 0 ? "مدين" : "دائن";
  };

  /* ======================================================
     فتح إضافة وكيل
  ====================================================== */

  const openAddModal = () => {
    setEditingId(null);

    setForm({
      name: "",
      phone: "",
      address: "",
      balance: "",
      accountType: "liability",
      accountParent: "",
    });

    setShowModal(true);
  };

  /* ======================================================
     فتح تعديل وكيل
  ====================================================== */

  const openEditModal = (agent: Agent) => {
    const agentAccount = accounts.find(
      (account) => account.code === agent.accountCode,
    );

    setEditingId(agent.id);

    setForm({
      name: agent.name,
      phone: agent.phone || "",
      address: agent.address || "",
      balance: String(agent.balance ?? ""),
      accountType: agentAccount?.type || "liability",
      accountParent: agentAccount?.parent || "",
    });

    setShowModal(true);
  };

  /* ======================================================
     عرض الوكيل
  ====================================================== */

  const openViewModal = (agent: Agent) => {
    setViewAgent(agent);
  };

  /* ======================================================
     إغلاق النافذة
  ====================================================== */

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  /* ======================================================
     تغيير نوع الحساب
  ====================================================== */

  const handleAccountTypeChange = (type: AccountType) => {
    setForm((current) => ({
      ...current,
      accountType: type,
      accountParent: "",
    }));
  };

  /* ======================================================
     حفظ الوكيل
  ====================================================== */

  const handleSaveAgent = () => {
    const name = form.name.trim();

    if (!name) {
      alert("يرجى إدخال اسم الوكيل.");
      return;
    }

    const balance = Number(form.balance || 0);

    if (!Number.isFinite(balance)) {
      alert("يرجى إدخال رصيد افتتاحي صحيح.");
      return;
    }

    if (!form.accountParent) {
      alert("يرجى اختيار حساب الأب.");
      return;
    }

    const parentAccount = accounts.find(
      (account) => account.code === form.accountParent,
    );

    if (!parentAccount) {
      alert("حساب الأب غير موجود.");
      return;
    }

    if (parentAccount.type !== form.accountType) {
      alert("نوع حساب الأب لا يتطابق مع نوع الحساب المختار.");
      return;
    }

    const agentData = {
      name,
      phone: form.phone.trim() || undefined,
      address: form.address.trim() || undefined,
      balance,
    };

    if (editingId) {
      updateAgent(editingId, agentData);

      alert("تم تعديل بيانات الوكيل وحفظ التغييرات بنجاح.");
    } else {
      addAgent({
        ...agentData,
        accountType: form.accountType,
        accountParent: form.accountParent,
      });

      alert(
        "تم إضافة الوكيل بنجاح، وتم إنشاء حسابه المحاسبي تحت الحساب الأب المختار.",
      );
    }

    closeModal();
  };

  /* ======================================================
     حذف الوكيل
  ====================================================== */

  const handleDelete = (agent: Agent) => {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف الوكيل "${agent.name}"؟`,
    );

    if (!confirmed) {
      return;
    }

    if (agent.accountCode) {
      const usedInJournal = journalEntries.some((entry) =>
        entry.lines.some((line) => line.accountCode === agent.accountCode),
      );

      if (usedInJournal) {
        alert(
          "لا يمكن حذف هذا الوكيل لأن حسابه المحاسبي مستخدم في قيود يومية.",
        );

        return;
      }
    }

    deleteAgent(agent.id);
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

              <span className="text-gray-700">الوكلاء</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <FiUsers className="w-5 h-5" />
              </div>

              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                  إدارة الوكلاء
                </h1>

                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  إدارة بيانات الوكلاء وحساباتهم المحاسبية
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
              إضافة وكيل
            </button>
          </div>
        </div>

        {/* ==================================================
            Summary
        ================================================== */}

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 print:hidden">
          <StatCard
            title="إجمالي الوكلاء"
            value={stats.totalAgents.toString()}
            subtitle="وكيل"
          />

          <StatCard
            title="حسابات مرتبطة"
            value={stats.agentsWithAccounts.toString()}
            subtitle="حساب"
          />

          <StatCard
            title="إجمالي الأرصدة"
            value={formatMoney(Math.abs(stats.totalBalance))}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="البحث باسم الوكيل أو الهاتف أو الحساب..."
                className="w-full pr-9 pl-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-800 text-xs sm:text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
            </div>

            <div className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg px-3 py-2.5">
              <label className="text-xs sm:text-sm text-gray-700 cursor-pointer">
                إظهار الوكلاء صفر الرصيد
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
            Agents Table
        ================================================== */}

        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-5 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-gray-800">
                الوكلاء
              </h2>

              <p className="text-[11px] sm:text-xs text-gray-500 mt-1">
                عدد النتائج: {filteredAgents.length}
              </p>
            </div>

            <div className="text-[10px] sm:text-[11px] text-gray-400">
              البيانات محفوظة في Zustand + LocalStorage
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-right">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                    اسم الوكيل
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                    الهاتف
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                    العنوان
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-500">
                    الحساب المحاسبي
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
                    الطبيعة
                  </th>

                  <th className="px-4 py-3 text-[11px] font-semibold text-gray-500 text-center">
                    إجراءات
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-16 text-center">
                      <FiUsers className="w-8 h-8 text-gray-200 mx-auto mb-3" />

                      <p className="text-sm font-medium text-gray-600">
                        لا يوجد وكلاء
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        ابدأ بإضافة أول وكيل إلى النظام.
                      </p>

                      <button
                        type="button"
                        onClick={openAddModal}
                        className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-xs hover:bg-amber-700 transition"
                      >
                        <FiPlus className="w-3.5 h-3.5" />
                        إضافة وكيل
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((agent) => {
                    const balanceData = agentBalances[agent.id] || {
                      debit: 0,
                      credit: 0,
                      balance: Number(agent.balance || 0),
                    };

                    const balanceType = getBalanceType(agent);

                    const agentAccount = accounts.find(
                      (account) => account.code === agent.accountCode,
                    );

                    const parentAccount = accounts.find(
                      (account) => account.code === agentAccount?.parent,
                    );

                    return (
                      <tr
                        key={agent.id}
                        className="hover:bg-gray-50 transition"
                      >
                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                              <FiUsers className="w-3.5 h-3.5" />
                            </div>

                            <div>
                              <p className="text-xs font-bold text-gray-800">
                                {agent.name}
                              </p>

                              <p className="text-[10px] text-gray-400 mt-0.5">
                                وكيل
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600">
                            {agent.phone ? (
                              <>
                                <FiPhone className="w-3.5 h-3.5 text-gray-400" />

                                <span dir="ltr">{agent.phone}</span>
                              </>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <div className="flex items-center gap-1.5 text-xs text-gray-600 max-w-[180px]">
                            {agent.address ? (
                              <>
                                <FiMapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />

                                <span className="truncate">
                                  {agent.address}
                                </span>
                              </>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3 align-middle">
                          {agent.accountCode ? (
                            <div>
                              <p className="text-xs font-mono font-bold text-gray-700">
                                {agent.accountCode}
                              </p>

                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {agent.accountName || agent.name}
                              </p>

                              {parentAccount && (
                                <p className="text-[9px] text-amber-600 mt-1">
                                  الأب: {parentAccount.name}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex px-2 py-1 rounded-full bg-red-50 text-red-600 text-[10px]">
                              غير مرتبط
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 align-middle text-xs text-gray-600">
                          {formatMoney(balanceData.debit)}
                        </td>

                        <td className="px-4 py-3 align-middle text-xs text-gray-600">
                          {formatMoney(balanceData.credit)}
                        </td>

                        <td className="px-4 py-3 align-middle">
                          <span
                            className={`text-xs font-bold ${
                              balanceData.balance === 0
                                ? "text-gray-400"
                                : "text-gray-800"
                            }`}
                          >
                            {formatMoney(Math.abs(balanceData.balance))}
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
                              onClick={() => openViewModal(agent)}
                              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"
                            >
                              <FiEye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              title="تعديل"
                              onClick={() => openEditModal(agent)}
                              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition"
                            >
                              <FiEdit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              title="حذف"
                              onClick={() => handleDelete(agent)}
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
                    colSpan={4}
                    className="px-4 py-3 text-xs font-bold text-gray-700"
                  >
                    إجمالي الأرصدة الظاهرة
                  </td>

                  <td className="px-4 py-3 text-xs font-bold text-gray-800">
                    {formatMoney(
                      filteredAgents.reduce(
                        (sum, agent) =>
                          sum + (agentBalances[agent.id]?.debit || 0),
                        0,
                      ),
                    )}
                  </td>

                  <td className="px-4 py-3 text-xs font-bold text-gray-800">
                    {formatMoney(
                      filteredAgents.reduce(
                        (sum, agent) =>
                          sum + (agentBalances[agent.id]?.credit || 0),
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
              <FiCreditCard className="w-4 h-4" />
            </div>

            <div>
              <h3 className="text-xs font-bold text-gray-800">
                الربط المحاسبي للوكيل
              </h3>

              <p className="text-[11px] sm:text-xs text-gray-600 leading-6 mt-1">
                عند إضافة وكيل يمكنك تحديد نوع الحساب ثم اختيار حساب الأب من
                الحسابات التي تنتمي إلى نفس النوع. يقوم النظام تلقائيًا بإنشاء
                الحساب الخاص بالوكيل تحت الحساب الأب المختار.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ==================================================
          Add / Edit Agent Modal
      ================================================== */}

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />

          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] overflow-y-auto">
            {/* Header */}

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-800">
                  {editingId ? "تعديل بيانات الوكيل" : "إضافة وكيل جديد"}
                </h2>

                <p className="text-[11px] text-gray-400 mt-1">
                  تحديد الحساب الأب يتم حسب نوع الحساب
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

            {/* Form */}

            <div className="p-5 space-y-4">
              {/* اسم الوكيل */}

              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  اسم الوكيل
                  <span className="text-red-500 mr-1">*</span>
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
                  placeholder="مثال: محمد أحمد"
                  autoFocus
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-800 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                />
              </div>

              {/* الهاتف + العنوان */}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-600 mb-2">
                    رقم الهاتف
                  </label>

                  <div className="relative">
                    <FiPhone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          phone: e.target.value,
                        })
                      }
                      placeholder="مثال: 734 434 443"
                      dir="ltr"
                      className="w-full pr-9 pl-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-800 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-600 mb-2">
                    العنوان
                  </label>

                  <div className="relative">
                    <FiMapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          address: e.target.value,
                        })
                      }
                      placeholder="مثال: صنعاء"
                      className="w-full pr-9 pl-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-800 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                    />
                  </div>
                </div>
              </div>

              {/* ==================================================
                  نوع الحساب
              ================================================== */}

              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  نوع الحساب
                  <span className="text-red-500 mr-1">*</span>
                </label>

                <select
                  value={form.accountType}
                  onChange={(e) =>
                    handleAccountTypeChange(e.target.value as AccountType)
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-800 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                >
                  {accountTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* ==================================================
                  حساب الأب
              ================================================== */}

              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  حساب الأب
                  <span className="text-red-500 mr-1">*</span>
                </label>

                <select
                  value={form.accountParent}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      accountParent: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-800 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                >
                  <option value="">اختر حساب الأب</option>

                  {parentAccounts.map((account) => (
                    <option key={account.id} value={account.code}>
                      {account.code} - {account.name}{" "}
                      {account.level === 0 ? "(رئيسي)" : ""}
                    </option>
                  ))}
                </select>

                <p className="text-[10px] text-gray-400 mt-1.5">
                  تظهر هنا فقط الحسابات التي تنتمي إلى نوع الحساب المختار.
                </p>

                {parentAccounts.length === 0 && (
                  <div className="mt-2 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                    <p className="text-[10px] text-red-600">
                      لا توجد حسابات أب من نوع{" "}
                      {getAccountTypeLabel(form.accountType)}. قم أولًا بإضافة
                      حساب أب من صفحة الحسابات.
                    </p>
                  </div>
                )}
              </div>

              {/* ==================================================
                  الرصيد الافتتاحي
              ================================================== */}

              <div>
                <label className="block text-xs text-gray-600 mb-2">
                  الرصيد الافتتاحي
                </label>

                <div className="relative">
                  <input
                    type="number"
                    value={form.balance}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        balance: e.target.value,
                      })
                    }
                    placeholder="0"
                    step="0.01"
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-800 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
                  />

                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    ريال
                  </span>
                </div>

                <p className="text-[10px] text-gray-400 mt-1">
                  يترك صفرًا إذا لم يكن للوكيل رصيد افتتاحي.
                </p>
              </div>

              {/* ==================================================
                  معاينة الحساب
              ================================================== */}

              <div className="rounded-lg bg-blue-50 border border-blue-100 px-3 py-3">
                <div className="flex items-start gap-2">
                  <FiCreditCard className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />

                  <div>
                    <p className="text-[11px] font-bold text-blue-800">
                      معاينة الربط المحاسبي
                    </p>

                    <div className="mt-2 space-y-1 text-[10px] text-blue-700">
                      <p>
                        نوع الحساب:{" "}
                        <b>{getAccountTypeLabel(form.accountType)}</b>
                      </p>

                      <p>
                        حساب الأب:{" "}
                        <b>
                          {form.accountParent
                            ? (() => {
                                const parent = accounts.find(
                                  (account) =>
                                    account.code === form.accountParent,
                                );

                                return parent
                                  ? `${parent.code} - ${parent.name}`
                                  : "غير موجود";
                              })()
                            : "لم يتم الاختيار"}
                        </b>
                      </p>

                      <p>
                        الحساب الجديد: <b>سيتم توليده تلقائيًا</b>
                      </p>
                    </div>
                  </div>
                </div>
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
                onClick={handleSaveAgent}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-medium transition"
              >
                <FiSave className="w-4 h-4" />

                {editingId ? "حفظ التعديلات" : "حفظ الوكيل"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          View Agent Modal
      ================================================== */}

      {viewAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setViewAgent(null)}
          />

          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-bold text-gray-800">
                  تفاصيل الوكيل
                </h2>

                <p className="text-[11px] text-gray-400 mt-1">
                  بيانات الوكيل والحساب المرتبط به
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewAgent(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-1">
              <ViewRow label="اسم الوكيل" value={viewAgent.name} />

              <ViewRow
                label="رقم الهاتف"
                value={viewAgent.phone || "لا يوجد"}
              />

              <ViewRow label="العنوان" value={viewAgent.address || "لا يوجد"} />

              <ViewRow
                label="الحساب المحاسبي"
                value={
                  viewAgent.accountCode
                    ? `${viewAgent.accountCode} - ${
                        viewAgent.accountName || viewAgent.name
                      }`
                    : "غير مرتبط"
                }
              />

              {viewAgent.accountCode && (
                <>
                  {(() => {
                    const account = accounts.find(
                      (item) => item.code === viewAgent.accountCode,
                    );

                    const parent = accounts.find(
                      (item) => item.code === account?.parent,
                    );

                    return (
                      <>
                        <ViewRow
                          label="نوع الحساب"
                          value={
                            account
                              ? getAccountTypeLabel(account.type)
                              : "غير معروف"
                          }
                        />

                        <ViewRow
                          label="حساب الأب"
                          value={
                            parent
                              ? `${parent.code} - ${parent.name}`
                              : "غير موجود"
                          }
                        />
                      </>
                    );
                  })()}
                </>
              )}

              <ViewRow
                label="الرصيد"
                value={formatMoney(Math.abs(getAgentBalance(viewAgent)))}
              />

              <ViewRow
                label="طبيعة الرصيد"
                value={getBalanceType(viewAgent) || "لا يوجد"}
              />
            </div>

            <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setViewAgent(null)}
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

      <div className="hidden print:block agents-print">
        <div className="text-center mb-5">
          <h1 className="text-xl font-bold">شركة الجابري</h1>

          <p className="text-sm">للعسل والزيوت الطبيعة وخدمات العمرة</p>

          <p className="text-xs text-gray-500">البيضاء - اليمن</p>

          <p className="text-xs text-gray-500 mt-1">
            هاتف: <bdi dir="ltr">734 434 443</bdi>
          </p>

          <h2 className="text-lg font-bold mt-5">كشف الوكلاء</h2>
        </div>

        <table className="w-full border-collapse border border-gray-400 text-sm">
          <thead>
            <tr>
              <th className="border border-gray-400 p-2">الوكيل</th>

              <th className="border border-gray-400 p-2">الهاتف</th>

              <th className="border border-gray-400 p-2">العنوان</th>

              <th className="border border-gray-400 p-2">الحساب</th>

              <th className="border border-gray-400 p-2">حساب الأب</th>

              <th className="border border-gray-400 p-2">الرصيد</th>

              <th className="border border-gray-400 p-2">الطبيعة</th>
            </tr>
          </thead>

          <tbody>
            {filteredAgents.map((agent) => {
              const account = accounts.find(
                (item) => item.code === agent.accountCode,
              );

              const parent = accounts.find(
                (item) => item.code === account?.parent,
              );

              return (
                <tr key={agent.id}>
                  <td className="border border-gray-400 p-2">{agent.name}</td>

                  <td className="border border-gray-400 p-2">
                    {agent.phone || "—"}
                  </td>

                  <td className="border border-gray-400 p-2">
                    {agent.address || "—"}
                  </td>

                  <td className="border border-gray-400 p-2">
                    {agent.accountCode || "—"}
                  </td>

                  <td className="border border-gray-400 p-2">
                    {parent ? `${parent.code} - ${parent.name}` : "—"}
                  </td>

                  <td className="border border-gray-400 p-2">
                    {formatMoney(Math.abs(getAgentBalance(agent)))}
                  </td>

                  <td className="border border-gray-400 p-2">
                    {getBalanceType(agent) || "—"}
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

          .agents-print,
          .agents-print * {
            visibility: visible;
          }

          .agents-print {
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
