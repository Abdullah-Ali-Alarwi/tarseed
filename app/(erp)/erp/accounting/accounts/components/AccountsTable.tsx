"use client";

import { useMemo, useState } from "react";

import {
  FiChevronDown,
  FiChevronLeft,
  FiEdit,
  FiTrash2,
  FiPower,
  FiFolder,
  FiFileText,
} from "react-icons/fi";

import type { Account, AccountId } from "../types";

import {
  buildAccountTree,
  getAccountTypeName,
  getNatureName,
  hasChildren,
  formatMoney,
} from "../utils";

interface Props {
  accounts: Account[];
  onEdit: (account: Account) => void;
  onDelete: (id: AccountId) => void;
  onToggleStatus: (id: AccountId) => void;
}

const sameId = (
  a: AccountId | null | undefined,
  b: AccountId | null | undefined,
) => String(a ?? "") === String(b ?? "");

export default function AccountsTable({
  accounts,
  onEdit,
  onDelete,
  onToggleStatus,
}: Props) {
  const [expanded, setExpanded] = useState<AccountId[]>([]);
  const [showAll, setShowAll] = useState(true);

  const tree = useMemo(() => buildAccountTree(accounts), [accounts]);

  const toggleExpand = (id: AccountId) => {
    setExpanded((prev) =>
      prev.some((item) => sameId(item, id))
        ? prev.filter((item) => !sameId(item, id))
        : [...prev, id],
    );
  };

  const expandAll = () => {
    setExpanded(
      accounts
        .filter((account) => hasChildren(account.id, accounts))
        .map((account) => account.id),
    );

    setShowAll(false);
  };

  const collapseAll = () => {
    setExpanded([]);
    setShowAll(true);
  };

  const visibleAccounts = useMemo(() => {
    if (showAll) return tree;

    return tree.filter((account) => {
      let parentId = account.parentId;

      while (parentId !== null) {
        const isParentExpanded = expanded.some((id) => sameId(id, parentId));

        if (!isParentExpanded) return false;

        const parent = accounts.find((item) => sameId(item.id, parentId));

        parentId = parent?.parentId ?? null;
      }

      return true;
    });
  }, [tree, showAll, expanded, accounts]);

  const handleDelete = (account: Account) => {
    const confirmed = window.confirm(
      `هل أنت متأكد من حذف الحساب "${account.name}"؟`,
    );

    if (confirmed) onDelete(account.id);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 p-4">
        <div>
          <h2 className="font-bold text-slate-900">شجرة الحسابات</h2>

          <p className="mt-1 text-xs text-slate-500">
            الحسابات وأرصدتها المالية حسب مستوياتها المحاسبية
          </p>
        </div>

        <button
          type="button"
          onClick={showAll ? expandAll : collapseAll}
          className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
        >
          {showAll ? "توسيع جميع الحسابات" : "طي جميع الحسابات"}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-right text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="whitespace-nowrap p-4">رقم الحساب</th>
              <th className="whitespace-nowrap p-4">اسم الحساب</th>
              <th className="whitespace-nowrap p-4">نوع الحساب</th>
              <th className="whitespace-nowrap p-4">الطبيعة</th>
              <th className="whitespace-nowrap p-4">المستوى</th>
              <th className="whitespace-nowrap p-4">الرصيد</th>
              <th className="whitespace-nowrap p-4">الحالة</th>
              <th className="whitespace-nowrap p-4 text-center">الإجراءات</th>
            </tr>
          </thead>

          <tbody>
            {visibleAccounts.map((account) => {
              const children = hasChildren(account.id, accounts);

              const isExpanded = expanded.some((id) => sameId(id, account.id));

              const balance = Number(account.balance ?? 0);

              return (
                <tr
                  key={account.id}
                  className="border-t border-slate-100 transition hover:bg-blue-50/40"
                >
                  <td className="whitespace-nowrap p-4 font-semibold text-slate-700">
                    {account.code}
                  </td>

                  <td className="p-4">
                    <div
                      className="flex items-center gap-2"
                      style={{
                        paddingRight: `${Math.max(
                          0,
                          (account.level - 1) * 22,
                        )}px`,
                      }}
                    >
                      {children ? (
                        <button
                          type="button"
                          onClick={() => toggleExpand(account.id)}
                          aria-label={isExpanded ? "طي الحساب" : "توسيع الحساب"}
                          aria-expanded={isExpanded}
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-200"
                        >
                          {isExpanded ? (
                            <FiChevronDown size={17} />
                          ) : (
                            <FiChevronLeft size={17} />
                          )}
                        </button>
                      ) : (
                        <span className="w-6 shrink-0" />
                      )}

                      {account.isGroup ? (
                        <FiFolder
                          className="shrink-0 text-amber-500"
                          size={17}
                        />
                      ) : (
                        <FiFileText
                          className="shrink-0 text-blue-500"
                          size={17}
                        />
                      )}

                      <span
                        className={
                          account.isGroup
                            ? "whitespace-nowrap font-bold text-slate-900"
                            : "whitespace-nowrap font-medium text-slate-700"
                        }
                      >
                        {account.name}
                      </span>
                    </div>
                  </td>

                  <td className="whitespace-nowrap p-4 text-slate-600">
                    {getAccountTypeName(account.type)}
                  </td>

                  <td className="whitespace-nowrap p-4">
                    <span
                      className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                        account.nature === "debit"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-purple-50 text-purple-700"
                      }`}
                    >
                      {getNatureName(account.nature)}
                    </span>
                  </td>

                  <td className="whitespace-nowrap p-4 text-slate-600">
                    <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs">
                      {account.level}
                    </span>
                  </td>

                  <td className="whitespace-nowrap p-4">
                    <span
                      className={`font-bold ${
                        balance > 0
                          ? "text-emerald-700"
                          : balance < 0
                            ? "text-red-600"
                            : "text-slate-500"
                      }`}
                    >
                      {formatMoney(balance)}
                    </span>

                    {String(account.code) === "1104" && (
                      <span className="mr-2 rounded bg-emerald-50 px-2 py-1 text-[10px] text-emerald-700">
                        مخزون
                      </span>
                    )}
                  </td>

                  <td className="whitespace-nowrap p-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${
                        account.isActive !== false
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-red-50 text-red-700"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          account.isActive !== false
                            ? "bg-emerald-500"
                            : "bg-red-500"
                        }`}
                      />

                      {account.isActive !== false ? "نشط" : "موقوف"}
                    </span>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(account)}
                        title="تعديل الحساب"
                        aria-label={`تعديل الحساب ${account.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50"
                      >
                        <FiEdit size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onToggleStatus(account.id)}
                        title="تفعيل / إيقاف الحساب"
                        aria-label={`تغيير حالة الحساب ${account.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-amber-600 transition hover:bg-amber-50"
                      >
                        <FiPower size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(account)}
                        title="حذف الحساب"
                        aria-label={`حذف الحساب ${account.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-red-600 transition hover:bg-red-50"
                      >
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {visibleAccounts.length === 0 && (
              <tr>
                <td colSpan={8} className="p-12 text-center">
                  <FiFolder className="mx-auto mb-3 text-4xl text-slate-300" />

                  <p className="font-medium text-slate-600">
                    لا توجد حسابات حتى الآن
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    يمكنك إضافة حساب جديد للبدء في بناء شجرة الحسابات.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
        <p className="text-xs text-slate-500">
          عدد الحسابات المعروضة:{" "}
          <span className="font-semibold text-slate-700">
            {visibleAccounts.length}
          </span>
          <span className="mx-2">|</span>
          إجمالي الحسابات:{" "}
          <span className="font-semibold text-slate-700">
            {accounts.length}
          </span>
        </p>
      </div>
    </div>
  );
}
