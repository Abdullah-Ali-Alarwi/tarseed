"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import {
  FiHome,
  FiShoppingBag,
  FiFileText,
  FiTruck,
  FiDollarSign,
  FiClipboard,
  FiRotateCcw,
} from "react-icons/fi";

const purchaseLinks = [
  {
    name: "الرئيسية",
    href: "/erp/purchases",
    icon: FiHome,
  },
  {
    name: "فواتير المشتريات",
    href: "/erp/purchases/invoices",
    icon: FiShoppingBag,
  },
  {
    name: "قائمة المشتريات",
    href: "/erp/purchases/list",
    icon: FiClipboard,
  },
  {
    name: "الموردون",
    href: "/erp/suppliers",
    icon: FiTruck,
  },
  {
    name: "سداد الموردين",
    href: "/erp/purchases/payments",
    icon: FiDollarSign,
  },
  {
    name: "مرتجعات المشتريات",
    href: "/erp/purchases/returns",
    icon: FiRotateCcw,
  },
];

export default function PurchasesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/erp/purchases") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="space-y-1" dir="rtl">
      {/* Purchases Navigation */}
      <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {purchaseLinks.map((link) => {
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
