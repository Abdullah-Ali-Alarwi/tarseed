"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

import {
  FiUsers,
  FiShield,
  FiBriefcase,
  FiActivity,
  FiUserPlus,
} from "react-icons/fi";

const userLinks = [
  {
    name: "الرئيسية",
    href: "/erp/users",
    icon: FiUsers,
  },
  {
    name: "قائمة المستخدمين",
    href: "/erp/users/list",
    icon: FiUsers,
  },
  {
    name: "إضافة مستخدم",
    href: "/erp/users/create",
    icon: FiUserPlus,
  },
  {
    name: "الصلاحيات",
    href: "/erp/users/permissions",
    icon: FiShield,
  },
  {
    name: "المجموعات الوظيفية",
    href: "/erp/users/roles",
    icon: FiBriefcase,
  },
  {
    name: "سجل النشاطات",
    href: "/erp/users/activity",
    icon: FiActivity,
  },
];

export default function UsersLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/erp/users") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <div className="space-y-1" dir="rtl">
      {/* Users Navigation */}
      <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {userLinks.map((link) => {
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
