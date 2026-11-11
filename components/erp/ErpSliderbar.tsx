"use client";

import icon from "@/public/navicon2.png";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import "../nav.css";

import {
  FiHome,
  FiShoppingCart,
  FiShoppingBag,
  FiUsers,
  FiTruck,
  FiDollarSign,
  FiFileText,
  FiBriefcase,
  FiSettings,
  FiUser,
  FiClock,
  FiLogOut,
} from "react-icons/fi";

export default function Sidebar() {
  const pathname = usePathname();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");

  // قراءة بيانات المستخدم من Cookies
  useEffect(() => {
    const cookies = Object.fromEntries(
      document.cookie
        .split("; ")
        .filter(Boolean)
        .map((item) => {
          const [key, ...value] = item.split("=");
          return [key, value.join("=")];
        }),
    );

    setRole(cookies.role || "");

    try {
      setUserName(decodeURIComponent(cookies.username || ""));
    } catch {
      setUserName(cookies.username || "");
    }
  }, []);

  // تحديث الساعة
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // تسجيل الخروج
  const logout = () => {
    ["token", "type", "username", "role"].forEach((key) => {
      document.cookie = `${key}=; path=/; max-age=0`;
    });

    localStorage.removeItem("erp-sidebar-open-menu");

    window.location.href = "/login";
  };

  // الأقسام الرئيسية
  const menus = [
    {
      title: "الرئيسية",
      url: "/erp",
      icon: FiHome,
    },

    {
      title: "المشتريات",
      url: "/erp/purchases",
      icon: FiShoppingBag,
    },

    {
      title: "المبيعات",
      url: "/erp/sales",
      icon: FiShoppingCart,
    },

    {
      title: "المخزون",
      url: "/erp/inventory",
      icon: FiBriefcase,
    },

    {
      title: "المستخدمون",
      url: "/erp/users",
      icon: FiUsers,
    },

    {
      title: "المحاسبة",
      url: "/erp/accounting",
      icon: FiDollarSign,
    },

    {
      title: "التقارير",
      url: "/erp/reports",
      icon: FiFileText,
    },

    {
      title: "الإعدادات",
      url: "/erp/tools",
      icon: FiSettings,
    },
  ];

  // إظهار جميع الأقسام للمالك فقط
  const visibleMenus =
    role.toLowerCase() === "owner"
      ? menus
      : menus.filter((menu) => menu.title === "المشتريات");

  // تحديد الرابط النشط
  const isLinkActive = (url: string) => {
    if (url === "/erp") {
      return pathname === "/erp" || pathname === "/erp/dashboard";
    }

    return pathname === url || pathname.startsWith(`${url}/`);
  };

  // التاريخ والوقت
  const date = currentTime.toLocaleDateString("ar-YE");

  const time = currentTime.toLocaleTimeString("ar-YE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <aside
      className="fixed top-0 right-0 flex h-screen w-64 flex-col overflow-hidden bg-[#0E1F33] p-4 text-white"
      dir="rtl"
    >
      {/* Logo */}
      <div className="mb-8 flex shrink-0 items-center justify-center">
        <Image src={icon} alt="Logo" width={60} height={60} />
      </div>

      {/* Main Navigation */}
      <nav className="hide-scrollbar flex flex-1 flex-col gap-1 overflow-y-auto">
        {visibleMenus.map((menu) => {
          const Icon = menu.icon;
          const active = isLinkActive(menu.url);

          return (
            <Link
              href={menu.url}
              key={menu.url}
              className={`
                flex w-full items-center gap-3
                rounded-lg p-3
                text-right text-xs
                transition-all duration-200
                ${
                  active
                    ? "bg-[#203850] font-bold text-white shadow-sm"
                    : "text-gray-300 hover:bg-[#203850] hover:text-white"
                }
              `}
            >
              <Icon size={19} />

              <span className="flex-1">{menu.title}</span>
            </Link>
          );
        })}

        {/* Logout */}
        <button
          type="button"
          onClick={logout}
          title="تسجيل الخروج"
          className="mt-3 flex shrink-0 items-center justify-between rounded-lg p-2 px-3 text-red-400 transition-colors hover:bg-red-500 hover:text-white"
        >
          تسجيل الخروج
          <FiLogOut size={17} />
        </button>
      </nav>

      {/* User Information */}
      <div className="mt-3 shrink-0 border-t border-[#36536F] pt-3">
        <div className="flex items-center justify-between gap-2 text-gray-300">
          <div className="flex min-w-0 items-center gap-1">
            <FiUser size={14} className="shrink-0" />

            <span className="truncate text-[12px]">{userName}</span>
          </div>

          <span className="whitespace-nowrap text-[12px]">{date}</span>

          <div className="flex shrink-0 items-center gap-1">
            <FiClock size={12} />

            <span className="text-[12px]" dir="ltr">
              {time}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
