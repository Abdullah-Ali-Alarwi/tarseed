"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import {
  FiSettings,
  FiHome,
  FiBriefcase,
  FiGitBranch,
  FiCalendar,
  FiPercent,
  FiDollarSign,
  FiFileText,
  FiDatabase,
  FiShield,
  FiActivity,
  FiSliders,
  FiClock,
  FiGlobe,
} from "react-icons/fi";

const toolsLinks = [
  {
    name: "الرئيسية",
    href: "/erp/tools",
    icon: FiHome,
  },
  {
    name: "بيانات الشركة",
    href: "/erp/tools/company",
    icon: FiBriefcase,
  },
  {
    name: "الفروع",
    href: "/erp/tools/branches",
    icon: FiGitBranch,
  },
  {
    name: "اللغة والمنطقة",
    href: "/erp/tools/locale",
    icon: FiGlobe,
  },
  {
    name: "السنة المالية",
    href: "/erp/tools/fiscal-years",
    icon: FiCalendar,
  },
  {
    name: "الضرائب",
    href: "/erp/tools/taxes",
    icon: FiPercent,
  },
  {
    name: "العملات",
    href: "/erp/tools/currencies",
    icon: FiDollarSign,
  },
  {
    name: "الفواتير",
    href: "/erp/tools/invoices",
    icon: FiFileText,
  },
  {
    name: "إعدادات النظام",
    href: "/erp/tools/general",
    icon: FiSliders,
  },
  {
    name: "الوقت والتاريخ",
    href: "/erp/tools/date-time",
    icon: FiClock,
  },
  {
    name: "النسخ الاحتياطي",
    href: "/erp/tools/backup",
    icon: FiDatabase,
  },
  {
    name: "سجل النشاطات",
    href: "/erp/tools/activity",
    icon: FiActivity,
  },
  {
    name: "الأمان والحماية",
    href: "/erp/tools/security",
    icon: FiShield,
  },
];

export default function ToolsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/erp/tools") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div dir="rtl" className="space-y-1">
      {/* Tools Navigation */}
      <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {toolsLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-[12px] font-medium transition ${
                  active
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <Icon size={15} strokeWidth={1.8} />

                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Page Content */}
      <div className="min-w-0 m-5 mt-10">{children}</div>
    </div>
  );
}
