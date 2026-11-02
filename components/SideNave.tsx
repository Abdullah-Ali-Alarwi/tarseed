"use client";

import icon from "@/public/navicon2.png";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import "./nav.css";

import {
  FiHome,
  FiShoppingCart,
  FiShoppingBag,
  FiPackage,
  FiUsers,
  FiTruck,
  FiDollarSign,
  FiFileText,
  FiChevronDown,
  FiBriefcase,
  FiSettings,
  FiUser,
  FiClock,
} from "react-icons/fi";

export default function Sidebar() {
  const [open, setOpen] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  const pathname = usePathname();

  // تحديث الساعة
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const userName = "عبد الله العروي";

  const date = currentTime.toLocaleDateString("ar-YE");

  const time = currentTime.toLocaleTimeString("ar-YE", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const menus = [
    {
      title: "لوحة التحكم",
      icon: FiHome,
      links: [{ name: "الرئيسية", url: "/dashboard" }],
    },

    {
      title: "المبيعات",
      icon: FiShoppingCart,
      links: [
        { name: "عروض الأسعار", url: "/sales/quotations" },
        { name: "فواتير المبيعات", url: "/sales/invoices" },
        { name: "العملاء", url: "/customers" },
        { name: "قائمة المبيعات", url: "/sales/list" },
        { name: "سداد العملاء", url: "/sales/payments" },
      ],
    },

    {
      title: "المشتريات",
      icon: FiShoppingBag,
      links: [
        { name: "الموردون", url: "/suppliers" },
        { name: "أوامر الشراء", url: "/purchases/orders" },
        { name: "فواتير المشتريات", url: "/purchases/invoices" },
        { name: "سداد الموردين", url: "/purchases/payments" },
        { name: "فاتورة بسيطة", url: "/purchases/simple-invoice" },
      ],
    },

    {
      title: "المنتجات",
      icon: FiPackage,
      links: [
        { name: "قائمة المنتجات", url: "/products" },
        { name: "التكاليف", url: "/products/costs" },
        { name: "المواقع", url: "/products/locations" },
        { name: "أوامر التصنيع", url: "/products/manufacturing" },
      ],
    },

    {
      title: "المخزون",
      icon: FiBriefcase,
      links: [
        { name: "الأصناف", url: "/inventory/items" },
        { name: "المستودعات", url: "/inventory/warehouses" },
        { name: "حركة المخزون", url: "/inventory/movements" },
      ],
    },

    {
      title: "الأصول",
      icon: FiBriefcase,
      links: [
        { name: "قائمة الأصول", url: "/assets" },
        { name: "إضافة أصل", url: "/assets/add" },
        { name: "إهلاك الأصول", url: "/assets/depreciation" },
      ],
    },

    {
      title: "المستخدمون",
      icon: FiUsers,
      links: [
        { name: "قائمة المستخدمين", url: "/users" },
        { name: "الصلاحيات", url: "/users/permissions" },
      ],
    },

    {
      title: "المحاسبة",
      icon: FiDollarSign,
      links: [
        { name: "دليل الحسابات", url: "/accounting/accounts" },
        { name: "القيود اليومية", url: "/accounting/journals" },
        { name: "القيود الافتتاحية", url: "/accounting/opening-entries" },
      ],
    },

    {
      title: "التقارير",
      icon: FiFileText,
      links: [
        { name: "ميزان المراجعة", url: "/reports/trial-balance" },
        { name: "قائمة الدخل", url: "/reports/income-statement" },
        { name: "الميزانية العمومية", url: "/reports/balance-sheet" },
      ],
    },

    {
      title: "النقل والشحن",
      icon: FiTruck,
      links: [{ name: "عمليات النقل", url: "/transport" }],
    },

    {
      title: "الإعدادات",
      icon: FiSettings,
      links: [{ name: "الأدوات العامة", url: "/tools" }],
    },
  ];

  return (
    <aside
      className="fixed top-0 right-0 w-64 h-screen
      bg-[#0E1F33] text-white p-4
      flex flex-col overflow-hidden"
      dir="rtl"
    >
      {/* Logo */}

      <div className="flex items-center justify-center mb-8 shrink-0">
        <Image src={icon} alt="Logo" width={60} height={60} />
      </div>

      {/* Navigation */}

      <nav className="flex-1 overflow-y-auto hide-scrollbar flex flex-col gap-1">
        {menus.map((menu) => {
          const Icon = menu.icon;
          const isOpen = open === menu.title;

          return (
            <div key={menu.title}>
              {/* Main Button */}

              <button
                onClick={() => setOpen(isOpen ? "" : menu.title)}
                className="flex items-center gap-3 w-full p-3
                rounded-lg hover:bg-[#203850]
                transition-colors text-right"
              >
                <Icon size={20} />

                <span className="flex-1 text-xs">{menu.title}</span>

                <FiChevronDown
                  className={`transition-transform duration-200
                  ${isOpen ? "rotate-180" : ""}`}
                />
              </button>

              {/* Submenu */}

              {isOpen && (
                <div
                  className="flex flex-col gap-1 mr-4 pr-4
                  border-r-2 border-[#36536F] my-2"
                >
                  {menu.links.map((link) => (
                    <Link
                      href={link.url}
                      key={link.url}
                      className={`p-3 text-xs rounded-md
                      transition-colors ${
                        pathname === link.url
                          ? "bg-white text-amber-950 font-bold"
                          : "text-gray-300 hover:bg-[#203850] hover:text-white"
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User Information - One Line */}

      <div className="shrink-0 border-t border-[#36536F] pt-3 mt-3">
        <div className="flex items-center justify-between gap-2 text-gray-300">
          <div className="flex items-center gap-1 min-w-0">
            <FiUser size={14} className="shrink-0" />

            <span className="text-[10px] truncate">{userName}</span>
          </div>

          <span className="text-[10px] whitespace-nowrap">{date}</span>

          <div className="flex items-center gap-1 shrink-0">
            <FiClock size={12} />

            <span className="text-[10px]" dir="ltr">
              {time}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}
