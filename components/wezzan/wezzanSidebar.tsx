"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

import {
  FiHome,
  FiUsers,
  FiSettings,
  FiUser,
  FiBriefcase,
  FiX,
  FiLogOut,
} from "react-icons/fi";

import { TbIcons } from "react-icons/tb";

const menuItems = [
  { title: "لوحة التحكم", href: "/wezzan/dashboard", icon: FiHome },
  { title: "الشركات", href: "/wezzan/companies", icon: FiBriefcase },
  { title: "المستخدمون", href: "/wezzan/platform-users", icon: FiUsers },
  { title: "الإعدادات", href: "/wezzan/settings", icon: FiSettings },
  { title: "الملف الشخصي", href: "/wezzan/profile", icon: FiUser },
  { title: " Erp System", href: "/erp", icon: TbIcons },
];

const logout = () => {
  document.cookie = "token=; path=/; max-age=0";
  document.cookie = "type=; path=/; max-age=0";
  document.cookie = "username=; path=/; max-age=0";

  window.location.href = "/login";
};

export default function WezzanSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* خلفية القائمة في الهاتف */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        />
      )}

      {/* القائمة الجانبية */}
      <aside
        dir="rtl"
        className={`
          fixed top-0 right-0 z-50
          w-64 h-screen
          bg-slate-900 text-white p-5
          flex flex-col
          transition-transform duration-300
          ${isOpen ? "translate-x-0" : "translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* الشعار */}
        <div className="flex items-center justify-between mb-10 shrink-0">
          <h1 className="text-2xl font-bold tracking-widest">WEZZAN</h1>

          <button
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 hover:bg-slate-700 rounded-lg"
            aria-label="إغلاق القائمة"
          >
            <FiX size={22} />
          </button>
        </div>

        {/* عناصر القائمة */}
        <nav className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-2">
          {menuItems.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`
                  flex items-center gap-3 p-3 rounded-lg transition
                  ${
                    active
                      ? "bg-blue-600 text-white"
                      : "hover:bg-slate-700 text-slate-300"
                  }
                `}
              >
                <Icon size={20} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>

        {/* تسجيل الخروج */}
        <button
          onClick={logout}
          className="
            p-3 rounded-lg text-red-400
            hover:bg-red-500 hover:text-white
            transition-colors flex items-center justify-between
            w-full mt-3 shrink-0
          "
        >
          <span className="text-sm">تسجيل الخروج</span>
          <FiLogOut size={17} />
        </button>

        {/* معلومات المستخدم */}
        <div className="shrink-0 border-t border-slate-700 pt-3 mt-3">
          <div className="flex items-center gap-3">
            <div className="bg-slate-700 p-2 rounded-full">
              <FiUser size={20} />
            </div>

            <div>
              <p className="text-sm font-semibold">مدير WEZZAN</p>

              <p className="text-xs text-slate-400">مدير النظام</p>
            </div>
          </div>
        </div>
      </aside>

      {/* زر القائمة في الهاتف */}
      <button
        onClick={() => setIsOpen(true)}
        className="
          fixed top-3 right-4 z-30
          lg:hidden
          bg-slate-900 text-white
          p-2.5 rounded-lg shadow
        "
        aria-label="فتح القائمة"
      >
        <FiUsers size={22} />
      </button>
    </>
  );
}
