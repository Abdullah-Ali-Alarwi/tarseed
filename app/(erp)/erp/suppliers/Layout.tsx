"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import {
  FiHome,
  FiUsers,
  FiUserPlus,
  FiFileText,
  FiDollarSign,
  FiBarChart2,
} from "react-icons/fi";

const supplierLinks = [
  {
    name: "الرئيسية",
    href: "/erp/suppliers",
    icon: FiHome,
  },
  {
    name: "إضافة مورد",
    href: "/erp/suppliers/new",
    icon: FiUserPlus,
  },
  {
    name: "أرصدة الموردين",
    href: "/erp/suppliers/balances",
    icon: FiDollarSign,
  },
  {
    name: "كشف حساب مورد",
    href: "/erp/suppliers/statements",
    icon: FiFileText,
  },
  {
    name: "تقارير الموردين",
    href: "/erp/suppliers/reports",
    icon: FiBarChart2,
  },
];

export default function SuppliersLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/erp/suppliers") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="space-y-1" dir="rtl">
      {/* Suppliers Navigation */}
      <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {supplierLinks.map((link) => {
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
