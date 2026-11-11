"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import {
  FiHome,
  FiFileText,
  FiShoppingCart,
  FiUsers,
  FiDollarSign,
  FiClipboard,
} from "react-icons/fi";

const salesLinks = [
  {
    name: "الرئيسية",
    href: "/erp/sales",
    icon: FiHome,
  },
  {
    name: "عروض الأسعار",
    href: "/erp/sales/quotations",
    icon: FiFileText,
  },
  {
    name: "فواتير المبيعات",
    href: "/erp/sales/invoices",
    icon: FiShoppingCart,
  },
  {
    name: "قائمة المبيعات",
    href: "/erp/sales/list",
    icon: FiClipboard,
  },
  {
    name: "العملاء",
    href: "/erp/customers",
    icon: FiUsers,
  },
  {
    name: "سداد العملاء",
    href: "/erp/sales/payments",
    icon: FiDollarSign,
  },
];

export default function SalesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/erp/sales") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="space-y-1" dir="rtl">
      {/* Sales Navigation */}
      <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {salesLinks.map((link) => {
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
      <div>{children}</div>
    </div>
  );
}
