"use client";

import { useMemo } from "react";

import {
  FiLayers,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiCreditCard,
  FiPackage,
} from "react-icons/fi";

import { Account } from "../types";
import { formatMoney } from "../utils";

interface Props {
  accounts: Account[];
  inventoryValue?: number;
}

export default function AccountsStats({ accounts, inventoryValue = 0 }: Props) {
  const stats = useMemo(() => {
    const activeAccounts = accounts.filter((account) => account.isActive);

    // الحسابات النهائية فقط
    const postingAccounts = activeAccounts.filter(
      (account) => !account.isGroup && account.allowPosting,
    );

    // حسابات الأصول النهائية باستثناء حساب المخزون
    const otherAssetBalances = postingAccounts
      .filter(
        (account) =>
          account.type === "asset" && String(account.code) !== "1104",
      )
      .reduce((total, account) => total + Number(account.balance || 0), 0);

    // إجمالي الأصول مع إضافة قيمة المخزون مرة واحدة
    const totalAssets = otherAssetBalances + Number(inventoryValue || 0);

    const liabilityCount = activeAccounts.filter(
      (account) => account.type === "liability",
    ).length;

    const equityCount = activeAccounts.filter(
      (account) => account.type === "equity",
    ).length;

    const revenueCount = activeAccounts.filter(
      (account) => account.type === "revenue",
    ).length;

    const expenseCount = activeAccounts.filter(
      (account) => account.type === "expense",
    ).length;

    return [
      {
        id: "total-accounts",
        title: "إجمالي الحسابات",
        value: accounts.length,
        icon: FiLayers,
        iconColor: "text-blue-600",
        iconBg: "bg-blue-50",
      },
      {
        id: "total-assets",
        title: "إجمالي الأصول",
        value: formatMoney(totalAssets),
        icon: FiTrendingUp,
        iconColor: "text-emerald-600",
        iconBg: "bg-emerald-50",
      },
      {
        id: "inventory-value",
        title: "قيمة المخزون",
        value: formatMoney(inventoryValue),
        icon: FiPackage,
        iconColor: "text-indigo-600",
        iconBg: "bg-indigo-50",
      },
      {
        id: "liabilities",
        title: "الالتزامات",
        value: liabilityCount,
        icon: FiCreditCard,
        iconColor: "text-orange-600",
        iconBg: "bg-orange-50",
      },
      {
        id: "equity",
        title: "حقوق الملكية",
        value: equityCount,
        icon: FiDollarSign,
        iconColor: "text-violet-600",
        iconBg: "bg-violet-50",
      },
      {
        id: "revenue-expenses",
        title: "الإيرادات والمصروفات",
        value: `${revenueCount} / ${expenseCount}`,
        icon: FiTrendingDown,
        iconColor: "text-rose-600",
        iconBg: "bg-rose-50",
      },
    ];
  }, [accounts, inventoryValue]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <div
            key={stat.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-500">
                  {stat.title}
                </p>

                <h3 className="mt-2 break-words text-xl font-bold text-slate-900">
                  {stat.value}
                </h3>
              </div>

              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${stat.iconBg}`}
              >
                <Icon className={`text-xl ${stat.iconColor}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
