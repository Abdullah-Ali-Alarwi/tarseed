"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import {
  FiActivity,
  FiBarChart2,
  FiBox,
  FiBriefcase,
  FiCreditCard,
  FiDollarSign,
  FiHome,
  FiMenu,
  FiPackage,
  FiPieChart,
  FiShoppingBag,
  FiTruck,
  FiUsers,
  FiX,
} from "react-icons/fi";

export default function TopNave() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  /* =====================================================
     روابط القائمة
  ===================================================== */
  const links = [
    {
      name: "الرئيسية",
      path: "/",
      icon: <FiHome />,
    },
    {
      name: "لوحة التحكم",
      path: "/dashboard",
      icon: <FiBarChart2 />,
    },
    {
      name: "المبيعات",
      path: "/sales",
      icon: <FiShoppingBag />,
    },
    {
      name: "المشتريات",
      path: "/purchases",
      icon: <FiTruck />,
    },
    {
      name: "المخزون",
      path: "/inventory",
      icon: <FiPackage />,
    },
    {
      name: "العملاء",
      path: "/customers",
      icon: <FiUsers />,
    },
    {
      name: "الموردين",
      path: "/suppliers",
      icon: <FiBriefcase />,
    },
    {
      name: "المحاسبة",
      path: "/accounting",
      icon: <FiDollarSign />,
    },
    {
      name: "الحسابات",
      path: "/accounting/accounts",
      icon: <FiCreditCard />,
    },
    {
      name: "التقارير",
      path: "/reports",
      icon: <FiPieChart />,
    },
  ];

  /* =====================================================
     الرابط النشط
  ===================================================== */
  const isActive = (path: string) => {
    // الرئيسية
    if (path === "/") {
      return pathname === "/";
    }

    // الحسابات مستقلة عن المحاسبة
    if (path === "/accounting/accounts") {
      return pathname === "/accounting/accounts";
    }

    // المحاسبة تشمل الصفحات الداخلية
    // باستثناء صفحة الحسابات
    if (path === "/accounting") {
      return (
        pathname === "/accounting" ||
        (pathname.startsWith("/accounting/") &&
          pathname !== "/accounting/accounts")
      );
    }

    return pathname === path || pathname.startsWith(`${path}/`);
  };

  /* =====================================================
     إغلاق القائمة
  ===================================================== */
  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <>
      {/* =================================================
          الشريط العلوي للموبايل
      ================================================= */}
      <header
        className="
          fixed
          top-0
          left-0
          right-0
          z-50
          h-14
          bg-[#0E1F33]
          text-white
          shadow-lg
          lg:hidden
        "
      >
        <div className="flex h-full items-center justify-between px-4">
          {/* اسم النظام */}
          <div className="flex items-center gap-2">
            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-lg
                bg-white/10
              "
            >
              <FiActivity className="text-lg" />
            </div>

            <div className="text-sm font-bold">نظام الإدارة المحاسبية</div>
          </div>

          {/* زر القائمة */}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-lg
              bg-white/10
              text-xl
              transition
              hover:bg-white/20
            "
            aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
          >
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </header>

      {/* =================================================
          الخلفية عند فتح القائمة
      ================================================= */}
      <div
        onClick={closeMenu}
        className={`
          fixed
          inset-0
          z-40
          bg-black/40
          transition-opacity
          duration-300
          lg:hidden

          ${
            menuOpen
              ? "visible opacity-100"
              : "invisible pointer-events-none opacity-0"
          }
        `}
      />

      {/* =================================================
          القائمة المنسدلة من الأعلى
      ================================================= */}
      <aside
        className={`
          fixed
          top-14
          left-0
          right-0
          z-50
          max-h-[calc(100vh-3.5rem)]
          overflow-y-auto
          bg-[#0E1F33]
          text-white
          shadow-2xl
          transition-all
          duration-300
          ease-in-out
          lg:hidden

          ${
            menuOpen
              ? "visible translate-y-0 opacity-100"
              : "invisible -translate-y-[110%] opacity-0"
          }
        `}
      >
        <div className="p-4">
          {/* =================================================
              القائمة

              الشاشات العادية:
              Flex + التفاف

              الشاشات الصغيرة جدًا:
              تتحول إلى عمود
          ================================================= */}
          <nav
            className="
              flex
              flex-wrap
              justify-center
              gap-3

              max-[420px]:flex-col
              max-[420px]:items-stretch
            "
          >
            {links.map((link) => {
              const active = isActive(link.path);

              return (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={closeMenu}
                  className={`
                    flex
                    min-h-[72px]
                    min-w-[120px]
                    flex-1
                    basis-[140px]
                    flex-col
                    items-center
                    justify-center
                    gap-2
                    rounded-xl
                    border
                    px-3
                    py-3
                    text-center
                    transition-all
                    duration-200

                    max-[420px]:min-h-[58px]
                    max-[420px]:w-full
                    max-[420px]:min-w-0
                    max-[420px]:flex-row
                    max-[420px]:justify-start
                    max-[420px]:px-5

                    ${
                      active
                        ? "border-white/30 bg-white text-[#0E1F33] shadow-md"
                        : "border-white/10 bg-white/5 text-white hover:bg-white/10"
                    }
                  `}
                >
                  {/* الأيقونة */}
                  <span
                    className={`
                      flex
                      h-9
                      w-9
                      shrink-0
                      items-center
                      justify-center
                      rounded-lg
                      text-xl

                      ${
                        active
                          ? "bg-[#0E1F33] text-white"
                          : "bg-white/10 text-white"
                      }
                    `}
                  >
                    {link.icon}
                  </span>

                  {/* اسم الرابط */}
                  <span className="text-sm font-semibold">{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* =================================================
              معلومات الشركة
          ================================================= */}
          <div className="mt-5 border-t border-white/10 pt-4">
            <div className="rounded-xl bg-white/5 p-4 text-center">
              <div className="text-sm font-bold">شركة الجابري</div>

              <div className="mt-1 text-xs text-white/70">
                للعسل والزيوت الطبيعة وخدمات العمرة
              </div>

              <div className="mt-1 text-xs text-white/60">البيضاء - اليمن</div>

              <div className="mt-1 text-xs text-white/50">البيضاء - اليمن</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
