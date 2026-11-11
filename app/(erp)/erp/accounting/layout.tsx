"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import {
  FiHome,
  FiBookOpen,
  FiList,
  FiPlusCircle,
  FiGitBranch,
  FiFileText,
  FiRepeat,
  FiDollarSign,
  FiTrendingUp,
} from "react-icons/fi";

const accountingLinks = [
  {
    name: "الرئيسية",
    href: "/erp/accounting",
    icon: FiHome,
  },
  {
    name: "دليل الحسابات",
    href: "/erp/accounting/accounts",
    icon: FiBookOpen,
  },
  {
    name: "إضافة حساب",
    href: "/erp/accounting/accounts/create",
    icon: FiPlusCircle,
  },
  {
    name: "شجرة الحسابات",
    href: "/erp/accounting/accounts/tree",
    icon: FiGitBranch,
  },
  {
    name: "الأرصدة الافتتاحية",
    href: "/erp/accounting/opening-entries",
    icon: FiDollarSign,
  },
  {
    name: "إضافة أرصدة افتتاحية",
    href: "/erp/accounting/opening-entries/create",
    icon: FiPlusCircle,
  },
  {
    name: "القيود اليومية",
    href: "/erp/accounting/journals",
    icon: FiFileText,
  },
  {
    name: "دفتر الأستاذ العام",
    href: "/erp/accounting/ledger",
    icon: FiList,
  },
];

export default function AccountingLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/erp/accounting") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="space-y-1" dir="rtl">
      {/* Accounting Navigation */}
      <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {accountingLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`
                  flex shrink-0 items-center gap-1.5
                  rounded-lg px-3 py-2
                  text-[12px] font-medium
                  transition-all duration-200
                  ${
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                  }
                `}
              >
                <Icon size={15} strokeWidth={1.8} />

                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page Content */}
      <div className="m-5">{children}</div>
    </div>
  );
}
