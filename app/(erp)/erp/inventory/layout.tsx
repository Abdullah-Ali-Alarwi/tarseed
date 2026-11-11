"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import {
  FiHome,
  FiPackage,
  FiRepeat,
  FiActivity,
  FiSettings,
  FiLayers,
} from "react-icons/fi";

const inventoryLinks = [
  {
    name: "الرئيسية",
    href: "/erp/inventory",
    icon: FiHome,
  },
  {
    name: "المستودعات",
    href: "/erp/inventory/warehouses",
    icon: FiPackage,
  },
  {
    name: "التحويلات",
    href: "/erp/inventory/transfers",
    icon: FiRepeat,
  },
  {
    name: "حركات المخزون",
    href: "/erp/inventory/movements",
    icon: FiActivity,
  },
  {
    name: "الأرصدة الافتتاحية",
    href: "/erp/inventory/openingEntries",
    icon: FiLayers,
  },
  {
    name: "إعدادات المخزون",
    href: "/erp/inventory/inventorySetting",
    icon: FiSettings,
  },
];

export default function InventoryLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/erp/inventory") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="space-y-0.5" dir="rtl">
      {/* Inventory Navigation */}
      <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {inventoryLinks.map((link) => {
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
